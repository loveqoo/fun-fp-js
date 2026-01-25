# Reader

**환경 기반 계산 모나드 (의존성 주입)**

## 개념

Reader는 **환경(environment)을 암묵적으로 전달하는 계산**을 표현합니다.

- 환경을 명시적으로 파라미터로 전달하지 않음
- `run(env)`로 한번만 주입하면 모든 계산이 환경을 공유
- 의존성 주입 패턴의 함수형 구현

## 왜 Reader인가?

### 문제: 파라미터 drilling 또는 전역 변수

```javascript
// 설정을 모든 함수에 전달해야 함
const fetchUser = (id, config) => {
    return fetch(`${config.apiUrl}/users/${id}`, {
        headers: { 'API-Key': config.apiKey }
    });
};

const getProfile = (userId, config) => {
    return fetchUser(userId, config).then(user => ({
        ...user,
        avatarUrl: `${config.cdnUrl}/avatars/${user.id}.png`
    }));
};

// config를 계속 전달
getProfile(123, config);
```

**문제점:**
- 설정을 사용하지 않는 중간 함수도 config를 받아서 전달해야 함
- 테스트 시 모든 함수에 mock config 전달 필요
- 전역 변수를 사용하면 테스트가 어려움

### 해결: Reader로 환경 전파

```javascript
const { Reader, Chain } = FunFP;
const { chain } = Chain.of('reader');

const fetchUser = id => Reader.asks(config =>
    fetch(`${config.apiUrl}/users/${id}`, {
        headers: { 'API-Key': config.apiKey }
    })
);

const getProfile = userId =>
    chain(
        user => Reader.asks(config => ({
            ...user,
            avatarUrl: `${config.cdnUrl}/avatars/${user.id}.png`
        })),
        fetchUser(userId)
    );

// 환경은 run으로 한번만 주입
getProfile(123).run(config);
```

**장점:**
- 환경을 한번만 주입 (`run(config)`)
- 중간 함수는 환경을 몰라도 됨
- 테스트 시 mock 주입이 간단
- 순수 함수 유지 (부수 효과 없음)

## 생성

```javascript
import FunFP from 'fun-fp-js';
const { Reader } = FunFP;

// of - 환경 무시, 상수 반환
const reader = Reader.of(42);
reader.run('any env');  // 42
reader.run(null);       // 42

// new Reader - 환경 받아서 계산
const envReader = new Reader(env => env.value * 2);
envReader.run({ value: 21 });  // 42

// ask - 환경 자체 반환
const askReader = Reader.ask;
askReader.run({ db: 'connection' });
// { db: 'connection' }

// asks - 환경에서 값 추출
const getDb = Reader.asks(env => env.db);
getDb.run({ db: 'connection', user: 'admin' });
// 'connection'
```

## 주요 연산 (Static Land 우선)

### map - 결과 변환 (Functor)

환경은 그대로, 결과만 변환합니다.

```javascript
const { Functor } = FunFP;
const { map } = Functor.of('reader');

const reader = Reader.of(21);
map(x => x * 2, reader);  // Reader that returns 42

// 실행
map(x => x * 2, reader).run(null);  // 42

// 환경 사용하는 경우
const envReader = new Reader(env => env.base);
map(x => x + 10, envReader).run({ base: 32 });  // 42

// 또는 Static 메서드
Reader.map(x => x * 2, reader);
```

### chain - Reader 연쇄 (Chain)

Reader를 반환하는 함수로 연쇄합니다. 환경이 자동 전파됩니다.

```javascript
const { Chain } = FunFP;
const { chain } = Chain.of('reader');

const getConfig = Reader.ask;
const useConfig = config => Reader.of(config.value + 10);

chain(useConfig, getConfig).run({ value: 32 });  // 42

// 여러 chain 연결
const reader = Reader.of(1);
chain(
    b => Reader.of(b * 3),
    chain(
        a => Reader.of(a + 2),
        reader
    )
).run(null);  // 9

// 또는 Static 메서드
Reader.chain(useConfig, getConfig);
```

### ap - 함수 적용 (Apply)

Reader 안의 함수를 Reader 안의 값에 적용합니다.

```javascript
const { Apply } = FunFP;
const { ap } = Apply.of('reader');

const rf = Reader.of(x => x * 2);
const ra = Reader.of(21);
ap(rf, ra).run(null);  // 42

// 환경 의존적 함수
const envRf = new Reader(env => x => x * env.multiplier);
const ra2 = Reader.of(7);
ap(envRf, ra2).run({ multiplier: 6 });  // 42

// 또는 Static 메서드
Reader.ap(rf, ra);
```

### Reader.local - 환경 로컬 변경

특정 Reader에만 변경된 환경을 적용합니다.

```javascript
const reader = Reader.ask;
const modified = Reader.local(e => e * 2, reader);

reader.run(5);    // 5
modified.run(5);  // 10 (환경이 2배로)

// 객체 환경 변경
const getMultiplier = Reader.asks(e => e.multiplier);
const doubled = Reader.local(
    e => ({ ...e, multiplier: e.multiplier * 2 }),
    getMultiplier
);

doubled.run({ multiplier: 5 });  // 10
```

## 실행

```javascript
const reader = Reader.asks(config => config.apiUrl);

// run으로 환경 주입
reader.run({ apiUrl: 'https://api.example.com' });
// 'https://api.example.com'
```

## 인스턴스 메서드 (편의 기능)

Static Land 및 Static 메서드 이후에 추가된 편의 메서드입니다.

```javascript
// map
Reader.of(21).map(x => x * 2).run(null);  // 42

// chain
Reader.ask.chain(config => Reader.of(config.value)).run({ value: 42 });
// 42

// 연속 체이닝
Reader.of(1)
    .chain(a => Reader.of(a + 2))
    .chain(b => Reader.of(b * 3))
    .run(null);  // 9
```

## 타입 체크

```javascript
Reader.isReader(Reader.of(5));         // true
Reader.isReader(new Reader(_ => 5));   // true
Reader.isReader(_ => 5);               // false (함수는 Reader 아님)
Reader.isReader(5);                    // false
```

## 실용적 예시

### 1. 데이터베이스 연결 주입

```javascript
const { Reader, Chain } = FunFP;
const { chain } = Chain.of('reader');

// 데이터베이스 쿼리 함수들 (환경에서 DB 연결 사용)
const findUser = id => Reader.asks(env =>
    env.db.query('SELECT * FROM users WHERE id = ?', [id])
);

const findPosts = userId => Reader.asks(env =>
    env.db.query('SELECT * FROM posts WHERE user_id = ?', [userId])
);

// 사용자와 게시글을 함께 조회
const getUserWithPosts = userId =>
    chain(
        user => chain(
            posts => Reader.of({ user, posts }),
            findPosts(user.id)
        ),
        findUser(userId)
    );

// 실제 사용: DB 연결 주입
const db = createDatabaseConnection();
const result = getUserWithPosts(123).run({ db });
// { user: {...}, posts: [...] }

// 테스트: mock DB 주입
const mockDb = {
    query: (sql, params) => Promise.resolve([
        { id: 123, name: 'Test User' }
    ])
};
const testResult = getUserWithPosts(123).run({ db: mockDb });
```

### 2. 로깅 컨텍스트 전파

```javascript
const { Reader, Chain } = FunFP;
const { chain } = Chain.of('reader');

// 로거를 환경에서 가져오는 헬퍼
const log = message => Reader.asks(env => {
    env.logger.log(`[${env.requestId}] ${message}`);
});

// 비즈니스 로직
const processOrder = order =>
    chain(
        _ => chain(
            _ => chain(
                _ => Reader.of({ status: 'completed', orderId: order.id }),
                log('Payment processed')
            ),
            log('Inventory updated')
        ),
        log(`Processing order ${order.id}`)
    );

// 각 요청마다 requestId와 logger를 주입
const handleRequest = (req, order) => {
    const context = {
        requestId: req.id,
        logger: console
    };
    return processOrder(order).run(context);
};

handleRequest({ id: 'req-123' }, { id: 'order-456' });
// [req-123] Processing order order-456
// [req-123] Inventory updated
// [req-123] Payment processed
// { status: 'completed', orderId: 'order-456' }
```

### 3. 멀티레벨 설정 관리

```javascript
const { Reader, Chain } = FunFP;
const { chain } = Chain.of('reader');

// 여러 설정 값 읽기
const getApiUrl = Reader.asks(config => config.api.url);
const getApiKey = Reader.asks(config => config.api.key);
const getCdnUrl = Reader.asks(config => config.cdn.url);
const getTimeout = Reader.asks(config => config.timeout || 5000);

// 설정 조합하여 HTTP 클라이언트 생성
const createHttpClient =
    chain(
        url => chain(
            key => chain(
                timeout => Reader.of({
                    baseURL: url,
                    headers: { 'API-Key': key },
                    timeout
                }),
                getTimeout
            ),
            getApiKey
        ),
        getApiUrl
    );

// 또는 Reader.lift 사용 (더 간결)
const createHttpClient2 = Reader.lift(
    (url, key, timeout) => ({
        baseURL: url,
        headers: { 'API-Key': key },
        timeout
    })
)(getApiUrl, getApiKey, getTimeout);

// 설정 주입
const config = {
    api: {
        url: 'https://api.example.com',
        key: 'secret123'
    },
    cdn: {
        url: 'https://cdn.example.com'
    },
    timeout: 10000
};

const client = createHttpClient.run(config);
// {
//   baseURL: 'https://api.example.com',
//   headers: { 'API-Key': 'secret123' },
//   timeout: 10000
// }
```

### 4. 테스트용 mock 주입

```javascript
const { Reader, Chain } = FunFP;
const { chain } = Chain.of('reader');

// 프로덕션 구현
const sendEmail = (to, subject, body) => Reader.asks(env =>
    env.emailService.send({ to, subject, body })
);

const notifyUser = userId =>
    chain(
        user => sendEmail(
            user.email,
            'Notification',
            `Hello ${user.name}`
        ),
        Reader.asks(env => env.userService.findById(userId))
    );

// 프로덕션 환경
const prodEnv = {
    userService: realUserService,
    emailService: realEmailService
};
notifyUser(123).run(prodEnv);

// 테스트 환경
const testEnv = {
    userService: {
        findById: id => ({ id, email: 'test@example.com', name: 'Test' })
    },
    emailService: {
        send: ({ to, subject, body }) => {
            console.log(`Mock: Sending to ${to}`);
            return Promise.resolve({ sent: true });
        }
    }
};
notifyUser(123).run(testEnv);
// Mock: Sending to test@example.com
// { sent: true }
```

### 5. Reader.local로 환경 변경

```javascript
const { Reader, Chain } = FunFP;
const { chain } = Chain.of('reader');

// 기본 로거
const log = message => Reader.asks(env =>
    env.logger.log(`[${env.level}] ${message}`)
);

// 특정 부분만 DEBUG 레벨로
const withDebugLevel = reader =>
    Reader.local(env => ({ ...env, level: 'DEBUG' }), reader);

const processWithLogging =
    chain(
        _ => chain(
            _ => log('Processing completed'),
            withDebugLevel(log('Detailed debug info'))
        ),
        log('Starting process')
    );

const env = {
    logger: console,
    level: 'INFO'
};

processWithLogging.run(env);
// [INFO] Starting process
// [DEBUG] Detailed debug info  <- level이 변경됨!
// [INFO] Processing completed
```

## 관련 타입 클래스

Reader가 구현하는 타입 클래스:

- **Functor**: `map` - 결과 변환
- **Apply**: `ap` - 함수 적용
- **Applicative**: `of` - 환경 무시 Reader 생성
- **Chain**: `chain` - Reader 연쇄
- **Monad**: Applicative + Chain

## Reader.pipeK / Reader.composeK

Kleisli 합성으로 Reader를 반환하는 함수들을 조합합니다.

### Reader.pipeK - 왼쪽에서 오른쪽 합성

```javascript
const addEnv = x => Reader.asks(env => x + env.offset);
const double = x => Reader.of(x * 2);
const toString = x => Reader.of(`Result: ${x}`);

const pipeline = Reader.pipeK(addEnv, double, toString);
pipeline(5).run({ offset: 3 });
// (5 + 3) * 2 = 16
// 'Result: 16'
```

### Reader.composeK - 오른쪽에서 왼쪽 합성

```javascript
// pipeK와 반대 방향
const pipeline = Reader.composeK(toString, double, addEnv);
pipeline(5).run({ offset: 3 });
// 'Result: 16' (동일한 결과)
```

## Reader.lift

다중 인자 함수를 Reader 컨텍스트로 리프트합니다.

```javascript
// 순수 함수
const add = (a, b) => a + b;

// Reader로 리프트
const liftedAdd = Reader.lift(add);

const r1 = Reader.of(10);
const r2 = Reader.of(32);
liftedAdd(r1, r2).run(null);  // 42

// 환경 의존적 Reader들도 가능
const multiply = (a, b) => a * b;
const liftedMultiply = Reader.lift(multiply);

const rx = Reader.asks(env => env.x);
const ry = Reader.asks(env => env.y);
liftedMultiply(rx, ry).run({ x: 6, y: 7 });  // 42
```

## Reader 사용 패턴

### 언제 Reader를 사용하는가?

**사용하면 좋은 경우:**
1. 설정을 여러 함수에 전달해야 할 때
2. 의존성 주입이 필요할 때 (DB, 로거, HTTP 클라이언트 등)
3. 테스트 시 mock 주입이 필요할 때
4. 전역 변수를 피하고 싶을 때

**사용하지 않아도 되는 경우:**
1. 환경이 한 함수에서만 사용될 때
2. 단순히 인자를 전달하는 것이 더 명확할 때
3. 환경이 자주 변경되어야 할 때 (State 모나드 고려)

### Reader vs 파라미터 전달

| | 파라미터 전달 | Reader |
|---|---|---|
| 명시성 | 모든 함수에 명시 | run에서만 주입 |
| 보일러플레이트 | 많음 (중간 함수도 전달) | 적음 |
| 테스트 | 모든 함수에 mock 전달 | run에 mock 주입 |
| 가독성 | 직관적 | 익숙해지면 간결 |

## 관련 문서

**비슷한 타입:**
- [State](./State.md) - 상태 변환 모나드 (환경이 변경되는 경우)
- [Writer](./Writer.md) - 출력 추적 모나드

**사용하는 타입 클래스:**
- [Functor](./Functor.md)
- [Apply](./Apply.md)
- [Applicative](./Applicative.md)
- [Chain](./Chain.md)
- [Monad](./Monad.md)

**함께 사용:**
- [Task](./Task.md) - 비동기 작업과 Reader 조합 (Reader Task 패턴)
