/**
 * Behavior tests for previously-deferred methods now added to the
 * per-data-type const namespaces:
 *   - chainRec, traverse, pipeK, composeK on Maybe / Either / Task
 *   - Maybe.pipe / Either.pipe utility helpers
 *   - Maybe.toEither conversion
 *   - Maybe.Semigroup / Maybe.Monoid / Either.Semigroup factories
 *   - Validation.collect variadic validator combinator
 *   - Reader / Writer / State / Free pipeK/composeK/lift
 */

import { Maybe } from "../data/Maybe";
import { Either } from "../data/Either";
import { Task } from "../data/Task";
import { Validation } from "../data/Validation";
import { Reader } from "../data/Reader";
import { Writer } from "../data/Writer";
import { State } from "../data/State";
import { Free } from "../data/Free";
import { Applicative } from "../TypeClasses";
import type { Semigroup, Monoid } from "../TypeClasses";

type Assert<T extends U, U> = T;

// ── Maybe.chainRec ───────────────────────────────────────────────────
const count = Maybe.chainRec<number, string>(
    (next, done, i) =>
        i === 0 ? Maybe.of(done("finished")) : Maybe.of(next(i - 1)),
    10
);
type _c1 = Assert<typeof count, Maybe<string>>;

// ── Maybe.pipeK / composeK ───────────────────────────────────────────
const parse = (s: string): Maybe<number> =>
    isNaN(Number(s)) ? Maybe.Nothing() : Maybe.of(Number(s));
const positive = (n: number): Maybe<number> =>
    n > 0 ? Maybe.of(n) : Maybe.Nothing();
const stringify = (n: number): Maybe<string> => Maybe.of(String(n));

const pipeline = Maybe.pipeK(parse, positive, stringify);
type _p1 = Assert<typeof pipeline, (s: string) => Maybe<string>>;
const m1 = pipeline("42");

const composed = Maybe.composeK(stringify, positive, parse);
type _p2 = Assert<typeof composed, (s: string) => Maybe<string>>;

// ── Maybe.traverse ───────────────────────────────────────────────────
// Note on inference: `Kind<G, ..., B>` is a conditional type, and TS
// struggles to infer B through it when G is also being inferred. Passing
// explicit type parameters is the robust workaround.
declare const m0: Maybe<string>;
import type { TaskTypeLambda } from "../data/Task";
const t1 = Maybe.traverse<TaskTypeLambda, string, number>(
    Applicative.of("task"),
    (s) => Task.of(s.length),
    m0
);
type _t1 = Assert<typeof t1, import("../data/Task").Task<Maybe<number>>>;

// ── Maybe.toEither ───────────────────────────────────────────────────
declare const m2: Maybe<number>;
const e1 = Maybe.toEither("missing", m2);
type _m2 = Assert<typeof e1, Either<string, number>>;

// ── Maybe.pipe ───────────────────────────────────────────────────────
const p1 = Maybe.pipe(
    Maybe.of(42),
    (m) => m.map((n) => n + 1),
    (m) => m.chain((n) => (n > 0 ? Maybe.of(String(n)) : Maybe.Nothing()))
);
type _m3 = Assert<typeof p1, Maybe<string>>;

// ── Maybe.Semigroup / Monoid (via string key) ────────────────────────
const sgMaybeNum = Maybe.Semigroup("number");
type _s1 = Assert<typeof sgMaybeNum, Semigroup<Maybe<number>>>;

const mMaybeArr = Maybe.Monoid("array");
type _s2 = Assert<typeof mMaybeArr, Monoid<Maybe<ReadonlyArray<unknown>>>>;
const emptyM = mMaybeArr.empty(); // Maybe<readonly unknown[]>

// ── Either.chainRec / traverse / pipeK ───────────────────────────────
const ec = Either.chainRec<string, number, string>(
    (next, done, i) =>
        i === 0
            ? Either.Right(done("end"))
            : Either.Right(next(i - 1)),
    5
);
type _e1 = Assert<typeof ec, Either<string, string>>;

const parseE = (s: string): Either<string, number> =>
    isNaN(Number(s)) ? Either.Left("nan") : Either.Right(Number(s));
const ePipe = Either.pipeK(parseE, (n) => Either.Right(n + 1));
type _e2 = Assert<typeof ePipe, (s: string) => Either<string, number>>;

// Either.Semigroup (via string key)
const sgEitherStr = Either.Semigroup<"string", unknown>("string");
type _e3 = Assert<typeof sgEitherStr, Semigroup<Either<string, unknown>>>;

// ── Task.chainRec / pipeK ────────────────────────────────────────────
const tc = Task.chainRec<number, string>(
    (next, done, i) =>
        i === 0 ? Task.of(done("end")) : Task.of(next(i - 1)),
    3
);
type _tc = Assert<typeof tc, import("../data/Task").Task<string>>;

const tPipe = Task.pipeK(
    (s: string) => Task.of(s.length),
    (n: number) => Task.of(n * 2)
);
type _tp = Assert<typeof tPipe, (s: string) => import("../data/Task").Task<number>>;

// ── Validation.collect ───────────────────────────────────────────────
const validateName = (s: string): Either<string, string> =>
    s.length > 0 ? Either.Right(s) : Either.Left("empty name");
const validateAge = (n: number): Either<string, number> =>
    n >= 0 ? Either.Right(n) : Either.Left("negative age");

const makeUser = Validation.collect(validateName, validateAge)(
    (name: string, age: number) => ({ name, age })
);
type _vc = Assert<
    typeof makeUser,
    (a1: string, a2: number) => Validation<string[], { name: string; age: number }>
>;

// ── Reader/Writer/State/Free — pipeK works ───────────────────────────
const rP = Reader.pipeK(
    (s: string) => Reader.of<unknown, number>(s.length),
    (n: number) => Reader.of<unknown, string>(String(n))
);

const wP = Writer.pipeK(
    (s: string) => Writer.of<number, string[]>(s.length),
    (n: number) => Writer.of<string, string[]>(String(n))
);

const sP = State.pipeK(
    (s: string) => State.of<unknown, number>(s.length),
    (n: number) => State.of<unknown, string>(String(n))
);

// Free.pipeK (type params require F)
const fP = Free.pipeK(
    (s: string) => Free.of<import("../TypeLambdas").ArrayTypeLambda, number>(s.length),
    (n: number) => Free.of<import("../TypeLambdas").ArrayTypeLambda, string>(String(n))
);

export {};
