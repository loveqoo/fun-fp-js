# Fun-FP-JS 가이드

함수형 프로그래밍 타입 클래스 문서 모음

## 학습 순서 (권장)

### 1단계: 기본 대수 구조
- [Setoid](./Setoid.md) - 동등성 비교
- [Ord](./Ord.md) - 순서 비교
- [Semigroup](./Semigroup.md) - 결합 연산
- [Monoid](./Monoid.md) - 결합 + 항등원
- [Group](./Group.md) - 결합 + 항등원 + 역원

### 2단계: 핵심 컨테이너 타입

#### 기본 컨테이너
- [Maybe](./Maybe.md) - null 안전 처리
- [Either](./Either.md) - 에러 처리 (fail-fast)
- [Validation](./Validation.md) - 에러 누적 (병렬 검증)

#### 비동기
- [Task](./Task.md) - 비동기 처리

#### 환경/상태 관리
- [Reader](./Reader.md) - 환경 기반 계산 (의존성 주입)
- [Writer](./Writer.md) - 출력 추적 (로깅)
- [State](./State.md) - 상태 변환

#### 고급
- [Free](./Free.md) - 스택 안전 재귀, DSL 구축

#### 데이터 다루기
- [Optics](./Optics.md) - Lens/Prism/Traversal 개관과 합성 (**여기부터**)
- [Lens](./Lens.md) - 중첩 불변 데이터의 합성 가능한 접근자
- [Transducer](./Transducer.md) - 중간 배열 없는 변환 파이프라인
- [Actor](./Actor.md) - 순차 메시지 처리 상태 컨테이너

### 3단계: 변환과 합성
- [Functor](./Functor.md) - 값 변환 (map)
- [Applicative](./Applicative.md) - 여러 값에 함수 적용 (ap)
- [Monad](./Monad.md) - 순차 실행 (chain)

### 4단계: 고급 패턴
- [Traversable](./Traversable.md) - 효과 순회 (traverse)
- [Foldable](./Foldable.md) - 축소 (reduce)
- [Filterable](./Filterable.md) - 필터링

### 5단계: 함수 합성
- [Semigroupoid](./Semigroupoid.md) - 함수 합성
- [Category](./Category.md) - 함수 합성 + 항등 함수

### 6단계: 대안 선택 패턴
- [Alt](./Alt.md) - 대안 선택
- [Plus](./Plus.md) - 빈 대안
- [Alternative](./Alternative.md) - Applicative + Plus

### 7단계: 특수 변환
- [Bifunctor](./Bifunctor.md) - 양방향 변환
- [Contravariant](./Contravariant.md) - 입력 변환
- [Profunctor](./Profunctor.md) - 입력/출력 변환

### 8단계: 재귀와 Comonad
- [ChainRec](./ChainRec.md) - 스택 안전 재귀
- [Extend](./Extend.md) - 컨텍스트 기반 변환
- [Comonad](./Comonad.md) - Monad의 쌍대

### 9단계: Monad Transformer

두 모나드를 합성해 "상태 + 실패", "환경 + 비동기" 같은 조합을 만듭니다.
[Free](./Free.md) 위에 구현되어 스택 안전합니다.

**[StateT](./StateT.md)를 먼저 읽으십시오** — 4종의 공통 개념(`of`/`lift`, 문자열 M 규칙)이
거기 정리되어 있고 나머지 셋이 참조합니다.

- [StateT](./StateT.md) - 상태 전이 + 효과 (공통 개념 포함)
- [EitherT](./EitherT.md) - 에러 처리 + 효과 (`EitherT('task')`가 대표 조합)
- [ReaderT](./ReaderT.md) - 의존성 주입 + 효과
- [WriterT](./WriterT.md) - 출력 누적 + 효과


## 추상 함수

타입 클래스를 조합하여 사용하는 고차 함수들:

| 함수 | 시그니처 | 설명 |
|------|----------|------|
| `sequence` | `(Traversable, Applicative, u) -> Applicative u` | 효과 뒤집기 |
| `lift` | `Applicative -> (a -> b) -> (F a -> F b)` | 함수를 컨테이너 컨텍스트로 |
| `pipeK` | `(Monad, Foldable?) -> [a -> M b] -> a -> M b` | Kleisli 합성 (좌→우) |
| `composeK` | `(Monad, Foldable?) -> [a -> M b] -> a -> M b` | Kleisli 합성 (우→좌) |
| `foldMap` | `(Foldable, Monoid) -> (a -> b) -> F a -> b` | 매핑 후 Monoid로 축소 |

## 타입 클래스 의존성 그래프

```
Setoid ─────> Ord

Semigroup ──> Monoid ──> Group

Semigroupoid ──> Category

                         ┌──> Bifunctor
                         │
Functor ──> Apply ──> Applicative ──> Monad
              │            │
              └──> Alt ────┴──> Alternative
                    │
                    v
                   Plus

Foldable ──> Traversable <── Functor

Chain ──> ChainRec
  │
  └──> Monad <── Applicative

Extend ──> Comonad
```

## 핵심 개념 요약

### 타입 클래스

| 타입 클래스 | 핵심 연산 | 한 줄 설명 |
|------------|----------|-----------|
| Setoid | equals | 같은가? |
| Ord | lte | 순서 비교 |
| Semigroup | concat | 결합하기 |
| Monoid | empty | 빈 값 |
| Group | invert | 역원 |
| Functor | map | 변환하기 |
| Contravariant | contramap | 입력 변환 |
| Profunctor | promap | 입력/출력 변환 |
| Bifunctor | bimap | 양방향 변환 |
| Apply | ap | 여러 값에 적용 |
| Applicative | of | 값 넣기 |
| Chain | chain | 순차 실행 |
| ChainRec | chainRec | 스택 안전 재귀 |
| Monad | of + chain | 완전한 순차 패턴 |
| Alt | alt | 대안 선택 |
| Plus | zero | 빈 대안 |
| Alternative | ap + alt + zero | Applicative + Plus |
| Foldable | reduce | 축소 |
| Traversable | traverse | 효과 순회 |
| Filterable | filter | 걸러내기 |
| Semigroupoid | compose | 함수 합성 |
| Category | id | 항등 함수 |
| Extend | extend | 컨텍스트 변환 |
| Comonad | extract | 값 추출 |

### `lookup` 과 `of` — 두 이름이 하는 일이 다릅니다

| | 무엇을 하나 | 어디에 있나 |
| --- | --- | --- |
| `lookup(키)` | **레지스트리에서 인스턴스를 꺼낸다** | 타입클래스 24개 (`Functor`, `Monoid`, …) |
| `of(값)` | **값을 컨테이너에 넣는다** | 데이터 타입 8개 (`Maybe`, `Either`, …)와 `Applicative` 인스턴스 |

```javascript
const { Maybe, Functor, Applicative } = FunFP;

Functor.lookup('maybe')            // MaybeFunctor 인스턴스를 꺼낸다
Maybe.of(1)                        // Just(1) — 값을 넣는다
Applicative.lookup('maybe').of(1)  // 꺼낸 다음 넣는다

Maybe.of('array')                  // Just('array') — 조회가 아니다
```

**한 이름이 둘을 겸하면 마지막 줄이 조회로 읽힙니다.** 그래서 타입클래스에는 `of` 가
없습니다 — `Functor.of` 는 `undefined` 입니다.

### `Algebra.all(타입)` — 한 타입의 인스턴스를 한 번에

`lookup` 은 하나를 꺼냅니다. **같은 타입의 여러 인스턴스가 필요하면 하나씩 부르는 대신
`Algebra.all` 로 받아 구조분해합니다.** `Algebra` 는 모든 인스턴스의 뿌리 클래스입니다 —
타입클래스 하나에서 꺼내면 인스턴스 하나, 뿌리에서 꺼내면 그 타입의 인스턴스 전부입니다.

```javascript
const { Algebra } = FunFP;

const { arraySemigroup, arrayFoldable, arrayTraversable } = Algebra.all('array');

console.log(arraySemigroup.concat([1], [2]));            // [1, 2]
console.log(arrayFoldable.reduce((a, b) => a + b, 0, [1, 2, 3]));  // 6
```

이름은 **카멜케이스**입니다. 클래스 이름을 그대로 쓰고(`ArraySemigroup` → `arraySemigroup`),
조립 키로 만들어진 것은 키 조각을 앞에 붙입니다(`plus(array)` 의 Monoid → `plusArrayMonoid`).

```javascript
const { Algebra: A } = FunFP;

const { plusArrayMonoid, arrayMonoid } = A.all('array');
console.log(plusArrayMonoid.empty());   // []   ← Plus 에서 유도된 것
console.log(arrayMonoid.empty());       // []   ← 원래의 ArrayMonoid, 다른 인스턴스다
```

**세 가지를 기억하십시오.**

| | |
| --- | --- |
| 키는 **소문자만** | `Algebra.all('Array')` 는 던집니다. 없는 타입도 던집니다 |
| 묶는 기준은 **`.type`**, 레지스트리 키가 아님 | `Semigroupoid` 의 `maybe` 인스턴스는 Kleisli 합성이라 `.type` 이 `'function'` 입니다 — `all('function')` 에 있고 `all('maybe')` 에는 없습니다 |
| **열거가 아니라 "지금 있는 것"** | 매개변수화 인스턴스는 팩토리를 불러야 생깁니다. `Maybe.Semigroup('number')` 뒤의 `all('maybe')` 에는 `maybeNumberSemigroup` 이 더 있습니다 |

**셋업에서 한 번 부르십시오.** 캐시가 없어 매번 레지스트리 전체를 훑습니다 — `lookup` 의
해시 조회보다 실측 650배 느립니다(13μs 대 0.02μs). 구조분해해서 쓰는 용도이고, **타입을
순회하며 루프 안에서 부르지 마십시오.**

세 번째가 설계입니다. 안쪽 타입 공간은 닫혀 있지 않아서 — `maybe(maybe(maybe(array)))` 도
됩니다 — 미리 열거할 수 없습니다. **안쪽 타입은 힌트이고, 정확히 지목하려면 조립 키로
`lookup` 하십시오.**

```javascript
const { Semigroup, Maybe } = FunFP;

const inner = Semigroup.lookup('maybe(number)');          // 명확한 키로 정확히 하나
console.log(inner.concat(Maybe.Just(1), Maybe.Just(2)));  // Just(3)
```

### 레지스트리 키 — 매개변수화된 것들

`Functor.lookup('array')` 처럼 **타입 이름**이 기본이지만, 조립된 키도 있습니다.

| 키 형태 | 뜻 | 예 | 문서 |
| --- | --- | --- | --- |
| `<타입>` | 그 타입의 기본 인스턴스 | `array`, `maybe`, `number` | 각 타입 문서 |
| `<클래스이름>` | 같은 타입의 다른 인스턴스 | `NumberProductMonoid`, `NumberMaxMonoid` | [Monoid](./Monoid.md) |
| `maybe(<inner>)` | 안쪽 Semigroup 을 지정한 Maybe | `maybe(first)`, `maybe(array)` | [Monoid](./Monoid.md) |
| `plus(<타입>)` | **`Plus` 에서 유도된 Monoid** | `plus(maybe)`, `plus(array)` | [Plus](./Plus.md) |
| `const(<monoid>)` | **`Const` Applicative** | `const(array)`, `const(number)` | [Applicative](./Applicative.md) |
| `statet(<M>)` 등 | Transformer | `statet(maybe)`, `eithert(task)` | [StateT](./StateT.md) |

`identity` 도 `Functor`/`Apply`/`Applicative` 세 곳에 등록돼 있습니다 —
`traverse` 에 넘겨 "그냥 매핑" 으로 쓰는 것입니다([Applicative](./Applicative.md)).

### 데이터 타입

| 타입 | 주요 용도 | 핵심 특징 |
|------|----------|----------|
| Maybe | null 안전 처리 | Just / Nothing |
| Either | 에러 처리 (fail-fast) | Right / Left |
| Validation | 병렬 검증 (에러 누적) | Valid / Invalid (Monoid) |
| Task | 비동기 처리 | Lazy Promise |
| Reader | 의존성 주입 | 환경 전파 |
| Writer | 로깅/출력 추적 | 값 + 출력 (Monoid) |
| State | 상태 변환 | 상태 스레딩 |
| Free | DSL, 스택 안전 재귀 | Pure / Impure |
| [Optics](./Optics.md) | 부분 접근·갱신 | `Optics` 모듈 — Lens/Prism/Traversal, `compose`, `foldMapOf` |
| [Lens](./Lens.md) | 중첩 불변 갱신 | getter + setter 쌍, 대상 정확히 1개 |
| [Transducer](./Transducer.md) | 변환 파이프라인 | 중간 배열 없음, 조기 종료 |
| [Actor](./Actor.md) | 순차 메시지 처리 | 큐 + 상태, `send`가 Task |

### Monad Transformer

두 모나드를 합성합니다. **`M`은 문자열로 넘기십시오** (`StateT('maybe')`) — 객체를 넘기면
타입명이 실행 순서에 따라 달라집니다. 자세한 내용은 [StateT](./StateT.md)를 보십시오.

| 타입 | 합성 | 실행 | 결과 |
|------|------|------|------|
| [StateT](./StateT.md) | State + M | `runState(s, p)` | `M [a, s]` |
| [EitherT](./EitherT.md) | Either + M | `runEitherT(p)` | `M (Either e a)` |
| [ReaderT](./ReaderT.md) | Reader + M | `runReaderT(env, p)` | `M a` |
| [WriterT](./WriterT.md) | Writer + M | `runWriterT(p)` | `M [a, w]` |

## 자주 쓰는 패턴

### 안전한 null 처리 (Maybe.pipeK)
```javascript
const { Maybe } = FunFP;

const getAddress = user => user.address ? Maybe.of(user.address) : Maybe.Nothing();
const getCity = addr => addr.city ? Maybe.of(addr.city) : Maybe.Nothing();

// pipeK로 깔끔하게 체이닝
const getCityFromUser = Maybe.pipeK(getAddress, getCity);

getCityFromUser({ name: 'Alice', address: { city: 'Seoul' } });  // Just('Seoul')
getCityFromUser({ name: 'Bob' });  // Nothing
```

### 에러 처리 파이프라인 (Either.pipeK)
```javascript
const { Either } = FunFP;

const parseNumber = str => {
    const n = parseInt(str);
    return isNaN(n) ? Either.Left('Not a number') : Either.Right(n);
};
const validatePositive = n => n > 0 ? Either.Right(n) : Either.Left('Must be positive');

// pipeK로 검증 파이프라인 구성
const validate = Either.pipeK(parseNumber, validatePositive);

validate('50');   // Right(50)
validate('abc');  // Left('Not a number')
validate('-5');   // Left('Must be positive')
```

### 비동기 순차 실행
```javascript
const fetchUser = id => Task.of({ id, name: 'Alice' });
const { Chain, Task } = FunFP;
const { chain } = Chain.lookup('task');

const fetchData = userId =>
    chain(user => fetchPosts(user.id),
        chain(posts => fetchComments(posts[0].id),
            fetchUser(userId)));

fetchData(1).fork(console.error, console.log);
```

### 병렬 실행 후 결합
```javascript
const fetchComments = postId => Task.of([{ id: 1, postId, body: '댓글' }]);
const fetchPosts = userId => Task.of([{ id: 1, userId, title: '첫 글' }]);
const fetchUser = id => Task.of({ id, name: 'Alice' });
const { Task } = FunFP;

Task.all([
    fetchUser(1),
    fetchPosts(1),
    fetchComments(1)
]).fork(
    console.error,
    ([user, posts, comments]) => ({ user, posts, comments })
);
```

### pipe 유틸리티로 가독성 개선
```javascript
const userId = 1;
const fetchUser = id => Task.of({ id, name: 'Alice' });
const fetchPosts = uid => Task.of([{ id: 10, uid, title: '첫 글' }]);
const fetchComments = postId => Task.of([{ id: 100, postId, body: '댓글' }]);
const { pipe, Chain } = FunFP;
const { chain } = Chain.lookup('task');

// pipe 는 함수를 돌려준다 — 값이 아니라 함수들을 넘기고 마지막에 적용한다
pipe(
    task => chain(user => fetchPosts(user.id), task),
    task => chain(posts => fetchComments(posts[0].id), task)
)(fetchUser(userId)).fork(console.error, console.log);
```

## `index.js` 를 고치려면

[내부 구조](./internals.md) — `.type` 규칙, `'any'`, `Plus`→`Monoid` 유도, Identity/Const,
검사 겹을 벗기는 자리, optics 의 Profunctor 인코딩, 트랜스포머 등록, 레지스트리 쓰기 경로.
**소스 주석은 한 줄 힌트만 두고 근거는 그쪽에 모읍니다.**

## 더 알아보기

- [Static Land Specification](https://github.com/fantasyland/static-land)
- [Fantasy Land Specification](https://github.com/fantasyland/fantasy-land)
