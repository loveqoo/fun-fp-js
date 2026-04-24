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
    Group,
    Semigroupoid,
    Category,
} from "../TypeClasses";
import type { FunctionTypeLambda } from "../TypeLambdas";
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
