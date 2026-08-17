/**
 * Free<F, A> — free monad over a command Functor F.
 *
 * Runtime uses Pure/Impure subclasses and several internal command
 * Functors (GetF, PutF, AskF, TellF, …) for transformers. The TS surface
 * here focuses on the user-facing API:
 *   - construction: `Free.of / Free.pure / Free.liftF`
 *   - interpretation: `Free.runSync / Free.runAsync / Free.runWithTask`
 *   - trampolining: `Free.Thunk`, `Free.trampoline`
 *
 * Runner-typing caveat: the Free runner's return is cycled back through
 * `gen.next()`, so it may be a plain value OR another Free to continue.
 * Precisely modelling that return requires conditional types that don't
 * pay their weight here — runners accept `unknown` and returns are typed
 * loosely. Users who need stricter typing wrap a thin helper.
 */

import type { TypeLambda, Kind } from "../HKT";

// ── Type ─────────────────────────────────────────────────────────────
export interface Free<F extends TypeLambda, A> {
    readonly _typeName: "Free";
    map<B>(f: (a: A) => B): Free<F, B>;
    chain<B>(f: (a: A) => Free<F, B>): Free<F, B>;
}

// ── Subtypes for narrowing via Free.isPure / Free.isImpure ───────────
// Pure carries a concrete value; Impure carries a command wrapped in the
// command Functor F. Declared as standalone interfaces so the type
// guards narrow cleanly without worrying about Free's invariant F slot.
export interface Pure<A> {
    readonly _typeName: "Free";
    readonly value: A;
}

export interface Impure<F extends TypeLambda> {
    readonly _typeName: "Free";
    readonly functor: unknown;
}

// ── TypeLambda ───────────────────────────────────────────────────────
export interface FreeTypeLambda<F extends TypeLambda> extends TypeLambda {
    readonly type: Free<F, this["Target"]>;
}

// ── Thunk — Functor for trampolining ─────────────────────────────────
export interface Thunk<A> {
    map<B>(g: (a: A) => B): Thunk<B>;
    run(): A;
}

// ── Value namespace ──────────────────────────────────────────────────
// Free.api 의 api — 각 명령 이름이 노드 생성 함수, interpreter 가 해석기 문.
// 브랜드는 선언 전용(런타임에는 없는 필드) — 런타임 브랜드는 모듈 사설 WeakMap 이다.
// 구조적 { run } 이 Free.interpreters 인자로 정적 통과하는 것을 막아 정적·런타임 계약을 맞춘다.
declare const FreeApiInterpreterBrand: unique symbol;
// start 의 손잡이 — cancel 은 다음 명령 경계에서 발효(협조적). 취소된 실행은
// message 'Free.api.run: cancelled' + cancelled === true 표식의 거부로 도착한다.
export interface FreeApiRunHandle {
    readonly promise: Promise<unknown>;
    cancel(): void;
}
export interface FreeApiInterpreter {
    readonly [FreeApiInterpreterBrand]: true;
    run(program: Free<TypeLambda, unknown>): Promise<unknown>;
    start(program: Free<TypeLambda, unknown>): FreeApiRunHandle;
}
export type FreeApi<N extends string> = { [K in N]: (...args: unknown[]) => Free<TypeLambda, unknown> } & {
    interpreter(handlers: { [K in N]: (...args: never[]) => unknown }): FreeApiInterpreter;
};

export declare const Free: {
    readonly of: <F extends TypeLambda, A>(a: A) => Free<F, A>;
    readonly pure: <F extends TypeLambda, A>(a: A) => Free<F, A>;
    readonly impure: <F extends TypeLambda>(
        functor: Kind<F, never, never, never, Free<F, unknown>>
    ) => Free<F, unknown>;

    readonly isPure: <A = unknown>(x: unknown) => x is Pure<A>;
    readonly isImpure: <F extends TypeLambda = TypeLambda>(
        x: unknown
    ) => x is Impure<F>;
    readonly isFree: (x: unknown) => x is Free<TypeLambda, unknown>;

    readonly liftF: <F extends TypeLambda, A>(
        command: Kind<F, never, never, never, A>
    ) => Free<F, A>;

    // Runners. `runner` interprets a single command and returns the next
    // step (plain value, or another Free to continue).
    readonly runSync: (
        runner: (command: unknown) => unknown
    ) => <F extends TypeLambda, A>(target: Free<F, A>) => A;
    readonly runAsync: (
        runner: (command: unknown) => unknown | Promise<unknown>
    ) => <F extends TypeLambda, A>(target: Free<F, A>) => Promise<A>;
    readonly runWithTask: (
        runner: (command: unknown) => {
            fork(onRej: (e: unknown) => void, onRes: (v: unknown) => void): void;
        }
    ) => <F extends TypeLambda, A>(program: Free<F, A>) => Promise<A>;

    readonly Thunk: {
        new <A>(f: () => A): Thunk<A>;
        of<A>(f: () => A): Thunk<A>;
        done<A>(value: A): Free<TypeLambda, A>;
        suspend<A>(f: () => A): Free<TypeLambda, A>;
    };
    readonly trampoline: <A>(target: Free<TypeLambda, A>) => A;

    // Free.api — 어휘만 선언하고 해석기는 별도로 몇 벌이든. 명령 이름은 리터럴로
    // 보존되어 핸들러 누락·오타를 TS 가 잡는다. 인자·결과는 unknown 수준이다 —
    // 이름 문자열만으로는 인자 타입을 알 수 없다(더 좁히려면 명령별 스펙이 필요한데
    // 그것은 이 설계가 의도적으로 버린 payload 빌더다).
    readonly api: <Names extends readonly string[]>(
        ...names: Names
    ) => FreeApi<Names[number]>;

    // Free.interpreters — 여러 api 의 해석기를 하나로. 명령의 api 표식이 자기 명부를 고른다.
    readonly interpreters: (...its: readonly FreeApiInterpreter[]) => FreeApiInterpreter;

    // Static Land surface
    readonly map: <F extends TypeLambda, A, B>(
        f: (a: A) => B,
        fa: Free<F, A>
    ) => Free<F, B>;
    readonly ap: <F extends TypeLambda, A, B>(
        ff: Free<F, (a: A) => B>,
        fa: Free<F, A>
    ) => Free<F, B>;
    readonly chain: <F extends TypeLambda, A, B>(
        f: (a: A) => Free<F, B>,
        fa: Free<F, A>
    ) => Free<F, B>;

    readonly pipeK: {
        <F extends TypeLambda, A, B>(
            f1: (a: A) => Free<F, B>
        ): (a: A) => Free<F, B>;
        <F extends TypeLambda, A, B, C>(
            f1: (a: A) => Free<F, B>,
            f2: (b: B) => Free<F, C>
        ): (a: A) => Free<F, C>;
        <F extends TypeLambda, A, B, C, D>(
            f1: (a: A) => Free<F, B>,
            f2: (b: B) => Free<F, C>,
            f3: (c: C) => Free<F, D>
        ): (a: A) => Free<F, D>;
    };
    readonly composeK: {
        <F extends TypeLambda, A, B>(
            f1: (a: A) => Free<F, B>
        ): (a: A) => Free<F, B>;
        <F extends TypeLambda, A, B, C>(
            f2: (b: B) => Free<F, C>,
            f1: (a: A) => Free<F, B>
        ): (a: A) => Free<F, C>;
    };

    readonly lift: <Args extends readonly unknown[], R>(
        f: (...args: Args) => R
    ) => <F extends TypeLambda>(
        ...wrapped: { [K in keyof Args]: Free<F, Args[K]> }
    ) => Free<F, R>;
};

// Top-level re-export — `trampoline` is exposed both as `Free.trampoline`
// and as a standalone utility to match the runtime default export.
export declare const trampoline: <A>(target: Free<TypeLambda, A>) => A;

// ── Register 'free' on type-class runtime registries ─────────────────
// F parameter of FreeTypeLambda is left abstract (TypeLambda). Precise F
// tracking flows through direct `Free.map` / `Free.chain` calls; the
// string-dispatch surface loses it by construction.
declare module "../TypeClasses" {
    interface FunctorInstances     { readonly free: FreeTypeLambda<TypeLambda> }
    interface ApplyInstances       { readonly free: FreeTypeLambda<TypeLambda> }
    interface ApplicativeInstances { readonly free: FreeTypeLambda<TypeLambda> }
    interface ChainInstances       { readonly free: FreeTypeLambda<TypeLambda> }
    interface MonadInstances       { readonly free: FreeTypeLambda<TypeLambda> }
}
