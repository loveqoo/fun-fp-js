/**
 * Integration tests — edge cases and realistic usage scenarios that
 * exercise multiple parts of the type system together.
 *
 * Sections:
 *   1. Zero/empty-arity edge cases
 *   2. Deep method chaining (slot threading at depth)
 *   3. Kleisli composition at 4+ steps
 *   4. Variance / subtyping corners
 *   5. Realistic API scenarios (fetch flow, validation, state machine)
 *   6. HKT type-level round-trips
 *   7. Type-inference corners (widening, literal narrowing)
 *   8. Transformer + base monad interop
 */

import type { Equals, Expect, AssignableTo } from "./_test-utils";
import { Maybe } from "../data/Maybe";
import { Either } from "../data/Either";
import { Task } from "../data/Task";
import { Validation } from "../data/Validation";
import { Reader } from "../data/Reader";
import { Writer } from "../data/Writer";
import { State } from "../data/State";
import { Free } from "../data/Free";
import { StateT } from "../data/transformers/StateT";
import { EitherT } from "../data/transformers/EitherT";
import { ReaderT } from "../data/transformers/ReaderT";
import type { Just, Nothing } from "../data/Maybe";
import type { Left, Right } from "../data/Either";
import type { MaybeTypeLambda } from "../data/Maybe";
import type { TaskTypeLambda } from "../data/Task";
import type { EitherTypeLambda } from "../data/Either";
import type { StateTTypeLambda } from "../data/transformers/StateT";
import type { Kind, TypeLambda } from "../HKT";
import { Monad, Applicative, Functor } from "../TypeClasses";
import fp from "../index";

// ═══════════════════════════════════════════════════════════════════
// 1. Zero / empty-arity edge cases
// ═══════════════════════════════════════════════════════════════════

// Task.all with empty tuple — resolves to Task<[]>.
const allEmpty = Task.all([] as const);
type _1a = Expect<Equals<typeof allEmpty, Task<[]>>>;

// Task.race with empty tuple — runtime rejects at call time. TS widens
// the union to `Task<unknown>` because `(readonly [])[number]` doesn't
// reduce cleanly under the `infer U` extraction. Treat this as a known
// quirk; non-empty tuples give precise union types.
const raceEmpty = Task.race([] as const);
type _1b = Expect<Equals<typeof raceEmpty, Task<unknown>>>;

// 0-ary curry
const zero = fp.curry(() => 42);
type _1c = Expect<Equals<typeof zero, () => number>>;

// pipe/compose with a single fn just echoes it.
const oneFn = fp.pipe((n: number) => n + 1);
type _1d = Expect<Equals<typeof oneFn, (a: number) => number>>;

// Maybe.lift of a 0-arity function
const zeroLift = Maybe.lift(() => 42);
type _1e = Expect<Equals<typeof zeroLift, () => Maybe<number>>>;

// ═══════════════════════════════════════════════════════════════════
// 2. Deep method chaining — slot threading at depth
// ═══════════════════════════════════════════════════════════════════

// Either<string, A> chained 5 times preserves E.
declare const e0: Either<string, number>;
const deepChain = e0
    .map((n) => n + 1)
    .chain((n) => Either.Right(n * 2))
    .map((n) => String(n))
    .chain((s) => Either.Right(s.length))
    .map((n) => n > 0);
type _2a = Expect<Equals<typeof deepChain, Either<string, boolean>>>;

// State<S, A> chain preserves S through 4 steps.
type Ctr = { n: number };
declare const s0: State<Ctr, string>;
const stateChain = s0
    .map((v) => v.length)
    .chain((n) => State.of<Ctr, number>(n + 1))
    .map((n) => String(n))
    .chain((s) => State.of<Ctr, boolean>(s.length > 0));
type _2b = Expect<Equals<typeof stateChain, State<Ctr, boolean>>>;

// Reader<R, A> chain preserves R.
type AppEnv = { url: string; apiKey: string };
const readerChain = Reader.of<AppEnv, number>(1)
    .map((n) => n + 1)
    .chain((n) => Reader.of<AppEnv, string>(String(n)))
    .map((s) => s.length);
type _2c = Expect<Equals<typeof readerChain, Reader<AppEnv, number>>>;

// ═══════════════════════════════════════════════════════════════════
// 3. Kleisli composition at pipeK's max arity (4 steps)
// ═══════════════════════════════════════════════════════════════════

const parseNum = (s: string): Maybe<number> => Maybe.of(Number(s));
const positive = (n: number): Maybe<number> =>
    n > 0 ? Maybe.of(n) : Maybe.Nothing();
const double = (n: number): Maybe<number> => Maybe.of(n * 2);
const toStr = (n: number): Maybe<string> => Maybe.of(String(n));

const pipeline4 = Maybe.pipeK(parseNum, positive, double, toStr);
type _3a = Expect<Equals<typeof pipeline4, (s: string) => Maybe<string>>>;

const composed4 = Maybe.composeK(toStr, double, positive, parseNum);
type _3b = Expect<Equals<typeof composed4, (s: string) => Maybe<string>>>;

// Either.pipeK preserves E across 4 steps.
const eParseNum = (s: string): Either<string, number> =>
    isNaN(Number(s)) ? Either.Left("nan") : Either.Right(Number(s));
const ePositive = (n: number): Either<string, number> =>
    n > 0 ? Either.Right(n) : Either.Left("negative");
const eDouble = (n: number): Either<string, number> => Either.Right(n * 2);
const eToStr = (n: number): Either<string, string> => Either.Right(String(n));

const ePipe4 = Either.pipeK(eParseNum, ePositive, eDouble, eToStr);
type _3c = Expect<Equals<typeof ePipe4, (s: string) => Either<string, string>>>;

// ═══════════════════════════════════════════════════════════════════
// 4. Variance / subtyping corners
// ═══════════════════════════════════════════════════════════════════

// Nothing is assignable to Maybe<A> for any A.
const nothingAsNumber: Maybe<number> = Maybe.Nothing();
const nothingAsString: Maybe<string> = Maybe.Nothing();
const nothingAsObj: Maybe<{ x: number }> = Maybe.Nothing();

// Task<never> (rejected) is assignable to any Task<A>.
declare const rejected: Task<never>;
const rA: Task<number> = rejected;
const rB: Task<string> = rejected;

// Right<A> flows into Either<E, A> for any E.
declare const r42: Right<number>;
const eAnyE_R: Either<string, number> = r42;
const eAnyE_R2: Either<Error, number> = r42;

// Left<E> flows into Either<E, A> for any A.
declare const lOops: Left<"oops">;
const eAnyA_L: Either<"oops", number> = lOops;
const eAnyA_L2: Either<"oops", boolean> = lOops;

// Valid<A> / Invalid<E> likewise.
declare const validN: import("../data/Validation").Valid<number>;
const vAnyE: Validation<string[], number> = validN;

// ═══════════════════════════════════════════════════════════════════
// 5. Realistic scenarios
// ═══════════════════════════════════════════════════════════════════

// 5a. API fetch flow using Task + Either-in-Task via EitherT
type ApiErr = { code: number; msg: string };
type User = { id: number; name: string };

const ET = EitherT("task");
declare const fetchUserRaw: (id: number) => Task<User | null>;

const fetchUser = (id: number) =>
    ET.lift<User | null, ApiErr>(fetchUserRaw(id)).chain((u) =>
        u === null
            ? ET.throwError<ApiErr, User>({ code: 404, msg: "not found" })
            : ET.of<User, ApiErr>(u)
    );
// After running, we get Task<Either<ApiErr, User>>.
const flow5a = fetchUser(1).run();
type _5a = Expect<Equals<typeof flow5a, Task<Either<ApiErr, User>>>>;

// 5b. Form validation with Validation.collect (accumulating errors)
const notEmpty = (s: string): Either<string, string> =>
    s.length > 0 ? Either.Right(s) : Either.Left("empty");
const atLeast = (min: number) => (n: number): Either<string, number> =>
    n >= min ? Either.Right(n) : Either.Left(`too small (< ${min})`);
const ageValidator = atLeast(0);

const makeUser = Validation.collect(notEmpty, ageValidator)(
    (name: string, age: number) => ({ name, age })
);
type _5b = Expect<
    Equals<
        typeof makeUser,
        (a1: string, a2: number) => Validation<string[], { name: string; age: number }>
    >
>;

// 5c. Stateful counter — increment N times, collect history.
type CounterState = { count: number; history: number[] };

const bump = State.modify<CounterState>((s) => ({
    count: s.count + 1,
    history: [...s.history, s.count + 1],
}));

const bumpAndRead = bump.chain(() =>
    State.gets<CounterState, number>((s) => s.count)
);
type _5c = Expect<Equals<typeof bumpAndRead, State<CounterState, number>>>;

// 5d. Writer-based logging
const logged = Writer.of<number, string[]>(0)
    .chain((n) => {
        const next = Writer.tell<string[]>([`bumping ${n}`]);
        return next.chain(() => Writer.of<number, string[]>(n + 1));
    })
    .chain((n) => {
        const next = Writer.tell<string[]>([`now ${n}`]);
        return next.chain(() => Writer.of<number, string[]>(n));
    });
type _5d = Expect<Equals<typeof logged, Writer<string[], number>>>;

// 5e. Reader-based DI
type Config = { baseUrl: string };
const endpoint = Reader.asks((c: Config) => c.baseUrl)
    .map((url) => url + "/users")
    .chain((u) => Reader.of<Config, { url: string; method: "GET" }>({ url: u, method: "GET" }));
type _5e = Expect<
    Equals<typeof endpoint, Reader<Config, { url: string; method: "GET" }>>
>;

// ═══════════════════════════════════════════════════════════════════
// 6. HKT type-level round-trips
// ═══════════════════════════════════════════════════════════════════

// Kind applied with all slots is the concrete type.
type KEither = Kind<EitherTypeLambda, never, string, never, number>;
type _6a = Expect<Equals<KEither, Either<string, number>>>;

type KMaybe = Kind<MaybeTypeLambda, never, never, never, string>;
type _6b = Expect<Equals<KMaybe, Maybe<string>>>;

type KTask = Kind<TaskTypeLambda, never, never, never, boolean>;
type _6c = Expect<Equals<KTask, Task<boolean>>>;

// Kind of a higher-order TypeLambda (StateT<Maybe>)
type KSTMaybe = Kind<
    StateTTypeLambda<MaybeTypeLambda>,
    { n: number },
    never,
    never,
    string
>;
type _6d = Expect<
    Equals<
        KSTMaybe,
        import("../data/transformers/StateT").StateT<MaybeTypeLambda, { n: number }, string>
    >
>;

// ═══════════════════════════════════════════════════════════════════
// 7. Type-inference corners
// ═══════════════════════════════════════════════════════════════════

// Literal widening: Maybe.of(42) widens to Maybe<number>, not Maybe<42>.
const widened = Maybe.of(42);
type _7a = Expect<Equals<typeof widened, Maybe<number>>>;

// const-annotated literal preserves the literal type.
const literalM = Maybe.of(42 as const);
type _7b = Expect<Equals<typeof literalM, Maybe<42>>>;

// Tuple inference via `as const`
const tupTask = Task.all([Task.of(1 as const), Task.of("x" as const)] as const);
type _7c = Expect<Equals<typeof tupTask, Task<[1, "x"]>>>;

// Function inference: fp.pipe threads types without annotation
const inferred = fp.pipe(
    (n: number) => n + 1,
    (n) => String(n),
    (s) => s.length,
    (n) => n > 0
);
type _7d = Expect<Equals<typeof inferred, (a: number) => boolean>>;

// ═══════════════════════════════════════════════════════════════════
// 8. Transformer + base-monad interop
// ═══════════════════════════════════════════════════════════════════

// StateT(Maybe) lifts Maybe ↑ preserves S.
const SM = StateT("maybe");
declare const m0: Maybe<number>;
const lifted8a = SM.lift<number, Ctr>(m0);
const ran8a = lifted8a.run({ n: 0 });
type _8a = Expect<Equals<typeof ran8a, Maybe<[number, Ctr]>>>;

// EitherT(Task).fromEither converts a plain Either into an EitherT.
declare const e8b: Either<string, number>;
const lifted8b = ET.fromEither(e8b);
const ran8b = lifted8b.run();
type _8b = Expect<Equals<typeof ran8b, Task<Either<string, number>>>>;

// ReaderT(Task).local shrinks the env contravariantly.
const RT = ReaderT("task");
declare const smallR: import("../data/transformers/ReaderT").ReaderT<
    TaskTypeLambda,
    { small: string },
    number
>;
type BigEnv = { small: string; large: number };
const shrunk = RT.local((big: BigEnv) => ({ small: big.small }), smallR);
type _8c = Expect<
    Equals<
        typeof shrunk,
        import("../data/transformers/ReaderT").ReaderT<TaskTypeLambda, BigEnv, number>
    >
>;

// ═══════════════════════════════════════════════════════════════════
// 9. Monad.of transformer key returns correct Monad
// ═══════════════════════════════════════════════════════════════════

import "../data/transformers/registrations";

const mStMaybe = Monad.of("statet(maybe)");
type _9a = Expect<Equals<typeof mStMaybe, Monad<StateTTypeLambda<MaybeTypeLambda>>>>;

// of on a transformer Monad instance resolves through the registry.
// S defaults to `never` via Kind when dispatched by string key — this is
// the documented caveat (use direct StateT("maybe") for preserving S).

export {};
