# fun-fp-js

> 한국어: [./README.ko.md](./README.ko.md)

**Fun functional programming.** A type-class library based on
[Static Land](https://github.com/fantasyland/static-land). Zero dependencies, min+gzip 26KB.

The fun comes from composition results never veering off from what you expect. The types and
operations this library provides are built to obey mathematical laws, and tests verify those
laws to the extent the carrier allows them. Where a carrier itself cannot keep a law exactly
(floating-point addition and associativity, for one), we say so in the docs instead of hiding it
([internals](https://github.com/loveqoo/fun-fp-js/blob/main/docs/en/internals.md#number-sum)). Types that keep the laws behave lawfully when combined, so you don't have to test every
combination by hand. The three steps below are the taste: compose functions, handle absent
values safely, and keep a program separate from its execution.

```bash
npm install fun-fp-js
```

The package ships `dist/` (ESM, CJS, min, type declarations) and the READMEs. Source and tests
live in the repository.

## A taste, in three steps

Join two functions and you get a new one. `compose` applies right to left.

```javascript
import { compose } from 'fun-fp-js';

const discount = price => price - 1000;
const addTax = price => price * 1.1;
const finalPrice = compose(addTax, discount);   // discount first, then tax

console.log(finalPrice(10000));   // 9900
```

When a value may be absent, put it in a `Maybe`. `map` skips the absent case for you,
and the null checks disappear.

```javascript
import { Maybe } from 'fun-fp-js';

const first = xs => xs.length ? Maybe.Just(xs[0]) : Maybe.Nothing();

console.log(String(first([7, 8]).map(n => n * 10)));   // Just(70)
console.log(String(first([]).map(n => n * 10)));       // Nothing   skipped
```

`Free.api` keeps a program separate from its execution. The same program runs under a real
interpreter or a test interpreter, with no mocking framework involved.

```javascript
import { Free } from 'fun-fp-js';

const api = Free.api('fetchUser', 'log');
const program = api.fetchUser(1).chain(user => api.log('hello ' + user.name));

const real = Free.interpreter(api, { fetchUser: id => ({ id, name: 'kim' }), log: msg => msg });
const test = Free.interpreter(api, { fetchUser: id => ({ id, name: 'test' }), log: msg => msg });

real.run(program).then(r => console.log(r));   // hello kim
test.run(program).then(r => console.log(r));   // hello test   same program, different run
```

## Lightweight

| | Package size | Runtime dependencies |
| --- | --- | --- |
| **fun-fp-js** | **0.65 MB** | **0** |
| sanctuary | 0.23 MB | 7 |
| immutable | 0.69 MB | 0 |
| ramda | 1.15 MB | 0 |
| lodash | 1.35 MB | 0 |
| rxjs | 4.29 MB | 1 |
| fp-ts | 4.52 MB | 0 |

*(The other rows are the npm registry's `dist.unpackedSize`, measured 2026-08-14. Our own row
was re-measured 2026-08-28 with `npm pack --dry-run`: 8 files, unpackedSize 0.65MB, 0.15MB
compressed.)*

As the table shows, `sanctuary` is smaller than us. But it drags along 7 packages with it.
And our 0.65MB already bundles all four of ESM, CJS, min, and TypeScript declarations.
What actually lands in your bundle is **min+gzip 26KB**.

Zero dependencies also means vulnerability notices only ever come from our own package.

## What's inside

| | |
| --- | --- |
| Type classes | All 24 from Static Land: `Setoid` `Ord` `Monoid` `Functor` `Monad` `Traversable` … |
| 5 outside the spec | `MonadError` makes failure first-class · `Reducible` folds with no empty case · `Strong` `Choice` `Wander` used by optics |
| Data types | `Maybe` `Either` `Task` `Validation` `NonEmptyList` `Identity` `Reader` `Writer` `State` `Store` `Free` `Actor` |
| optics | `Lens` `Prism` `Iso` `Traversal`, a profunctor encoding, so everything composes |
| Transformers | `StateT` `EitherT` `ReaderT` `WriterT` |
| Free ergonomics | `Free.api` declares a vocabulary · `Free.interpreters` composes interpreters · `start` gives cooperative cancellation |
| Combinators | `compose` `pipe` `pipeWhile` `curry` `flip` `converge` `transducer` … |

Both ESM and CommonJS, with TypeScript declarations included. The syntax ceiling is **ES2018**.

**Static Land compatible**: every type class follows the Static Land interface (static methods,
argument order matching the spec). They're class instances, but the methods don't rely on `this`,
so you can pull them out as plain dictionaries. **One deviation**: `compose` on `Semigroupoid`
and `Category` follows convention (right-to-left, the same direction as `fp.compose`) rather than
the spec's direction. This matches the direction Ramda and Sanctuary give their users, and if you
need the spec's direction, use `pipe`. Rationale:
[`docs/internals.md#compose-direction`](https://github.com/loveqoo/fun-fp-js/blob/main/docs/en/internals.md#compose-direction).

## The docs are tested too

**The test suite runs all 992 examples in the docs (English pages included) and checks each example's `// expected value`
comment against the actual output.** If a value drifts, the tests and the npm publish stop. This README's examples
are in that count too.

The limits are noted too: the comparison only looks at lines carrying an expected-value comment
(currently 974 lines). The 134 blocks without a comment run but aren't checked against a value
(the 406 blocks with no output at all are outside the comparison).
And normalization strips quotes, so it can't tell `'1'` apart from `1`. Any claim that needs that
distinction is carried by a dedicated test instead.

The 592 relative links and anchors between docs inside the repository are checked too: within that scope, none of them 404 when clicked (external URLs are outside the gate).

- [Guide](https://github.com/loveqoo/fun-fp-js/blob/main/docs/en/README.md): learning order and per-type docs
- [Internals](https://github.com/loveqoo/fun-fp-js/blob/main/docs/en/internals.md): for anyone modifying `index.js`
- [Changelog](https://github.com/loveqoo/fun-fp-js/blob/main/CHANGELOG.en.md)

## Status — `0.2.x`

**During `0.x` the public API may still change.** Every change is recorded with its version in
the [CHANGELOG](https://github.com/loveqoo/fun-fp-js/blob/main/CHANGELOG.en.md), where the breaking changes since `0.1.0` are listed under `0.2.0`.

Correctness is held by adversarial review (Codex: ten full audits of `index.js`, plus a review
for every change since) and by gates verified with mutation testing. Notable fixes: laws for
`ChainRec`, `Traversable`, and `Wander` are verified, and defects where **failures silently
disappeared** in `Task`, `Actor`, the transformers, and the `Free` runner are fixed.

The conditions for reaching `1.0.0` are written in the
[CHANGELOG](https://github.com/loveqoo/fun-fp-js/blob/main/CHANGELOG.en.md#until-1-0-0).

What holds true at the current state:

| | |
| --- | --- |
| Type classes | 29 (24 from Static Land + 5 outside the spec) |
| Registered instances | 157 (sum of distinct instances per type class) |
| Executed doc examples | 992 (974 of those lines are checked against a value) |
| Test files | 56 |
| Package | 0.65MB, all four of ESM, CJS, min, and TypeScript declarations |

## License

MIT
