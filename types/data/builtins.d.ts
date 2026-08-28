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
    ObjectTypeLambda,
    TupleTypeLambda,
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
// Runtime: PredicateContravariant (contramap, 키는 'predicate') +
// FunctionProfunctor (promap) + FunctionSemigroupoid (compose) +
// FunctionCategory (id) + the optics trio FunctionStrong/FunctionChoice/
// FunctionWander (first/left/wander) + 함수 모나드 셋(Functor…Monad — Reader
// 와 같은 값을 바깥 포장 없이 쓴다. docs/internals.md#function-monad).
declare module "../TypeClasses" {
    interface FunctorInstances       { readonly function: FunctionTypeLambda }
    interface ApplyInstances         { readonly function: FunctionTypeLambda }
    interface ApplicativeInstances   { readonly function: FunctionTypeLambda }
    interface ChainInstances         { readonly function: FunctionTypeLambda }
    interface MonadInstances         { readonly function: FunctionTypeLambda }
    interface ContravariantInstances { readonly predicate: FunctionTypeLambda }
    interface ProfunctorInstances    { readonly function: FunctionTypeLambda }
    interface StrongInstances        { readonly function: FunctionTypeLambda }
    interface ChoiceInstances        { readonly function: FunctionTypeLambda }
    interface WanderInstances        { readonly function: FunctionTypeLambda }
    interface SemigroupoidInstances  { readonly function: FunctionTypeLambda }
    interface CategoryInstances      { readonly function: FunctionTypeLambda }
}

// ─── Object / Tuple (HKT registrations) ──────────────────────────────
// Runtime: ObjectFilterable(자기 소유 키만)·ObjectFoldable(값 접기),
// TupleBifunctor(bimap 이 [첫째, 둘째] 를 함께 변환 — 실측 ['a',3] → ['a!',6]).
declare module "../TypeClasses" {
    interface FilterableInstances { readonly object: ObjectTypeLambda }
    interface FoldableInstances   { readonly object: ObjectTypeLambda }
    interface BifunctorInstances  { readonly tuple: TupleTypeLambda }
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
        readonly date: Date;
        // default 는 원시값 전용이다 — 객체는 문자열로 뭉개져 거부한다(0.2.0 변경 기록).
        readonly default: number | string | boolean | bigint;
    }
    interface OrdInstances {
        readonly number: number;
        readonly string: string;
        readonly date: Date;
        readonly default: number | string | boolean | bigint;
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
    // identity 는 Chain/Monad 까지 오른다(트랜스포머의 안쪽 모나드 자격) —
    // Extend/Comonad 는 값 하나짜리 컨테이너의 자명한 코모나드.
    interface ChainInstances        { readonly identity: IdentityTypeLambda }
    interface MonadInstances        { readonly identity: IdentityTypeLambda }
    interface ExtendInstances       { readonly identity: IdentityTypeLambda }
    interface ComonadInstances      { readonly identity: IdentityTypeLambda }
}
