/**
 * StateT(M) — State monad transformer over a base monad M.
 *
 * Runtime: `StateT(M)` returns a cached class with `.of / .get / .put /
 * .modify / .gets / .lift / .runState` statics plus the Static Land
 * methods. Instance methods: `run / eval / exec / map / chain`.
 *
 * TS surface:
 *  - `StateT<M, S, A>` — the instance type
 *  - `StateTMonad<M>` — the constructor namespace returned by StateT(M)
 *  - `StateTTypeLambda<M>` — HKT encoding
 *  - `StateT("monadKey")` — the runtime factory, typed via MonadInstances
 *    (string-key dispatch only; passing a value namespace works at
 *    runtime but requires an explicit type parameter in TS)
 */

import type { TypeLambda, Kind } from "../../HKT";
import type { MonadInstances } from "../../TypeClasses";

// ── Instance type ────────────────────────────────────────────────────
export interface StateT<M extends TypeLambda, S, A> {
    readonly _typeName: string;
    run(s: S): Kind<M, never, never, never, [A, S]>;
    eval(s: S): Kind<M, never, never, never, A>;
    exec(s: S): Kind<M, never, never, never, S>;
    map<B>(f: (a: A) => B): StateT<M, S, B>;
    chain<B>(f: (a: A) => StateT<M, S, B>): StateT<M, S, B>;
}

// ── TypeLambda ───────────────────────────────────────────────────────
export interface StateTTypeLambda<M extends TypeLambda> extends TypeLambda {
    readonly type: StateT<M, this["In"], this["Target"]>;
}

// ── Constructor namespace (returned by StateT(M)) ────────────────────
export interface StateTMonad<M extends TypeLambda> {
    readonly of: <A, S = unknown>(a: A) => StateT<M, S, A>;

    // Polymorphic `get` — typed loosely for the same reason as Reader.ask.
    readonly get: StateT<M, unknown, unknown>;
    readonly put: <S>(s: S) => StateT<M, S, undefined>;
    readonly modify: <S>(f: (s: S) => S) => StateT<M, S, undefined>;
    readonly gets: <S, A>(f: (s: S) => A) => StateT<M, S, A>;

    readonly lift: <A, S = unknown>(
        ma: Kind<M, never, never, never, A>
    ) => StateT<M, S, A>;

    readonly runState: <S, A>(
        initial: S,
        st: StateT<M, S, A>
    ) => Kind<M, never, never, never, [A, S]>;

    readonly map: <S, A, B>(
        f: (a: A) => B,
        st: StateT<M, S, A>
    ) => StateT<M, S, B>;
    readonly ap: <S, A, B>(
        sf: StateT<M, S, (a: A) => B>,
        sa: StateT<M, S, A>
    ) => StateT<M, S, B>;
    readonly chain: <S, A, B>(
        f: (a: A) => StateT<M, S, B>,
        st: StateT<M, S, A>
    ) => StateT<M, S, B>;
}

// ── Factory function (merges with the instance-type interface) ───────
export declare function StateT<K extends keyof MonadInstances>(
    M: K
): StateTMonad<MonadInstances[K]>;
