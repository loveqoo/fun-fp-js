/**
 * Higher-Kinded Types encoding for fun-fp-js.
 *
 * Adapted from effect-ts's TypeLambda approach
 * (Effect-TS/effect, packages/effect/src/HKT.ts, Apache-2.0).
 *
 * Design notes:
 *  - Single unified `Kind` for all arities. No Kind1/Kind2/Kind3 split.
 *  - Four role-based slots on a TypeLambda; unused slots take `never`.
 *  - Users register new types by declaring `interface X extends TypeLambda`.
 *    No module augmentation of any global registry required.
 *  - Runtime-side string dispatch (`Functor.lookup('maybe')`) is kept orthogonal
 *    at the value level; the mapping `'maybe' → MaybeTypeLambda` is a thin
 *    layer declared per type-class entry point.
 */

// ── Variance phantom helpers (module-internal) ───────────────────────
// Used only in the un-applied (abstract) branch of `Kind` to tag each
// slot with its intended variance. Concrete instantiations (`F & {...}`
// with a `type` member) bypass these and produce the real type directly.
// Not exported to avoid collision with the `Contravariant` type class.
type _Covariant<A>     = (_: never) => A;
type _Contravariant<A> = (_: A) => void;
type _Invariant<A>     = (_: A) => A;

// ── TypeLambda: a type-level lambda with four role-based slots ───────
// In     — contravariant input     (e.g. R in Reader, env)
// Out2   — covariant output slot   (e.g. E in Either, rejection in Task)
// Out1   — covariant output slot   (e.g. W in Writer log)
// Target — invariant main output   (e.g. A in Maybe<A>, value channel)
//
// A concrete TypeLambda extends this and implements `readonly type`,
// referencing `this["In"] / this["Out2"] / this["Out1"] / this["Target"]`
// to assemble the applied type.
export interface TypeLambda {
    readonly In:     unknown;
    readonly Out2:   unknown;
    readonly Out1:   unknown;
    readonly Target: unknown;
}

// ── Kind: apply a TypeLambda to concrete slot types ──────────────────
// If `F` has a `readonly type` member, we intersect the slots in and
// read `["type"]`, triggering TS lazy evaluation with the new slot values.
// Otherwise we fall back to a phantom record tagged with variances —
// used when writing type-class definitions that are generic over `F`
// without ever applying it.
export type Kind<
    F extends TypeLambda,
    In,
    Out2,
    Out1,
    Target
> = F extends { readonly type: unknown }
    ? (F & {
          readonly In:     In;
          readonly Out2:   Out2;
          readonly Out1:   Out1;
          readonly Target: Target;
      })["type"]
    : {
          readonly F:      F;
          readonly In:     _Contravariant<In>;
          readonly Out2:   _Covariant<Out2>;
          readonly Out1:   _Covariant<Out1>;
          readonly Target: _Invariant<Target>;
      };

// ── TypeClass marker ─────────────────────────────────────────────────
// Carries `F` as a phantom so that type-class interfaces can be generic
// over a TypeLambda without ever materializing it at the value level.
// Uses a unique symbol to avoid colliding with user-defined property names.
declare const TypeLambdaF: unique symbol;

export interface TypeClass<F extends TypeLambda> {
    readonly [TypeLambdaF]?: F;
}
