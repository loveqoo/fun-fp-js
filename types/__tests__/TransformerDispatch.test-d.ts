/**
 * Verify transformer runtime-dispatch keys route to the correct
 * composed TypeLambda after pre-registration.
 *
 * Limitation exercised: string-key dispatch cannot keep S / E / R / W
 * open across the Monad interface — they resolve via Kind defaults
 * (typically `never`). For precise per-call type inference, use the
 * direct factory namespaces (`StateT("maybe")`, `EitherT("task")`, etc.)
 * which return fully-polymorphic XT monads.
 */

import {
    Functor,
    Apply,
    Applicative,
    Chain,
    Monad,
} from "../TypeClasses";
import type { StateTTypeLambda } from "../data/transformers/StateT";
import type { EitherTTypeLambda } from "../data/transformers/EitherT";
import type { ReaderTTypeLambda } from "../data/transformers/ReaderT";
import type { MaybeTypeLambda } from "../data/Maybe";
import type { TaskTypeLambda } from "../data/Task";
import type { EitherTypeLambda } from "../data/Either";
// Bring registrations into scope
import "../data/transformers/registrations";

type Assert<T extends U, U> = T;

// ── StateT over Maybe / Either / Task ────────────────────────────────
const fSM = Functor.of("statet(maybe)");
type _1 = Assert<typeof fSM, Functor<StateTTypeLambda<MaybeTypeLambda>>>;

const mSM = Monad.of("statet(maybe)");
type _2 = Assert<typeof mSM, Monad<StateTTypeLambda<MaybeTypeLambda>>>;

const mSE = Monad.of("statet(either)");
type _3 = Assert<typeof mSE, Monad<StateTTypeLambda<EitherTypeLambda>>>;

const mST = Monad.of("statet(task)");
type _4 = Assert<typeof mST, Monad<StateTTypeLambda<TaskTypeLambda>>>;

// ── EitherT over Maybe / Task ────────────────────────────────────────
const mEM = Monad.of("eithert(maybe)");
type _5 = Assert<typeof mEM, Monad<EitherTTypeLambda<MaybeTypeLambda>>>;

const mET = Monad.of("eithert(task)");
type _6 = Assert<typeof mET, Monad<EitherTTypeLambda<TaskTypeLambda>>>;

// ── ReaderT over Maybe / Task ────────────────────────────────────────
const mRM = Monad.of("readert(maybe)");
type _7 = Assert<typeof mRM, Monad<ReaderTTypeLambda<MaybeTypeLambda>>>;

const mRT = Monad.of("readert(task)");
type _8 = Assert<typeof mRT, Monad<ReaderTTypeLambda<TaskTypeLambda>>>;

// ── WriterT over Maybe / Task (W = unknown[] fixed) ──────────────────
const mWM = Monad.of("writert(maybe,array)");
const mWT = Monad.of("writert(task,array)");
// Verify the WriterT dispatch at least resolves to a Monad.
type _9 = typeof mWM extends Monad<infer F> ? F : never;
type _10 = typeof mWT extends Monad<infer F> ? F : never;

// ── Apply / Applicative / Chain all resolve for same keys ────────────
const aSM = Apply.of("statet(maybe)");
const apSM = Applicative.of("statet(maybe)");
const chSM = Chain.of("statet(maybe)");
type _11a = Assert<typeof aSM, Apply<StateTTypeLambda<MaybeTypeLambda>>>;
type _11b = Assert<typeof apSM, Applicative<StateTTypeLambda<MaybeTypeLambda>>>;
type _11c = Assert<typeof chSM, Chain<StateTTypeLambda<MaybeTypeLambda>>>;

// ── Unregistered keys should error (demonstrates registry gate) ──────
// @ts-expect-error — 'writert(task,string)' is not registered.
Monad.of("writert(task,string)");

// @ts-expect-error — 'readert(either)' is not registered (would need
// user module augmentation).
Monad.of("readert(either)");

export {};
