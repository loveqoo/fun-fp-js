const { test, assert, assertEquals, assertThrows } = require('../utils.js');
const $core = require('../../static_modules/impl.js');
const {
    Either,
    Left,
    Right,
    Functor,
    Apply,
    Applicative,
    Chain,
    Monad
} = $core;

console.log('🚀 Starting Either tests...\n');

// ========== Either 기본 ==========
console.log('📦 Either 기본...');

test('Either.Right - creates Right', () => {
    const r = Either.Right(42);
    assert(r.isRight());
    assert(!r.isLeft());
    assertEquals(r.value, 42);
});

test('Either.Left - creates Left', () => {
    const l = Either.Left('error');
    assert(l.isLeft());
    assert(!l.isRight());
    assertEquals(l.value, 'error');
});

test('Either.of - creates Right (Applicative)', () => {
    const r = Either.of(42);
    assert(r.isRight());
    assertEquals(r.value, 42);
});

test('Either.isEither - type check', () => {
    assert(Either.isEither(Either.Right(1)));
    assert(Either.isEither(Either.Left('e')));
    assert(!Either.isEither(42));
});

test('Either.fold - pattern matching', () => {
    const onLeft = e => `Error: ${e}`;
    const onRight = v => `Success: ${v}`;

    assertEquals(Either.fold(onLeft, onRight, Either.Right(42)), 'Success: 42');
    assertEquals(Either.fold(onLeft, onRight, Either.Left('fail')), 'Error: fail');
});

// ========== EitherFunctor ==========
console.log('\n📦 EitherFunctor...');

const EitherFunctor = Functor.types.EitherFunctor;

test('EitherFunctor.map - Right', () => {
    const result = EitherFunctor.map(x => x * 2, Either.Right(21));
    assert(result.isRight());
    assertEquals(result.value, 42);
});

test('EitherFunctor.map - Left (unchanged)', () => {
    const result = EitherFunctor.map(x => x * 2, Either.Left('error'));
    assert(result.isLeft());
    assertEquals(result.value, 'error');
});

// ========== EitherApply ==========
console.log('\n📦 EitherApply...');

const EitherApply = Apply.types.EitherApply;

test('EitherApply.ap - both Right', () => {
    const result = EitherApply.ap(Either.Right(x => x * 2), Either.Right(21));
    assert(result.isRight());
    assertEquals(result.value, 42);
});

test('EitherApply.ap - Left function', () => {
    const result = EitherApply.ap(Either.Left('fn error'), Either.Right(21));
    assert(result.isLeft());
    assertEquals(result.value, 'fn error');
});

test('EitherApply.ap - Left value', () => {
    const result = EitherApply.ap(Either.Right(x => x * 2), Either.Left('val error'));
    assert(result.isLeft());
    assertEquals(result.value, 'val error');
});

// ========== EitherApplicative ==========
console.log('\n📦 EitherApplicative...');

const EitherApplicative = Applicative.types.EitherApplicative;

test('EitherApplicative.of - creates Right', () => {
    const result = EitherApplicative.of(42);
    assert(result.isRight());
    assertEquals(result.value, 42);
});

// ========== EitherChain ==========
console.log('\n📦 EitherChain...');

const EitherChain = Chain.types.EitherChain;

test('EitherChain.chain - Right', () => {
    const result = EitherChain.chain(x => Either.Right(x * 2), Either.Right(21));
    assert(result.isRight());
    assertEquals(result.value, 42);
});

test('EitherChain.chain - Left (unchanged)', () => {
    const result = EitherChain.chain(x => Either.Right(x * 2), Either.Left('error'));
    assert(result.isLeft());
    assertEquals(result.value, 'error');
});

// ========== EitherMonad ==========
console.log('\n📦 EitherMonad...');

const EitherMonad = Monad.types.EitherMonad;

test('EitherMonad has all methods', () => {
    assert(typeof EitherMonad.map === 'function');
    assert(typeof EitherMonad.ap === 'function');
    assert(typeof EitherMonad.of === 'function');
    assert(typeof EitherMonad.chain === 'function');
});

// ========== Monad Laws ==========
console.log('\n📦 Monad Laws...');

test('Either Monad Law: Left Identity', () => {
    const a = 10;
    const f = x => Either.Right(x * 2);

    const left = EitherMonad.chain(f, EitherMonad.of(a));
    const right = f(a);

    assertEquals(left.value, right.value);
});

test('Either Monad Law: Right Identity', () => {
    const m = Either.Right(42);
    const result = EitherMonad.chain(EitherMonad.of, m);

    assertEquals(result.value, m.value);
});

test('Either Monad Law: Associativity', () => {
    const m = Either.Right(10);
    const f = x => Either.Right(x + 1);
    const g = x => Either.Right(x * 2);

    const left = EitherMonad.chain(g, EitherMonad.chain(f, m));
    const right = EitherMonad.chain(x => EitherMonad.chain(g, f(x)), m);

    assertEquals(left.value, right.value);
});

// ========== Functor Laws ==========
console.log('\n📦 Functor Laws...');

test('Either Functor Law: Identity', () => {
    const m = Either.Right(42);
    const result = EitherFunctor.map(x => x, m);
    assertEquals(result.value, m.value);
});

test('Either Functor Law: Composition', () => {
    const m = Either.Right(10);
    const f = x => x + 1;
    const g = x => x * 2;

    const left = EitherFunctor.map(x => g(f(x)), m);
    const right = EitherFunctor.map(g, EitherFunctor.map(f, m));

    assertEquals(left.value, right.value);
});

// ========== Practical Examples ==========
console.log('\n📦 Practical Examples...');

test('Either - error handling chain', () => {
    const parseNumber = str => {
        const n = parseInt(str, 10);
        return isNaN(n) ? Either.Left(`Invalid: ${str}`) : Either.Right(n);
    };

    const double = x => Either.Right(x * 2);

    // Success case
    const success = EitherMonad.chain(double, parseNumber('21'));
    assert(success.isRight());
    assertEquals(success.value, 42);

    // Failure case
    const failure = EitherMonad.chain(double, parseNumber('abc'));
    assert(failure.isLeft());
    assertEquals(failure.value, 'Invalid: abc');
});

console.log('\n✅ All Either tests completed!');
