/**
 * Shared type-level test helpers.
 *
 * `Equals<X, Y>` — strict type equality. Evaluates to `true` only when
 * X and Y are exactly the same type (independent of assignability). This
 * catches `any`/`unknown` leaks that the simple `extends` check misses.
 *
 * `Expect<T extends true>` — consumer that fails compilation if T is not
 * literally `true`.
 *
 * Usage:
 *   type _1 = Expect<Equals<typeof x, Maybe<number>>>;
 *
 * `AssignableTo<T, U>` — the weaker one-way check, intentionally kept
 * for variance tests where we want to assert "T is a subtype of U" even
 * when they're not strictly equal (e.g. `Nothing` → `Maybe<string>`).
 */

export type Equals<X, Y> =
    (<T>() => T extends X ? 1 : 2) extends
    (<T>() => T extends Y ? 1 : 2) ? true : false;

export type Expect<T extends true> = T;

export type AssignableTo<T extends U, U> = T;
