# Semigroupoid & Category

> 한국어: [../Semigroupoid.md](../Semigroupoid.md)

**A type that abstracts function composition**

## Semigroupoid

### Concept

Semigroupoid is a type that provides a **compose operation**. It is a
generalization of function composition.

```javascript
// 함수 합성
const compose = (f, g) => x => f(g(x))
// f ∘ g: 먼저 g를 실행하고 결과를 f에 전달
```

> **Mind the direction** — this `compose` runs right-to-left (the math /
> Ramda convention, the same as `fp.compose`). The Static Land spec's
> `compose` runs in the **opposite** direction (left-to-right, first argument
> first), which matches this library's `pipe`. This is a deliberate
> departure in favor of the more familiar convention; the reasoning is in
> [`internals.md#compose-direction`](./internals.md#compose-direction).

### Laws

#### Associativity
```javascript no-run 대수 법칙 — 자유변수 표기
compose(f, compose(g, h)) === compose(compose(f, g), h)
```

### Usage example

```javascript
import FunFP from 'fun-fp-js';
const { Semigroupoid } = FunFP;

const { compose } = Semigroupoid.lookup('function');

const addOne = x => x + 1;
const double = x => x * 2;

const combined = compose(addOne, double);
combined(5);  // addOne(double(5)) = addOne(10) = 11
```

---

## Category

### Concept

Category adds an **identity element (`id`)** to Semigroupoid.

```javascript
// id: 아무것도 안 하는 함수
const id = x => x;
```

### Laws

#### Left Identity
```javascript no-run 대수 법칙 — 자유변수 표기
const id = x => x;
compose(id, f) === f
```

#### Right Identity
```javascript no-run 대수 법칙 — 자유변수 표기
compose(f, id) === f
```

### Usage example

```javascript
const double = x => x * 2;
const { Category } = FunFP;

const { compose, id } = Category.lookup('function');

// id는 항등원
id(5);  // 5

// 합성해도 변화 없음
compose(id, double);  // double과 동일
compose(double, id);  // double과 동일
```

## Practical applications

### Function pipeline

```javascript
const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);

const process = pipe(
    x => x + 1,
    x => x * 2,
    x => `Result: ${x}`
);

process(5);  // 'Result: 12'
```

### Conditional composition

```javascript
const double = x => x * 2;
const shouldDouble = true;
const when = (cond, f) => cond ? f : id;

const maybeDouble = when(shouldDouble, double);
```

## Related type classes

- **Semigroup**: combining values (Semigroupoid composes functions/arrows)
- **Monoid**: combining values + identity element (Category composes arrows + an identity arrow)
