# Semigroupoid & Category

**함수 합성을 추상화한 타입**

## Semigroupoid

### 개념

Semigroupoid는 **compose(합성) 연산**을 제공하는 타입입니다. 함수 합성의 일반화입니다.

```javascript
// 함수 합성
const compose = (f, g) => x => f(g(x))
// f ∘ g: 먼저 g를 실행하고 결과를 f에 전달
```

### 법칙

#### 결합법칙 (Associativity)
```javascript
compose(f, compose(g, h)) === compose(compose(f, g), h)
```

### 사용 예시

```javascript
import FunFP from 'fun-fp-js';
const { Semigroupoid } = FunFP;

const { compose } = Semigroupoid.types.FunctionSemigroupoid;

const addOne = x => x + 1;
const double = x => x * 2;

const combined = compose(addOne, double);
combined(5);  // addOne(double(5)) = addOne(10) = 11
```

---

## Category

### 개념

Category는 Semigroupoid에 **항등원(id)**을 추가한 것입니다.

```javascript
// id: 아무것도 안 하는 함수
const id = x => x;
```

### 법칙

#### 좌항등 (Left Identity)
```javascript
compose(id, f) === f
```

#### 우항등 (Right Identity)
```javascript
compose(f, id) === f
```

### 사용 예시

```javascript
const { Category } = FunFP;

const { compose, id } = Category.types.FunctionCategory;

// id는 항등원
id(5);  // 5

// 합성해도 변화 없음
compose(id, double);  // double과 동일
compose(double, id);  // double과 동일
```

## 실용적 활용

### 함수 파이프라인

```javascript
const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);

const process = pipe(
    x => x + 1,
    x => x * 2,
    x => `Result: ${x}`
);

process(5);  // 'Result: 12'
```

### 조건부 합성

```javascript
const when = (cond, f) => cond ? f : id;

const maybeDouble = when(shouldDouble, double);
```

## 관련 타입 클래스

- **Semigroup**: 값의 결합 (Semigroupoid는 함수/화살표의 합성)
- **Monoid**: 값의 결합 + 항등원 (Category는 화살표의 합성 + 항등 화살표)
