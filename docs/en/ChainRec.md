# ChainRec

> 한국어: [../ChainRec.md](../ChainRec.md)

**A type for stack-safe recursion**

## Concept

ChainRec lets you **run unbounded recursion without a stack overflow**.

Ordinary recursion overflows the stack once it gets deep enough; ChainRec
prevents this with a trampolining technique.

## Interface

```javascript no-run 시그니처·의사코드 표기
ChainRec.chainRec(f, initial): Monad a
// f: (next, done, value) -> Monad (Either next done)
// next: value -> { tag: 'next', value }  (계속)
// done: value -> { tag: 'done', value }  (종료)
```

## Usage examples

### Basic usage

```javascript
import FunFP from 'fun-fp-js';
const { ChainRec, Either } = FunFP;

const { chainRec } = ChainRec.lookup('either');

// 1부터 n까지 합
const sumTo = n => chainRec(
    (next, done, { sum, i }) =>
        i > n
            ? Either.Right(done(sum))
            : Either.Right(next({ sum: sum + i, i: i + 1 })),
    { sum: 0, i: 1 }
);

sumTo(10);  // Right(55)
sumTo(1000000);  // 스택 오버플로 없이 동작!
```

### Large-scale iteration

```javascript no-run 문제 상황 — 일부러 스택 오버플로
// 일반 재귀 - 스택 오버플로!
const countNormal = n => n === 0 ? 0 : 1 + countNormal(n - 1);
countNormal(100000);  // RangeError: Maximum call stack size exceeded

const { chainRec } = ChainRec.lookup('either');

const countSafe = n => chainRec(
    (next, done, i) =>
        i >= n
            ? Either.Right(done(i))
            : Either.Right(next(i + 1)),
    0
);

countSafe(100000);  // Right(100000)
```

## Practical examples

### Pagination loop

```javascript
const { map } = Functor.lookup('task');
const { chainRec } = ChainRec.lookup('task');

const fetchAllPages = () => chainRec(
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

### Processing file lines

```javascript
const { chainRec } = ChainRec.lookup('either');

const processLines = (lines) => chainRec(
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

## ChainRec vs ordinary recursion

| | Ordinary recursion | ChainRec |
|---|---|---|
| Stack | grows | constant |
| Large scale | overflows | safe |
| Performance | normal | a bit slower |
| Code | simple | a bit more complex |

## When to use ChainRec

- when the number of iterations is unpredictable
- processing large-scale data
- processing infinite streams
- retry logic

## Related type classes

- **Chain**: the `chain` operation (ChainRec extends Chain)
- **Monad**: `of` + `chain`
