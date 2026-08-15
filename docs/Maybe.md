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
const user = { name: 'Alice', address: { city: 'Seoul' } };
const { Maybe, Functor, Chain } = FunFP;
const { map } = Functor.lookup('maybe');
const { chain } = Chain.lookup('maybe');

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
const { map } = Functor.lookup('maybe');

map(x => x * 2, Maybe.of(5));       // Just(10)
map(x => x * 2, Maybe.Nothing());   // Nothing (함수 실행 안 됨)
```

### chain - 중첩 방지 (Monad)

```javascript
const { Chain } = FunFP;
const { chain } = Chain.lookup('maybe');

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

// getOrElse 는 인스턴스 메서드가 아니다 — 위 "getOrElse 패턴" 의 헬퍼를 쓴다
const getOrElse = (defaultVal, maybe) => Maybe.fold(() => defaultVal, v => v, maybe);

getOrElse('Unknown', prop('address')(user).chain(prop('city')));
// 'Seoul'

const noAddress = { name: 'Bob' };
getOrElse('Unknown', prop('address')(noAddress).chain(prop('city')));
// 'Unknown'
```

### 안전한 JSON 파싱

```javascript
const prop = key => obj => 
    obj && obj[key] != null ? Maybe.of(obj[key]) : Maybe.Nothing();
const parseJson = str => {
    try {
        return Maybe.of(JSON.parse(str));
    } catch {
        return Maybe.Nothing();
    }
};

// getOrElse 는 인스턴스 메서드가 아니다 — 위 "getOrElse 패턴" 의 헬퍼를 쓴다
const getOrElse = (defaultVal, maybe) => Maybe.fold(() => defaultVal, v => v, maybe);

getOrElse('UNKNOWN',
    parseJson('{"name": "Alice"}').chain(prop('name')).map(name => name.toUpperCase())
);
// 'ALICE'

getOrElse('UNKNOWN',
    parseJson('invalid json').chain(prop('name')).map(name => name.toUpperCase())
);
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
const maybeValue = Maybe.of(42);
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
const user = { name: 'Alice', address: { city: 'Seoul' } };
const { map } = Functor.lookup('maybe');

Maybe.pipe(
    Maybe.of(user),
    m => map(u => u.address, m),
    m => map(a => a.city, m)
);
// Just('Seoul') 또는 Nothing
```

`Maybe.pipe` 는 범용 조합자 `pipeWhile` 위에 서 있습니다 — `pipeWhile(Maybe.isJust)` 가
그 몸이고, `Either.pipe` 도 같은 뼈대(`pipeWhile(Either.isRight)`)를 씁니다.

### pipeWhile - predicate 가 참인 동안만 잇는 pipe

상자와 무관한 최상위 유틸리티입니다. 각 걸음마다 predicate 를 먼저 묻고, 거짓이면 남은
함수를 건너뛰고 값을 그대로 내보냅니다. 값이 안 바뀌면 predicate 결과도 안 바뀌므로
한 번 거짓이 되면 사실상 멈춥니다.

```javascript
const { pipeWhile } = FunFP;

const capped = pipeWhile(x => x < 100)(
    2,
    x => x * 10,   // 2 → 20 (20 < 100, 계속)
    x => x * 10,   // 20 → 200 (200 은 100 을 넘어 여기서 멈춤)
    x => x + 1     // 건너뜀
);
if (capped !== 200) throw new Error('pipeWhile 이 멈추지 않았다: ' + capped);
console.log(capped);   // 200

// Maybe.pipe 와의 관계 — 같은 결과
const halveEven = m => m.chain(x => (x % 2 === 0 ? Maybe.Just(x / 2) : Maybe.Nothing()));
const viaPipe = Maybe.pipe(Maybe.of(8), halveEven, halveEven, halveEven);
const viaWhile = pipeWhile(Maybe.isJust)(Maybe.of(8), halveEven, halveEven, halveEven);
if (String(viaPipe) !== String(viaWhile)) throw new Error('둘이 어긋났다');
console.log(String(viaPipe));   // Just(1) — 8 → 4 → 2 → 1
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

## 출력에서 읽기 — `toString` {#tostring}

`Just(1)` 과 `Nothing()` 은 속만 보면 거의 같은 객체라, 문자열이 될 때 갈리게 해 두었습니다.
JSON 표현은 그대로입니다 — `_typeName` 은 타입 판정이 읽는 값이라 건드리지 않습니다.

```javascript
const { Maybe } = FunFP;

if (String(Maybe.Just(1)) !== 'Just(1)') throw new Error('Just 표기가 다르다');
if (String(Maybe.Nothing()) !== 'Nothing') throw new Error('Nothing 표기가 다르다');
if (String(Maybe.Just(Maybe.Just('a'))) !== 'Just(Just("a"))') throw new Error('중첩 표기가 다르다');
if (JSON.stringify(Maybe.Just(1)) !== '{"value":1,"_typeName":"Maybe"}') throw new Error('JSON 이 달라졌다');
console.log(`${Maybe.Just([1, 2])}`);   // Just([1,2])
```
