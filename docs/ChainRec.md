# ChainRec

**스택 안전한 재귀를 위한 타입**

## 개념

ChainRec은 **무한 재귀를 스택 오버플로 없이 실행**할 수 있게 합니다.

일반 재귀는 깊어지면 스택 오버플로가 발생하지만, ChainRec은 트램폴린 기법으로 이를 방지합니다.

## 인터페이스

```javascript
ChainRec.chainRec(f, initial): Monad a
// f: (next, done, value) -> Monad (Either next done)
// next: value -> { tag: 'next', value }  (계속)
// done: value -> { tag: 'done', value }  (종료)
```

## 사용 예시

### 기본 사용

```javascript
import FunFP from 'fun-fp-js';
const { ChainRec, Either } = FunFP;

// 1부터 n까지 합
const sumTo = n => ChainRec.types.EitherChainRec.chainRec(
    (next, done, { sum, i }) =>
        i > n
            ? Either.Right(done(sum))       // 종료
            : Either.Right(next({ sum: sum + i, i: i + 1 })),  // 계속
    { sum: 0, i: 1 }
);

sumTo(10);  // Right(55)
sumTo(1000000);  // 스택 오버플로 없이 동작!
```

### 대용량 반복

```javascript
// 일반 재귀 - 스택 오버플로!
const countNormal = n => n === 0 ? 0 : 1 + countNormal(n - 1);
countNormal(100000);  // RangeError: Maximum call stack size exceeded

// ChainRec - 안전!
const countSafe = n => ChainRec.types.EitherChainRec.chainRec(
    (next, done, i) =>
        i >= n
            ? Either.Right(done(i))
            : Either.Right(next(i + 1)),
    0
);

countSafe(100000);  // Right(100000)
```

## 실용적 예시

### 페이지네이션 루프

```javascript
const { Functor } = FunFP;
const { map } = Functor.types.TaskFunctor;

const fetchAllPages = () => ChainRec.types.TaskChainRec.chainRec(
    (next, done, { page, items }) =>
        map(
            response => {
                const allItems = [...items, ...response.data];
                return response.hasMore
                    ? next({ page: page + 1, items: allItems })
                    : done(allItems);
            },
            fetchPage(page)
        ),
    { page: 1, items: [] }
);

fetchAllPages().fork(
    console.error,
    allItems => console.log('All items:', allItems.length)
);
```

### 파일 라인 처리

```javascript
const processLines = (lines) => ChainRec.types.EitherChainRec.chainRec(
    (next, done, { remaining, results }) => {
        if (remaining.length === 0) {
            return Either.Right(done(results));
        }
        const [line, ...rest] = remaining;
        const processed = parseLine(line);
        return processed.isLeft()
            ? processed  // 에러 시 즉시 종료
            : Either.Right(next({
                remaining: rest,
                results: [...results, processed.value]
            }));
    },
    { remaining: lines, results: [] }
);
```

## ChainRec vs 일반 재귀

| | 일반 재귀 | ChainRec |
|---|---|---|
| 스택 | 누적 | 일정 |
| 대용량 | 오버플로 | 안전 |
| 성능 | 보통 | 조금 느림 |
| 코드 | 간단 | 조금 복잡 |

## 언제 ChainRec을 쓰나?

- 반복 횟수가 예측 불가할 때
- 대용량 데이터 처리
- 무한 스트림 처리
- 재시도 로직

## 관련 타입 클래스

- **Chain**: chain 연산 (ChainRec은 Chain을 확장)
- **Monad**: of + chain
