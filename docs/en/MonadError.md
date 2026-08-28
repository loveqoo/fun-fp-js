# MonadError

> 한국어: [../MonadError.md](../MonadError.md)

**A monad that treats failure as a first-class citizen**: a contract for
making failures (`raiseError`) and catching them (`handleError`)

## Concept

The door to handling failure is scattered across types: `Task` has
`rejected` and `catchError`, `Either` has `Left`. MonadError gives that
scattered door a single name. Then a combinator that handles failure can be
written once and applied to any type.

```javascript
const { MonadError, Task, Either } = FunFP;

// the same retry, applied to two types — that's what a type class is worth
const fallbackTo = (ME, backup) => program => ME.handleError(() => backup, program);

const T = MonadError.lookup('task');
fallbackTo(T, Task.of('backup'))(Task.rejected(new Error('failure')))
    .fork(console.error, v => {
        if (v !== 'backup') throw new Error('recovery is wrong');
        console.log(v);   // backup
    });

const E = MonadError.lookup('either');
const r = fallbackTo(E, Either.of('backup'))(Either.Left('failure'));
if (r.value !== 'backup') throw new Error('recovery is wrong');
console.log(r.value);     // backup
```

## Two operations

```javascript
const { MonadError, Either } = FunFP;
const ME = MonadError.lookup('either');

// raiseError — creates a failure (of's failure counterpart)
console.log(ME.raiseError('problem').isLeft());   // true

// handleError — catches a failure (chain's failure counterpart). The handler returns the same type
console.log(ME.handleError(e => Either.of('recovered:' + e), ME.raiseError('problem')).value);
// recovered:problem

// success is left untouched
console.log(ME.handleError(e => Either.of('not used'), ME.of(7)).value);   // 7
```

## Laws

The law gate (`staticland-laws` synchronous + `task-async-laws` asynchronous)
runs them. Failed Task samples had already been part of the Functor and Monad
laws, but **this is the first class to pin the failure-making and
failure-catching operations themselves down with dedicated laws.**

1. Catching means the handler wins: `handleError(f, raiseError(e)) ≡ f(e)`
2. Success is unchanged: `handleError(f, of(a)) ≡ of(a)`
3. Nesting/re-failure: if the handler fails again, the outer handler catches it
4. Failure short-circuits the chain: `chain(f, raiseError(e)) ≡ raiseError(e)`

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

And do not confuse this with `Either.catch`: that door **wraps a
throwing function** and turns it into an Either; the door for recovering
from a failure is `handleError`.

## Types not registered

- **Maybe**: `Nothing` carries no error value, so the law "the handler
  receives an error" becomes vacuous. Choosing an alternative to failure is
  already `Alt.alt`'s job.
- **Validation**: it is not a Monad (it accumulates failures), and the
  recovery semantics do not line up.

## Related type classes

- [Monad](./Monad.md): MonadError inherits Monad (including `of`/`chain`/`map`)
- [Alt](./Alt.md): choosing an alternative on failure without a value (Maybe's place)
