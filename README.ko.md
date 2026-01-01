# Fun FP JS

JavaScript를 위한 가볍고 의존성 없는 함수형 프로그래밍 라이브러리.

**~795 줄**의 순수 함수형 코드.

## 특징

- 🎯 **함수형 코어** - `pipe`, `compose`, `curry` 등
- 🛡️ **Either 모나드** - try-catch 없이 안전한 에러 처리
- ⏳ **Task 모나드** - 지연 비동기 연산 (async Either)
- 🔢 **Monoid/Group** - 합성 가능한 대수 구조
- 🔄 **Free 모나드 & Trampoline** - 스택 안전 재귀
- 🔀 **Transducers** - 효율적인 데이터 처리 파이프라인
- 📝 **템플릿 엔진** - 안전한 중첩 객체 문자열 보간
- 🏷️ **타입 프로토콜** - Symbol 기반 타입 클래스 마커
- 📦 **의존성 제로** - 순수 JavaScript

## 설치

```javascript
const lib = require('./index.js')();

// 라이브러리는 네임스페이스로 구성됨:
const { core, either, task, monoid, free, extra } = lib;

// 커스텀 로거와 함께 사용
const libWithLog = require('./index.js')({ log: myLogger });
```

## 빠른 시작

```javascript
const { core, either, free } = require('./index.js')();
const { pipe } = core;
const { right, left } = either;
const { done, suspend, trampoline } = free;

// Either를 사용한 안전한 나눗셈
const safeDivide = (a, b) => 
    b === 0 ? left('0으로 나눌 수 없음') : right(a / b);

// 연산 합성
const result = right(10)
    .flatMap(x => safeDivide(x, 2))
    .map(x => x * 3)
    .getOrElse(0);

console.log(result); // 15

// Trampoline (스택 안전 재귀)
const factorial = trampoline((n, acc = 1) =>
    n <= 1 ? done(acc) : suspend(() => factorial(n - 1, n * acc))
);

factorial(10);      // 3628800
factorial(100000);  // 스택 오버플로 없음!
```

---

## 모듈

### 1. `core` - 함수형 코어 (~242 줄)

#### 타입 프로토콜

Functor, Applicative, Monad를 위한 Symbol 기반 타입 클래스 마커.

```javascript
const lib = require('./index.js')();
const { core, either } = lib;
const { Types, isFunctor, isApplicative, isMonad } = core;

// 타입 클래스 확인
isFunctor(either.right(5));     // true
isApplicative(either.right(5)); // true
isMonad(either.right(5));       // true

// 프로토콜을 사용한 커스텀 타입
class MyFunctor {
    [Types.Functor] = true;
    map(f) { /* ... */ }
}
```

#### 기본 함수

```javascript
const lib = require('./index.js')();
const { core } = lib;
const { identity, constant, tuple, raise, typeOf } = core;

identity(5);           // 5
constant(10)();        // 10
tuple(1, 2, 3);        // [1, 2, 3]
raise(new Error('x')); // Error 던짐

// typeOf: 생성자 이름을 포함한 향상된 typeof
typeOf(undefined);     // 'undefined'
typeOf(null);          // 'null'
typeOf(42);            // 'number'
typeOf([1, 2, 3]);     // 'Array'
typeOf(new Set());     // 'Set'
typeOf(new Date());    // 'Date'
```

#### 함수 합성

```javascript
const lib = require('./index.js')();
const { core } = lib;
const { pipe, compose } = core;

const add1 = x => x + 1;
const double = x => x * 2;

pipe(add1, double)(5);     // 12 = (5 + 1) * 2
compose(add1, double)(5);  // 11 = (5 * 2) + 1
```

#### 커링 & 부분 적용

```javascript
const lib = require('./index.js')();
const { core } = lib;
const { curry, curry2, uncurry, uncurry2, partial } = core;

const add = (a, b, c) => a + b + c;
const addCurried = a => b => c => a + b + c;

curry(add)(1)(2)(3);          // 6
uncurry(addCurried)(1, 2, 3); // 6

curry2((a, b) => a + b)(1)(2);    // 3
uncurry2(a => b => a + b)(1, 2);  // 3

partial(add, 10)(5, 3);           // 18
```

#### 고차 함수

```javascript
const lib = require('./index.js')();
const { core } = lib;
const { flip, flip2, flipC, flipCV, negate, once } = core;

// flip: 모든 인자 순서 뒤집기
const sub = (a, b, c) => a - b - c;
flip(sub)(1, 2, 10);     // 7 = 10 - 2 - 1

// flip2: 첫 두 인자 교환
const minus = (a, b) => a - b;
flip2(minus)(1, 10);     // 9 = 10 - 1

// negate: 술어 반전
const isEven = x => x % 2 === 0;
const isOdd = negate(isEven);
isOdd(3);                // true

// once: 한 번만 실행
const init = once(() => console.log('초기화됨'));
init(); init(); // 한 번만 로그
```

#### 에러 처리

```javascript
const lib = require('./index.js')();
const { core } = lib;
const { catch: runCatch, predicate } = core;

// catch: try-catch로 함수 감싸기
const safeJsonParse = runCatch(JSON.parse, err => ({}));
safeJsonParse('{"a":1}');  // { a: 1 }
safeJsonParse('invalid');  // {}

// predicate: 안전한 불리언 검사
const isPositive = predicate(x => x > 0);
isPositive(5);             // true
isPositive('숫자 아님');    // false (예외 던지지 않음)
```

#### 부수 효과

```javascript
const lib = require('./index.js')();
const { core, monoid } = lib;
const { tap, also, into, pipe, range } = core;

// tap: 부수 효과 실행 후 원래 값 반환
const result = pipe(
    x => x * 2,
    tap(console.log),  // 10 로그
    x => x + 1
)(5);
// result: 11

// also: 데이터 우선 tap
const user = { id: 1, name: 'Test' };
also(user)(
    u => console.log('저장 중:', u.id),
    u => console.log('추적 중:', u.name)
); // user 반환

// into: 데이터 우선 pipe
into(5)(
    range,                   // [0, 1, 2, 3, 4]
    list => list.map(x => x * 2),
    x => monoid.fold(monoid.number.sum)(x).getOrElse(0)
); // 20
```

#### Transducers (Point-free)

중간 배열 없이 효율적인 데이터 처리 파이프라인.

```javascript
const { core } = require('./index.js')();
const { compose, transducer: { map, filter, take, transduce } } = core;

// transducer 정의 (compose로 Left→Right 데이터 흐름)
const transducer = compose(
    map(x => x + 1),         // Step 1: 1 더하기
    filter(x => x % 2 === 0), // Step 2: 짝수만 유지
    take(2)                  // Step 3: 2개만 취함
);

// 실행: transduce(transducer)(reducer)(initialValue)(collection)
const reducer = (accumulator, value) => (accumulator.push(value), accumulator);
const initialValue = [];
const collection = [1, 2, 3, 4, 5];

const result = transduce(transducer)(reducer)(initialValue)(collection);
// [2, 4] — (1+1)=2✓, (2+1)=3✗, (3+1)=4✓, 2개 후 중단
```

---

### 2. `either` - 에러 처리 모나드 (~132 줄)

Either는 두 가지 타입 중 하나의 값을 나타냅니다:
- `Right(value)` - 성공
- `Left(errors)` - 실패 (Error 객체 배열로 정규화됨)

#### Either 생성

```javascript
const lib = require('./index.js')();
const { either } = lib;
const { left, right, catch: eitherCatch, from, fromNullable } = either;

right(10);           // Right(10)
left('에러');        // Left([Error: 에러])

eitherCatch(JSON.parse)('{"a":1}');    // Right({ a: 1 })
eitherCatch(JSON.parse)('invalid');    // Left([SyntaxError])

fromNullable(5);     // Right(5)
fromNullable(null);  // Left([Error])
```

#### Functor & Monad

```javascript
const lib = require('./index.js')();
const { either } = lib;
const { right, left } = either;

// map
right(5).map(x => x * 2);     // Right(10)

// flatMap (실패할 수 있는 연산 체이닝)
const safeDivide = (a, b) => 
    b === 0 ? left('0으로 나눌 수 없음') : right(a / b);

right(10)
    .flatMap(x => safeDivide(x, 2))  // Right(5)
    .flatMap(x => safeDivide(x, 0))  // Left([Error])
    .map(x => x * 2);                // 건너뜀
```

#### Applicative (검증 패턴)

```javascript
const lib = require('./index.js')();
const { either } = lib;
const { right, left } = either;

const validateName = name =>
    name?.length > 0 ? right(name) : left('이름 필수');

const validateAge = age =>
    age > 0 ? right(age) : left('나이는 양수여야 함');

const createUser = name => age => ({ name, age });

// 모든 에러 누적
right(createUser)
    .ap(validateName(''))
    .ap(validateAge(-1));
// Left(['이름 필수', '나이는 양수여야 함'])
```

#### pipeK: Kleisli 합성

```javascript
const lib = require('./index.js')();
const { either } = lib;
const { pipeK, catch: eitherCatch, right, left } = either;

const safeParse = eitherCatch(JSON.parse);
const getUser = obj => obj.user ? right(obj.user) : left('유저 없음');
const getProfile = user => user.profile ? right(user.profile) : left('프로필 없음');

const getProfileFromJson = pipeK(safeParse, getUser, getProfile);

getProfileFromJson('{"user":{"profile":{"name":"A"}}}');
// Right({ name: 'A' })

getProfileFromJson('{"user":{}}');
// Left(['프로필 없음'])
```

#### traverse & traverseAll

```javascript
const lib = require('./index.js')();
const { either } = lib;

const validatePositive = x => 
    x > 0 ? either.right(x) : either.left(`${x}는 양수가 아님`);

// traverse: 빠른 실패
either.traverse(validatePositive)([1, -2, 3]);
// Left(['-2는 양수가 아님'])

// traverseAll: 모든 에러 수집
either.traverseAll(validatePositive)([1, -2, -3]);
// Left(['-2는 양수가 아님', '-3는 양수가 아님'])
```

---

### 3. `monoid` - 대수 구조 (~120 줄)

Monoid: 이항 연산(`concat`)과 항등원(`empty`)을 가진 타입.

#### 내장 Monoid

```javascript
const lib = require('./index.js')();
const { monoid: M } = lib;

// 숫자
M.fold(M.number.sum)([1, 2, 3, 4]);      // Right(10)
M.fold(M.number.product)([1, 2, 3, 4]);  // Right(24)
M.fold(M.number.max)([1, 5, 3]);         // Right(5)

// 문자열, 불리언, 배열, 객체
M.fold(M.string.concat)(['a', 'b', 'c']); // Right('abc')
M.fold(M.boolean.all)([true, true]);      // Right(true)
M.fold(M.array.concat)([[1], [2], [3]]);  // Right([1, 2, 3])
M.fold(M.object.merge)([{a:1}, {b:2}]);   // Right({a:1, b:2})

// First/Last
M.fold(M.any.first)([1, 2, 3]);  // Right(1)
M.fold(M.any.last)([1, 2, 3]);   // Right(3)
```

#### foldMap & Groups

```javascript
const lib = require('./index.js')();
const { monoid: M } = lib;

// foldMap: map + fold
M.fold(M.number.sum, s => s.length)(['hello', 'world']);
// Right(10)

// Group은 역원을 가짐
M.invert(M.number.sum)(5);      // Right(-5)
M.invert(M.number.product)(5);  // Right(0.2)

// power: n번 반복
M.power(M.number.sum)(3, 4);      // Right(12) = 3+3+3+3
M.power(M.string.concat)('a', 3); // Right('aaa')
```

---

### 4. `free` - Free 모나드 & Trampoline (~115 줄)

Free 모나드는 계산을 데이터로 표현하여 스택 안전 재귀를 가능하게 합니다.

#### Trampoline: 스택 안전 재귀

```javascript
const lib = require('./index.js')();
const { free } = lib;
const { done, suspend, trampoline } = free;

const factorial = trampoline((n, acc = 1) =>
    n <= 1 
        ? done(acc)
        : suspend(() => factorial(n - 1, n * acc))
);

factorial(5);       // 120
factorial(100000);  // 동작함! 스택 오버플로 없음!

// 피보나치
const fib = trampoline((n, a = 0, b = 1) =>
    n <= 0
        ? done(a)
        : suspend(() => fib(n - 1, b, a + b))
);

fib(50);   // 12586269025
fib(1000); // 동작함!
```

---

### 5. `task` - 지연 비동기 모나드 (~170 줄)

Task는 지연 비동기 계산을 나타냅니다. Promise와 비슷하지만:
- **지연**: `.run()` 호출 전까지 실행되지 않음
- **에러 누적**: Either처럼 에러는 배열
- **순수**: 동일 입력은 항상 동일 출력 (참조 투명성)

#### Task 생성 & 실행

```javascript
const lib = require('./index.js')();
const { task, either } = lib;

task.resolved(42);              // 42로 해결되는 Task
task.rejected('에러');          // 거부되는 Task
task.fromEither(either.right(10)); // Either에서 변환

// 실행하려면 run() 호출 필수
task.resolved(42).run(
    errors => console.error('실패:', errors),
    value => console.log('성공:', value)
);

// Promise로 변환
const result = await task.resolved(42).toPromise();
```

#### Functor & Monad

```javascript
const lib = require('./index.js')();
const { task } = lib;

task.resolved(5)
    .map(x => x * 2)
    .flatMap(x => task.resolved(x + 1))
    .run(console.error, console.log);
// 로그: 11
```

#### 결합자

```javascript
const lib = require('./index.js')();
const { task } = lib;

// all: 병렬 실행
task.all([task.resolved(1), task.resolved(2), task.resolved(3)])
    .run(console.error, console.log);
// 로그: [1, 2, 3]

// race: 먼저 완료되는 것이 승리
task.race([task.resolved('빠름'), task.resolved('느림')])
    .run(console.error, console.log);
// 로그: '빠름'

// pipeK: Kleisli 합성
const fetchUser = id => task.resolved({ id, name: 'John' });
const getProfile = user => task.resolved({ avatar: 'pic.jpg' });

const getAvatar = task.pipeK(fetchUser, getProfile);
getAvatar(1).run(console.error, console.log);
// 로그: { avatar: 'pic.jpg' }
```

---

### 6. `extra` - 실용 유틸리티 (~15 줄)

#### path: 안전한 객체 속성 접근

```javascript
const lib = require('./index.js')();
const { extra } = lib;
const { path } = extra;

const data = { user: { name: 'Anthony', address: { city: 'Seoul' } } };

path('user.name')(data);           // Right('Anthony')
path('user.address.city')(data);   // Right('Seoul')
path('user.phone')(data);          // Left([Error])
path('name')(null);                // Left([Error])
```

#### template: 안전한 문자열 보간

```javascript
const lib = require('./index.js')();
const { extra } = lib;
const { template } = extra;

const data = { user: { name: 'Anthony' } };

template('안녕, {{user.name}}!', data); 
// '안녕, Anthony!'

template('안녕, {{ user.name }}!', data); // 공백 허용
// '안녕, Anthony!'
```

---

## 실제 사용 예제

### 안전한 API 호출

```javascript
const lib = require('./index.js')();
const { either } = lib;
const { right, left } = either;

const fetchUser = async (id) => {
    try {
        const response = await fetch(`/api/users/${id}`);
        if (!response.ok) return left('찾을 수 없음');
        return right(await response.json());
    } catch (e) {
        return left(e.message);
    }
};

const result = await fetchUser(1);
result.map(user => user.name).getOrElse('알 수 없음');
```

### 폼 검증

```javascript
const lib = require('./index.js')();
const { either } = lib;
const { right, validate } = either;

const validateEmail = validate(
    email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    () => '잘못된 이메일'
);

const validatePassword = validate(
    pwd => pwd.length >= 8,
    () => '비밀번호는 8자 이상이어야 함'
);

const validateForm = form =>
    right(data => ({ ...data, valid: true }))
        .ap(validateEmail(form.email).map(email => ({ email })))
        .ap(validatePassword(form.password).map(() => ({})));

validateForm({ email: 'bad', password: '123' });
// Left(['잘못된 이메일', '비밀번호는 8자 이상이어야 함'])
```

### 데이터 파이프라인

```javascript
const lib = require('./index.js')();
const { core, either } = lib;
const { pipe } = core;
const { catch: eitherCatch, right, left } = either;

const processData = pipe(
    eitherCatch(JSON.parse),
    e => e.flatMap(data => data.items ? right(data.items) : left('항목 없음')),
    e => e.map(items => items.filter(x => x.active)),
    e => e.map(items => items.map(x => x.name)),
    e => e.getOrElse([])
);

processData('{"items":[{"name":"A","active":true}]}');
// ['A']
```

### Monoid로 결과 집계

```javascript
const lib = require('./index.js')();
const { monoid: M } = lib;

const orders = [
    { product: 'A', qty: 2, price: 10 },
    { product: 'B', qty: 1, price: 25 },
    { product: 'C', qty: 3, price: 5 },
];

M.fold(M.number.sum, o => o.qty)(orders);           // Right(6)
M.fold(M.number.sum, o => o.qty * o.price)(orders); // Right(60)
M.fold(M.boolean.all, o => o.qty > 0)(orders);      // Right(true)
```

---

## API 레퍼런스

### core (~242 줄)

| 함수 | 설명 |
|------|------|
| `Types` | Symbol 기반 타입 마커 |
| `isFunctor(x)`, `isApplicative(x)`, `isMonad(x)` | 타입 검사 |
| `identity(x)`, `constant(x)`, `tuple(...args)`, `raise(e)` | 기본 유틸리티 |
| `pipe(...fs)`, `compose(...fs)` | 함수 합성 |
| `curry(f)`, `uncurry(f)`, `partial(f, ...args)` | 커링 |
| `flip(f)`, `flip2(f)`, `flipC(f)`, `negate(f)` | 함수 변환 |
| `once(f)`, `catch(f, onError)`, `predicate(f)` | 안전 유틸리티 |
| `tap(...fs)`, `also(x)(...fs)`, `into(x)(...fs)` | 부수 효과 |
| `transducer.{map, filter, take, transduce}` | Point-free transducers |

### either (~132 줄)

| 함수/메서드 | 설명 |
|-------------|------|
| `left(e)`, `right(x)` | Either 생성 |
| `catch(f)`, `from(x)`, `fromNullable(x)` | 안전한 생성 |
| `validate(cond, err)`, `validateAll(list)` | 검증 |
| `pipeK(...fs)` | Kleisli 합성 |
| `traverse(f)(list)`, `traverseAll(f)(list)` | Traversable |
| `.map(f)`, `.flatMap(f)`, `.ap(e)` | 변환 |
| `.fold(onLeft, onRight)`, `.getOrElse(default)` | 추출 |

### monoid (~120 줄)

| 함수 | 설명 |
|------|------|
| `fold(M, f?)(list)` | Monoid로 fold |
| `concat(M)(a, b)` | 두 값 결합 |
| `invert(M)(value)` | 역원 구하기 (Group만) |
| `power(M)(value, n)` | n번 반복 |
| `number.{sum,product,max,min}` | 숫자 monoid |
| `string.concat`, `boolean.{all,any,xor}` | 기타 monoid |
| `array.concat`, `object.merge` | 컬렉션 monoid |

### free (~115 줄)

| 함수 | 설명 |
|------|------|
| `pure(value)`, `impure(functor)` | Free 생성 |
| `done(value)`, `suspend(fn)` | Trampoline 헬퍼 |
| `trampoline(f)` | 스택 안전 함수 생성 |
| `runSync(runner)(program)` | 동기 실행 |

### task (~181 줄)

| 함수/메서드 | 설명 |
|-------------|------|
| `resolved(x)`, `rejected(e)`, `of(x)` | Task 생성 |
| `fromPromise(fn)`, `fromEither(e)` | 변환 |
| `all(tasks)`, `race(tasks)`, `sequence(tasks)` | 결합자 |
| `pipeK(...fs)` | Kleisli 합성 |
| `.map(f)`, `.flatMap(f)`, `.ap(t)` | 변환 |
| `.run(onRejected, onResolved)` | Task 실행 |
| `.toPromise()`, `.toEither(callback)` | 변환 |

### extra (~15 줄)

| 함수 | 설명 |
|------|------|
| `path(keyStr)(data)` | 안전한 중첩 속성 접근 |
| `template(msg, data)` | 안전한 문자열 보간 |

---

## 아키텍처

```
                    core.js (타입 프로토콜)
                           │
   ┌──────────────┬────────┴────────┬──────────────┐
   │              │                 │              │
either.js     monoid.js          free.js        task.js
 (에러)       (대수)             (Free)         (비동기)
   │              │                 │              │
   └──────────────┴────────┬────────┴──────────────┘
                           │
                      extra.js
                       (유틸)
```

## 타입 클래스 지원

| 타입 | Functor | Applicative | Monad |
|------|---------|-------------|-------|
| Either | ✅ | ✅ | ✅ |
| Task | ✅ | ✅ | ✅ |
| Free | ✅ | - | ✅ |

---

## 철학

1. **단순함** - 작고 집중된 함수
2. **안전** - 예외가 아닌 값으로서의 에러
3. **합성** - 단순한 것으로 복잡한 것 구축
4. **불변성** - 변경 없음, 항상 새로운 값
5. **프로토콜** - Symbol 기반 타입 클래스 마커

---

## 라이선스

MIT
