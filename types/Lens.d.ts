/**
 * Optics — profunctor encoding.
 *
 *   Optic<S, A> = P => P<A, A> → P<S, S>
 *
 * The P is an explicit first argument, so plain `compose` cannot combine optics —
 * use `Optics.compose`. Which P you inject decides the operation, so one definition
 * yields reading, writing and reverse construction.
 *
 *   Iso       exactly 1 target   reaches for `promap` only — works with every P,
 *                                so it is both a Lens and a Prism
 *   Lens      exactly 1 target   reaches for `first`  (product)
 *   Prism     0 or 1 target      reaches for `left`   (sum)
 *   Traversal 0..n targets       reaches for `wander` (delegates to Traversable)
 *
 * The four share one runtime shape and differ only in which Profunctor method
 * they reach for — so the type carries exactly that: a phantom set of required
 * capabilities (`C`). Composition unions the sets, and `review` (the one
 * capability-gated helper — the runtime rejects a Lens/Traversal outright)
 * accepts only optics whose set stays within `left`. `view` is value-gated at
 * runtime (exactly one target), so it stays open to every kind here.
 */

import type { Maybe } from "./data/Maybe";
import type { TraversableInstances, Monoid } from "./TypeClasses";
import type { TaggedTypeLambda } from "./TypeLambdas";

// TaggedChoice(review 전용, 키 'tagged')의 등록 — 람다는 TypeLambdas.d.ts 소유.
declare module "./TypeClasses" {
    interface ChoiceInstances { readonly tagged: TaggedTypeLambda }
}

/**
 * A Profunctor dictionary. Which one you inject decides the operation:
 *   function   → over/set        (needs promap, first, left, wander)
 *   Forget<r>  → view/preview/toList
 *   Tagged     → review          (has promap and left only)
 *
 * `Tagged` lacking `first`/`wander` is what stops `review` on a Lens or Traversal.
 */
export interface Profunctor2 {
    readonly promap: (f: (s: any) => any, g: (b: any) => any, p: any) => any;
    readonly first?: (p: any) => any;
    readonly left?: (p: any) => any;
    readonly wander?: (traverse: any, p: any) => any;
}

// The focus type `A` never appears in the runtime signature, so it is anchored with a
// phantom member — without it TypeScript cannot infer `A` at call sites like
// `over(lens, s => s.toUpperCase(), p)`.
declare const OPTIC_FOCUS: unique symbol;
declare const OPTIC_CAPS: unique symbol;

// The P methods an optic reaches for beyond `promap`. Iso needs none (never),
// Lens `first`, Prism `left`, Traversal `wander`; composing unions the sets.
export type OpticCap = "first" | "left" | "wander";

// `C` defaults to the full set: a bare `Optic<S, A>` means "kind unknown" —
// every value-gated helper takes it, only `review` refuses it.
export interface Optic<S, A, C extends OpticCap = OpticCap> {
    (P: Profunctor2): (pab: any) => (s: S) => any;
    readonly [OPTIC_FOCUS]?: (a: A) => A;
    readonly [OPTIC_CAPS]?: C;
}

export type Iso<S, A> = Optic<S, A, never>;
export type Lens<S, A> = Optic<S, A, "first">;
export type Prism<S, A> = Optic<S, A, "left">;
export type Traversal<S, A> = Optic<S, A, "wander">;

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

// The Lens onto one property. Accepts an array index too, and the copy keeps the
// container's own shape (arrays stay arrays, symbols and non-enumerable props survive).
declare function prop<S, A>(key: string | number): Lens<S, A>;

// ── Reading ──────────────────────────────────────────────────────────

// View through an optic with exactly one target — meant for Lens/Iso, but
// value-gated at runtime (a matching Prism or a 1-element Traversal passes),
// so the type stays open. Zero or 2+ targets throw; use preview/toList instead.
declare function view<S, A>(lens: Optic<S, A>, s: S): A;

// First target, if any. Works for every optic.
declare function preview<S, A>(optic: Optic<S, A>, s: S): Maybe<A>;

// Every target, in order. Works for every optic.
declare function toList<S, A>(optic: Optic<S, A>, s: S): A[];

// Build an S back from a focus. Prism and Iso only — the runtime rejects a
// Lens/Traversal outright, so the type does too: the capability set must stay
// within `left` (never ⊆ left ⊆ left; first/wander, and any union with them, fail).
declare function review<S, A>(prism: Optic<S, A, "left">, a: A): S;

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
// The capability sets union, so the kind of the composite follows automatically
// (iso∘prism stays reviewable, lens∘prism does not — matches the runtime).
// Overloads up to arity 4.
declare function composeOptics<S, T, A, C1 extends OpticCap, C2 extends OpticCap>(
    o1: Optic<S, T, C1>,
    o2: Optic<T, A, C2>
): Optic<S, A, C1 | C2>;
declare function composeOptics<
    S, T1, T2, A, C1 extends OpticCap, C2 extends OpticCap, C3 extends OpticCap
>(
    o1: Optic<S, T1, C1>,
    o2: Optic<T1, T2, C2>,
    o3: Optic<T2, A, C3>
): Optic<S, A, C1 | C2 | C3>;
declare function composeOptics<
    S, T1, T2, T3, A,
    C1 extends OpticCap, C2 extends OpticCap, C3 extends OpticCap, C4 extends OpticCap
>(
    o1: Optic<S, T1, C1>,
    o2: Optic<T1, T2, C2>,
    o3: Optic<T2, T3, C3>,
    o4: Optic<T3, A, C4>
): Optic<S, A, C1 | C2 | C3 | C4>;

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
    readonly prop: typeof prop;
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
