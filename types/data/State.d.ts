/**
 * State — S → [A, S], threads state through a computation.
 *
 * Slot assignment:
 *   In     — S (state; declared contravariant, actually invariant — see
 *             TypeLambdas.d.ts design note)
 *   Target — A
 *
 * Owns: `State<S, A>`, `StateTypeLambda`, `const State`, runtime key
 * `'state'` on Functor / Apply / Applicative / Chain / Monad registries.
 */

import type { TypeLambda } from "../HKT";

// ── Type ─────────────────────────────────────────────────────────────
export interface State<S, A> {
    readonly _typeName: "State";
    run(s: S): [A, S];
    eval(s: S): A;
    exec(s: S): S;
    map<B>(f: (a: A) => B): State<S, B>;
    chain<B>(f: (a: A) => State<S, B>): State<S, B>;
}

// ── TypeLambda ───────────────────────────────────────────────────────
export interface StateTypeLambda extends TypeLambda {
    readonly type: State<this["In"], this["Target"]>;
}

// ── Value namespace ──────────────────────────────────────────────────
export declare const State: {
    // 직접 생성이 공개 API 다(docs/State.md 의 new State 예제). run 은 [값, 다음 상태].
    new <S, A>(run: (s: S) => [A, S]): State<S, A>;
    readonly of: <S, A>(a: A) => State<S, A>;
    readonly isState: (x: unknown) => x is State<unknown, unknown>;

    // Pre-constructed State<S, S> that reads the state. Same polymorphism
    // caveat as Reader.ask — narrow with cast when the concrete S matters.
    readonly get: State<unknown, unknown>;
    readonly put: <S>(s: S) => State<S, undefined>;
    readonly modify: <S>(f: (s: S) => S) => State<S, undefined>;
    readonly gets: <S, A>(f: (s: S) => A) => State<S, A>;

    readonly map: <S, A, B>(
        f: (a: A) => B,
        st: State<S, A>
    ) => State<S, B>;
    readonly ap: <S, A, B>(
        sf: State<S, (a: A) => B>,
        sa: State<S, A>
    ) => State<S, B>;
    readonly chain: <S, A, B>(
        f: (a: A) => State<S, B>,
        st: State<S, A>
    ) => State<S, B>;

    readonly pipeK: {
        <S, A, B>(f1: (a: A) => State<S, B>): (a: A) => State<S, B>;
        <S, A, B, C>(
            f1: (a: A) => State<S, B>,
            f2: (b: B) => State<S, C>
        ): (a: A) => State<S, C>;
        <S, A, B, C, D>(
            f1: (a: A) => State<S, B>,
            f2: (b: B) => State<S, C>,
            f3: (c: C) => State<S, D>
        ): (a: A) => State<S, D>;
    };
    readonly composeK: {
        <S, A, B>(f1: (a: A) => State<S, B>): (a: A) => State<S, B>;
        <S, A, B, C>(
            f2: (b: B) => State<S, C>,
            f1: (a: A) => State<S, B>
        ): (a: A) => State<S, C>;
    };

    readonly lift: <Args extends readonly unknown[], R>(
        f: (...args: Args) => R
    ) => <S = unknown>(
        ...wrapped: { [K in keyof Args]: State<S, Args[K]> }
    ) => State<S, R>;
};

// ── Register 'state' on type-class registries ────────────────────────
declare module "../TypeClasses" {
    interface FunctorInstances     { readonly state: StateTypeLambda }
    interface ApplyInstances       { readonly state: StateTypeLambda }
    interface ApplicativeInstances { readonly state: StateTypeLambda }
    interface ChainInstances       { readonly state: StateTypeLambda }
    interface MonadInstances       { readonly state: StateTypeLambda }
}
