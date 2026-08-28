# Category

> English: [./en/Category.md](./en/Category.md)

Semigroupoid에 항등 함수(id)를 추가한 타입 클래스.

## 정의

```javascript no-run 시그니처·의사코드 표기
class Category extends Semigroupoid {
    constructor(semigroupoid, id, type, registry, ...aliases)
}
```

## 핵심 연산

| 연산 | 시그니처 | 설명 |
|-----|---------|-----|
| `id` | `() → (a → a)` | 항등 함수 |
| `compose` | (Semigroupoid) | 함수 합성 |

## 법칙

```javascript no-run 시그니처·의사코드 표기
// right identity
compose(f, id()) ≡ f

// left identity
compose(id(), f) ≡ f
```

## 예시

```javascript
const { Category, Semigroupoid } = FunFP;

// Semigroupoid: 함수 합성
const funcSemi = new Semigroupoid((f, g) => x => f(g(x)), 'function');

// Category: 함수 합성 + 항등 함수 — 항등 사상 자체를 넘긴다 (썽크 아님)
const funcCategory = new Category(funcSemi, x => x, 'function');

const double = x => x * 2;
const addOne = x => x + 1;

// compose는 오른쪽에서 왼쪽
console.log(funcCategory.compose(double, addOne)(5));  // 12   5 + 1 = 6, 6 * 2 = 12

// id는 항등 함수 — 합성해도 상대를 바꾸지 않는다
console.log(funcCategory.compose(double, funcCategory.id())(5));  // 10
console.log(funcCategory.compose(funcCategory.id(), double)(5));  // 10
```

## 관계

```
Semigroupoid ──> Category
       │             │
    compose         id
```

## 참고

- [Semigroupoid](./Semigroupoid.md) - 함수 합성
