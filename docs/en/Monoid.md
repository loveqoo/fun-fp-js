# Monoid

> 한국어: [../Monoid.md](../Monoid.md)

**A Semigroup with an identity element**

## Concept

Monoid adds an **identity element** (`empty`) to Semigroup. The identity element is a "neutral" value that leaves any other value unchanged when combined with it.

- Identity of addition: `0` (a + 0 = a)
- Identity of multiplication: `1` (a * 1 = a)
- Identity of string concatenation: `''` (s + '' = s)
- Identity of array concatenation: `[]` ([...arr, ...[]] = arr)

## Laws

In addition to Semigroup's law (associativity):

### 1. Right Identity
```javascript no-run algebraic law — free-variable notation
const objectMonoid = new Monoid(
    new Semigroup((a, b) => ({ ...a, ...b }), 'Object'),
    () => ({}),
    'Object'
);
const { concat, empty } = objectMonoid;
concat(a, empty) === a
```

### 2. Left Identity
```javascript no-run algebraic law — free-variable notation
const objectMonoid = new Monoid(
    new Semigroup((a, b) => ({ ...a, ...b }), 'Object'),
    () => ({}),
    'Object'
);
const { concat, empty } = objectMonoid;
concat(empty, a) === a
```

## Interface

```javascript no-run signature / pseudocode
Monoid.empty(): a         // returns the identity element
Monoid.concat(a, b): a    // inherited from Semigroup
```

## Usage examples

### Basic usage

```javascript
import FunFP from 'fun-fp-js';
const { Monoid } = FunFP;

// string
const str = Monoid.lookup('string');
str.empty();  // ''
str.concat('Hello', str.empty());  // 'Hello'

// array
const arr = Monoid.lookup('array');
arr.empty();  // []
arr.concat([1, 2], arr.empty());  // [1, 2]

// number addition
const num = Monoid.lookup('number');
num.empty();  // 0
num.concat(5, num.empty());  // 5
```

## Monoid derived from `Plus`

`Plus` has **both** `alt` (a combining operation) and `zero` (an identity element). That is, it is structurally a Monoid, just without the tag. So a registered `Plus` also gets a paired `Semigroup`/`Monoid` **under that same type name**.

**Except when that type already has a `Monoid`.** `Array` is one such case — its `alt` is exactly `concat`, so the derived instance would behave identically to `ArrayMonoid`, making it redundant.

```javascript
const { Monoid, Semigroup, Maybe } = FunFP;

const pm = Monoid.lookup('maybe');                           // derived from Plus
console.log(pm.concat(Maybe.Just(1), Maybe.Just(2)).value);  // 1  — picks the first Just
console.log(pm.empty().isNothing());                         // true

// the paired Semigroup is registered too
console.log(Semigroup.lookup('maybe').concat(Maybe.Just(1), Maybe.Just(2)).value);  // 1

// Array already has an ArrayMonoid, so no derived instance is registered
console.log(Monoid.lookup('array') === Monoid.types.ArrayMonoid);   // true
```

> **This key used to be `plus(array)`/`plus(maybe)`. That was a bug.** In this library
> `f(x)` means `F<X>`, but `plus(maybe)` returned a `Monoid`, not a `Plus`. What sat
> inside the parentheses was not the element but the **origin**, and an origin note is
> not a type.

### `Monoid.lookup('maybe')` vs `maybe(first)` — whether the inside gets opened

The names look similar, but these are **different monoids**. They diverge exactly where **payload types are mixed**.

```javascript
const { Monoid, Maybe } = FunFP;

const plus = Monoid.lookup('maybe');       // picks by the whole envelope — never opens it
const inner = Monoid.Maybe('first');       // opens it and merges with first

// same payload type gives the same result
console.log(plus.concat(Maybe.Just(1), Maybe.Just(2)).value);   // 1
console.log(inner.concat(Maybe.Just(1), Maybe.Just(2)).value);  // 1

// mixed types diverge
console.log(plus.concat(Maybe.Just(1), Maybe.Just('a')).value);  // 1
try {
    inner.concat(Maybe.Just(1), Maybe.Just('a'));
} catch (e) {
    console.log(e.message);  // Semigroup.concat: arguments must be the same type
}
```

**Use `maybe(first)` for "merge," and `maybe` for "pick."** The presence of the parentheses marks the difference — parentheses mean an inner comparator was supplied, and that is what lets the inside be opened. `Optics.preview` uses the latter, because it must be able to answer "the first one" regardless of what the array holds.

Either way, the identity element is `Nothing`.

## Practical applications

### Safe folding (handling empty arrays)

Semigroup alone cannot handle an empty array, but Monoid can:

```javascript
// Semigroup - errors on an empty array!
// arr.reduce((a, b) => semigroup.concat(a, b))  // Error on []

// Monoid - safe!
const monoid = Monoid.lookup('number');

const foldMonoid = arr => arr.reduce(
    (acc, x) => monoid.concat(acc, x),
    monoid.empty()
);

foldMonoid([1, 2, 3]);  // 6
foldMonoid([]);         // 0 (safe!)
```

### Conditional combination

```javascript
const errors = ['Name is required'];
const warnings = [];
const hasErrors = errors.length > 0;
const hasWarnings = warnings.length > 0;
const arr = Monoid.lookup('array');

const concatIf = (condition, value) =>
    condition ? value : arr.empty();

const result = arr.concat(
    concatIf(hasErrors, errors),
    concatIf(hasWarnings, warnings)
);
// combines only what matches the condition, empty array otherwise
```

### Object defaults pattern

```javascript
// an object-merging Monoid isn't provided by default, so build one
const objectMonoid = new Monoid(
    new Semigroup((a, b) => ({ ...a, ...b }), 'Object'),
    () => ({}),
    'Object'
);
const { concat, empty } = objectMonoid;

const withDefaults = (defaults, obj) => concat(defaults, obj);

const defaults = { theme: 'light', lang: 'en' };
const config = withDefaults(defaults, { lang: 'ko' });
// { theme: 'light', lang: 'ko' }
```

### Collecting logs

```javascript
const log = (msgs) => ({
    value: null,
    messages: msgs
});

const arr = Monoid.lookup('array');

const combineResults = (results) => results.reduce(
    (acc, r) => ({
        value: r.value,
        messages: arr.concat(acc.messages, r.messages)
    }),
    { value: null, messages: arr.empty() }
);
```

## Monoid vs Semigroup

| | Semigroup | Monoid |
|---|---|---|
| concat | ✅ | ✅ |
| empty | ❌ | ✅ |
| Folding an empty list | not possible | possible |
| Default-value pattern | manual | automatic |

## Related type classes

- **Semigroup**: the base Monoid builds on (provides concat only)
- **Group**: Monoid + inverse (invert)
