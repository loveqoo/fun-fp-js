# MonadError

**실패를 일급으로 다루는 모나드** — 실패를 만들고(`raiseError`) 잡는(`handleError`) 계약

## 개념

실패를 다루는 문은 타입마다 흩어져 있습니다 — `Task` 는 `rejected` 와 `catchError`,
`Either` 는 `Left`. MonadError 는 그 흩어진 문에 하나의 이름을 줍니다. 그러면 실패를
다루는 조합자를 한 번 쓰고 어느 타입에나 적용할 수 있습니다.

```javascript
const { MonadError, Task, Either } = FunFP;

// 같은 retry 를 두 타입에 — 이것이 타입 클래스의 값어치다
const fallbackTo = (ME, backup) => program => ME.handleError(() => backup, program);

const T = MonadError.lookup('task');
fallbackTo(T, Task.of('예비'))(Task.rejected(new Error('실패')))
    .fork(console.error, v => {
        if (v !== '예비') throw new Error('복구가 틀렸다');
        console.log(v);   // 예비
    });

const E = MonadError.lookup('either');
const r = fallbackTo(E, Either.of('예비'))(Either.Left('실패'));
if (r.value !== '예비') throw new Error('복구가 틀렸다');
console.log(r.value);     // 예비
```

## 연산 둘

```javascript
const { MonadError, Either } = FunFP;
const ME = MonadError.lookup('either');

// raiseError — 실패를 만든다 (of 의 실패판)
console.log(ME.raiseError('문제').isLeft());   // true

// handleError — 실패를 잡는다 (chain 의 실패판). 핸들러는 같은 타입을 돌려준다
console.log(ME.handleError(e => Either.of('복구:' + e), ME.raiseError('문제')).value);
// 복구:문제

// 성공은 건드리지 않는다
console.log(ME.handleError(e => Either.of('안 됨'), ME.of(7)).value);   // 7
```

## 법칙

법칙 게이트(`staticland-laws` 동기 + `task-async-laws` 비동기)가 돌립니다. 실패한
Task 표본은 전부터 Functor·Monad 법칙에 들어 있었지만, **실패를 만들고 잡는 연산
자체를 전용 법칙으로 고정한 클래스는 이것이 처음**입니다.

1. 잡으면 핸들러가 이긴다 — `handleError(f, raiseError(e)) ≡ f(e)`
2. 성공은 불변 — `handleError(f, of(a)) ≡ of(a)`
3. 중첩/재실패 — 핸들러가 다시 실패하면 바깥 핸들러가 잡는다
4. 실패는 사슬을 단락시킨다 — `chain(f, raiseError(e)) ≡ raiseError(e)`

## 주의 — 타입마다 검증 시점이 다릅니다

핸들러가 그 타입이 아닌 것을 돌려주면 거부되는데, 시점과 문안이 다릅니다:
Either 는 **즉시** `MonadError.handleError: handler must return an Either` 로 던지고,
Task 는 게을러서 **실행(fork) 시점**에 기존 문안 `Task.catchError: handler must
return a Task` 로 거부합니다.

```javascript
const { MonadError, Either } = FunFP;
let thrown = '';
try { MonadError.lookup('either').handleError(() => 42, Either.Left('X')); }
catch (e) { thrown = e.message; }
console.log(thrown);   // MonadError.handleError: handler must return an Either
```

그리고 `Either.catch` 와 혼동하지 마십시오 — 그것은 **던지는 함수를 감싸** Either 로
만드는 문이고, 실패를 복구하는 문은 `handleError` 입니다.

## 등록되지 않은 타입

- **Maybe** — `Nothing` 은 에러 값을 지니지 않아 "핸들러가 에러를 받는다"는 법칙이
  공허해집니다. 실패의 대안은 `Alt.alt` 가 이미 맡고 있습니다.
- **Validation** — Monad 가 아니고(실패를 누적), 복구 의미론이 어긋납니다.

## 관련 타입 클래스

- [Monad](./Monad.md) — MonadError 는 Monad 를 상속합니다 (`of`/`chain`/`map` 포함)
- [Alt](./Alt.md) — 값 없는 실패의 대안 선택 (Maybe 의 자리)
