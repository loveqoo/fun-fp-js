/**
 * Transducer utilities — composable reducer transformations with early
 * termination via `Reduced<A>`.
 */

export interface Reduced<A> {
    readonly value: A;
}

// A transducer transforms a reducer into another reducer.
export type Reducer<Acc, V> = (acc: Acc, val: V) => Acc | Reduced<Acc>;
export type Transducer<V1, V2> = <Acc>(r: Reducer<Acc, V2>) => Reducer<Acc, V1>;

export declare const transducer: {
    readonly Reduced: {
        new <A>(value: A): Reduced<A>;
        of<A>(value: A): Reduced<A>;
        isReduced(value: unknown): value is Reduced<unknown>;
    };
    readonly of: <A>(value: A) => Reduced<A>;
    readonly isReduced: (value: unknown) => value is Reduced<unknown>;

    // Run a transducer against a collection. Uncurried, like the rest of the library.
    readonly transduce: <Acc, V1, V2>(
        t: Transducer<V1, V2>,
        reducer: Reducer<Acc, V2>,
        init: Acc,
        collection: Iterable<V1>
    ) => Acc;

    // Pour through a transducer into a vessel — the reducer is inferred from
    // the vessel's type. Clojure semantics: contents preserved, original untouched.
    readonly into: {
        <V1, B>(vessel: readonly B[], t: Transducer<V1, B>, collection: Iterable<V1>): B[];
        <V1>(vessel: string, t: Transducer<V1, string>, collection: Iterable<V1>): string;
        <V1, B>(vessel: ReadonlySet<B>, t: Transducer<V1, B>, collection: Iterable<V1>): Set<B>;
        <V1, K, B>(vessel: ReadonlyMap<K, B>, t: Transducer<V1, readonly [K, B]>, collection: Iterable<V1>): Map<K, B>;
        <V1, B>(vessel: Record<string, B>, t: Transducer<V1, readonly [string, B]>, collection: Iterable<V1>): Record<string, B>;
    };

    // Building blocks.
    readonly map: <A, B>(f: (a: A) => B) => Transducer<A, B>;
    readonly filter: <A>(p: (a: A) => boolean) => Transducer<A, A>;
    readonly take: <A>(count: number) => Transducer<A, A>;
};
