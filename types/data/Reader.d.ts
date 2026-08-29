/**
 * Reader — R → A, reads from an immutable environment.
 *
 * Slot assignment:
 *   In     — R (environment; contravariant input)
 *   Target — A
 *
 * Owns: `Reader<R, A>`, `ReaderTypeLambda`, `const Reader`, runtime key
 * `'reader'` on Functor / Apply / Applicative / Chain / Monad registries.
 */

import type { TypeLambda } from "../HKT";

// ── Type ─────────────────────────────────────────────────────────────
export interface Reader<R, A> {
    readonly _typeName: "Reader";
    run(env: R): A;
    map<B>(f: (a: A) => B): Reader<R, B>;
    chain<B>(f: (a: A) => Reader<R, B>): Reader<R, B>;
}

// ── TypeLambda ───────────────────────────────────────────────────────
export interface ReaderTypeLambda extends TypeLambda {
    readonly type: Reader<this["In"], this["Target"]>;
}

// ── Value namespace ──────────────────────────────────────────────────
export declare const Reader: {
    // 직접 생성이 공개 API 다(docs/Reader.md 의 new Reader 예제).
    new <R, A>(run: (env: R) => A): Reader<R, A>;
    readonly of: <R, A>(a: A) => Reader<R, A>;
    readonly isReader: (x: unknown) => x is Reader<unknown, unknown>;

    // Pre-constructed Reader<R, R> for any R. Runtime is a single value
    // `new Reader(env => env)`. TS cannot express "polymorphic for any R"
    // on a value, so it's typed as Reader<unknown, unknown>; narrow with
    // an `as Reader<MyR, MyR>` cast at the usage site when needed.
    readonly ask: Reader<unknown, unknown>;
    readonly asks: <R, A>(f: (env: R) => A) => Reader<R, A>;
    readonly local: <R1, R2, A>(
        f: (r: R1) => R2,
        reader: Reader<R2, A>
    ) => Reader<R1, A>;

    readonly map: <R, A, B>(
        f: (a: A) => B,
        r: Reader<R, A>
    ) => Reader<R, B>;
    readonly ap: <R, A, B>(
        rf: Reader<R, (a: A) => B>,
        ra: Reader<R, A>
    ) => Reader<R, B>;
    readonly chain: <R, A, B>(
        f: (a: A) => Reader<R, B>,
        r: Reader<R, A>
    ) => Reader<R, B>;

    readonly pipeK: {
        <R, A, B>(f1: (a: A) => Reader<R, B>): (a: A) => Reader<R, B>;
        <R, A, B, C>(
            f1: (a: A) => Reader<R, B>,
            f2: (b: B) => Reader<R, C>
        ): (a: A) => Reader<R, C>;
        <R, A, B, C, D>(
            f1: (a: A) => Reader<R, B>,
            f2: (b: B) => Reader<R, C>,
            f3: (c: C) => Reader<R, D>
        ): (a: A) => Reader<R, D>;
    };
    readonly composeK: {
        <R, A, B>(f1: (a: A) => Reader<R, B>): (a: A) => Reader<R, B>;
        <R, A, B, C>(
            f2: (b: B) => Reader<R, C>,
            f1: (a: A) => Reader<R, B>
        ): (a: A) => Reader<R, C>;
    };

    // Generic lift — takes an N-ary function and returns a function that
    // expects N Reader-wrapped args, producing a Reader of the result
    // (liftA_n semantics, using ap under the hood).
    readonly lift: <Args extends readonly unknown[], R>(
        f: (...args: Args) => R
    ) => <E = unknown>(
        ...wrapped: { [K in keyof Args]: Reader<E, Args[K]> }
    ) => Reader<E, R>;
};

// ── Register 'reader' on type-class registries ───────────────────────
declare module "../TypeClasses" {
    interface FunctorInstances     { readonly reader: ReaderTypeLambda }
    interface ApplyInstances       { readonly reader: ReaderTypeLambda }
    interface ApplicativeInstances { readonly reader: ReaderTypeLambda }
    interface ChainInstances       { readonly reader: ReaderTypeLambda }
    interface MonadInstances       { readonly reader: ReaderTypeLambda }
}
