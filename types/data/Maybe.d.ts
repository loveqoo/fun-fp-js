/**
 * Maybe — optional value carrier.
 *
 * Owns: the `Maybe<A>` interface, `Just<A>` / `Nothing` narrow subtypes,
 * `MaybeTypeLambda`, the runtime `const Maybe` namespace, and the runtime
 * key `'maybe'` registered on every type-class `*Instances` registry.
 *
 * Deferred (added in follow-ups):
 *   traverse, chainRec, pipeK, composeK, toEither, Maybe.pipe,
 *   Maybe.Semigroup, Maybe.Monoid
 */

import type { TypeLambda, Kind } from "../HKT";
import type {
    Applicative,
    ChainRecStep,
    Semigroup,
    Monoid,
    SemigroupInstances,
} from "../TypeClasses";
import type { Either } from "./Either";

// ── Type ─────────────────────────────────────────────────────────────
export interface Maybe<A> {
    readonly _typeName: "Maybe";
    isJust(): this is Just<A>;
    isNothing(): this is Nothing;
    map<B>(f: (a: A) => B): Maybe<B>;
    chain<B>(f: (a: A) => Maybe<B>): Maybe<B>;
}

export interface Just<A> extends Maybe<A> {
    readonly value: A;
}

export interface Nothing extends Maybe<never> {}

// ── TypeLambda ───────────────────────────────────────────────────────
export interface MaybeTypeLambda extends TypeLambda {
    readonly type: Maybe<this["Target"]>;
}

// ── Value namespace (merges with the interface via declaration merging)
export declare const Maybe: {
    // Constructors
    readonly Just: <A>(a: A) => Just<A>;
    readonly Nothing: () => Nothing;
    readonly of: <A>(a: A) => Maybe<A>;

    // Predicates / type guards
    readonly isMaybe: (x: unknown) => x is Maybe<unknown>;
    readonly isJust: <A>(x: Maybe<A>) => x is Just<A>;
    readonly isNothing: <A>(x: Maybe<A>) => x is Nothing;

    // Transformations
    readonly fromNullable: <A>(x: A | null | undefined) => Maybe<NonNullable<A>>;
    readonly fold: <A, B>(
        onNothing: () => B,
        onJust: (a: A) => B,
        m: Maybe<A>
    ) => B;
    // Runtime: runCatch(() => Just(f()), Nothing) — thunk throws → Nothing.
    readonly catch: <A>(thunk: () => A) => Maybe<A>;

    // Static Land methods (wired at runtime from Functor.of('maybe').map etc.)
    readonly map: <A, B>(f: (a: A) => B, m: Maybe<A>) => Maybe<B>;
    readonly ap: <A, B>(
        mf: Maybe<(a: A) => B>,
        ma: Maybe<A>
    ) => Maybe<B>;
    readonly chain: <A, B>(
        f: (a: A) => Maybe<B>,
        m: Maybe<A>
    ) => Maybe<B>;
    readonly alt: <A>(ma: Maybe<A>, mb: Maybe<A>) => Maybe<A>;
    readonly zero: <A = never>() => Maybe<A>;
    readonly filter: {
        <A, B extends A>(pred: (a: A) => a is B, m: Maybe<A>): Maybe<B>;
        <A>(pred: (a: A) => boolean, m: Maybe<A>): Maybe<A>;
    };
    readonly reduce: <A, B>(
        f: (acc: B, a: A) => B,
        init: B,
        m: Maybe<A>
    ) => B;

    // Lifts an N-ary plain function into Maybe — liftA_n form.
    // `Maybe.lift(f)` returns a function that expects N Maybe-wrapped args
    // and returns a Maybe of the combined result (via `.ap` under the hood).
    // Runtime wraps the inner call in runCatch: if applying `f` throws or an
    // arg isn't a Maybe instance, the result falls back to `Maybe.Nothing()`.
    readonly lift: <Args extends readonly unknown[], R>(
        f: (...args: Args) => R
    ) => (
        ...wrapped: { [K in keyof Args]: Maybe<Args[K]> }
    ) => Maybe<R>;

    // ChainRec — stack-safe monadic recursion.
    readonly chainRec: <A, B>(
        f: (
            next: (a: A) => ChainRecStep<A, B>,
            done: (b: B) => ChainRecStep<A, B>,
            input: A
        ) => Maybe<ChainRecStep<A, B>>,
        init: A
    ) => Maybe<B>;

    // Traverse — distribute Maybe through an Applicative G. Slot
    // parameters of G are fixed at `never` (the common case); traversals
    // that need non-trivial G slots (e.g. Either<E, _> as the Applicative
    // with a custom E) should call via `Traversable.of('maybe').traverse`.
    //
    // Inference caveat: `B` is inferred through a conditional `Kind` type,
    // which TS sometimes fails to resolve when `G` is also being inferred.
    // Pass explicit type parameters when that happens:
    //   Maybe.traverse<TaskTypeLambda, A, B>(applicative, f, m)
    readonly traverse: <G extends TypeLambda, A, B>(
        applicative: Applicative<G>,
        f: (a: A) => Kind<G, never, never, never, B>,
        m: Maybe<A>
    ) => Kind<G, never, never, never, Maybe<B>>;

    // Kleisli composition (left-to-right). Overloads up to 4 args.
    readonly pipeK: {
        <A, B>(f1: (a: A) => Maybe<B>): (a: A) => Maybe<B>;
        <A, B, C>(
            f1: (a: A) => Maybe<B>,
            f2: (b: B) => Maybe<C>
        ): (a: A) => Maybe<C>;
        <A, B, C, D>(
            f1: (a: A) => Maybe<B>,
            f2: (b: B) => Maybe<C>,
            f3: (c: C) => Maybe<D>
        ): (a: A) => Maybe<D>;
        <A, B, C, D, E>(
            f1: (a: A) => Maybe<B>,
            f2: (b: B) => Maybe<C>,
            f3: (c: C) => Maybe<D>,
            f4: (d: D) => Maybe<E>
        ): (a: A) => Maybe<E>;
    };
    readonly composeK: {
        <A, B>(f1: (a: A) => Maybe<B>): (a: A) => Maybe<B>;
        <A, B, C>(
            f2: (b: B) => Maybe<C>,
            f1: (a: A) => Maybe<B>
        ): (a: A) => Maybe<C>;
        <A, B, C, D>(
            f3: (c: C) => Maybe<D>,
            f2: (b: B) => Maybe<C>,
            f1: (a: A) => Maybe<B>
        ): (a: A) => Maybe<D>;
        <A, B, C, D, E>(
            f4: (d: D) => Maybe<E>,
            f3: (c: C) => Maybe<D>,
            f2: (b: B) => Maybe<C>,
            f1: (a: A) => Maybe<B>
        ): (a: A) => Maybe<E>;
    };

    // Conversion helpers.
    readonly toEither: <E, A>(defaultLeft: E, m: Maybe<A>) => Either<E, A>;

    // Pipe — chains Maybe-returning functions but the functions receive
    // the Maybe itself (not the inner value). Breaks on Nothing.
    readonly pipe: {
        <A, B>(m: Maybe<A>, f1: (m: Maybe<A>) => Maybe<B>): Maybe<B>;
        <A, B, C>(
            m: Maybe<A>,
            f1: (m: Maybe<A>) => Maybe<B>,
            f2: (m: Maybe<B>) => Maybe<C>
        ): Maybe<C>;
        <A, B, C, D>(
            m: Maybe<A>,
            f1: (m: Maybe<A>) => Maybe<B>,
            f2: (m: Maybe<B>) => Maybe<C>,
            f3: (m: Maybe<C>) => Maybe<D>
        ): Maybe<D>;
    };

    // Semigroup / Monoid factories. Inner type A needs a Semigroup for
    // value-level concat on Just/Just; Nothing is the identity, so the
    // Monoid factory takes a Semigroup (not a Monoid) of A as input.
    readonly Semigroup: {
        <K extends keyof SemigroupInstances>(
            innerSG: K
        ): Semigroup<Maybe<SemigroupInstances[K]>>;
        <A>(innerSG: Semigroup<A>): Semigroup<Maybe<A>>;
    };
    readonly Monoid: {
        <K extends keyof SemigroupInstances>(
            innerSG: K
        ): Monoid<Maybe<SemigroupInstances[K]>>;
        <A>(innerSG: Semigroup<A>): Monoid<Maybe<A>>;
    };
};

// ── Register 'maybe' on every type-class runtime registry ────────────
declare module "../TypeClasses" {
    interface FunctorInstances     { readonly maybe: MaybeTypeLambda }
    interface ApplyInstances       { readonly maybe: MaybeTypeLambda }
    interface ApplicativeInstances { readonly maybe: MaybeTypeLambda }
    interface ChainInstances       { readonly maybe: MaybeTypeLambda }
    interface ChainRecInstances    { readonly maybe: MaybeTypeLambda }
    interface MonadInstances       { readonly maybe: MaybeTypeLambda }
    interface AltInstances         { readonly maybe: MaybeTypeLambda }
    interface PlusInstances        { readonly maybe: MaybeTypeLambda }
    interface AlternativeInstances { readonly maybe: MaybeTypeLambda }
    interface FoldableInstances    { readonly maybe: MaybeTypeLambda }
    interface TraversableInstances { readonly maybe: MaybeTypeLambda }
    interface FilterableInstances  { readonly maybe: MaybeTypeLambda }
}
