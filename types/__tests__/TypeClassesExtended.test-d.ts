/**
 * Behavior tests for the extended type-class family:
 * Bifunctor, Filterable, ChainRec, Contravariant, Profunctor, Extend,
 * Comonad — across the data types that register for each.
 */

import type { Kind } from "../HKT";
import type { Equals, Expect, AssignableTo } from "./_test-utils";
import {
    Bifunctor,
    Contravariant,
    Profunctor,
    Filterable,
    ChainRec,
    Extend,
    Comonad,
} from "../TypeClasses";
import type { ChainRecStep } from "../TypeClasses";
import { Maybe } from "../data/Maybe";
import { Either } from "../data/Either";
import { Task } from "../data/Task";
import { Validation } from "../data/Validation";
import type {
    MaybeTypeLambda,
} from "../data/Maybe";
import type { EitherTypeLambda } from "../data/Either";
import type { TaskTypeLambda } from "../data/Task";
import type { ValidationTypeLambda } from "../data/Validation";
import type {
    ArrayTypeLambda,
    FunctionTypeLambda,
} from "../TypeLambdas";
// Trigger builtin module-augmentation (ArrayTypeLambda etc. on registries)
import "../data/builtins";


// ── 1. Bifunctor on Either ───────────────────────────────────────────
const biE = Bifunctor.lookup("either");
type _1a = Expect<Equals<typeof biE, Bifunctor<EitherTypeLambda>>>;
declare const e1: Either<string, number>;
const e1b = biE.bimap(
    (s: string) => s.length,
    (n: number) => n.toString(),
    e1
);
type _1b = Expect<Equals<typeof e1b, Either<number, string>>>;

// Instance-style via const Either
const e1c = Either.bimap(
    (s: string) => [s],
    (n: number) => n + 1,
    e1
);
type _1c = Expect<Equals<typeof e1c, Either<string[], number>>>;

// ── 2. Bifunctor on Validation ───────────────────────────────────────
const biV = Bifunctor.lookup("validation");
type _2 = Expect<Equals<typeof biV, Bifunctor<ValidationTypeLambda>>>;
declare const v2: Validation<string[], number>;
const v2b = biV.bimap(
    (errs: string[]) => errs.length,
    (n: number) => n.toString(),
    v2
);
type _2b = Expect<Equals<typeof v2b, Validation<number, string>>>;

// ── 3. Filterable on Maybe / Array ───────────────────────────────────
// Either / Task 는 Filterable 이 아니다 — "비어 있음" 이 없어 소멸 규칙을 못 지킨다.
// 거르는 기능은 Either.filter / Task.filter 로 남아 있다. docs/internals.md#filterable
const fM = Filterable.lookup("maybe");
type _3a = Expect<Equals<typeof fM, Filterable<MaybeTypeLambda>>>;

const fA = Filterable.lookup("array");
type _3d = Expect<Equals<typeof fA, Filterable<ArrayTypeLambda>>>;

// Actual use — narrowing via type-guard
declare const m3: Maybe<string | number>;
const m3b = fM.filter(
    (x: string | number): x is string => typeof x === "string",
    m3
);
type _3e = Expect<Equals<typeof m3b, Maybe<string>>>;

// ── 4. ChainRec on Maybe / Either / Task ─────────────────────────────
const crM = ChainRec.lookup("maybe");
type _4a = Expect<Equals<typeof crM, ChainRec<MaybeTypeLambda>>>;

// Count down from n to 0 using chainRec — must return Maybe of a Step.
const count = crM.chainRec<never, never, never, number, string>(
    (next, done, i) => {
        if (i === 0) return Maybe.of(done("finished"));
        return Maybe.of(next(i - 1));
    },
    10
);
type _4b = Expect<Equals<typeof count, Maybe<string>>>;

// Step constructors
const s1: ChainRecStep<number, never> = ChainRec.next(42);
const s2: ChainRecStep<never, string> = ChainRec.done("ok");

// ── 5. Contravariant on Function (varies In slot) ────────────────────
// 런타임 키는 'predicate' 다 — 'function' 은 TS 에만 있던 유령 키였다(재리뷰 3차 1번).
const cF = Contravariant.lookup("predicate");
type _5a = Expect<Equals<typeof cF, Contravariant<FunctionTypeLambda>>>;
// A predicate on number, contramapped to a predicate on string-length
declare const isPositive: (n: number) => boolean;
const isPositiveLen = cF.contramap(
    (s: string) => s.length,
    isPositive
);
type _5b = Expect<Equals<typeof isPositiveLen, (s: string) => boolean>>;

// ── 6. Profunctor on Function ────────────────────────────────────────
const pF = Profunctor.lookup("function");
type _6a = Expect<Equals<typeof pF, Profunctor<FunctionTypeLambda>>>;
declare const lengthFn: (s: string) => number;
const decoratedFn = pF.promap(
    (n: number) => n.toString(),      // In: number → string (contravariant)
    (n: number) => `[${n}]`,           // Target: number → string
    lengthFn
);
type _6b = Expect<Equals<typeof decoratedFn, (n: number) => string>>;

// ── 7. Extend / Comonad on Array ─────────────────────────────────────
const exA = Extend.lookup("array");
type _7a = Expect<Equals<typeof exA, Extend<ArrayTypeLambda>>>;

const coA = Comonad.lookup("array");
type _7b = Expect<Equals<typeof coA, Comonad<ArrayTypeLambda>>>;

// ── 8. Bifunctor.lookup runtime dispatch kinds ───────────────────────────
// Just demonstrate Kind reduction round-trips.
type KE = Kind<EitherTypeLambda, never, string, never, number>;
declare const ke: KE;
const ke2: Either<string, number> = ke;

export {};
