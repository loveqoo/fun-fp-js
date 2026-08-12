# CLAUDE.md

**The entire library source is one file: `index.js`.** This is deliberate, not a
migration in progress — do not split it. Navigate by section comments
(`/* Optics */`, `/* Array */`, …); line numbers drift.

Concepts and usage live in [`docs/`](./docs/README.md); its examples are executed
by the test suite.

**Principle:** structural payoff outranks immediate implementation convenience.
YAGNI is banned — it cost this repo 5 private instances and 11 top-level names,
all since reverted.

## How to work here

- **Draw the requirement out of the user.** Ask until you know what they actually
  want; do not proceed on a guess of it.
- **Report facts, not conjecture.** Run the check, quote the source. When you must
  speculate, label it as speculation.
- **When the process goes wrong, write a retrospective** so the next task inherits
  the fix rather than repeating the mistake. Before starting, read what already
  went wrong here.
- **`.dev/` is yours.** Use each subfolder for what its name says:
  `plan/` `log/` `review/` `retrospect/` `learning/` `experiment/`. Cumulative
  material belongs in that folder's `INDEX.md`, not in a per-task file.

## Traps

- Never shell-loop `npm test`; exit code stays 0.
- `type:'any'`: binary ops only; unary checks lose validation.
- `StateT` M must be a string; objects make a distinct type.
- `lookup(key)` pulls an instance from a registry (type classes); `of(value)` lifts
  a value (data types, `Applicative` instances). Type classes have no `of` — no
  test says so, and `instance.of(x)` is all over `tests/`, which reads as the opposite.
- Probe `Object.keys(fp)` before naming; never by `.lookup`. Keys nest: `plus(maybe)`.
- Green `npm test` ≠ unchanged behavior; use `npm run baseline` + mutation.
