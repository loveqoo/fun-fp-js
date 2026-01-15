# Maybe

**null을 안전하게 다루는 타입**

## 개념

Maybe는 **값이 있을 수도, 없을 수도 있는 상황**을 표현합니다.

- `Just(value)`: 값이 있음
- `Nothing`: 값이 없음 (null, undefined 대체)

## 왜 Maybe인가?

### 문제: null 체크 지옥

```javascript
const getCity = user => {
    if (user === null) return null;
    if (user.address === null) return null;
    if (user.address.city === null) return null;
    return user.address.city;
};
```

### 해결: Maybe로 깔끔하게

```javascript
const { Maybe, Functor, Chain } = FunFP;
const { map } = Functor.of('maybe');
const { chain } = Chain.of('maybe');

const getCity = user =>
    map(
        a => a.city,
        chain(
            u => u.address ? Maybe.of(u.address) : Maybe.Nothing(),
            Maybe.of(user)
        )
    );

// 또는 Maybe.pipeK 사용 (더 가독성 좋음)
const getCityPipeK = Maybe.pipeK(
    u => u.address ? Maybe.of(u.address) : Maybe.Nothing(),
    a => a.city ? Maybe.of(a.city) : Maybe.Nothing()
);

// 또는 extra.path 사용
extra.path('address.city')(user);  // Either 반환
```

## 생성

```javascript
import FunFP from 'fun-fp-js';
const { Maybe } = FunFP;

// 값으로 Just 생성
const just = Maybe.of(5);           // Just(5)
const alsoJust = Maybe.Just(5);     // Just(5)

// Nothing 생성
const nothing = Maybe.Nothing();    // Nothing

// null/undefined는 자동으로 Nothing (fromNullable 패턴)
const safe = val => val == null ? Maybe.Nothing() : Maybe.Just(val);
safe(5);         // Just(5)
safe(null);      // Nothing
safe(undefined); // Nothing
```

## 주요 연산

### map - 값 변환 (Functor)

```javascript
const { Functor } = FunFP;
const { map } = Functor.of('maybe');

map(x => x * 2, Maybe.of(5));       // Just(10)
map(x => x * 2, Maybe.Nothing());   // Nothing (함수 실행 안 됨)
```

### chain - 중첩 방지 (Monad)

```javascript
const { Chain } = FunFP;
const { chain } = Chain.of('maybe');

const double = x => x > 0 ? Maybe.of(x * 2) : Maybe.Nothing();

chain(double, Maybe.of(5));      // Just(10)
chain(double, Maybe.of(-5));     // Nothing
chain(double, Maybe.Nothing());  // Nothing
```

### fold - 값 추출

```javascript
Maybe.fold(
    () => 'default',        // Nothing일 때
    value => `Got: ${value}`,  // Just일 때
    Maybe.of(5)
);
// 'Got: 5'

Maybe.fold(
    () => 'default',
    value => `Got: ${value}`,
    Maybe.Nothing()
);
// 'default'
```

### getOrElse 패턴 (fold 활용)

```javascript
// getOrElse는 fold로 구현
const getOrElse = (defaultVal, maybe) => 
    Maybe.fold(() => defaultVal, v => v, maybe);

getOrElse(0, Maybe.of(5));       // 5
getOrElse(0, Maybe.Nothing());   // 0
```

## 타입 체크

```javascript
Maybe.isJust(Maybe.of(5));      // true
Maybe.isNothing(Maybe.of(5));   // false
Maybe.isMaybe(Maybe.of(5));     // true
Maybe.isMaybe({});              // false
```

## 실용적 예시

### 안전한 배열 접근

```javascript
const head = arr => arr.length > 0 ? Maybe.of(arr[0]) : Maybe.Nothing();
const tail = arr => arr.length > 0 ? Maybe.of(arr.slice(1)) : Maybe.Nothing();

head([1, 2, 3]);     // Just(1)
head([]);            // Nothing

// 체이닝
head([1, 2, 3])
    .chain(x => head([x + 10, x + 20]))
    .map(x => x * 2);
// Just(22)
```

### 안전한 객체 속성 접근

```javascript
const prop = key => obj => 
    obj && obj[key] != null ? Maybe.of(obj[key]) : Maybe.Nothing();

const user = { name: 'Alice', address: { city: 'Seoul' } };

prop('address')(user)
    .chain(prop('city'))
    .getOrElse('Unknown');
// 'Seoul'

const noAddress = { name: 'Bob' };
prop('address')(noAddress)
    .chain(prop('city'))
    .getOrElse('Unknown');
// 'Unknown'
```

### 안전한 JSON 파싱

```javascript
const parseJson = str => {
    try {
        return Maybe.of(JSON.parse(str));
    } catch {
        return Maybe.Nothing();
    }
};

parseJson('{"name": "Alice"}')
    .chain(prop('name'))
    .map(name => name.toUpperCase())
    .getOrElse('UNKNOWN');
// 'ALICE'

parseJson('invalid json')
    .chain(prop('name'))
    .map(name => name.toUpperCase())
    .getOrElse('UNKNOWN');
// 'UNKNOWN'
```

### 폼 값 검증 (pipeK 활용)

```javascript
const validateLength = min => str =>
    str.length >= min ? Maybe.of(str) : Maybe.Nothing();

const validatePattern = regex => str =>
    regex.test(str) ? Maybe.of(str) : Maybe.Nothing();

// Maybe.pipeK로 검증 파이프라인 구성
const validateEmail = Maybe.pipeK(
    validateLength(5),
    validatePattern(/^.+@.+\..+$/)
);

validateEmail('test@example.com');  // Just('test@example.com')
validateEmail('bad');                // Nothing
validateEmail('');                   // Nothing
```

## Maybe vs null

| | null | Maybe |
|---|---|---|
| 에러 발생 | `null.prop` → TypeError | Nothing.map() → Nothing |
| 체이닝 | 매번 null 체크 | 자동 단락 |
| 명시성 | 암묵적 | 타입으로 명시 |
| 합성 | 어려움 | 자연스러움 |

## Maybe를 Either로 변환

```javascript
// Nothing에 에러 메시지 추가하고 싶을 때
Maybe.toEither('Value not found', maybeValue);

Maybe.toEither('Not found', Maybe.of(5));    // Right(5)
Maybe.toEither('Not found', Maybe.Nothing()); // Left('Not found')
```

## 관련 타입 클래스

- **Functor**: map 제공
- **Apply**: ap 제공
- **Applicative**: of 제공
- **Chain**: chain 제공
- **Monad**: Applicative + Chain
- **Alt**: 대안 값 선택

## Maybe.pipe / Maybe.pipeK

Static Land 스타일로 읽기 쉽게 체이닝하기:

### Maybe.pipe - 함수들을 순차 적용

```javascript
const { map } = Functor.of('maybe');

Maybe.pipe(
    Maybe.of(user),
    m => map(u => u.address, m),
    m => map(a => a.city, m)
);
// Just('Seoul') 또는 Nothing
```

### Maybe.pipeK - Kleisli 합성 (chain용)

```javascript
// a -> Maybe b 형태의 함수들을 연결
const getAddress = user => user.address ? Maybe.of(user.address) : Maybe.Nothing();
const getCity = addr => addr.city ? Maybe.of(addr.city) : Maybe.Nothing();

const getCityFromUser = Maybe.pipeK(getAddress, getCity);

getCityFromUser({ name: 'Alice', address: { city: 'Seoul' } });  // Just('Seoul')
getCityFromUser({ name: 'Bob' });  // Nothing
```
