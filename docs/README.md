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
- [Maybe](./Maybe.md) - null 안전 처리
- [Either](./Either.md) - 에러 처리
- [Task](./Task.md) - 비동기 처리

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
const { Chain, Task } = FunFP;
const { chain } = Chain.of('task');

const fetchData = userId =>
    chain(user => fetchPosts(user.id),
        chain(posts => fetchComments(posts[0].id),
            fetchUser(userId)));

fetchData(1).fork(console.error, console.log);
```

### 병렬 실행 후 결합
```javascript
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
const { pipe, Chain } = FunFP;
const { chain } = Chain.of('task');

// pipe를 사용하면 좌에서 우로 읽기 쉬움
pipe(
    fetchUser(userId),
    task => chain(user => fetchPosts(user.id), task),
    task => chain(posts => fetchComments(posts[0].id), task)
).fork(console.error, console.log);
```

## 더 알아보기

- [Static Land Specification](https://github.com/fantasyland/static-land)
- [Fantasy Land Specification](https://github.com/fantasyland/fantasy-land)
