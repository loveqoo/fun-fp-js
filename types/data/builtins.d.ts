/**
 * Runtime-dispatch registrations for JS built-in types (Array, Function).
 *
 * The TypeLambdas themselves (`ArrayTypeLambda`, `FunctionTypeLambda`) are
 * declared in `../TypeLambdas.d.ts` because they don't get their own data
 * modules. Registrations live here so each type class's `*Instances` map
 * sees them even if user code only imports `fun-fp-js`.
 */

import type {
    ArrayTypeLambda,
    FunctionTypeLambda,
} from "../TypeLambdas";

// ─── Array ───────────────────────────────────────────────────────────
// Runtime: Semigroup (str-style concat), Monoid, Filterable, Functor,
// Apply, Applicative, Alt, Plus, Alternative, Chain, ChainRec, Monad,
// Foldable, Traversable, Extend, Comonad.
declare module "../TypeClasses" {
    interface FunctorInstances      { readonly array: ArrayTypeLambda }
    interface ApplyInstances        { readonly array: ArrayTypeLambda }
    interface ApplicativeInstances  { readonly array: ArrayTypeLambda }
    interface ChainInstances        { readonly array: ArrayTypeLambda }
    interface ChainRecInstances     { readonly array: ArrayTypeLambda }
    interface MonadInstances        { readonly array: ArrayTypeLambda }
    interface AltInstances          { readonly array: ArrayTypeLambda }
    interface PlusInstances         { readonly array: ArrayTypeLambda }
    interface AlternativeInstances  { readonly array: ArrayTypeLambda }
    interface FoldableInstances     { readonly array: ArrayTypeLambda }
    interface TraversableInstances  { readonly array: ArrayTypeLambda }
    interface FilterableInstances   { readonly array: ArrayTypeLambda }
    interface ExtendInstances       { readonly array: ArrayTypeLambda }
    interface ComonadInstances      { readonly array: ArrayTypeLambda }
}

// ─── Function (HKT registrations) ────────────────────────────────────
// Runtime: PredicateContravariant (contramap) + FunctionProfunctor (promap) +
// FunctionSemigroupoid (compose) + FunctionCategory (id).
declare module "../TypeClasses" {
    interface ContravariantInstances { readonly function: FunctionTypeLambda }
    interface ProfunctorInstances    { readonly function: FunctionTypeLambda }
    interface SemigroupoidInstances  { readonly function: FunctionTypeLambda }
    interface CategoryInstances      { readonly function: FunctionTypeLambda }
}

// ─── Concrete-type instance registrations ────────────────────────────
// Setoid: BooleanSetoid / NumberSetoid / StringSetoid
// Ord:    NumberOrd / StringOrd (StringLengthOrd / StringLocaleOrd use
//         constructor-name keys only)
// Semigroup default aliases (first-registered wins per key):
//   boolean → BooleanAllSemigroup (AND)
//   number  → NumberSumSemigroup
//   string  → StringSemigroup
//   array   → ArraySemigroup (concat)
//   function→ FunctionSemigroup (compose2)
//   first   → FirstSemigroup, last → LastSemigroup
// Monoid default aliases mirror Semigroup for the combinations that have
// an identity element.
// Group:
//   number  → NumberSumGroup (additive inverse)
declare module "../TypeClasses" {
    interface SetoidInstances {
        readonly boolean: boolean;
        readonly number: number;
        readonly string: string;
    }
    interface OrdInstances {
        readonly number: number;
        readonly string: string;
    }
    interface SemigroupInstances {
        readonly boolean: boolean;
        readonly number: number;
        readonly string: string;
        readonly array: ReadonlyArray<unknown>;
        readonly function: (x: never) => unknown;
        readonly first: unknown;
        readonly last: unknown;
    }
    interface MonoidInstances {
        readonly boolean: boolean;
        readonly number: number;
        readonly string: string;
        readonly array: ReadonlyArray<unknown>;
        readonly function: (x: never) => unknown;
    }
    interface GroupInstances {
        readonly number: number;
    }
}
