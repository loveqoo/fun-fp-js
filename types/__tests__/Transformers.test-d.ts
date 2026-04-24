/**
 * Basic type-checks for StateT, EitherT, ReaderT, WriterT.
 * Focuses on: (1) correct inference from string-key dispatch, (2) that
 * `run*` methods return Kind<M, …> correctly, (3) that map/chain preserve
 * both the base monad M and the transformer-specific parameter.
 */

import type { Kind } from "../HKT";
import { StateT } from "../data/transformers/StateT";
import type { StateTTypeLambda } from "../data/transformers/StateT";
import { EitherT } from "../data/transformers/EitherT";
import { ReaderT } from "../data/transformers/ReaderT";
import { WriterT } from "../data/transformers/WriterT";
import type { MaybeTypeLambda, Maybe } from "../data/Maybe";
import type { TaskTypeLambda, Task } from "../data/Task";
import type { Either } from "../data/Either";
import type { Equals, Expect, AssignableTo } from "./_test-utils";


// ═══════════════════════════════════════════════════════════════════
// StateT
// ═══════════════════════════════════════════════════════════════════
type Counter = { n: number };

const SM = StateT("maybe");
const st1 = SM.of<number, Counter>(42);
type _st1 = Expect<Equals<typeof st1, Parameters<typeof SM.map<Counter, number, never>>[1]>>;

const st2 = SM.gets((c: Counter) => c.n);
// st2.run(s) returns Kind<MaybeTypeLambda, never, never, never, [number, Counter]>
// = Maybe<[number, Counter]>
declare const s: Counter;
const st2Run = st2.run(s);
type _st2 = Expect<Equals<typeof st2Run, Maybe<[number, Counter]>>>;

const st3 = SM.put<Counter>({ n: 0 });
const st4 = SM.modify<Counter>((c) => ({ n: c.n + 1 }));
const st5 = st3.chain(() => st4);

// lift a Maybe into StateT(Maybe)
declare const m0: Maybe<number>;
const st6 = SM.lift<number, Counter>(m0);
type _st6 = Expect<Equals<typeof st6, ReturnType<typeof SM.of<number, Counter>>>>;

// ═══════════════════════════════════════════════════════════════════
// EitherT
// ═══════════════════════════════════════════════════════════════════
const ET = EitherT("task");
const et1 = ET.of<number, string>(42);
const et2 = ET.throwError<string, number>("err");
const et3 = et1.chain((n) => ET.of<number, string>(n + 1));

// .run() returns Kind<TaskTypeLambda, ..., Either<E, A>> = Task<Either<E, A>>
const et1Run = et1.run();
type _et1 = Expect<Equals<typeof et1Run, Task<Either<string, number>>>>;

// catchError with a different E
const et4 = ET.catchError(et2, (e: string) => ET.of<number, number>(e.length));
const et4Run = et4.run();
type _et4 = Expect<Equals<typeof et4Run, Task<Either<number, number>>>>;

// fromEither
declare const e0: Either<string, number>;
const et5 = ET.fromEither(e0);

// ═══════════════════════════════════════════════════════════════════
// ReaderT
// ═══════════════════════════════════════════════════════════════════
type Env = { url: string };
const RT = ReaderT("task");
const rt1 = RT.of<number, Env>(42);
const rt2 = RT.asks((env: Env) => env.url);
const rt3 = RT.local(
    (outer: { fullEnv: Env }) => outer.fullEnv,
    rt1
);

declare const env0: Env;
const rt1Run = rt1.run(env0);
type _rt1 = Expect<Equals<typeof rt1Run, Task<number>>>;

// ═══════════════════════════════════════════════════════════════════
// WriterT
// ═══════════════════════════════════════════════════════════════════
const WT = WriterT<"task", string[]>("task");
const wt1 = WT.of(42);
const wt2 = WT.tell(["logged"]);
const wt3 = wt1.chain((n) => WT.of(String(n)));

const wt1Run = wt1.run();
type _wt1 = Expect<Equals<typeof wt1Run, Task<[number, string[]]>>>;

export {};
