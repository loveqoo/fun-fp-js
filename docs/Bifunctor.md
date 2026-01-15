# Bifunctor

**양쪽을 모두 변환할 수 있는 타입**

## 개념

Bifunctor는 **두 개의 타입 파라미터를 가진 컨테이너에서 양쪽 모두를 변환**할 수 있습니다.

대표적인 예가 Either:
- Left 값 변환
- Right 값 변환
- 동시에 양쪽 변환

## 인터페이스

```javascript
Bifunctor.bimap(f, g, a): Bifunctor c d
// f: a -> c  (Left/첫 번째 값 변환)
// g: b -> d  (Right/두 번째 값 변환)
```

## 법칙

### 항등 (Identity)
```javascript
bimap(x => x, x => x, a) === a
```

### 합성 (Composition)
```javascript
bimap(f, g, bimap(h, i, a)) === bimap(x => f(h(x)), x => g(i(x)), a)
```

## 사용 예시

### Either

```javascript
import FunFP from 'fun-fp-js';
const { Bifunctor, Either } = FunFP;

const { bimap } = Bifunctor.of('either');

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

## 실용적 예시

### 에러 정규화

```javascript
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

### 양쪽에 컨텍스트 추가

```javascript
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
const { map } = Functor.of('either');

// map은 Right(성공)만 변환
map(x => x * 2, Either.Right(5));     // Right(10)
map(x => x * 2, Either.Left('err'));  // Left('err') - 변환 안 됨

// bimap은 양쪽 모두 변환
bimap(e => e.toUpperCase(), x => x * 2, Either.Left('err'));
// Left('ERR')
```

## mapLeft - 왼쪽만 변환

```javascript
const mapLeft = (f, either) => bimap(f, x => x, either);

mapLeft(err => `Error: ${err}`, Either.Left('oops'));
// Left('Error: oops')
```

## 관련 타입 클래스

- **Functor**: 한쪽만 변환 (Right)
- **Profunctor**: 함수에서의 양방향 변환
