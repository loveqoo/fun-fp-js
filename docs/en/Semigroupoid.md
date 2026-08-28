# Semigroupoid & Category

> 한국어: [../Semigroupoid.md](../Semigroupoid.md)

**A type that abstracts function composition**

## Semigroupoid

### Concept

Semigroupoid is a type that provides a **compose operation**. It is a
generalization of function composition.

```javascript
// function composition
const compose = (f, g) => x => f(g(x))
// f ∘ g: runs g first, then passes the result to f
```

> **Mind the direction**: this `compose` runs right-to-left (the math /
> Ramda convention, the same as `fp.compose`). The Static Land spec's
> `compose` runs in the opposite direction (left-to-right, first argument
> first), which matches this library's `pipe`. This is a deliberate
> departure in favor of the more familiar convention; the reasoning is in
> [`internals.md#compose-direction`](./internals.md#compose-direction).

### Laws

#### Associativity
```javascript no-run algebraic law — free-variable notation
compose(f, compose(g, h)) === compose(compose(f, g), h)
```

### Usage example

```javascript
import FunFP from 'fun-fp-js';
const { Semigroupoid } = FunFP;

const { compose } = Semigroupoid.lookup('function');

const addOne = x => x + 1;
const double = x => x * 2;

const combined = compose(addOne, double);
combined(5);  // addOne(double(5)) = addOne(10) = 11
```

---

## Category

### Concept

Category adds an **identity element (`id`)** to Semigroupoid.

```javascript
// id: a function that does nothing
const id = x => x;
```

### Laws

#### Left Identity
```javascript no-run algebraic law — free-variable notation
const id = x => x;
compose(id, f) === f
```

#### Right Identity
```javascript no-run algebraic law — free-variable notation
compose(f, id) === f
```

### Usage example

```javascript
const double = x => x * 2;
const { Category } = FunFP;

const { compose, id } = Category.lookup('function');

// id is the identity element
id(5);  // 5

// composing with it changes nothing
compose(id, double);  // same as double
compose(double, id);  // same as double
```

## Practical applications

### Function pipeline

```javascript
const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);

const process = pipe(
    x => x + 1,
    x => x * 2,
    x => `Result: ${x}`
);

process(5);  // 'Result: 12'
```

### Conditional composition

```javascript
const double = x => x * 2;
const shouldDouble = true;
const when = (cond, f) => cond ? f : id;

const maybeDouble = when(shouldDouble, double);
```

## Related type classes

- **Semigroup**: combining values (Semigroupoid composes functions/arrows)
- **Monoid**: combining values + identity element (Category composes arrows + an identity arrow)
