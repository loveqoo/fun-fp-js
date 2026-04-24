/**
 * WriterT(M, monoid) — Writer monad transformer over a base monad M.
 *
 * Takes TWO runtime args: the base monad M and a Monoid instance that
 * determines the log type W. TS-side W is a type parameter with
 * `unknown[]` default (matching the runtime default `Monoid.of('array')`).
 * The monoid is typed `unknown` until the Monoid type class is declared.
 *
 * Public runtime surface: of / tell / lift / runWriterT
 * + instance run/map/chain.
 */

import type { TypeLambda, Kind } from "../../HKT";
import type { MonadInstances } from "../../TypeClasses";

// ── Instance type ────────────────────────────────────────────────────
export interface WriterT<M extends TypeLambda, W, A> {
    readonly _typeName: string;
    run(): Kind<M, never, never, never, [A, W]>;
    map<B>(f: (a: A) => B): WriterT<M, W, B>;
    chain<B>(f: (a: A) => WriterT<M, W, B>): WriterT<M, W, B>;
}

// ── TypeLambda ───────────────────────────────────────────────────────
export interface WriterTTypeLambda<M extends TypeLambda> extends TypeLambda {
    readonly type: WriterT<M, this["Out1"], this["Target"]>;
}

// ── Constructor namespace ────────────────────────────────────────────
export interface WriterTMonad<M extends TypeLambda, W> {
    readonly of: <A>(a: A) => WriterT<M, W, A>;
    readonly tell: (output: W) => WriterT<M, W, undefined>;
    readonly lift: <A>(
        ma: Kind<M, never, never, never, A>
    ) => WriterT<M, W, A>;

    readonly runWriterT: <A>(
        wt: WriterT<M, W, A>
    ) => Kind<M, never, never, never, [A, W]>;

    readonly map: <A, B>(
        f: (a: A) => B,
        wt: WriterT<M, W, A>
    ) => WriterT<M, W, B>;
    readonly ap: <A, B>(
        wf: WriterT<M, W, (a: A) => B>,
        wa: WriterT<M, W, A>
    ) => WriterT<M, W, B>;
    readonly chain: <A, B>(
        f: (a: A) => WriterT<M, W, B>,
        wt: WriterT<M, W, A>
    ) => WriterT<M, W, B>;
}

// ── Factory ──────────────────────────────────────────────────────────
export declare function WriterT<
    K extends keyof MonadInstances,
    W = unknown[]
>(M: K, writerMonoid?: unknown): WriterTMonad<MonadInstances[K], W>;
