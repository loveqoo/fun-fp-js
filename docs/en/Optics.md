# Optics

> 한국어: [../Optics.md](../Optics.md)

**Composable accessors that point at part of your data** — Iso, Lens, Prism, Traversal

An optic turns **the way you read and write a part of a larger structure**
into a value. Being a value, it composes, and once built, one optic serves
both reading and writing.

## Which one to use — pick by target count

| Target count | optic | example |
| --- | --- | --- |
| Exactly 1 (lossless conversion) | **Iso** | Celsius ↔ Fahrenheit, string ↔ character array |
| Exactly 1 | [Lens](./Lens.md) | a field of an object, a specific array index |
| 0 or 1 | **Prism** | the `Right` of an `Either`, even numbers only, only what parsed successfully |
| 0..n | **Traversal** | every element of an array, the value inside a `Maybe` |

## Quick look

## `prop` for viewing a single property

The most common Lens. Nested ones are chained with `compose`.

```javascript
const { Optics } = FunFP;

const cityL = Optics.compose(Optics.prop('address'), Optics.prop('city'));
const user = { id: 7, address: { city: 'Seoul', zip: '04524' } };

console.log(Optics.view(cityL, user));              // 'Seoul'
console.log(Optics.set(cityL, 'Busan', user).address.city);   // 'Busan'
console.log(user.address.city);                     // 'Seoul'  the original stays unchanged
```

**It also accepts array indices.** Since the copy preserves its own shape, an
array stays an array — that's what lets it compose with a traversal optic
downstream.

```javascript
const { Optics } = FunFP;

console.log(Optics.set(Optics.prop(0), 99, [10, 20, 30]));   // [ 99, 20, 30 ]

const xs = Optics.compose(Optics.prop('xs'), Optics.traversed('array'));
console.log(Optics.over(xs, x => x * 10, { xs: [1, 2, 3] }));   // { xs: [ 10, 20, 30 ] }
```

To build one yourself, use `Lens(getter, setter)` — `prop` is just a special
case of it.

```javascript
const { Maybe, Either } = FunFP;
const { Lens, Prism, traversed, compose, preview, toList, over } = FunFP.Optics;

// Prism — may or may not exist
const rightP = Prism(
    e => (e.isRight() ? Maybe.Just(e.value) : Maybe.Nothing()),
    v => Either.Right(v)
);

console.log(preview(rightP, Either.Right(5)).value);        // 5
console.log(preview(rightP, Either.Left('e')).isNothing()); // true
console.log(over(rightP, x => x * 2, Either.Left('e')).value); // 'e' — the original stays unchanged

// Traversal — 0..n targets
const each = traversed('array');
console.log(over(each, x => x * 10, [1, 2, 3]));   // [10, 20, 30]

// composition — freely mixes all three
const usersL = Lens(o => o.users, (v, o) => ({ ...o, users: v }));
const nameL = Lens(u => u.name, (v, u) => ({ ...u, name: v }));
const allNames = compose(usersL, each, nameL);

const db = { users: [{ name: 'a' }, { name: 'b' }] };
console.log(toList(allNames, db));                          // ['a', 'b']
console.log(JSON.stringify(over(allNames, s => s.toUpperCase(), db)));
// {"users":[{"name":"A"},{"name":"B"}]}
```

Even across different kinds, you mix them with `compose`. Everything else
here is a variation on these four.

## Why do we need several kinds?

### Problem: Lens alone can't handle "may not exist" or "may be many"

```javascript no-run 문제 상황 — Lens 로는 표현할 수 없다
// A Lens's target must be exactly 1.
// Either's Right may not exist → what should the getter return?
const rightLens = Lens(
    e => e.value,              // What about when it's Left? This becomes a lie.
    (v, e) => Either.Right(v)  // turns a Left into a Right
);

// to change the whole array, you write map by hand every time
const updated = {
    ...db,
    users: db.users.map(u => ({ ...u, name: u.name.toUpperCase() }))
};
```

## Construction

### Iso — lossless two-way conversion

`Iso(to, from)` — use it when two representations can go back and forth
without losing information.

```javascript
const { Iso, view, review, over } = FunFP.Optics;

const fahrenheit = Iso(c => c * 9 / 5 + 32, f => (f - 32) * 5 / 9);

console.log(view(fahrenheit, 100));            // 212  — forward direction
console.log(review(fahrenheit, 212));          // 100  — reverse direction
console.log(over(fahrenheit, f => f + 18, 100)); // 110 — add in Fahrenheit, then convert back to Celsius
```

**Two laws** guarantee losslessness. If either breaks, it isn't an Iso.

```javascript
const { Iso, view, review } = FunFP.Optics;

const chars = Iso(s => s.split(''), a => a.join(''));

console.log(review(chars, view(chars, 'abc')) === 'abc');            // true
console.log(view(chars, review(chars, ['x', 'y'])).join('') === 'xy'); // true
```

An `Iso` is **both a Lens and a Prism**, so all six operations work on it.

```javascript
const { Iso, view, preview, toList, over, set, review } = FunFP.Optics;

const fahrenheit = Iso(c => c * 9 / 5 + 32, f => (f - 32) * 5 / 9);

console.log(view(fahrenheit, 0));              // 32
console.log(preview(fahrenheit, 0).value);     // 32   — always Just
console.log(toList(fahrenheit, 0));          // [32] — always 1 target
console.log(set(fahrenheit, 212, 0));          // 100
console.log(review(fahrenheit, 32));           // 0
```

**A reversed Iso doesn't need to be built separately** — it's derived from
`view` and `review`.

```javascript
const { Iso, view, review } = FunFP.Optics;

const fahrenheit = Iso(c => c * 9 / 5 + 32, f => (f - 32) * 5 / 9);
const celsius = Iso(f => review(fahrenheit, f), c => view(fahrenheit, c));

console.log(view(celsius, 212));    // 100
console.log(review(celsius, 100));  // 212
```

### Lens — exactly 1

See the [Lens](./Lens.md) document for details.

```javascript
const { Lens, view } = FunFP.Optics;

const nameLens = Lens(
    p => p.name,
    (v, p) => ({ ...p, name: v })
);

console.log(view(nameLens, { name: 'Anthony', age: 30 }));  // 'Anthony'
```

### Prism — 0 or 1

`Prism(match, build)` — `match` **must return a `Maybe`.**

```javascript
const { Maybe } = FunFP;
const { Prism, preview, review } = FunFP.Optics;

// a Prism that only passes even numbers
const evenP = Prism(
    n => (n % 2 === 0 ? Maybe.Just(n) : Maybe.Nothing()),
    n => n
);

console.log(preview(evenP, 4).value);         // 4
console.log(preview(evenP, 3).isNothing());   // true
console.log(review(evenP, 8));                // 8 — building backward
```

If `match` doesn't return a `Maybe`, it throws `TypeError` immediately.

```javascript
const { Prism, preview } = FunFP.Optics;

const bad = Prism(() => 42, v => v);
try {
    preview(bad, 1);
} catch (e) {
    console.log(e.message);  // 'Prism: match must return a Maybe'
}
```

### Traversal — 0..n

`traversed(key)` pulls an **already-existing
[Traversable](./Traversable.md) instance** in as an optic. There's no need
to define one from scratch.

```javascript
const { Maybe } = FunFP;
const { traversed, toList, over } = FunFP.Optics;

const each = traversed('array');
console.log(toList(each, [1, 2, 3]));       // [1, 2, 3]

const inMaybe = traversed('maybe');
console.log(toList(inMaybe, Maybe.Just(5)));    // [5]
console.log(toList(inMaybe, Maybe.Nothing()));  // [] — no target
```

## Main operations

Three for reading, two for writing. **Only `view` is Lens-specific** — the
rest work on all three optics.

| operation | result | when 0 targets | when 2+ targets |
| --- | --- | --- | --- |
| `view(lens, s)` | `a` | **`TypeError`** | **`TypeError`** |
| `preview(optic, s)` | `Maybe a` | `Nothing` | first target |
| `toList(optic, s)` | `[a]` | `[]` | all of them |
| `foldMapOf(monoid, optic, f, s)` | `r` | `monoid.empty()` | all of them combined |
| `over(optic, f, s)` | `s` | unchanged original | all transformed |
| `set(optic, b, s)` | `s` | unchanged original | all replaced |
| `review(prism, a)` | `s` | Prism/Iso only | not applicable |

**`view` only works when there's exactly one target** — it counts the
targets and throws for anything else.

```javascript
const { view, traversed } = FunFP.Optics;

try {
    view(traversed('array'), [1, 2, 3]);
} catch (e) {
    console.log(e.message);
    // view: expected exactly one target, got 3 — use preview or toList
}
```

What gets counted is the **number of targets**, not the value. If there's
exactly one target and its value happens to be `undefined`, that's what gets
returned as-is. For a spot where the target count might not be 1, use
`preview` or `toList`.

### preview - the first target

```javascript
const { traversed, preview } = FunFP.Optics;

const each = traversed('array');
console.log(preview(each, [7, 8, 9]).value);   // 7 — first only
console.log(preview(each, []).isNothing());    // true
```

### toList - every target

```javascript
const { Lens, traversed, compose, toList } = FunFP.Optics;

const each = traversed('array');
const scoreL = Lens(x => x.score, (v, x) => ({ ...x, score: v }));

const scores = compose(each, scoreL);
console.log(toList(scores, [{ score: 10 }, { score: 20 }]));  // [10, 20]
```

### foldMapOf - collecting with a Monoid you choose

`preview` and `toList` each collect in a fixed way — "the first target" and
"an array," respectively. To collect differently, use `foldMapOf(monoid,
optic, f, s)` to **choose the Monoid yourself.**

```javascript
const { Monoid } = FunFP;
const { traversed, foldMapOf } = FunFP.Optics;

const each = traversed('array');

console.log(foldMapOf(Monoid.lookup('number'), each, x => x, [1, 2, 3]));            // 6  sum
console.log(foldMapOf(Monoid.lookup('NumberProductMonoid'), each, x => x, [2, 3, 4])); // 24   combined by product
console.log(foldMapOf(Monoid.lookup('NumberMaxMonoid'), each, x => x, [2, 9, 4]));   // 9  max
console.log(foldMapOf(Monoid.lookup('string'), each, String, [1, 2, 3]));            // '123'
```

**With no targets, you get the Monoid's identity element.**

```javascript
const { Monoid } = FunFP;
const { traversed, foldMapOf } = FunFP.Optics;

console.log(foldMapOf(Monoid.lookup('number'), traversed('array'), x => x, []));  // 0
```

`toList` and `preview` are special cases of this — they're just `foldMapOf`
with the Monoid pinned to `array` and `maybe` respectively.

```javascript
const { Monoid, Maybe } = FunFP;
const { traversed, foldMapOf, toList } = FunFP.Optics;

const each = traversed('array');
console.log(JSON.stringify(foldMapOf(Monoid.lookup('array'), each, a => [a], [1, 2, 3])));
console.log(JSON.stringify(toList(each, [1, 2, 3])));   // [1,2,3]   same as above
```

**Monoids you never registered work too.** They just have to be an actual
`Monoid`, not an `{ empty, concat }` literal — the same rule as
[`foldMap`](./Foldable.md).

```javascript
const { Monoid, Semigroup } = FunFP;
const { traversed, foldMapOf } = FunFP.Optics;

const commaJoin = new Monoid(
    new Semigroup((a, b) => (a && b ? a + ',' + b : a + b), 'string'),
    () => '',
    'string'
);
console.log(foldMapOf(commaJoin, traversed('array'), String, [1, 2, 3]));  // '1,2,3'
```

### over / set - changing every target

**With no targets, the original comes back unchanged.** This is the core
property of Prism and Traversal.

```javascript
const { Maybe } = FunFP;
const { Prism, traversed, over, set } = FunFP.Optics;

const evenP = Prism(n => (n % 2 === 0 ? Maybe.Just(n) : Maybe.Nothing()), n => n);

console.log(over(evenP, x => x * 100, 4));   // 400 — matched
console.log(over(evenP, x => x * 100, 3));   // 3   — no match, original
console.log(set(evenP, 0, 3));               // 3   — same for set

const each = traversed('array');
console.log(over(each, x => x + 1, []));     // [] — safe even for an empty array
```

### review - building backward with a Prism

```javascript
const { Maybe, Either } = FunFP;
const { Prism, review, preview } = FunFP.Optics;

const rightP = Prism(
    e => (e.isRight() ? Maybe.Just(e.value) : Maybe.Nothing()),
    v => Either.Right(v)
);

const built = review(rightP, 42);
console.log(built.isRight(), built.value);            // true 42
console.log(preview(rightP, built).value);            // 42 — law: preview ∘ review = Just
```

`review` only works **on a Prism.** `Tagged` ignores its input and holds only
the output, which lets it construct the `a -> s` direction — but in exchange
it can't implement product (`first`) or traversal (`wander`). Using it on a
Lens or Traversal fails right there.

```javascript
const { Lens, traversed, review } = FunFP.Optics;

const nameLens = Lens(p => p.name, (v, p) => ({ ...p, name: v }));
try {
    review(nameLens, 'x');
} catch (e) {
    console.log(e.message);  // 'review: argument must be a Prism (a Lens cannot be reviewed)'
}

try {
    review(traversed('array'), 'x');
} catch (e) {
    console.log(e.message);  // review: argument must be a Prism (a Traversal cannot be reviewed)
}
```

**It also works on a composed Prism.** Since composing optics is just
function composition, `Tagged` flows straight through.

```javascript
const { Maybe, Either } = FunFP;
const { Prism, compose, preview, review } = FunFP.Optics;

const rightP = Prism(e => (e.isRight() ? Maybe.Just(e.value) : Maybe.Nothing()), v => Either.Right(v));
const evenP = Prism(n => (n % 2 === 0 ? Maybe.Just(n) : Maybe.Nothing()), n => n);
const rightEven = compose(rightP, evenP);

console.log(JSON.stringify(review(rightEven, 4)));   // {"value":4,"_typeName":"Either"}   Right(4)
console.log(preview(rightEven, review(rightEven, 8)).value);   // 8 — the law holds
```

## Composition

`compose(...)` takes its arguments **from outside in.** You can mix
different kinds freely, and the target count of the result is their
**product** — Lens (1 target) × Traversal (n targets) = n targets.

```javascript
const { Maybe } = FunFP;
const { Lens, Prism, traversed, compose, toList, over } = FunFP.Optics;

const each = traversed('array');
const evenP = Prism(n => (n % 2 === 0 ? Maybe.Just(n) : Maybe.Nothing()), n => n);

// Traversal + Prism — changes only what passes
const evens = compose(each, evenP);
console.log(toList(evens, [1, 2, 3, 4]));              // [2, 4]
console.log(over(evens, x => x * 100, [1, 2, 3, 4]));    // [1, 200, 3, 400]
```

Lenses compose with each other using the very same function — there's no
need for a kind-specific name.

```javascript
const { Lens, compose, view } = FunFP.Optics;

const addressLens = Lens(u => u.address, (a, u) => ({ ...u, address: a }));
const cityLens = Lens(a => a.city, (c, a) => ({ ...a, city: c }));

console.log(view(compose(addressLens, cityLens), { address: { city: 'Seoul' } }));
// 'Seoul'
```

**Regular `compose` can't compose optics.** Because `P` is the first
argument, `compose` injects `P` into every optic first, then does function
composition at that layer.

## Laws

To confirm a Prism is well-formed, check two things.

```javascript
const { Maybe, Either } = FunFP;
const { Prism, preview, review } = FunFP.Optics;

const rightP = Prism(
    e => (e.isRight() ? Maybe.Just(e.value) : Maybe.Nothing()),
    v => Either.Right(v)
);

// 1. anything built must match
console.log(preview(rightP, review(rightP, 42)).value === 42);   // true

// 2. building what matched gives back the original
const s = Either.Right(7);
const focus = preview(rightP, s).value;
console.log(review(rightP, focus).value === s.value);            // true
```

Traversing with the identity function must return the original.

```javascript
const { traversed, over } = FunFP.Optics;

const each = traversed('array');
const s = [1, 2, 3];
console.log(JSON.stringify(over(each, x => x, s)) === JSON.stringify(s));  // true
```

## Practical examples

### 1. Bulk update of a nested collection

```javascript
const { Lens, traversed, compose, over, toList } = FunFP.Optics;

const each = traversed('array');
const itemsL = Lens(o => o.items, (v, o) => ({ ...o, items: v }));
const priceL = Lens(i => i.price, (v, i) => ({ ...i, price: v }));

const allPrices = compose(itemsL, each, priceL);

const cart = {
    items: [
        { name: 'book', price: 15000 },
        { name: 'pen', price: 2000 }
    ]
};

console.log(toList(allPrices, cart));                    // [15000, 2000]
const taxed = over(allPrices, p => Math.round(p * 1.1), cart);
console.log(taxed.items.map(i => i.price));                // [16500, 2200]
console.log(cart.items.map(i => i.price));                 // [15000, 2000] — the original is unchanged
```

### 2. Handling only the ones that succeeded

Transforms only the `Right`s in an array of `Either`. Failures are left
alone.

```javascript
const { Maybe, Either } = FunFP;
const { Prism, traversed, compose, toList, over } = FunFP.Optics;

const each = traversed('array');
const rightP = Prism(
    e => (e.isRight() ? Maybe.Just(e.value) : Maybe.Nothing()),
    v => Either.Right(v)
);
const successes = compose(each, rightP);

const results = [Either.Right(1), Either.Left('fail'), Either.Right(3)];

console.log(toList(successes, results));          // [1, 3] — successes only
const doubled = over(successes, x => x * 2, results);
console.log(doubled.map(e => e.value));             // [2, 'fail', 6] — the failure stays unchanged
```

### 3. Conditional partial updates

Turns "only the ones matching a condition" into a reusable value with a
Prism.

```javascript
const { Maybe } = FunFP;
const { Lens, Prism, traversed, compose, over, toList } = FunFP.Optics;

const each = traversed('array');
const activeOnly = Prism(
    u => (u.active ? Maybe.Just(u) : Maybe.Nothing()),
    u => u
);
const nameL = Lens(u => u.name, (v, u) => ({ ...u, name: v }));

const activeNames = compose(each, activeOnly, nameL);

const users = [
    { name: 'alice', active: true },
    { name: 'bob', active: false },
    { name: 'carol', active: true }
];

console.log(toList(activeNames, users));                       // ['alice', 'carol']
const shouted = over(activeNames, s => s.toUpperCase(), users);
console.log(shouted.map(u => u.name));                           // ['ALICE', 'bob', 'CAROL']
```

### 4. Safe deep reads

`preview` returns `Nothing` no matter where along the path something is
missing — no defensive code needed.

```javascript
const { Maybe } = FunFP;
const { Lens, Prism, compose, preview } = FunFP.Optics;

const profileL = Lens(u => u.profile, (v, u) => ({ ...u, profile: v }));
const definedP = Prism(
    x => (x === undefined || x === null ? Maybe.Nothing() : Maybe.Just(x)),
    x => x
);
const bioL = Lens(p => p.bio, (v, p) => ({ ...p, bio: v }));

const bio = compose(profileL, definedP, bioL);

console.log(preview(bio, { profile: { bio: 'hi' } }).value);      // 'hi'
console.log(preview(bio, { profile: undefined }).isNothing());      // true
```

## Internal structure

Everything from here on **is not needed to use optics.** Read this when you
want the answer to a question like why `review` doesn't work on a Lens.

All four share the same representation (a profunctor encoding):

```
Optic s a = P => P a a -> P s s
```

**Which `P` gets injected is what determines the operation.** That's why a
single definition yields reading, writing, and reverse-construction all at
once.

| `P` injected | operation you get |
| --- | --- |
| a function (`a -> b`) | `over`, `set` |
| `Forget<r>` (`a -> r`) | `view`, `preview`, `toList` |
| `Tagged` (holds only `b` — ignores the input) | `review` |

The four optics differ in which method of `P` they use.

| optic | method used |
| --- | --- |
| `Iso` | `dimap` only |
| `Lens` | `first` (product) |
| `Prism` | `left` (sum) |
| `Traversal` | `wander` (traversal) |

**`Tagged` has neither `first` nor `wander`**, and that alone is the
constraint behind "Lens and Traversal can't be `review`ed." Conversely,
**`Iso` uses only `dimap`, so it works with every `P`** — being both a Lens
and a Prism, both `view` and `review` work on it. It demands the least, which
is why it sits at the top of the optics hierarchy.

`wander` delegates to `traverse` in the
[Traversable](./Traversable.md) registry, and `dimap` delegates to `promap`
in the [Profunctor](./Profunctor.md) registry.

## Related type classes

- [Lens](./Lens.md) - covers Lens alone, in depth. Includes 3 laws and
  practical examples.
- [Profunctor](./Profunctor.md) - this is exactly the `P` an optic takes. It
  uses a dictionary equipped with `dimap` plus `first` (product), `left`
  (sum), and `wander` (traversal).
- [Traversable](./Traversable.md) - `wander` delegates to this registry's
  `traverse`. The internal Applicative (Identity/Const) is used only for
  that call.
- [Traversable](./Traversable.md) - `traversed(key)` uses this registry
  directly.
- [Maybe](./Maybe.md) - the type `Prism`'s `match` and `preview`'s result
  both use.

## Learn more

- [Profunctor Optics: Modular Data Accessors](https://arxiv.org/abs/1703.10857) (Pickering, Gibbons, Wu)
- [Van Laarhoven Lenses](https://www.twanvl.nl/blog/haskell/cps-functional-references) — an earlier encoding
