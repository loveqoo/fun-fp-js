# Reducible

**비어 있을 수 없는 것을 접습니다.** `Foldable` 을 상속하고, 접는 규칙으로 Monoid 가
아니라 **Semigroup** 만 받습니다.

> Static Land 명세 밖입니다. cats 의 `Reducible` 과 같은 자리이며, 이 라이브러리가
> 필요해서 세운 클래스입니다. 근거는 [`internals.md`](./internals.md#reducible) 에 있습니다.

## 개념

`foldMap` 이 Monoid 를 요구하는 이유는 하나뿐입니다 — **빈 컨테이너가 들어왔을 때의 답.**
그것이 항등원입니다. 그런데 비어 있을 수 없는 컨테이너에는 그 질문 자체가 없습니다.
첫 원소가 씨앗이 되므로 "결합하는 법"만 있으면 접힙니다.

그래서 항등원이 없는 Semigroup 이 접기에 들어옵니다. `first`(앞의 것 남기기)와
`last`(뒤의 것 남기기)가 그런 규칙입니다 — 둘 다 항등원을 만들 수 없어 `foldMap` 에는
못 들어갔습니다.

```javascript
const { Reducible, Foldable, Semigroup, NonEmptyList, foldMap } = FunFP;

const R = Reducible.lookup('nonemptylist');
const nel = NonEmptyList.make(3, 9, 4);

console.log(R.reduceMap(Semigroup.lookup('first'), x => x, nel));   // 3
console.log(R.reduceMap(Semigroup.lookup('last'), x => x, nel));    // 4

// 같은 규칙을 foldMap 에 넣으면 거부됩니다 — Monoid 가 아니기 때문입니다
try { console.log(foldMap(Foldable.lookup('array'), Semigroup.lookup('first'))); }
catch (e) { console.log(e.message); }   // foldMap: second argument must be a Monoid
```

## 인터페이스

| 연산 | 서명 | 하는 일 |
| --- | --- | --- |
| `reduceLeft` | `(f, fa) => 값` | 초기값 없이 왼쪽부터 접습니다. 씨앗은 첫 원소입니다 |
| `reduceMap` | `(semigroup, f, fa) => 값` | 원소마다 `f` 를 적용한 뒤 Semigroup 으로 결합합니다 |

`Foldable` 을 상속하므로 `reduce` 도 그대로 있습니다. 초기값이 있는 접기가 필요하면
그쪽을 쓰면 됩니다.

```javascript
const { Reducible, NonEmptyList } = FunFP;

const R = Reducible.lookup('nonemptylist');
const nel = NonEmptyList.make(3, 9, 4);

console.log(R.reduceLeft((a, b) => a + b, nel));      // 16   초기값 없음
console.log(R.reduce((a, b) => a + b, 100, nel));     // 116  상속받은 Foldable
```

`reduceMap` 은 Monoid 를 줘도 받습니다 — Monoid 는 Semigroup 이기 때문입니다.
**항등원을 안 쓸 뿐입니다.**

```javascript
const { Reducible, Monoid, NonEmptyList } = FunFP;

const R = Reducible.lookup('nonemptylist');

console.log(R.reduceMap(Monoid.lookup('array'), x => [x], NonEmptyList.make(3, 9, 4)));
// [ 3, 9, 4 ]
```

## 등록된 인스턴스 둘

| 키 | 캐리어 | 왜 자격이 있나 |
| --- | --- | --- |
| `nonemptylist` | [NonEmptyList](./NonEmptyList.md) | head 자리가 있어 구조가 비지 않음을 보증합니다 |
| `identity` | Identity | 값을 반드시 하나 담습니다 — "비어 있을 수 없음"의 극한입니다 |

```javascript
const { Reducible, Semigroup, Identity } = FunFP;

const I = Reducible.lookup('identity');

console.log(I.reduceLeft((a, b) => a + b, Identity.of(7)));                  // 7
console.log(I.reduceMap(Semigroup.lookup('first'), x => x * 2, Identity.of(7)));  // 14
```

원소가 하나뿐이면 결합할 일이 없으므로 `f` 만 적용되고 Semigroup 은 호출되지 않습니다.

## 없는 것이 뜻입니다

`Array` 와 `Maybe` 는 여기 없습니다. **비어질 수 있어서 구조적으로 자격이 없습니다** —
`[]` 와 `Nothing` 에는 "첫 원소"가 없습니다. 이 부재가 클래스의 뜻이고, 그래서 등록은
막혀 있습니다.

```javascript
const { Reducible } = FunFP;

try { console.log(Reducible.lookup('array')); }
catch (e) { console.log(e.message); }   // Reducible.lookup: unsupported key array

try { console.log(Reducible.lookup('maybe')); }
catch (e) { console.log(e.message); }   // Reducible.lookup: unsupported key maybe
```

## 법칙

법칙 게이트가 등록된 인스턴스 둘에 대해 매번 확인합니다. 기준값은 **상속한
`Foldable.reduce` 로 모은 원소 목록**입니다 — 같은 컨테이너를 두 방법으로 접어 어긋나면
빨강입니다.

| 법칙 | 무엇을 고정하나 |
| --- | --- |
| 원소 보존 | `reduceMap(배열 Semigroup, x => [x], u)` 가 `reduce` 로 모은 목록과 같다 |
| `reduceLeft` 정합 | 첫 원소를 씨앗 삼아 왼쪽부터 접은 것과 같다 — 비가환 연산으로 확인하므로 방향이 틀리면 갈립니다 |
| `first` / `last` | 각각 첫 원소와 마지막 원소가 나온다 |

```javascript
const { Reducible, Semigroup, NonEmptyList } = FunFP;

const R = Reducible.lookup('nonemptylist');
const nel = NonEmptyList.make(3, 9, 4);
const elems = R.reduce((acc, x) => acc.concat([x]), [], nel);

// 원소 보존 — 두 경로가 같은 목록을 낸다
console.log(JSON.stringify(R.reduceMap(Semigroup.lookup('array'), x => [x], nel)));  // [3,9,4]
console.log(JSON.stringify(elems));                                                  // [3,9,4]

// reduceLeft 정합 — 비가환 연산이라 방향이 틀리면 값이 갈린다
const f = (a, b) => a * 10 + b;
console.log(R.reduceLeft(f, nel));                    // 394
console.log(elems.slice(1).reduce(f, elems[0]));      // 394
```

## 거부 문안

캐리어와 인자를 다른 타입 클래스와 같은 규율로 검사합니다.

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

## 데이터 타입의 정적 문

`NonEmptyList.reduceLeft` / `NonEmptyList.reduceMap` 은 이 인스턴스로 가는 **위임**입니다.
접기의 소유자는 `Reducible` 이고, 검증도 문안도 위에서 봅니다.

```javascript
const { Reducible, Semigroup, NonEmptyList } = FunFP;

const nel = NonEmptyList.make(3, 9, 4);

console.log(NonEmptyList.reduceLeft((a, b) => a + b, nel));                       // 16
console.log(Reducible.lookup('nonemptylist').reduceLeft((a, b) => a + b, nel));   // 16
```

## 관련 타입 클래스

- **[Foldable](./Foldable.md)**: 상위 클래스. 빈 경우가 있어 Monoid 를 요구합니다
- **[Semigroup](./Semigroup.md)**: `reduceMap` 이 받는 결합 규칙
- **[NonEmptyList](./NonEmptyList.md)**: 이 클래스가 생긴 계기가 된 데이터 타입
