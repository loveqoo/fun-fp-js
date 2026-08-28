/**
 * Task — lazy async computation. Promise-like but deferred until `fork`.
 *
 * Slot assignment:
 *   Target — A (success channel)
 * Rejection channel is NOT typed (runtime accepts any thrown value);
 * caught errors surface as `unknown` at the TS boundary.
 * For typed errors, compose with EitherT(Task).
 *
 * Owns: the `Task<A>` interface, `TaskTypeLambda`, the runtime `const Task`
 * namespace, and the runtime key `'task'` on the 6 type-class registries
 * Task implements (Functor / Apply / Applicative / Alt / Chain / Monad).
 *
 * Deferred (added in follow-ups):
 *   filter (needs Filterable class), chainRec, pipeK, composeK,
 *   Semigroupoid / Category
 */

import type { TypeLambda } from "../HKT";
import type { Either } from "./Either";
import type { ChainRecStep } from "../TypeClasses";

// ── Type ─────────────────────────────────────────────────────────────
export interface Task<A> {
    readonly _typeName: "Task";
    // Execute the deferred computation. At-most-once settle guarded by
    // the runtime — multiple reject/resolve calls are no-ops.
    fork(
        onReject: (error: unknown) => void,
        onResolve: (a: A) => void
    ): void;
    map<B>(f: (a: A) => B): Task<B>;
    chain<B>(f: (a: A) => Task<B>): Task<B>;
    catchError(handler: (e: unknown) => Task<A>): Task<A>;
}

// ── TypeLambda ───────────────────────────────────────────────────────
export interface TaskTypeLambda extends TypeLambda {
    readonly type: Task<this["Target"]>;
}

// ── Value namespace ──────────────────────────────────────────────────
export declare const Task: {
    // Note: there is no `new Task(computation)` in the public TS surface.
    // Users construct via `Task.of` / `Task.rejected` / `Task.fromPromise`
    // or by composing existing Tasks. The class constructor exists in the
    // JS runtime but is treated as an implementation detail in TS.

    // Constructors
    readonly of: <A>(a: A) => Task<A>;
    readonly rejected: (e: unknown) => Task<never>;

    // Predicate
    readonly isTask: (x: unknown) => x is Task<unknown>;

    // Execute and fold — convenience alias for `task.fork(...)`.
    readonly fold: <A>(
        onRejected: (e: unknown) => void,
        onResolved: (a: A) => void,
        task: Task<A>
    ) => void;

    // Promise interop — `promiseFn` may return either a Promise or a raw
    // value. Thrown errors during the call become the rejection channel.
    readonly fromPromise: <Args extends readonly unknown[], T>(
        promiseFn: (...args: Args) => T | PromiseLike<T>
    ) => (...args: Args) => Task<Awaited<T>>;

    // Either interop — Right → resolved Task, Left → rejected Task.
    readonly fromEither: <E, A>(e: Either<E, A>) => Task<A>;

    // Parallel execution: `all` waits for every task, `race` picks first.
    readonly all: <T extends ReadonlyArray<Task<unknown>>>(
        tasks: T
    ) => Task<{
        -readonly [K in keyof T]: T[K] extends Task<infer U> ? U : never;
    }>;
    readonly race: <T extends ReadonlyArray<Task<unknown>>>(
        tasks: T
    ) => Task<T[number] extends Task<infer U> ? U : never>;

    // Error handling — hands rejection to `handler` which returns a fresh Task.
    readonly catchError: <A>(
        handler: (e: unknown) => Task<A>,
        task: Task<A>
    ) => Task<A>;

    // Static Land methods
    readonly map: <A, B>(f: (a: A) => B, t: Task<A>) => Task<B>;
    readonly ap: <A, B>(
        tf: Task<(a: A) => B>,
        ta: Task<A>
    ) => Task<B>;
    readonly chain: <A, B>(
        f: (a: A) => Task<B>,
        t: Task<A>
    ) => Task<B>;
    readonly alt: <A>(a: Task<A>, b: Task<A>) => Task<A>;

    // Lifts an N-ary plain function into Task — liftA_n form.
    // Takes N Task-wrapped args and returns Task<R>. Runtime runCatch
    // wrapper: on throw during lift application, result falls back to
    // `Task.rejected(error)`.
    readonly lift: <Args extends readonly unknown[], R>(
        f: (...args: Args) => R
    ) => (
        ...wrapped: { [K in keyof Args]: Task<Args[K]> }
    ) => Task<R>;

    // Filterable.filter: predicate-true keeps resolved value; false triggers
    // rejection with a library-chosen error. Typical usage is a type-guard.
    readonly filter: {
        <A, B extends A>(pred: (a: A) => a is B, t: Task<A>): Task<B>;
        <A>(pred: (a: A) => boolean, t: Task<A>): Task<A>;
    };

    readonly chainRec: <A, B>(
        f: (
            next: (a: A) => ChainRecStep<A, B>,
            done: (b: B) => ChainRecStep<A, B>,
            input: A
        ) => Task<ChainRecStep<A, B>>,
        init: A
    ) => Task<B>;

    readonly pipeK: {
        <A, B>(f1: (a: A) => Task<B>): (a: A) => Task<B>;
        <A, B, C>(
            f1: (a: A) => Task<B>,
            f2: (b: B) => Task<C>
        ): (a: A) => Task<C>;
        <A, B, C, D>(
            f1: (a: A) => Task<B>,
            f2: (b: B) => Task<C>,
            f3: (c: C) => Task<D>
        ): (a: A) => Task<D>;
        <A, B, C, D, E>(
            f1: (a: A) => Task<B>,
            f2: (b: B) => Task<C>,
            f3: (c: C) => Task<D>,
            f4: (d: D) => Task<E>
        ): (a: A) => Task<E>;
    };
    readonly composeK: {
        <A, B>(f1: (a: A) => Task<B>): (a: A) => Task<B>;
        <A, B, C>(
            f2: (b: B) => Task<C>,
            f1: (a: A) => Task<B>
        ): (a: A) => Task<C>;
        <A, B, C, D>(
            f3: (c: C) => Task<D>,
            f2: (b: B) => Task<C>,
            f1: (a: A) => Task<B>
        ): (a: A) => Task<D>;
    };
};

// ── Register 'task' on the type-class runtime registries ─────────────
// Task runtime has: Functor, Apply, Applicative, Alt, Chain, ChainRec,
// Monad, Filterable. Not Plus/Alternative (no zero); not Foldable/
// Traversable (async values cannot be folded without execution).
declare module "../TypeClasses" {
    interface FunctorInstances     { readonly task: TaskTypeLambda }
    interface ApplyInstances       { readonly task: TaskTypeLambda }
    interface ApplicativeInstances { readonly task: TaskTypeLambda }
    interface AltInstances         { readonly task: TaskTypeLambda }
    interface ChainInstances       { readonly task: TaskTypeLambda }
    interface ChainRecInstances    { readonly task: TaskTypeLambda }
    interface MonadInstances       { readonly task: TaskTypeLambda }
    interface MonadErrorInstances  { readonly task: TaskTypeLambda }
}

// ─── Kleisli (Semigroupoid / Category 'task') ────────────────────────
// a => Task<b> 의 합성.
export interface TaskKleisliTypeLambda extends TypeLambda {
    readonly type: (a: this["In"]) => Task<this["Target"]>;
}
declare module "../TypeClasses" {
    interface SemigroupoidInstances { readonly task: TaskKleisliTypeLambda }
    interface CategoryInstances     { readonly task: TaskKleisliTypeLambda }
}
