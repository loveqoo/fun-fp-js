# Transducer

> 한국어: [../Transducer.md](../Transducer.md)

A reducer transformer that **composes transformation logic only**, without building
intermediate arrays

## Concept

A Transducer is a **function that takes a reducer and returns a reducer**.

```
Transducer = Reducer -> Reducer
Reducer     = (acc, value) -> acc
```

If you rewrite `map` or `filter` not as "an operation on a collection" but as "an
operation on a reducer," you can assemble the transformation stages **independently of
any collection**. Once assembly is done, you traverse the data exactly once, via
`transduce`.

The transducer in fun-fp-js works on anything with a `Symbol.iterator` — arrays, Sets,
Maps, strings, and generators are all included.

## Why Transducer?

### Problem: chaining array methods allocates an array at every step

```javascript no-run 문제 상황 — 일부러 나쁜 코드
// every stage allocates a new array — a million elements means a million-sized intermediate array at each step
const result = hugeArray
    .map(x => x * 2)        // new array 1
    .filter(x => x > 10)    // new array 2
    .slice(0, 3);           // new array 3 — the cut only happens after both earlier stages finish entirely

// and there's no way to pull the transformation logic out for reuse
```

Even though `slice(0, 3)` is last, `map` and `filter` still process **every element**
before the cut happens.

### Solution: compose the transformations and traverse once

```javascript
const { transducer, compose } = FunFP;

const push = (acc, x) => [...acc, x];

// assembling just the transformation stages — no data yet
const xf = compose(
    transducer.map(x => x * 2),
    transducer.filter(x => x > 10),
    transducer.take(3)
);

// now it traverses once. No intermediate array, and it stops immediately at take(3).
console.log(transducer.transduce(xf, push, [], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
// [12, 14, 16]
```

The moment `take(3)` is satisfied, traversal **stops** — the remaining elements are
never touched at all.

## Creation

There are three basic transducers. All of them take the "receives a reducer, returns a
reducer" shape.

```javascript
const { transducer } = FunFP;

const double = transducer.map(x => x * 2);
const evens = transducer.filter(x => x % 2 === 0);
const firstThree = transducer.take(3);

// all three are functions — nothing has run yet
console.log(typeof double, typeof evens, typeof firstThree);
// function function function
```

## Main operations

### transduce - running it

Takes four arguments at once: `transduce(transducer, reducer, initial, collection)`.
This is an uncurried call, the same style as this library's other doors (`map(f, fa)`
and the like).

```javascript
const { transducer } = FunFP;

const push = (acc, x) => [...acc, x];

transducer.transduce(transducer.map(x => x * 2), push, [], [1, 2, 3]);
// [2, 4, 6]
```

Swap the reducer and the shape of the result changes — no need to collect into an
array.

```javascript
const { transducer } = FunFP;

const sum = (acc, x) => acc + x;

// the sum of the doubled values — no intermediate array is created at all
console.log(transducer.transduce(transducer.map(x => x * 2), sum, 0, [1, 2, 3, 4]));
// 20
```

### into - pouring into a vessel {#into}

The reducer-and-initial-value slot in `transduce` is, most of the time, "collect it
into an array." `into` reduces those two arguments down to a **single vessel to hold
the result** — the library looks at the vessel's type and derives the reducer for you.

```javascript
const { transducer, compose } = FunFP;

const xf = compose(transducer.map(x => x * 2), transducer.take(2));

// array vessel — the push reducer is derived
console.log(transducer.into([], xf, [1, 2, 3, 4]));   // [2, 4]

// string vessel — concatenation
console.log(transducer.into('', transducer.map(s => s.toUpperCase()), 'abc'));   // 'ABC'

// Set vessel — add (duplicates merge according to Set's rules)
console.log([...transducer.into(new Set(), transducer.map(x => x % 3), [1, 2, 4, 5])]);   // [1, 2]

// Map/object vessel — elements must be [key, value] pairs
console.log(transducer.into({}, transducer.map(x => [x, x * 10]), [1, 2]));   // { '1': 10, '2': 20 }
```

The vessel's existing contents are preserved, and the original vessel is left
unmodified. This follows Clojure's `into` semantics — Ramda's `R.into` discards the
vessel's contents and looks only at its type, so it differs from this one.

```javascript
const { transducer } = FunFP;

const seed = ['start'];
const result = transducer.into(seed, transducer.map(x => x + 1), [1, 2]);
console.log(result);   // ['start', 2, 3] — contents preserved
console.log(seed);     // ['start'] — the original is unchanged
```

Supported vessels are arrays, strings, Sets, Maps, and plain objects; passing any other
vessel, or feeding a Map/object vessel an element that isn't a pair, throws with the
offending name called out.

```javascript
const { transducer } = FunFP;

[() => transducer.into(42, transducer.map(x => x), []),
 () => transducer.into({}, transducer.map(x => x), [1])].forEach(bad => {
    try { bad(); console.log('should not pass'); }
    catch (e) { console.log(e.message.slice(0, 26)); }
});
// transducer.into: vessel mu
// transducer.into: Map/objec
```

### map - transforming values

```javascript
const { transducer } = FunFP;

const push = (acc, x) => [...acc, x];

transducer.transduce(transducer.map(s => s.toUpperCase()), push, [], ['a', 'b']);
// ['A', 'B']
```

### filter - only what passes the condition

```javascript
const { transducer } = FunFP;

const push = (acc, x) => [...acc, x];

transducer.transduce(transducer.filter(x => x % 2 === 0), push, [], [1, 2, 3, 4, 5]);
// [2, 4]
```

### take - the first n, then an early stop

`take` returns a `Reduced` once its count is filled, which **stops traversal
outright.**

```javascript
const { transducer } = FunFP;

const push = (acc, x) => [...acc, x];

// if there are fewer than n elements, just as many as there are
console.log(transducer.transduce(transducer.take(10), push, [], [1, 2, 3]));
// [1, 2, 3]
```

Whether the early stop actually happens can be confirmed via a side effect.

```javascript
const { transducer } = FunFP;

const push = (acc, x) => [...acc, x];
let touched = 0;

const counted = transducer.map(x => { touched++; return x; });
const xf = r => counted(transducer.take(2)(r));

transducer.transduce(xf, push, [], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

console.log('elements touched:', touched);  // elements touched: 2   not 10
```

`take` accepts positive integers only.

```javascript
const { transducer } = FunFP;

[0, -1, 1.5, '3'].forEach(bad => {
    try {
        transducer.take(bad);
        console.log('should not pass:', bad);
    } catch (e) {
        console.log(`take(${JSON.stringify(bad)}) → ${e.constructor.name}`);
    }
});
```

### Composition — data flows left to right

This is where it's easy to get confused. `compose(a, b)` reads as `a(b(x))` in ordinary
function composition, but for transducers, **data passes through `a` first.**

The order in which reducers get wrapped is the reverse of the order in which data
flows.

```javascript
const { transducer, compose } = FunFP;

const push = (acc, x) => [...acc, x];

// data flow: filter first → then map
const filterThenMap = compose(
    transducer.filter(x => x % 2 === 0),
    transducer.map(x => x * 2)
);
console.log(transducer.transduce(filterThenMap, push, [], [1, 2, 3, 4, 5]));
// [4, 8]   — filtered to [2, 4], then doubled

// reversing the order changes the result: map first → then filter
const mapThenFilter = compose(
    transducer.map(x => x * 2),
    transducer.filter(x => x % 2 === 0)
);
console.log(transducer.transduce(mapThenFilter, push, [], [1, 2, 3, 4, 5]));
// [2, 4, 6, 8, 10]   — everything doubled, so all even
```

## Caution: take is stateful

`transducer.take(n)` itself **is safe to reuse** — a fresh counter is created every
time `transduce` runs. But **a reducer you've already applied it to** holds onto that
counter, and by a second run it is already spent.

```javascript
const { transducer } = FunFP;

const push = (acc, x) => [...acc, x];

// safe: an unapplied transducer can be reused
const t = transducer.take(2);
console.log(transducer.transduce(t, push, [], [1, 2, 3, 4, 5]));  // [1, 2]
console.log(transducer.transduce(t, push, [], [1, 2, 3, 4, 5]));  // [1, 2] — as expected

// dangerous: pre-applying shares the counter
const applied = transducer.take(2)(push);
console.log(transducer.transduce(() => applied, push, [], [1, 2, 3]));  // [1, 2]
console.log(transducer.transduce(() => applied, push, [], [1, 2, 3]));  // [] — exhausted
```

**Rule of thumb**: keep transducers unapplied, and leave the applying to `transduce`.

## Type checking

`transduce` throws a `TypeError` if given something that isn't an iterable.

```javascript
const { transducer } = FunFP;

const push = (acc, x) => [...acc, x];

try {
    transducer.transduce(transducer.map(x => x), push, [], 42);
} catch (e) {
    console.log(e.constructor.name);  // TypeError
}
```

## Practical examples

### 1. The first few matches out of a large list

Finding 5 errors out of a million log lines, without scanning the whole thing.

```javascript
const { transducer, compose } = FunFP;

const push = (acc, x) => [...acc, x];

const logs = [
    { level: 'info', msg: 'start' },
    { level: 'error', msg: 'disk full' },
    { level: 'warn', msg: 'slow' },
    { level: 'error', msg: 'timeout' },
    { level: 'error', msg: 'refused' },
    { level: 'info', msg: 'done' }
];

const firstTwoErrors = compose(
    transducer.filter(l => l.level === 'error'),
    transducer.map(l => l.msg),
    transducer.take(2)
);

console.log(transducer.transduce(firstTwoErrors, push, [], logs));
// ['disk full', 'timeout'] — stops before reaching 'refused'
```

### 2. Using it as-is on non-array data

Anything iterable works. Even an infinite generator is safe when paired with `take`.

```javascript
const { transducer, compose } = FunFP;

const push = (acc, x) => [...acc, x];

function* naturals() {
    let n = 1;
    while (true) yield n++;
}

const firstSquares = compose(
    transducer.filter(n => n % 3 === 0),
    transducer.map(n => n * n),
    transducer.take(4)
);

console.log(transducer.transduce(firstSquares, push, [], naturals()));
// [9, 36, 81, 144]
```

Using `.filter().map().slice()` on an infinite sequence never returns, because it hangs
forever on the first stage. A transducer finishes because `take` cuts the traversal
short.

```javascript
const { transducer } = FunFP;

// works the same on a Set and a string
const push = (acc, x) => [...acc, x];
const upper = transducer.map(s => s.toUpperCase());

console.log(transducer.transduce(upper, push, [], new Set(['a', 'b', 'a'])));
// ['A', 'B'] — being a Set, duplicates are already removed

console.log(transducer.transduce(upper, (acc, c) => acc + c, '', 'hello'));
// 'HELLO'
```

### 3. Naming transformation logic for reuse

Keeping pipeline pieces as values lets you assemble them in more than one place.

```javascript
const { transducer, compose } = FunFP;

const push = (acc, x) => [...acc, x];

// pieces to reuse
const activeOnly = transducer.filter(u => u.active);
const toName = transducer.map(u => u.name);
const adultsOnly = transducer.filter(u => u.age >= 18);

const users = [
    { name: 'A', age: 30, active: true },
    { name: 'B', age: 15, active: true },
    { name: 'C', age: 40, active: false },
    { name: 'D', age: 22, active: true }
];

const activeAdultNames = compose(activeOnly, adultsOnly, toName);
console.log(transducer.transduce(activeAdultNames, push, [], users));
// ['A', 'D']

// a different pipeline from the same pieces
const activeNames = compose(activeOnly, toName);
console.log(transducer.transduce(activeNames, push, [], users));
// ['A', 'B', 'D']
```

### 4. Aggregating without collecting into an array

Swap the reducer and one traversal gives you statistics.

```javascript
const { transducer, compose } = FunFP;

const orders = [
    { item: 'book', price: 15000, paid: true },
    { item: 'pen', price: 2000, paid: false },
    { item: 'desk', price: 89000, paid: true },
    { item: 'lamp', price: 34000, paid: true }
];

const paidWithTax = compose(
    transducer.filter(o => o.paid),
    transducer.map(o => Math.round(o.price * 1.1))
);

// total — no intermediate array
const total = transducer.transduce(paidWithTax, (acc, x) => acc + x, 0, orders);
console.log('total:', total);

// same pipeline, different reducer — max
const max = transducer.transduce(paidWithTax, (acc, x) => Math.max(acc, x), 0, orders);
console.log('max:', max);
```

## Related type classes

- [Foldable](./Foldable.md) - `transduce` is, in the end, a fold. A transducer is the
  layer that assembles the reducer that fold will use.
- [Semigroupoid](./Semigroupoid.md) - Transducers compose via `compose`. Just note that
  the direction data flows is the reverse of ordinary function composition.
- [Filterable](./Filterable.md) - `filter` over a container. What's different about a
  transducer's `filter` is that it transforms a reducer, not a container.

## Learn more

- [Clojure Transducers](https://clojure.org/reference/transducers)
