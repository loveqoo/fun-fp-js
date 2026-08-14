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

| 키 | 어디에 쓰이나 |
| --- | --- |
| `function` | optics 의 `over` / `set` |
| `forget(<모노이드키>)` | optics 의 `view` / `preview` / `toList` — `Wander.Forget(monoid)` 로 만든다 |
| `tagged` | optics 의 `review` — **`Choice` 에만 있다** |

`tagged` 가 `Strong`·`Wander` 에 **없는 것**이 곧 "Lens 와 Traversal 은 `review` 할 수
없다" 입니다.

```javascript
const { Strong, Choice, Wander, Monoid, Optics } = FunFP;

const F = Wander.Forget(Monoid.lookup('array'));
console.log(F.first(a => [a])([7, 9]));          // [ 7 ]   왼쪽만 모은다
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
