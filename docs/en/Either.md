# Either

> 한국어: [../Either.md](../Either.md)

**A type for expressing success or failure**

## Concept

Either represents **one of two possible values**:

- `Right(value)`: success, the normal value
- `Left(error)`: failure, error information

Unlike Maybe, it can also carry **the reason for the failure**.

## Why Either?

### The problem: try-catch hell

```javascript
const handleParseError = e => `parse failed: ${e}`;
let result;
try {
    const parsed = JSON.parse(data);
    try {
        const validated = validate(parsed);
        try {
            result = transform(validated);
        } catch (e) {
            result = handleTransformError(e);
        }
    } catch (e) {
        result = handleValidationError(e);
    }
} catch (e) {
    result = handleParseError(e);
}
```

### The fix: handle it gracefully with Either

```javascript no-run signature/pseudocode notation
const { Either, Chain } = FunFP;
const { chain } = Chain.lookup('either');

const result = Either.fold(
    handleError,
    value => value,
    chain(transform,
        chain(validate,
            parseJson(data)
        )
    )
);

// or use Either.pipeK (more readable)
const process = Either.pipeK(parseJson, validate, transform);
const result = Either.fold(handleError, value => value, process(data));
```

## Construction

```javascript
import FunFP from 'fun-fp-js';
const { Either } = FunFP;

// success (Right)
const right = Either.Right(42);
const alsoRight = Either.of(42);  // of is always Right

// failure (Left)
const left = Either.Left('Something went wrong');

// null check
Either.fromNullable(5);         // Right(5)
Either.fromNullable(null);      // Left(null)

// wrapping try-catch
Either.catch(() => JSON.parse('{"a": 1}'));  // Right({a: 1})
Either.catch(() => JSON.parse('invalid'));    // Left(SyntaxError)
```

## Key operations

### map — transform the success value (Functor)

```javascript
const { Functor } = FunFP;
const { map } = Functor.lookup('either');

map(x => x * 2, Either.Right(5));       // Right(10)
map(x => x * 2, Either.Left('error'));  // Left('error') - not transformed
```

### chain — avoid nesting (Monad)

```javascript
const { Chain } = FunFP;
const { chain } = Chain.lookup('either');

const validatePositive = n =>
    n > 0 ? Either.Right(n) : Either.Left('Must be positive');

chain(validatePositive, Either.Right(5));    // Right(5)
chain(validatePositive, Either.Right(-5));   // Left('Must be positive')
chain(validatePositive, Either.Left('error')); // Left('error')
```

### fold — handle both sides

```javascript
const result = Either.fold(
    error => `Error: ${error}`,    // when it's Left
    value => `Success: ${value}`,  // when it's Right
    Either.Right(5)
);
// 'Success: 5'

Either.fold(
    error => `Error: ${error}`,
    value => `Success: ${value}`,
    Either.Left('oops')
);
// 'Error: oops'
```

### bimap — transform both sides (Bifunctor)

```javascript
const { bimap } = Bifunctor.lookup('either');

bimap(
    err => err.toUpperCase(),  // transforms Left
    val => val * 2,            // transforms Right
    Either.Right(5)
);
// Right(10)

bimap(
    err => err.toUpperCase(),
    val => val * 2,
    Either.Left('error')
);
// Left('ERROR')
```

## Type checks

```javascript
Either.isRight(Either.Right(5)); // true
Either.isLeft(Either.Left('e')); // true
Either.isEither(Either.Right(5)); // true
Either.isEither({});             // false
```

## Practical examples

### Input validation pipeline (using pipeK)

```javascript
const validateEmail = email => {
    if (!email) return Either.Left('Email is required');
    if (!email.includes('@')) return Either.Left('Invalid email format');
    return Either.Right(email);
};

const validateName = name => {
    if (!name) return Either.Left('Name is required');
    if (name.length < 2) return Either.Left('Name too short');
    return Either.Right(name);
};

const toUpperCase = str => Either.Right(str.toUpperCase());

// build a validation pipeline with Either.pipeK
const validateAndTransformEmail = Either.pipeK(
    validateEmail,
    toUpperCase
);

validateAndTransformEmail('alice@email.com');  // Right('ALICE@EMAIL.COM')
validateAndTransformEmail('invalid');          // Left('Invalid email format')
validateAndTransformEmail('');                  // Left('Email is required')
```

### Handling an API response

```javascript
const parseResponse = response => {
    if (response.status >= 400) {
        return Either.Left({ 
            status: response.status, 
            message: response.statusText 
        });
    }
    return Either.Right(response.data);
};

const extractUser = data => {
    if (!data.user) return Either.Left('No user in response');
    return Either.Right(data.user);
};

// fold is a static method — Either.fold(onLeft, onRight, either)
const processApiCall = response =>
    Either.fold(
        error => ({ success: false, error }),
        data => ({ success: true, data }),
        parseResponse(response)
            .chain(extractUser)
            .map(user => ({ ...user, processed: true }))
    );
```

### Loading a config file

```javascript
const readFile = path => {
    try {
        return Either.Right(fs.readFileSync(path, 'utf8'));
    } catch (e) {
        return Either.Left(`Cannot read file: ${path}`);
    }
};

// mapLeft is not a method either — build it with bimap
const mapLeft = (f, either) => Either.bimap(f, x => x, either);

const parseConfig = content =>
    mapLeft(e => `Invalid JSON: ${e.message}`, Either.catch(() => JSON.parse(content)));

const validateConfig = config => {
    if (!config.database) return Either.Left('Missing database config');
    if (!config.port) return Either.Left('Missing port config');
    return Either.Right(config);
};

const loadConfig = path =>
    readFile(path)
        .chain(parseConfig)
        .chain(validateConfig);

Either.fold(
    error => console.error('Config error:', error),
    config => console.log('Loaded config:', config),
    loadConfig('./config.json')
);
```

### Aggregating error messages

```javascript
const validate = value => ({
    check: (pred, msg) => pred(value) ? Either.Right(value) : Either.Left([msg]),
    checkAll: (...checks) => checks.reduce(
        (acc, [pred, msg]) => acc.chain(() => 
            pred(value) ? Either.Right(value) : Either.Left([msg])
        ).mapLeft(errs => [...errs, ...(pred(value) ? [] : [msg])]),
        Either.Right(value)
    )
});

// first error only
validate('a').check(s => s.length > 5, 'Too short');
// Left(['Too short'])

// collecting all errors (needs separate implementation)
```

## Either vs Maybe

| | Maybe | Either |
|---|---|---|
| Failure information | none (Nothing) | present (Left) |
| Use case | optional values | error handling |
| null handling | complete | possible |
| Error messages | not possible | possible |

## Converting Either to Maybe

```javascript
Either.toMaybe(Either.Right(5));       // Just(5)
Either.toMaybe(Either.Left('error'));  // Nothing
```

## Related type classes

- **Functor**: provides map
- **Bifunctor**: provides bimap (transforming both sides)
- **Apply**: provides ap
- **Applicative**: provides of
- **Chain**: provides chain
- **Monad**: Applicative + Chain
- **Alt**: choose between alternatives

## Either.pipe / Either.pipeK

Static Land-style chaining that reads cleanly. `Either.pipe` is `pipeWhile(Either.isRight)`:
for an explanation of the skeleton and examples, see [the pipeWhile section of the Maybe docs](./Maybe.md#pipewhile).

### Either.pipe — apply functions in sequence

```javascript
const { map } = Functor.lookup('either');

Either.pipe(
    Either.Right(5),
    e => map(x => x * 2, e),
    e => map(x => x + 1, e)
);
// Right(11)
```

### Either.pipeK — Kleisli composition (for chain)

```javascript
// chain functions of the form a -> Either e b
const parseNumber = str => {
    const n = parseInt(str);
    return isNaN(n) ? Either.Left('Not a number') : Either.Right(n);
};

const validatePositive = n =>
    n > 0 ? Either.Right(n) : Either.Left('Must be positive');

const validateMax = max => n =>
    n <= max ? Either.Right(n) : Either.Left(`Must be <= ${max}`);

// chain them all at once
const validateNumber = Either.pipeK(
    parseNumber,
    validatePositive,
    validateMax(100)
);

validateNumber('50');   // Right(50)
validateNumber('abc');  // Left('Not a number')
validateNumber('-5');   // Left('Must be positive')
validateNumber('200');  // Left('Must be <= 100')
```

## Reading it in output — `toString` {#tostring}

`Left` and `Right` also diverge in their string form. The JSON representation is unchanged:
`_typeName` is what type checks read, so it is left alone.

```javascript
const { Either, Maybe } = FunFP;

if (String(Either.Right(1)) !== 'Right(1)') throw new Error('Right notation differs');
if (String(Either.Left('boom')) !== 'Left("boom")') throw new Error('Left notation differs');
if (String(Either.Right(Maybe.Nothing())) !== 'Right(Nothing)') throw new Error('nested notation differs');
if (JSON.stringify(Either.Left('e')) !== '{"value":"e","_typeName":"Either"}') throw new Error('JSON changed');
console.log(`${Either.Right({ id: 7 })}`);   // Right({"id":7})
```
