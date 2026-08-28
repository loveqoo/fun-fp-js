/**
 * Store — (lookup: S → A, index: S), the dual of State.
 *
 * Slot assignment:
 *   In     — S (index; the position space)
 *   Target — A
 *
 * Owns: `Store<S, A>`, `StoreTypeLambda`, `const Store`, runtime key
 * `'store'` on Functor / Extend / Comonad registries.
 */

import type { TypeLambda } from "../HKT";

// ── Type ─────────────────────────────────────────────────────────────
export interface Store<S, A> {
    readonly _typeName: "Store";
    readonly index: S;
    extract(): A;
    peek(s: S): A;
    seek(s: S): Store<S, A>;
    experiment(f: (s: S) => ReadonlyArray<S>): A[];
    map<B>(f: (a: A) => B): Store<S, B>;
    extend<B>(f: (w: Store<S, A>) => B): Store<S, B>;
}

// ── TypeLambda ───────────────────────────────────────────────────────
export interface StoreTypeLambda extends TypeLambda {
    readonly type: Store<this["In"], this["Target"]>;
}

// ── Value namespace ──────────────────────────────────────────────────
export declare const Store: {
    new <S, A>(lookup: (s: S) => A, index: S): Store<S, A>;

    readonly isStore: (x: unknown) => x is Store<unknown, unknown>;

    // Repeated extend wraps the lookup in ever-deeper closures — with a rule
    // that reads several positions, the cost grows exponentially with
    // generations; wrap each generation with memo (a single-read rule stays
    // linear). keyOf is REQUIRED — it turns a position into a cache key
    // (identity for primitives, except +0/-0 which the Map merges; a
    // serializer for object positions). Colliding keys and unstable lookups
    // are the caller's responsibility. docs/internals.md#store-perf
    readonly memo: <S, A>(
        store: Store<S, A>,
        keyOf: (s: S) => unknown
    ) => Store<S, A>;
};

// ─── Runtime-dispatch registrations ──────────────────────────────────
// Runtime: StoreFunctor / StoreExtend / StoreComonad (키 'store').
declare module "../TypeClasses" {
    interface FunctorInstances { readonly store: StoreTypeLambda }
    interface ExtendInstances  { readonly store: StoreTypeLambda }
    interface ComonadInstances { readonly store: StoreTypeLambda }
}
