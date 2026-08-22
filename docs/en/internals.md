# Internals — why things are built this way

> 한국어: [../internals.md](../internals.md)

**This document is for people editing `index.js`.** How to *use* the library
lives in the [README](./README.md) and each type's document.

The examples here are also run by `npm test` — **if the explanation drifts from the
code, the build goes red.** Source comments carry only a one-line hint; the
reasoning gathers here.

---

## Where does a constrained instance get built? {#constrained-instances}

There is no `Semigroup.lookup('maybe')`. `Maybe`'s `Semigroup` only exists **when
the inner type also has a `Semigroup`**.

```
instance Semigroup a => Semigroup (Maybe a)
         ^^^^^^^^^^^ this constraint
```

Haskell resolves this constraint at compile time. There is no compiler here, so
**the constraint comes in as an argument** — that is the factory.

```javascript
Semigroup.lookup('maybe')      // none — the constraint was never resolved
Semigroup.Maybe('array')       // present — the inner type is pinned to array
Semigroup.lookup('maybe(array)')  // also works, once the factory has been called
```

### There is one rule — it lives on the type class side

| | |
| --- | --- |
| `Semigroup.Maybe` `Monoid.Maybe` `Setoid.Maybe` `Ord.Maybe` | |
| `Semigroup.Either` `Setoid.Either` | |
| `Setoid.Array` `Ord.Array` `Setoid.Struct` | |
| `Applicative.Const` `Wander.Forget` | |

Two grounds.

**One — it returns the same thing `lookup` returns.** Data types produce values
(`Maybe.of`) and type classes produce instances (`Semigroup.lookup`). A factory
produces an instance, so it belongs on the type class side. This line is what
[`tests/registry-api.test.js`](../../tests/registry-api.test.js) enforced from the
start.

**Two — the name reads in type order.**

```
Semigroup.Maybe('array')   →  Semigroup < Maybe < Array > >     correct
Maybe.Semigroup('array')   →  Maybe < Semigroup < Array > >     no such value
```

`concat(Just([1]), Just([2]))` is `Just([1,2])`. It is not `Just(a Semigroup
instance)`.

### The rule used to be two rules (fixed 2026-08-14)

Six instances lived under `Maybe.Semigroup`, five under `Setoid.Array`, side by
side. At 5:6 neither side could be called the exception, and **no gate was
watching this.** 138 spots were renamed to merge them into one, and the gate was
added to `registry-api` (it catches all three planted mutations).

Something else surfaced along the way: `Semigroup.Either`'s type declaration took
**one argument** while the runtime required **two**. Written in TypeScript it
passed; run it and it threw. The declaration was fixed to match the runtime —
`Either` concats both the Left and Right channels, so two is correct.


## `.type` — the type an instance operates on {#type}

Every instance inherits `Algebra` and carries a `.type`. It is **the type of the
value the instance's operations take as arguments**, and it must be the
**canonical tag** that `types.of()` returns.

```javascript
const { Setoid, Functor, Semigroupoid } = FunFP;

console.log(Setoid.lookup('date').type);        // 'Date'      capitalized — types.of(new Date())
console.log(Functor.lookup('array').type);      // 'Array'
console.log(Semigroupoid.lookup('maybe').type); // 'function'  Kleisli composition, so the argument is a function
```

The last line is the trap. **The registry key and `.type` are not the same
thing.** It was fetched with the key `maybe`, but what `compose(f, g)` takes is a
**function** of shape `a -> Maybe b`.

### Case sensitivity is safe only conditionally

There are two check paths, and only one has a fallback.

Most checks go through `types.check(val, type)`, and **that path has a
case-insensitive fallback** — writing `'date'` still passes. But there are three
places that compare `.type` **literally**, and the three disagree on what happens
when it mismatches.

| Site | Comparison | On mismatch |
| --- | --- | --- |
| `Apply.ap` | `types.equals(fs, values, instance.type)` | **throws** |
| `Alt.alt` | `types.equals(a, b, instance.type)` | **throws** |
| `unwrapIfSameType` | `instance.type !== source.type` | **silently leaves the wrapper on** — the value is still correct |

Seeing only the first two and concluding "my instance never goes through
`Apply`/`Alt`, so lowercase is safe" is wrong. The third is called by
`Monoid`/`Apply`/`Applicative`/`Alt`/`Plus` **constructors**, so it applies far
more broadly.

```javascript
const { Functor, Apply } = FunFP;

const build = (fType, aType) => {
    const f = new Functor((g, x) => ({ value: g(x.value) }), fType);
    const a = new Apply(f, (ff, fa) => ({ value: ff.value(fa.value) }), aType);
    return a.map === f.map;              // did the wrapper layer come off
};

console.log(build('Object', 'Object'));  // true   same tag, so it unwraps
console.log(build('object', 'Object'));  // false  even a case-only mismatch keeps the wrapper
```

**The third case does not create a bug** — an extra check layer just stays on;
the value and the errors come out the same either way. That is exactly why it is
more dangerous: the first two announce the problem by throwing, this one says
nothing at all.

For a type with no `Apply`/`Alt` instance, writing the tag lowercase does not
**throw**. On 2026-08-13 four instances were found in exactly that state —
`DateSetoid`/`DateOrd` (`'date'`) and `ObjectFilterable`/`ObjectFoldable`
(`'object'`) — landmines that would go off the moment `Apply` or `Alt` was added
for that type.

`tests/algebra-type.test.js` enforces two things for every registered instance —
① does the tag actually pass through `Apply.ap` ② does it match the naming
prefix/exception table.

### `.type` leaks into error messages

```javascript
const { Filterable } = FunFP;

try { Filterable.lookup('object').filter(x => x, [1]); }
catch (e) { console.log(e.message); }  // 'Filterable.filter: arguments must be (function, Object)'
```

---

## `'any'` — instances that ignore the value type {#any}

`first`/`last` are `(a, b) => a` · `(a, b) => b`, so they do not care about the
value's type. Their `.type` is therefore `'any'`, and `types.check` always lets
them through. **The check that "both arguments must be the same type" is still
alive, though** — that is the only failure reason left under `'any'`.

```javascript
const { Semigroup } = FunFP;

console.log(Semigroup.lookup('first').concat(1, 2));   // 1
try { Semigroup.lookup('first').concat(1, 'a'); }
catch (e) { console.log(e.message); }  // 'Semigroup.concat: arguments must be the same type'
```

It used to live in the `/* Object */` section and was registered as `'object'`,
but that was **just where it happened to sit** — its type declaration
(`readonly first: unknown` in `types/data/builtins.d.ts`) always meant every
type.

### `lookup('default')` is also `'any'` — so it rejects mixed-type arguments

`DefaultSetoid` (`===`) and `DefaultOrd` (`<=`) also ignore the value type, so
they are `'any'`. **"Default" in the name does not mean it accepts any two
values** — the one check that survives under `'any'`, namely "both arguments must
be the same type," applies here too.

```javascript
const { Setoid, Ord } = FunFP;

console.log(Setoid.lookup('default').equals(1, 1));   // true
console.log(Ord.lookup('default').lte(1, 2));         // true

try { Setoid.lookup('default').equals(1, 'a'); }
catch (e) { console.log(e.message); }  // 'Setoid.equals: arguments must be the same type'
try { Ord.lookup('default').lte(1, 'a'); }
catch (e) { console.log(e.message); }  // 'Ord.lte: arguments must be the same type'
```

These two used to be **plain object literals** outside the registry (`{ equals:
Setoid.op }`). Back then, mixed-type arguments silently returned `false`, and
because a fresh object came back on every lookup, the container cache did not
line up either. Now that they are proper instances, they follow the same rule as
every other `Setoid` — **instead of silently giving a wrong answer, it stops and
says "cannot compare."**

**Neither of these is a Monoid — there is no identity element.**
`FirstMonoid`/`LastMonoid` were removed for that reason in commit `e3d2b82`. When
a Monoid is needed, wrap in `Maybe` — and **which one you want splits into two
paths.**

| | What it does |
| --- | --- |
| `Monoid.Maybe('first')` (= `maybe(first)`) | when both are `Just`, merges **the inner values** with `first` |
| `Monoid.lookup('maybe')` | picks the first `Just` **whole, without opening it** |

When the payload types match, the results match too. **They only diverge when the
types are mixed**, and there the first one hits the inner `concat`'s type check
and throws.

```javascript
const { Maybe, Monoid } = FunFP;

const merge = Monoid.Maybe('first');
const pick = Monoid.lookup('maybe');

console.log(merge.concat(Maybe.Just(1), Maybe.Just(2)).value);  // 1  — the merged inner result
console.log(pick.concat(Maybe.Just(1), Maybe.Just(2)).value);   // 1  — same here

try { merge.concat(Maybe.Just(1), Maybe.Just('a')); }
catch (e) { console.log('merge: throws'); }                     // merge: throws   mismatched types throw
console.log(pick.concat(Maybe.Just(1), Maybe.Just('a')).value); // 1  — never opened, so it passes
```

**Use the first one for "merging," the second for "picking."**

---

## Deriving `Monoid` from `Plus` {#plus-monoid}

`Plus` carries both `alt` (an associative binary operation) and `zero` (an
identity element), so it is **structurally a Monoid already** — it is only
missing the tag. So a registered `Plus` gets its paired `Semigroup`/`Monoid`
**under that type's own name.** No special case is written down anywhere, so
**registering a new `Plus` automatically brings its pair along with it.**

**Except when that type already has a `Monoid` — then nothing is derived.**
`Array` is such a case — its `alt` is literally `concat`, so the derived version
and `ArrayMonoid` behave identically (verified). Forcing the registration anyway
would make `registerAs` silently overwrite `ArrayMonoid`.

> **At one point this key was `plus(<alias>)`. That was a bug.** In this library,
> `f(x)` means `F<X>`, but `plus(maybe)` returned a `Monoid`, not a `Plus` — the
> actual `Plus<Maybe>` was just `Plus.lookup('maybe')`. What was inside the
> parentheses was not an element, it was **where it came from** — and provenance
> is not a type (owner's ruling, 2026-08-14).

```javascript
const { Semigroup, Monoid, Plus, Maybe } = FunFP;

console.log(Monoid.lookup('maybe').empty().isNothing());        // true   derived from Plus
console.log(Semigroup.lookup('maybe').concat(Maybe.Just(1), Maybe.Just(2)).value);  // 1
console.log(Plus.lookup('maybe').zero().isNothing());           // true  the same operation
```

There is a reason `register()` is not used for the derivation. `register()` also
stores the key under `instance.constructor.name`, and a derived instance's class
name is just `Monoid`, so it creates `Monoid.types['Monoid']` and **different
`Plus` instances overwrite each other there.** So, following the precedent set by
`Monoid.Maybe`, the key is inserted directly.

---

## `Identity` / `Const` — the two Applicatives passed into `traverse` {#identity-const}

| | What it does | Where it's used |
| --- | --- | --- |
| `identity` | carries the value through unchanged | turns `traverse` into "plain mapping" — `over` in optics |
| `const(<monoid>)` | drops the value and only accumulates via the monoid | turns `traverse` into "folding" — `preview` in optics |

**Having an object shape and having type `Object` are different statements.**
Each of these has its own type — `Identity` and `Const(<monoid key>)`. The
carrier announces its own identity.

At one point `Identity`, `Const`, and plain objects were **all three `'Object'`**.
Back then they bled into each other (verified):

```
a Const carrier into Identity.map    → passed
an Identity carrier into Const.map   → passed
a plain { a: 1 } into Identity.map   → passed (the result was {})
Identity into ObjectFoldable         → passed
```

Now all four are rejected. **If there is an inner value type, the type must be
its own type, not `Object`, and the tag must say what type that value is**
(owner's ruling, 2026-08-14).

### A tag alone was not enough — `Identity` is a class

At first it was just an object literal `{ value, _typeName: 'Identity' }` with a
name tacked on. Owner's ruling (2026-08-15): *"Making a subtype of Object and
sticking a type name on it was the cheap fix that went wrong."*

`_typeName`'s job is **sum-type convergence** — both `Just` and `Nothing` carry
`'Maybe'`, so `types.of` routes them to one instance. It is not a type
declaration. This repository's design is **types are defined with symbols, and
values are stamped with strings.**

So `Identity` sits at the same level as `Maybe`.

```javascript
const { Identity } = FunFP;

const id = Identity.of(5);
console.log(id.constructor.name);          // 'Identity'   a plain object literal would say 'Object'
console.log(id instanceof Identity);       // true
console.log(id.map(x => x * 2).value);     // 10
console.log(id.extract());                 // 5

console.log(Identity.isIdentity(id));                                   // true
console.log(Identity.isIdentity({ value: 5, _typeName: 'Identity' }));  // false  a copy, not the real thing
```

**Only `isIdentity` looks at the symbol.** [`types.of`](#type) reads the
`_typeName` string, so an object with that string copied onto it **passes**
type-class methods.

```javascript
const { Functor } = FunFP;
console.log(Functor.lookup('identity').map(x => x + 1, { value: 5, _typeName: 'Identity' }).value);
// 6   ← passes. the string can be copied.
```

A mechanism that pulled the symbol into the value-check path was built and then
**pulled back out by owner's decision** (2026-08-15) — it was an unagreed
implementation. And even that mechanism was not a complete block either.
`Symbol.for` is a global registry, so with intent someone can open the same slot
(verified).

`Const` and `Forget` are also classes — the same rule: **if the shape it carries
is fixed, declare it as a class** (owner, 2026-08-15). Their shape is the
opposite of `Identity`'s, though.

| | Class | `_typeName` |
| --- | --- | --- |
| `Maybe` | **two** — `Just` · `Nothing` | **one** `'Maybe'` — the variants converge |
| `Const` | **one** — `Const` | **many** — `'Const(array)'` · `'Const(number)'`, one per monoid |

```javascript
const { Applicative, Wander, Monoid } = FunFP;

const c = Applicative.Const('array').wrap([1]);
console.log(c.constructor.name);   // 'Const'          a plain object literal would say 'Object'
console.log(c._typeName);          // 'Const(array)'

const p = Wander.Forget(Monoid.lookup('array')).wrap(a => [a]);
console.log(p.constructor.name);   // 'Forget'
console.log(typeof p.run);         // 'function'       what it holds is a function
```

None of the three has a public entry point — only `fp.Identity` sits at the top
level; `Const` and `Forget` are reachable only through their factories.

```javascript
const { Traversable, Applicative, Functor } = FunFP;

const Id = Applicative.lookup('identity');
console.log(Traversable.lookup('array').traverse(Id, x => Id.of(x + 1), [1, 2, 3]).value);
// [ 2, 3, 4 ]
console.log(Functor.lookup('identity').map(x => x + 1, Id.of(1)).value);   // 2
```

`Apply.ap` compares tags **literally** via `types.equals(a, b, instance.type)`
([no case fallback](#type)), so the carrier's `_typeName` and the instance's
`.type` must match exactly. `Const`'s tag varies per monoid — `Const(array)`,
`Const(number)`.

### An unkeyed monoid is told apart by a unique number {#anon-monoid-tag}

A registered monoid has a key, so its tag splits cleanly, e.g. `Const(array)`.
But a **hand-built, unregistered monoid** has no key, and at one point all of
them shared the same bare `'Const'` tag — a sum-monoid Const and a
product-monoid Const carrier bled into each other (a Codex review caught it).
Now the same trick used for the transformers' `_transformerAutoId` gives each
**an instance-specific unique number** — `Const(#1)`, `Const(#2)`. `Forget` had
the same disease and was fixed the same way (`Forget(#N)`).

```javascript
const { Applicative, Semigroup, Monoid } = FunFP;

const sum = new Monoid(new Semigroup((a, b) => a + b, 'number'), () => 0, 'number');
const product = new Monoid(new Semigroup((a, b) => a * b, 'number'), () => 1, 'number');
const A = Applicative.Const(sum), B = Applicative.Const(product);
if (A.wrap(2)._typeName === B.wrap(3)._typeName) throw new Error('anonymous monoid tags did not split');
console.log(A.wrap(2)._typeName !== B.wrap(3)._typeName);   // true — different tags, so they do not mix
```

This number is not a registry lookup key, it is **for telling carriers apart at
runtime** (the tag itself is what `types.of` reads), so it only needs to be
"unique within one run." A WeakMap cache is built once per monoid, so it stays
stable for that monoid.

### `Writer` factory — the registered one is Array-only, other monoids go through the factory {#writer-factory-internals}

The registered `writer` instance's `of` is `Writer.of`'s default, so it **always
stamps in the Array monoid.** So running a law like `chain(of, w)` against a
Writer built on a different monoid ends up mixing monoids and throws (a Codex
review caught it). This is solved with the same factory pattern as `Const` —
`buildWriterMonad(monoid)` builds an Applicative/Monad whose `of` closes over
that monoid, and if the monoid has a key, registers it across five levels
(Functor through Monad) as `writer(<key>)`. **`of` is the only thing that
depends on the monoid**, so `map`/`ap`/`chain` are simply borrowed from the
registered instance. The cache follows the same shape as `Const` — `_keyCache`
for keyed monoids, `_instanceCache` (WeakMap) for unregistered instances. Usage:
[`docs/Writer.md#writer-factory`](./Writer.md#writer-factory).

Registration is **three levels** — `Functor` → `Apply` → `Applicative`. Raising
only `Applicative` would make `Functor.lookup('const(array)')` fail.

---

## Where the check layer gets stripped — `unwrapIfSameType` {#unwrap}

The `map`/`ap` handed up to a superclass are **already wrapped in a check.** When
`type` matches, the check the superclass would wrap is **literally identical**
(both are `types.isFunction(f) && types.check(a, instance.type)`), so the outer
layer adds no safety. **That is the only ground for stripping it.** When `type`
differs, the outer check is a different check, and it is left alone.

`Alternative` avoiding re-wrapping via `this.alt = plus.alt` is the same
treatment.

**Do not cite performance as the reason.** The same round of changes switched
`first`/`left` to delegate through `Bifunctor.bimap`, adding a fresh registry
lookup per element, and **that cost is bigger than the layer it stripped**
(measured, 1.37–1.60×). Reusing the registry is still the right call and is not
being reverted.

---

## The Profunctor encoding of optics {#optics}

```
Optic s a = P => P a a -> P s s
```

**Which `P` gets injected determines the operation.** One definition yields
reading, writing, and reconstruction all at once.

| Injected P | Resulting operation | Methods required |
| --- | --- | --- |
| a function | `over` / `set` | `dimap` `first` `left` `wander` |
| `Forget<r>` | `view` / `preview` / `toList` / `foldMapOf` | same (accumulated via a monoid) |
| `Tagged` | `review` | `dimap` `left` only |

**The fact that `Tagged` has no `first` and no `wander` stands in for type
safety** — using `review` on a Lens or a Traversal throws a `TypeError` right
there.

### `Forget`'s carrier is wrapped {#forget-newtype}

`Forget<r> a b = a -> r`, so the carrier can be **a bare function.** It actually
was one, and that is why its `.type` was `'function'` — **the same tag** as
`FunctionWander`.

All four of these used to pass (verified, before 2026-08-15):

```
a plain function x=>x*2 into the Forget instance   → passed
a Forget carrier into the function instance        → passed
Forget<array>.left branching to 6 and [] → only concat-ing the two throws
```

Now the carrier is `{ run, _typeName: 'Forget(array)' }`, and `wrap`/`unwrap` are
the door (the same shape as `Applicative.Const`). All four are now rejected.

Since `wrap` passes through `Const.wrap`, **if `f` does not produce a monoid
value, it fails right there.** Before, only the Traversal path caught this —
`concat` only shows up once it goes through `traverse`, while a Lens only uses
`first`:

```
foldMapOf('array', traversed('array'), x => x*2, [1,2])  → threw     (Traversal)
foldMapOf('array', prop('a'),          x => x*2, {a:3})  → was 6     (Lens)
```

```javascript
const { Optics } = FunFP;

const aLens = Optics.Lens(o => o.a, (b, o) => ({ ...o, a: b }));
try { Optics.review(aLens, 1); }
catch (e) { console.log('review on a Lens throws'); }
```

Because `P` is the first argument, **plain `compose` cannot compose these** —
that's why there is a separate `Optics.compose`.

### The methods the three dictionaries share determine the kind of optic

| Method | Meaning | Optic produced |
| --- | --- | --- |
| `first` | product — touches one side of a pair `[a, c]` | Lens |
| `left` | sum — touches only `Either`'s `Left` | Prism |
| `wander` | traversal — touches every slot inside a container | Traversal |

### Why `Iso` sits at the top of the optic hierarchy

`Iso` uses **only `dimap`.** All three `P`s have `dimap`, so **it works with
every operation** — it is both a Lens and a Prism, so both `view` and `review`
work on it.

```javascript
const { Optics } = FunFP;

const doubled = Optics.Iso(c => c * 2, x => x / 2);
console.log(Optics.view(doubled, 21));                  // 42
console.log(Optics.review(doubled, 42));                // 21   a Lens cannot do this
```

The law is lossless conversion — `from(to(s)) === s`, `to(from(a)) === a`.

### `view` counts its targets

`view` is Lens/Iso-only — **"exactly one target" is enforced by code, not just
documented.**

`review` is protected structurally (`Tagged` has no `first`/`wander`). But
`Forget`, on the `view` side, **does** have `wander`, so passing it a Traversal
still runs. So counting the targets is the only way — zero means it does not
silently leak `undefined`, and two or more means it does not silently hand back
just the first value.

```javascript
const { Optics } = FunFP;

const each = Optics.traversed('array');
console.log(Optics.view(each, [7]));                       // 7   fine with exactly one target
try { Optics.view(each, [1, 2, 3]); }
catch (e) { console.log(e.message); }
// 'view: expected exactly one target, got 3 — use preview or toList'
```

### The reading trio are all special cases of `foldMapOf`

They differ only in what they fold into. The argument order matches
`over(optic, f, s)`, with the monoid placed first.

**The monoid is never used on the `first` path (Lens/Iso).** So without a check,
whether it passes or not would depend on the kind of optic — this is required
under the same rule as the existing `foldMap(foldable, monoid)`. Registration is
not required; anything built with `new Monoid(...)` works.

**The monoid `preview` uses is `Monoid.lookup('maybe')`.** `preview` "picks" a
target rather than "merging" them, so it must pick the option that does not open
the container. Using `maybe(first)` would try to merge the inner values and
**throw on a mixed-type target** — "give me the first one" should be answerable
no matter what an array holds.

```javascript
const { Optics } = FunFP;
const { preview, traversed } = Optics;

console.log(preview(traversed('array'), [1, 'a']).value);   // 1   still answers with the first, even mixed
console.log(preview(traversed('array'), []).isNothing());   // true
```

---

### The three Ps are registered instances, not private dictionaries

The three injected are `Strong`/`Choice`/`Wander` instances and live in the
registry. So the law suite, the spec check, and the `.type` gate all see them
too.

| Registry | Keys |
| --- | --- |
| `Strong` | `FunctionStrong` · `forget(<monoid key>)` |
| `Choice` | `FunctionChoice` · `forget(<monoid key>)` · `TaggedChoice` |
| `Wander` | `FunctionWander` · `forget(<monoid key>)` |

```javascript
const { Strong, Choice, Wander, Either } = FunFP;

const S = Strong.lookup('function');
console.log(S.first(x => x * 10)([3, 'c']));    // [ 30, 'c' ]   touches only the left
console.log(S.second(x => x * 10)(['c', 3]));   // [ 'c', 30 ]   touches only the right

const W = Wander.lookup('function');
console.log(W.left(x => x * 10)(Either.Left(4)).value);    // 40   Left only
console.log(W.left(x => x * 10)(Either.Right(4)).value);   // 4    Right passes through
```

**`Tagged` only exists under `Choice`.** It is missing from `Strong` and
`Wander`, and that **absence** is exactly what says "Lenses and Traversals
cannot be `review`ed." Structure does the job a throwing stub used to do.

`Tagged` is not registered in the `Profunctor` registry either. The spec requires
a `Profunctor` to become a `Functor` when its first parameter is fixed, and there
is no `Functor` with `.type` `'any'` — **a guarantee that cannot be kept is not
made** (the same judgment call as dropping `Either`/`Task` from `Filterable`).

### Why it was not registered as a type class at first — and why that reversed

**On 2026-08-11 the decision went the other way.** Three grounds.

1. **JS/TS precedent is unanimously internal.** `optika` uses a profunctor
   encoding but files it under "Internals — Functions which you probably never
   need to use directly," and `monocle-ts` has a full profunctor version but
   marks it "only used internally."
2. **Exposing it does not actually open real extension use.** Indexed optics,
   the flagship use case for custom profunctors, need a **separate family** —
   `Indexed`/`StarI`/`ForgetI` — and an `itraversed` constructor. These three
   alone are not enough.
3. Haskell's `well-typed/optics` internalizes it mainly for **error-message
   quality**, which is a type-inference problem and does not apply to JS. It was
   not our reason.

**Both of the first two grounds are still true.** This library chose not to
follow precedent here, and **it did not open up extensibility either.** The
grounds for the reversal lie elsewhere (2026-08-14).

- **It was already needed and already in use.** It wasn't hidden because it went
  unused — **it was used while being hidden.** As a result, Optics ended up
  building another type's internal representation (`{ value: … }`) as a literal
  and picking it apart via `.value`.
- **There was zero oversight.** Being outside the registry meant the law suite,
  the spec check, and the `.type` gate all missed optics entirely — the same
  shape of hole as `Ord` living on without `Setoid`.
- **A throwing stub turns into structure.** That is the `Tagged` story above.

The record from back then also noted **the condition under which this should
flip** — *"when a real need arises for users to register their own profunctor and
extend optics with it."* What actually came was different. It was not extension,
it was **"a type class the internals need must be implemented explicitly"**
(owner, 2026-08-14), and `Free` is the precedent — the four transformers use it
internally, but it is registered under ten keys and has its own document.

> This note has already vanished once. It originally lived in `CLAUDE.md`, and
> when the harness was stripped out (`b970b96`) it was deleted along with it and
> never moved to `docs/`. So the same question came back up three days later.
> **Put the reasoning somewhere findable, not just somewhere always loaded.**

### What it still cannot do

- **`Wander` has zero laws.** Of `wander`'s three laws, only ①identity can be
  checked; ②composition needs a `Compose` that overlays two Applicatives, which
  this library does not have; and ③naturality is a requirement over **every**
  Applicative homomorphism, which cannot be confirmed by sampling.
  `Traversable`/`ChainRec` are missing for the same reason. Checking just one and
  claiming "the laws hold" would overstate what the gate actually blocks, so it
  is left at zero and the reason is recorded in `KNOWN_DEVIATIONS`.
- **`Strong`/`Choice` also only run two of the standard four** (duality and
  projection). Association and naturality need extra tuple/`Either`
  recombination functions this library doesn't have.
- **Indexed optics are still not open.** Ground 2 above still holds.

---

## Type-class registration for transformers {#transformer-register}

When a transformer is built, it is registered **dynamically** into five spots —
`Functor` → `Apply` → `Applicative` → `Chain` → `Monad`.

- It is built with `registry=null` to **avoid polluting generic keys**, and only
  the alias is inserted manually. Using `register()` would create keys like
  `Functor.types['Functor']` that overwrite each other ([same reason as
  above](#plus-monoid)).
- `instanceof XT` enforces **nominal typing** — mixing in a value from a
  different `StateT(M)` throws.
- **Precondition**: `XT.of` must already be finished by call time. For something
  like `WriterT` that captures extra parameters, `of` needs to properly close
  over that closure.

```javascript
const { StateT, Functor, Monad } = FunFP;

const ST = StateT('maybe');
console.log(Functor.lookup('statet(maybe)').type);   // 'StateT(Maybe)'
console.log(Monad.lookup('statet(maybe)') === Monad.lookup('statet(maybe)'));  // true  it's cached
```

### Why `M` must be passed as a string

For a custom monad with no `type`, the alias attached automatically **depends on
process execution order.** Do not refer to that alias from outside, e.g.
`Functor.lookup('statet(m1)')`. Using a string `M` (`'maybe'`, `'either'`) or an
object `M` that has a `type` property gets you a **deterministic alias**.

---

## `Ord` carries a paired `Setoid` {#ord-setoid}

Static Land requires `Ord` to "support `Setoid` algebra for the same `T`."
Knowing an order means knowing equality too. So `Ord` inherits `Setoid`, and its
constructor **takes the `Setoid` it is to be paired with** — the same shape as
`Monoid` taking a `Semigroup`.

```javascript
const { Ord, Setoid } = FunFP;

const O = Ord.lookup('number');
console.log(O.lte(1, 2), O.equals(1, 1));   // true true   one instance carries both
console.log(O instanceof Setoid);           // true
```

### Not just any `Setoid` can be the pair

It has to be **the equivalence the order induces.** Comparing strings by length
puts `'ab'` and `'cd'` in the **same slot**, since `lte` is true in both
directions between them. The antisymmetry law (if `lte(a,b)` and `lte(b,a)` then
`equals(a,b)`) requires the pair to answer that they are equal. Using literal
character equality would break that law.

```javascript
const { Ord, Setoid } = FunFP;

const byLength = Ord.lookup('StringLengthOrd');
console.log(byLength.lte('ab', 'cd'), byLength.lte('cd', 'ab'));  // true true  same slot
console.log(byLength.equals('ab', 'cd'));                          // true   so they are equal

console.log(Setoid.lookup('string').equals('ab', 'cd'));           // false  literal equality disagrees
```

That is why `StringLengthOrd` and `StringLocaleOrd` do not reuse `StringSetoid`
and instead each keep their own pair (`StringLengthSetoid` /
`StringLocaleSetoid`). Locale-order equivalence treats the precomposed and
decomposed forms as equal.

```javascript
const { Setoid } = FunFP;

const nfc = '\u00e9';    // é  precomposed (one code point)
const nfd = 'e\u0301';   // é  decomposed (e + combining accent)
console.log(Setoid.lookup('string').equals(nfc, nfd));               // false
console.log(Setoid.lookup('StringLocaleSetoid').equals(nfc, nfd));   // true
```

### Containers follow the same rule

`Ord.Array(inner)`'s pair is `Setoid.Array(inner)` — pulled **from the inner
`Ord` itself.** Looking up a `Setoid` by the inner key instead
(`Setoid.Array('string')`) breaks the law under the length-order case above.

```javascript
const { Ord } = FunFP;

const byLength = Ord.lookup('StringLengthOrd');
const arrays = Ord.Array(byLength);
console.log(arrays.lte(['ab'], ['cd']), arrays.lte(['cd'], ['ab']));  // true true
console.log(arrays.equals(['ab'], ['cd']));                            // true
```

`tests/staticland-laws.test.js` runs this law against every registered instance
and every factory-built one.

---

## Container Setoid / Ord — building a box comparison from an inner comparison {#container-setoid}

`Setoid.lookup('number')` compares numbers. To compare a box like `Just(1)`, you
first have to know **how to compare what's inside**, so an assembled key spells
out the inner type. There is no parameterless `Setoid.lookup('maybe')` — the
inside is always spelled out.

```javascript
const { Setoid, Ord, Maybe, Either } = FunFP;

const S = Setoid.lookup('maybe(number)');
console.log(S.equals(Maybe.Just(1), Maybe.Just(1)));    // true
console.log(S.equals(Maybe.Just(1), Maybe.Nothing()));  // false

console.log(Setoid.lookup('array(number)').equals([1, 2], [1, 3]));   // false
console.log(Ord.lookup('maybe(number)').lte(Maybe.Nothing(), Maybe.Just(1)));  // true  Nothing sorts smallest
console.log(Ord.lookup('array(number)').lte([1, 2], [1, 3]));         // true  lexicographic
```

### `Either` has two slots, so it takes two comparators

`Left` holds a failure and `Right` holds a success, and **their types differ.**
The key carries both, separated by a comma — the same shape already used by
`writert(maybe,array)`. Haskell (`(Eq a, Eq b) =>`) and fp-ts (`getEq(EL, EA)`)
also take two, but there the type checker discovers the requirement; our ground
here is our own key format.

```javascript
const { Setoid, Either } = FunFP;

const S = Setoid.lookup('either(string,number)');
console.log(S.equals(Either.Left('a'), Either.Left('a')));   // true   Left compares as a string
console.log(S.equals(Either.Right(1), Either.Right(1)));     // true   Right compares as a number
console.log(S.equals(Either.Left('a'), Either.Right(1)));    // false

// nesting works too — the comma only splits at the top level
console.log(Setoid.lookup('either(maybe(number),array(string))')
    .equals(Either.Right(['a']), Either.Right(['a'])));      // true
```

**`Either` deliberately has no `Ord`.** There is no correct answer to "which
comes first, `Left` or `Right`." fp-ts drops it from the core too.
`Ord.lookup('either(...)')` throws.

### Records use `Setoid.Struct` — the factory is the only entry point

A record (`{ name, age }`) has a different type per field, so there is no single
inner comparator. This corresponds to fp-ts's `Eq.struct`.

**There is no string key.** `maybe`/`array`/`either` are this library's named
types and so live in the registry, but a record is **an ad-hoc shape unique to
each caller**, and there are infinitely many of those — putting them in the
global directory would pollute `Algebra.all('object')` with names like
`structAddressStructCityStringSetoid`. So it is not registered (it takes the
`registry=null` path); only a factory is provided.

```javascript
const { Setoid } = FunFP;

const S = Setoid.Struct({ name: 'string', age: 'number' });
console.log(S.equals({ name: 'A', age: 30 }, { name: 'A', age: 30 }));        // true
console.log(S.equals({ name: 'A', age: 30 }, { name: 'A', age: 30, x: 1 }));  // false  extra fields are rejected too
console.log(S === Setoid.Struct({ age: 'number', name: 'string' }));          // true   normalized internally, so it's cached

// nesting just layers the factory
const U = Setoid.Struct({ users: Setoid.Array(Setoid.Struct({ name: 'string' })) });
console.log(U.equals({ users: [{ name: 'a' }] }, { users: [{ name: 'a' }] })); // true
```

**It is a strict comparison** — the declared field set and the actual key set
must match exactly. fp-ts ignores extra fields, but to line up with this
library's check philosophy (strict mode) and not weaken with test migration,
extras are rejected. There is no `Ord.Struct` — a record's ordering has no
correct answer either.

### Why this was built — a test file had a private implementation

`tests/utils.js`'s `deepEquals` (created 2025-12-25) took `Maybe`/`Either` apart
by hand to compare them, and **58 call sites depended on it while zero tests
verified it.** All of them now use the library's own `Setoid`, and the private
implementation is gone — the comparison rule now comes from the library being
tested, not from a test helper (`assertEqualsBy`).

---

## Number addition does not exactly hold associativity {#number-sum}

`Semigroup` promises associativity — `(a ⊕ b) ⊕ c` and `a ⊕ (b ⊕ c)` must be
equal. **Floating-point addition breaks this.** This is not a JavaScript problem,
it is a property of IEEE 754: every addition rounds, and if the rounding happens
at a different point, the result diverges.

```javascript
const { Semigroup } = FunFP;

const S = Semigroup.lookup('number');
console.log(S.concat(S.concat(0.1, 0.2), 0.3));   // 0.6000000000000001
console.log(S.concat(0.1, S.concat(0.2, 0.3)));   // 0.6
```

**This breaks in a different place than [multiplication](#product-group) does.**
Multiplication breaks on the *inverse* even for ordinary values, while addition's
inverse is **exact for finite numbers** — `0.1 + (-0.1)` is exactly `0`. What
breaks for addition is associativity, and its inverse only breaks at infinity
(`Infinity + (-Infinity)` is `NaN`).

```javascript
const { Semigroup, Group } = FunFP;

const S = Semigroup.lookup('number'), G = Group.lookup('number');
console.log(S.concat(0.1, G.invert(0.1)));            // 0   the inverse is exact for finite numbers
console.log(S.concat(Infinity, G.invert(Infinity)));  // NaN   but not for infinity
```

**The law gate cannot catch this — the sample values are all safe.** The number
sample is `[0, 1, 2, -3, 0.5]`, all values represented **exactly** in binary, so
rounding never happens at all. Running all 125 combinations exhaustively catches
zero failures (measured). So this section's "green" means "the law holds for
this sample," not "the law holds." The reasoning is recorded in
`SAMPLE_OVERRIDES`.

**This is not a fixable defect, it's a fact worth knowing.** If exact addition is
needed, use integers (e.g. cents) or a decimal library — this library's `number`
instance is plain floating point.

---

## `NumberProductGroup`'s inverse does not exist for every number {#product-group}

`Group` promises "every value has an inverse." Under multiplication, the inverse
of 2 is 0.5, and `2 × 0.5 = 1`. **There are values where that promise does not
hold.** Two causes.

**Zero has no inverse in principle.** No number multiplied by 0 gives 1. Even in
mathematics, the multiplicative group only holds over numbers excluding zero —
this is not a library defect.

**Floating point breaks it even away from zero.** For `a × (1/a)` to be exactly
1, the rounding has to cancel out, and it fails to even for ordinary values.

```javascript
const { Group } = FunFP;

const G = Group.lookup('NumberProductGroup');
console.log(G.concat(2, G.invert(2)));    // 1     — holds
console.log(G.concat(-3, G.invert(-3)));  // 1     — holds
console.log(G.concat(49, G.invert(49)));  // 0.9999999999999999   breaks
console.log(G.concat(0, G.invert(0)));    // NaN   — 0 has no inverse
```

The addition side does not have this problem **for finite values** — `a + (-a)`
is exactly 0.

```javascript
const { Group } = FunFP;

const G = Group.lookup('NumberSumGroup');
console.log(G.concat(0.1, G.invert(0.1)));  // 0
console.log(G.concat(49, G.invert(49)));    // 0
```

**But `Infinity` has no inverse even in the addition group** — `∞ + (-∞) = NaN`,
not 0. Same category as multiplication's zero. Infinity is not a finite number,
so it doesn't fall under the group over numbers.

```javascript
const { Group } = FunFP;

const G = Group.lookup('NumberSumGroup');
if (!Number.isNaN(G.concat(Infinity, G.invert(Infinity)))) throw new Error('Infinity got an inverse');
console.log(G.concat(Infinity, G.invert(Infinity)));  // NaN — infinity has no inverse
```

**If exact division is needed, use a rational or decimal type instead of
`NumberProductGroup`.** This is why the group-law check in
`tests/staticland-laws.test.js` keeps a separate sample just for this instance,
with the reason recorded alongside that sample.

## `NaN` sits outside the number `Setoid`/`Ord` {#number-nan}

`Setoid` promises reflexivity — `equals(a, a)` is always true. **`NaN` breaks
this.** `NaN === NaN` is false, and that is not a JavaScript quirk but the IEEE
754 definition (`NaN` means "not a number," so it is not even equal to itself).
`Ord` adds more — `NaN` cannot be ordered against any number (`NaN <= x` is
always false), so it falls outside the total order.

```javascript
const { Setoid, Ord } = FunFP;

const eq = Setoid.lookup('number'), ord = Ord.lookup('number');
console.log(eq.equals(2, 2), ord.lte(2, 2));       // true true — finite numbers behave normally
if (eq.equals(NaN, NaN)) throw new Error('NaN kept reflexivity');
console.log(eq.equals(NaN, NaN));                   // false — NaN is not even equal to itself
```

`Object.is(NaN, NaN)` is true, which looks like a fix, but switching to it would
split `-0` from `0` (`Object.is(-0, 0)` is false). It's a value that rewrites the
whole definition of equality, so it is left alone — **do not put `NaN` into a
comparison or a sort.** That is why the law gate's number sample has no `NaN`.

## `Array` is a `Comonad` only when non-empty {#array-comonad}

`Comonad`'s `extract` means "pull one value out of the box." **An empty array has
no value to pull** — `extract([])` is `undefined`. Mathematically too, the array
comonad only holds over NonEmptyArray (a never-empty array).

```javascript
const { Comonad } = FunFP;

const C = Comonad.lookup('array');
console.log(C.extract([1, 2]));            // 1 — the first element
if (C.extract([]) !== undefined) throw new Error('a value came out of an empty array');
console.log(C.extract([]));                // undefined — nothing to pull out
```

That is why the law gate (`tests/staticland-laws.test.js`)'s `Comonad` check
filters empty arrays out of its sample — an empty array is outside this
instance's domain.

---

## `Semigroupoid.compose` runs right-to-left — the opposite of Static Land's direction {#compose-direction}

This library's `Semigroupoid.compose(f, g)` means **`f(g(x))`** — `g` runs first
(the right-to-left convention of math and Ramda). But **the Static Land spec's
`compose` runs the opposite direction.** The spec signature is `compose :: (T i j,
T j k) → T i k`, where the first argument (i→j) takes the input first, so
`compose(f, g)(x) = g(f(x))` — a **left-to-right** diagrammatic composition where
`f` runs first. Same name, exactly opposite direction.

```javascript
const { Semigroupoid, compose, pipe } = FunFP;

const A = x => x + 'A', B = x => x + 'B';
// this library: right-to-left (same direction as fp.compose)
if (Semigroupoid.lookup('function').compose(A, B)('_') !== '_BA') throw new Error('compose direction flipped');
console.log(Semigroupoid.lookup('function').compose(A, B)('_'));  // '_BA' — B first, then A
// if you need the Static Land spec's direction, use pipe — it matches the spec's compose
if (pipe(A, B)('_') !== compose(B, A)('_')) throw new Error('pipe ≠ spec compose');
console.log(pipe(A, B)('_'));   // '_AB' — same direction as the spec's compose(A, B)
```

**Why the spec was not followed — this is a deliberate convention choice, not a
defect.** Three grounds:

1. **The whole repository is consistently right-to-left.** `fp.compose`,
   `compose2`, every Kleisli `Semigroupoid` is right-to-left. Flipping only
   `Semigroupoid` to match the spec would put it at odds with `fp.compose`, so
   "compose" would mean two opposite directions inside the same library.
2. **Reference implementations also flip the spec direction, just hidden.**
   Ramda and Sanctuary present their user-facing `compose` as right-to-left by
   convention and hide the Fantasy Land method's left-to-right direction
   internally. This library's direction **matches what they hand to their
   users.**
3. **The spec's direction is itself contested.** TC39's
   `proposal-function-helpers` issue #5 gives left-to-right composition its own
   name (`flow`) and reopens the debate on right-to-left `compose` — the
   complaint being that the direction is confusing because it's "named compose
   but behaves like pipe."

Investigation record and sources:
[`.dev/review/260816-staticland-conformance.md`](../../.dev/review/260816-staticland-conformance.md).
Every other type-class method (`map`, `ap`, `chain`, `reduce`, `bimap`,
`traverse`, …) has argument order matching the spec — `compose`'s direction is
the only deviation.

## Functions are monads without being wrapped {#function-monad}

The `'function'` key carries `Apply`, `Applicative`, `Chain` and `Monad`.
A **bare function is used as-is**, with no wrapper around it.

This is possible because of Static Land. Fantasy Land requires the value itself to
carry the methods, so a bare function cannot be a monad unless you patch
`Function.prototype` — which is why a wrapping type is **mandatory** there. Static
Land puts the methods on the module rather than on the value, so that constraint is
gone. This is exactly what the spec lists as its own advantage: "modules that work
with built-in types as values".

Read a function as **something that takes an environment and produces a value**.
`chain` does one thing: it **feeds the same environment to both steps**.

```javascript
const { Monad } = FunFP;
const M = Monad.lookup('function');
const env = { host: 'example.com', port: 8080 };

console.log(M.chain(host => e => host + ':' + e.port, e => e.host)(env));  // example.com:8080
console.log(M.of(7)('the environment is ignored'));  // 7   of builds a constant function
console.log(M.map(n => n * 2, e => e.port)(env));    // 16160   map is post-composition
console.log(M.ap(e => n => n + e.port, e => 10)(env));  // 8090   ap feeds both sides the same env
```

The literature calls this structure the **Reader monad**. So `Chain.lookup('function')`
and `Chain.lookup('reader')` are **two names for the same thing** — and the values match.

```javascript
const { Monad, Reader } = FunFP;
const M = Monad.lookup('function');
const env = { host: 'example.com', port: 8080 };

const bare = M.chain(host => e => host + ':' + e.port, e => e.host);
const wrapped = Reader.asks(e => e.host).chain(host => Reader.asks(e => host + ':' + e.port));

console.log(bare(env) === wrapped.run(env));   // true   same value
```

### So why does `Reader` still exist? {#why-reader-stays}

**Only a wrapped value can carry a transformer.** A bare function has no marker saying
"this is a Reader", so there is nowhere for `ReaderT` to attach. Only the side that
carries the marker can be stacked with another monad.

```javascript
const { ReaderT } = FunFP;
const RT = ReaderT('maybe');
const p = RT.asks(e => e.host).chain(h => RT.of(h.toUpperCase()));

console.log(String(RT.runReaderT({ host: 'example.com' }, p)));  // Just("EXAMPLE.COM")
```

The rule for choosing is simple. **A bare function** when one environment is all you
need; **`Reader`/`ReaderT`** when it has to stack with another effect. The two cannot be
mixed — the wrapped instances only accept wrapped values.

```javascript
const { Chain, Monad } = FunFP;
const bare = Monad.lookup('function').chain(h => e => h + e.port, e => e.host);

try { Chain.lookup('reader').chain(h => h, bare); }
catch (e) { console.log(e.message); }  // Chain.chain: arguments must be (function, Reader)
```

### The law gate had a blind spot

`tests/staticland-laws.test.js` builds its Kleisli arrows with `of`. That is enough for
every other type, but **for the function monad `of` yields a constant function that
ignores the environment.** An arrow that never looks at the environment cannot tell you
which environment was passed.

With that in place, mutating `chain` from `f(g(x))(x)` to `f(g(x))(g(x))` left **both
associativity and left identity green** (measured 2026-08-23). Associativity cannot catch
it in principle — the mutated form is associative too. Left identity missed it because the
arrow was constant.

So a `KLEISLI_FNS` table now hands the function type **arrows that do read the
environment**. With those in place, **left identity catches** that same mutation.

---

## `Either`/`Task` are not `Filterable` {#filterable}

Static Land's `Filterable` requires three rules.

| | Rule |
| --- | --- |
| Distributivity | `filter(x => f(x) && g(x), a) ≡ filter(g, filter(f, a))` |
| Identity | `filter(x => true, a) ≡ a` |
| Annihilation | `filter(x => false, a) ≡ filter(x => false, b)` |

**The annihilation rule requires an "empty" value.** Filtering everything out
must produce the same thing regardless of what was originally inside, which
means the type needs something that counts as "empty."

```javascript
const { Filterable, Maybe } = FunFP;

console.log(Filterable.lookup('array').filter(() => false, [1, 2, 3]));   // []
console.log(Filterable.lookup('array').filter(() => false, [9]));        // []
console.log(Filterable.lookup('maybe').filter(() => false, Maybe.Just(1)).isNothing());  // true
```

`Either` has no such value. It is always either a `Left` or a `Right`, and
**both carry a value.** `Left('DB failure')` is not "empty," it's a specific
failure.

When a `Left` comes in, there is no value to filter, so the predicate can't even
be called — the choice has to be keep it, wipe it, or fix on one behavior.
**Either choice breaks one of the rules.**

| On a `Left` | Rule that breaks |
| --- | --- |
| keep it | Annihilation — `Left('e1')` and `Left('e2')` both survive as-is, so the results differ |
| wipe it | Identity — `filter(x => true, Left('e'))` also gets wiped |

Telling the left side "this is your empty value" doesn't help either. Not
touching it breaks annihilation; touching it breaks identity — **this is a
shape problem, not an information problem.** `Task` is the same story: a
rejected `Task` carries an error.

So neither of these two is registered as `Filterable`. The filtering
functionality itself is still available — registration is the guarantee "this
obeys the rules," and it's only that guarantee that has been withdrawn.

```javascript
const { Either, Filterable } = FunFP;

console.log(Either.filter(x => x > 0, Either.Right(1)).value);    // 1
console.log(Either.filter(x => x > 0, Either.Right(-1)).isLeft()); // true

let message = '';
try { Filterable.lookup('either'); } catch (e) { message = e.message; }
console.log(message);   // 'Filterable.lookup: unsupported key either'
```

fp-ts and Haskell's `witherable` give `Either` filtering (conditioned on taking
a `Monoid` for the left side). **That's because their rulebook has no
annihilation rule** — Haskell's `Filterable` laws are only preservation and
composition. It's a conclusion from a place with different premises, so it does
not transfer directly.

---

## `Task.chainRec` runs synchronous completions as a loop {#chainrec-stack}

Static Land's `ChainRec` does not end with a single equivalence — the rule set
includes a constraint that **`chainRec`'s stack usage must be a constant
multiple of `f` itself.** It exists precisely to safely run long loops that
`chain` recursion cannot safely run.

The first implementation was "one step = one recursive call inside the `fork`
callback." For an asynchronous Task, the event loop empties the stack on every
step, so there is no problem. But a **synchronous Task, like `Task.of`, calls
the callback immediately, so the recursion just piles up.** Measured, the stack
overflowed somewhere around 800–2,000 steps (the threshold moves with whatever
state the stack happened to be in at the time).

What's worse is how it dies. `Task`'s `fork` wraps the computation in try/catch,
but discards an exception thrown after it has already settled. A stack overflow
happens deep in the recursion — after the outer layers have already settled —
so **the error disappears silently, and the Task never opens, neither reject
nor resolve, forever.**

So the current implementation detects synchronous completion: if the callback
arrived before `fork` returned (synchronous), it chains the next step through a
**loop** instead of recursion; if it arrived after returning (asynchronous), it
still recurses, but by then the event loop has already emptied the stack, so
depth does not accumulate.

```javascript
const { ChainRec, Task } = FunFP;

const C = ChainRec.lookup('task');
let result = 'not opened';
C.chainRec(
    (next, done, v) => v < 50000 ? C.map(next, Task.of(v + 1)) : C.map(done, Task.of(v)),
    0
).fork(e => { result = 'err: ' + e; }, v => { result = v; });
if (result !== 50000) throw new Error('synchronous 50,000 steps did not complete: ' + result);
console.log(result);   // 50000
```

This example is itself the regression test — revert to the recursive
implementation and `result` stays `'not opened'`, throwing right here. The same
check runs against all four registered instances in
`tests/staticland-laws.test.js`'s `ChainRec` law too.

**One difference from the old implementation — when "code after resolve" runs**
(Codex cross-review, 2026-08-15). If a step's computation has more code to run
**after** calling `resolve(...)`, the old implementation ran it **in reverse
order** after every step had finished — it had piled up on the stack, waiting
to unwind, and that pile-up is exactly the overflow above. The current
implementation runs it right before the next step. No implementation that fixes
the stack can keep the old order — that order itself *is* the stack buildup.

```javascript
const { ChainRec, Task } = FunFP;

const C = ChainRec.lookup('task');
const log = [];
C.chainRec((next, done, i) => new Task((_, res) => {
    log.push('step' + i);
    res(i < 1 ? next(i + 1) : done(i));
    log.push('cleanup' + i);   // code after resolve — the old implementation ran this in reverse order, at the very end
}), 0).fork(() => {}, () => {});
if (log.join(',') !== 'step0,cleanup0,step1,cleanup1') throw new Error('order differs: ' + log.join(','));
console.log(log.join(','));   // step0,cleanup0,step1,cleanup1
```

### Steps outside spec are rejected (owner's decision, 2026-08-19)

A step must be built from the given `next`/`done`. Anything else is **rejected
with a label.**

It used to be read as **termination** (2026-08-15). The comparison back then was
"if it's not `done`, keep going," and that choice excluded rejection because it
becomes an infinite loop if the tag never changes — **rejection was not among
the options considered at the time.** Rejecting does not actually cause an
infinite loop (it stops immediately). And reading it as termination lets a typo
in the callback silently succeed.

| What the callback produced | Then (read as termination) | Now (rejected) |
| --- | --- | --- |
| a bare value `42`, forgetting `done` | result is **`null`** | `got a value with no tag` |
| a typo'd `next`, `{ tag: 'nxt' }` | something meant to continue **ends** | `got tag 'nxt'` |
| a typo'd `tag`, `{ tag: 'don', value: 7 }` | `7` — **plausible enough to go unnoticed** | `got tag 'don'` |

This library rejects the same situation (a callback producing an out-of-spec
value) in six other places already — `kleisliCompose`'s `chainOf()`,
`MonadError.handleError`, `Task.catchError`, `Prism.match`, `EitherT.catchError`,
`Actor.handle`. `ChainRec` was the one exception.

```javascript
const { ChainRec } = FunFP;

const C = ChainRec.lookup('array');

try { console.log(C.chainRec(() => [{ tag: 'weird', value: 99 }], 0)); }
catch (e) { console.log(e.message); }   // ChainRec.chainRec: step must be next(...) or done(...), got tag 'weird'

try { console.log(C.chainRec(() => [42], 0)); }
catch (e) { console.log(e.message); }   // ChainRec.chainRec: step must be next(...) or done(...), got a value with no tag
```

**A `Task` arrives as a rejection instead of throwing** — a throw from a step
that arrives asynchronously has no one to catch it (a silent hang).

```javascript
const { ChainRec, Task } = FunFP;

ChainRec.lookup('task')
    .chainRec(() => Task.of({ tag: 'weird', value: 99 }), 0)
    .fork(e => console.log(e.message), v => console.log('succeeded unexpectedly', v));
// ChainRec.chainRec: step must be next(...) or done(...), got tag 'weird'
```

---

## There is one door for writing to the registry {#registry-writes}

**The registry is a directory of well-known types** — it exists to look up an
already-registered instance by name, and it does not support custom types
(owner's decision, 2026-08-13). A custom shape is built with a factory
(`Setoid.Struct`) or a `registry=null` constructor, used **outside the
directory.**

**`registerAs(types, key, instance)` is the only door.** `register(types,
instance, ...aliases)` is built on top of it too — it inserts the class name and
each alias via `registerAs`.

```javascript
const { Semigroup, Monoid } = FunFP;

// registered via register(): both the class name and the lowercase alias give the same instance
console.log(Semigroup.lookup('array') === Semigroup.types.ArraySemigroup);   // true
// registered via registerAs, key inserted directly: only the one assembled key exists
console.log(Monoid.lookup('maybe') === Monoid.types['maybe']);   // true
```

**Do not assign directly.** Writing `X.types[key] = instance` still makes
`lookup` work, but it does not go into [the reverse index](#algebra-all), so it
**silently disappears** from `Algebra.all`.

Before 2026-08-13 there were 14 doors (`register()` plus 13 direct assignments).
That meant registration rules couldn't be enforced in one place, and that's
where the same day's `.type` drift and the `.type` gate's blind spot on derived
instances both came from.

**Syntax alone cannot block a workaround.** `tests/registry-api.test.js`
comparing "does every instance in the registry also appear in `Algebra.all`" is
the only gate. That comparison only sees **instances that exist at that
moment** — a derivation nobody has built yet slips past it undetected.

---

## `Algebra.all` reads out a reverse index built at registration time {#algebra-all}

Usage is in the [README](./README.md). Here's what happens inside.

[The one door](#registry-writes) updates a reverse index — `.type` (lowercase) →
instances — every time it registers an instance. `Algebra.all` reads that index
out, so it's **O(k)** — it does not scan.

| | when it scanned | with the index |
| --- | --- | --- |
| `Algebra.all('array')` | 15.9μs | **1.5μs** |
| `Algebra.all('number')` | 13.5μs | **0.6μs** |
| `Functor.lookup('array')` | 0.009μs | 0.009μs |

**The key only accepts lowercase.** The reverse index piles entries up under a
lowercased `.type`, so the entry point is fixed to a single lowercase form too.
Accepting uppercase as well would let the same group be called by two names, and
`.type` itself is already a mix of uppercase (`'Maybe'`) and lowercase
(`'number'`), which would make it even less clear which one to call.

```javascript
const { Algebra } = FunFP;

console.log(Object.keys(Algebra.all('maybe')).length > 0);   // true
try { console.log(Object.keys(Algebra.all('Maybe')).length); }
catch (e) { console.log(e.message); }   // 'Algebra.all: key must be lowercase, got Maybe'
```

**Key order is not a contract.** It follows registration order, so it shifts
whenever registration order shifts — and it actually did shift when the scan
was replaced with the index. Callers destructure by name, so zero call sites
depend on order, and that's why `npm run baseline`'s grid also looks at the
result **sorted.** An unsorted line would report meaningless diffs, and someone
would eventually turn that green by accident, hardening an incidental order
into a contract.

---

## The ceiling for shipped source is ES2018 {#es-ceiling}

The `polyfills` at line 1 of `index.js` is a promise: "we support older
runtimes too." But a polyfill can only fill in **methods.** If
`Array.prototype.flatMap` is missing, `reduce` can stand in for it, but
**syntax** like `?.` or `??` cannot be substituted that way — a runtime that
doesn't know that syntax dies while *parsing* the file, so the polyfill on
line 1 never even gets a chance to run.

**That's why syntax and methods follow different rules.**

| | Crossing the ceiling | Can a polyfill cover it? |
| --- | --- | --- |
| Syntax (`?.` `??` `??=` class fields) | dies at parse time | **no** — it must be rewritten as a different expression |
| Methods (`flatMap` `fromEntries`) | dies at call time | yes — put it in the `polyfills` block |

### The benchmark is Google Apps Script

Google **never states anywhere** which ECMAScript version number Apps Script
supports. Instead it only states individual items — it **explicitly says**
`async`/`await` and `Promise` work, and says `#private` fields are a **parse
error**, and that `static` class fields and ES modules are **not supported**. It
says nothing about the range in between (ES2018–ES2021).

```
ES2015 ─── ES2017 ─── ES2018 ─ ES2019 ─ ES2020 ─ ES2021 ─── ES2022
  │           │          │  └───── the range Google is silent about ──┘      │
  └─ explicitly works ─────┘  ↑ our ceiling                    confirmed parse error
     (up to async/await)                                  (#private, static fields)
```

**Not stepping into the range Google is silent about** is the defensible line.
That's why the ceiling is set at ES2018. `Promise.prototype.finally` (ES2018) is
inside the ceiling, so it's used.

Whether `?.` and `??` actually run on Apps Script **was not verified** — there
was no primary source and no way to run it. The choice was to not lean on
something unverified.

### What was used to replace the deleted syntax

`??` is not the same as `||` — it lets `0`, `''`, `false` pass through. So
instead of switching to `||`, only `undefined`/`null` are checked.

```javascript no-run just a syntax comparison table, nothing to run
a.constructor?.name || 'object'      →  (a.constructor && a.constructor.name) || 'object'
typeof instance?.type !== 'string'   →  !instance || typeof instance.type !== 'string'
bucket.get(k) ?? { name: null }      →  let e = bucket.get(k); if (e === undefined || e === null) e = { name: null };
entry.name ??= key                   →  if (entry.name === undefined || entry.name === null) entry.name = key;
found?.size > 0                      →  (found && found.size > 0)
```

Paths that go through a polyfill show no visible sign of it. `Object`'s `filter`
calls `polyfills.object.fromEntries` internally, so it gives the same answer
even on a runtime with no `Object.fromEntries`.

```javascript
const { Filterable } = FunFP;

const F = Filterable.lookup('object');
console.log(F.filter(v => v > 1, { a: 1, b: 2, c: 3 }));   // { b: 2, c: 3 }
```

### A polyfill only checks for things *above* the ceiling

Setting the ceiling makes half the polyfills pointless. `Object.entries` and
`Object.values` are **ES2017**, so a runtime that respects the ceiling is
**guaranteed to have them** — checking for their presence always goes the same
way. The fallback implementation never runs, and stays **untested code**
forever. So it was removed. Now `Object.entries(...)` is called directly.

The two that remain — `Array.prototype.flatMap` and `Object.fromEntries` — are
**ES2019**, above the ceiling. They may be missing, so the check has to stay
alive.

**Do not lock in the fallback implementation.** Dropping the check and always
using `reduce`+`concat` is tempting for simplicity, but it is **O(n²).**
`Array`'s monadic `chain` runs through this path.

| Array size | native `flatMap` | `reduce`+`concat` | multiplier |
| --- | --- | --- | --- |
| 100 | 0.0018ms | 0.0087ms | 4.8× |
| 1,000 | 0.0180ms | 0.2835ms | 15.7× |
| 5,000 | 0.0813ms | 5.6863ms | 69.9× |
| 20,000 | 0.3869ms | **277.7724ms** | **718×** |

The check buys "still runs on old runtimes" and "fast on new ones" **at the same
time.** Picking only one of the two loses something either way.

### The rule applies to the whole repository

The ceiling covers not just `index.js` but **every hand-written JavaScript
file** — both build scripts and every file under `tests/`.

Dev files are not shipped and use Node-only APIs like `node:fs`, so they'll
never run on an older runtime. So the reason for the rule living there is not
compatibility — it's **consistency.** People copy the convention of the file
next to them. If half the repository uses `?.`, it leaks into `index.js`. One
rule, no leaking.

`String.prototype.matchAll` (ES2020) was being used in three places. Copying the
workaround three times would just plant the next drift, so `tests/utils.js`
keeps a single `allMatches`, and everything uses it.

**Exceptions are recorded in a table along with their reason.** There is one
right now — the dynamic `import()` in `tests/baseline.js`. It loads HEAD's
`index.js` by writing it to a temp file, and since the path is only known at
runtime, ESM leaves no other option. The gate checks both ① that the reason
field is not empty and ② that the exception is **still actually in use.** If the
cause disappears but the line stays, the next reader would just read it as "this
was always an exception here."

### A gate enforces the rule

[`tests/es-ceiling.test.js`](../../tests/es-ceiling.test.js) reads `index.js`
**through the TypeScript parser** and walks the syntax tree. It doesn't use
regex, because this file's comments are full of notation like `Forget<r>`,
`a -> b`, `docs/internals.md#anchor`, which produces false positives under plain
string search. A syntax tree does not see comments.

The exemption applies to **"inside a feature-check ternary," not "inside a
polyfill block."** At first the whole block was exempted, which misses a defect
where the block itself calls the raw API without checking — this was confirmed
by planting the defect. Only the ternary's **condition and true-branch** earn
the right to look at the raw API; everywhere else must go through `polyfills.*`.

What the gate **cannot** catch is also written at the top of the file. Calling a
method by a string name (`obj['flatMap']()`), and cases where what got
standardized is not syntax but *behavior* — the flagship example being
`Array.prototype.sort`'s stability (ES2019). Right now `index.js`'s only `sort`
call is on an array of unique keys, so stability doesn't matter there.

### `dist/` is not scanned separately — instead it is bound to the source

The single source of truth is `index.js`, and `dist/` is a string
transformation of it. In `build.js` the only non-deterministic input is the
build timestamp in the header, so **strip the header and `dist/fun-fp.js` is
character-for-character identical to `index.js`.** So scanning the built output
separately would just do the same job twice.

**But that identity only holds when the build has actually been run.** If it
hasn't, `dist/` stays a stale copy of an old `index.js`, and at that point what
users get diverges from the source. This actually happened —
after `?.` was removed from `index.js`, `dist/` still had 4 instances of `?.`
and 3 of `??`.

So [`tests/dist-sync.test.js`](../../tests/dist-sync.test.js) does not check the
*content* of the build output — it checks **"does `dist/` match what building
`index.js` right now would produce."** When this check is green, whatever was
proven about `index.js` automatically holds for `dist/` too.

The check does not **copy** the transformation rule. It loads and uses
`buildOutputs` exported straight from `build.js` — copying it would silently
drift the moment `build.js` changes, and at that point this check would become a
false green.

`dist/fun-fp.d.ts` is bound the same way, but with a different partner — its
source of truth is not `index.js` but the `types/` folder, and
`build-types.js` concatenates the declaration files inside it. So the check
reads `types/` and diffs the result of rebuilding it against `dist/fun-fp.d.ts`.

**There is one more trap here.** `build-types.js`'s file manifest is written by
hand. Create a new declaration file and forget to add it to the manifest, and it
**silently drops out** of the shipped `.d.ts` — only the type disappears, the
runtime behavior stays fine, so nothing else catches it. So the actual `.d.ts`
files under `types/` and the manifest are cross-checked in both directions. It
catches a file missing from the manifest, and also a manifest entry with no file
behind it. (`types/__tests__/*.test-d.ts` is excluded — it's not shipped.)

## MonadError — the grounds for a class outside the spec {#monaderror}

A class not in Static Land (the same standing as Strong/Choice/Wander). Two
reasons it was built — the door for creating and catching a failure was
scattered by type (only Task had catchError, Either had none), and the law
gate only looked at the success path. Only Task and Either are registered:
for Maybe, Nothing carries no error value, so the law would be vacuous (that
slot belongs to Alt/Plus instead), and Validation is not a Monad. When the
handler's return value gets checked follows the type — immediately for Either,
lazily at fork time for Task (keeping Task.catchError's existing contract).
2026-08-18.

## Reducible — the class for folds with no empty case {#reducible}

`foldMap` requires a Monoid for one reason — the answer for when an empty
container comes in (the identity element). A container that can never be
empty doesn't even have that question, so a fold that only needs a Semigroup
(`reduceLeft`/`reduceMap`) works. `Reducible extends Foldable` turns that into
a contract (the same standing as cats's Reducible, outside the spec —
like MonadError, it is not added to the SPEC table or the dependency graph).
There are two instances, NonEmptyList and Identity — Identity, which must
always carry exactly one value, is the limiting case of "cannot be empty."
Array and Maybe can become empty, so they structurally do not qualify, and
that absence is what gives this class its meaning.
