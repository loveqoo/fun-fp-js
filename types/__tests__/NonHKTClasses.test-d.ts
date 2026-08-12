/**
 * Behavior tests for non-HKT and kind-2 type classes:
 * Setoid, Ord, Semigroup, Monoid, Group, Semigroupoid, Category.
 */

import type { Equals, Expect, AssignableTo } from "./_test-utils";
import {
    Setoid,
    Ord,
    Semigroup,
    Monoid,
    Functor,
    Applicative,
    Group,
    Semigroupoid,
    Category,
} from "../TypeClasses";
import type { FunctionTypeLambda } from "../TypeLambdas";
import type { Maybe } from "../data/Maybe";
// Trigger builtins registration.
import "../data/builtins";


// ── 1. Setoid ────────────────────────────────────────────────────────
const sB = Setoid.of("boolean");
type _1a = Expect<Equals<typeof sB, Setoid<boolean>>>;
const eq1: boolean = sB.equals(true, false);

const sN = Setoid.of("number");
type _1b = Expect<Equals<typeof sN, Setoid<number>>>;

const sS = Setoid.of("string");
type _1c = Expect<Equals<typeof sS, Setoid<string>>>;

// ── 2. Ord ───────────────────────────────────────────────────────────
const oN = Ord.of("number");
type _2a = Expect<Equals<typeof oN, Ord<number>>>;
const lte: boolean = oN.lte(1, 2);
const eq2: boolean = oN.equals(1, 1); // inherited from Setoid

const oS = Ord.of("string");
type _2b = Expect<Equals<typeof oS, Ord<string>>>;

// ── 3. Semigroup ─────────────────────────────────────────────────────
const sgN = Semigroup.of("number");
type _3a = Expect<Equals<typeof sgN, Semigroup<number>>>;
const sum: number = sgN.concat(2, 3);

const sgS = Semigroup.of("string");
const concatS: string = sgS.concat("hi", "!");

const sgA = Semigroup.of("array");
const concatA: ReadonlyArray<unknown> = sgA.concat([1], [2]);

const sgFirst = Semigroup.of("first");
const sgLast = Semigroup.of("last");

// ── 4. Monoid (Semigroup + empty) ────────────────────────────────────
const mN = Monoid.of("number");
type _4a = Expect<Equals<typeof mN, Monoid<number>>>;
const zero: number = mN.empty();
const add: number = mN.concat(zero, 5);

const mA = Monoid.of("array");
const empty: ReadonlyArray<unknown> = mA.empty();

// Plus 에서 유도된 Monoid/Semigroup — 등록된 Plus 마다 plus(<alias>) 키가 생긴다.
// 이 줄들이 있어야 builtins.d.ts 의 선언이 지워졌을 때 tsc 가 잡는다.
const mPlusA = Monoid.of("plus(array)");
type _4c = Expect<Equals<typeof mPlusA, Monoid<ReadonlyArray<unknown>>>>;
const emptyPlusA: ReadonlyArray<unknown> = mPlusA.empty();

// identity 3단 — 선언만 하고 고정 안 하면 조용히 되돌아간다(회차 1 리뷰 #4).
const fId = Functor.of("identity");
const aId = Applicative.of("identity");
const idVal: { readonly value: number } = aId.of(42);

// Applicative.Const — 키/인스턴스 양쪽 오버로드가 선언돼 있어야 한다(Maybe.Monoid 선례).
const cArr = Applicative.Const("array");
const cUser = Applicative.Const(Monoid.of("number"));

const mPlusM = Monoid.of("plus(maybe)");
type _4d = Expect<Equals<typeof mPlusM, Monoid<Maybe<unknown>>>>;
const emptyPlusM: Maybe<unknown> = mPlusM.empty();

const sgPlusM = Semigroup.of("plus(maybe)");
type _4e = Expect<Equals<typeof sgPlusM, Semigroup<Maybe<unknown>>>>;

// ── 5. Group (Monoid + invert) ───────────────────────────────────────
const gN = Group.of("number");
type _5 = Expect<Equals<typeof gN, Group<number>>>;
const neg: number = gN.invert(42);
const back: number = gN.concat(42, neg); // = 0

// ── 6. Semigroupoid on Function (compose) ────────────────────────────
const sgoF = Semigroupoid.of("function");
type _6a = Expect<Equals<typeof sgoF, Semigroupoid<FunctionTypeLambda>>>;

declare const bc: (b: number) => string;
declare const ab: (a: boolean) => number;
const ac = sgoF.compose(bc, ab);
type _6b = Expect<Equals<typeof ac, (a: boolean) => string>>;

// ── 7. Category on Function (id) ─────────────────────────────────────
const catF = Category.of("function");
type _7a = Expect<Equals<typeof catF, Category<FunctionTypeLambda>>>;
const idF = catF.id<number>();
type _7b = Expect<Equals<typeof idF, (a: number) => number>>;
const n: number = idF(42);

// ── 8. Type-guard: Ord narrows on inherit to Setoid ──────────────────
// A Setoid<number> is needed but Ord<number> is provided — OK.
const asSetoid: Setoid<number> = oN;

export {};
