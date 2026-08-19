# Alt

> 한국어: [../Alt.md](../Alt.md)

**A type that can choose between alternatives**

## Concept

Alt is the ability to **choose one of two values**. If the first is a
"failure," the second is used.

- Maybe: falls back to the alternative on Nothing
- Either: falls back to the alternative on Left
- Task: falls back to the alternative on failure

## Interface

```javascript no-run 시그니처·의사코드 표기
Alt.alt(a, b): Alt a
// a가 "성공"이면 a, 아니면 b
```

## Laws

### Associativity
```javascript no-run 대수 법칙 — 자유변수 표기
const { alt } = Alt.lookup('maybe');
alt(alt(a, b), c) === alt(a, alt(b, c))
```

### Distributivity
```javascript no-run 대수 법칙 — 자유변수 표기
map(f, alt(a, b)) === alt(map(f, a), map(f, b))
```

## Usage examples

### Maybe - supplying a default

```javascript
import FunFP from 'fun-fp-js';
const { Alt, Maybe } = FunFP;

const { alt } = Alt.lookup('maybe');

alt(Maybe.of(5), Maybe.of(10));           // Just(5)
alt(Maybe.Nothing(), Maybe.of(10));       // Just(10)
alt(Maybe.Nothing(), Maybe.Nothing());    // Nothing
```

### Either - recovering from an error

```javascript
const { alt } = Alt.lookup('either');

alt(Either.Right(5), Either.Right(10));   // Right(5)
alt(Either.Left('err'), Either.Right(10)); // Right(10)
```

### Task - falling back

```javascript
const { alt } = Alt.lookup('task');

const mainServer = Task.rejected('timeout');
const backupServer = Task.of({ data: 'from backup' });

alt(mainServer, backupServer).fork(
    console.error,
    data => console.log(data)  // { data: 'from backup' }
);
```

## Practical examples

### Multiple fallbacks

```javascript
const { alt } = Alt.lookup('maybe');
const getFromCache = Maybe.Nothing();
const getFromDB = Maybe.Nothing();
const getDefault = Maybe.of({ default: true });

alt(getFromCache, alt(getFromDB, getDefault));
// Just({ default: true })
```

### Config priority

```javascript
const { alt } = Alt.lookup('maybe');
const envConfig = process.env.CONFIG ? Maybe.of(JSON.parse(process.env.CONFIG)) : Maybe.Nothing();
const fileConfig = Maybe.of({ port: 3000 });
const defaultConfig = Maybe.of({ port: 8080 });

alt(envConfig, alt(fileConfig, defaultConfig));
// 환경변수 > 파일 > 기본값 순서로 시도
```

## Plus - Alt + zero

Plus is Alt with a **zero value** added:

```javascript no-run 대수 법칙 — 자유변수 표기
const { alt } = Alt.lookup('maybe');
const { Plus } = FunFP;

Plus.lookup('maybe').zero();  // Nothing

// zero는 alt의 항등원
alt(a, zero) === a
alt(zero, a) === a
```

## Related type classes

- **Plus**: Alt + zero
- **Alternative**: Applicative + Alt
