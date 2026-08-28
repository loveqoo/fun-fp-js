# Validation

> 한국어: [../Validation.md](../Validation.md)

**A Monoid-based error-accumulating type**

## Concept

Validation is a type that **collects all validation failures**.

- `Valid(value)`: validation succeeded
- `Invalid(errors, monoid)`: validation failed (errors accumulated via a Monoid)

Unlike Either, its `ap` operation collects every error, which makes it well suited to parallel validation.

## Why Validation?

### The problem: Either stops at the first error

```javascript
// Either is fail-fast: it stops at the first Left
const { Either, Apply } = FunFP;
const { ap } = Apply.lookup('either');

const validateEmail = email =>
    /.+@.+/.test(email) ? Either.Right(email) : Either.Left('Invalid email');

const validateAge = age =>
    age >= 18 ? Either.Right(age) : Either.Left('Must be 18+');

// Either.ap stops as soon as it hits the first Left
const e1 = Either.Left('Invalid email');
const e2 = Either.Left('Must be 18+');
ap(Either.Right(x => y => [x, y]), e1);
// Left('Invalid email') - never sees e2's error!
```

When validating a form, users want to see **all the errors at once**, but Either only ever shows the first one.

### The fix: collect every error with Validation

```javascript
const { Validation, Apply } = FunFP;
const { ap } = Apply.lookup('validation');

const v1 = Validation.Invalid(['Invalid email']);
const v2 = Validation.Invalid(['Must be 18+']);

// Validation.ap merges Invalids with Monoid.concat
ap(ap(Validation.Valid(x => y => [x, y]), v1), v2);
// Invalid(['Invalid email', 'Must be 18+']) - collects every error!
```

Validation's `ap` (Applicative) **accumulates** errors instead of short-circuiting, which is exactly what parallel validation needs.

## Construction

```javascript
import FunFP from 'fun-fp-js';
const { Validation } = FunFP;

// Create a Valid (validation succeeded)
const valid = Validation.of(5);           // Valid(5)
const alsoValid = Validation.Valid(42);   // Valid(42)

// Create an Invalid (validation failed)
const invalid = Validation.Invalid(['error1', 'error2']);
// Invalid(['error1', 'error2']) - uses the default Array Monoid

// Specify a custom Monoid
const { Monoid } = FunFP;
const stringMonoid = Monoid.lookup('string');
const stringInvalid = Validation.Invalid('error, ', stringMonoid);
// Invalid('error, ', stringMonoid) - uses the String Monoid

// Convert from Either
const { Either } = FunFP;
Validation.fromEither(Either.Right(5));     // Valid(5)
Validation.fromEither(Either.Left(['err'])); // Invalid(['err'])
```

## Main operations (Static Land first)

### map - transforming the value (Functor)

```javascript
const { Functor } = FunFP;
const { map } = Functor.lookup('validation');

map(x => x * 2, Validation.Valid(5));          // Valid(10)
map(x => x * 2, Validation.Invalid(['error'])); // Invalid(['error']) - the function never runs

// Or the Static method
Validation.map(x => x * 2, Validation.Valid(5)); // Valid(10)
```

### ap - accumulating errors (Apply)

The heart of Validation: `ap` merges Invalid values with a Monoid.

```javascript
const { Apply } = FunFP;
const { ap } = Apply.lookup('validation');

// Both Valid: applies normally
const vf = Validation.Valid(x => x * 2);
const va = Validation.Valid(5);
ap(vf, va); // Valid(10)

// Only one Invalid: returns that Invalid
ap(Validation.Invalid(['error1']), Validation.Valid(5));
// Invalid(['error1'])

ap(Validation.Valid(x => x), Validation.Invalid(['error2']));
// Invalid(['error2'])

// Both Invalid: merges with Monoid.concat!
const vf2 = Validation.Invalid(['error1']);
const va2 = Validation.Invalid(['error2']);
ap(vf2, va2);
// Invalid(['error1', 'error2']) - errors accumulate!

// Or the Static method
Validation.ap(vf, va); // Valid(10)
```

### bimap - transforming both sides (Bifunctor)

```javascript
const { Bifunctor } = FunFP;
const { bimap } = Bifunctor.lookup('validation');

// Valid applies the right-hand function
bimap(
    errs => errs.map(e => e.toUpperCase()),
    v => v * 2,
    Validation.Valid(5)
);
// Valid(10)

// Invalid applies the left-hand function (transforms the error)
bimap(
    errs => errs.map(e => e.toUpperCase()),
    v => v * 2,
    Validation.Invalid(['error'])
);
// Invalid(['ERROR'])

// Or the Static method
Validation.bimap(
    errs => errs.map(e => `[ERROR] ${e}`),
    v => v + 1,
    Validation.Invalid(['oops'])
);
// Invalid(['[ERROR] oops'])
```

### fold - pattern matching

```javascript
Validation.fold(
    errors => `Errors: ${errors.join(', ')}`,
    value => `Success: ${value}`,
    Validation.Valid(42)
);
// 'Success: 42'

Validation.fold(
    errors => `Errors: ${errors.join(', ')}`,
    value => `Success: ${value}`,
    Validation.Invalid(['oops', 'fail'])
);
// 'Errors: oops, fail'
```

### Validation.collect - combining several validators

The most practical method: it combines validator functions that return Either into a single function that collects all their errors.

```javascript
const { Either } = FunFP;

// Validator functions that return Either
const validateName = name =>
    name.length >= 2 ? Either.Right(name) : Either.Left('Name too short');

const validateAge = age =>
    age >= 18 ? Either.Right(age) : Either.Left('Must be 18+');

// Combine validators into a function returning Validation
const validateUser = Validation.collect(
    validateName,
    validateAge
)((name, age) => ({ name, age }));

// All validations pass
validateUser('Kim', 20);
// Valid({ name: 'Kim', age: 20 })

// Some fail
validateUser('Kim', 15);
// Invalid(['Must be 18+'])

// All fail - collects every error!
validateUser('K', 15);
// Invalid(['Name too short', 'Must be 18+'])
```

`collect` uses `ap` internally to accumulate errors.

## Instance methods (convenience helpers)

Convenience methods added after the Static Land and Static methods.

```javascript
// map
Validation.Valid(5).map(x => x * 2);  // Valid(10)

// toEither conversion
Validation.Valid(42).toEither();           // Right(42)
Validation.Invalid(['err']).toEither();    // Left(['err'])
```

## Type checks

```javascript
Validation.isValidation(Validation.Valid(5));    // true
Validation.isValidation(Validation.Invalid([])); // true
Validation.isValidation({});                     // false

Validation.isValid(Validation.Valid(5));         // true
Validation.isValid(Validation.Invalid([]));      // false

Validation.isInvalid(Validation.Invalid([]));    // true
Validation.isInvalid(Validation.Valid(5));       // false
```

## Practical examples

### 1. Registration form validation (showing every error)

```javascript
const { Either, Validation } = FunFP;

// Per-field validator functions (return Either)
const validateEmail = email => {
    if (!email) return Either.Left('Email is required');
    if (!/^.+@.+\..+$/.test(email)) return Either.Left('Invalid email format');
    return Either.Right(email);
};

const validatePassword = password => {
    if (!password) return Either.Left('Password is required');
    if (password.length < 8) return Either.Left('Password must be 8+ characters');
    if (!/[0-9]/.test(password)) return Either.Left('Password must contain a number');
    return Either.Right(password);
};

const validateAge = age => {
    if (age == null) return Either.Left('Age is required');
    if (age < 18) return Either.Left('Must be 18 or older');
    if (age > 120) return Either.Left('Invalid age');
    return Either.Right(age);
};

// Combine with Validation.collect
const validateRegistration = Validation.collect(
    validateEmail,
    validatePassword,
    validateAge
)((email, password, age) => ({ email, password, age }));

// Success case
validateRegistration('user@example.com', 'pass1234', 25);
// Valid({ email: 'user@example.com', password: 'pass1234', age: 25 })

// Failure case - collects every error at once!
validateRegistration('', 'short', 15);
// Invalid([
//   'Email is required',
//   'Password must be 8+ characters',
//   'Must be 18 or older'
// ])

// Show to the user
const result = validateRegistration('bad', '123', 15);
Validation.fold(
    errors => {
        console.log('Please fix the following errors:');
        errors.forEach(err => console.log(`- ${err}`));
    },
    user => console.log('Registration successful:', user),
    result
);
// Please fix the following errors:
// - Invalid email format
// - Password must be 8+ characters
// - Must be 18 or older
```

### 2. API parameter validation

```javascript
const fetchUsers = () => Task.of([{ id: 1, name: 'Alice' }]);
const { Either, Validation } = FunFP;

// Query parameter validation
const validateLimit = limit => {
    const num = parseInt(limit);
    if (isNaN(num)) return Either.Left('limit must be a number');
    if (num < 1) return Either.Left('limit must be positive');
    if (num > 100) return Either.Left('limit must be <= 100');
    return Either.Right(num);
};

const validateOffset = offset => {
    const num = parseInt(offset);
    if (isNaN(num)) return Either.Left('offset must be a number');
    if (num < 0) return Either.Left('offset must be non-negative');
    return Either.Right(num);
};

const validateSort = sort => {
    const valid = ['asc', 'desc'];
    if (!valid.includes(sort)) {
        return Either.Left(`sort must be one of: ${valid.join(', ')}`);
    }
    return Either.Right(sort);
};

// API handler
const listUsers = (limitStr, offsetStr, sortStr) => {
    const validateParams = Validation.collect(
        validateLimit,
        validateOffset,
        validateSort
    )((limit, offset, sort) => ({ limit, offset, sort }));

    const result = validateParams(limitStr, offsetStr, sortStr);

    return Validation.fold(
        errors => ({ status: 400, body: { errors } }),
        params => ({ status: 200, body: fetchUsers(params) }),
        result
    );
};

listUsers('10', '0', 'asc');
// { status: 200, body: [...users...] }

listUsers('999', '-5', 'invalid');
// { status: 400, body: { errors: [
//   'limit must be <= 100',
//   'offset must be non-negative',
//   'sort must be one of: asc, desc'
// ]}}
```

### 3. Config file validation

```javascript
const { Either, Validation } = FunFP;

const validateHost = host =>
    host ? Either.Right(host) : Either.Left('host is required');

const validatePort = port => {
    if (!port) return Either.Left('port is required');
    const num = parseInt(port);
    if (isNaN(num)) return Either.Left('port must be a number');
    if (num < 1024 || num > 65535) {
        return Either.Left('port must be between 1024 and 65535');
    }
    return Either.Right(num);
};

const validateTimeout = timeout => {
    if (timeout == null) return Either.Right(5000); // default
    const num = parseInt(timeout);
    if (isNaN(num)) return Either.Left('timeout must be a number');
    if (num < 0) return Either.Left('timeout must be positive');
    return Either.Right(num);
};

const validateConfig = Validation.collect(
    validateHost,
    validatePort,
    validateTimeout
)((host, port, timeout) => ({ host, port, timeout }));

// Load config file
const loadConfig = configObj => {
    const result = validateConfig(
        configObj.host,
        configObj.port,
        configObj.timeout
    );

    return Validation.fold(
        errors => {
            throw new Error(`Invalid config:\n${errors.join('\n')}`);
        },
        config => config,
        result
    );
};

loadConfig({ host: 'localhost', port: 3000 });
// { host: 'localhost', port: 3000, timeout: 5000 }

// Throws on failure, so the caller catches it
try {
    loadConfig({ host: '', port: 'abc', timeout: -1 });
} catch (e) {
    console.error(e.message);
}
// Error: Invalid config:
// host is required
// port must be a number
// timeout must be positive
```

### 4. Joining error messages with a custom Monoid

```javascript
const { Monoid, Validation, Apply } = FunFP;
const { ap } = Apply.lookup('validation');

// Join error messages into a string with the String Monoid
const stringMonoid = Monoid.lookup('string');

const v1 = Validation.Invalid('Invalid email. ', stringMonoid);
const v2 = Validation.Invalid('Password too short. ', stringMonoid);
const v3 = Validation.Invalid('Age out of range.', stringMonoid);

// Accumulate errors with ap
const result = ap(
    ap(
        ap(
            Validation.Valid(x => y => z => ({ x, y, z })),
            v1
        ),
        v2
    ),
    v3
);

Validation.fold(
    errors => console.log('Errors:', errors),
    val => console.log('Success:', val),
    result
);
// Errors: Invalid email. Password too short. Age out of range.
```

### 5. Validating a nested object

```javascript
const { Either, Validation } = FunFP;

// Validate a nested address
const validateStreet = street =>
    street ? Either.Right(street) : Either.Left('street is required');

const validateCity = city =>
    city ? Either.Right(city) : Either.Left('city is required');

const validateZip = zip => {
    if (!zip) return Either.Left('zip is required');
    if (!/^\d{5}$/.test(zip)) return Either.Left('zip must be 5 digits');
    return Either.Right(zip);
};

const validateAddress = Validation.collect(
    validateStreet,
    validateCity,
    validateZip
)((street, city, zip) => ({ street, city, zip }));

// Validate the whole user
const validateUserWithAddress = (name, email, street, city, zip) => {
    const nameValidation = name
        ? Validation.Valid(name)
        : Validation.Invalid(['name is required']);

    const emailValidation = /.+@.+/.test(email)
        ? Validation.Valid(email)
        : Validation.Invalid(['invalid email']);

    const addressValidation = validateAddress(street, city, zip);

    // Combine all validation results
    const { Apply } = FunFP;
    const { ap } = Apply.lookup('validation');

    return ap(
        ap(
            ap(
                Validation.Valid(n => e => a => ({ name: n, email: e, address: a })),
                nameValidation
            ),
            emailValidation
        ),
        addressValidation
    );
};

validateUserWithAddress('', 'bad', '', '', '123');
// Invalid([
//   'name is required',
//   'invalid email',
//   'street is required',
//   'city is required',
//   'zip must be 5 digits'
// ])
```

## Validation vs Either

| | Either | Validation |
|---|---|---|
| Error handling | Fail-fast (stops at the first error) | Accumulates errors (collects all of them) |
| Purpose | Sequential pipelines | Parallel validation |
| Applicative `ap` | Returns the first Left | Merges the Lefts with Monoid.concat |
| Chain/Monad | Supported (pipeK, chain) | Not supported (conflicts with error accumulation) |
| Good fit for | Data transformation pipelines | Form validation, API parameter validation |

**How to choose:**
- **Either**: when a step-by-step transformation should stop immediately on failure
- **Validation**: when several validations should run at once and every error should be collected

## Converting to and from Either

```javascript
const { Either, Validation } = FunFP;

// Either → Validation
const either = Either.Left(['error1']);
Validation.fromEither(either);
// Invalid(['error1'])

// Validation → Either
const valid = Validation.Valid(42);
valid.toEither();
// Right(42)

const invalid = Validation.Invalid(['error1', 'error2']);
invalid.toEither();
// Left(['error1', 'error2'])
```

**When to convert:**
1. **Either → Validation**: to use an existing Either-based validation function inside `Validation.collect`
2. **Validation → Either**: to use `Either.chain` in a pipeline after validation

## Related type classes

Type classes Validation implements:

- **Functor**: `map` - transforms the Valid value
- **Apply**: `ap` - the core of error accumulation
- **Applicative**: `of` - creates a Valid
- **Bifunctor**: `bimap` - transforms both the Valid and Invalid sides
- **Foldable**: `reduce` - reduces the Valid value

**Note**: Validation is **not a Monad**. `chain` doesn't fit semantically with error accumulation.
- A Monad's `chain` decides the next operation based on the previous result (sequential)
- Validation's `ap` runs every validation independently (parallel)

## How Validation.collect works internally

Understanding how `collect` accumulates errors:

```javascript
// A simplified implementation of collect
Validation.collect = (...validators) => f => (...args) => {
    // Run each validator and convert to Validation
    const validations = validators.map((validator, i) => {
        const result = validator(args[i]); // returns Either
        return result.isRight()
            ? Validation.Valid(result.value)
            : Validation.Invalid([result.value]); // wrap in an Array
    });

    // Curry f and wrap it in Validation
    const curriedF = curry(f, validators.length);
    const initialValidation = Validation.Valid(curriedF);

    // Apply ap repeatedly to accumulate errors
    return validations.reduce(
        (acc, v) => Apply.lookup('validation').ap(acc, v),
        initialValidation
    );
};

// Example:
// validators = [validateEmail, validateAge]
// f = (email, age) => ({ email, age })
// args = ['bad', 15]

// Step 1: run the validators
// [Invalid(['Invalid email']), Invalid(['Must be 18+'])]

// Step 2: apply ap repeatedly via reduce
// acc = Valid((email) => (age) => ({ email, age }))
// ap(acc, Invalid(['Invalid email']))
//   = Invalid(['Invalid email'])
// ap(Invalid(['Invalid email']), Invalid(['Must be 18+']))
//   = Invalid(['Invalid email', 'Must be 18+']) <- Monoid.concat!
```

## Related documents

**Similar types:**
- [Either](./Either.md) - Validation is the error-accumulating counterpart of Either

**Type classes it uses:**
- [Functor](./Functor.md)
- [Apply](./Applicative.md) - `ap` is documented alongside Applicative
- [Applicative](./Applicative.md)
- [Bifunctor](./Bifunctor.md)

**Used together with:**
- [Monoid](./Monoid.md) - used for error accumulation (Array Monoid, String Monoid, etc.)
