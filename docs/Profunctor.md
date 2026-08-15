# Profunctor

입력과 출력 모두를 변환할 수 있는 타입 클래스 (bifunctor의 반공변 버전).

## 정의

```javascript no-run 시그니처·의사코드 표기
class Profunctor extends Algebra {
    constructor(promap, type, registry, ...aliases)
}
```

## 핵심 연산

| 연산 | 시그니처 | 설명 |
|-----|---------|-----|
| `promap` | `(a → b, c → d, F b c) → F a d` | 입력/출력 동시 변환 |

- 첫 번째 함수(`a → b`): 입력 변환 (contravariant)
- 두 번째 함수(`c → d`): 출력 변환 (covariant)

## 법칙

```javascript no-run 시그니처·의사코드 표기
// identity
promap(x => x, x => x, p) ≡ p

// composition
promap(f, g, promap(h, i, p)) ≡ promap(x => h(f(x)), x => g(i(x)), p)
```

## 예시: 함수

```javascript
const { promap } = Profunctor.lookup('function');
// 함수 (a → b)는 Profunctor의 대표적인 예시
// 입력은 contravariant, 출력은 covariant

const double = x => x * 2;

// promap: 입력 변환 + 출력 변환
const result = promap(
    str => parseInt(str),   // 입력: string → number
    n => `결과: ${n}`,      // 출력: number → string  
    double                   // 원래 함수: number → number
);

result('5');  // '결과: 10'
// '5' → parseInt → 5 → double → 10 → format → '결과: 10'
```

## 관계

```
Contravariant (입력 변환)  ─┐
                           ├── Profunctor
Functor (출력 변환)        ─┘
```

## 확장 셋 — `Strong` / `Choice` / `Wander` {#extensions}

**Static Land 명세에는 없습니다.** [Optics](./Optics.md) 가 요구해서 명시적으로 구현한
것이고, 이름은 표준을 따릅니다.

| 클래스 | 메서드 | 무엇을 더 할 수 있게 되나 |
| --- | --- | --- |
| `Strong` | `first` · `second` | 곱(짝)의 **한쪽만** 건드린다 → Lens |
| `Choice` | `left` · `right` | 합(`Either`)의 **한쪽만** 건드린다 → Prism |
| `Wander` | `wander` | 컨테이너 안 **모든 자리**를 건드린다 → Traversal |

`Wander` 는 `Strong` 과 `Choice` 를 둘 다 집니다.

```javascript
const { Strong, Choice, Wander, Either } = FunFP;

const S = Strong.lookup('function');
console.log(S.first(x => x * 10)([3, 'c']));     // [ 30, 'c' ]
console.log(S.second(x => x * 10)(['c', 3]));    // [ 'c', 30 ]

const C = Choice.lookup('function');
console.log(C.left(x => x * 10)(Either.Left(4)).value);    // 40
console.log(C.right(x => x * 10)(Either.Left(4)).value);   // 4   통과시킨다

console.log(Wander.lookup('function') instanceof Strong);  // true
```

### 등록된 인스턴스

| 키 | Profunctor | Strong | Choice | Wander | 어디에 쓰이나 |
| --- | :-: | :-: | :-: | :-: | --- |
| `function` | O | O | O | O | optics 의 `over` / `set` |
| `forget(<모노이드키>)` | O | O | O | O | optics 의 `view` / `preview` / `toList` — `Wander.Forget(monoid)` 로 만든다 |
| `tagged` | · | · | O | · | optics 의 `review` |

`tagged` 가 `Choice` 에만 있는 것은 **정말로 `first`·`wander` 가 없기 때문**이고, 그 부재가
곧 "Lens 와 Traversal 은 `review` 할 수 없다" 입니다.

`forget` 은 반대입니다 — `promap` 을 갖고 있으므로 **`Profunctor` 에도 있어야 합니다.**
한동안 그 층만 비어 있었는데 이유가 아무 데도 없었습니다. `Forget` 은 `Profunctor` 의
하위 개념이고(소유자, 2026-08-15) 명부가 그렇게 말해야 합니다.

```javascript
const { Profunctor, Wander, Monoid } = FunFP;

const F = Wander.Forget(Monoid.lookup('array'));
console.log(Profunctor.lookup('forget(array)') === F);   // true   네 층이 같은 인스턴스다
console.log(F.unwrap(F.promap(s => s.length, x => x, F.wrap(n => [n])))('abc'));
// [ 3 ]   입력만 손질된다 — 출력 쪽 함수는 버려진다
```

```javascript
const { Strong, Choice, Wander, Monoid, Optics } = FunFP;

const F = Wander.Forget(Monoid.lookup('array'));
console.log(F.type);                             // 'Forget(array)'  자기 타입이다
// 캐리어는 wrap 을 지난다 — 벌거벗은 함수는 FunctionWander 의 것이라 거부된다.
const p = F.wrap(a => [a]);
console.log(F.unwrap(F.first(p))([7, 9]));       // [ 7 ]   왼쪽만 모은다
console.log(Strong.lookup('forget(array)') === F);  // true  3단으로 등록된다

console.log(typeof Choice.lookup('tagged').first);  // 'undefined'
const aLens = Optics.Lens(o => o.a, (b, o) => ({ ...o, a: b }));
try { Optics.review(aLens, 1); }
catch (e) { console.log(e.message); }
// 'review: argument must be a Prism (a Lens cannot be reviewed)'
```

**자기 profunctor 를 만들어 optic 에 넣을 수도 있습니다.** optic 은 `promap` 과 필요한
메서드만 있으면 도는 평범한 함수입니다.

```javascript
const { Optics } = FunFP;

const nameLens = Optics.Lens(o => o.name, (v, o) => ({ ...o, name: v }));
const myP = {                                   // 등록 안 해도 된다
    promap: (f, g, p) => s => g(p(f(s))),
    first: p => ([a, c]) => [p(a), c],
};
console.log(nameLens(myP)(s => s.toUpperCase())({ name: 'a', age: 1 }));
// { name: 'A', age: 1 }
```

법칙과 한계(무엇이 검사되고 무엇이 안 되는지)는
[internals.md#optics](./internals.md#optics) 에 있습니다.

## 참고

- [Functor](./Functor.md) - 출력 변환
- [Contravariant](./Contravariant.md) - 입력 변환
- [Bifunctor](./Bifunctor.md) - 두 출력 변환 (공변)
- [Optics](./Optics.md) - 위 확장 셋을 실제로 쓰는 곳
