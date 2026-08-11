/**
 * Optics — Van Laarhoven encoding (F-explicit).
 *
 *   Optic<S, A> = forall F. F → (a → F<a>) → s → F<s>
 *
 * The F is an explicit first argument, so plain `compose` cannot combine optics —
 * use `composeOptic` (aliased as `composeLens` for the Lens-only case).
 *
 *   Lens      exactly 1 target   needs only a Functor
 *   Prism     0 or 1 target      needs an Applicative (`of` lifts a miss unchanged)
 *   Traversal 0..n targets       needs an Applicative (`ap` combines results)
 *
 * `Lens<S, A>` is assignable wherever `Optic<S, A>` is expected: it accepts the weaker
 * `Functor<F>` dictionary, and `Applicative<F>` extends `Functor<F>`.
 */

import type { Kind, TypeLambda } from "./HKT";
import type { Applicative, Functor } from "./TypeClasses";
import type { Maybe } from "./data/Maybe";
import type { TraversableInstances } from "./TypeClasses";

// Lens<S, A> : forall F : Functor. (a → F<a>) → s → F<s>
export type Lens<S, A> = <F extends TypeLambda>(
    F: Functor<F>
) => (
    f: (a: A) => Kind<F, never, never, never, A>
) => (s: S) => Kind<F, never, never, never, S>;

// Prism / Traversal need `of` and `ap`, so they take an Applicative dictionary.
export type Prism<S, A> = <F extends TypeLambda>(
    F: Applicative<F>
) => (
    f: (a: A) => Kind<F, never, never, never, A>
) => (s: S) => Kind<F, never, never, never, S>;

export type Traversal<S, A> = <F extends TypeLambda>(
    F: Applicative<F>
) => (
    f: (a: A) => Kind<F, never, never, never, A>
) => (s: S) => Kind<F, never, never, never, S>;

// Any of the three. Read/write helpers accept this.
export type Optic<S, A> = Lens<S, A> | Prism<S, A> | Traversal<S, A>;

// ── Construction ─────────────────────────────────────────────────────

// Construct a Lens from a plain getter + setter pair.
export declare function Lens<S, A>(
    getter: (s: S) => A,
    setter: (b: A, s: S) => S
): Lens<S, A>;

// Construct a Prism. `match` reports whether the branch applies; `build` goes back.
export declare function Prism<S, A>(
    match: (s: S) => Maybe<A>,
    build: (a: A) => S
): Prism<S, A>;

// Lift an existing Traversable instance into a Traversal ('array' | 'maybe' | 'either' | ...).
export declare function traversed<K extends keyof TraversableInstances>(
    key: K
): Traversal<any, any>;

// ── Reading ──────────────────────────────────────────────────────────

// View through a Lens. Only meaningful for optics with exactly one target.
export declare function view<S, A>(lens: Lens<S, A>, s: S): A;

// First target, if any. Works for every optic.
export declare function preview<S, A>(optic: Optic<S, A>, s: S): Maybe<A>;

// Every target, in order. Works for every optic.
export declare function toListOf<S, A>(optic: Optic<S, A>, s: S): A[];

// Build an S back from a focus. Prism only — other optics throw at runtime.
export declare function review<S, A>(prism: Prism<S, A>, a: A): S;

// ── Writing ──────────────────────────────────────────────────────────

// Modify every target via a function. No targets ⇒ the source is returned unchanged.
export declare function over<S, A>(
    optic: Optic<S, A>,
    f: (a: A) => A,
    s: S
): S;

// Replace every target with a constant.
export declare function set<S, A>(optic: Optic<S, A>, b: A, s: S): S;

// ── Composition ──────────────────────────────────────────────────────

// Compose optics outer-to-inner. Overloads up to arity 4.
export declare function composeOptic<S, T, A>(
    o1: Optic<S, T>,
    o2: Optic<T, A>
): Optic<S, A>;
export declare function composeOptic<S, T1, T2, A>(
    o1: Optic<S, T1>,
    o2: Optic<T1, T2>,
    o3: Optic<T2, A>
): Optic<S, A>;
export declare function composeOptic<S, T1, T2, T3, A>(
    o1: Optic<S, T1>,
    o2: Optic<T1, T2>,
    o3: Optic<T2, T3>,
    o4: Optic<T3, A>
): Optic<S, A>;

// Lens-only alias kept for backwards compatibility — same behaviour, Lens-worded errors.
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
