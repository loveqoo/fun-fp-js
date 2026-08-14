# CLAUDE.md

**The entire library source is one file: `index.js`.** This is deliberate, not a
migration in progress — do not split it. Navigate by section comments
(`/* Optics */`, `/* Array */`, …); line numbers drift.

Concepts and usage live in [`docs/`](./docs/README.md); its examples are executed
by the test suite. Rationale for how `index.js` is built lives in
[`docs/internals.md`](./docs/internals.md).

**Keep source comments to one line.** If you need more, write it in `docs/` and
leave a one-line hint pointing there — doc examples are executed, comments are not.

**Principle:** structural payoff outranks immediate implementation convenience.
YAGNI is banned — it cost this repo 5 private instances and 11 top-level names,
all since reverted.

**Nothing above ES2018**, in every hand-written `.js` here — `?.` `??` `??=` are
out (syntax cannot be polyfilled); `matchAll` → `allMatches` in `tests/utils.js`.
Rebuild `dist/` before you commit. Why, and what to write instead:
[`docs/internals.md#es-ceiling`](./docs/internals.md#es-ceiling).

## How to work here

- **Start by reading [`.dev/TODO.md`](./.dev/TODO.md), and keep it current as you
  go.** It is the only file that holds *where we are* — every other `.dev/` file is
  a record of finished work. Session memory dies at the session; this file does not.
  Every item carries a closing condition ("what must be true for this to be done"),
  and item numbers keep whatever source assigned them — never renumber a reviewer's
  findings into your own scheme. Update it when state changes, not at commit time.
- **Draw the requirement out of the user.** Ask until you know what they actually
  want; do not proceed on a guess of it.
- **Report facts, not conjecture.** Run the check, quote the source. When you must
  speculate, label it as speculation.
- **Guarantee words need a receipt.** These claims may not be written — in prose, in
  source comments, or in docs — without a command you ran *this session* and its
  output: *blocks / catches / is covered / is closed / no difference / identical /
  took N minutes / this is what the spec requires*. No receipt, then write
  **"확인 안 함"** and move on; that is a complete answer, not a failure. A claim
  about a gate needs a mutation that the gate catches — "the tests pass" is not a
  receipt, because passing tests are also what a blind gate looks like.
  Downgrading a sentence is always cheaper than retracting it later.
- **The owner does not read the code — explain in plain language, every time.**
  Your prose is the deliverable, not the diff. Say what changed and what it means
  before naming files or lines; a list of `file:line` is not an explanation. When
  you propose work, say plainly what breaks if it is skipped — and if nothing
  breaks, say that too.
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
- `Algebra.all(type)` groups by the instance's `.type`, not by registry key, and
  reads the registry as it stands. `all('maybe').maybeSemigroupoid` is `undefined`
  — that instance is Kleisli, so its `.type` is `'function'`.
- Probe `Object.keys(fp)` before naming; never by `.lookup`. Keys nest: `plus(maybe)`.
- Green `npm test` ≠ unchanged behavior; use `npm run baseline` + mutation testing
  (plant a deliberate defect, check the suite catches it, restore). Always write the
  full term — bare "mutation" reads as mutable state in an FP repo.
