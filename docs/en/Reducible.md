# Reducible

> 한국어: [../Reducible.md](../Reducible.md)

**Folds something that cannot be empty.** It inherits `Foldable`, and for its
folding rule it accepts not a Monoid but a **Semigroup** alone.

> This is outside the Static Land spec. It occupies the same slot as cats'
> `Reducible`, and this library set up the class because it needed one. The
> reasoning is in [`internals.md`](./internals.md#reducible).

## Concept

There is exactly one reason `foldMap` requires a Monoid: **the answer when
an empty container comes in.** That answer is the identity element. But a
container that can never be empty has no such question to begin with. The
first element serves as the seed, so all that folding needs is "how to
combine."

That is how a Semigroup with no identity element gets into folding.
`first` (keep the earlier one) and `last` (keep the later one) are such
rules: neither can produce an identity element, so neither could get into
`foldMap`.

```javascript
const { Reducible, Foldable, Semigroup, NonEmptyList, foldMap } = FunFP;

const R = Reducible.lookup('nonemptylist');
const nel = NonEmptyList.make(3, 9, 4);

console.log(R.reduceMap(Semigroup.lookup('first'), x => x, nel));   // 3
console.log(R.reduceMap(Semigroup.lookup('last'), x => x, nel));    // 4

// feeding the same rule to foldMap is rejected — it is not a Monoid
try { console.log(foldMap(Foldable.lookup('array'), Semigroup.lookup('first'))); }
catch (e) { console.log(e.message); }   // foldMap: second argument must be a Monoid
```

## Interface

| Operation | Signature | What it does |
| --- | --- | --- |
| `reduceLeft` | `(f, fa) => value` | Folds from the left with no initial value. The seed is the first element |
| `reduceMap` | `(semigroup, f, fa) => value` | Applies `f` to each element, then combines the results with the Semigroup |

Since it inherits `Foldable`, `reduce` is still there too. If you need a fold
with an initial value, use that instead.

```javascript
const { Reducible, NonEmptyList } = FunFP;

const R = Reducible.lookup('nonemptylist');
const nel = NonEmptyList.make(3, 9, 4);

console.log(R.reduceLeft((a, b) => a + b, nel));      // 16   no initial value
console.log(R.reduce((a, b) => a + b, 100, nel));     // 116  the inherited Foldable
```

`reduceMap` also accepts a Monoid, because a Monoid is a Semigroup.
**It simply does not use the identity element.**

```javascript
const { Reducible, Monoid, NonEmptyList } = FunFP;

const R = Reducible.lookup('nonemptylist');

console.log(R.reduceMap(Monoid.lookup('array'), x => [x], NonEmptyList.make(3, 9, 4)));
// [ 3, 9, 4 ]
```

## The two registered instances

| Key | Carrier | Why it qualifies |
| --- | --- | --- |
| `nonemptylist` | [NonEmptyList](./NonEmptyList.md) | Its head slot guarantees the structure is never empty |
| `identity` | Identity | It always holds exactly one value, the limiting case of "cannot be empty" |

```javascript
const { Reducible, Semigroup, Identity } = FunFP;

const I = Reducible.lookup('identity');

console.log(I.reduceLeft((a, b) => a + b, Identity.of(7)));                  // 7
console.log(I.reduceMap(Semigroup.lookup('first'), x => x * 2, Identity.of(7)));  // 14
```

With a single element there is nothing to combine, so only `f` is applied and
the Semigroup is never called.

## What's missing is the point

`Array` and `Maybe` are not here. **They can be empty, so they structurally do
not qualify.** `[]` and `Nothing` have no "first element." That absence is
what the class means, and so registration is blocked for them.

```javascript
const { Reducible } = FunFP;

try { console.log(Reducible.lookup('array')); }
catch (e) { console.log(e.message); }   // Reducible.lookup: unsupported key array

try { console.log(Reducible.lookup('maybe')); }
catch (e) { console.log(e.message); }   // Reducible.lookup: unsupported key maybe
```

## Laws

The law gate checks both registered instances every time. The reference value
is **the element list collected by the inherited `Foldable.reduce`**: folding
the same container two ways and getting a mismatch turns the gate red.

| Law | What it pins down |
| --- | --- |
| Element preservation | `reduceMap(array Semigroup, x => [x], u)` equals the list collected by `reduce` |
| `reduceLeft` consistency | Matches folding from the left with the first element as seed, checked with a non-commutative operation, so a wrong direction shows up as a mismatch |
| `first` / `last` | Each yields the first element and the last element respectively |

```javascript
const { Reducible, Semigroup, NonEmptyList } = FunFP;

const R = Reducible.lookup('nonemptylist');
const nel = NonEmptyList.make(3, 9, 4);
const elems = R.reduce((acc, x) => acc.concat([x]), [], nel);

// element preservation — both paths produce the same list
console.log(JSON.stringify(R.reduceMap(Semigroup.lookup('array'), x => [x], nel)));  // [3,9,4]
console.log(JSON.stringify(elems));                                                  // [3,9,4]

// reduceLeft consistency — the operation is non-commutative, so a wrong direction gives a different value
const f = (a, b) => a * 10 + b;
console.log(R.reduceLeft(f, nel));                    // 394
console.log(elems.slice(1).reduce(f, elems[0]));      // 394
```

## Rejection wording

Carrier and argument checks follow the same discipline as the other type
classes.

```javascript
const { Reducible, Semigroup, NonEmptyList } = FunFP;

const R = Reducible.lookup('nonemptylist');
const nel = NonEmptyList.make(1, 2);

try { console.log(R.reduceLeft((a, b) => a + b, [1, 2, 3])); }
catch (e) { console.log(e.message); }   // Reducible.reduceLeft: arguments must be (function, NonEmptyList)

try { console.log(R.reduceMap({ concat: (a, b) => a + b }, x => x, nel)); }
catch (e) { console.log(e.message); }   // Reducible.reduceMap: first argument must be a Semigroup

try { console.log(Reducible.lookup('identity').reduceLeft((a, b) => a + b, nel)); }
catch (e) { console.log(e.message); }   // Reducible.reduceLeft: arguments must be (function, Identity)
```

## Static sentences on the data type

`NonEmptyList.reduceLeft` / `NonEmptyList.reduceMap` are **delegations** to
this instance. `Reducible` owns the folding, and validation and wording are
seen above as well.

```javascript
const { Reducible, Semigroup, NonEmptyList } = FunFP;

const nel = NonEmptyList.make(3, 9, 4);

console.log(NonEmptyList.reduceLeft((a, b) => a + b, nel));                       // 16
console.log(Reducible.lookup('nonemptylist').reduceLeft((a, b) => a + b, nel));   // 16
```

## Related type classes

- **[Foldable](./Foldable.md)**: the superclass. It admits the empty case, so it requires a Monoid
- **[Semigroup](./Semigroup.md)**: the combining rule `reduceMap` accepts
- **[NonEmptyList](./NonEmptyList.md)**: the data type that gave rise to this class
