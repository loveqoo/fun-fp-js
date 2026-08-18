# NonEmptyList

**비어 있을 수 없는 목록** — 비지 않음을 검사가 아니라 구조(head 자리)가 보증합니다

## 개념

배열은 언제든 비어 있을 수 있고, 그 가능성이 연산 셋을 반쪽으로 만듭니다: 첫 원소를
꺼내려면 `Maybe` 로 감싸야 하고, 접으려면 "없을 때의 답"(Monoid 의 항등원)이 있어야
하고, `extract`(Comonad) 는 빈 배열에서 `undefined` 를 줍니다. NonEmptyList 는 머리
자리(`head`)를 구조로 갖습니다 — 값이 최소 하나 있음을 타입이 보증하므로, 위의 값을
매번 다시 치르지 않습니다.

빈 배열이 들어올 수 있는 문은 `fromArray` 하나뿐이고, 거기서만 `Maybe` 가 나옵니다 —
경계에서 한 번 검사하면 안쪽에서는 다시 검사하지 않습니다.

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

## reduceLeft · reduceMap — Monoid 없이 접기

`foldMap` 은 빈 목록의 답을 위해 Monoid(항등원 있는 결합 규칙)를 요구합니다. 그래서
항등원이 있을 수 없는 `first`(앞의 것 남기기)·`last`(뒤의 것 남기기) Semigroup 은
`foldMap` 에 들어가지 못합니다. NonEmptyList 는 head 가 씨앗이 되므로 **Semigroup
만으로** 접습니다 — 그 문이 `reduceMap`(변환하고 결합)과 `reduceLeft`(초기값 없이
왼쪽부터)입니다. 이 접기의 소유자는 **Reducible** 타입 클래스입니다
(`Reducible.lookup('nonemptylist')` — Identity 와 같은 계약을 나눠 갖습니다).
아래의 `NonEmptyList.reduceLeft/reduceMap` 정적 문은 그 인스턴스로 가는 위임입니다.

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

## 인스턴스 13개, 그리고 의도된 부재 4개

Functor·Apply·Applicative·Chain·ChainRec·Monad·Semigroup·Alt·Foldable·**Reducible**·
Traversable·Extend·Comonad 가 등록되어 있습니다(`lookup('nonemptylist')`). 특히 `extract`(Comonad) 는
빈 경우가 없어 **항상 값을 주는 온전한 함수**입니다 — 배열 Comonad 의
`extract([]) === undefined` 구멍이 이 타입에는 없습니다.

```javascript
const { NonEmptyList, Comonad, Functor } = FunFP;

console.log(Comonad.lookup('nonemptylist').extract(NonEmptyList.make(7, 8)));  // 7
console.log(Functor.lookup('nonemptylist').map(x => x * 2, NonEmptyList.make(1, 2)).toArray());
// [ 2, 4 ]
```

**Monoid·Plus·Alternative·Filterable 은 의도적으로 없습니다** — 항등원도 `zero` 도
"빈 목록"이고, 거르기는 목록을 비울 수 있기 때문입니다. 이 부재가 이 타입의 존재
이유입니다: "Semigroup 이지만 Monoid 아님"이 `first`/`last` 라는 추상 인스턴스 둘이
아니라 만질 수 있는 데이터 타입으로 명부에 섭니다. 거르고 싶으면 `toArray` 로 나가는
것이 정직한 경로입니다.

## 언제 쓰고, 언제 안 쓰나

- **배열 + if 가 맞는 자리** — 한 함수 안에서 한 번 확인하고 끝나는 경우입니다.
  `if (arr.length === 0) return;` 이 가장 단순하고, NonEmptyList 로 바꿔서 좋아지는
  것이 없습니다.
- **NonEmptyList 가 맞는 자리** — "최소 하나는 있다"는 조건이 **함수 여럿을 건너
  다녀야 할 때**입니다. 배열을 주고받으면 받는 함수마다 빈 배열 걱정을 반복하지만,
  NonEmptyList 를 주고받으면 걱정은 목록이 처음 만들어지는 곳(`fromArray`) 한 번으로
  끝납니다. 검사를 없애는 도구가 아니라, **여러 번 하던 검사를 한 번으로 줄이는**
  도구입니다.

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

## 관련

- [Semigroup](./Semigroup.md) — `reduceMap` 이 받는 결합 규칙 (항등원 불필요)
- [Monoid](./Monoid.md) — `foldMap` 이 요구하는 것과의 대비
- [Maybe](./Maybe.md) — 경계(`fromArray`)에서만 나온다
