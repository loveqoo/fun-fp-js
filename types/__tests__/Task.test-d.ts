/**
 * Type-level behavior tests for Task.
 */

import type { Kind } from "../HKT";
import { Task } from "../data/Task";
import type { TaskTypeLambda } from "../data/Task";
import { Either } from "../data/Either";
import { Functor, Monad, Applicative } from "../TypeClasses";
import type { Equals, Expect, AssignableTo } from "./_test-utils";


// ── 1. Constructors ───────────────────────────────────────────────────
const t1 = Task.of(42);                     // Task<number>
const tr = Task.rejected(new Error("x"));   // Task<never>

type _1a = Expect<Equals<typeof t1, Task<number>>>;
type _1b = Expect<Equals<typeof tr, Task<never>>>;

// ── 2. map / chain preserve Target threading ──────────────────────────
const t2 = Task.map((n: number) => n.toString(), t1);
type _2a = Expect<Equals<typeof t2, Task<string>>>;

const t2b = Task.chain((n: number) => Task.of(n + 1), t1);
type _2b = Expect<Equals<typeof t2b, Task<number>>>;

// ── 3. Instance map / chain ───────────────────────────────────────────
const t3 = t1.map((n) => n * 2);
type _3a = Expect<Equals<typeof t3, Task<number>>>;
const t3b = t1.chain((n) => Task.of(String(n)));
type _3b = Expect<Equals<typeof t3b, Task<string>>>;

// ── 4. fork is void and error is unknown ──────────────────────────────
const forkResult = t1.fork(
    (e: unknown) => {
        if (e instanceof Error) console.error(e.message);
    },
    (a: number) => console.log(a)
);
type _4 = Expect<Equals<typeof forkResult, void>>;

// ── 5. Functor.lookup('task') → Functor<TaskTypeLambda> ───────────────────
const fTask = Functor.lookup("task");
type _5 = Expect<Equals<typeof fTask, Functor<TaskTypeLambda>>>;
const t5 = fTask.map((s: string) => s.length, Task.of("hi"));
type _5b = Expect<Equals<typeof t5, Task<number>>>;

// ── 6. Monad.lookup('task').chain ─────────────────────────────────────────
const mTask = Monad.lookup("task");
const t6 = mTask.chain((n: number) => Task.of(n + 1), Task.of(1));
type _6 = Expect<Equals<typeof t6, Task<number>>>;

// ── 7. Applicative.lookup('task').of ──────────────────────────────────────
const aTask = Applicative.lookup("task");
const t7 = aTask.of(42);
type _7 = Expect<Equals<typeof t7, Task<number>>>;

// ── 8. fromPromise preserves the awaited value type ───────────────────
const fetchUser = Task.fromPromise(async (id: number) => ({
    id,
    name: `u${id}`
}));
const t8 = fetchUser(42);
type _8 = Expect<Equals<typeof t8, Task<{ id: number; name: string }>>>;

// fromPromise with sync value
const syncFn = Task.fromPromise((n: number) => n + 1);
const t8b = syncFn(3);
type _8b = Expect<Equals<typeof t8b, Task<number>>>;

// ── 9. fromEither → Task<A>, drops E channel ──────────────────────────
declare const e9: Either<string, number>;
const t9 = Task.fromEither(e9);
type _9 = Expect<Equals<typeof t9, Task<number>>>;

// ── 10. Task.all → tuple Task (mapped type strips `readonly`) ────────
const t10 = Task.all([Task.of(1), Task.of("hi"), Task.of(true)] as const);
type _10 = Expect<Equals<typeof t10, Task<[number, string, boolean]>>>;

// ── 11. Task.race → union Task ────────────────────────────────────────
const t11 = Task.race([Task.of(1), Task.of("hi")] as const);
type _11 = Expect<Equals<typeof t11, Task<number | string>>>;

// ── 12. catchError preserves A ────────────────────────────────────────
const t12 = Task.catchError(
    (e: unknown) => Task.of(0),
    Task.of(42)
);
type _12 = Expect<Equals<typeof t12, Task<number>>>;

// Instance form
const t12b = Task.of(42).catchError((_e) => Task.of(0));
type _12b = Expect<Equals<typeof t12b, Task<number>>>;

// ── 13. fold returns void ─────────────────────────────────────────────
const r13 = Task.fold(
    (e: unknown) => {},
    (a: number) => {},
    Task.of(42)
);
type _13 = Expect<Equals<typeof r13, void>>;

// ── 14. isTask type guard ─────────────────────────────────────────────
declare const unknown14: unknown;
if (Task.isTask(unknown14)) {
    type _14 = Expect<Equals<typeof unknown14, Task<unknown>>>;
}

// ── 15. lift in liftA_n form — takes Task-wrapped args ────────────────
const parseTask = Task.lift((s: string) => {
    const n = Number(s);
    if (Number.isNaN(n)) throw new Error("nan");
    return n;
});
// Call with Task-wrapped arg. Runtime runCatch: throw → Task.rejected.
const t15 = parseTask(Task.of("42"));
type _15 = Expect<Equals<typeof t15, Task<number>>>;

// ── 16. alt preserves A ───────────────────────────────────────────────
declare const ta: Task<number>;
declare const tb: Task<number>;
const t16 = Task.alt(ta, tb);
type _16 = Expect<Equals<typeof t16, Task<number>>>;

// ── 17. Kind<TaskTypeLambda, ..., ..., ..., A> = Task<A> ──────────────
type KTask = Kind<TaskTypeLambda, never, never, never, string>;
declare const k17: KTask;
const t17: Task<string> = k17;
type _17 = Expect<Equals<KTask, Task<string>>>;

// ── 18. Task<never> (rejected) assignable to Task<A> via bivariance ──
declare const rejected: Task<never>;
const taskAny: Task<number> = rejected;

export {};
