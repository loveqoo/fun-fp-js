# Semigroup

> 한국어: [../Semigroup.md](../Semigroup.md)

**A type whose values can be combined**

## Concept

Semigroup is a type whose two values can be **combined** (`concat`) into a new value of the same type. String concatenation, array merging, and number addition are typical examples.

The core property is **associativity**: changing the grouping of the combination does not change the result.

## Laws

### Associativity
```javascript no-run algebraic law — free-variable notation
const { concat } = Semigroup.lookup('array');
concat(concat(a, b), c) === concat(a, concat(b, c))
```

Examples:
```javascript no-run signature / pseudocode
// string
("a" + "b") + "c" === "a" + ("b" + "c")  // "abc" === "abc"

// number addition
(1 + 2) + 3 === 1 + (2 + 3)  // 6 === 6

// array
[...[...a, ...b], ...c] === [...a, ...[...b, ...c]]
```

## Interface

```javascript no-run signature / pseudocode
Semigroup.concat(a, b): a  // combines a and b
```

## Usage examples

### Basic combination

```javascript
import FunFP from 'fun-fp-js';
const { Semigroup } = FunFP;

// string concatenation
Semigroup.lookup('string').concat('Hello, ', 'World!');  // 'Hello, World!'

// array merging
Semigroup.lookup('array').concat([1, 2], [3, 4]);  // [1, 2, 3, 4]

// number addition
Semigroup.lookup('number').concat(5, 3);  // 8

// function composition
const add1 = x => x + 1;
const mul2 = x => x * 2;
const composed = Semigroup.lookup('function').concat(add1, mul2);
composed(5);  // add1(mul2(5)) = add1(10) = 11
```

## Practical applications

### Combining many values (reduce pattern)

```javascript
const { concat } = Semigroup.lookup('array');

const concatAll = arr => arr.reduce(concat);
concatAll([[1], [2], [3]]);  // [1, 2, 3]
```

### Collecting validation results

```javascript
const name = 'Alice';
const email = 'alice@example.com';
// collect error messages
const errors = [];
const validate = (cond, msg) => cond ? [] : [msg];

const { concat } = Semigroup.lookup('array');

const nameErrors = validate(name.length > 0, 'Name is required');
const emailErrors = validate(email.includes('@'), 'Invalid email');

const allErrors = concat(nameErrors, emailErrors);
```

## Why Semigroup?

Using Semigroup instead of plain operators gives you:

1. **Abstraction**: the same code handles many different types
2. **Safety**: types are guaranteed to line up
3. **Composability**: combines with other FP patterns

```javascript
// an abstracted sum function
const sum = (type, arr) => arr.reduce(Semigroup.lookup(type).concat);

sum('number', [1, 2, 3]);     // 6
sum('string', ['a', 'b', 'c']);  // 'abc'
```

## Related type classes

- **Monoid**: Semigroup + identity element (empty)
