# NonEmptyList

> 한국어: [../NonEmptyList.md](../NonEmptyList.md)

**A list that cannot be empty** — non-emptiness is guaranteed not by a check but by structure (the head slot)

## Concept

An array can always be empty, and that possibility splits its operations in two: pulling out the
first element needs a `Maybe` wrapper, folding needs "the answer for the empty case" (a Monoid's
identity), and `extract` (Comonad) hands back `undefined` on an empty array. NonEmptyList has the
head slot (`head`) as part of its structure — the type guarantees at least one value exists, so you
never have to pay that cost again.

The only door through which an empty array can enter is `fromArray`, and it's the only place a
`Maybe` comes out — check once at the boundary, and there's no need to check again inside.

```javascript
const { NonEmptyList } = FunFP;

const nel = NonEmptyList.make(3, 9, 4);          // created from literals
console.log(nel.head);                            // 3 — no Maybe, always present
console.log(nel.last());                          // 4
console.log(nel.toArray());                       // [ 3, 9, 4 ] — the door out to an array

// Maybe only when coming in from an array — the possibility of empty ends at this door
console.log(NonEmptyList.fromArray([1, 2]).isJust());   // true
console.log(NonEmptyList.fromArray([]).isNothing());    // true
```

## reduceLeft · reduceMap — folding without a Monoid

`foldMap` requires a Monoid (an associative rule with an identity element) to have an answer for
the empty list. That's why the `first` (keep the earlier one) and `last` (keep the later one)
Semigroups, which have no possible identity, can't be used with `foldMap`. NonEmptyList folds
**with only a Semigroup**, since head serves as the seed — that door is `reduceMap` (transform, then
combine) and `reduceLeft` (from the left, with no initial value). The owner of this fold is the
**[Reducible](./Reducible.md)** type class (`Reducible.lookup('nonemptylist')` — it shares the same
contract as Identity). The static `NonEmptyList.reduceLeft/reduceMap` entries below delegate to
that instance.

```javascript
const { NonEmptyList, Semigroup, Foldable, foldMap } = FunFP;
const nel = NonEmptyList.make(3, 9, 4);

// first·last enter the fold — something the array's foldMap could never express
console.log(NonEmptyList.reduceMap(Semigroup.lookup('first'), x => x, nel));  // 3
console.log(NonEmptyList.reduceMap(Semigroup.lookup('last'), x => x, nel));   // 4

// putting the same rule into foldMap is still rejected — it isn't a Monoid
let thrown = '';
try { foldMap(Foldable.lookup('array'), Semigroup.lookup('first')); }
catch (e) { thrown = e.message; }
console.log(thrown);   // foldMap: second argument must be a Monoid

// reduceLeft — starts from head, no initial value
console.log(NonEmptyList.reduceLeft((a, b) => a + b, nel));   // 16
```

## 13 instances, and 4 deliberate absences

Functor, Apply, Applicative, Chain, ChainRec, Monad, Semigroup, Alt, Foldable, **Reducible**,
Traversable, Extend, and Comonad are all registered (`lookup('nonemptylist')`). Notably `extract`
(Comonad) has no empty case, so it's a **total function that always returns a value** — the array
Comonad's `extract([]) === undefined` gap doesn't exist for this type.

```javascript
const { NonEmptyList, Comonad, Functor } = FunFP;

console.log(Comonad.lookup('nonemptylist').extract(NonEmptyList.make(7, 8)));  // 7
console.log(Functor.lookup('nonemptylist').map(x => x * 2, NonEmptyList.make(1, 2)).toArray());
// [ 2, 4 ]
```

**Monoid, Plus, Alternative, and Filterable are deliberately absent** — both the identity element
and `zero` would have to be "the empty list", and filtering can empty a list out. This absence is
the whole reason this type exists: "a Semigroup but not a Monoid" gets registered not as two
abstract instances but as a tangible data type, in the form of `first`/`last`. If you want to
filter, going out through `toArray` is the honest path.

## When to use it, and when not to

- **Where an array plus an if is the right fit** — cases checked once inside a single function and
  done. `if (arr.length === 0) return;` is as simple as it gets, and switching to NonEmptyList
  wouldn't improve anything.
- **Where NonEmptyList is the right fit** — when the condition "there's at least one" has to
  **travel across several functions**. Pass an array around and every receiving function repeats
  the same worry about an empty one; pass a NonEmptyList around and that worry ends once, where the
  list is first created (`fromArray`). It's not a tool that removes the check — it's a tool that
  **reduces a check made many times to one**.

```javascript
const { NonEmptyList, Maybe } = FunFP;

// the signature is the contract — a function that takes NonEmptyList never considers the empty case.
// (JS doesn't enforce types — the caller who honors the contract is the one who builds it with fromArray)
const pickLeader = candidates => candidates.head;   // no check — the contract stands in for it
const report = candidates =>
    'Leader: ' + pickLeader(candidates) + ' / ' + candidates.toArray().length + ' total';

// the worry lives at one boundary only — every inner function chains on with no check at all
console.log(Maybe.fold(() => 'no candidates', report, NonEmptyList.fromArray(['Alice', 'Bob'])));
// Leader: Alice / 2 total
console.log(Maybe.fold(() => 'no candidates', report, NonEmptyList.fromArray([])));
// no candidates
```

## See also

- [Semigroup](./Semigroup.md) — the combining rule `reduceMap` takes (no identity element needed)
- [Monoid](./Monoid.md) — the contrast with what `foldMap` requires
- [Maybe](./Maybe.md) — comes out only at the boundary (`fromArray`)
