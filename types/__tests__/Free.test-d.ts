import type { Kind } from "../HKT";
import { Free } from "../data/Free";
import type {
    FreeTypeLambda,
    Thunk,
    Pure,
    Impure,
} from "../data/Free";
import { Functor, Monad, Applicative } from "../TypeClasses";
import type { MaybeTypeLambda } from "../data/Maybe";
import type { Equals, Expect, AssignableTo } from "./_test-utils";


// ── 1. of / pure produce Free<F, A> ──────────────────────────────────
const f1 = Free.of<MaybeTypeLambda, number>(42);
type _1 = Expect<Equals<typeof f1, Free<MaybeTypeLambda, number>>>;

// ── 2. map / chain preserve F ─────────────────────────────────────────
const f2 = Free.map((n: number) => n.toString(), f1);
type _2 = Expect<Equals<typeof f2, Free<MaybeTypeLambda, string>>>;

const f3 = Free.chain(
    (n: number) => Free.of<MaybeTypeLambda, string>(String(n)),
    f1
);
type _3 = Expect<Equals<typeof f3, Free<MaybeTypeLambda, string>>>;

// ── 3. Instance methods ───────────────────────────────────────────────
const f4 = f1.map((n) => n + 1).chain((n) => Free.of(String(n)));
// Note: TS infers F from context; chain may widen
type _4 = Expect<Equals<typeof f4, Free<MaybeTypeLambda, string>>>;

// ── 4. Runner types are loose ─────────────────────────────────────────
const run1 = Free.runSync((cmd: unknown) => cmd);
const val1: number = run1(Free.of<MaybeTypeLambda, number>(42));
type _5a = Expect<Equals<typeof val1, number>>;

// ── 5. Thunk / trampoline ─────────────────────────────────────────────
const thunk1 = Free.Thunk.of(() => 42);
type _6 = Expect<Equals<typeof thunk1, Thunk<number>>>;
const t2 = Free.Thunk.suspend(() => 100);
const val2: number = Free.trampoline(t2);

// ── 6. Registry dispatch (F is abstract TypeLambda) ──────────────────
import type { TypeLambda } from "../HKT";
const fFree = Functor.lookup("free");
type _7 = Expect<Equals<typeof fFree, Functor<FreeTypeLambda<TypeLambda>>>>;

const mFree = Monad.lookup("free");
const aFree = Applicative.lookup("free");

// ── 7. Kind reduction ─────────────────────────────────────────────────
type KF = Kind<FreeTypeLambda<MaybeTypeLambda>, never, never, never, string>;
declare const k8: KF;
const f8: Free<MaybeTypeLambda, string> = k8;

// ── 8. Pure / Impure narrowing via type-guard predicates ──────────────
declare const program: Free<MaybeTypeLambda, number>;

if (Free.isPure<number>(program)) {
    // Narrowed via intersection: `Free<..., number> & Pure<number>`.
    // AssignableTo confirms we can access Pure's fields post-narrow.
    type _isPure = AssignableTo<typeof program, Pure<number>>;
    const v: number = program.value;
}

if (Free.isImpure<MaybeTypeLambda>(program)) {
    type _isImpure = AssignableTo<typeof program, Impure<MaybeTypeLambda>>;
    const f: unknown = program.functor;
}

// Pure from isolated construction
const pureX = Free.of<MaybeTypeLambda, string>("hi");
if (Free.isPure<string>(pureX)) {
    const s: string = pureX.value;
}

export {};
