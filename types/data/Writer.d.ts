/**
 * Writer — pair [A, W] where W is accumulated via a Monoid.
 *
 * Slot assignment:
 *   Out1   — W (log / output; covariant)
 *   Target — A
 *
 * Owns: `Writer<W, A>`, `WriterTypeLambda`, `const Writer`, runtime key
 * `'writer'` on Functor / Apply / Applicative / Chain / Monad registries.
 *
 * Note: the runtime class stores the `Monoid<W>` instance on the value
 * itself. This TS surface types the monoid argument on factories as
 * `unknown` until the Monoid type class is declared. Defaults at runtime
 * use `Monoid.of('array')`, i.e. W = unknown[].
 */

import type { TypeLambda } from "../HKT";

// ── Type ─────────────────────────────────────────────────────────────
// Note on instance `exec()`: runtime returns `this.value` (the A channel),
// not the output. This matches the library's convention — use `run()` to
// get both [a, w], use `exec()` for just the value.
export interface Writer<W, A> {
    readonly _typeName: "Writer";
    readonly value: A;
    readonly output: W;
    readonly monoid: unknown;
    run(): [A, W];
    exec(): A;
    map<B>(f: (a: A) => B): Writer<W, B>;
    chain<B>(f: (a: A) => Writer<W, B>): Writer<W, B>;
}

// ── TypeLambda ───────────────────────────────────────────────────────
export interface WriterTypeLambda extends TypeLambda {
    readonly type: Writer<this["Out1"], this["Target"]>;
}

// ── Value namespace ──────────────────────────────────────────────────
export declare const Writer: {
    // `of` starts with an empty output (from the monoid).
    readonly of: <A, W = unknown[]>(a: A, monoid?: unknown) => Writer<W, A>;
    readonly isWriter: (x: unknown) => x is Writer<unknown, unknown>;

    // `tell` writes output, returns Writer<W, undefined>.
    readonly tell: <W>(
        output: W,
        monoid?: unknown
    ) => Writer<W, undefined>;

    // Expose output alongside value.
    readonly listen: <W, A>(w: Writer<W, A>) => Writer<W, [A, W]>;
    // Expose a projection of output alongside value.
    readonly listens: <W, A, B>(
        f: (output: W) => B,
        w: Writer<W, A>
    ) => Writer<W, [A, B]>;
    // Apply a function carried in the value to the output.
    readonly pass: <W, A>(
        w: Writer<W, [A, (output: W) => W]>
    ) => Writer<W, A>;
    // Transform the accumulated output.
    readonly censor: <W, A>(
        f: (output: W) => W,
        w: Writer<W, A>
    ) => Writer<W, A>;

    readonly map: <W, A, B>(
        f: (a: A) => B,
        w: Writer<W, A>
    ) => Writer<W, B>;
    readonly ap: <W, A, B>(
        wf: Writer<W, (a: A) => B>,
        wa: Writer<W, A>
    ) => Writer<W, B>;
    readonly chain: <W, A, B>(
        f: (a: A) => Writer<W, B>,
        w: Writer<W, A>
    ) => Writer<W, B>;

    readonly pipeK: {
        <W, A, B>(f1: (a: A) => Writer<W, B>): (a: A) => Writer<W, B>;
        <W, A, B, C>(
            f1: (a: A) => Writer<W, B>,
            f2: (b: B) => Writer<W, C>
        ): (a: A) => Writer<W, C>;
        <W, A, B, C, D>(
            f1: (a: A) => Writer<W, B>,
            f2: (b: B) => Writer<W, C>,
            f3: (c: C) => Writer<W, D>
        ): (a: A) => Writer<W, D>;
    };
    readonly composeK: {
        <W, A, B>(f1: (a: A) => Writer<W, B>): (a: A) => Writer<W, B>;
        <W, A, B, C>(
            f2: (b: B) => Writer<W, C>,
            f1: (a: A) => Writer<W, B>
        ): (a: A) => Writer<W, C>;
    };

    readonly lift: <Args extends readonly unknown[], R>(
        f: (...args: Args) => R
    ) => <W = unknown[]>(
        ...wrapped: { [K in keyof Args]: Writer<W, Args[K]> }
    ) => Writer<W, R>;
};

// ── Register 'writer' on type-class registries ───────────────────────
declare module "../TypeClasses" {
    interface FunctorInstances     { readonly writer: WriterTypeLambda }
    interface ApplyInstances       { readonly writer: WriterTypeLambda }
    interface ApplicativeInstances { readonly writer: WriterTypeLambda }
    interface ChainInstances       { readonly writer: WriterTypeLambda }
    interface MonadInstances       { readonly writer: WriterTypeLambda }
}
