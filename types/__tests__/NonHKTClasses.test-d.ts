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
const sB = Setoid.lookup("boolean");
type _1a = Expect<Equals<typeof sB, Setoid<boolean>>>;
const eq1: boolean = sB.equals(true, false);

const sN = Setoid.lookup("number");
type _1b = Expect<Equals<typeof sN, Setoid<number>>>;

const sS = Setoid.lookup("string");
type _1c = Expect<Equals<typeof sS, Setoid<string>>>;

// ── 2. Ord ───────────────────────────────────────────────────────────
const oN = Ord.lookup("number");
type _2a = Expect<Equals<typeof oN, Ord<number>>>;
const lte: boolean = oN.lte(1, 2);
const eq2: boolean = oN.equals(1, 1); // inherited from Setoid

const oS = Ord.lookup("string");
type _2b = Expect<Equals<typeof oS, Ord<string>>>;

// ── 3. Semigroup ─────────────────────────────────────────────────────
const sgN = Semigroup.lookup("number");
type _3a = Expect<Equals<typeof sgN, Semigroup<number>>>;
const sum: number = sgN.concat(2, 3);

const sgS = Semigroup.lookup("string");
const concatS: string = sgS.concat("hi", "!");

const sgA = Semigroup.lookup("array");
const concatA: ReadonlyArray<unknown> = sgA.concat([1], [2]);

const sgFirst = Semigroup.lookup("first");
const sgLast = Semigroup.lookup("last");

// ── 4. Monoid (Semigroup + empty) ────────────────────────────────────
const mN = Monoid.lookup("number");
type _4a = Expect<Equals<typeof mN, Monoid<number>>>;
const zero: number = mN.empty();
const add: number = mN.concat(zero, 5);

const mA = Monoid.lookup("array");
const empty: ReadonlyArray<unknown> = mA.empty();

// Plus 에서 유도된 Monoid/Semigroup — 키는 **그 타입의 이름 그대로**다.
// 한때 plus(<alias>) 였는데 f(x) 는 F<X> 를 뜻하므로 버그였다(2026-08-14).
// Array 는 이미 ArrayMonoid 가 있어 유도본이 등록되지 않는다 — 위 mA 가 그것이다.
// 이 줄들이 있어야 builtins.d.ts 의 선언이 지워졌을 때 tsc 가 잡는다.

// identity 3단 — 선언만 하고 고정 안 하면 조용히 되돌아간다(회차 1 리뷰 #4).
const fId = Functor.lookup("identity");
const aId = Applicative.lookup("identity");
const idVal: { readonly value: number } = aId.of(42);

// Applicative.Const — 키/인스턴스 양쪽 오버로드가 선언돼 있어야 한다(Monoid.Maybe 선례).
const cArr = Applicative.Const("array");
const cUser = Applicative.Const(Monoid.lookup("number"));

const mPlusM = Monoid.lookup("maybe");
type _4d = Expect<Equals<typeof mPlusM, Monoid<Maybe<unknown>>>>;
const emptyPlusM: Maybe<unknown> = mPlusM.empty();

const sgPlusM = Semigroup.lookup("maybe");
type _4e = Expect<Equals<typeof sgPlusM, Semigroup<Maybe<unknown>>>>;

// ── 5. Group (Monoid + invert) ───────────────────────────────────────
const gN = Group.lookup("number");
type _5 = Expect<Equals<typeof gN, Group<number>>>;
const neg: number = gN.invert(42);
const back: number = gN.concat(42, neg); // = 0

// ── 6. Semigroupoid on Function (compose) ────────────────────────────
const sgoF = Semigroupoid.lookup("function");
type _6a = Expect<Equals<typeof sgoF, Semigroupoid<FunctionTypeLambda>>>;

declare const bc: (b: number) => string;
declare const ab: (a: boolean) => number;
const ac = sgoF.compose(bc, ab);
type _6b = Expect<Equals<typeof ac, (a: boolean) => string>>;

// ── 7. Category on Function (id) ─────────────────────────────────────
const catF = Category.lookup("function");
type _7a = Expect<Equals<typeof catF, Category<FunctionTypeLambda>>>;
const idF = catF.id<number>();
type _7b = Expect<Equals<typeof idF, (a: number) => number>>;
const n: number = idF(42);

// ── 8. Type-guard: Ord narrows on inherit to Setoid ──────────────────
// A Setoid<number> is needed but Ord<number> is provided — OK.
const asSetoid: Setoid<number> = oN;

export {};
