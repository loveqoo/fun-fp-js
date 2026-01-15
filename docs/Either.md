# Either

**성공 또는 실패를 표현하는 타입**

## 개념

Either는 **두 가지 가능한 값 중 하나**를 표현합니다:

- `Right(value)`: 성공, 정상 값
- `Left(error)`: 실패, 에러 정보

Maybe와 달리 **실패의 이유**를 담을 수 있습니다.

## 왜 Either인가?

### 문제: try-catch 지옥

```javascript
let result;
try {
    const parsed = JSON.parse(data);
    try {
        const validated = validate(parsed);
        try {
            result = transform(validated);
        } catch (e) {
            result = handleTransformError(e);
        }
    } catch (e) {
        result = handleValidationError(e);
    }
} catch (e) {
    result = handleParseError(e);
}
```

### 해결: Either로 우아하게

```javascript
const { Either, Chain } = FunFP;
const { chain } = Chain.of('either');

const result = Either.fold(
    handleError,
    value => value,
    chain(transform,
        chain(validate,
            parseJson(data)
        )
    )
);

// 또는 Either.pipeK 사용 (더 가독성 좋음)
const process = Either.pipeK(parseJson, validate, transform);
const result = Either.fold(handleError, value => value, process(data));
```

## 생성

```javascript
import FunFP from 'fun-fp-js';
const { Either } = FunFP;

// 성공 (Right)
const right = Either.Right(42);
const alsoRight = Either.of(42);  // of는 항상 Right

// 실패 (Left)
const left = Either.Left('Something went wrong');

// null 체크
Either.fromNullable(5);         // Right(5)
Either.fromNullable(null);      // Left(null)

// try-catch 래핑
Either.catch(() => JSON.parse('{"a": 1}'));  // Right({a: 1})
Either.catch(() => JSON.parse('invalid'));    // Left(SyntaxError)
```

## 주요 연산

### map - 성공 값 변환 (Functor)

```javascript
const { Functor } = FunFP;
const { map } = Functor.of('either');

map(x => x * 2, Either.Right(5));       // Right(10)
map(x => x * 2, Either.Left('error'));  // Left('error') - 변환 안 됨
```

### chain - 중첩 방지 (Monad)

```javascript
const { Chain } = FunFP;
const { chain } = Chain.of('either');

const validatePositive = n =>
    n > 0 ? Either.Right(n) : Either.Left('Must be positive');

chain(validatePositive, Either.Right(5));    // Right(5)
chain(validatePositive, Either.Right(-5));   // Left('Must be positive')
chain(validatePositive, Either.Left('error')); // Left('error')
```

### fold - 양쪽 처리

```javascript
const result = Either.fold(
    error => `Error: ${error}`,    // Left일 때
    value => `Success: ${value}`,  // Right일 때
    Either.Right(5)
);
// 'Success: 5'

Either.fold(
    error => `Error: ${error}`,
    value => `Success: ${value}`,
    Either.Left('oops')
);
// 'Error: oops'
```

### bimap - 양쪽 모두 변환 (Bifunctor)

```javascript
const { bimap } = Bifunctor.of('either');

bimap(
    err => err.toUpperCase(),  // Left 변환
    val => val * 2,            // Right 변환
    Either.Right(5)
);
// Right(10)

bimap(
    err => err.toUpperCase(),
    val => val * 2,
    Either.Left('error')
);
// Left('ERROR')
```

## 타입 체크

```javascript
Either.isRight(Either.Right(5)); // true
Either.isLeft(Either.Left('e')); // true
Either.isEither(Either.Right(5)); // true
Either.isEither({});             // false
```

## 실용적 예시

### 입력 검증 파이프라인 (pipeK 활용)

```javascript
const validateEmail = email => {
    if (!email) return Either.Left('Email is required');
    if (!email.includes('@')) return Either.Left('Invalid email format');
    return Either.Right(email);
};

const validateName = name => {
    if (!name) return Either.Left('Name is required');
    if (name.length < 2) return Either.Left('Name too short');
    return Either.Right(name);
};

const toUpperCase = str => Either.Right(str.toUpperCase());

// Either.pipeK로 검증 파이프라인 구성
const validateAndTransformEmail = Either.pipeK(
    validateEmail,
    toUpperCase
);

validateAndTransformEmail('alice@email.com');  // Right('ALICE@EMAIL.COM')
validateAndTransformEmail('invalid');          // Left('Invalid email format')
validateAndTransformEmail('');                  // Left('Email is required')
```

### API 응답 처리

```javascript
const parseResponse = response => {
    if (response.status >= 400) {
        return Either.Left({ 
            status: response.status, 
            message: response.statusText 
        });
    }
    return Either.Right(response.data);
};

const extractUser = data => {
    if (!data.user) return Either.Left('No user in response');
    return Either.Right(data.user);
};

const processApiCall = response =>
    parseResponse(response)
        .chain(extractUser)
        .map(user => ({ ...user, processed: true }))
        .fold(
            error => ({ success: false, error }),
            data => ({ success: true, data })
        );
```

### 설정 파일 로딩

```javascript
const readFile = path => {
    try {
        return Either.Right(fs.readFileSync(path, 'utf8'));
    } catch (e) {
        return Either.Left(`Cannot read file: ${path}`);
    }
};

const parseConfig = content =>
    Either.catch(() => JSON.parse(content))
        .mapLeft(e => `Invalid JSON: ${e.message}`);

const validateConfig = config => {
    if (!config.database) return Either.Left('Missing database config');
    if (!config.port) return Either.Left('Missing port config');
    return Either.Right(config);
};

const loadConfig = path =>
    readFile(path)
        .chain(parseConfig)
        .chain(validateConfig);

loadConfig('./config.json').fold(
    error => console.error('Config error:', error),
    config => console.log('Loaded config:', config)
);
```

### 에러 메시지 집계

```javascript
const validate = value => ({
    check: (pred, msg) => pred(value) ? Either.Right(value) : Either.Left([msg]),
    checkAll: (...checks) => checks.reduce(
        (acc, [pred, msg]) => acc.chain(() => 
            pred(value) ? Either.Right(value) : Either.Left([msg])
        ).mapLeft(errs => [...errs, ...(pred(value) ? [] : [msg])]),
        Either.Right(value)
    )
});

// 첫 에러만
validate('a').check(s => s.length > 5, 'Too short');
// Left(['Too short'])

// 모든 에러 수집 (별도 구현 필요)
```

## Either vs Maybe

| | Maybe | Either |
|---|---|---|
| 실패 정보 | 없음 (Nothing) | 있음 (Left) |
| 용도 | 선택적 값 | 에러 처리 |
| null 처리 | 완벽 | 가능 |
| 에러 메시지 | 불가 | 가능 |

## Either를 Maybe로 변환

```javascript
Either.toMaybe(Either.Right(5));       // Just(5)
Either.toMaybe(Either.Left('error'));  // Nothing
```

## 관련 타입 클래스

- **Functor**: map 제공
- **Bifunctor**: bimap 제공 (양쪽 변환)
- **Apply**: ap 제공
- **Applicative**: of 제공
- **Chain**: chain 제공
- **Monad**: Applicative + Chain
- **Alt**: 대안 값 선택

## Either.pipe / Either.pipeK

Static Land 스타일로 읽기 쉽게 체이닝하기:

### Either.pipe - 함수들을 순차 적용

```javascript
const { map } = Functor.of('either');

Either.pipe(
    Either.Right(5),
    e => map(x => x * 2, e),
    e => map(x => x + 1, e)
);
// Right(11)
```

### Either.pipeK - Kleisli 합성 (chain용)

```javascript
// a -> Either e b 형태의 함수들을 연결
const parseNumber = str => {
    const n = parseInt(str);
    return isNaN(n) ? Either.Left('Not a number') : Either.Right(n);
};

const validatePositive = n =>
    n > 0 ? Either.Right(n) : Either.Left('Must be positive');

const validateMax = max => n =>
    n <= max ? Either.Right(n) : Either.Left(`Must be <= ${max}`);

// 한 번에 연결
const validateNumber = Either.pipeK(
    parseNumber,
    validatePositive,
    validateMax(100)
);

validateNumber('50');   // Right(50)
validateNumber('abc');  // Left('Not a number')
validateNumber('-5');   // Left('Must be positive')
validateNumber('200');  // Left('Must be <= 100')
```
