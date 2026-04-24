/**
 * Type-level behavior tests for Maybe.
 * Compiled with tsc --noEmit. Any type error here means the declarations
 * in ../data/Maybe.d.ts fail to express the intended semantics.
 */

import type { Kind } from "../HKT";
import { Maybe } from "../data/Maybe";
import type { Just, Nothing, MaybeTypeLambda } from "../data/Maybe";
import { Functor, Monad, Applicative } from "../TypeClasses";
import type { Equals, Expect, AssignableTo } from "./_test-utils";

// ── 1. Constructors return the right subtypes ─────────────────────────
const j1 = Maybe.Just(42);                 // Just<number>
const n1 = Maybe.Nothing();                // Nothing
const m1 = Maybe.of(42);                   // Maybe<number>

type _1a = Expect<Equals<typeof j1, Just<number>>>;
type _1b = Expect<Equals<typeof n1, Nothing>>;
type _1c = Expect<Equals<typeof m1, Maybe<number>>>;
// Subtype assignability (not strict equality):
type _1d = AssignableTo<Just<number>, Maybe<number>>;
type _1e = AssignableTo<Nothing, Maybe<never>>;

// ── 2. map threads the Target slot only ───────────────────────────────
const m2 = Maybe.map((x: number) => String(x), m1);
type _2 = Expect<Equals<typeof m2, Maybe<string>>>;

// ── 3. Type guards narrow via `this is Just<A>` ───────────────────────
declare const m3: Maybe<string>;
if (m3.isJust()) {
    const v: string = m3.value;  // must narrow to Just<string>
    type _3a = Expect<Equals<typeof m3, Just<string>>>;
}
if (m3.isNothing()) {
    type _3b = Expect<Equals<typeof m3, Nothing>>;
}

// ── 4. Functor.of('maybe') resolves via FunctorInstances registry ────
const fMaybe = Functor.of("maybe");
type _4 = Expect<Equals<typeof fMaybe, Functor<MaybeTypeLambda>>>;
const m4 = fMaybe.map((x: string) => x.length, Maybe.of("hi"));
type _4b = Expect<Equals<typeof m4, Maybe<number>>>;

// ── 5. Monad.of('maybe').chain threads types ──────────────────────────
const monadMaybe = Monad.of("maybe");
const m5 = monadMaybe.chain((x: number) => Maybe.of(x + 1), Maybe.of(1));
type _5 = Expect<Equals<typeof m5, Maybe<number>>>;

// ── 6. Applicative.of('maybe').of ─────────────────────────────────────
const appMaybe = Applicative.of("maybe");
const m6 = appMaybe.of(42);
type _6 = Expect<Equals<typeof m6, Maybe<number>>>;

// ── 7. fromNullable strips null|undefined ─────────────────────────────
declare const nullable: string | null | undefined;
const m7 = Maybe.fromNullable(nullable);
type _7 = Expect<Equals<typeof m7, Maybe<string>>>;

// ── 8. Type-guard narrowing on Maybe<A> ───────────────────────────────
declare const m8: Maybe<number>;
if (m8.isJust()) {
    type _8a = Expect<Equals<typeof m8, Just<number>>>;
    const v: number = m8.value;
}
if (m8.isNothing()) {
    type _8b = Expect<Equals<typeof m8, Nothing>>;
}

// ── 9. Kind<MaybeTypeLambda, ...> reduces to Maybe<Target> ────────────
type KMaybe = Kind<MaybeTypeLambda, never, never, never, string>;
declare const k9: KMaybe;
const m9: Maybe<string> = k9;
type _9 = Expect<Equals<KMaybe, Maybe<string>>>;

// ── 10. fold folds into a common result type ──────────────────────────
declare const m10: Maybe<number>;
const r10: string = Maybe.fold(
    () => "empty",
    (n: number) => `got ${n}`,
    m10
);

// ── 11. lift in liftA_n form — takes wrapped args ─────────────────────
const parseNum = Maybe.lift((s: string) => {
    const n = Number(s);
    if (Number.isNaN(n)) throw new Error("nan");
    return n;
});
// Call with Maybe-wrapped arg (liftA_n). Runtime runCatch turns throws
// into `Maybe.Nothing()`.
const m11 = parseNum(Maybe.of("42"));
type _11 = Expect<Equals<typeof m11, Maybe<number>>>;

// 2-arity lift example
const combine = Maybe.lift((a: number, b: number) => a + b);
const m11b = combine(Maybe.of(1), Maybe.of(2));
type _11b = Expect<Equals<typeof m11b, Maybe<number>>>;

// ── 12. filter with type-guard predicate narrows Target ───────────────
declare const m12: Maybe<string | number>;
const m12b = Maybe.filter(
    (x: string | number): x is string => typeof x === "string",
    m12
);
type _12 = Expect<Equals<typeof m12b, Maybe<string>>>;

// ── 13. alt preserves A ───────────────────────────────────────────────
const m13 = Maybe.alt(Maybe.Nothing(), Maybe.of(42));
// Note: TS widens Nothing to Maybe<never>, so result is Maybe<number>
// (effective after alt with Maybe<number>) — check end type
declare const ma: Maybe<number>;
declare const mb: Maybe<number>;
const m13b = Maybe.alt(ma, mb);
type _13 = Expect<Equals<typeof m13b, Maybe<number>>>;

// All assertions type-check when tsc exits 0.
export {};
