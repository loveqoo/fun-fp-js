# Store

> 한국어: [../Store.md](../Store.md)

**A type that already knows the value at every position and only carries where it is looking — the dual of State**

## Concept

A Store is made of two things.

- **lookup** — a function `S -> A` from a position to a value
- **focus** — the position `S` currently being looked at

The arrows point the opposite way from State. State **takes** a state and **produces** a value
and a new state; Store **already knows** the value at every state and only carries which one it
is looking at. That is why State is a Monad and Store is a **Comonad**.

| | Function it takes | What it does |
| --- | --- | --- |
| `chain` (Monad) | `a -> M b` — builds a context from one value | stitches the built contexts together |
| `extend` (Comonad) | `W a -> b` — extracts one value from a whole context | extracts at every position and builds a new context |

## The doors

```javascript
import FunFP from 'fun-fp-js';
const { Store } = FunFP;

const w = new Store(x => x * 10, 3);   // lookup: times ten, focus: 3

console.log(w.extract());                       // 30   read the focused position
console.log(w.peek(7));                         // 70   read another position without moving focus
console.log(w.seek(5).extract());               // 50   a new Store with only the focus moved
console.log(w.experiment(i => [i - 1, i + 1])); // [ 20, 40 ]   read several positions at once
console.log(w.map(n => n + 1).extract());       // 31   compose after the lookup
```

`extend` is the heart of it. Give it a **local rule that sees only one position**, and you get
back **a new Store where every position has seen that rule.**

```javascript
const { Store } = FunFP;

const w = new Store(x => x * 10, 3);
// the rule: my value plus my right neighbour's. Takes one Store (a focused view), returns one value.
const rule = s => s.extract() + s.peek(s.index + 1);

const next = w.extend(rule);
console.log(next.extract());   // 70   at focus 3: 30 + 40
console.log(next.peek(0));     // 10   at position 0: 0 + 10
```

Three instances are registered under the `store` key: `Functor`, `Extend`, `Comonad`.

```javascript
const { Store, Comonad } = FunFP;
const w = new Store(x => x + 1, 0);
console.log(Comonad.lookup('store').extract(w) === w.extract());   // true
```

## Game of Life — a local rule becomes the whole board

The signature Store example. The rule knows **one cell and its neighbours** — no code anywhere
knows the whole board. One `extend` is one generation of the entire board.

```javascript
const { Store } = FunFP;

const W = 5, H = 5;
const key = ([x, y]) => `${x},${y}`;
const wrap = n => ((n % W) + W) % W;
const neighbours = ([x, y]) => {
    const out = [];
    for (const dx of [-1, 0, 1]) for (const dy of [-1, 0, 1])
        if (dx || dy) out.push([wrap(x + dx), wrap(y + dy)]);
    return out;
};

// the local rule: sees only its own cell and eight neighbours
const conway = grid => {
    const alive = grid.experiment(neighbours).filter(Boolean).length;
    return grid.extract() ? (alive === 2 || alive === 3) : alive === 3;
};

const glider = new Set([[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]].map(key));
const board = new Store(pos => glider.has(key(pos)), [0, 0]);

const next = Store.memo(board.extend(conway), key);   // one generation — for memo, see "Performance"

const show = grid => {
    const rows = [];
    for (let y = 0; y < H; y += 1) {
        let row = '';
        for (let x = 0; x < W; x += 1) row += grid.peek([x, y]) ? '#' : '.';
        rows.push(row);
    }
    return rows.join('\n');
};
console.log(show(next) === '.....\n#.#..\n.##..\n.#...\n.....');   // true   the glider moved down one cell
```

## Performance — wrap repeated `extend` in `memo`

`extend` computes nothing. **It only wraps the lookup in one more layer.** So when the rule
reads several positions, as in the Game of Life, across generations a single read becomes a
full recomputation of every previous generation — **the cost explodes exponentially.** A rule
that reads only one position stays linear and needs no memo.

```javascript no-run problem case — slows down exponentially with the generation count
let board = new Store(lookup, [0, 0]);
for (let g = 0; g < 20; g += 1) board = board.extend(conway);   // cannot run as-is
```

`Store.memo(store, keyOf)` returns a new Store with a cache spliced into the lookup.
**`keyOf` is required** — how a position becomes a cache key differs per position type, so the
library sets no default and delegates it to the caller. For numbers and strings the identity
(`s => s`) is enough — with one boundary: the cache's Map treats `+0` and `-0` as the same key,
so a lookup that distinguishes them needs a keyOf that does too. For object positions such as
coordinate arrays, supply a serializer.

```javascript
const { Store } = FunFP;

let calls = 0;
const m = Store.memo(new Store(x => { calls += 1; return x * 2; }, 0), s => s);
m.peek(5); m.peek(5); m.peek(5);
console.log(calls);   // 1   read three times, computed once

// object positions take a serializer — with identity, every fresh array misses the cache
const grid = Store.memo(new Store(([x, y]) => x + y, [0, 0]), ([x, y]) => x + ',' + y);
console.log(grid.peek([1, 2]));   // 3
```

**If two different positions get the same key, the later read receives the earlier value** —
keeping keys distinct is the responsibility of whoever supplies `keyOf`. Why there is no
default is covered in [internals](./internals.md#store-perf).

## Related type classes

- **[Comonad](./Comonad.md)** — the home of `extract`. Store is the fourth instance after
  `Identity`, `Array`, `NonEmptyList` — and the first that is not a container.
- **[State](./State.md)** — the dual. The side that **moves forward changing** the state.
- **[Reader](./Reader.md)** — a lookup function with no focus is a Reader. Pick up one focus
  and you have a Store.
