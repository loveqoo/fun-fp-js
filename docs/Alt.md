# Alt

**대안을 선택할 수 있는 타입**

## 개념

Alt는 **두 값 중 하나를 선택**하는 능력입니다. 첫 번째가 "실패"면 두 번째를 사용합니다.

- Maybe: Nothing이면 대안 사용
- Either: Left면 대안 사용
- Task: 실패시 대안 사용

## 인터페이스

```javascript
Alt.alt(a, b): Alt a
// a가 "성공"이면 a, 아니면 b
```

## 법칙

### 결합법칙 (Associativity)
```javascript
alt(alt(a, b), c) === alt(a, alt(b, c))
```

### 분배법칙 (Distributivity)
```javascript
map(f, alt(a, b)) === alt(map(f, a), map(f, b))
```

## 사용 예시

### Maybe - 기본값 제공

```javascript
import FunFP from 'fun-fp-js';
const { Alt, Maybe } = FunFP;

const { alt } = Alt.types.MaybeAlt;

alt(Maybe.of(5), Maybe.of(10));           // Just(5)
alt(Maybe.Nothing(), Maybe.of(10));       // Just(10)
alt(Maybe.Nothing(), Maybe.Nothing());    // Nothing
```

### Either - 에러 복구

```javascript
const { alt } = Alt.types.EitherAlt;

alt(Either.Right(5), Either.Right(10));   // Right(5)
alt(Either.Left('err'), Either.Right(10)); // Right(10)
```

### Task - 폴백

```javascript
const { alt } = Alt.types.TaskAlt;

const mainServer = Task.rejected('timeout');
const backupServer = Task.of({ data: 'from backup' });

alt(mainServer, backupServer).fork(
    console.error,
    data => console.log(data)  // { data: 'from backup' }
);
```

## 실용적 예시

### 다중 폴백

```javascript
const getFromCache = Maybe.Nothing();
const getFromDB = Maybe.Nothing();
const getDefault = Maybe.of({ default: true });

alt(getFromCache, alt(getFromDB, getDefault));
// Just({ default: true })
```

### 설정 우선순위

```javascript
const envConfig = process.env.CONFIG ? Maybe.of(JSON.parse(process.env.CONFIG)) : Maybe.Nothing();
const fileConfig = Maybe.of({ port: 3000 });
const defaultConfig = Maybe.of({ port: 8080 });

alt(envConfig, alt(fileConfig, defaultConfig));
// 환경변수 > 파일 > 기본값 순서로 시도
```

## Plus - Alt + zero

Plus는 Alt에 **빈 값(zero)**을 추가한 것입니다:

```javascript
const { Plus } = FunFP;

Plus.types.MaybePlus.zero();  // Nothing

// zero는 alt의 항등원
alt(a, zero) === a
alt(zero, a) === a
```

## 관련 타입 클래스

- **Plus**: Alt + zero
- **Alternative**: Applicative + Alt
