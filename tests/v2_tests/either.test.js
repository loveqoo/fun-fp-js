const lib = require('../../index.js')();
const { either, core } = lib;

const { test, assert, assertEquals } = require('../utils.js');
console.log('🚀 Starting modules/either.js tests...\n');

// === Basic Creation ===
test('right - creates Right', () => {
    const r = either.right(42);
    assert(r.isRight(), 'Should be Right');
    assert(!r.isLeft(), 'Should not be Left');
    assertEquals(r.value, 42);
});

test('left - creates Left with normalized errors', () => {
    const l = either.left('error message');
    assert(l.isLeft(), 'Should be Left');
    assert(!l.isRight(), 'Should not be Right');
    assert(Array.isArray(l.value), 'Left value should be array');
    assert(l.value[0] instanceof Error, 'Left should contain Error');
});

test('from - wraps value in Right', () => {
    const r = either.from(42);
    assert(r.isRight());
    assertEquals(r.value, 42);
});

test('from - passes through existing Either', () => {
    const original = either.right(42);
    const result = either.from(original);
    assert(result === original, 'Should return same instance');
});

test('fromNullable - Right for value', () => {
    const r = either.fromNullable(42);
    assert(r.isRight());
    assertEquals(r.value, 42);
});

test('fromNullable - Left for null', () => {
    const l = either.fromNullable(null);
    assert(l.isLeft());
});

test('fromNullable - Left for undefined', () => {
    const l = either.fromNullable(undefined);
    assert(l.isLeft());
});

test('fromNullable - Right for falsy (0, false, "")', () => {
    assert(either.fromNullable(0).isRight(), '0 should be Right');
    assert(either.fromNullable(false).isRight(), 'false should be Right');
    assert(either.fromNullable('').isRight(), '"" should be Right');
});

// === Functor (map) ===
test('map - transforms Right value', () => {
    const r = either.right(5).map(x => x * 2);
    assert(r.isRight());
    assertEquals(r.value, 10);
});

test('map - ignores Left', () => {
    const l = either.left('error').map(x => x * 2);
    assert(l.isLeft());
});

test('mapLeft - transforms Left value', () => {
    const l = either.left('error');
    const mapped = l.mapLeft(errs => errs.map(e => e.message.toUpperCase()));
    assert(mapped.isLeft());
});

test('mapLeft - ignores Right', () => {
    const r = either.right(42).mapLeft(x => x);
    assert(r.isRight());
    assertEquals(r.value, 42);
});

// === Monad (flatMap) ===
test('flatMap - chains Right operations', () => {
    const safeDivide = (a, b) => b === 0 ? either.left('div by zero') : either.right(a / b);
    const result = either.right(10).flatMap(x => safeDivide(x, 2));
    assert(result.isRight());
    assertEquals(result.value, 5);
});

test('flatMap - short-circuits on Left', () => {
    const safeDivide = (a, b) => b === 0 ? either.left('div by zero') : either.right(a / b);
    const result = either.right(10)
        .flatMap(x => safeDivide(x, 0))
        .flatMap(x => safeDivide(x, 2)); // should not execute
    assert(result.isLeft());
});

test('flatMap - Left stays Left', () => {
    const result = either.left('error').flatMap(x => either.right(x * 2));
    assert(result.isLeft());
});

// === Filter ===
test('filter - passes when predicate true', () => {
    const r = either.right(10).filter(x => x > 5);
    assert(r.isRight());
    assertEquals(r.value, 10);
});

test('filter - fails when predicate false', () => {
    const r = either.right(3).filter(x => x > 5);
    assert(r.isLeft());
});

test('filter - Left stays Left', () => {
    const l = either.left('error').filter(x => x > 5);
    assert(l.isLeft());
});

// === Applicative (ap) ===
test('ap - applies function in Right to value in Right', () => {
    const fn = either.right(x => x * 2);
    const val = either.right(5);
    const result = fn.ap(val);
    assert(result.isRight());
    assertEquals(result.value, 10);
});

test('ap - accumulates errors from Left values', () => {
    const validateName = name => name ? either.right(name) : either.left('Name required');
    const validateAge = age => age > 0 ? either.right(age) : either.left('Age must be positive');
    const createUser = name => age => ({ name, age });

    const result = either.right(createUser)
        .ap(validateName(''))
        .ap(validateAge(-1));

    assert(result.isLeft());
    assert(result.value.length >= 2, 'Should accumulate multiple errors');
});

test('ap - Right function + Left value = Left', () => {
    const fn = either.right(x => x * 2);
    const val = either.left('error');
    const result = fn.ap(val);
    assert(result.isLeft());
});

// === fold & getOrElse ===
test('fold - extracts Right value', () => {
    const result = either.right(42).fold(
        _ => 'left',
        x => `right: ${x}`
    );
    assertEquals(result, 'right: 42');
});

test('fold - extracts Left value', () => {
    const result = either.left('error').fold(
        errs => `left: ${errs.length}`,
        _ => 'right'
    );
    assertEquals(result, 'left: 1');
});

test('getOrElse - returns value for Right', () => {
    assertEquals(either.right(42).getOrElse(0), 42);
});

test('getOrElse - returns default for Left', () => {
    assertEquals(either.left('error').getOrElse(0), 0);
});

// === eitherCatch ===
test('catch - wraps success in Right', () => {
    const safeParse = either.catch(JSON.parse);
    const result = safeParse('{"a":1}');
    assert(result.isRight());
    assertEquals(result.value, { a: 1 });
});

test('catch - wraps error in Left', () => {
    const safeParse = either.catch(JSON.parse);
    const result = safeParse('invalid json');
    assert(result.isLeft());
});

// === validate ===
test('validate - Right when condition passes', () => {
    const isPositive = either.validate(x => x > 0, () => 'must be positive');
    const result = isPositive(5);
    assert(result.isRight());
    assertEquals(result.value, 5);
});

test('validate - Left when condition fails', () => {
    const isPositive = either.validate(x => x > 0, () => 'must be positive');
    const result = isPositive(-5);
    assert(result.isLeft());
});

// === validateAll ===
test('validateAll - collects all Right values', () => {
    const result = either.validateAll([
        either.right(1),
        either.right(2),
        either.right(3)
    ]);
    assert(result.isRight());
    assertEquals(result.value, [1, 2, 3]);
});

test('validateAll - accumulates all Left errors', () => {
    const result = either.validateAll([
        either.left('error1'),
        either.right(2),
        either.left('error2')
    ]);
    assert(result.isLeft());
    assert(result.value.length >= 2, 'Should accumulate errors');
});

// === sequence ===
test('sequence - converts array of Rights to Right of array', () => {
    const result = either.sequence([
        either.right(1),
        either.right(2),
        either.right(3)
    ]);
    assert(result.isRight());
    assertEquals(result.value, [1, 2, 3]);
});

test('sequence - fails fast on first Left', () => {
    const result = either.sequence([
        either.right(1),
        either.left('error'),
        either.right(3)
    ]);
    assert(result.isLeft());
});

// === pipeK ===
test('pipeK - composes Either-returning functions', () => {
    const parse = s => either.catch(JSON.parse)(s);
    const getUser = obj => obj.user ? either.right(obj.user) : either.left('No user');
    const getName = user => user.name ? either.right(user.name) : either.left('No name');

    const pipeline = either.pipeK(parse, getUser, getName);
    const result = pipeline('{"user":{"name":"Alice"}}');

    assert(result.isRight());
    assertEquals(result.value, 'Alice');
});

test('pipeK - empty returns from', () => {
    const pipeline = either.pipeK();
    const result = pipeline(42);
    assert(result.isRight());
    assertEquals(result.value, 42);
});

test('pipeK - short-circuits on failure', () => {
    const parse = s => either.catch(JSON.parse)(s);
    const getUser = obj => obj.user ? either.right(obj.user) : either.left('No user');

    const pipeline = either.pipeK(parse, getUser);
    const result = pipeline('{"data":"no user here"}');

    assert(result.isLeft());
});

// === traverse & traverseAll ===
test('traverse - maps and sequences (fail-fast)', () => {
    const validatePositive = x => x > 0 ? either.right(x) : either.left(`${x} not positive`);

    const result = either.traverse(validatePositive)([1, 2, 3]);
    assert(result.isRight());
    assertEquals(result.value, [1, 2, 3]);
});

test('traverse - fails fast on first error', () => {
    const validatePositive = x => x > 0 ? either.right(x) : either.left(`${x} not positive`);

    const result = either.traverse(validatePositive)([1, -2, -3]);
    assert(result.isLeft());
});

test('traverseAll - accumulates all errors', () => {
    const validatePositive = x => x > 0 ? either.right(x) : either.left(`${x} not positive`);

    const result = either.traverseAll(validatePositive)([1, -2, -3]);
    assert(result.isLeft());
    assert(result.value.length >= 2, 'Should accumulate multiple errors');
});

// === tapLeft ===
test('tapLeft - executes side effect for Left', () => {
    let sideEffect = false;
    either.left('error').tapLeft(() => { sideEffect = true; });
    assert(sideEffect, 'Side effect should have executed');
});

test('tapLeft - ignores Right', () => {
    let sideEffect = false;
    either.right(42).tapLeft(() => { sideEffect = true; });
    assert(!sideEffect, 'Side effect should not have executed');
});

// === Type Protocol ===
test('Either has Functor/Applicative/Monad symbols', () => {
    const r = either.right(42);
    assert(core.isFunctor(r), 'Right should be Functor');
    assert(core.isApplicative(r), 'Right should be Applicative');
    assert(core.isMonad(r), 'Right should be Monad');
});

console.log('\n🛡️ Starting Boundary and Error tests...');

test('left - normalizes string to Error', () => {
    const l = either.left('simple string');
    assert(l.value[0] instanceof Error);
    assertEquals(l.value[0].message, 'simple string');
});

test('left - keeps Error as-is', () => {
    const err = new TypeError('type error');
    const l = either.left(err);
    assert(l.value[0] instanceof TypeError);
});

test('flatMap - returns Left if not returning Either', () => {
    const result = either.right(5).flatMap(x => x * 2); // returns number, not Either
    assert(result.isLeft(), 'Should be Left when flatMap returns non-Either');
});
