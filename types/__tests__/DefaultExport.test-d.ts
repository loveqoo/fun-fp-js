/**
 * Smoke tests for the top-level barrel (types/index.d.ts) and the default
 * export. Exercises both the default-import pattern and named type-only
 * imports, across all 74+ public symbols.
 */

// Default-import pattern — mirrors the runtime's `export default { ... }`.
import fp from "../index";
import type { Equals, Expect, AssignableTo } from "./_test-utils";

// Named type-only imports — for types with no runtime counterpart.
import type {
    TypeLambda,
    Kind,
    TypeClass,
    Maybe,
    Just,
    Nothing,
    Either,
    Left,
    Right,
    Task,
    Validation,
    Valid,
    Invalid,
    Reader,
    Writer,
    State,
    Free,
    Thunk,
    StateT,
    EitherT,
    ReaderT,
    WriterT,
    MaybeTypeLambda,
    EitherTypeLambda,
    TaskTypeLambda,
    ValidationTypeLambda,
    ReaderTypeLambda,
    WriterTypeLambda,
    StateTypeLambda,
    FreeTypeLambda,
    StateTTypeLambda,
    EitherTTypeLambda,
    ReaderTTypeLambda,
    WriterTTypeLambda,
    ArrayTypeLambda,
    FunctionTypeLambda,
    Functor,
    Monad,
    Semigroup,
    Monoid,
    ChainRecStep,
    Lens,
    Reduced,
    ActorRef,
} from "../index";


// ── Data types accessed via default export ───────────────────────────
const m1: Maybe<number> = fp.Maybe.Just(42);
const e1: Either<string, number> = fp.Either.Right(42);
const t1: Task<number> = fp.Task.of(42);
const v1: Validation<string[], number> = fp.Validation.Valid(42);
const r1: Reader<{ x: number }, number> = fp.Reader.asks((env) => env.x);
const w1: Writer<string[], number> = fp.Writer.of(42);
const st1: State<number, string> = fp.State.of("hi");

// ── Type classes via default export ──────────────────────────────────
const fMaybe = fp.Functor.of("maybe");
type _fm = Expect<Equals<typeof fMaybe, Functor<MaybeTypeLambda>>>;

const mTask = fp.Monad.of("task");
type _mt = Expect<Equals<typeof mTask, Monad<TaskTypeLambda>>>;

const sgN = fp.Semigroup.of("number");
type _sn = Expect<Equals<typeof sgN, Semigroup<number>>>;

const mN = fp.Monoid.of("number");
type _mn = Expect<Equals<typeof mN, Monoid<number>>>;

// ── Transformers via default ─────────────────────────────────────────
const SM = fp.StateT("maybe");
const stProg = SM.of<number, { count: number }>(42);

const ET = fp.EitherT("task");
const etProg = ET.throwError<string, number>("err");

// ── Lens via default ─────────────────────────────────────────────────
type Person = { name: string; age: number };
const nameLens: Lens<Person, string> = fp.Lens(
    (p) => p.name,
    (s, p) => ({ ...p, name: s })
);
declare const p: Person;
const n1: string = fp.view(nameLens, p);
const p2: Person = fp.set(nameLens, "alice", p);
const p3: Person = fp.over(nameLens, (s) => s.toUpperCase(), p);

// ── Core utilities ───────────────────────────────────────────────────
const id1: number = fp.identity(42);
const k1: () => number = fp.constant(42);
const t2: readonly [number, string] = fp.tuple(1, "hi");

const addOne = (n: number) => n + 1;
const toStr = (n: number) => String(n);
const composed = fp.compose(toStr, addOne);
const m2: string = composed(41);

const piped = fp.pipe(addOne, toStr);
const m3: string = piped(41);

const curried = fp.curry((a: number, b: number, c: number) => a + b + c);
const r2: number = curried(1)(2)(3);

const tapped = fp.tap<number>((n) => console.log(n));
const m4: number = tapped(42);

// ── transducer ───────────────────────────────────────────────────────
const reducedVal: Reduced<number> = fp.transducer.of(42);
const isRed: boolean = fp.transducer.isReduced(reducedVal);

// ── Actor ────────────────────────────────────────────────────────────
const counter: ActorRef<number, "inc" | "dec", number> = fp.Actor({
    init: 0,
    handle: (state, msg) =>
        msg === "inc" ? [state + 1, state + 1] : [state - 1, state - 1],
});
const result: Task<number> = counter.send("inc");

// ── Runtime config ───────────────────────────────────────────────────
fp.setStrictMode(true);
fp.setTapErrorHandler((e) => console.error(e));

// ── trampoline & free ────────────────────────────────────────────────
const trampolined: number = fp.trampoline(fp.Free.Thunk.done(42));

// ── HKT type utility ─────────────────────────────────────────────────
type KMaybe = Kind<MaybeTypeLambda, never, never, never, string>;
type _k = Expect<Equals<KMaybe, Maybe<string>>>;

// ── ChainRecStep ─────────────────────────────────────────────────────
const step1: ChainRecStep<number, string> = fp.ChainRec.next(5);
const step2: ChainRecStep<number, string> = fp.ChainRec.done("ok");

export {};
