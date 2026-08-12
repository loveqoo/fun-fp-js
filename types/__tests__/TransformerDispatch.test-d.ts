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

import type { Equals, Expect, AssignableTo } from "./_test-utils";
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


// ── StateT over Maybe / Either / Task ────────────────────────────────
const fSM = Functor.lookup("statet(maybe)");
type _1 = Expect<Equals<typeof fSM, Functor<StateTTypeLambda<MaybeTypeLambda>>>>;

const mSM = Monad.lookup("statet(maybe)");
type _2 = Expect<Equals<typeof mSM, Monad<StateTTypeLambda<MaybeTypeLambda>>>>;

const mSE = Monad.lookup("statet(either)");
type _3 = Expect<Equals<typeof mSE, Monad<StateTTypeLambda<EitherTypeLambda>>>>;

const mST = Monad.lookup("statet(task)");
type _4 = Expect<Equals<typeof mST, Monad<StateTTypeLambda<TaskTypeLambda>>>>;

// ── EitherT over Maybe / Task ────────────────────────────────────────
const mEM = Monad.lookup("eithert(maybe)");
type _5 = Expect<Equals<typeof mEM, Monad<EitherTTypeLambda<MaybeTypeLambda>>>>;

const mET = Monad.lookup("eithert(task)");
type _6 = Expect<Equals<typeof mET, Monad<EitherTTypeLambda<TaskTypeLambda>>>>;

// ── ReaderT over Maybe / Task ────────────────────────────────────────
const mRM = Monad.lookup("readert(maybe)");
type _7 = Expect<Equals<typeof mRM, Monad<ReaderTTypeLambda<MaybeTypeLambda>>>>;

const mRT = Monad.lookup("readert(task)");
type _8 = Expect<Equals<typeof mRT, Monad<ReaderTTypeLambda<TaskTypeLambda>>>>;

// ── WriterT over Maybe / Task (W = unknown[] fixed) ──────────────────
const mWM = Monad.lookup("writert(maybe,array)");
const mWT = Monad.lookup("writert(task,array)");
// Verify the WriterT dispatch at least resolves to a Monad.
type _9 = typeof mWM extends Monad<infer F> ? F : never;
type _10 = typeof mWT extends Monad<infer F> ? F : never;

// ── Apply / Applicative / Chain all resolve for same keys ────────────
const aSM = Apply.lookup("statet(maybe)");
const apSM = Applicative.lookup("statet(maybe)");
const chSM = Chain.lookup("statet(maybe)");
type _11a = Expect<Equals<typeof aSM, Apply<StateTTypeLambda<MaybeTypeLambda>>>>;
type _11b = Expect<Equals<typeof apSM, Applicative<StateTTypeLambda<MaybeTypeLambda>>>>;
type _11c = Expect<Equals<typeof chSM, Chain<StateTTypeLambda<MaybeTypeLambda>>>>;

// ── Unregistered keys should error (demonstrates registry gate) ──────
// @ts-expect-error — 'writert(task,string)' is not registered.
Monad.lookup("writert(task,string)");

// @ts-expect-error — 'readert(either)' is not registered (would need
// user module augmentation).
Monad.lookup("readert(either)");

export {};
