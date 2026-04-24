import type { Kind } from "../HKT";
import { Reader } from "../data/Reader";
import type { ReaderTypeLambda } from "../data/Reader";
import { Functor, Monad, Applicative } from "../TypeClasses";

type Assert<T extends U, U> = T;

type Env = { name: string; debug: boolean };

// ── 1. of produces Reader<R, A> ───────────────────────────────────────
const r1 = Reader.of<Env, number>(42);
type _1 = Assert<typeof r1, Reader<Env, number>>;

// ── 2. run consumes env, returns A ────────────────────────────────────
declare const r2: Reader<Env, number>;
const n2: number = r2.run({ name: "x", debug: true });

// ── 3. map transforms Target ──────────────────────────────────────────
const r3 = Reader.map((n: number) => n.toString(), r1);
type _3 = Assert<typeof r3, Reader<Env, string>>;

// ── 4. chain preserves R ──────────────────────────────────────────────
const r4 = Reader.chain((n: number) => Reader.of<Env, string>(String(n)), r1);
type _4 = Assert<typeof r4, Reader<Env, string>>;

// ── 5. asks reads env via projection ──────────────────────────────────
const r5 = Reader.asks((env: Env) => env.name);
type _5 = Assert<typeof r5, Reader<Env, string>>;

// ── 6. local transforms env contravariantly ───────────────────────────
declare const r6: Reader<{ upper: string }, number>;
const r6b = Reader.local(
    (outer: Env) => ({ upper: outer.name.toUpperCase() }),
    r6
);
type _6 = Assert<typeof r6b, Reader<Env, number>>;

// ── 7. Registry dispatch ──────────────────────────────────────────────
const fR = Functor.of("reader");
type _7a = Assert<typeof fR, Functor<ReaderTypeLambda>>;
const mR = Monad.of("reader");
type _7b = Assert<typeof mR, Monad<ReaderTypeLambda>>;
const aR = Applicative.of("reader");
type _7c = Assert<typeof aR, Applicative<ReaderTypeLambda>>;

// ── 8. Instance methods ───────────────────────────────────────────────
const r8 = r1.map((n) => n + 1).chain((n) => Reader.of<Env, string>(String(n)));
type _8 = Assert<typeof r8, Reader<Env, string>>;

// ── 9. Kind reduction ─────────────────────────────────────────────────
type KR = Kind<ReaderTypeLambda, Env, never, never, number>;
declare const k9: KR;
const r9: Reader<Env, number> = k9;

// ── 10. ask is Reader<unknown, unknown> (polymorphism limit) ──────────
const ask10 = Reader.ask;
type _10 = Assert<typeof ask10, Reader<unknown, unknown>>;
// Narrow via cast when needed:
const askEnv = Reader.ask as Reader<Env, Env>;
const name = askEnv.map((e) => e.name);
type _10b = Assert<typeof name, Reader<Env, string>>;

export {};
