/**
 * NonEmptyList — a list that cannot be empty. Non-emptiness is carried
 * by the structure (a dedicated `head` slot), not by a runtime check.
 *
 * Owns: the `NonEmptyList<A>` interface, `NonEmptyListTypeLambda`, the
 * runtime `const NonEmptyList` namespace, and the key `'nonemptylist'`
 * on Functor / Apply / Applicative / Chain / Monad / Semigroup / Alt /
 * Foldable / Traversable / Extend / Comonad registries.
 *
 * Deliberately absent: Monoid / Plus / Alternative (their identity is
 * the empty list) and Filterable (filtering can empty the container).
 * `reduceLeft` / `reduceMap` fold with a Semigroup only — no Monoid,
 * because a guaranteed head removes the need for an empty() fallback.
 */

import type { TypeLambda } from "../HKT";
import type { Maybe } from "./Maybe";
import type { Semigroup } from "../TypeClasses";

// ── Type ─────────────────────────────────────────────────────────────
export interface NonEmptyList<A> {
    readonly _typeName: "NonEmptyList";
    readonly head: A;
    readonly tail: ReadonlyArray<A>;
    toArray(): A[];
    last(): A;
}

// ── TypeLambda ───────────────────────────────────────────────────────
export interface NonEmptyListTypeLambda extends TypeLambda {
    readonly type: NonEmptyList<this["Target"]>;
}

// ── Value namespace ──────────────────────────────────────────────────
export declare const NonEmptyList: {
    readonly of: <A>(a: A) => NonEmptyList<A>;
    readonly make: <A>(head: A, ...rest: A[]) => NonEmptyList<A>;
    readonly fromArray: <A>(xs: ReadonlyArray<A>) => Maybe<NonEmptyList<A>>;
    readonly isNonEmptyList: (x: unknown) => x is NonEmptyList<unknown>;
    readonly reduceLeft: <A>(f: (acc: A, a: A) => A, nel: NonEmptyList<A>) => A;
    readonly reduceMap: <A, B>(
        semigroup: Semigroup<B>,
        f: (a: A) => B,
        nel: NonEmptyList<A>
    ) => B;
};

// ── Register 'nonemptylist' on type-class registries ─────────────────
// Runtime: Functor, Apply, Applicative, Chain, Monad, Semigroup, Alt,
// Foldable, Traversable, Extend, Comonad.
declare module "../TypeClasses" {
    interface FunctorInstances     { readonly nonemptylist: NonEmptyListTypeLambda }
    interface ApplyInstances       { readonly nonemptylist: NonEmptyListTypeLambda }
    interface ApplicativeInstances { readonly nonemptylist: NonEmptyListTypeLambda }
    interface ChainInstances       { readonly nonemptylist: NonEmptyListTypeLambda }
    interface MonadInstances       { readonly nonemptylist: NonEmptyListTypeLambda }
    interface AltInstances         { readonly nonemptylist: NonEmptyListTypeLambda }
    interface FoldableInstances    { readonly nonemptylist: NonEmptyListTypeLambda }
    interface TraversableInstances { readonly nonemptylist: NonEmptyListTypeLambda }
    interface ExtendInstances      { readonly nonemptylist: NonEmptyListTypeLambda }
    interface ComonadInstances     { readonly nonemptylist: NonEmptyListTypeLambda }
    interface SemigroupInstances   { readonly nonemptylist: NonEmptyList<unknown> }
}
