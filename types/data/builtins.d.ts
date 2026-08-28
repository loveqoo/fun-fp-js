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
import type { Maybe } from "./Maybe";
import type { IdentityTypeLambda } from "../TypeLambdas";

// ─── Array ───────────────────────────────────────────────────────────
// Runtime: Semigroup (str-style concat), Monoid, Filterable, Functor,
// Apply, Applicative, Alt, Plus, Alternative, Chain, ChainRec, Monad,
// Foldable, Traversable, Extend, Comonad.
declare module "../TypeClasses" {
    interface FunctorInstances      { readonly array: ArrayTypeLambda }
    interface ApplyInstances        { readonly array: ArrayTypeLambda }
    interface ApplicativeInstances  { readonly array: ArrayTypeLambda }
    // Identity / Const 는 Array 절이 아니지만 같은 declare module 블록에 둔다 — 파일 하단 참조.
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
// FunctionSemigroupoid (compose) + FunctionCategory (id) + the optics trio
// FunctionStrong/FunctionChoice/FunctionWander (first/left/wander).
declare module "../TypeClasses" {
    interface ContravariantInstances { readonly function: FunctionTypeLambda }
    interface ProfunctorInstances    { readonly function: FunctionTypeLambda }
    interface StrongInstances        { readonly function: FunctionTypeLambda }
    interface ChoiceInstances        { readonly function: FunctionTypeLambda }
    interface WanderInstances        { readonly function: FunctionTypeLambda }
    interface SemigroupoidInstances  { readonly function: FunctionTypeLambda }
    interface CategoryInstances      { readonly function: FunctionTypeLambda }
}

// ─── Concrete-type instance registrations ────────────────────────────
// Setoid: BooleanSetoid / NumberSetoid / StringSetoid / DefaultSetoid
//         (StringLengthSetoid / StringLocaleSetoid use constructor-name keys
//         only — they are the equivalences the length/locale orders induce)
// Ord:    NumberOrd / StringOrd / DefaultOrd (StringLengthOrd /
//         StringLocaleOrd use constructor-name keys only). Every Ord is a
//         Setoid — `equals` comes from the paired Setoid it is built on.
// Semigroup default aliases (first-registered wins per key):
//   boolean → BooleanAllSemigroup (AND)
//   number  → NumberSumSemigroup
//   string  → StringSemigroup
//   array   → ArraySemigroup (concat)
//   function→ FunctionSemigroup (compose2)
//   first   → FirstSemigroup, last → LastSemigroup
//     Both are type-agnostic (registered with type 'any'), hence `unknown`
//     below. Arguments must still match each other's type.
// Monoid default aliases mirror Semigroup for the combinations that have
// an identity element. first/last have none, so they are absent from
// MonoidInstances — wrap them in Maybe when a Monoid is needed
// (Monoid.Maybe('first'); Nothing supplies the identity).
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
        // Plus 에서 유도된다. 키는 그 타입의 이름 그대로다 — 한때 "plus(maybe)" 였는데
        // f(x) 는 F<X> 를 뜻하므로 버그였다. Array 는 이미 있어 유도하지 않는다.
        readonly maybe: Maybe<unknown>;
    }
    interface MonoidInstances {
        readonly boolean: boolean;
        readonly number: number;
        readonly string: string;
        readonly array: ReadonlyArray<unknown>;
        readonly function: (x: never) => unknown;
        // 위와 같다 — Plus 유도본의 키는 타입 이름이다.
        readonly maybe: Maybe<unknown>;
    }
    interface GroupInstances {
        readonly number: number;
    }
}

// ─── Identity / Const — traverse 에 넘기는 Applicative ────────────────
// Identity 는 값을 그대로 나르고, Const<r> 은 값을 버리고 monoid 로 r 만 모은다.
// optics 의 over(Identity) / preview·toList·foldMapOf(Const) 가 쓴다.
declare module "../TypeClasses" {
    interface FunctorInstances      { readonly identity: IdentityTypeLambda }
    interface ApplyInstances        { readonly identity: IdentityTypeLambda }
    interface FoldableInstances     { readonly identity: IdentityTypeLambda }
    interface ReducibleInstances    { readonly identity: IdentityTypeLambda }
    interface ApplicativeInstances  { readonly identity: IdentityTypeLambda }
}
