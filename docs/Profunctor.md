# Profunctor

입력과 출력 모두를 변환할 수 있는 타입 클래스 (bifunctor의 반공변 버전).

## 정의

```javascript
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

```javascript
// identity
promap(x => x, x => x, p) ≡ p

// composition
promap(f, g, promap(h, i, p)) ≡ promap(x => h(f(x)), x => g(i(x)), p)
```

## 예시: 함수

```javascript
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

## 참고

- [Functor](./Functor.md) - 출력 변환
- [Contravariant](./Contravariant.md) - 입력 변환
- [Bifunctor](./Bifunctor.md) - 두 출력 변환 (공변)
