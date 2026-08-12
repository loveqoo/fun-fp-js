/**
 * Core FP utilities exported at the top level of fun-fp-js.
 *
 * Organized by category:
 *   1. Identity / constants
 *   2. Binary combinators (compose2, pipe2, curry2, etc.)
 *   3. Variadic compose / pipe (overloads 1..5)
 *   4. Variadic curry (overloads 1..5)
 *   5. Predicates
 *   6. Effects (tap, also, into, partial, once, converge, useOrLift)
 *   7. Error (runCatch)
 *   8. Array helpers (range, rangeBy)
 *   9. Global type-class combinators (sequence, foldMap, lift, pipeK,
 *      composeK) — dispatch-based, work with any Functor/Monad/Applicative
 */

import type { Kind, TypeLambda } from "./HKT";
import type {
    Applicative,
    Foldable,
    Monad,
    Monoid,
    Traversable,
} from "./TypeClasses";

// ─── 1. Identity / constants ──────────────────────────────────────────
export declare function identity<A>(x: A): A;
export declare function constant<A>(x: A): () => A;
export declare function tuple<T extends readonly unknown[]>(...args: T): T;

// ─── 2. Binary combinators ────────────────────────────────────────────
export declare function compose2<A, B, C>(
    f: (b: B) => C,
    g: (a: A) => B
): (a: A) => C;
export declare function pipe2<A, B, C>(
    f: (a: A) => B,
    g: (b: B) => C
): (a: A) => C;
export declare function curry2<A, B, C>(
    f: (a: A, b: B) => C
): (a: A) => (b: B) => C;
export declare function uncurry2<A, B, C>(
    f: (a: A) => (b: B) => C
): (a: A, b: B) => C;
export declare function flip2<A, B, C>(
    f: (a: A, b: B) => C
): (b: B, a: A) => C;
export declare function flipCurried2<A, B, C>(
    f: (a: A) => (b: B) => C
): (b: B) => (a: A) => C;
export declare function unapply2<A, B, R>(
    f: (a: A, b: B) => R
): (a: A, b: B) => R;

// ─── 3. Variadic compose / pipe (up to 5 args) ────────────────────────
export declare function compose<A, B>(f: (a: A) => B): (a: A) => B;
export declare function compose<A, B, C>(
    f: (b: B) => C,
    g: (a: A) => B
): (a: A) => C;
export declare function compose<A, B, C, D>(
    f: (c: C) => D,
    g: (b: B) => C,
    h: (a: A) => B
): (a: A) => D;
export declare function compose<A, B, C, D, E>(
    f: (d: D) => E,
    g: (c: C) => D,
    h: (b: B) => C,
    i: (a: A) => B
): (a: A) => E;
export declare function compose<A, B, C, D, E, F>(
    f: (e: E) => F,
    g: (d: D) => E,
    h: (c: C) => D,
    i: (b: B) => C,
    j: (a: A) => B
): (a: A) => F;

export declare function pipe<A, B>(f: (a: A) => B): (a: A) => B;
export declare function pipe<A, B, C>(
    f: (a: A) => B,
    g: (b: B) => C
): (a: A) => C;
export declare function pipe<A, B, C, D>(
    f: (a: A) => B,
    g: (b: B) => C,
    h: (c: C) => D
): (a: A) => D;
export declare function pipe<A, B, C, D, E>(
    f: (a: A) => B,
    g: (b: B) => C,
    h: (c: C) => D,
    i: (d: D) => E
): (a: A) => E;
export declare function pipe<A, B, C, D, E, F>(
    f: (a: A) => B,
    g: (b: B) => C,
    h: (c: C) => D,
    i: (d: D) => E,
    j: (e: E) => F
): (a: A) => F;

// ─── 4. Variadic curry / uncurry (0..5 args) ──────────────────────────
export declare function curry<R>(f: () => R): () => R;
export declare function curry<A, B>(
    f: (a: A) => B
): (a: A) => B;
export declare function curry<A, B, C>(
    f: (a: A, b: B) => C
): (a: A) => (b: B) => C;
export declare function curry<A, B, C, D>(
    f: (a: A, b: B, c: C) => D
): (a: A) => (b: B) => (c: C) => D;
export declare function curry<A, B, C, D, E>(
    f: (a: A, b: B, c: C, d: D) => E
): (a: A) => (b: B) => (c: C) => (d: D) => E;
export declare function curry<A, B, C, D, E, F>(
    f: (a: A, b: B, c: C, d: D, e: E) => F
): (a: A) => (b: B) => (c: C) => (d: D) => (e: E) => F;

// Arity-aware currying with an explicit arity argument — loose-typed
// fallback; prefer the overloads above for known arities.
export declare function curry<F extends (...args: readonly any[]) => any>(
    f: F,
    arity: number
): (...args: readonly any[]) => any;

// ─── 5. Predicates ────────────────────────────────────────────────────
export declare function predicate<A>(
    f: (a: A) => unknown
): (a: A) => boolean;
export declare function negate<A>(
    f: (a: A) => unknown
): (a: A) => boolean;
export declare function predicateN(
    f: (...args: readonly any[]) => unknown
): (...args: readonly any[]) => boolean;
export declare function negateN(
    f: (...args: readonly any[]) => unknown
): (...args: readonly any[]) => boolean;

// ─── 6. Effects / combinators ─────────────────────────────────────────
// tap: run side-effects on value, return value unchanged.
export declare function tap<A>(
    ...fs: ReadonlyArray<(a: A) => void>
): (a: A) => A;
// also: `tap` with value first.
export declare function also<A>(
    a: A
): (...fs: ReadonlyArray<(a: A) => void>) => A;
// into: `pipe` with value first — loose-typed because fs chain is
// unknown at call site.
export declare function into<A, R = unknown>(
    a: A
): (...fs: ReadonlyArray<(x: any) => any>) => R;

export declare function partial<
    Pre extends readonly unknown[],
    Rest extends readonly unknown[],
    R
>(
    f: (...args: readonly [...Pre, ...Rest]) => R,
    ...preArgs: Pre
): (...rest: Rest) => R;

export declare function once<F extends (...args: readonly any[]) => any>(
    f: F
): F;

// converge: fan-out branches, join with `f`. Overloads up to 4.
export declare function converge<Args extends readonly unknown[], B1, R>(
    f: (b1: B1) => R,
    b1: (...args: Args) => B1
): (...args: Args) => R;
export declare function converge<
    Args extends readonly unknown[], B1, B2, R
>(
    f: (b1: B1, b2: B2) => R,
    b1: (...args: Args) => B1,
    b2: (...args: Args) => B2
): (...args: Args) => R;
export declare function converge<
    Args extends readonly unknown[], B1, B2, B3, R
>(
    f: (b1: B1, b2: B2, b3: B3) => R,
    b1: (...args: Args) => B1,
    b2: (...args: Args) => B2,
    b3: (...args: Args) => B3
): (...args: Args) => R;
export declare function converge<
    Args extends readonly unknown[], B1, B2, B3, B4, R
>(
    f: (b1: B1, b2: B2, b3: B3, b4: B4) => R,
    b1: (...args: Args) => B1,
    b2: (...args: Args) => B2,
    b3: (...args: Args) => B3,
    b4: (...args: Args) => B4
): (...args: Args) => R;

// useOrLift: if `check(x)` is truthy keep `x`; else return `lift(x)`.
export declare function useOrLift<A>(
    check: (a: A) => unknown
): <B>(lift: (a: A) => B) => (a: A) => A | B;

// ─── 7. apply / unapply ───────────────────────────────────────────────
export declare function apply<Args extends readonly unknown[], R>(
    f: (...args: Args) => R
): (args: Args) => R;
export declare function unapply<Args extends readonly unknown[], R>(
    f: (args: Args) => R
): (...args: Args) => R;

// Variadic flip / flipCurried — loose types. Use flip2 / flipCurried2
// when you know the arity.
export declare function flip<F extends (...args: readonly any[]) => any>(
    f: F
): (...args: readonly any[]) => ReturnType<F>;
export declare function flipCurried<
    F extends (...args: readonly any[]) => any
>(
    f: F
): (...args: readonly any[]) => (...args: readonly any[]) => any;
// Uncurry fully-curried function — loose, use uncurry2 for binary.
export declare function uncurry<F extends (...args: readonly any[]) => any>(
    f: F
): (...args: readonly any[]) => any;

// ─── 8. Error: runCatch ───────────────────────────────────────────────
export declare function runCatch<Args extends readonly unknown[], R, E = void>(
    f: (...args: Args) => R,
    onError?: (e: unknown) => E
): (...args: Args) => R | E;

// ─── 9. Array helpers ─────────────────────────────────────────────────
export declare function range(n: number): number[];
export declare function rangeBy(start: number, end: number): number[];

// ─── 10. Global type-class combinators ────────────────────────────────
// sequence: distribute G through a Traversable T. Slots pinned to
// `never` — advanced usage with non-trivial slots should go through
// `Traversable.lookup(...).traverse` directly.
export declare function sequence<
    T extends TypeLambda,
    G extends TypeLambda,
    A
>(
    traversable: Traversable<T>,
    applicative: Applicative<G>,
    u: Kind<T, never, never, never, Kind<G, never, never, never, A>>
): Kind<G, never, never, never, Kind<T, never, never, never, A>>;

// foldMap: `(a → M) → F<a> → M` where M is a Monoid.
export declare function foldMap<F extends TypeLambda, M>(
    foldable: Foldable<F>,
    monoid: Monoid<M>
): <A>(
    f: (a: A) => M
) => <In, Out2, Out1>(fa: Kind<F, In, Out2, Out1, A>) => M;

// lift: liftA_n for any Applicative.
export declare function lift<F extends TypeLambda>(
    applicative: Applicative<F>
): <Args extends readonly unknown[], R>(
    f: (...args: Args) => R
) => (
    ...wrapped: {
        [K in keyof Args]: Kind<F, never, never, never, Args[K]>
    }
) => Kind<F, never, never, never, R>;

// pipeK / composeK: Kleisli composition generic over Monad. Loose-typed
// to permit any Foldable<fns> container. Per-monad `fp.Maybe.pipeK`
// etc. are the precisely-typed alternatives.
export declare function pipeK<F extends TypeLambda>(
    monad: Monad<F>,
    foldable?: Foldable<any>
): (
    fns: ReadonlyArray<(x: any) => Kind<F, any, any, any, any>>
) => <A>(x: A) => Kind<F, any, any, any, any>;

export declare function composeK<F extends TypeLambda>(
    monad: Monad<F>,
    foldable?: Foldable<any>
): (
    fns: ReadonlyArray<(x: any) => Kind<F, any, any, any, any>>
) => <A>(x: A) => Kind<F, any, any, any, any>;
