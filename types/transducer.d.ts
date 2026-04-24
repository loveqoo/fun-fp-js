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

    // Run a transducer against a collection.
    readonly transduce: <V1, V2>(
        t: Transducer<V1, V2>
    ) => <Acc>(
        reducer: Reducer<Acc, V2>
    ) => (init: Acc) => (collection: Iterable<V1>) => Acc;

    // Building blocks.
    readonly map: <A, B>(f: (a: A) => B) => Transducer<A, B>;
    readonly filter: <A>(p: (a: A) => boolean) => Transducer<A, A>;
    readonly take: <A>(count: number) => Transducer<A, A>;
};
