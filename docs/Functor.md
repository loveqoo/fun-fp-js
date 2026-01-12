# Functor

**매핑 가능한(Mappable) 타입**

## 개념

Functor는 **컨테이너 안의 값을 변환**할 수 있는 타입입니다. 컨테이너의 구조는 유지하면서 내부 값만 변경합니다.

가장 익숙한 예는 `Array.map`:
```javascript
[1, 2, 3].map(x => x * 2)  // [2, 4, 6]
// 배열 구조는 유지, 각 요소만 변환
```

## 법칙

### 1. 항등법칙 (Identity)
```javascript
map(x => x, a) === a
```
항등 함수로 매핑하면 원래 값과 같습니다.

### 2. 합성법칙 (Composition)
```javascript
map(x => f(g(x)), a) === map(f, map(g, a))
```
합성 함수로 한 번 매핑 = 각각 매핑 두 번

## 인터페이스

```javascript
Functor.map(f, a): Functor a
```
- `f`: 변환 함수 `a -> b`
- `a`: Functor에 담긴 값
- 반환: 변환된 값을 담은 새 Functor

## 사용 예시

### 배열 (Array)

```javascript
import FunFP from 'fun-fp-js';
const { Functor } = FunFP;

Functor.types.ArrayFunctor.map(x => x * 2, [1, 2, 3]);
// [2, 4, 6]

Functor.types.ArrayFunctor.map(x => x.toUpperCase(), ['a', 'b', 'c']);
// ['A', 'B', 'C']
```

### Maybe

```javascript
const { Maybe, Functor } = FunFP;

const just = Maybe.of(5);
const nothing = Maybe.Nothing();

Functor.types.MaybeFunctor.map(x => x * 2, just);
// Just(10)

Functor.types.MaybeFunctor.map(x => x * 2, nothing);
// Nothing - 변환 시도 안 함
```

### Either

```javascript
const { Either, Functor } = FunFP;

const right = Either.Right(5);
const left = Either.Left('error');

Functor.types.EitherFunctor.map(x => x * 2, right);
// Right(10)

Functor.types.EitherFunctor.map(x => x * 2, left);
// Left('error') - 에러는 그대로 유지
```

### Task

```javascript
const { Task, Functor } = FunFP;

const task = Task.of(5);
const doubled = Functor.types.TaskFunctor.map(x => x * 2, task);

doubled.fork(console.error, console.log);  // 10
```

## 실용적 활용

### 안전한 속성 접근

```javascript
const user = Maybe.of({ name: 'Alice', address: { city: 'Seoul' } });

// 안전하게 중첩 속성 접근
Functor.types.MaybeFunctor.map(u => u.name, user);
// Just('Alice')

Functor.types.MaybeFunctor.map(u => u.address.city, user);
// Just('Seoul')

// null이면 안전하게 Nothing
const noUser = Maybe.Nothing();
Functor.types.MaybeFunctor.map(u => u.name, noUser);
// Nothing
```

### 에러 처리와 결합

```javascript
const parseJson = str => {
    try {
        return Either.Right(JSON.parse(str));
    } catch (e) {
        return Either.Left(e.message);
    }
};

const data = '{"name": "Alice", "age": 30}';
const result = parseJson(data);

// 파싱 성공시에만 변환
Functor.types.EitherFunctor.map(obj => obj.name, result);
// Right('Alice')
```

### 비동기 변환

```javascript
const fetchUser = userId => Task.fromPromise(
    () => fetch(`/api/users/${userId}`).then(r => r.json())
);

const getUserName = pipe(
    fetchUser,
    task => Functor.types.TaskFunctor.map(user => user.name, task)
);

getUserName(1).fork(console.error, console.log);
// 'Alice'
```

## Functor의 시각화

```
Functor는 상자(Box)와 같습니다:

┌─────────┐                    ┌─────────┐
│    5    │  map(x => x * 2)   │   10    │
└─────────┘  ───────────────>  └─────────┘
   Just                           Just

┌─────────┐                    ┌─────────┐
│ (empty) │  map(x => x * 2)   │ (empty) │
└─────────┘  ───────────────>  └─────────┘
  Nothing                        Nothing

상자를 열지 않고도 내부 값을 변환할 수 있습니다!
```

## 왜 Functor인가?

1. **null 안전**: Maybe로 null 체크 없이 안전한 변환
2. **에러 처리**: Either로 try-catch 없이 에러 전파
3. **비동기 추상화**: Task로 콜백/Promise 없이 비동기 변환
4. **합성 가능**: 함수 합성처럼 변환을 체이닝

## 관련 타입 클래스

- **Apply**: Functor + 여러 Functor 값에 함수 적용
- **Applicative**: Apply + 값을 Functor에 넣기
- **Monad**: Applicative + 중첩 Functor 펼치기
