# Bifunctor

> 한국어: [../Bifunctor.md](../Bifunctor.md)

**A type that can transform both sides**

## Concept

A Bifunctor is a **container with two type parameters where both can be
transformed**.

The typical example is Either:
- transforming the Left value
- transforming the Right value
- transforming both at once

## Interface

```javascript no-run 시그니처·의사코드 표기
Bifunctor.bimap(f, g, a): Bifunctor c d
// f: a -> c  (Left/첫 번째 값 변환)
// g: b -> d  (Right/두 번째 값 변환)
```

## Laws

### Identity
```javascript no-run 대수 법칙 — 자유변수 표기
const { bimap } = Bifunctor.lookup('either');
bimap(x => x, x => x, a) === a
```

### Composition
```javascript no-run 대수 법칙 — 자유변수 표기
const { bimap } = Bifunctor.lookup('either');
bimap(f, g, bimap(h, i, a)) === bimap(x => f(h(x)), x => g(i(x)), a)
```

## Usage examples

### Either

```javascript
import FunFP from 'fun-fp-js';
const { Bifunctor, Either } = FunFP;

const { bimap } = Bifunctor.lookup('either');

// Right 변환
bimap(
    err => err.toUpperCase(),  // Left용
    val => val * 2,            // Right용
    Either.Right(5)
);
// Right(10)

// Left 변환
bimap(
    err => err.toUpperCase(),
    val => val * 2,
    Either.Left('error')
);
// Left('ERROR')
```

### Tuple — must have exactly two elements

A tuple is not a distinct JavaScript type — it is an **array of length 2**.
So `.type` honestly stays `'Array'`, and "is it two?" is checked by the
instance itself.

```javascript
const { Bifunctor } = FunFP;

const { bimap } = Bifunctor.lookup('tuple');

console.log(bimap(n => n * 2, s => s + '!', [1, 'a']));   // [ 2, 'a!' ]

try { console.log(bimap(n => n * 2, s => s + '!', [1, 2, 3])); }
catch (e) { console.log(e.message); }   // 'Bifunctor.bimap: tuple must have exactly 2 elements, got 3'
```

**This check stays alive even in loose mode** (verified). What loose mode lets
go of is type checking — and getting `[NaN, NaN]` out of an empty array is not
a type problem, it is a **bug**.

## Practical examples

### Normalizing errors

```javascript
const { bimap } = Bifunctor.lookup('either');
const input = '{"value":1}';
const parseData = raw => raw ? Either.Right(JSON.parse(raw)) : Either.Left('빈 입력');
const normalizeError = err => ({
    message: err.message || String(err),
    timestamp: Date.now()
});

const formatResult = data => ({
    data,
    success: true
});

const result = parseData(input);

bimap(normalizeError, formatResult, result);
// Left면: Left({ message: '...', timestamp: ... })
// Right면: Right({ data: ..., success: true })
```

### Adding context to both sides

```javascript
const { bimap } = Bifunctor.lookup('either');

// Task 에는 Bifunctor 인스턴스가 없다 — 양쪽 변환은 Either 에서 한다
const fetchUser = id => id > 0
    ? Either.Right({ id, name: 'Alice' })
    : Either.Left({ code: 'INVALID_ID' });

const addContext = context => result =>
    bimap(
        err => ({ ...err, context }),
        data => ({ ...data, context }),
        result
    );

addContext('user-service')(fetchUser(1));
```

## map vs bimap

```javascript
const { bimap } = Bifunctor.lookup('either');
const { map } = Functor.lookup('either');

// map은 Right(성공)만 변환
map(x => x * 2, Either.Right(5));     // Right(10)
map(x => x * 2, Either.Left('err'));  // Left('err') - 변환 안 됨

// bimap은 양쪽 모두 변환
bimap(e => e.toUpperCase(), x => x * 2, Either.Left('err'));
// Left('ERR')
```

## mapLeft - transforming only the left side

```javascript
const { bimap } = Bifunctor.lookup('either');
const mapLeft = (f, either) => bimap(f, x => x, either);

mapLeft(err => `Error: ${err}`, Either.Left('oops'));
// Left('Error: oops')
```

## Related type classes

- **Functor**: transforms only one side (Right)
- **Profunctor**: bidirectional transformation on functions
