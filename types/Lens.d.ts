/**
 * Van Laarhoven Lens — `Lens<S, A>` encoded as a polymorphic Functor mapper.
 * Given any Functor F, it lifts `a → F<a>` into `s → F<s>`.
 */

import type { Kind, TypeLambda } from "./HKT";
import type { Functor } from "./TypeClasses";

// Lens<S, A> : forall F : Functor. (a → F<a>) → s → F<s>
export type Lens<S, A> = <F extends TypeLambda>(
    F: Functor<F>
) => (
    f: (a: A) => Kind<F, never, never, never, A>
) => (s: S) => Kind<F, never, never, never, S>;

// Construct a Lens from a plain getter + setter pair.
export declare function Lens<S, A>(
    getter: (s: S) => A,
    setter: (b: A, s: S) => S
): Lens<S, A>;

// View through a Lens.
export declare function view<S, A>(lens: Lens<S, A>, s: S): A;

// Modify the focused `a` via a function.
export declare function over<S, A>(
    lens: Lens<S, A>,
    f: (a: A) => A,
    s: S
): S;

// Replace the focused `a` with a constant.
export declare function set<S, A>(lens: Lens<S, A>, b: A, s: S): S;

// Compose multiple Lenses left-to-right. Overloads up to arity 4.
export declare function composeLens<S, T, A>(
    l1: Lens<S, T>,
    l2: Lens<T, A>
): Lens<S, A>;
export declare function composeLens<S, T1, T2, A>(
    l1: Lens<S, T1>,
    l2: Lens<T1, T2>,
    l3: Lens<T2, A>
): Lens<S, A>;
export declare function composeLens<S, T1, T2, T3, A>(
    l1: Lens<S, T1>,
    l2: Lens<T1, T2>,
    l3: Lens<T2, T3>,
    l4: Lens<T3, A>
): Lens<S, A>;
