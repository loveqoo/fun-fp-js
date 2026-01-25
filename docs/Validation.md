# Validation

**Monoid 기반 에러 누적 타입**

## 개념

Validation은 **여러 검증 실패를 모두 수집**하는 타입입니다.

- `Valid(value)`: 검증 성공
- `Invalid(errors, monoid)`: 검증 실패 (에러들을 Monoid로 누적)

Either와 달리 `ap` 연산에서 모든 에러를 수집하여 병렬 검증에 최적화되어 있습니다.

## 왜 Validation인가?

### 문제: Either는 첫 에러에서 중단

```javascript
// Either는 fail-fast: 첫 번째 Left에서 멈춤
const { Either, Apply } = FunFP;
const { ap } = Apply.of('either');

const validateEmail = email =>
    /.+@.+/.test(email) ? Either.Right(email) : Either.Left('Invalid email');

const validateAge = age =>
    age >= 18 ? Either.Right(age) : Either.Left('Must be 18+');

// Either.ap는 첫 Left를 만나면 중단
const e1 = Either.Left('Invalid email');
const e2 = Either.Left('Must be 18+');
ap(Either.Right(x => y => [x, y]), e1);
// Left('Invalid email') - e2의 에러는 보지 못함!
```

폼 검증 시 사용자는 **모든 에러를 한번에** 보고 싶지만, Either는 첫 에러만 보여줍니다.

### 해결: Validation으로 모든 에러 수집

```javascript
const { Validation, Apply } = FunFP;
const { ap } = Apply.of('validation');

const v1 = Validation.Invalid(['Invalid email']);
const v2 = Validation.Invalid(['Must be 18+']);

// Validation.ap는 Invalid들을 Monoid.concat으로 병합
ap(ap(Validation.Valid(x => y => [x, y]), v1), v2);
// Invalid(['Invalid email', 'Must be 18+']) - 모든 에러 수집!
```

Validation은 Applicative의 `ap`가 에러를 **누적**하므로 병렬 검증에 적합합니다.

## 생성

```javascript
import FunFP from 'fun-fp-js';
const { Validation } = FunFP;

// Valid 생성 (검증 성공)
const valid = Validation.of(5);           // Valid(5)
const alsoValid = Validation.Valid(42);   // Valid(42)

// Invalid 생성 (검증 실패)
const invalid = Validation.Invalid(['error1', 'error2']);
// Invalid(['error1', 'error2']) - 기본 Array Monoid 사용

// 커스텀 Monoid 지정
const { Monoid } = FunFP;
const stringMonoid = Monoid.of('string');
const stringInvalid = Validation.Invalid('error, ', stringMonoid);
// Invalid('error, ', stringMonoid) - String Monoid 사용

// Either에서 변환
const { Either } = FunFP;
Validation.fromEither(Either.Right(5));     // Valid(5)
Validation.fromEither(Either.Left(['err'])); // Invalid(['err'])
```

## 주요 연산 (Static Land 우선)

### map - 값 변환 (Functor)

```javascript
const { Functor } = FunFP;
const { map } = Functor.of('validation');

map(x => x * 2, Validation.Valid(5));          // Valid(10)
map(x => x * 2, Validation.Invalid(['error'])); // Invalid(['error']) - 함수 실행 안 됨

// 또는 Static 메서드
Validation.map(x => x * 2, Validation.Valid(5)); // Valid(10)
```

### ap - 에러 누적 (Apply)

**Validation의 핵심**: `ap`가 Invalid들을 Monoid로 병합합니다.

```javascript
const { Apply } = FunFP;
const { ap } = Apply.of('validation');

// 둘 다 Valid: 정상 적용
const vf = Validation.Valid(x => x * 2);
const va = Validation.Valid(5);
ap(vf, va); // Valid(10)

// 하나만 Invalid: 그 Invalid 반환
ap(Validation.Invalid(['error1']), Validation.Valid(5));
// Invalid(['error1'])

ap(Validation.Valid(x => x), Validation.Invalid(['error2']));
// Invalid(['error2'])

// 둘 다 Invalid: Monoid.concat으로 병합!
const vf2 = Validation.Invalid(['error1']);
const va2 = Validation.Invalid(['error2']);
ap(vf2, va2);
// Invalid(['error1', 'error2']) - 에러 누적!

// 또는 Static 메서드
Validation.ap(vf, va); // Valid(10)
```

### bimap - 양쪽 변환 (Bifunctor)

```javascript
const { Bifunctor } = FunFP;
const { bimap } = Bifunctor.of('validation');

// Valid는 오른쪽 함수 적용
bimap(
    errs => errs.map(e => e.toUpperCase()),
    v => v * 2,
    Validation.Valid(5)
);
// Valid(10)

// Invalid는 왼쪽 함수 적용 (에러 변환)
bimap(
    errs => errs.map(e => e.toUpperCase()),
    v => v * 2,
    Validation.Invalid(['error'])
);
// Invalid(['ERROR'])

// 또는 Static 메서드
Validation.bimap(
    errs => errs.map(e => `[ERROR] ${e}`),
    v => v + 1,
    Validation.Invalid(['oops'])
);
// Invalid(['[ERROR] oops'])
```

### fold - 패턴 매칭

```javascript
Validation.fold(
    errors => `Errors: ${errors.join(', ')}`,
    value => `Success: ${value}`,
    Validation.Valid(42)
);
// 'Success: 42'

Validation.fold(
    errors => `Errors: ${errors.join(', ')}`,
    value => `Success: ${value}`,
    Validation.Invalid(['oops', 'fail'])
);
// 'Errors: oops, fail'
```

### Validation.collect - 여러 검증자 조합

**가장 실용적인 메서드**: Either를 반환하는 검증 함수들을 조합하여 모든 에러를 수집합니다.

```javascript
const { Either } = FunFP;

// Either를 반환하는 검증 함수들
const validateName = name =>
    name.length >= 2 ? Either.Right(name) : Either.Left('Name too short');

const validateAge = age =>
    age >= 18 ? Either.Right(age) : Either.Left('Must be 18+');

// 검증자들을 조합하여 Validation 반환 함수 생성
const validateUser = Validation.collect(
    validateName,
    validateAge
)((name, age) => ({ name, age }));

// 모든 검증 통과
validateUser('Kim', 20);
// Valid({ name: 'Kim', age: 20 })

// 일부 실패
validateUser('Kim', 15);
// Invalid(['Must be 18+'])

// 모두 실패 - 모든 에러 수집!
validateUser('K', 15);
// Invalid(['Name too short', 'Must be 18+'])
```

`collect`는 내부적으로 `ap`를 사용하여 에러를 누적합니다.

## 인스턴스 메서드 (편의 기능)

Static Land 및 Static 메서드 이후에 추가된 편의 메서드입니다.

```javascript
// map
Validation.Valid(5).map(x => x * 2);  // Valid(10)

// toEither 변환
Validation.Valid(42).toEither();           // Right(42)
Validation.Invalid(['err']).toEither();    // Left(['err'])
```

## 타입 체크

```javascript
Validation.isValidation(Validation.Valid(5));    // true
Validation.isValidation(Validation.Invalid([])); // true
Validation.isValidation({});                     // false

Validation.isValid(Validation.Valid(5));         // true
Validation.isValid(Validation.Invalid([]));      // false

Validation.isInvalid(Validation.Invalid([]));    // true
Validation.isInvalid(Validation.Valid(5));       // false
```

## 실용적 예시

### 1. 사용자 등록 폼 검증 (모든 에러 표시)

```javascript
const { Either, Validation } = FunFP;

// 각 필드 검증 함수 (Either 반환)
const validateEmail = email => {
    if (!email) return Either.Left('Email is required');
    if (!/^.+@.+\..+$/.test(email)) return Either.Left('Invalid email format');
    return Either.Right(email);
};

const validatePassword = password => {
    if (!password) return Either.Left('Password is required');
    if (password.length < 8) return Either.Left('Password must be 8+ characters');
    if (!/[0-9]/.test(password)) return Either.Left('Password must contain a number');
    return Either.Right(password);
};

const validateAge = age => {
    if (age == null) return Either.Left('Age is required');
    if (age < 18) return Either.Left('Must be 18 or older');
    if (age > 120) return Either.Left('Invalid age');
    return Either.Right(age);
};

// Validation.collect로 조합
const validateRegistration = Validation.collect(
    validateEmail,
    validatePassword,
    validateAge
)((email, password, age) => ({ email, password, age }));

// 성공 케이스
validateRegistration('user@example.com', 'pass1234', 25);
// Valid({ email: 'user@example.com', password: 'pass1234', age: 25 })

// 실패 케이스 - 모든 에러 한번에 수집!
validateRegistration('', 'short', 15);
// Invalid([
//   'Email is required',
//   'Password must be 8+ characters',
//   'Must be 18 or older'
// ])

// 사용자에게 표시
const result = validateRegistration('bad', '123', 15);
Validation.fold(
    errors => {
        console.log('Please fix the following errors:');
        errors.forEach(err => console.log(`- ${err}`));
    },
    user => console.log('Registration successful:', user),
    result
);
// Please fix the following errors:
// - Invalid email format
// - Password must be 8+ characters
// - Must be 18 or older
```

### 2. API 파라미터 검증

```javascript
const { Either, Validation } = FunFP;

// 쿼리 파라미터 검증
const validateLimit = limit => {
    const num = parseInt(limit);
    if (isNaN(num)) return Either.Left('limit must be a number');
    if (num < 1) return Either.Left('limit must be positive');
    if (num > 100) return Either.Left('limit must be <= 100');
    return Either.Right(num);
};

const validateOffset = offset => {
    const num = parseInt(offset);
    if (isNaN(num)) return Either.Left('offset must be a number');
    if (num < 0) return Either.Left('offset must be non-negative');
    return Either.Right(num);
};

const validateSort = sort => {
    const valid = ['asc', 'desc'];
    if (!valid.includes(sort)) {
        return Either.Left(`sort must be one of: ${valid.join(', ')}`);
    }
    return Either.Right(sort);
};

// API 핸들러
const listUsers = (limitStr, offsetStr, sortStr) => {
    const validateParams = Validation.collect(
        validateLimit,
        validateOffset,
        validateSort
    )((limit, offset, sort) => ({ limit, offset, sort }));

    const result = validateParams(limitStr, offsetStr, sortStr);

    return Validation.fold(
        errors => ({ status: 400, body: { errors } }),
        params => ({ status: 200, body: fetchUsers(params) }),
        result
    );
};

listUsers('10', '0', 'asc');
// { status: 200, body: [...users...] }

listUsers('999', '-5', 'invalid');
// { status: 400, body: { errors: [
//   'limit must be <= 100',
//   'offset must be non-negative',
//   'sort must be one of: asc, desc'
// ]}}
```

### 3. 설정 파일 검증

```javascript
const { Either, Validation } = FunFP;

const validateHost = host =>
    host ? Either.Right(host) : Either.Left('host is required');

const validatePort = port => {
    if (!port) return Either.Left('port is required');
    const num = parseInt(port);
    if (isNaN(num)) return Either.Left('port must be a number');
    if (num < 1024 || num > 65535) {
        return Either.Left('port must be between 1024 and 65535');
    }
    return Either.Right(num);
};

const validateTimeout = timeout => {
    if (timeout == null) return Either.Right(5000); // 기본값
    const num = parseInt(timeout);
    if (isNaN(num)) return Either.Left('timeout must be a number');
    if (num < 0) return Either.Left('timeout must be positive');
    return Either.Right(num);
};

const validateConfig = Validation.collect(
    validateHost,
    validatePort,
    validateTimeout
)((host, port, timeout) => ({ host, port, timeout }));

// 설정 파일 로드
const loadConfig = configObj => {
    const result = validateConfig(
        configObj.host,
        configObj.port,
        configObj.timeout
    );

    return Validation.fold(
        errors => {
            throw new Error(`Invalid config:\n${errors.join('\n')}`);
        },
        config => config,
        result
    );
};

loadConfig({ host: 'localhost', port: 3000 });
// { host: 'localhost', port: 3000, timeout: 5000 }

loadConfig({ host: '', port: 'abc', timeout: -1 });
// Error: Invalid config:
// host is required
// port must be a number
// timeout must be positive
```

### 4. 커스텀 Monoid로 에러 메시지 연결

```javascript
const { Monoid, Validation, Apply } = FunFP;
const { ap } = Apply.of('validation');

// String Monoid로 에러 메시지를 문자열로 연결
const stringMonoid = Monoid.of('string');

const v1 = Validation.Invalid('Invalid email. ', stringMonoid);
const v2 = Validation.Invalid('Password too short. ', stringMonoid);
const v3 = Validation.Invalid('Age out of range.', stringMonoid);

// ap로 에러 누적
const result = ap(
    ap(
        ap(
            Validation.Valid(x => y => z => ({ x, y, z })),
            v1
        ),
        v2
    ),
    v3
);

Validation.fold(
    errors => console.log('Errors:', errors),
    val => console.log('Success:', val),
    result
);
// Errors: Invalid email. Password too short. Age out of range.
```

### 5. 중첩된 객체 검증

```javascript
const { Either, Validation } = FunFP;

// 중첩된 주소 검증
const validateStreet = street =>
    street ? Either.Right(street) : Either.Left('street is required');

const validateCity = city =>
    city ? Either.Right(city) : Either.Left('city is required');

const validateZip = zip => {
    if (!zip) return Either.Left('zip is required');
    if (!/^\d{5}$/.test(zip)) return Either.Left('zip must be 5 digits');
    return Either.Right(zip);
};

const validateAddress = Validation.collect(
    validateStreet,
    validateCity,
    validateZip
)((street, city, zip) => ({ street, city, zip }));

// 사용자 전체 검증
const validateUserWithAddress = (name, email, street, city, zip) => {
    const nameValidation = name
        ? Validation.Valid(name)
        : Validation.Invalid(['name is required']);

    const emailValidation = /.+@.+/.test(email)
        ? Validation.Valid(email)
        : Validation.Invalid(['invalid email']);

    const addressValidation = validateAddress(street, city, zip);

    // 모든 검증 결과 조합
    const { Apply } = FunFP;
    const { ap } = Apply.of('validation');

    return ap(
        ap(
            ap(
                Validation.Valid(n => e => a => ({ name: n, email: e, address: a })),
                nameValidation
            ),
            emailValidation
        ),
        addressValidation
    );
};

validateUserWithAddress('', 'bad', '', '', '123');
// Invalid([
//   'name is required',
//   'invalid email',
//   'street is required',
//   'city is required',
//   'zip must be 5 digits'
// ])
```

## Validation vs Either

| | Either | Validation |
|---|---|---|
| 에러 처리 | Fail-fast (첫 에러에서 중단) | 에러 누적 (모든 에러 수집) |
| 사용 목적 | 순차 파이프라인 | 병렬 검증 |
| Applicative `ap` | 첫 Left 반환 | Left들을 Monoid.concat |
| Chain/Monad | 지원 (pipeK, chain) | 지원 안 함 (에러 누적과 충돌) |
| 적합한 사례 | 데이터 변환 파이프라인 | 폼 검증, API 파라미터 검증 |

**선택 기준:**
- **Either**: 단계별 변환에서 실패 시 즉시 중단하고 싶을 때
- **Validation**: 여러 검증을 동시에 수행하고 모든 에러를 수집하고 싶을 때

## Either와의 변환

```javascript
const { Either, Validation } = FunFP;

// Either → Validation
const either = Either.Left(['error1']);
Validation.fromEither(either);
// Invalid(['error1'])

// Validation → Either
const valid = Validation.Valid(42);
valid.toEither();
// Right(42)

const invalid = Validation.Invalid(['error1', 'error2']);
invalid.toEither();
// Left(['error1', 'error2'])
```

**변환 시나리오:**
1. **Either → Validation**: 기존 Either 기반 검증 함수를 `Validation.collect`에서 사용
2. **Validation → Either**: 검증 후 파이프라인에서 Either.chain 사용

## 관련 타입 클래스

Validation이 구현하는 타입 클래스:

- **Functor**: `map` - Valid 값 변환
- **Apply**: `ap` - 에러 누적의 핵심
- **Applicative**: `of` - Valid 생성
- **Bifunctor**: `bimap` - Valid/Invalid 양쪽 변환
- **Foldable**: `reduce` - Valid 값 축소

**주의**: Validation은 **Monad가 아닙니다**. `chain`이 에러 누적과 의미적으로 맞지 않기 때문입니다.
- Monad의 `chain`은 이전 결과에 따라 다음 연산을 결정 (순차적)
- Validation의 `ap`는 모든 검증을 독립적으로 수행 (병렬적)

## Validation.collect 내부 동작

`collect`가 어떻게 에러를 누적하는지 이해하기:

```javascript
// collect의 간소화된 구현
Validation.collect = (...validators) => f => (...args) => {
    // 각 validator를 실행하여 Validation으로 변환
    const validations = validators.map((validator, i) => {
        const result = validator(args[i]); // Either 반환
        return result.isRight()
            ? Validation.Valid(result.value)
            : Validation.Invalid([result.value]); // Array로 감싸기
    });

    // f를 커링하여 Validation에 담기
    const curriedF = curry(f, validators.length);
    const initialValidation = Validation.Valid(curriedF);

    // ap를 연속 적용하여 에러 누적
    return validations.reduce(
        (acc, v) => Apply.of('validation').ap(acc, v),
        initialValidation
    );
};

// 예시:
// validators = [validateEmail, validateAge]
// f = (email, age) => ({ email, age })
// args = ['bad', 15]

// Step 1: validators 실행
// [Invalid(['Invalid email']), Invalid(['Must be 18+'])]

// Step 2: reduce로 ap 연속 적용
// acc = Valid((email) => (age) => ({ email, age }))
// ap(acc, Invalid(['Invalid email']))
//   = Invalid(['Invalid email'])
// ap(Invalid(['Invalid email']), Invalid(['Must be 18+']))
//   = Invalid(['Invalid email', 'Must be 18+']) <- Monoid.concat!
```

## 관련 문서

**비슷한 타입:**
- [Either](./Either.md) - Validation은 Either의 에러 누적 버전

**사용하는 타입 클래스:**
- [Functor](./Functor.md)
- [Apply](./Apply.md)
- [Applicative](./Applicative.md)
- [Bifunctor](./Bifunctor.md)

**함께 사용:**
- [Monoid](./Monoid.md) - 에러 누적에 사용 (Array Monoid, String Monoid 등)
