/**
 * Validation — disjoint sum like Either, but errors accumulate via a
 * Semigroup on the Invalid channel, not short-circuit.
 *
 * Slot assignment:
 *   Out2   — E (Invalid errors)
 *   Target — A (Valid value)
 *
 * Key difference from Either: Validation is Apply/Applicative but NOT
 * Chain/Monad — chain couldn't preserve the accumulation semantics.
 *
 * Owns: the `Validation<E, A>` interface, `Valid<A>` / `Invalid<E>`
 * subtypes, `ValidationTypeLambda`, the runtime `const Validation`
 * namespace, and the key `'validation'` on Functor / Apply / Applicative
 * / Foldable registries.
 *
 * Deferred: bimap (needs Bifunctor class), Semigroupoid / Category
 */

import type { TypeLambda } from "../HKT";
import type { Either } from "./Either";

// ── Type ─────────────────────────────────────────────────────────────
export interface Validation<E, A> {
    readonly _typeName: "Validation";
    isValid(): this is Valid<A>;
    isInvalid(): this is Invalid<E>;
    map<B>(f: (a: A) => B): Validation<E, B>;
    toEither(): Either<E, A>;
}

export interface Valid<A> extends Validation<never, A> {
    readonly value: A;
}

export interface Invalid<E> extends Validation<E, never> {
    readonly errors: E;
    // Runtime-held Monoid instance used for accumulation. Typed as
    // `unknown` until the Monoid type class is declared.
    readonly monoid: unknown;
}

// ── TypeLambda ───────────────────────────────────────────────────────
export interface ValidationTypeLambda extends TypeLambda {
    readonly type: Validation<this["Out2"], this["Target"]>;
}

// ── Value namespace ──────────────────────────────────────────────────
export declare const Validation: {
    // Constructors. `monoid` defaults to the array Monoid at runtime.
    readonly Valid: <A>(a: A) => Valid<A>;
    readonly Invalid: <E>(errors: E, monoid?: unknown) => Invalid<E>;
    readonly of: <A>(a: A) => Validation<never, A>;

    // Predicates / type guards
    readonly isValidation: (x: unknown) => x is Validation<unknown, unknown>;
    readonly isValid: <E, A>(v: Validation<E, A>) => v is Valid<A>;
    readonly isInvalid: <E, A>(v: Validation<E, A>) => v is Invalid<E>;

    // Conversions
    readonly fromEither: <E, A>(
        e: Either<E, A>,
        monoid?: unknown
    ) => Validation<E, A>;
    readonly fold: <E, A, B>(
        onInvalid: (errors: E) => B,
        onValid: (a: A) => B,
        v: Validation<E, A>
    ) => B;

    // Static Land methods. `ap` accumulates Invalid errors via the
    // runtime-held Monoid.
    readonly map: <E, A, B>(
        f: (a: A) => B,
        v: Validation<E, A>
    ) => Validation<E, B>;
    readonly ap: <E, A, B>(
        vf: Validation<E, (a: A) => B>,
        va: Validation<E, A>
    ) => Validation<E, B>;
    readonly bimap: <E1, E2, A, B>(
        f: (errors: E1) => E2,
        g: (a: A) => B,
        v: Validation<E1, A>
    ) => Validation<E2, B>;
    readonly reduce: <E, A, B>(
        f: (acc: B, a: A) => B,
        init: B,
        v: Validation<E, A>
    ) => B;

    // `collect` — runs N Either-valued validators in parallel against N args,
    // accumulates Left values into an array, then applies `f` to the values
    // if all validators succeeded. Overloads up to 4 validators.
    readonly collect: {
        <A1, B1, E>(
            v1: (a: A1) => Either<E, B1>
        ): <R>(
            f: (b1: B1) => R
        ) => (a1: A1) => Validation<E[], R>;
        <A1, A2, B1, B2, E>(
            v1: (a: A1) => Either<E, B1>,
            v2: (a: A2) => Either<E, B2>
        ): <R>(
            f: (b1: B1, b2: B2) => R
        ) => (a1: A1, a2: A2) => Validation<E[], R>;
        <A1, A2, A3, B1, B2, B3, E>(
            v1: (a: A1) => Either<E, B1>,
            v2: (a: A2) => Either<E, B2>,
            v3: (a: A3) => Either<E, B3>
        ): <R>(
            f: (b1: B1, b2: B2, b3: B3) => R
        ) => (a1: A1, a2: A2, a3: A3) => Validation<E[], R>;
        <A1, A2, A3, A4, B1, B2, B3, B4, E>(
            v1: (a: A1) => Either<E, B1>,
            v2: (a: A2) => Either<E, B2>,
            v3: (a: A3) => Either<E, B3>,
            v4: (a: A4) => Either<E, B4>
        ): <R>(
            f: (b1: B1, b2: B2, b3: B3, b4: B4) => R
        ) => (a1: A1, a2: A2, a3: A3, a4: A4) => Validation<E[], R>;
    };
};

// ── Register 'validation' on type-class registries ───────────────────
// Runtime: Functor, Apply, Applicative, Foldable, Bifunctor.
declare module "../TypeClasses" {
    interface FunctorInstances     { readonly validation: ValidationTypeLambda }
    interface ApplyInstances       { readonly validation: ValidationTypeLambda }
    interface ApplicativeInstances { readonly validation: ValidationTypeLambda }
    interface FoldableInstances    { readonly validation: ValidationTypeLambda }
    interface BifunctorInstances   { readonly validation: ValidationTypeLambda }
}
