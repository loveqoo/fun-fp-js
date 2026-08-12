/**
 * Optics — profunctor encoding.
 *
 *   Optic<S, A> = P => P<A, A> → P<S, S>
 *
 * The P is an explicit first argument, so plain `compose` cannot combine optics —
 * use `Optics.compose`. Which P you inject decides the operation, so one definition
 * yields reading, writing and reverse construction.
 *
 *   Iso       exactly 1 target   reaches for `dimap` only — works with every P,
 *                                so it is both a Lens and a Prism
 *   Lens      exactly 1 target   reaches for `first`  (product)
 *   Prism     0 or 1 target      reaches for `left`   (sum)
 *   Traversal 0..n targets       reaches for `wander` (delegates to Traversable)
 *
 * The three share one TypeScript shape — at runtime they differ only in which
 * Profunctor method they call. `review` is the one helper that narrows to Prism.
 */

import type { Maybe } from "./data/Maybe";
import type { TraversableInstances, Monoid } from "./TypeClasses";

/**
 * A Profunctor dictionary. Which one you inject decides the operation:
 *   function   → over/set        (needs dimap, first, left, wander)
 *   Forget<r>  → view/preview/toList
 *   Tagged     → review          (has dimap and left only)
 *
 * `Tagged` lacking `first`/`wander` is what stops `review` on a Lens or Traversal.
 */
export interface Profunctor2 {
    readonly dimap: (f: (s: any) => any, g: (b: any) => any, p: any) => any;
    readonly first?: (p: any) => any;
    readonly left?: (p: any) => any;
    readonly wander?: (traverse: any, p: any) => any;
}

// The focus type `A` never appears in the runtime signature, so it is anchored with a
// phantom member — without it TypeScript cannot infer `A` at call sites like
// `over(lens, s => s.toUpperCase(), p)`.
declare const OPTIC_FOCUS: unique symbol;

export interface Optic<S, A> {
    (P: Profunctor2): (pab: any) => (s: S) => any;
    readonly [OPTIC_FOCUS]?: (a: A) => A;
}

export type Iso<S, A> = Optic<S, A>;
export type Lens<S, A> = Optic<S, A>;
export type Prism<S, A> = Optic<S, A>;
export type Traversal<S, A> = Optic<S, A>;

// ── Construction ─────────────────────────────────────────────────────

// Construct an Iso from a lossless conversion pair.
// Laws: from(to(s)) === s and to(from(a)) === a
declare function Iso<S, A>(to: (s: S) => A, from: (a: A) => S): Iso<S, A>;

// Construct a Lens from a plain getter + setter pair.
declare function Lens<S, A>(
    getter: (s: S) => A,
    setter: (b: A, s: S) => S
): Lens<S, A>;

// Construct a Prism. `match` reports whether the branch applies; `build` goes back.
declare function Prism<S, A>(
    match: (s: S) => Maybe<A>,
    build: (a: A) => S
): Prism<S, A>;

// Lift an existing Traversable instance into a Traversal ('array' | 'maybe' | 'either' | ...).
declare function traversed<K extends keyof TraversableInstances>(
    key: K
): Traversal<any, any>;

// ── Reading ──────────────────────────────────────────────────────────

// View through a Lens or Iso — exactly one target.
// Zero or 2+ targets throw at runtime; use preview/toList instead.
declare function view<S, A>(lens: Lens<S, A>, s: S): A;

// First target, if any. Works for every optic.
declare function preview<S, A>(optic: Optic<S, A>, s: S): Maybe<A>;

// Every target, in order. Works for every optic.
declare function toList<S, A>(optic: Optic<S, A>, s: S): A[];

// Build an S back from a focus. Prism and Iso only — Lens/Traversal throw at runtime.
declare function review<S, A>(prism: Prism<S, A> | Iso<S, A>, a: A): S;

// ── Writing ──────────────────────────────────────────────────────────

// Modify every target via a function. No targets ⇒ the source is returned unchanged.
declare function over<S, A>(
    optic: Optic<S, A>,
    f: (a: A) => A,
    s: S
): S;

// Replace every target with a constant.
declare function set<S, A>(optic: Optic<S, A>, b: A, s: S): S;

// ── Composition ──────────────────────────────────────────────────────

// Compose optics outer-to-inner — this is plain function composition at the P layer.
// Overloads up to arity 4.
declare function composeOptics<S, T, A>(
    o1: Optic<S, T>,
    o2: Optic<T, A>
): Optic<S, A>;
declare function composeOptics<S, T1, T2, A>(
    o1: Optic<S, T1>,
    o2: Optic<T1, T2>,
    o3: Optic<T2, A>
): Optic<S, A>;
declare function composeOptics<S, T1, T2, T3, A>(
    o1: Optic<S, T1>,
    o2: Optic<T1, T2>,
    o3: Optic<T2, T3>,
    o4: Optic<T3, A>
): Optic<S, A>;

// ── The Optics module object ─────────────────────────────────────────
// Everything above is namespaced under a single export — `set`, `over` and
// `view` are far too common to sit at the top level (Static Land's first
// benefit is "no name clashes"). Inside the module the short names are safe,
// so the composer is exposed as `compose` and the fold as `toList`.
export declare const Optics: {
    readonly Iso: typeof Iso;
    readonly Lens: typeof Lens;
    readonly Prism: typeof Prism;
    readonly traversed: typeof traversed;
    readonly compose: typeof composeOptics;
    readonly view: typeof view;
    readonly preview: typeof preview;
    readonly toList: typeof toList;
    // Fold every target with a Monoid you choose. `toList` and `preview` are
    // the special cases where the Monoid is fixed.
    readonly foldMapOf: <S, A, R>(
        monoid: Monoid<R>,
        optic: Optic<S, A>,
        f: (a: A) => R,
        s: S
    ) => R;
    readonly over: typeof over;
    readonly set: typeof set;
    readonly review: typeof review;
};
