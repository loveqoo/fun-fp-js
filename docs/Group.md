# Group

Monoid에 역원(invert)을 추가한 타입 클래스.

## 정의

```javascript
class Group extends Monoid {
    constructor(monoid, invert, type, registry, ...aliases)
}
```

## 핵심 연산

| 연산 | 시그니처 | 설명 |
|-----|---------|-----|
| `invert` | `a → a` | 역원 반환 |
| `concat` | (Monoid) | 결합 연산 |
| `empty` | (Monoid) | 항등원 |

## 법칙

```javascript
// right inverse
concat(a, invert(a)) ≡ empty()

// left inverse
concat(invert(a), a) ≡ empty()
```

## 예시: 정수 덧셈 그룹

```javascript
const { Group, Semigroup, Monoid, Symbols } = FunFP;

// Semigroup: 덧셈
const addSemi = new Semigroup((a, b) => a + b, 'number');

// Monoid: 덧셈 + 항등원(0)
const addMonoid = new Monoid(addSemi, () => 0, 'number');

// Group: 덧셈 + 역원(부호 반전)
const addGroup = new Group(addMonoid, a => -a, 'number');

addGroup.concat(5, 3);      // 8
addGroup.invert(5);         // -5
addGroup.concat(5, addGroup.invert(5));  // 0 (empty)
```

## 예시: 불리언 XOR 그룹

```javascript
// XOR은 자기 자신이 역원
const xorSemi = new Semigroup((a, b) => a !== b, 'boolean');
const xorMonoid = new Monoid(xorSemi, () => false, 'boolean');
const xorGroup = new Group(xorMonoid, a => a, 'boolean');  // 자기 자신이 역원

xorGroup.concat(true, xorGroup.invert(true));  // false (empty)
```

## 관계

```
Semigroup ──> Monoid ──> Group
                │          │
              empty      invert
```

## 참고

- [Semigroup](./Semigroup.md) - 결합 연산
- [Monoid](./Monoid.md) - 결합 + 항등원
