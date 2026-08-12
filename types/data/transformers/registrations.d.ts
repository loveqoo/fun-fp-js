/**
 * Pre-registered runtime dispatch keys for the most common transformer
 * combinations. Runtime generates keys like `statet(maybe)` when
 * `StateT("maybe")` is first called; we mirror those keys in the
 * type-class `*Instances` maps so that `Monad.lookup("statet(maybe)")` etc.
 * resolve to the correct composed TypeLambda.
 *
 * Scope: only the 5 class interfaces populated by
 * `registerTransformerTypeClasses` at runtime — Functor, Apply,
 * Applicative, Chain, Monad. Foldable/Traversable/Bifunctor are NOT
 * registered because the runtime does not produce instances for them.
 *
 * Combinations covered:
 *   StateT:   over Maybe, Either, Task
 *   EitherT:  over Maybe, Task
 *   ReaderT:  over Maybe, Task
 *   WriterT:  over Maybe, Task (monoid = array, i.e. W = unknown[])
 *
 * Users who need other combinations can follow the same pattern via
 * module augmentation in their own code.
 *
 * Caveat: dispatching via string (`Monad.lookup("statet(maybe)")`) loses S
 * tracking — `StateT<Maybe, S, A>` resolves with S = never via Kind
 * defaults. For precise S, use the direct namespace `StateT("maybe")`
 * which returns `StateTMonad<MaybeTypeLambda>` with proper polymorphism.
 */

import type { TypeLambda } from "../../HKT";
import type { StateTTypeLambda, StateT } from "./StateT";
import type { EitherTTypeLambda, EitherT } from "./EitherT";
import type { ReaderTTypeLambda, ReaderT } from "./ReaderT";
import type { WriterT } from "./WriterT";
import type { MaybeTypeLambda } from "../Maybe";
import type { EitherTypeLambda } from "../Either";
import type { TaskTypeLambda } from "../Task";

// ─── Pre-applied WriterT TypeLambdas (M, W fixed) ────────────────────
// WriterT's W comes from the Monoid arg at runtime; we pre-apply `W` so
// dispatch gives a specific monad instance.
interface WriterTArrayMaybeTypeLambda extends TypeLambda {
    readonly type: WriterT<MaybeTypeLambda, unknown[], this["Target"]>;
}
interface WriterTArrayTaskTypeLambda extends TypeLambda {
    readonly type: WriterT<TaskTypeLambda, unknown[], this["Target"]>;
}

declare module "../../TypeClasses" {
    interface FunctorInstances {
        // StateT
        readonly "statet(maybe)":  StateTTypeLambda<MaybeTypeLambda>;
        readonly "statet(either)": StateTTypeLambda<EitherTypeLambda>;
        readonly "statet(task)":   StateTTypeLambda<TaskTypeLambda>;
        // EitherT
        readonly "eithert(maybe)": EitherTTypeLambda<MaybeTypeLambda>;
        readonly "eithert(task)":  EitherTTypeLambda<TaskTypeLambda>;
        // ReaderT
        readonly "readert(maybe)": ReaderTTypeLambda<MaybeTypeLambda>;
        readonly "readert(task)":  ReaderTTypeLambda<TaskTypeLambda>;
        // WriterT (W = unknown[], the runtime array-monoid default)
        readonly "writert(maybe,array)": WriterTArrayMaybeTypeLambda;
        readonly "writert(task,array)":  WriterTArrayTaskTypeLambda;
    }
    interface ApplyInstances {
        readonly "statet(maybe)":  StateTTypeLambda<MaybeTypeLambda>;
        readonly "statet(either)": StateTTypeLambda<EitherTypeLambda>;
        readonly "statet(task)":   StateTTypeLambda<TaskTypeLambda>;
        readonly "eithert(maybe)": EitherTTypeLambda<MaybeTypeLambda>;
        readonly "eithert(task)":  EitherTTypeLambda<TaskTypeLambda>;
        readonly "readert(maybe)": ReaderTTypeLambda<MaybeTypeLambda>;
        readonly "readert(task)":  ReaderTTypeLambda<TaskTypeLambda>;
        readonly "writert(maybe,array)": WriterTArrayMaybeTypeLambda;
        readonly "writert(task,array)":  WriterTArrayTaskTypeLambda;
    }
    interface ApplicativeInstances {
        readonly "statet(maybe)":  StateTTypeLambda<MaybeTypeLambda>;
        readonly "statet(either)": StateTTypeLambda<EitherTypeLambda>;
        readonly "statet(task)":   StateTTypeLambda<TaskTypeLambda>;
        readonly "eithert(maybe)": EitherTTypeLambda<MaybeTypeLambda>;
        readonly "eithert(task)":  EitherTTypeLambda<TaskTypeLambda>;
        readonly "readert(maybe)": ReaderTTypeLambda<MaybeTypeLambda>;
        readonly "readert(task)":  ReaderTTypeLambda<TaskTypeLambda>;
        readonly "writert(maybe,array)": WriterTArrayMaybeTypeLambda;
        readonly "writert(task,array)":  WriterTArrayTaskTypeLambda;
    }
    interface ChainInstances {
        readonly "statet(maybe)":  StateTTypeLambda<MaybeTypeLambda>;
        readonly "statet(either)": StateTTypeLambda<EitherTypeLambda>;
        readonly "statet(task)":   StateTTypeLambda<TaskTypeLambda>;
        readonly "eithert(maybe)": EitherTTypeLambda<MaybeTypeLambda>;
        readonly "eithert(task)":  EitherTTypeLambda<TaskTypeLambda>;
        readonly "readert(maybe)": ReaderTTypeLambda<MaybeTypeLambda>;
        readonly "readert(task)":  ReaderTTypeLambda<TaskTypeLambda>;
        readonly "writert(maybe,array)": WriterTArrayMaybeTypeLambda;
        readonly "writert(task,array)":  WriterTArrayTaskTypeLambda;
    }
    interface MonadInstances {
        readonly "statet(maybe)":  StateTTypeLambda<MaybeTypeLambda>;
        readonly "statet(either)": StateTTypeLambda<EitherTypeLambda>;
        readonly "statet(task)":   StateTTypeLambda<TaskTypeLambda>;
        readonly "eithert(maybe)": EitherTTypeLambda<MaybeTypeLambda>;
        readonly "eithert(task)":  EitherTTypeLambda<TaskTypeLambda>;
        readonly "readert(maybe)": ReaderTTypeLambda<MaybeTypeLambda>;
        readonly "readert(task)":  ReaderTTypeLambda<TaskTypeLambda>;
        readonly "writert(maybe,array)": WriterTArrayMaybeTypeLambda;
        readonly "writert(task,array)":  WriterTArrayTaskTypeLambda;
    }
}
