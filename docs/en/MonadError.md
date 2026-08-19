# MonadError

> 한국어: [../MonadError.md](../MonadError.md)

**A monad that treats failure as a first-class citizen** — a contract for
making failures (`raiseError`) and catching them (`handleError`)

## Concept

The door to handling failure is scattered across types — `Task` has
`rejected` and `catchError`, `Either` has `Left`. MonadError gives that
scattered door a single name. Then a combinator that handles failure can be
written once and applied to any type.

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

## Two operations

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

## Laws

The law gate (`staticland-laws` synchronous + `task-async-laws` asynchronous)
runs them. Failed Task samples had already been part of the Functor and Monad
laws, but **this is the first class to pin the failure-making and
failure-catching operations themselves down with dedicated laws.**

1. Catching means the handler wins — `handleError(f, raiseError(e)) ≡ f(e)`
2. Success is unchanged — `handleError(f, of(a)) ≡ of(a)`
3. Nesting/re-failure — if the handler fails again, the outer handler catches it
4. Failure short-circuits the chain — `chain(f, raiseError(e)) ≡ raiseError(e)`

## Note — the point of validation differs by type

If the handler returns something that is not of that type, it is rejected,
but the timing and wording differ: Either throws **immediately** with
`MonadError.handleError: handler must return an Either`, while Task is lazy
and is rejected only **at run (fork) time**, with the existing wording
`Task.catchError: handler must return a Task`.

```javascript
const { MonadError, Either } = FunFP;
let thrown = '';
try { MonadError.lookup('either').handleError(() => 42, Either.Left('X')); }
catch (e) { thrown = e.message; }
console.log(thrown);   // MonadError.handleError: handler must return an Either
```

And do not confuse this with `Either.catch` — that door **wraps a
throwing function** and turns it into an Either; the door for recovering
from a failure is `handleError`.

## Types not registered

- **Maybe** — `Nothing` carries no error value, so the law "the handler
  receives an error" becomes vacuous. Choosing an alternative to failure is
  already `Alt.alt`'s job.
- **Validation** — it is not a Monad (it accumulates failures), and the
  recovery semantics do not line up.

## Related type classes

- [Monad](./Monad.md) — MonadError inherits Monad (including `of`/`chain`/`map`)
- [Alt](./Alt.md) — choosing an alternative on failure without a value (Maybe's place)
