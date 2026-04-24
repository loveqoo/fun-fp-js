/**
 * ReaderT(M) — Reader monad transformer over a base monad M.
 *
 * Public runtime surface: of / ask / asks / local / lift / runReaderT
 * + instance run/map/chain.
 */

import type { TypeLambda, Kind } from "../../HKT";
import type { MonadInstances } from "../../TypeClasses";

// ── Instance type ────────────────────────────────────────────────────
export interface ReaderT<M extends TypeLambda, R, A> {
    readonly _typeName: string;
    run(env: R): Kind<M, never, never, never, A>;
    map<B>(f: (a: A) => B): ReaderT<M, R, B>;
    chain<B>(f: (a: A) => ReaderT<M, R, B>): ReaderT<M, R, B>;
}

// ── TypeLambda ───────────────────────────────────────────────────────
export interface ReaderTTypeLambda<M extends TypeLambda> extends TypeLambda {
    readonly type: ReaderT<M, this["In"], this["Target"]>;
}

// ── Constructor namespace ────────────────────────────────────────────
export interface ReaderTMonad<M extends TypeLambda> {
    readonly of: <A, R = unknown>(a: A) => ReaderT<M, R, A>;

    readonly ask: ReaderT<M, unknown, unknown>;
    readonly asks: <R, A>(f: (env: R) => A) => ReaderT<M, R, A>;
    readonly local: <R1, R2, A>(
        f: (r: R1) => R2,
        rt: ReaderT<M, R2, A>
    ) => ReaderT<M, R1, A>;

    readonly lift: <A, R = unknown>(
        ma: Kind<M, never, never, never, A>
    ) => ReaderT<M, R, A>;

    readonly runReaderT: <R, A>(
        env: R,
        rt: ReaderT<M, R, A>
    ) => Kind<M, never, never, never, A>;

    readonly map: <R, A, B>(
        f: (a: A) => B,
        rt: ReaderT<M, R, A>
    ) => ReaderT<M, R, B>;
    readonly ap: <R, A, B>(
        rf: ReaderT<M, R, (a: A) => B>,
        ra: ReaderT<M, R, A>
    ) => ReaderT<M, R, B>;
    readonly chain: <R, A, B>(
        f: (a: A) => ReaderT<M, R, B>,
        rt: ReaderT<M, R, A>
    ) => ReaderT<M, R, B>;
}

// ── Factory ──────────────────────────────────────────────────────────
export declare function ReaderT<K extends keyof MonadInstances>(
    M: K
): ReaderTMonad<MonadInstances[K]>;
