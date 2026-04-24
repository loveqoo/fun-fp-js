import type { Kind } from "../HKT";
import { Validation } from "../data/Validation";
import type { Valid, Invalid, ValidationTypeLambda } from "../data/Validation";
import { Either } from "../data/Either";
import { Functor, Apply, Applicative } from "../TypeClasses";

type Assert<T extends U, U> = T;

// ── 1. Constructors ───────────────────────────────────────────────────
const v1 = Validation.Valid(42);
const i1 = Validation.Invalid(["bad"]);
const o1 = Validation.of(42);
type _1a = Assert<typeof v1, Valid<number>>;
type _1b = Assert<typeof i1, Invalid<string[]>>;
type _1c = Assert<typeof o1, Validation<never, number>>;

// ── 2. map preserves E, transforms A ──────────────────────────────────
declare const v2: Validation<string[], number>;
const v2b = Validation.map((n: number) => n.toString(), v2);
type _2 = Assert<typeof v2b, Validation<string[], string>>;

// ── 3. Type guards ────────────────────────────────────────────────────
declare const v3: Validation<string[], number>;
if (v3.isValid()) {
    type _3a = Assert<typeof v3, Valid<number>>;
    const val: number = v3.value;
}
if (v3.isInvalid()) {
    type _3b = Assert<typeof v3, Invalid<string[]>>;
    const errs: string[] = v3.errors;
}

// ── 4. ap accumulates errors (same E) ─────────────────────────────────
declare const vf: Validation<string[], (n: number) => string>;
declare const va: Validation<string[], number>;
const v4 = Validation.ap(vf, va);
type _4 = Assert<typeof v4, Validation<string[], string>>;

// ── 5. bimap transforms both channels ─────────────────────────────────
declare const v5: Validation<string, number>;
const v5b = Validation.bimap(
    (e: string) => [e],
    (n: number) => n.toString(),
    v5
);
type _5 = Assert<typeof v5b, Validation<string[], string>>;

// ── 6. toEither conversion ────────────────────────────────────────────
declare const v6: Validation<string[], number>;
const e6 = v6.toEither();
type _6 = Assert<typeof e6, Either<string[], number>>;

// ── 7. fromEither ─────────────────────────────────────────────────────
declare const e7: Either<string, number>;
const v7 = Validation.fromEither(e7);
type _7 = Assert<typeof v7, Validation<string, number>>;

// ── 8. fold ───────────────────────────────────────────────────────────
declare const v8: Validation<string[], number>;
const r8: string = Validation.fold(
    (errs: string[]) => errs.join(","),
    (n: number) => `ok ${n}`,
    v8
);

// ── 9. Registry: Functor.of('validation') ─────────────────────────────
const fV = Functor.of("validation");
type _9 = Assert<typeof fV, Functor<ValidationTypeLambda>>;
const aV = Applicative.of("validation");
type _9b = Assert<typeof aV, Applicative<ValidationTypeLambda>>;

// ── 10. Kind reduction ────────────────────────────────────────────────
type KV = Kind<ValidationTypeLambda, never, string[], never, number>;
declare const k10: KV;
const v10: Validation<string[], number> = k10;

export {};
