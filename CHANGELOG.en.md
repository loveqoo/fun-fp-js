# Changelog

> 한국어: [./CHANGELOG.md](./CHANGELOG.md)

Changes in released versions, plus changes on `main` that have no version yet ("Unreleased").
The detailed history lives in `git log` and `.dev/`.

## Unreleased

If you consume the dist files directly: the `Commit:` line in the header tells you which point
in this file the artifact contains.

Currently empty.

## 0.2.2 — 2026-08-28

- The README is now English-first. `README.md` is the English page, and the Korean page is
  one click away at `README.ko.md`. This lowers the entry barrier on the npm front page. Korean
  remains the canonical language for the docs (the pairing convention and gates under `docs/`
  are unchanged); only the root ordering changed.
- The interpreter door moves out of the api: `api.interpreter(h)` → `Free.interpreter(api, h)`.
  The api object now carries user vocabulary only. The `'interpreter'` reserved word is gone,
  so any domain word can be a command name. (A design flaw the owner spotted during an external
  review discussion: user vocabulary and a library door were sharing one namespace.) The new
  door sits next to `Free.interpreters` (the combining one).
- `import { Maybe } from 'fun-fp-js'` now works. The runtime used to expose only a default
  export while the type declarations promised named exports, so TypeScript accepted the import
  and the runtime died with a `SyntaxError` (external review finding, reproduced). The runtime
  now provides named exports with the same roster. The default export is unchanged, so existing
  code is unaffected.
- A further pass removed the drift between the type declarations and the runtime
  registry (third external re-review, each finding verified by measurement). 26 keys
  that exist at runtime but were missing from the TS registries are now registered
  (the function monad set, identity's Chain/Monad/Extend/Comonad, Store, the tuple
  Bifunctor, object Filterable/Foldable, the tagged Choice, date/default Setoid/Ord,
  and the three Kleisli compositions), and one ghost key that existed only in TS is
  fixed (Contravariant's `function`; the runtime key is `predicate`). The identity
  instance's return type no longer narrows to `{ value }`, which lost the `map`
  surface; it is the real `Identity` again. `raiseError`'s error channel now follows
  its argument type, so assigning to the wrong channel is rejected at compile time.
  The eight direct constructions the docs teach (`new Semigroup(...)` and friends)
  are declared. A registry-parity gate now compiles every runtime lookup key.
- Five type declarations now match runtime facts (external re-review findings, each
  verified by measurement). New `fst`/`snd` declarations and value declarations for
  `Strong`/`Choice`/`Wander` (previously types only), plus six names including `Identity`
  added to the default type; `Traversable.traverse` is 3-argument like the runtime (the
  curried declaration was a runtime TypeError); the optics `dimap` typo is now `promap`;
  `Choice.left` transforms the Left side (it was a copy of `right`); and `MonadError` no
  longer poisons its slots with `never`, which had made `handleError` reject real values.
  A full-surface gate in `tests/consumer.test.js` now imports all 92 public names as
  values and compiles them.
- The shipped type declarations compile under consumer configs without `skipLibCheck`. Our
  own check never compiled the d.ts bundle, so latent errors had piled up (TS2395 ×138 among
  four kinds). Fixed: export mismatches in declaration merging, interfaces closed with `};`,
  `this` inside an object literal type, and a duplicate re-export. A consumer-view gate
  (`tests/consumer.test.js`) now guards named-import execution and nodenext compilation.
- Polished the prose of all 48 English docs. Code blocks, numbers, and meaning are unchanged;
  only the sentences were reworked.
- Rebuilt the README's opening examples. The Validation section (currying and triple-nested
  `ap`) and the Optics section are gone, replaced by three steps (compose → Maybe → Free.api)
  readable without knowing any type class.
- Narrowed the law claim in the README's first paragraph: laws are verified to the extent the
  carrier allows them, and the places a carrier cannot keep a law exactly are documented.

## 0.2.1 — 2026-08-28

A README patch. No code changes.

- The install section now says `npm install fun-fp-js`. The README shipped with 0.2.0 still
  carried the pre-publish wording (a GitHub install guide).
- Refreshed the numbers from measurement: 8 files, 0.65MB package, 990 examples (964 lines
  compared), 592 links, 55 test files, 157 instances. Added `Store` to the data-type list.
- Filled documentation gaps: dedicated pages for `Apply`, `Chain`, and `Identity` (Korean and
  English), and a combinator roster in the guide covering every top-level name. A new gate
  keeps every public name mentioned in both languages.
- Changed the `docs/` and `CHANGELOG` links in the README to absolute GitHub URLs. The npm
  package does not include those files, so relative links broke in an installed copy.

## 0.2.0 — 2026-08-28, first npm release

Installable via `npm install fun-fp-js`. Minimum Node version for consumers is 14 (the dist is
ES2018); development and tests need Node 20.

### Breaking changes

- `Writer.exec()` returns the output (log) instead of the value. For the value, use the new
  `Writer.eval()`. (Same convention as `State.exec` and Haskell's `execWriter`.)
- `transducer.transduce` changed from 4-step currying to a single 4-argument call:
  `transduce(transducer, reducer, initial, collection)`.
- The top-level `into` was renamed `pipeFrom`. It shared its name with `transducer.into`, so
  searching by name found the wrong one. `into(5)(f, g)` → `pipeFrom(5)(f, g)`.
- `ChainRec` rejects out-of-spec steps. A step must be built with `next`/`done`; anything else
  raises `ChainRec.chainRec: step must be next(...) or done(...)`. Before, an out-of-spec value
  was read as termination, so a callback typo silently succeeded. `Task` arrives as a rejection.
- `Actor` gained a default timeout of 1 second. When a handler exceeds it, that message ends as
  a rejection marked `timedOut === true` and the queue moves on. Before, a handler that never
  settled blocked the queue forever. If long handlers are normal for you, pass
  `timeout: Infinity`.
- `Actor` subscribers are notified in message order. If you need the old behavior (queue
  progress confirmed first), pass `notifyInOrder: false`.
- `range`/`rangeBy` validate that their arguments are finite integers. Code that passed strings
  like `range('3')` now throws (a usage the type declarations never allowed).
- The `Free` runners reject non-Free programs (they used to return them as success values). All
  three use the message `Free.<runner>: program must be a Free value`.

### New

- The `Store` comonad, the dual of State. A `(lookup, focus)` pair with
  `extract`/`peek`/`seek`/`experiment`/`map`/`extend`; the cache for repeated `extend` is
  `Store.memo(store, keyOf)` (keyOf required). [`docs/en/Store.md`](./docs/en/Store.md)
- The function type is a monad: the `'function'` key carries `Apply`, `Applicative`, `Chain`,
  and `Monad`. Use bare functions without wrapping (same values as the Reader monad).
  [`docs/en/internals.md#function-monad`](./docs/en/internals.md#function-monad)
- `identity` goes all the way up to `Chain` and `Monad`, so it can be a transformer's inner
  monad. `ReaderT('identity')` produces the same value as a bare `Reader`.
- `chain` checks the callback's return in strict mode. Using `chain` where `map` belongs now
  throws `callback must return <type>, got <actual>` at the site of the mistake. Lazy types'
  callbacks (Task and friends) are outside this boundary.
  [`docs/en/internals.md#chain-return`](./docs/en/internals.md#chain-return)
- `Free.api(...names)`: declare a vocabulary and you get command functions and an interpreter
  door.
- `Free.interpreters(...interpreters)`: combines the interpreters of several apis into one.
  Commands route by their origin mark, so name overlaps need no coordination.
- `interpreter.start(program)`: a `{ promise, cancel }` handle. `cancel()` is cooperative and
  takes effect at the next command boundary; a cancelled run arrives as a rejection marked
  `cancelled === true`.
- `NonEmptyList`: a list that cannot be empty. `extract` always has a value, and
  `reduceLeft`/`reduceMap` fold with only a Semigroup. 13 instances. Monoid, Plus, Alternative,
  and Filterable are deliberately absent (each would mean "an empty list").
- `Reducible`: folding with no empty case (outside the spec, extends Foldable). NonEmptyList
  and Identity are instances. [`docs/en/Reducible.md`](./docs/en/Reducible.md)
- `MonadError`: failure as a first-class value (outside the spec). `raiseError`/`handleError`,
  registered for Task and Either.
- `Actor`'s `handle` also accepts a Promise (value, Promise, or Task).
- `transducer.into(vessel, transducer, input)`: derives the reducer from the vessel type
  (array, string, Set, Map, or object). Vessel contents preserved, input untouched.
- `fp.pipeWhile(predicate)`: a pipe that continues only while the predicate holds.
- `Applicative.Writer(monoid)` / `Monad.Writer(monoid)`: Writer over any monoid.
- The dist header gained `Version:`, `Changelog:`, and `Commit:` lines.

### Fixed

- The silent-stall family: a `Task.filter` predicate that throws now arrives as a rejection
  (it used to leave the Task unsettled forever). Same family fixed in `Actor` and the `Free`
  runner.
- Object cloning (`Optics.prop`, `transducer.into`): symbol and hidden properties no longer
  vanish, an own `__proto__` no longer mutates the prototype, and frozen objects can be
  updated. [`docs/en/internals.md#copy-own`](./docs/en/internals.md#copy-own)
- The `Free` re-entry guard assimilates thenables into Promises (awaiting the result twice
  used to call `then` once more).
- `chainRec` and `traverse` for `Array` and `NonEmptyList` went from quadratic to linear.
  Measured at 32,000 steps: `chainRec` 730.9ms → 0.9ms, `traverse` 814.1ms → 2.4ms. Results
  identical. NonEmptyList's `chainRec` also blew the stack at 200k branches; it now completes.
- An `Actor` subscriber that unsubscribes itself mid-notification no longer makes later
  subscribers miss the event.
- Values built from base classes directly (`new Maybe()` and the like) no longer pass the type
  guards. Normally built values are unaffected.
- `Ord.lookup('default')` compares primitives only (number, string, boolean, bigint). Objects
  coerced to the same string, making different values "equal" both ways.
- Added `Optics.prop` to the TypeScript declarations.
- The docs example gate now compares values too. That comparison caught two stale docs (the
  multiplication-group example in internals, the `tell`-only value in WriterT) and realigned
  24 expected-value comments with actual output.
- Documented that number addition does not keep associativity exactly (IEEE 754).
  [`docs/en/internals.md#number-sum`](./docs/en/internals.md#number-sum)

## 0.1.0 — 2026-08-14

The first release. `0.x` means "usable, not yet frozen".

### What's inside

The 24 type classes of the Static Land specification, and the data types, optics, and
transformers built on them.

| | |
| --- | --- |
| Registered instances | 133 |
| Instances under law tests | 88 |
| Executed doc examples | 417 |
| Test files | 44 |

Doc examples are executed by the tests. At `0.1.0` the gate only executed them without
comparing `// expected` values; value comparison arrived in `0.2.0`.

### Distribution

- Both ESM and CommonJS (resolved via the `exports` field), TypeScript declarations included.
- The package ships `dist/` and the README only; zero runtime dependencies; the syntax ceiling
  is ES2018.

### What changed before 0.1.0

While the version was `0.0.0`, the public surface changed several times. Nobody could have
pinned it, so there is no migration guide. Most changes were spec violations found by newly
built gates. The full table is in the Korean changelog ([0.1.0 section](./CHANGELOG.md)).

## Until 1.0.0 {#until-1-0-0}

`1.0.0` is a promise not to change this API anymore. What must be true before freezing:

1. No holes in the law gates. `ChainRec`, `Traversable`, and `Wander` are law-tested, or it is
   established that they cannot be, with a written account of what guards them instead.
2. A full audit after the last breaking change finds nothing.
3. There is a record of real use.
4. The `lookup`/`of` distinction is on the docs' front page, and `Maybe`/`Either` output is
   readable.

Progress lives in [`.dev/TODO.md`](./.dev/TODO.md).
