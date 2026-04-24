import type { Kind } from "../HKT";
import { State } from "../data/State";
import type { StateTypeLambda } from "../data/State";
import { Functor, Monad, Applicative } from "../TypeClasses";
import type { Equals, Expect, AssignableTo } from "./_test-utils";


type Counter = { n: number };

// ── 1. of produces State<S, A> ────────────────────────────────────────
const s1 = State.of<Counter, string>("hi");
type _1 = Expect<Equals<typeof s1, State<Counter, string>>>;

// ── 2. run / eval / exec ──────────────────────────────────────────────
declare const s2: State<Counter, string>;
const pair: [string, Counter] = s2.run({ n: 0 });
const val: string = s2.eval({ n: 0 });
const st: Counter = s2.exec({ n: 0 });

// ── 3. map transforms Target ──────────────────────────────────────────
const s3 = State.map((v: string) => v.length, s1);
type _3 = Expect<Equals<typeof s3, State<Counter, number>>>;

// ── 4. chain preserves S ──────────────────────────────────────────────
const s4 = State.chain(
    (v: string) => State.of<Counter, number>(v.length),
    s1
);
type _4 = Expect<Equals<typeof s4, State<Counter, number>>>;

// ── 5. put / modify / gets ────────────────────────────────────────────
const p5 = State.put<Counter>({ n: 10 });
type _5a = Expect<Equals<typeof p5, State<Counter, undefined>>>;

const m5 = State.modify<Counter>((c) => ({ n: c.n + 1 }));
type _5b = Expect<Equals<typeof m5, State<Counter, undefined>>>;

const g5 = State.gets((c: Counter) => c.n);
type _5c = Expect<Equals<typeof g5, State<Counter, number>>>;

// ── 6. Registry dispatch ──────────────────────────────────────────────
const fS = Functor.of("state");
type _6 = Expect<Equals<typeof fS, Functor<StateTypeLambda>>>;
const mS = Monad.of("state");
type _6b = Expect<Equals<typeof mS, Monad<StateTypeLambda>>>;
const aS = Applicative.of("state");
type _6c = Expect<Equals<typeof aS, Applicative<StateTypeLambda>>>;

// ── 7. Kind reduction ─────────────────────────────────────────────────
type KS = Kind<StateTypeLambda, Counter, never, never, number>;
declare const k7: KS;
const s7: State<Counter, number> = k7;

// ── 8. get is State<unknown, unknown> (polymorphism limit) ────────────
const g8 = State.get;
type _8 = Expect<Equals<typeof g8, State<unknown, unknown>>>;
const getCounter = State.get as State<Counter, Counter>;
const s8b = getCounter.map((c) => c.n);
type _8b = Expect<Equals<typeof s8b, State<Counter, number>>>;

export {};
