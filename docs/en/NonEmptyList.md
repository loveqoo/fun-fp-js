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

const nel = NonEmptyList.make(3, 9, 4);          // 리터럴 생성
console.log(nel.head);                            // 3 — Maybe 없이, 항상 있다
console.log(nel.last());                          // 4
console.log(nel.toArray());                       // [ 3, 9, 4 ] — 배열로 나가는 문

// 배열에서 들어올 때만 Maybe — 비어 있을 가능성은 이 문에서 끝난다
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

// first·last 가 접기에 들어온다 — 배열의 foldMap 으로는 표현할 수 없던 것
console.log(NonEmptyList.reduceMap(Semigroup.lookup('first'), x => x, nel));  // 3
console.log(NonEmptyList.reduceMap(Semigroup.lookup('last'), x => x, nel));   // 4

// 같은 규칙을 foldMap 에 넣으면 여전히 거부된다 — Monoid 가 아니라서
let thrown = '';
try { foldMap(Foldable.lookup('array'), Semigroup.lookup('first')); }
catch (e) { thrown = e.message; }
console.log(thrown);   // foldMap: second argument must be a Monoid

// reduceLeft — 초기값 없이 head 부터
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

// 서명이 곧 계약 — NonEmptyList 를 받는 함수는 빈 경우를 고려하지 않는다.
// (JS 는 타입을 강제하지 않는다 — 계약을 지키는 쪽은 fromArray 로 만들어 넘기는 호출자다)
const pickLeader = candidates => candidates.head;   // 검사 없음 — 계약이 대신한다
const report = candidates =>
    '대표: ' + pickLeader(candidates) + ' / 총 ' + candidates.toArray().length + '명';

// 걱정은 경계 한 곳에서만 — 안쪽 함수들은 전부 검사 없이 이어진다
console.log(Maybe.fold(() => '후보가 없다', report, NonEmptyList.fromArray(['갑', '을'])));
// 대표: 갑 / 총 2명
console.log(Maybe.fold(() => '후보가 없다', report, NonEmptyList.fromArray([])));
// 후보가 없다
```

## See also

- [Semigroup](./Semigroup.md) — the combining rule `reduceMap` takes (no identity element needed)
- [Monoid](./Monoid.md) — the contrast with what `foldMap` requires
- [Maybe](./Maybe.md) — comes out only at the boundary (`fromArray`)
