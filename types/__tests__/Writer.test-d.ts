import type { Kind } from "../HKT";
import { Writer } from "../data/Writer";
import type { WriterTypeLambda } from "../data/Writer";
import { Functor, Monad, Applicative } from "../TypeClasses";
import type { Equals, Expect, AssignableTo } from "./_test-utils";


// ── 1. of / tell ──────────────────────────────────────────────────────
const w1 = Writer.of<number, string[]>(42);
type _1 = Expect<Equals<typeof w1, Writer<string[], number>>>;

const t1 = Writer.tell<string[]>(["logged"]);
type _1b = Expect<Equals<typeof t1, Writer<string[], undefined>>>;

// ── 2. run → [A, W] ──────────────────────────────────────────────────
declare const w2: Writer<string[], number>;
const pair: [number, string[]] = w2.run();

// ── 3. map transforms Target ──────────────────────────────────────────
const w3 = Writer.map((n: number) => n.toString(), w1);
type _3 = Expect<Equals<typeof w3, Writer<string[], string>>>;

// ── 4. chain preserves W ──────────────────────────────────────────────
const w4 = Writer.chain(
    (n: number) => Writer.of<string, string[]>(n.toString()),
    w1
);
type _4 = Expect<Equals<typeof w4, Writer<string[], string>>>;

// ── 5. listen / listens ───────────────────────────────────────────────
const w5 = Writer.listen(w1);
type _5a = Expect<Equals<typeof w5, Writer<string[], [number, string[]]>>>;

const w5b = Writer.listens((output: string[]) => output.length, w1);
type _5b = Expect<Equals<typeof w5b, Writer<string[], [number, number]>>>;

// ── 6. censor ─────────────────────────────────────────────────────────
const w6 = Writer.censor(
    (out: string[]) => out.map((s) => s.toUpperCase()),
    w1
);
type _6 = Expect<Equals<typeof w6, Writer<string[], number>>>;

// ── 7. Registry dispatch ──────────────────────────────────────────────
const fW = Functor.lookup("writer");
type _7 = Expect<Equals<typeof fW, Functor<WriterTypeLambda>>>;
const mW = Monad.lookup("writer");
type _7b = Expect<Equals<typeof mW, Monad<WriterTypeLambda>>>;
const aW = Applicative.lookup("writer");
type _7c = Expect<Equals<typeof aW, Applicative<WriterTypeLambda>>>;

// ── 8. Kind reduction ─────────────────────────────────────────────────
type KW = Kind<WriterTypeLambda, never, never, string[], number>;
declare const k8: KW;
const w8: Writer<string[], number> = k8;

// ── 9. pass: value carries a (W → W) transform ────────────────────────
declare const wp: Writer<string[], [number, (w: string[]) => string[]]>;
const w9 = Writer.pass(wp);
type _9 = Expect<Equals<typeof w9, Writer<string[], number>>>;

export {};
