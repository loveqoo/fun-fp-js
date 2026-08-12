/**
 * Type-level behavior tests for Either.
 */

import type { Kind } from "../HKT";
import { Either } from "../data/Either";
import type { Left, Right, EitherTypeLambda } from "../data/Either";
import { Maybe } from "../data/Maybe";
import { Functor, Monad, Applicative } from "../TypeClasses";
import type { Equals, Expect, AssignableTo } from "./_test-utils";


// ── 1. Constructors return the right subtypes ─────────────────────────
const l1 = Either.Left("oops");        // Left<string>
const r1 = Either.Right(42);           // Right<number>
const e1 = Either.of(42);              // Either<never, number>

type _1a = Expect<Equals<typeof l1, Left<string>>>;
type _1b = Expect<Equals<typeof r1, Right<number>>>;
type _1c = Expect<Equals<typeof e1, Either<never, number>>>;
// Subtype assignability (Left/Right carry extra `value` field):
type _1d = AssignableTo<Left<string>, Either<string, never>>;
type _1e = AssignableTo<Right<number>, Either<never, number>>;

// ── 2. map threads Out2 (E); only Target (A) changes ──────────────────
declare const e2: Either<string, number>;
const e2b = Either.map((n: number) => n.toString(), e2);
type _2 = Expect<Equals<typeof e2b, Either<string, string>>>;

// ── 3. Type guards narrow via `this is Left<E>` / `Right<A>` ──────────
declare const e3: Either<string, number>;
if (e3.isLeft()) {
    type _3a = Expect<Equals<typeof e3, Left<string>>>;
    const err: string = e3.value;
}
if (e3.isRight()) {
    type _3b = Expect<Equals<typeof e3, Right<number>>>;
    const val: number = e3.value;
}

// ── 4. Functor.lookup('either') resolves via registry ─────────────────────
const fEither = Functor.lookup("either");
type _4 = Expect<Equals<typeof fEither, Functor<EitherTypeLambda>>>;
const e4 = fEither.map((s: string) => s.length, Either.Right("hi"));
type _4b = Expect<Equals<typeof e4, Either<never, number>>>;

// ── 5. Monad.lookup('either').chain preserves E ───────────────────────────
const mEither = Monad.lookup("either");
declare const e5: Either<string, number>;
const e5b = mEither.chain(
    (n: number) => Either.Right(n + 1) as Either<string, number>,
    e5
);
type _5 = Expect<Equals<typeof e5b, Either<string, number>>>;

// ── 6. Applicative.lookup('either').of ────────────────────────────────────
const aEither = Applicative.lookup("either");
const e6 = aEither.of(42);
type _6 = Expect<Equals<typeof e6, Either<never, number>>>;

// ── 7. fromNullable → Either<null, NonNullable<A>> ────────────────────
declare const nullable: string | null | undefined;
const e7 = Either.fromNullable(nullable);
type _7 = Expect<Equals<typeof e7, Either<null, string>>>;

// ── 8. fold folds both sides into common type ─────────────────────────
declare const e8: Either<string, number>;
const r8: string = Either.fold(
    (s: string) => `err: ${s}`,
    (n: number) => `val: ${n}`,
    e8
);

// ── 9. catch types error as `unknown` ─────────────────────────────────
const e9 = Either.catch(() => {
    if (Math.random() > 0.5) throw new Error("boom");
    return 42;
});
type _9 = Expect<Equals<typeof e9, Either<unknown, number>>>;

// ── 10. toMaybe drops the E channel ───────────────────────────────────
declare const e10: Either<string, number>;
const m10 = Either.toMaybe(e10);
type _10 = Expect<Equals<typeof m10, Maybe<number>>>;

// ── 11. filter with onFalse (explicit E type) ─────────────────────────
declare const e11: Either<string, number>;
const e11b = Either.filter(
    (n: number) => n > 0,
    e11,
    (n: number) => `negative: ${n}`
);
type _11 = Expect<Equals<typeof e11b, Either<string, number>>>;

// ── 12. filter without onFalse (A widens into E) ──────────────────────
declare const e12: Either<string, number>;
const e12b = Either.filter((n: number) => n > 0, e12);
type _12 = Expect<Equals<typeof e12b, Either<string | number, number>>>;

// ── 13. filter with type-guard predicate narrows Target ───────────────
declare const e13: Either<string, string | number>;
const e13b = Either.filter(
    (x: string | number): x is string => typeof x === "string",
    e13,
    () => "not-string"
);
type _13 = Expect<Equals<typeof e13b, Either<string, string>>>;

// ── 14. lift in liftA_n form — wrapped args, E is inferred/defaulted ──
const parseIntEither = Either.lift((s: string) => {
    const n = Number(s);
    if (Number.isNaN(n)) throw new Error("nan");
    return n;
});
// E is inferred from the wrapped arg. `Either.of("42")` has type
// Either<never, string>, so here E = never.
const e14 = parseIntEither(Either.of("42"));
type _14 = Expect<Equals<typeof e14, Either<never, number>>>;

// Explicit E — caller fixes the error type via type argument.
declare const withErr: Either<string, string>;
const e14b = parseIntEither(withErr);
type _14b = Expect<Equals<typeof e14b, Either<string, number>>>;

// ── 15. Kind reduction check ──────────────────────────────────────────
type KEither = Kind<EitherTypeLambda, never, string, never, number>;
declare const k15: KEither;
const e15: Either<string, number> = k15;
type _15 = Expect<Equals<KEither, Either<string, number>>>;

// ── 16. Left / Right assignable into Either<E, A> via bivariance ──────
declare const l16: Left<string>;
declare const r16: Right<number>;
const e16a: Either<string, number> = l16;
const e16b: Either<string, number> = r16;

export {};
