# Bifunctor

> English: [./en/Bifunctor.md](./en/Bifunctor.md)

**양쪽을 모두 변환할 수 있는 타입**

## 개념

Bifunctor는 **두 개의 타입 파라미터를 가진 컨테이너에서 양쪽 모두를 변환**할 수 있습니다.

대표적인 예가 Either:
- Left 값 변환
- Right 값 변환
- 동시에 양쪽 변환

## 인터페이스

```javascript no-run 시그니처·의사코드 표기
Bifunctor.bimap(f, g, a): Bifunctor c d
// f: a -> c  (Left/첫 번째 값 변환)
// g: b -> d  (Right/두 번째 값 변환)
```

## 법칙

### 항등 (Identity)
```javascript no-run 대수 법칙 — 자유변수 표기
const { bimap } = Bifunctor.lookup('either');
bimap(x => x, x => x, a) === a
```

### 합성 (Composition)
```javascript no-run 대수 법칙 — 자유변수 표기
const { bimap } = Bifunctor.lookup('either');
bimap(f, g, bimap(h, i, a)) === bimap(x => f(h(x)), x => g(i(x)), a)
```

## 사용 예시

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

### 튜플 — 길이가 정확히 둘이어야 합니다

튜플은 JavaScript 의 타입이 아니라 **길이가 2인 배열**입니다. 그래서 `.type` 은 사실 그대로
`'Array'` 로 두고, "둘인가" 는 인스턴스가 직접 봅니다.

```javascript
const { Bifunctor } = FunFP;

const { bimap } = Bifunctor.lookup('tuple');

console.log(bimap(n => n * 2, s => s + '!', [1, 'a']));   // [ 2, 'a!' ]

try { console.log(bimap(n => n * 2, s => s + '!', [1, 2, 3])); }
catch (e) { console.log(e.message); }   // 'Bifunctor.bimap: tuple must have exactly 2 elements, got 3'
```

**이 검사는 느슨한 모드에서도 살아 있습니다**(실측). 느슨한 모드가 놓아주는 것은 타입 검사인데,
빈 배열에서 `[NaN, NaN]` 이 나오는 것은 타입 문제가 아니라 **결함**이기 때문입니다.

## 실용적 예시

### 에러 정규화

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

### 양쪽에 컨텍스트 추가

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

## mapLeft - 왼쪽만 변환

```javascript
const { bimap } = Bifunctor.lookup('either');
const mapLeft = (f, either) => bimap(f, x => x, either);

mapLeft(err => `Error: ${err}`, Either.Left('oops'));
// Left('Error: oops')
```

## 관련 타입 클래스

- **Functor**: 한쪽만 변환 (Right)
- **Profunctor**: 함수에서의 양방향 변환
