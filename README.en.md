# fun-fp-js

> 한국어: [./README.md](./README.md)

**Fun functional programming.** A type-class library based on
[Static Land](https://github.com/fantasyland/static-land). Zero dependencies, min+gzip 26KB.

The fun comes from composition results never veering off from what you expect. The types and
operations this library provides are built to obey mathematical laws, and tests verify those
laws. Types that keep the laws behave lawfully when combined, so you don't have to test every
combination by hand. The first taste of this is right below: three functions that check name,
email, and age are chained together, and the combined check collects every failing field's error
and returns them all at once.

**Not yet published to npm.** For now, either pull the repository and use `dist/` directly, or
install from GitHub.

```bash
npm install github:loveqoo/fun-fp-js
```

After publishing, this becomes `npm install fun-fp-js`. The distributed artifact is `dist/`
either way, so what you get is the same.

## A taste — collecting errors all at once

`try/catch` stops at the first error. To collect every error, you'd normally have to write code
that manages an error array by hand.

```javascript
import fp from 'fun-fp-js';

const { Validation, Applicative } = fp;
const A = Applicative.lookup('validation');

const notEmpty = (field, s) => s.length > 0
    ? Validation.Valid(s) : Validation.Invalid([`${field} 가 비었다`]);
const isEmail = s => s.includes('@')
    ? Validation.Valid(s) : Validation.Invalid(['이메일 형식이 아니다']);
const adult = n => n >= 18
    ? Validation.Valid(n) : Validation.Invalid([`미성년: ${n}`]);

const mkUser = name => email => age => ({ name, email, age });
const validate = u =>
    A.ap(A.ap(A.ap(A.of(mkUser), notEmpty('name', u.name)), isEmail(u.email)), adult(u.age));

console.log(validate({ name: 'anthony', email: 'a@b.c', age: 40 }).value);
// { name: 'anthony', email: 'a@b.c', age: 40 }

console.log(validate({ name: '', email: 'nope', age: 12 }).errors);
// [ 'name 가 비었다', '이메일 형식이 아니다', '미성년: 12' ]   ← 셋 다 모인다
```

## Immutable updates on nested data

```javascript
import fp from 'fun-fp-js';

const { Optics } = fp;
const cityL = Optics.compose(Optics.prop('address'), Optics.prop('city'));
const user = { id: 7, address: { city: 'Seoul', zip: '04524' } };

console.log(Optics.view(cityL, user));                        // 'Seoul'
console.log(Optics.set(cityL, 'Busan', user).address.city);   // 'Busan'
console.log(user.address.city);                               // 'Seoul'  원본은 그대로
```

## Lightweight

| | Package size | Runtime dependencies |
| --- | --- | --- |
| **fun-fp-js** | **0.60 MB** | **0** |
| sanctuary | 0.23 MB | 7 |
| immutable | 0.69 MB | 0 |
| ramda | 1.15 MB | 0 |
| lodash | 1.35 MB | 0 |
| rxjs | 4.29 MB | 1 |
| fp-ts | 4.52 MB | 0 |

*(The other rows are the npm registry's `dist.unpackedSize`, measured 2026-08-14. Our own row
was re-measured 2026-08-19 with `npm pack --dry-run` — 7 files, unpackedSize 0.60MB, 0.13MB
compressed.)*

As the table shows, `sanctuary` is smaller than us. But it drags along 7 packages with it.
And our 0.60MB already bundles all four of ESM, CJS, min, and TypeScript declarations.
What actually lands in your bundle is **min+gzip 26KB**.

Zero dependencies also means vulnerability notices only ever come from our own package.

## What's inside

| | |
| --- | --- |
| Type classes | All 24 from Static Land — `Setoid` `Ord` `Monoid` `Functor` `Monad` `Traversable` … |
| 5 outside the spec | `MonadError` makes failure first-class · `Reducible` folds with no empty case · `Strong` `Choice` `Wander` used by optics |
| Data types | `Maybe` `Either` `Task` `Validation` `NonEmptyList` `Identity` `Reader` `Writer` `State` `Free` `Actor` |
| optics | `Lens` `Prism` `Iso` `Traversal` — a profunctor encoding, so everything composes |
| Transformers | `StateT` `EitherT` `ReaderT` `WriterT` |
| Free ergonomics | `Free.api` declares a vocabulary · `Free.interpreters` composes interpreters · `start` gives cooperative cancellation |
| Combinators | `compose` `pipe` `pipeWhile` `curry` `flip` `converge` `transducer` … |

Both ESM and CommonJS, with TypeScript declarations included. The syntax ceiling is **ES2018**.

**Static Land compatible** — every type class follows the Static Land interface (static methods,
argument order matching the spec). They're class instances, but the methods don't rely on `this`,
so you can pull them out as plain dictionaries. **One deviation**: `compose` on `Semigroupoid`
and `Category` follows convention (right-to-left, the same direction as `fp.compose`) rather than
the spec's direction. This matches the direction Ramda and Sanctuary give their users, and if you
need the spec's direction, use `pipe`. Rationale:
[`docs/internals.md#compose-direction`](./docs/internals.md#compose-direction).

## The docs don't go stale

**The test suite runs all 468 examples in the docs and checks each example's `// expected value`
comment against the actual output.** If a value drifts, the build stops. This README's examples
are in that count too.

The limits are noted too — the comparison only looks at lines carrying an expected-value comment
(currently 421 lines). The 67 blocks without a comment run but aren't checked against a value.
And normalization strips quotes, so it can't tell `'1'` apart from `1`. Any claim that needs that
distinction is carried by a dedicated test instead.

Links and anchors between docs are checked too (226 of them) — none of them 404 when clicked.

- [Guide](./docs/en/README.md) — learning order and per-type docs
- [Internals](./docs/internals.md) — for anyone modifying `index.js`
- [Changelog](./CHANGELOG.md)

## Status — `0.1.0`

**Not yet stable.** The public API has changed several times recently while fixing correctness
defects. Most of the defects were found by adversarial review and newly built checking
apparatus, and we're staying on `0.x` while the public API keeps changing.

**Breaking changes have piled up since `0.1.0`** — none of them have a version number yet, and
the list lives in [CHANGELOG's "Unreleased"](./CHANGELOG.md). If you're pulling the repository
directly, check that list first.

Notable fixes so far: tests now verify the laws for `ChainRec`, `Traversable`, and `Wander`, and
we fixed defects in `Task`, `Actor`, the transformers, and the `Free` runner where **failures
were silently disappearing**. Adversarial review has gone through ten rounds.

The conditions for reaching `1.0.0` are written in the
[CHANGELOG](./CHANGELOG.md#100-까지).

What holds true at the current state:

| | |
| --- | --- |
| Type classes | 29 (24 from Static Land + 5 outside the spec) |
| Registered instances | 148 (sum of distinct instances per type class) |
| Executed doc examples | 468 (421 of those lines are checked against a value) |
| Test files | 50 |
| Package | 0.60MB — all four of ESM, CJS, min, and TypeScript declarations |

## License

MIT
