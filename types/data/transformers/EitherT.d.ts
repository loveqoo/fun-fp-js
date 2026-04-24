/**
 * EitherT(M) — Either monad transformer over a base monad M.
 *
 * Public runtime surface: of / throwError / catchError / lift /
 * fromEither / runEitherT + instance run/map/chain.
 */

import type { TypeLambda, Kind } from "../../HKT";
import type { MonadInstances } from "../../TypeClasses";
import type { Either } from "../Either";

// ── Instance type ────────────────────────────────────────────────────
export interface EitherT<M extends TypeLambda, E, A> {
    readonly _typeName: string;
    run(): Kind<M, never, never, never, Either<E, A>>;
    map<B>(f: (a: A) => B): EitherT<M, E, B>;
    chain<B>(f: (a: A) => EitherT<M, E, B>): EitherT<M, E, B>;
}

// ── TypeLambda ───────────────────────────────────────────────────────
export interface EitherTTypeLambda<M extends TypeLambda> extends TypeLambda {
    readonly type: EitherT<M, this["Out2"], this["Target"]>;
}

// ── Constructor namespace ────────────────────────────────────────────
export interface EitherTMonad<M extends TypeLambda> {
    readonly of: <A, E = never>(a: A) => EitherT<M, E, A>;
    readonly throwError: <E, A = never>(e: E) => EitherT<M, E, A>;
    readonly catchError: <E1, E2, A>(
        et: EitherT<M, E1, A>,
        handler: (e: E1) => EitherT<M, E2, A>
    ) => EitherT<M, E2, A>;

    readonly lift: <A, E = never>(
        ma: Kind<M, never, never, never, A>
    ) => EitherT<M, E, A>;
    readonly fromEither: <E, A>(e: Either<E, A>) => EitherT<M, E, A>;

    readonly runEitherT: <E, A>(
        et: EitherT<M, E, A>
    ) => Kind<M, never, never, never, Either<E, A>>;

    readonly map: <E, A, B>(
        f: (a: A) => B,
        et: EitherT<M, E, A>
    ) => EitherT<M, E, B>;
    readonly ap: <E, A, B>(
        ef: EitherT<M, E, (a: A) => B>,
        ea: EitherT<M, E, A>
    ) => EitherT<M, E, B>;
    readonly chain: <E, A, B>(
        f: (a: A) => EitherT<M, E, B>,
        et: EitherT<M, E, A>
    ) => EitherT<M, E, B>;
}

// ── Factory ──────────────────────────────────────────────────────────
export declare function EitherT<K extends keyof MonadInstances>(
    M: K
): EitherTMonad<MonadInstances[K]>;
