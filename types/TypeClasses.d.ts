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
import type { ConstTypeLambda, ForgetTypeLambda } from "./TypeLambdas";
import type { WriterTypeLambda, WriterWithTypeLambda } from "./data/Writer";

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

// ─── MonadError (명세 밖 — 실패를 일급으로) ─────────────────────────
// 한계: 클래스 수준 제네릭은 인스턴스별 에러 채널 슬롯을 모른다. raiseError 의 에러
// 채널(Out2)은 인자 타입을 따르고(등록된 either·task 둘 다 그 슬롯이 에러 채널이다),
// 값 슬롯은 문맥이 있으면 추론, 없으면 unknown 으로 남는다(never 오염 아님 — 명시
// 지정으로 좁혀라). 키별 완전 타이핑은 docs/internals.md#monaderror 참조.
export interface MonadError<F extends TypeLambda> extends Monad<F> {
    raiseError<E, A = unknown, In = unknown, Out1 = unknown>(
        e: E
    ): Kind<F, In, E, Out1, A>;
    handleError<In, Out2, Out1, A>(
        f: (e: unknown) => Kind<F, In, Out2, Out1, A>,
        fa: Kind<F, In, Out2, Out1, A>
    ): Kind<F, In, Out2, Out1, A>;
}

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

// Out of spec — folding for containers that cannot be empty: a Semigroup
// suffices because there is no empty case to answer for.
export interface Reducible<F extends TypeLambda> extends Foldable<F> {
    readonly reduceLeft: <In, Out2, Out1, A>(
        f: (acc: A, a: A) => A,
        fa: Kind<F, In, Out2, Out1, A>
    ) => A;
    readonly reduceMap: <In, Out2, Out1, A, B>(
        semigroup: Semigroup<B>,
        f: (a: A) => B,
        fa: Kind<F, In, Out2, Out1, A>
    ) => B;
}

// ─── Traversable ────────────────────────────────────────────────────
// `G` is the Applicative being distributed through; `F` is the outer
// Traversable structure. Slot threading is preserved on both.
// Uncurried 3-arg like the runtime — `traverse(applicative)` alone is an error.
export interface Traversable<F extends TypeLambda>
    extends Functor<F>, Foldable<F> {
    readonly traverse: <
        G extends TypeLambda, A, B, GIn, GOut2, GOut1, FIn, FOut2, FOut1
    >(
        applicative: Applicative<G>,
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
    // left transforms the Left slot (runtime: Left(3) → Left(6)); right the Right slot.
    readonly left: <In1, Out2, Out1, T1, C>(
        pab: Kind<F, In1, Out2, Out1, T1>
    ) => Kind<F, Either<In1, C>, Out2, Out1, Either<T1, C>>;
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
export interface MonadErrorInstances {}
export interface AltInstances {}
export interface PlusInstances {}
export interface AlternativeInstances {}
export interface FoldableInstances {}
export interface ReducibleInstances {}
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
// `.types` 는 공개 레지스트리다(소유자 판정 2026-08-29) — 문서·테스트가
// Monoid.types.ArrayMonoid 처럼 직접 접근한다. 값은 그 클래스의 인스턴스들이며,
// 등록 안 된 키는 런타임에서 undefined 다 — 그래서 값 타입에 | undefined 가 붙는다.
// Signature mirrors the runtime: `TypeClass.lookup('name')` returns the
// instance for that name. The TS side resolves via the *Instances maps.
// Type classes have no `of` — that name means value injection (`Maybe.of(1)`,
// and the `of` on an Applicative *instance*).

export declare const Functor: {
    readonly types: Record<string, Functor<any> | undefined>;
    // 직접 생성도 공개 API 다(docs/internals.md 의 new Functor 예제). 즉석 모양은
    // TypeLambda 가 없으므로 느슨하게 — 정밀한 F 가 필요하면 타입 인자로 지정하라.
    new <F extends TypeLambda = TypeLambda>(
        map: (f: (a: any) => any, fa: any) => any,
        type: string
    ): Functor<F>;
    readonly lookup: {
        <K extends keyof FunctorInstances>(name: K): Functor<FunctorInstances[K]>;
        // Writer 팩토리가 등록하는 키 — **팩토리 호출 후에만** 런타임에 존재한다.
        <K extends keyof MonoidInstances>(
            name: `writer(${K})`
        ): Functor<WriterWithTypeLambda<MonoidInstances[K]>>;
    };
};

export declare const Apply: {
    readonly types: Record<string, Apply<any> | undefined>;
    new <F extends TypeLambda = TypeLambda>(
        functor: Functor<F>,
        ap: (ff: any, fa: any) => any,
        type: string
    ): Apply<F>;
    readonly lookup: {
        <K extends keyof ApplyInstances>(name: K): Apply<ApplyInstances[K]>;
        // Writer 팩토리가 등록하는 키 — **팩토리 호출 후에만** 런타임에 존재한다.
        <K extends keyof MonoidInstances>(
            name: `writer(${K})`
        ): Apply<WriterWithTypeLambda<MonoidInstances[K]>>;
    };
};

// Const 인스턴스의 실제 표면 — Applicative 에 wrap/unwrap 이 붙는다(런타임 실측,
// docs/internals.md 의 정식 사용법). 캐리어는 { value } 다.
// R 은 고른 monoid 의 캐리어다 — wrap 이 R 을 요구하므로 Const('number').wrap('oops')
// 는 컴파일에서 막힌다(런타임에서는 뒤의 ap/concat 이 던지는 실수).
export interface ConstApplicative<R> extends Applicative<ConstTypeLambda> {
    readonly wrap: (value: R) => { readonly value: R };
    readonly unwrap: (c: { readonly value: R }) => R;
}

export declare const Applicative: {
    readonly types: Record<string, Applicative<any> | undefined>;
    readonly lookup: {
        <K extends keyof ApplicativeInstances>(
            name: K
        ): Applicative<ApplicativeInstances[K]>;
        // Const 는 키로 켜면 const(<키>) 로 등록된다 — lookup 으로도 같은 인스턴스가 나온다.
        <K extends keyof MonoidInstances>(
            name: `const(${K})`
        ): ConstApplicative<MonoidInstances[K]>;
        (name: `const(${string})`): ConstApplicative<unknown>;
        // Writer 팩토리가 등록하는 키 — **팩토리 호출 후에만** 런타임에 존재한다.
        <K extends keyof MonoidInstances>(
            name: `writer(${K})`
        ): Applicative<WriterWithTypeLambda<MonoidInstances[K]>>;
    };
    // Const<r> — 값을 버리고 monoid 로 r 만 모은다. traverse 를 "접기" 로 쓸 때 넘긴다.
    // Monoid.Maybe(innerSG) 와 같은 모양: 키면 const(<키>) 로 등록하고, 인스턴스면 캐시한다.
    readonly Const: {
        <K extends keyof MonoidInstances>(monoid: K): ConstApplicative<MonoidInstances[K]>;
        <R>(monoid: Monoid<R>): ConstApplicative<R>;
    };
    // Writer<w> — 등록된 writer 는 Array Monoid 전용이라, 다른 Monoid 는 여기서 만든다.
    readonly Writer: {
        <K extends keyof MonoidInstances>(
            monoid: K
        ): Applicative<WriterWithTypeLambda<MonoidInstances[K]>>;
        <R>(monoid: Monoid<R>): Applicative<WriterWithTypeLambda<R>>;
    };
};

export declare const Chain: {
    readonly types: Record<string, Chain<any> | undefined>;
    readonly lookup: {
        <K extends keyof ChainInstances>(name: K): Chain<ChainInstances[K]>;
        // Writer 팩토리가 등록하는 키 — **팩토리 호출 후에만** 런타임에 존재한다.
        <K extends keyof MonoidInstances>(
            name: `writer(${K})`
        ): Chain<WriterWithTypeLambda<MonoidInstances[K]>>;
    };
};

export declare const Monad: {
    readonly types: Record<string, Monad<any> | undefined>;
    readonly lookup: {
        <K extends keyof MonadInstances>(name: K): Monad<MonadInstances[K]>;
        // Writer 팩토리가 등록하는 키 — **팩토리 호출 후에만** 런타임에 존재한다.
        <K extends keyof MonoidInstances>(
            name: `writer(${K})`
        ): Monad<WriterWithTypeLambda<MonoidInstances[K]>>;
    };
    // Writer<w> — 등록된 writer 는 Array Monoid 전용이라, 다른 Monoid 는 여기서 만든다.
    readonly Writer: {
        <K extends keyof MonoidInstances>(
            monoid: K
        ): Monad<WriterWithTypeLambda<MonoidInstances[K]>>;
        <R>(monoid: Monoid<R>): Monad<WriterWithTypeLambda<R>>;
    };
};

export declare const MonadError: {
    readonly types: Record<string, MonadError<any> | undefined>;
    readonly lookup: <K extends keyof MonadErrorInstances>(
        name: K
    ) => MonadError<MonadErrorInstances[K]>;
};

export declare const Alt: {
    readonly types: Record<string, Alt<any> | undefined>;
    readonly lookup: <K extends keyof AltInstances>(
        name: K
    ) => Alt<AltInstances[K]>;
};

export declare const Plus: {
    readonly types: Record<string, Plus<any> | undefined>;
    readonly lookup: <K extends keyof PlusInstances>(
        name: K
    ) => Plus<PlusInstances[K]>;
};

export declare const Alternative: {
    readonly types: Record<string, Alternative<any> | undefined>;
    readonly lookup: <K extends keyof AlternativeInstances>(
        name: K
    ) => Alternative<AlternativeInstances[K]>;
};

export declare const Foldable: {
    readonly types: Record<string, Foldable<any> | undefined>;
    readonly lookup: <K extends keyof FoldableInstances>(
        name: K
    ) => Foldable<FoldableInstances[K]>;
};

export declare const Reducible: {
    readonly types: Record<string, Reducible<any> | undefined>;
    readonly lookup: <K extends keyof ReducibleInstances>(
        name: K
    ) => Reducible<ReducibleInstances[K]>;
};

export declare const Traversable: {
    readonly types: Record<string, Traversable<any> | undefined>;
    readonly lookup: <K extends keyof TraversableInstances>(
        name: K
    ) => Traversable<TraversableInstances[K]>;
};

export declare const Bifunctor: {
    readonly types: Record<string, Bifunctor<any> | undefined>;
    readonly lookup: <K extends keyof BifunctorInstances>(
        name: K
    ) => Bifunctor<BifunctorInstances[K]>;
};

export declare const Contravariant: {
    readonly types: Record<string, Contravariant<any> | undefined>;
    readonly lookup: <K extends keyof ContravariantInstances>(
        name: K
    ) => Contravariant<ContravariantInstances[K]>;
};

export declare const Profunctor: {
    readonly types: Record<string, Profunctor<any> | undefined>;
    readonly lookup: {
        <K extends keyof ProfunctorInstances>(name: K): Profunctor<ProfunctorInstances[K]>;
        // Forget 팩토리가 등록하는 키 — **팩토리 호출 후에만** 런타임에 존재한다.
        <K extends keyof MonoidInstances>(
            name: `forget(${K})`
        ): ForgetWander<MonoidInstances[K]>;
    };
};

export declare const Strong: {
    readonly types: Record<string, Strong<any> | undefined>;
    readonly lookup: {
        <K extends keyof StrongInstances>(name: K): Strong<StrongInstances[K]>;
        // Forget 팩토리가 등록하는 키 — **팩토리 호출 후에만** 런타임에 존재한다.
        <K extends keyof MonoidInstances>(
            name: `forget(${K})`
        ): ForgetWander<MonoidInstances[K]>;
    };
};

export declare const Choice: {
    readonly types: Record<string, Choice<any> | undefined>;
    readonly lookup: {
        <K extends keyof ChoiceInstances>(name: K): Choice<ChoiceInstances[K]>;
        // Forget 팩토리가 등록하는 키 — **팩토리 호출 후에만** 런타임에 존재한다.
        <K extends keyof MonoidInstances>(
            name: `forget(${K})`
        ): ForgetWander<MonoidInstances[K]>;
    };
};

// Forget<r> 인스턴스의 실제 표면 — 완전한 Wander 에 wrap/unwrap 이 붙는다(런타임 실측).
// 캐리어는 { run: a -> r } 이다. 팩토리로 켜면 forget(<키>) 로 등록되어 lookup 도 된다
// (직전 회차의 "lookup 키 없음" 판정은 팩토리 호출 전 실측 — 호출 후 기준으로 정정).
export interface Forget<R> {
    readonly run: (a: any) => R;
}
// R 은 고른 monoid 의 캐리어다 — wrap 의 run 은 R 을 돌려줘야 한다.
export interface ForgetWander<R> extends Wander<ForgetTypeLambda> {
    readonly wrap: (run: (a: any) => R) => Forget<R>;
    readonly unwrap: (p: Forget<R>) => (a: any) => R;
}

export declare const Wander: {
    readonly types: Record<string, Wander<any> | undefined>;
    readonly lookup: {
        <K extends keyof WanderInstances>(name: K): Wander<WanderInstances[K]>;
        // Forget 팩토리가 등록하는 키 — **팩토리 호출 후에만** 런타임에 존재한다
        // (호출 전 lookup 은 unsupported key 로 던진다, 실측 2026-08-29).
        <K extends keyof MonoidInstances>(
            name: `forget(${K})`
        ): ForgetWander<MonoidInstances[K]>;
        (name: `forget(${string})`): ForgetWander<unknown>;
    };
    // Forget<r> — 접기 방향만 남긴 Profunctor. Applicative.Const 와 같은 모양의 문:
    // 키로 켜면 forget(<키>) 로 등록되어 lookup 으로도 같은 인스턴스가 나온다.
    readonly Forget: {
        <K extends keyof MonoidInstances>(monoid: K): ForgetWander<MonoidInstances[K]>;
        <R>(monoid: Monoid<R>): ForgetWander<R>;
    };
};

export declare const Filterable: {
    readonly types: Record<string, Filterable<any> | undefined>;
    readonly lookup: <K extends keyof FilterableInstances>(
        name: K
    ) => Filterable<FilterableInstances[K]>;
};

export declare const ChainRec: {
    readonly types: Record<string, ChainRec<any> | undefined>;
    readonly lookup: <K extends keyof ChainRecInstances>(
        name: K
    ) => ChainRec<ChainRecInstances[K]>;
    // Step constructors — used by chainRec callbacks.
    readonly next: <A>(a: A) => ChainRecStep<A, never>;
    readonly done: <B>(b: B) => ChainRecStep<never, B>;
};

export declare const Extend: {
    readonly types: Record<string, Extend<any> | undefined>;
    readonly lookup: <K extends keyof ExtendInstances>(
        name: K
    ) => Extend<ExtendInstances[K]>;
};

export declare const Comonad: {
    readonly types: Record<string, Comonad<any> | undefined>;
    readonly lookup: <K extends keyof ComonadInstances>(
        name: K
    ) => Comonad<ComonadInstances[K]>;
};

export declare const Semigroupoid: {
    readonly types: Record<string, Semigroupoid<any> | undefined>;
    new <F extends TypeLambda = TypeLambda>(
        compose: (bc: any, ab: any) => any,
        type: string
    ): Semigroupoid<F>;
    readonly lookup: <K extends keyof SemigroupoidInstances>(
        name: K
    ) => Semigroupoid<SemigroupoidInstances[K]>;
};

export declare const Category: {
    readonly types: Record<string, Category<any> | undefined>;
    // id 는 항등 사상 자체다(썽크 아님) — 런타임이 () => id 로 감싸 category.id() 가
    // 사상을 돌려준다. 썽크를 넘기면 id() 가 사상이 아니라 썽크가 된다(실측 NaN).
    new <F extends TypeLambda = TypeLambda>(
        semigroupoid: Semigroupoid<F>,
        id: (a: any) => any,
        type: string
    ): Category<F>;
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
    readonly types: Record<string, Setoid<any> | undefined>;
    // 런타임 클래스는 직접 생성이 공개 API 다(docs/Setoid.md 의 new Setoid 예제).
    // registry 인자(내부 등록용)는 선언에서 뺀다 — 등록은 라이브러리 몫이다.
    new <A>(equals: (a: A, b: A) => boolean, type: string): Setoid<A>;
    // 합성 키는 resolver 가 즉석 해석한다 — 'array(number)'·'maybe(number)'·
    // 'either(string,number)' 전부 런타임 실측. 템플릿 리터럴이 안쪽 키까지 좁히고,
    // 중첩 키('maybe(array(number))' 등)는 바깥층만 정밀·안쪽은 unknown 으로 받는다
    // (완전 재귀 파서는 비용 대비 과함 — 소유자 판정 2026-08-29).
    readonly lookup: {
        <K extends keyof SetoidInstances>(name: K): Setoid<SetoidInstances[K]>;
        <K extends keyof SetoidInstances>(
            name: `array(${K})`
        ): Setoid<ReadonlyArray<SetoidInstances[K]>>;
        <K extends keyof SetoidInstances>(
            name: `maybe(${K})`
        ): Setoid<Maybe<SetoidInstances[K]>>;
        <K1 extends keyof SetoidInstances, K2 extends keyof SetoidInstances>(
            name: `either(${K1},${K2})`
        ): Setoid<Either<SetoidInstances[K1], SetoidInstances[K2]>>;
        (name: `array(${string})`): Setoid<ReadonlyArray<unknown>>;
        (name: `maybe(${string})`): Setoid<Maybe<unknown>>;
        (name: `either(${string})`): Setoid<Either<unknown, unknown>>;
    };
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
}
export declare const Setoid: SetoidStatic;

export interface OrdStatic {
    readonly types: Record<string, Ord<any> | undefined>;
    readonly lookup: {
        <K extends keyof OrdInstances>(name: K): Ord<OrdInstances[K]>;
        // 배열은 사전식, maybe 는 Nothing 최소 — 런타임 resolver 가 즉석 해석한다.
        <K extends keyof OrdInstances>(
            name: `array(${K})`
        ): Ord<ReadonlyArray<OrdInstances[K]>>;
        <K extends keyof OrdInstances>(
            name: `maybe(${K})`
        ): Ord<Maybe<OrdInstances[K]>>;
        (name: `array(${string})`): Ord<ReadonlyArray<unknown>>;
        (name: `maybe(${string})`): Ord<Maybe<unknown>>;
    };
    // Lexicographic. Ord.lookup('array(number)') resolves lazily too.
    readonly Array: {
        <K extends keyof OrdInstances>(inner: K): Ord<ReadonlyArray<OrdInstances[K]>>;
        <A>(inner: Ord<A>): Ord<ReadonlyArray<A>>;
    };
}
export declare const Ord: OrdStatic;

export interface SemigroupStatic {
    readonly types: Record<string, Semigroup<any> | undefined>;
    new <A>(concat: (a: A, b: A) => A, type: string): Semigroup<A>;
    readonly lookup: {
        <K extends keyof SemigroupInstances>(name: K): Semigroup<SemigroupInstances[K]>;
        // 합성 키('maybe(number)'·'either(string,number)')는 resolver 가 즉석 해석 —
        // 중첩('maybe(maybe(array))')은 바깥층만 정밀하게 받는다.
        <K extends keyof SemigroupInstances>(
            name: `maybe(${K})`
        ): Semigroup<Maybe<SemigroupInstances[K]>>;
        <K1 extends keyof SemigroupInstances, K2 extends keyof SemigroupInstances>(
            name: `either(${K1},${K2})`
        ): Semigroup<Either<SemigroupInstances[K1], SemigroupInstances[K2]>>;
        (name: `maybe(${string})`): Semigroup<Maybe<unknown>>;
        (name: `either(${string})`): Semigroup<Either<unknown, unknown>>;
    };
}
export declare const Semigroup: SemigroupStatic;

export interface MonoidStatic {
    readonly types: Record<string, Monoid<any> | undefined>;
    new <A>(semigroup: Semigroup<A>, empty: () => A, type: string): Monoid<A>;
    readonly lookup: {
        <K extends keyof MonoidInstances>(name: K): Monoid<MonoidInstances[K]>;
        // Maybe 가 항등원(Nothing)을 대므로 안쪽은 Semigroup 키면 된다 —
        // 'maybe(first)' 가 성립하는 이유(런타임 실측).
        <K extends keyof SemigroupInstances>(
            name: `maybe(${K})`
        ): Monoid<Maybe<SemigroupInstances[K]>>;
        (name: `maybe(${string})`): Monoid<Maybe<unknown>>;
    };
}
export declare const Monoid: MonoidStatic;

export declare const Group: {
    readonly types: Record<string, Group<any> | undefined>;
    new <A>(monoid: Monoid<A>, invert: (a: A) => A, type: string): Group<A>;
    readonly lookup: <K extends keyof GroupInstances>(
        name: K
    ) => Group<GroupInstances[K]>;
};
