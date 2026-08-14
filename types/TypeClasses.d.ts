/**
 * Type-class interfaces for fun-fp-js.
 *
 * Each interface is generic over a TypeLambda `F`. Method signatures match
 * the runtime (uncurried, static-land style). Slot threading is explicit:
 * `map` only varies Target; `bimap` varies Out2 + Target; `contramap` varies
 * Target contravariantly; etc.
 *
 * Dispatch entry points (`Functor.lookup(name)`, `Monad.lookup(name)`) resolve a
 * literal string key to a TypeLambda via per-type-class `*Instances` maps.
 * Users register new runtime-dispatch keys by module-augmenting those maps.
 * (Registering a *new TypeLambda* needs no augmentation — just declare
 * `interface XTypeLambda extends TypeLambda`.)
 *
 * Not yet covered: Bifunctor, Contravariant, Profunctor, Filterable,
 * ChainRec, Extend, Comonad, Semigroupoid, Category, Setoid, Ord,
 * Semigroup, Monoid, Group. Added in follow-up steps.
 */

import type { Kind, TypeClass, TypeLambda } from "./HKT";
import type { ConstTypeLambda } from "./TypeLambdas";

// ── Algebra — base class for every type-class instance at runtime ────
// Exposed for completeness (the default export includes `Algebra`);
// users rarely construct it directly.
//
// `Algebra.all(key)` is the plural counterpart of `TypeClass.lookup(key)`:
// one type class yields one instance, the shared root yields every instance
// that handles that type. Keys are lowercase; grouping is by the instance's
// `.type`, which is not always the registry key (`Semigroupoid`'s `maybe`
// instance has `.type === 'function'`, so it lands under `all('function')`).
//
// The shape is open — parameterized instances appear once their factory has
// run — so the result is typed as a record rather than a fixed set of fields.
export declare class Algebra {
    constructor(type: string);
    readonly type: string;
    static all(key: string): Record<string, Algebra>;
}

// ─── Functor ────────────────────────────────────────────────────────
export interface Functor<F extends TypeLambda> extends TypeClass<F> {
    readonly map: <In, Out2, Out1, A, B>(
        f: (a: A) => B,
        fa: Kind<F, In, Out2, Out1, A>
    ) => Kind<F, In, Out2, Out1, B>;
}

// ─── Apply ──────────────────────────────────────────────────────────
export interface Apply<F extends TypeLambda> extends Functor<F> {
    readonly ap: <In, Out2, Out1, A, B>(
        ff: Kind<F, In, Out2, Out1, (a: A) => B>,
        fa: Kind<F, In, Out2, Out1, A>
    ) => Kind<F, In, Out2, Out1, B>;
}

// ─── Applicative ────────────────────────────────────────────────────
export interface Applicative<F extends TypeLambda> extends Apply<F> {
    readonly of: <A, In = never, Out2 = never, Out1 = never>(
        a: A
    ) => Kind<F, In, Out2, Out1, A>;
}

// ─── Chain (Bind) ───────────────────────────────────────────────────
export interface Chain<F extends TypeLambda> extends Apply<F> {
    readonly chain: <In, Out2, Out1, A, B>(
        f: (a: A) => Kind<F, In, Out2, Out1, B>,
        fa: Kind<F, In, Out2, Out1, A>
    ) => Kind<F, In, Out2, Out1, B>;
}

// ─── Monad ──────────────────────────────────────────────────────────
export interface Monad<F extends TypeLambda> extends Applicative<F>, Chain<F> {}

// ─── Alt / Plus / Alternative ───────────────────────────────────────
export interface Alt<F extends TypeLambda> extends Functor<F> {
    readonly alt: <In, Out2, Out1, A>(
        fa: Kind<F, In, Out2, Out1, A>,
        fb: Kind<F, In, Out2, Out1, A>
    ) => Kind<F, In, Out2, Out1, A>;
}

export interface Plus<F extends TypeLambda> extends Alt<F> {
    readonly zero: <A, In = never, Out2 = never, Out1 = never>() => Kind<
        F, In, Out2, Out1, A
    >;
}

export interface Alternative<F extends TypeLambda>
    extends Applicative<F>, Plus<F> {}

// ─── Foldable ───────────────────────────────────────────────────────
export interface Foldable<F extends TypeLambda> extends TypeClass<F> {
    readonly reduce: <In, Out2, Out1, A, B>(
        f: (acc: B, a: A) => B,
        init: B,
        fa: Kind<F, In, Out2, Out1, A>
    ) => B;
}

// ─── Traversable ────────────────────────────────────────────────────
// `G` is the Applicative being distributed through; `F` is the outer
// Traversable structure. Slot threading is preserved on both.
export interface Traversable<F extends TypeLambda>
    extends Functor<F>, Foldable<F> {
    readonly traverse: <G extends TypeLambda>(
        applicative: Applicative<G>
    ) => <A, B, GIn, GOut2, GOut1, FIn, FOut2, FOut1>(
        f: (a: A) => Kind<G, GIn, GOut2, GOut1, B>,
        fa: Kind<F, FIn, FOut2, FOut1, A>
    ) => Kind<G, GIn, GOut2, GOut1, Kind<F, FIn, FOut2, FOut1, B>>;
}

// ─── Bifunctor ──────────────────────────────────────────────────────
// Varies Out2 (E) and Target (A) jointly.
export interface Bifunctor<F extends TypeLambda> extends TypeClass<F> {
    readonly bimap: <In, Out1, E1, E2, A, B>(
        f: (e: E1) => E2,
        g: (a: A) => B,
        fa: Kind<F, In, E1, Out1, A>
    ) => Kind<F, In, E2, Out1, B>;
}

// ─── Contravariant ──────────────────────────────────────────────────
// In fun-fp-js this is used on FunctionTypeLambda where the varying slot
// is `In` (the function's input), not `Target`. Other libraries (effect-ts)
// vary Target; we follow the runtime's actual instance (PredicateContravariant).
export interface Contravariant<F extends TypeLambda> extends TypeClass<F> {
    readonly contramap: <In1, Out2, Out1, Target, In2>(
        f: (a: In2) => In1,
        fa: Kind<F, In1, Out2, Out1, Target>
    ) => Kind<F, In2, Out2, Out1, Target>;
}

// ─── Profunctor ─────────────────────────────────────────────────────
// Varies In (contravariantly) and Target (covariantly).
export interface Profunctor<F extends TypeLambda> extends TypeClass<F> {
    readonly promap: <In1, Out2, Out1, T1, In2, T2>(
        f: (a: In2) => In1,
        g: (b: T1) => T2,
        fa: Kind<F, In1, Out2, Out1, T1>
    ) => Kind<F, In2, Out2, Out1, T2>;
}

// ─── Strong / Choice / Wander (Static Land 밖 — optics 확장) ─────────
// first/left/wander 가 각각 Lens/Prism/Traversal 을 낸다. 표준 이름이라 짝(second/right)도 진다.
// 근거: docs/internals.md#optics
export interface Strong<F extends TypeLambda> extends Profunctor<F> {
    readonly first: <In1, Out2, Out1, T1, C>(
        pab: Kind<F, In1, Out2, Out1, T1>
    ) => Kind<F, readonly [In1, C], Out2, Out1, readonly [T1, C]>;
    readonly second: <In1, Out2, Out1, T1, C>(
        pab: Kind<F, In1, Out2, Out1, T1>
    ) => Kind<F, readonly [C, In1], Out2, Out1, readonly [C, T1]>;
}

export interface Choice<F extends TypeLambda> extends Profunctor<F> {
    readonly left: <In1, Out2, Out1, T1, C>(
        pab: Kind<F, In1, Out2, Out1, T1>
    ) => Kind<F, Either<C, In1>, Out2, Out1, Either<C, T1>>;
    readonly right: <In1, Out2, Out1, T1, C>(
        pab: Kind<F, In1, Out2, Out1, T1>
    ) => Kind<F, Either<C, In1>, Out2, Out1, Either<C, T1>>;
}

// 명세 부모가 둘이다. JS 는 다중 상속이 안 되므로 런타임은 Strong 만 extends 하고
// Choice 의 메서드는 생성자가 받아 복사한다(Traversable 선례) — 타입 쪽은 둘 다 extends 한다.
export interface Wander<F extends TypeLambda> extends Strong<F>, Choice<F> {
    readonly wander: <In1, Out2, Out1, T1>(
        traverse: (...args: readonly any[]) => any,
        pab: Kind<F, In1, Out2, Out1, T1>
    ) => Kind<F, any, Out2, Out1, any>;
}

// ─── Filterable ─────────────────────────────────────────────────────
// Base form: 2-arg (pred, fa). Instances that accept extra args (like
// Either's `onFalse`) expose those on their own const namespace, not on
// the generic Filterable interface.
export interface Filterable<F extends TypeLambda> extends TypeClass<F> {
    readonly filter: {
        <In, Out2, Out1, A, B extends A>(
            pred: (a: A) => a is B,
            fa: Kind<F, In, Out2, Out1, A>
        ): Kind<F, In, Out2, Out1, B>;
        <In, Out2, Out1, A>(
            pred: (a: A) => boolean,
            fa: Kind<F, In, Out2, Out1, A>
        ): Kind<F, In, Out2, Out1, A>;
    };
}

// ─── ChainRec — stack-safe monadic recursion ────────────────────────
// Step<A, B> is the runtime-tagged union produced by `ChainRec.next(a)` /
// `ChainRec.done(b)`. The user callback yields one Step at a time wrapped
// in F. The implementation loops until it sees a `done`, avoiding a
// host-stack-bound recursion.
export type ChainRecStep<A, B> =
    | { readonly tag: "next"; readonly value: A }
    | { readonly tag: "done"; readonly value: B };

export interface ChainRec<F extends TypeLambda> extends Chain<F> {
    readonly chainRec: <In, Out2, Out1, A, B>(
        f: (
            next: (a: A) => ChainRecStep<A, B>,
            done: (b: B) => ChainRecStep<A, B>,
            input: A
        ) => Kind<F, In, Out2, Out1, ChainRecStep<A, B>>,
        init: A
    ) => Kind<F, In, Out2, Out1, B>;
}

// ─── Extend / Comonad ───────────────────────────────────────────────
export interface Extend<F extends TypeLambda> extends Functor<F> {
    readonly extend: <In, Out2, Out1, A, B>(
        f: (fa: Kind<F, In, Out2, Out1, A>) => B,
        fa: Kind<F, In, Out2, Out1, A>
    ) => Kind<F, In, Out2, Out1, B>;
}

export interface Comonad<F extends TypeLambda> extends Extend<F> {
    readonly extract: <In, Out2, Out1, A>(
        fa: Kind<F, In, Out2, Out1, A>
    ) => A;
}

// ═══════════════════════════════════════════════════════════════════
//   Kind-2 type classes (Semigroupoid, Category)
//   Still HKT-style — parameterized over a TypeLambda whose In and
//   Target slots act as the two endpoints.
// ═══════════════════════════════════════════════════════════════════

export interface Semigroupoid<F extends TypeLambda> extends TypeClass<F> {
    readonly compose: <A, B, C, Out2, Out1>(
        bc: Kind<F, B, Out2, Out1, C>,
        ab: Kind<F, A, Out2, Out1, B>
    ) => Kind<F, A, Out2, Out1, C>;
}

export interface Category<F extends TypeLambda> extends Semigroupoid<F> {
    readonly id: <A, Out2 = never, Out1 = never>() => Kind<
        F, A, Out2, Out1, A
    >;
}

// ═══════════════════════════════════════════════════════════════════
//   Concrete-type classes (Setoid, Ord, Semigroup, Monoid, Group)
//   Parameterized over a *concrete* type A, not a TypeLambda.
//   Dispatched via string keys mapped to `A` (not to a TypeLambda).
// ═══════════════════════════════════════════════════════════════════

export interface Setoid<A> {
    readonly equals: (a: A, b: A) => boolean;
}

// Ord compares to boolean (runtime uses `lte`-style: true if `x ≤ y`).
// The library's Ord.op is a `<=` comparator, not a -1|0|1 compare.
export interface Ord<A> extends Setoid<A> {
    readonly lte: (a: A, b: A) => boolean;
}

export interface Semigroup<A> {
    readonly concat: (a: A, b: A) => A;
}

export interface Monoid<A> extends Semigroup<A> {
    readonly empty: () => A;
}

export interface Group<A> extends Monoid<A> {
    readonly invert: (a: A) => A;
}

// ─── Runtime dispatch registries ────────────────────────────────────
// These map runtime string keys → TypeLambdas. Users register new keys
// via module augmentation, e.g.:
//
//   declare module "fun-fp-js/types/TypeClasses" {
//     interface FunctorInstances { mybox: MyBoxTypeLambda }
//   }
//
// Built-in keys are declared here. Per-type files (step 4) will add
// entries for Maybe/Either/Task/etc. via interface merging.

export interface FunctorInstances {}
export interface ApplyInstances {}
export interface ApplicativeInstances {}
export interface ChainInstances {}
export interface MonadInstances {}
export interface AltInstances {}
export interface PlusInstances {}
export interface AlternativeInstances {}
export interface FoldableInstances {}
export interface TraversableInstances {}
export interface BifunctorInstances {}
export interface ContravariantInstances {}
export interface ProfunctorInstances {}
export interface StrongInstances {}
export interface ChoiceInstances {}
export interface WanderInstances {}
export interface FilterableInstances {}
export interface ChainRecInstances {}
export interface ExtendInstances {}
export interface ComonadInstances {}
export interface SemigroupoidInstances {}
export interface CategoryInstances {}

// ─── Concrete-type instance maps (key → concrete A) ──────────────────
// Not TypeLambda-valued — the value is the concrete type the dispatch
// targets. Augment to register new runtime keys.
export interface SetoidInstances {}
export interface OrdInstances {}
export interface SemigroupInstances {}
export interface MonoidInstances {}
export interface GroupInstances {}

// ─── Dispatch entry points ──────────────────────────────────────────
// Signature mirrors the runtime: `TypeClass.lookup('name')` returns the
// instance for that name. The TS side resolves via the *Instances maps.
// Type classes have no `of` — that name means value injection (`Maybe.of(1)`,
// and the `of` on an Applicative *instance*).

export declare const Functor: {
    readonly lookup: <K extends keyof FunctorInstances>(
        name: K
    ) => Functor<FunctorInstances[K]>;
};

export declare const Apply: {
    readonly lookup: <K extends keyof ApplyInstances>(
        name: K
    ) => Apply<ApplyInstances[K]>;
};

export declare const Applicative: {
    readonly lookup: <K extends keyof ApplicativeInstances>(
        name: K
    ) => Applicative<ApplicativeInstances[K]>;
    // Const<r> — 값을 버리고 monoid 로 r 만 모은다. traverse 를 "접기" 로 쓸 때 넘긴다.
    // Monoid.Maybe(innerSG) 와 같은 모양: 키면 const(<키>) 로 등록하고, 인스턴스면 캐시한다.
    readonly Const: {
        <K extends keyof MonoidInstances>(monoid: K): Applicative<ConstTypeLambda>;
        <R>(monoid: Monoid<R>): Applicative<ConstTypeLambda>;
    };
};

export declare const Chain: {
    readonly lookup: <K extends keyof ChainInstances>(
        name: K
    ) => Chain<ChainInstances[K]>;
};

export declare const Monad: {
    readonly lookup: <K extends keyof MonadInstances>(
        name: K
    ) => Monad<MonadInstances[K]>;
};

export declare const Alt: {
    readonly lookup: <K extends keyof AltInstances>(
        name: K
    ) => Alt<AltInstances[K]>;
};

export declare const Plus: {
    readonly lookup: <K extends keyof PlusInstances>(
        name: K
    ) => Plus<PlusInstances[K]>;
};

export declare const Alternative: {
    readonly lookup: <K extends keyof AlternativeInstances>(
        name: K
    ) => Alternative<AlternativeInstances[K]>;
};

export declare const Foldable: {
    readonly lookup: <K extends keyof FoldableInstances>(
        name: K
    ) => Foldable<FoldableInstances[K]>;
};

export declare const Traversable: {
    readonly lookup: <K extends keyof TraversableInstances>(
        name: K
    ) => Traversable<TraversableInstances[K]>;
};

export declare const Bifunctor: {
    readonly lookup: <K extends keyof BifunctorInstances>(
        name: K
    ) => Bifunctor<BifunctorInstances[K]>;
};

export declare const Contravariant: {
    readonly lookup: <K extends keyof ContravariantInstances>(
        name: K
    ) => Contravariant<ContravariantInstances[K]>;
};

export declare const Profunctor: {
    readonly lookup: <K extends keyof ProfunctorInstances>(
        name: K
    ) => Profunctor<ProfunctorInstances[K]>;
};

export declare const Filterable: {
    readonly lookup: <K extends keyof FilterableInstances>(
        name: K
    ) => Filterable<FilterableInstances[K]>;
};

export declare const ChainRec: {
    readonly lookup: <K extends keyof ChainRecInstances>(
        name: K
    ) => ChainRec<ChainRecInstances[K]>;
    // Step constructors — used by chainRec callbacks.
    readonly next: <A>(a: A) => ChainRecStep<A, never>;
    readonly done: <B>(b: B) => ChainRecStep<never, B>;
};

export declare const Extend: {
    readonly lookup: <K extends keyof ExtendInstances>(
        name: K
    ) => Extend<ExtendInstances[K]>;
};

export declare const Comonad: {
    readonly lookup: <K extends keyof ComonadInstances>(
        name: K
    ) => Comonad<ComonadInstances[K]>;
};

export declare const Semigroupoid: {
    readonly lookup: <K extends keyof SemigroupoidInstances>(
        name: K
    ) => Semigroupoid<SemigroupoidInstances[K]>;
};

export declare const Category: {
    readonly lookup: <K extends keyof CategoryInstances>(
        name: K
    ) => Category<CategoryInstances[K]>;
};

// ─── Concrete-type class dispatch entry points ───────────────────────
// These return instances keyed by concrete type (not TypeLambda).
//
// 제약이 붙은 인스턴스(Semigroup.Maybe 등)는 데이터 타입 파일이 `*Static` 을 증강해
// 여기 붙인다 — 인스턴스를 돌려주는 것은 전부 타입 클래스 쪽에 산다(lookup 과 같은 자리).

export interface SetoidStatic {
    readonly lookup: <K extends keyof SetoidInstances>(
        name: K
    ) => Setoid<SetoidInstances[K]>;
    // Container factories — the inner comparison must always be named.
    // Composed keys resolve lazily too: Setoid.lookup('maybe(number)'),
    // 'array(number)', 'either(string,number)'. Struct is factory-only —
    // records are ad-hoc shapes and stay out of the registry.
    readonly Array: {
        <K extends keyof SetoidInstances>(inner: K): Setoid<ReadonlyArray<SetoidInstances[K]>>;
        <A>(inner: Setoid<A>): Setoid<ReadonlyArray<A>>;
    };
    // Records need one comparison per field (fp-ts Eq.struct). Strict: the
    // compared objects must have exactly the declared fields. Same fields in
    // any order return the same instance (internal normalized cache), but the
    // instance is NOT registered — factory is the only entrance. There is no
    // Ord.Struct — record ordering has no canonical answer.
    readonly Struct: (
        fields: Record<string, string | Setoid<unknown>>
    ) => Setoid<Record<string, unknown>>;
};
export declare const Setoid: SetoidStatic;

export interface OrdStatic {
    readonly lookup: <K extends keyof OrdInstances>(
        name: K
    ) => Ord<OrdInstances[K]>;
    // Lexicographic. Ord.lookup('array(number)') resolves lazily too.
    readonly Array: {
        <K extends keyof OrdInstances>(inner: K): Ord<ReadonlyArray<OrdInstances[K]>>;
        <A>(inner: Ord<A>): Ord<ReadonlyArray<A>>;
    };
};
export declare const Ord: OrdStatic;

export interface SemigroupStatic {
    readonly lookup: <K extends keyof SemigroupInstances>(
        name: K
    ) => Semigroup<SemigroupInstances[K]>;
};
export declare const Semigroup: SemigroupStatic;

export interface MonoidStatic {
    readonly lookup: <K extends keyof MonoidInstances>(
        name: K
    ) => Monoid<MonoidInstances[K]>;
};
export declare const Monoid: MonoidStatic;

export declare const Group: {
    readonly lookup: <K extends keyof GroupInstances>(
        name: K
    ) => Group<GroupInstances[K]>;
};
