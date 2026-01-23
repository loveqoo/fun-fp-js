# fun-fp-js 실전 활용 리뷰

함수형 프로그래밍으로 다양한 서비스를 구축해온 개발자 관점에서, 이 라이브러리가 실제 프로젝트에서 어떻게 활용될 수 있는지 살펴봅니다.

---

## 1. 안전한 데이터 접근

### 문제 상황
API 응답이나 설정 객체에서 중첩된 값을 접근할 때 `Cannot read property of undefined` 에러가 빈번하게 발생합니다.

### 해결 방법
```javascript
const { Maybe, Either, extra } = fp;

// 중첩 객체 안전 접근
const user = { profile: { address: { city: 'Seoul' } } };
const city = extra.path('profile.address.city')(user);
// Either.Right('Seoul')

const missing = extra.path('profile.phone.number')(user);
// Either.Left(null)

// Maybe를 활용한 기본값 처리
Maybe.fromNullable(user.profile?.settings?.theme)
    .map(theme => applyTheme(theme))
    .fold(() => applyTheme('default'), identity);
```

### 평가
Optional Chaining(`?.`)보다 풍부한 체이닝과 변환이 가능합니다. `fold`를 통해 두 케이스를 명시적으로 처리하므로 누락된 분기가 없음을 보장합니다.

---

## 2. 에러 핸들링 파이프라인

### 문제 상황
여러 단계의 검증이나 변환 과정에서 try-catch가 중첩되면 코드가 복잡해집니다.

### 해결 방법
```javascript
const { Either } = fp;

const parseJson = str => Either.catch(() => JSON.parse(str));
const validateUser = data => data.name
    ? Either.Right(data)
    : Either.Left('name is required');
const normalizeEmail = data => Either.Right({
    ...data,
    email: data.email.toLowerCase()
});

// 파이프라인: 첫 번째 Left에서 중단
const processUser = Either.pipeK(parseJson, validateUser, normalizeEmail);

processUser('{"name": "Kim", "email": "KIM@example.com"}');
// Either.Right({ name: 'Kim', email: 'kim@example.com' })

processUser('invalid json');
// Either.Left(SyntaxError)

processUser('{"email": "test@test.com"}');
// Either.Left('name is required')
```

### 평가
각 단계가 독립적인 함수로 분리되어 테스트와 재사용이 쉽습니다. 에러 전파가 자동으로 처리되므로 보일러플레이트가 줄어듭니다.

---

## 3. 비동기 작업 합성

### 문제 상황
Promise 체인이 길어지면 에러 핸들링 위치가 불명확해지고, 여러 비동기 작업의 조합이 복잡해집니다.

### 해결 방법
```javascript
const { Task } = fp;

const fetchUser = Task.fromPromise(id => fetch(`/api/users/${id}`).then(r => r.json()));
const fetchPosts = Task.fromPromise(userId => fetch(`/api/posts?userId=${userId}`).then(r => r.json()));

// 순차 실행
const getUserWithPosts = Task.pipeK(
    fetchUser,
    user => fetchPosts(user.id).map(posts => ({ ...user, posts }))
);

// 병렬 실행
const fetchAllData = Task.all([
    fetchUser(1),
    fetchUser(2),
    fetchUser(3)
]);

// 경쟁 (첫 번째 완료된 것 사용)
const fetchWithFallback = Task.race([
    fetchFromPrimaryServer(),
    fetchFromBackupServer()
]);

// 실행
getUserWithPosts(1).fork(
    err => console.error('Failed:', err),
    data => console.log('Success:', data)
);
```

### 평가
Task는 지연 실행되므로 `fork` 호출 전까지 실제 요청이 발생하지 않습니다. 이로 인해 작업을 조합하고 재사용하기가 Promise보다 유연합니다. `all`, `race`, `alt` 등 다양한 조합 방식을 제공합니다.

---

## 4. 폼 검증과 에러 수집

### 문제 상황
폼 검증 시 모든 에러를 한 번에 수집하여 사용자에게 보여주고 싶습니다.

### 해결 방법
```javascript
const { Either, Semigroup } = fp;

// 에러 누적을 위한 검증 함수
const validateName = name => name.length >= 2
    ? Either.Right(name)
    : Either.Left(['Name must be at least 2 characters']);

const validateEmail = email => email.includes('@')
    ? Either.Right(email)
    : Either.Left(['Invalid email format']);

const validateAge = age => age >= 18
    ? Either.Right(age)
    : Either.Left(['Must be 18 or older']);

// Applicative 스타일로 모든 검증 실행
const validateForm = (name, email, age) => {
    const applicative = fp.Applicative.of('either');
    return applicative.ap(
        applicative.ap(
            applicative.map(
                n => e => a => ({ name: n, email: e, age: a }),
                validateName(name)
            ),
            validateEmail(email)
        ),
        validateAge(age)
    );
};

validateForm('K', 'invalid', 15);
// 첫 번째 에러에서 중단: Either.Left(['Name must be at least 2 characters'])
```

### 평가
기본 Either.ap은 첫 에러에서 중단됩니다. 모든 에러 수집이 필요하면 Validation Applicative 패턴을 별도 구현해야 합니다. 현재 라이브러리에서는 이 부분이 내장되어 있지 않으므로 확장이 필요합니다.

---

## 5. 대용량 데이터 변환

### 문제 상황
배열을 여러 번 순회하면서 map, filter를 체이닝하면 중간 배열이 계속 생성되어 메모리와 성능에 부담이 됩니다.

### 해결 방법
```javascript
const { transducer, compose } = fp;
const { transduce, map, filter, take } = transducer;

// 트랜스듀서 합성 (한 번의 순회로 모든 변환 수행)
const processItems = compose(
    filter(x => x % 2 === 0),  // 짝수만
    map(x => x * 10),          // 10배
    take(5)                     // 처음 5개만
);

const result = transduce(processItems)((acc, x) => [...acc, x])([])(
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
);
// [20, 40, 60, 80, 100]
```

### 평가
단일 순회로 여러 변환을 수행하므로 대용량 데이터 처리에 효과적입니다. `take`를 통한 조기 종료도 지원합니다. Clojure의 transducer 개념을 JavaScript로 잘 옮겼습니다.

---

## 6. 스택 안전한 재귀

### 문제 상황
깊은 재귀 호출 시 JavaScript의 스택 오버플로우가 발생합니다.

### 해결 방법
```javascript
const { Free, trampoline, Chain } = fp;
const { Thunk } = Free;

// 스택 안전한 factorial
const factorial = n => {
    const chain = Chain.of('free');
    const go = (n, acc) => n <= 1
        ? Thunk.done(acc)
        : chain.chain(x => x, Thunk.suspend(() => go(n - 1, n * acc)));
    return trampoline(go(n, 1));
};

factorial(10000); // 스택 오버플로우 없이 계산
```

### 평가
트램폴린을 통해 꼬리 재귀 최적화가 없는 JavaScript에서도 안전한 재귀를 구현할 수 있습니다. Free Monad 기반이라 DSL 구축에도 활용 가능합니다.

---

## 7. 유틸리티 함수 활용

### 다양한 상황에서의 활용
```javascript
const { pipe, compose, curry, tap, once, converge } = fp;

// 파이프라인 구축
const processData = pipe(
    JSON.parse,
    data => data.items,
    items => items.filter(x => x.active),
    items => items.map(x => x.name)
);

// 디버깅용 tap
const debugPipeline = pipe(
    tap(x => console.log('Input:', x)),
    processData,
    tap(x => console.log('Output:', x))
);

// 초기화 함수 (한 번만 실행)
const initializeApp = once(() => {
    console.log('App initialized');
    return loadConfig();
});

// 분기 후 합성
const getFullName = converge(
    (first, last) => `${first} ${last}`,
    user => user.firstName,
    user => user.lastName
);
```

### 평가
실무에서 자주 사용되는 유틸리티들이 잘 갖춰져 있습니다. 특히 `tap`은 디버깅에, `once`는 초기화 로직에, `converge`는 여러 값을 추출하여 합성하는 패턴에 유용합니다.

---

## 8. 종합 평가

| 사용 사례 | 적합도 | 비고 |
|----------|--------|------|
| 안전한 데이터 접근 | ★★★★★ | Maybe, Either, extra.path 조합 |
| 에러 핸들링 파이프라인 | ★★★★★ | Either.pipeK로 깔끔한 체이닝 |
| 비동기 작업 합성 | ★★★★★ | Task의 지연 실행과 다양한 조합기 |
| 폼 검증 (에러 수집) | ★★★☆☆ | Validation Applicative 미지원 |
| 대용량 데이터 변환 | ★★★★★ | Transducer로 효율적 처리 |
| 스택 안전 재귀 | ★★★★★ | Free Monad + trampoline |
| 일반 유틸리티 | ★★★★★ | pipe, compose, curry 등 완비 |

### 장점
- **학습 곡선 완화**: Static Land 명세를 따르면서도 인스턴스 메서드(`.map()`, `.chain()`)를 함께 제공하여 초보자도 접근하기 쉬움
- **실용적인 설계**: 엄격 모드와 느슨 모드를 지원하여 개발/프로덕션 환경에 맞게 조절 가능
- **단일 파일**: 번들 크기를 최소화하고 의존성 없이 사용 가능

### 개선 여지
- Validation Applicative (모든 에러 수집)가 내장되면 폼 검증 시나리오에서 더 유용할 것
- Lens/Optics 지원이 추가되면 불변 데이터 업데이트가 더 편리해질 것

### 결론
실무에서 함수형 프로그래밍 패턴을 적용하기에 충분한 도구를 제공합니다. 특히 Maybe/Either/Task 조합으로 안전하고 선언적인 코드를 작성할 수 있습니다.
