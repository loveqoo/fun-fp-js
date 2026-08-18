/**
 * Either — disjoint sum carrying success (Right) or failure (Left).
 *
 * Slot assignment:
 *   Out2   — E (Left / error channel)
 *   Target — A (Right / success)
 *
 * Owns: the `Either<E, A>` interface, `Left<E>` / `Right<A>` narrow
 * subtypes, `EitherTypeLambda`, the runtime `const Either` namespace, and
 * the runtime key `'either'` registered on the type classes Either
 * implements at runtime (Functor / Apply / Applicative / Alt / Chain /
 * Monad / Foldable / Traversable — not Plus, not Alternative).
 *
 * Deferred (added in follow-ups):
 *   traverse, chainRec, pipeK, composeK, bimap (needs Bifunctor class),
 *   Either.pipe, Semigroup.Either, Either.Monoid, Semigroupoid / Category
 */

import type { TypeLambda, Kind } from "../HKT";
import type { Maybe } from "./Maybe";
import type {
    Applicative,
    ChainRecStep,
    Semigroup,
    SemigroupInstances,
    Setoid,
    SetoidInstances,
} from "../TypeClasses";

// ── Type ─────────────────────────────────────────────────────────────
export interface Either<E, A> {
    readonly _typeName: "Either";
    isLeft(): this is Left<E>;
    isRight(): this is Right<A>;
    map<B>(f: (a: A) => B): Either<E, B>;
    chain<B>(f: (a: A) => Either<E, B>): Either<E, B>;
}

export interface Left<E> extends Either<E, never> {
    readonly value: E;
}

export interface Right<A> extends Either<never, A> {
    readonly value: A;
}

// ── TypeLambda ───────────────────────────────────────────────────────
export interface EitherTypeLambda extends TypeLambda {
    readonly type: Either<this["Out2"], this["Target"]>;
}

// ── Value namespace ──────────────────────────────────────────────────
export declare const Either: {
    // Constructors
    readonly Left: <E>(e: E) => Left<E>;
    readonly Right: <A>(a: A) => Right<A>;
    readonly of: <A>(a: A) => Either<never, A>;

    // Predicates / type guards
    readonly isEither: (x: unknown) => x is Either<unknown, unknown>;
    readonly isLeft: <E, A>(x: Either<E, A>) => x is Left<E>;
    readonly isRight: <E, A>(x: Either<E, A>) => x is Right<A>;

    // Transformations
    readonly fromNullable: <A>(
        x: A | null | undefined
    ) => Either<null, NonNullable<A>>;
    readonly fold: <E, A, B>(
        onLeft: (e: E) => B,
        onRight: (a: A) => B,
        e: Either<E, A>
    ) => B;
    // Runtime: runCatch(() => Right(f()), Left) — thunk throws → Left(error).
    // Caught error is typed `unknown` (TS 4.4+ convention).
    readonly catch: <A>(thunk: () => A) => Either<unknown, A>;

    // Conversions
    readonly toMaybe: <E, A>(e: Either<E, A>) => Maybe<A>;

    // Static Land methods
    readonly map: <E, A, B>(
        f: (a: A) => B,
        e: Either<E, A>
    ) => Either<E, B>;
    readonly ap: <E, A, B>(
        ef: Either<E, (a: A) => B>,
        ea: Either<E, A>
    ) => Either<E, B>;
    readonly chain: <E, A, B>(
        f: (a: A) => Either<E, B>,
        e: Either<E, A>
    ) => Either<E, B>;
    readonly alt: <E, A>(
        a: Either<E, A>,
        b: Either<E, A>
    ) => Either<E, A>;

    // Filter: runtime default for onFalse is `identity`, which folds A back
    // into the Left channel. Two overload pairs reflect both usages.
    readonly filter: {
        <E, A, B extends A>(
            pred: (a: A) => a is B,
            e: Either<E, A>,
            onFalse: (a: A) => E
        ): Either<E, B>;
        <E, A>(
            pred: (a: A) => boolean,
            e: Either<E, A>,
            onFalse: (a: A) => E
        ): Either<E, A>;
        <E, A, B extends A>(
            pred: (a: A) => a is B,
            e: Either<E, A>
        ): Either<E | A, B>;
        <E, A>(
            pred: (a: A) => boolean,
            e: Either<E, A>
        ): Either<E | A, A>;
    };

    readonly reduce: <E, A, B>(
        f: (acc: B, a: A) => B,
        init: B,
        e: Either<E, A>
    ) => B;

    // Lifts an N-ary plain function into Either — liftA_n form.
    // Takes N Either-wrapped args of the same E and returns Either<E, R>.
    // Runtime runCatch wrapper: on throw, result falls back to
    // `Either.Left(error)` (error typed `unknown`).
    readonly lift: <Args extends readonly unknown[], R>(
        f: (...args: Args) => R
    ) => <E = unknown>(
        ...wrapped: { [K in keyof Args]: Either<E, Args[K]> }
    ) => Either<E, R>;

    // Bifunctor.bimap: transform both channels simultaneously.
    readonly bimap: <E1, E2, A, B>(
        f: (e: E1) => E2,
        g: (a: A) => B,
        e: Either<E1, A>
    ) => Either<E2, B>;

    readonly chainRec: <E, A, B>(
        f: (
            next: (a: A) => ChainRecStep<A, B>,
            done: (b: B) => ChainRecStep<A, B>,
            input: A
        ) => Either<E, ChainRecStep<A, B>>,
        init: A
    ) => Either<E, B>;

    // Traverse — G's slot parameters pinned to `never` for clean
    // inference; see Maybe.traverse note for the full-signature escape.
    readonly traverse: <G extends TypeLambda, E, A, B>(
        applicative: Applicative<G>,
        f: (a: A) => Kind<G, never, never, never, B>,
        e: Either<E, A>
    ) => Kind<G, never, never, never, Either<E, B>>;

    readonly pipeK: {
        <E, A, B>(f1: (a: A) => Either<E, B>): (a: A) => Either<E, B>;
        <E, A, B, C>(
            f1: (a: A) => Either<E, B>,
            f2: (b: B) => Either<E, C>
        ): (a: A) => Either<E, C>;
        <E, A, B, C, D>(
            f1: (a: A) => Either<E, B>,
            f2: (b: B) => Either<E, C>,
            f3: (c: C) => Either<E, D>
        ): (a: A) => Either<E, D>;
        <E, A, B, C, D, F>(
            f1: (a: A) => Either<E, B>,
            f2: (b: B) => Either<E, C>,
            f3: (c: C) => Either<E, D>,
            f4: (d: D) => Either<E, F>
        ): (a: A) => Either<E, F>;
    };
    readonly composeK: {
        <E, A, B>(f1: (a: A) => Either<E, B>): (a: A) => Either<E, B>;
        <E, A, B, C>(
            f2: (b: B) => Either<E, C>,
            f1: (a: A) => Either<E, B>
        ): (a: A) => Either<E, C>;
        <E, A, B, C, D>(
            f3: (c: C) => Either<E, D>,
            f2: (b: B) => Either<E, C>,
            f1: (a: A) => Either<E, B>
        ): (a: A) => Either<E, D>;
    };

    // Pipe — accepts functions taking the whole Either. Breaks on Left.
    readonly pipe: {
        <E, A, B>(
            e: Either<E, A>,
            f1: (e: Either<E, A>) => Either<E, B>
        ): Either<E, B>;
        <E, A, B, C>(
            e: Either<E, A>,
            f1: (e: Either<E, A>) => Either<E, B>,
            f2: (e: Either<E, B>) => Either<E, C>
        ): Either<E, C>;
        <E, A, B, C, D>(
            e: Either<E, A>,
            f1: (e: Either<E, A>) => Either<E, B>,
            f2: (e: Either<E, B>) => Either<E, C>,
            f3: (e: Either<E, C>) => Either<E, D>
        ): Either<E, D>;
    };

};

// ── 제약이 붙은 Either 인스턴스는 타입 클래스 쪽에 산다 ────────────────
// Semigroup concats both channels (Left/Left, Right/Right), so it needs
// two inner Semigroups — the runtime raises on a single argument.
// Either has two slots with different types, so equality takes two
// instances (Haskell: (Eq a, Eq b); fp-ts: getEq(EL, EA)). There is
// deliberately no Ord.Either — Left-before-Right has no canonical
// justification; fp-ts leaves it out of core too.
declare module "../TypeClasses" {
    interface SemigroupStatic {
        readonly Either: {
            <KL extends keyof SemigroupInstances, KR extends keyof SemigroupInstances>(
                left: KL, right: KR
            ): Semigroup<Either<SemigroupInstances[KL], SemigroupInstances[KR]>>;
            <E, A>(left: Semigroup<E> | string, right: Semigroup<A> | string): Semigroup<Either<E, A>>;
        };
    }
    interface SetoidStatic {
        readonly Either: {
            <KL extends keyof SetoidInstances, KR extends keyof SetoidInstances>(
                left: KL, right: KR
            ): Setoid<Either<SetoidInstances[KL], SetoidInstances[KR]>>;
            <E, A>(left: Setoid<E> | string, right: Setoid<A> | string): Setoid<Either<E, A>>;
        };
    }
}

// ── Register 'either' on the type-class runtime registries ───────────
// Either runtime has: Functor, Apply, Applicative, Alt, Chain, ChainRec,
// Monad, Foldable, Traversable, Filterable, Bifunctor.
// NOT Plus/Alternative (no zero).
declare module "../TypeClasses" {
    interface FunctorInstances     { readonly either: EitherTypeLambda }
    interface ApplyInstances       { readonly either: EitherTypeLambda }
    interface ApplicativeInstances { readonly either: EitherTypeLambda }
    interface AltInstances         { readonly either: EitherTypeLambda }
    interface ChainInstances       { readonly either: EitherTypeLambda }
    interface ChainRecInstances    { readonly either: EitherTypeLambda }
    interface MonadInstances       { readonly either: EitherTypeLambda }
    interface MonadErrorInstances  { readonly either: EitherTypeLambda }
    interface FoldableInstances    { readonly either: EitherTypeLambda }
    interface TraversableInstances { readonly either: EitherTypeLambda }
    interface BifunctorInstances   { readonly either: EitherTypeLambda }
}
