# Task

**비동기 연산을 순수하게 다루는 타입**

## 개념

Task는 **지연된 비동기 연산**을 표현합니다. Promise와 비슷하지만:

- **지연 실행**: 생성 시 실행되지 않음 (fork 호출 시 실행)
- **순수성**: 같은 Task를 여러 번 fork해도 매번 새로 실행
- **취소 가능성**: 참조만 제거하면 됨 (실행 전)

## 왜 Task인가?

### 문제: Promise의 즉시 실행

```javascript
// Promise는 생성 즉시 실행!
const promise = new Promise((resolve) => {
    console.log('실행됨!');  // 무조건 출력
    resolve(42);
});
// 아무것도 안 해도 '실행됨!' 출력
```

### 해결: Task는 지연 실행

```javascript
const task = new Task((reject, resolve) => {
    console.log('실행됨!');  // fork 전까지 출력 안 됨
    resolve(42);
});
// 아무것도 출력되지 않음

task.fork(console.error, console.log);  // 이때 '실행됨!' 출력
```

## 생성

```javascript
import FunFP from 'fun-fp-js';
const { Task } = FunFP;

// 기본 생성
const task = new Task((reject, resolve) => {
    setTimeout(() => resolve(42), 1000);
});

// 즉시 성공
const success = Task.of(42);

// 즉시 실패
const failure = Task.rejected('error');

// Promise에서 변환
const fetchTask = Task.fromPromise(
    url => fetch(url).then(r => r.json())
);
const task = fetchTask('/api/data');

// Either에서 변환
const fromEither = Task.fromEither(Either.Right(42));  // Task.of(42)
```

## 실행 (fork)

```javascript
const task = Task.of(42);

task.fork(
    error => console.error('Error:', error),  // 실패 콜백
    value => console.log('Success:', value)   // 성공 콜백
);
// 'Success: 42'
```

## 주요 연산

### map - 값 변환 (Functor)

```javascript
Task.of(5)
    .map(x => x * 2)
    .fork(console.error, console.log);
// 10
```

### chain - 순차 실행 (Monad)

```javascript
const fetchUser = id => Task.fromPromise(() => 
    fetch(`/api/users/${id}`).then(r => r.json())
)();

const fetchPosts = userId => Task.fromPromise(() =>
    fetch(`/api/users/${userId}/posts`).then(r => r.json())
)();

fetchUser(1)
    .chain(user => fetchPosts(user.id))
    .map(posts => posts.length)
    .fork(
        err => console.error('Error:', err),
        count => console.log('Post count:', count)
    );
```

### Task.all - 병렬 실행

```javascript
const tasks = [
    Task.of(1),
    Task.of(2),
    Task.of(3)
];

Task.all(tasks).fork(
    console.error,
    results => console.log(results)  // [1, 2, 3]
);

// 하나라도 실패하면 전체 실패
const tasksWithError = [
    Task.of(1),
    Task.rejected('oops'),
    Task.of(3)
];

Task.all(tasksWithError).fork(
    err => console.log('Error:', err),  // 'Error: oops'
    console.log
);
```

### Task.race - 경쟁 실행

```javascript
const fast = new Task((_, resolve) => 
    setTimeout(() => resolve('fast'), 100)
);
const slow = new Task((_, resolve) => 
    setTimeout(() => resolve('slow'), 500)
);

Task.race([fast, slow]).fork(
    console.error,
    result => console.log(result)  // 'fast'
);
```

## 실용적 예시

### API 호출 래핑

```javascript
const api = {
    get: url => Task.fromPromise(() =>
        fetch(url).then(r => {
            if (!r.ok) throw new Error(r.statusText);
            return r.json();
        })
    )()
};

// 사용
api.get('/api/users/1')
    .map(user => user.name)
    .fork(
        err => console.error('Failed:', err),
        name => console.log('Name:', name)
    );
```

### 재시도 로직

```javascript
const retry = (task, times) => 
    task.fork === undefined ? task :
    new Task((reject, resolve) => {
        let attempts = 0;
        const attempt = () => {
            task.fork(
                err => {
                    attempts++;
                    if (attempts < times) {
                        console.log(`Retry ${attempts}/${times}`);
                        setTimeout(attempt, 1000);
                    } else {
                        reject(err);
                    }
                },
                resolve
            );
        };
        attempt();
    });

retry(fetchUser(1), 3).fork(console.error, console.log);
```

### 타임아웃

```javascript
const timeout = (ms, task) => Task.race([
    task,
    new Task((reject) => 
        setTimeout(() => reject(new Error('Timeout')), ms)
    )
]);

timeout(5000, fetchUser(1)).fork(
    err => console.error('Timed out or error:', err),
    user => console.log('User:', user)
);
```

### 순차 실행 (시리즈)

```javascript
const sequence = tasks => tasks.reduce(
    (acc, task) => acc.chain(results => 
        task.map(result => [...results, result])
    ),
    Task.of([])
);

const tasks = [
    Task.of(1),
    Task.of(2),
    Task.of(3)
];

sequence(tasks).fork(
    console.error,
    results => console.log(results)  // [1, 2, 3] (순차 실행됨)
);
```

### 조건부 실행

```javascript
const fetchIfNeeded = (cache, id) =>
    cache[id] 
        ? Task.of(cache[id])  // 캐시 있으면 즉시 반환
        : fetchUser(id);       // 없으면 API 호출

fetchIfNeeded({}, 1).fork(console.error, console.log);  // API 호출
fetchIfNeeded({1: 'cached'}, 1).fork(console.error, console.log);  // 'cached'
```

## Task.lift - 예외 안전 함수 리프트

`Task.lift`는 다중 인자 함수를 Task 컨텍스트로 리프트하며, **예외를 자동으로 `Task.rejected`로 변환**합니다.

### 기본 사용법

```javascript
const { Task } = FunFP;

// 순수 함수
const add = (a, b) => a + b;

// Task로 리프트
const taskAdd = Task.lift(add);

taskAdd(Task.of(5), Task.of(3)).fork(
    console.error,
    result => console.log(result)
);
// 8

// 3개 이상의 인자도 지원
const sum3 = (a, b, c) => a + b + c;
const taskSum3 = Task.lift(sum3);

taskSum3(Task.of(10), Task.of(20), Task.of(12)).fork(
    console.error,
    result => console.log(result)
);
// 42
```

### 예외 안전성 - 핵심 기능

`Task.lift`의 가장 중요한 기능은 **함수 내부의 예외를 자동으로 캐치하여 `Task.rejected`로 변환**하는 것입니다.

```javascript
const { Task } = FunFP;

// 예외를 던지는 함수
const divide = (a, b) => {
    if (b === 0) {
        throw new Error('Division by zero');
    }
    return a / b;
};

// lift로 예외 안전하게 만들기
const safeDivide = Task.lift(divide);

// 정상 케이스
safeDivide(Task.of(10), Task.of(2)).fork(
    err => console.error('Error:', err.message),
    result => console.log('Result:', result)
);
// 'Result: 5'

// 예외 케이스 - throw가 Task.rejected로 자동 변환!
safeDivide(Task.of(10), Task.of(0)).fork(
    err => console.error('Error:', err.message),
    result => console.log('Result:', result)
);
// 'Error: Division by zero'

// Task가 rejected인 경우도 처리
safeDivide(Task.rejected('Invalid input'), Task.of(2)).fork(
    err => console.error('Error:', err),
    result => console.log('Result:', result)
);
// 'Error: Invalid input'
```

### 실용적 예시: JSON 파싱

```javascript
const { Task } = FunFP;

// JSON.parse는 예외를 던질 수 있음
const parseJSON = str => JSON.parse(str);

// lift로 예외 안전하게
const safeParseJSON = Task.lift(parseJSON);

// 정상 케이스
safeParseJSON(Task.of('{"name": "Alice"}')).fork(
    err => console.error('Parse error:', err.message),
    obj => console.log('Parsed:', obj)
);
// Parsed: { name: 'Alice' }

// 예외 케이스 - 파싱 실패
safeParseJSON(Task.of('invalid json')).fork(
    err => console.error('Parse error:', err.message),
    obj => console.log('Parsed:', obj)
);
// Parse error: Unexpected token i in JSON at position 0
```

### 실용적 예시: API 응답 변환

```javascript
const { Task } = FunFP;

// API 응답 변환 함수 (검증 포함)
const transformUser = data => {
    if (!data.id) throw new Error('Missing user ID');
    if (!data.email) throw new Error('Missing email');

    return {
        id: data.id,
        email: data.email.toLowerCase(),
        name: data.name || 'Unknown'
    };
};

const safeTransformUser = Task.lift(transformUser);

const fetchUser = id => Task.fromPromise(() =>
    fetch(`/api/users/${id}`).then(r => r.json())
)();

// 파이프라인: fetch -> transform
fetchUser(1)
    .chain(data => safeTransformUser(Task.of(data)))
    .fork(
        err => console.error('Error:', err.message),
        user => console.log('User:', user)
    );
// 데이터가 유효하면: User: { id: 1, email: '...', name: '...' }
// 검증 실패 시: Error: Missing user ID
```

### 언제 Task.lift를 사용하는가?

**사용하면 좋은 경우:**
1. 예외를 던질 수 있는 함수를 Task로 래핑할 때
2. `JSON.parse`, `parseInt` 등 내장 함수를 안전하게 만들 때
3. 여러 Task를 조합하여 순수 함수 적용할 때
4. 검증 로직이 포함된 변환 함수

**lift vs fromPromise:**
- `Task.lift`: 동기 함수의 예외를 캐치 (`try/catch`)
- `Task.fromPromise`: Promise rejection을 캐치

```javascript
// 동기 함수 -> Task.lift
const parseJSON = Task.lift(str => JSON.parse(str));

// 비동기 함수 -> Task.fromPromise
const fetchData = Task.fromPromise(url =>
    fetch(url).then(r => r.json())
);
```

## Task vs Promise

| | Promise | Task |
|---|---|---|
| 실행 시점 | 즉시 | fork 호출 시 |
| 재실행 | 불가 (이미 완료) | 가능 (매번 새로) |
| 순수성 | 부수 효과 있음 | 순수 함수 |
| 취소 | 복잡 | 간단 (참조 제거) |
| 합성 | then 체이닝 | map/chain |
| 에러 처리 | catch | fork 첫 번째 인자 |

## 관련 타입 클래스

- **Functor**: map 제공
- **Apply**: ap 제공
- **Applicative**: of 제공
- **Chain**: chain 제공
- **Monad**: Applicative + Chain
- **Alt**: 대안 값 선택
