/**
 * Negative type-checks: every `// @ts-expect-error` line below MUST
 * produce a type error. If any of these scenarios starts compiling,
 * TypeScript will emit "Unused '@ts-expect-error' directive" (TS2578),
 * failing this file. That's the check — the file passes iff every
 * suppressed line is genuinely an error.
 *
 * Grouped by misuse category.
 */

import fp from "../index";
import { Maybe } from "../data/Maybe";
import { Either } from "../data/Either";
import { Task } from "../data/Task";
import { Validation } from "../data/Validation";
import { Reader } from "../data/Reader";
import { Writer } from "../data/Writer";
import { State } from "../data/State";
import { Free } from "../data/Free";
import { StateT } from "../data/transformers/StateT";
import {
    Functor,
    Monad,
    Chain,
    Plus,
    Alternative,
    Traversable,
    ChainRec,
    Bifunctor,
    Setoid,
    Ord,
    Semigroup,
    Monoid,
    Group,
} from "../TypeClasses";
import type { Just, Nothing } from "../data/Maybe";
import type { Left, Right } from "../data/Either";
import type { Kind } from "../HKT";
import type { MaybeTypeLambda } from "../data/Maybe";

// ═══════════════════════════════════════════════════════════════════
// 1. Registry dispatch — unregistered keys must fail
// ═══════════════════════════════════════════════════════════════════

// @ts-expect-error — 'bogus' is not a FunctorInstances key
Functor.of("bogus");

// @ts-expect-error — typo — 'maybee'
Functor.of("maybee");

// @ts-expect-error — Validation is not a Monad (no chain)
Monad.of("validation");

// @ts-expect-error — Task has no Plus instance (no zero)
Plus.of("task");

// @ts-expect-error — Either has no Plus instance
Plus.of("either");

// @ts-expect-error — Either has no Alternative instance
Alternative.of("either");

// @ts-expect-error — Task has no Traversable (can't fold async)
Traversable.of("task");

// @ts-expect-error — Validation has no ChainRec
ChainRec.of("validation");

// @ts-expect-error — Reader has no Bifunctor
Bifunctor.of("reader");

// ═══════════════════════════════════════════════════════════════════
// 2. Subtype assignment misuse (Just ≠ Nothing, Left ≠ Right)
// ═══════════════════════════════════════════════════════════════════

// @ts-expect-error — Nothing has no `value` field, Just requires one
const j1: Just<number> = Maybe.Nothing();

// @ts-expect-error — Left wraps E, not A
const l1: Left<string> = Either.Right(42);

// @ts-expect-error — Right wraps A, not E
const r1: Right<number> = Either.Left("err");

// ═══════════════════════════════════════════════════════════════════
// 3. Method argument type mismatches
// ═══════════════════════════════════════════════════════════════════

// @ts-expect-error — map's first arg must be a function
Maybe.map(42, Maybe.of(1));

// @ts-expect-error — chain's fn must return Maybe<B>, not raw B
Maybe.chain((x: number) => x + 1, Maybe.of(1));

// @ts-expect-error — chain's second arg must be Maybe<A>
Maybe.chain((x: number) => Maybe.of(String(x)), 42);

// @ts-expect-error — Task.fork requires both reject & resolve callbacks
Task.of(42).fork();

// @ts-expect-error — fold needs all three args
Maybe.fold(() => 0, (_: number) => 1);

// ═══════════════════════════════════════════════════════════════════
// 4. Validation is not a Monad — no .chain on instance or const
// ═══════════════════════════════════════════════════════════════════

declare const v: Validation<string[], number>;
// @ts-expect-error — Validation has no chain method
v.chain(() => Validation.of(1));

// @ts-expect-error — Validation.chain is not exposed on the const
Validation.chain;

// ═══════════════════════════════════════════════════════════════════
// 5. Non-HKT dispatch — concrete-type class keys
// ═══════════════════════════════════════════════════════════════════

// @ts-expect-error — 'task' is not a SetoidInstances key
Setoid.of("task");

// @ts-expect-error — 'maybe' is not in OrdInstances
Ord.of("maybe");

// @ts-expect-error — 'boolean' is not in OrdInstances (only number/string)
Ord.of("boolean");

// @ts-expect-error — Group only has 'number' alias (BooleanXorGroup
// lacks explicit alias)
Group.of("boolean");

// @ts-expect-error — 'task' is not a SemigroupInstances key
Semigroup.of("task");

// @ts-expect-error — 'task' is not a MonoidInstances key
Monoid.of("task");

// ═══════════════════════════════════════════════════════════════════
// 6. Lens construction misuse
// ═══════════════════════════════════════════════════════════════════

// @ts-expect-error — Lens requires BOTH getter and setter
fp.Lens<{ x: number }, number>((s) => s.x);

// setter must return the parent S, not the child A
fp.Lens<{ x: number }, number>(
    (s) => s.x,
    // @ts-expect-error — returned value is number, not { x: number }
    (v, s) => v
);

// ═══════════════════════════════════════════════════════════════════
// 7. Transformer construction
// ═══════════════════════════════════════════════════════════════════

// @ts-expect-error — StateT requires a valid MonadInstances key
StateT("bogus");

// @ts-expect-error — 'validation' isn't a Monad key, so StateT rejects
StateT("validation");

// ═══════════════════════════════════════════════════════════════════
// 8. Kind arity and constraint violations
// ═══════════════════════════════════════════════════════════════════

// @ts-expect-error — Kind requires 5 type args
type Bad1 = Kind<MaybeTypeLambda>;

// @ts-expect-error — too few args
type Bad2 = Kind<MaybeTypeLambda, never>;

// @ts-expect-error — F must be a TypeLambda, not a concrete instantiation
type Bad3 = Kind<Maybe<number>, never, never, never, string>;

// ═══════════════════════════════════════════════════════════════════
// 9. Lift misuse (post-D semantics: liftA_n takes wrapped args)
// ═══════════════════════════════════════════════════════════════════

const addOne = Maybe.lift((n: number) => n + 1);

// @ts-expect-error — lifted fn takes Maybe<number>, not raw number
addOne(42);

// @ts-expect-error — wrong monad wrap
addOne(Either.Right(42));

// ═══════════════════════════════════════════════════════════════════
// 10. Filter predicate type mismatches
// ═══════════════════════════════════════════════════════════════════

// @ts-expect-error — predicate must accept A (number), not string
Maybe.filter((x: string) => x.length > 0, Maybe.of(42));

// ═══════════════════════════════════════════════════════════════════
// 11. of() arity
// ═══════════════════════════════════════════════════════════════════

// @ts-expect-error — Either.of takes 1 value arg only
Either.of<string, number>(42 as number, "err");

// @ts-expect-error — Maybe.of takes 1 arg
Maybe.of();

// ═══════════════════════════════════════════════════════════════════
// 12. Transformer dispatch — unregistered combinations
// ═══════════════════════════════════════════════════════════════════

// @ts-expect-error — no statet(reader) registration
Monad.of("statet(reader)");

// @ts-expect-error — no readert(either) registration
Monad.of("readert(either)");

// @ts-expect-error — no eithert(state) registration
Monad.of("eithert(state)");

// @ts-expect-error — writert(task,string) not pre-registered (only ,array)
Monad.of("writert(task,string)");

// ═══════════════════════════════════════════════════════════════════
// 13. Writer output type mismatch
// ═══════════════════════════════════════════════════════════════════

// chain must return Writer of the same W
const w1 = Writer.of<number, string[]>(1);
Writer.chain(
    (n: number) => Writer.of<string, number[]>(String(n)),
    // @ts-expect-error — w1 has W = string[], but fn returns W = number[]
    w1
);

// ═══════════════════════════════════════════════════════════════════
// 14. State transition type mismatch
// ═══════════════════════════════════════════════════════════════════

// @ts-expect-error — put expects same S
State.put<{ a: number }>({ b: 1 });

// ═══════════════════════════════════════════════════════════════════
// 15. ChainRec callback return must be F<Step<A, B>>
// ═══════════════════════════════════════════════════════════════════

// callback returns raw Step, not Maybe<Step>
Maybe.chainRec<number, string>(
    // @ts-expect-error — raw Step is not assignable to Maybe<Step>
    (next, done, i) => done("ok"),
    0
);

// ═══════════════════════════════════════════════════════════════════
// 16. Alt needs same A
// ═══════════════════════════════════════════════════════════════════

// @ts-expect-error — alt requires same A in both
Maybe.alt(Maybe.of(42), Maybe.of("hi"));

// ═══════════════════════════════════════════════════════════════════
// 17. Reader.run requires the env arg
// ═══════════════════════════════════════════════════════════════════

const r: Reader<{ x: number }, number> = Reader.asks((env) => env.x);
// @ts-expect-error — run requires R arg
r.run();

// ═══════════════════════════════════════════════════════════════════
// 18. Free.liftF requires a Functor value
// ═══════════════════════════════════════════════════════════════════

// @ts-expect-error — liftF's arg must match Kind<F, ..., A>, not raw A
Free.liftF<MaybeTypeLambda, number>(42);

// ═══════════════════════════════════════════════════════════════════
// 19. Narrowing via isLeft/isRight — exclusive access
// ═══════════════════════════════════════════════════════════════════

declare const e: Either<string, number>;
// Before narrowing, `.value` isn't accessible (Either base has none).
// @ts-expect-error — .value not on union
const x = e.value;

export {};
