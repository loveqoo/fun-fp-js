/**
 * Public entry point for fun-fp-js TypeScript declarations.
 *
 * Two import patterns are supported:
 *
 *  1. Default import — mirrors the runtime:
 *
 *        import fp from 'fun-fp-js';
 *        const m = fp.Maybe.Just(42);
 *
 *  2. Named type-only imports — for types that don't exist at runtime
 *     as standalone symbols:
 *
 *        import type { Maybe, Either, TypeLambda, Kind } from 'fun-fp-js';
 *
 *     Named *value* imports (e.g. `import { Maybe } from 'fun-fp-js'`)
 *     work under CommonJS/UMD interop but may not resolve in pure ESM
 *     environments where the runtime only exposes a default export.
 *     Use the default form there.
 *
 * Builtin module augmentations (Array / Function on type-class registries
 * and concrete-type instance maps) are pulled in via the import below so
 * users don't need to import './data/builtins' themselves.
 */

// ── HKT core ─────────────────────────────────────────────────────────
export * from "./HKT";

// ── Type classes + dispatch ──────────────────────────────────────────
export * from "./TypeClasses";

// ── JS built-in TypeLambdas + their type-class registrations ─────────
export * from "./TypeLambdas";
import "./data/builtins";

// ── Data types ───────────────────────────────────────────────────────
export * from "./data/Identity";
export * from "./data/Maybe";
export * from "./data/Either";
export * from "./data/Task";
export * from "./data/Validation";
export * from "./data/Reader";
export * from "./data/Writer";
export * from "./data/State";
export * from "./data/Free";

// ── Monad transformers ───────────────────────────────────────────────
export * from "./data/transformers/StateT";
export * from "./data/transformers/EitherT";
export * from "./data/transformers/ReaderT";
export * from "./data/transformers/WriterT";
import "./data/transformers/registrations";

// ── Standalone features ──────────────────────────────────────────────
export * from "./Lens";
export * from "./Actor";
export * from "./transducer";
export * from "./extra";
export * from "./runtime";
export * from "./utilities";

// ── Default export matching the runtime's `export default { ... }` ──
import type {
    Algebra,
    Setoid,
    Ord,
    Semigroup,
    Monoid,
    Group,
    Semigroupoid,
    Category,
    Filterable,
    Functor,
    Bifunctor,
    Contravariant,
    Profunctor,
    Apply,
    Applicative,
    Alt,
    Plus,
    Alternative,
    Chain,
    ChainRec,
    Monad,
    MonadError,
    Foldable,
    Extend,
    Comonad,
    Traversable,
} from "./TypeClasses";
import type { Maybe } from "./data/Maybe";
import type { Either } from "./data/Either";
import type { Task } from "./data/Task";
import type { Free } from "./data/Free";
import type { Validation } from "./data/Validation";
import type { Reader } from "./data/Reader";
import type { Writer } from "./data/Writer";
import type { State } from "./data/State";
import type { StateT } from "./data/transformers/StateT";
import type { EitherT } from "./data/transformers/EitherT";
import type { ReaderT } from "./data/transformers/ReaderT";
import type { WriterT } from "./data/transformers/WriterT";
import type { Actor } from "./Actor";
import type { Optics } from "./Lens";
import type {
    identity,
    compose,
    compose2,
    sequence,
    foldMap,
    lift,
    pipeK,
    composeK,
    runCatch,
    constant,
    tuple,
    apply,
    unapply,
    unapply2,
    curry,
    curry2,
    uncurry,
    uncurry2,
    predicate,
    predicateN,
    negate,
    negateN,
    flip,
    flip2,
    flipCurried,
    flipCurried2,
    pipe,
    pipe2,
    pipeWhile,
    tap,
    also,
    into,
    useOrLift,
    partial,
    once,
    converge,
    range,
    rangeBy,
} from "./utilities";
import type { transducer } from "./transducer";
import type { trampoline } from "./data/Free";
import type { extra } from "./extra";
import type {
    setStrictMode,
    setTapErrorHandler,
} from "./runtime";

declare const fp: {
    readonly Algebra: typeof Algebra;
    readonly Setoid: typeof Setoid;
    readonly Ord: typeof Ord;
    readonly Semigroup: typeof Semigroup;
    readonly Monoid: typeof Monoid;
    readonly Group: typeof Group;
    readonly Semigroupoid: typeof Semigroupoid;
    readonly Category: typeof Category;
    readonly Filterable: typeof Filterable;
    readonly Functor: typeof Functor;
    readonly Bifunctor: typeof Bifunctor;
    readonly Contravariant: typeof Contravariant;
    readonly Profunctor: typeof Profunctor;
    readonly Apply: typeof Apply;
    readonly Applicative: typeof Applicative;
    readonly Alt: typeof Alt;
    readonly Plus: typeof Plus;
    readonly Alternative: typeof Alternative;
    readonly Chain: typeof Chain;
    readonly ChainRec: typeof ChainRec;
    readonly Monad: typeof Monad;
    readonly MonadError: typeof MonadError;
    readonly Foldable: typeof Foldable;
    readonly Extend: typeof Extend;
    readonly Comonad: typeof Comonad;
    readonly Traversable: typeof Traversable;

    readonly Maybe: typeof Maybe;
    readonly Either: typeof Either;
    readonly Task: typeof Task;
    readonly Free: typeof Free;
    readonly Validation: typeof Validation;
    readonly Reader: typeof Reader;
    readonly Writer: typeof Writer;
    readonly State: typeof State;

    readonly StateT: typeof StateT;
    readonly EitherT: typeof EitherT;
    readonly ReaderT: typeof ReaderT;
    readonly WriterT: typeof WriterT;

    readonly Actor: typeof Actor;

    readonly Optics: typeof Optics;

    readonly identity: typeof identity;
    readonly compose: typeof compose;
    readonly compose2: typeof compose2;
    readonly sequence: typeof sequence;
    readonly foldMap: typeof foldMap;
    readonly lift: typeof lift;
    readonly pipeK: typeof pipeK;
    readonly composeK: typeof composeK;
    readonly runCatch: typeof runCatch;
    readonly constant: typeof constant;
    readonly tuple: typeof tuple;
    readonly apply: typeof apply;
    readonly unapply: typeof unapply;
    readonly unapply2: typeof unapply2;
    readonly curry: typeof curry;
    readonly curry2: typeof curry2;
    readonly uncurry: typeof uncurry;
    readonly uncurry2: typeof uncurry2;
    readonly predicate: typeof predicate;
    readonly predicateN: typeof predicateN;
    readonly negate: typeof negate;
    readonly negateN: typeof negateN;
    readonly flip: typeof flip;
    readonly flip2: typeof flip2;
    readonly flipCurried: typeof flipCurried;
    readonly flipCurried2: typeof flipCurried2;
    readonly pipe: typeof pipe;
    readonly pipe2: typeof pipe2;
    readonly pipeWhile: typeof pipeWhile;
    readonly tap: typeof tap;
    readonly also: typeof also;
    readonly into: typeof into;
    readonly useOrLift: typeof useOrLift;
    readonly partial: typeof partial;
    readonly once: typeof once;
    readonly converge: typeof converge;
    readonly range: typeof range;
    readonly rangeBy: typeof rangeBy;
    readonly transducer: typeof transducer;
    readonly trampoline: typeof trampoline;
    readonly extra: typeof extra;

    readonly setStrictMode: typeof setStrictMode;
    readonly setTapErrorHandler: typeof setTapErrorHandler;
};

export default fp;
