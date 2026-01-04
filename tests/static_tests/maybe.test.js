const { test, assert, assertEquals, assertThrows } = require('../utils.js');
const $core = require('../../static_modules/impl.js');
const {
    Maybe,
    Just,
    Nothing,
    Functor,
    Apply,
    Applicative,
    Chain,
    Monad
} = $core;

console.log('🚀 Starting Maybe tests...\n');

// ========== Maybe 기본 ==========
console.log('📦 Maybe 기본...');

test('Maybe.Just - creates Just', () => {
    const j = Maybe.Just(42);
    assert(j.isJust());
    assert(!j.isNothing());
    assertEquals(j.value, 42);
});

test('Maybe.Nothing - creates Nothing', () => {
    const n = Maybe.Nothing();
    assert(n.isNothing());
    assert(!n.isJust());
    assertEquals(n.value, undefined);
});

test('Maybe.of - creates Just (Applicative)', () => {
    const j = Maybe.of(42);
    assert(j.isJust());
    assertEquals(j.value, 42);
});

test('Maybe.isMaybe - type check', () => {
    assert(Maybe.isMaybe(Maybe.Just(1)));
    assert(Maybe.isMaybe(Maybe.Nothing()));
    assert(!Maybe.isMaybe(42));
});

test('Maybe.fromNullable - Just for value', () => {
    const j = Maybe.fromNullable(42);
    assert(j.isJust());
    assertEquals(j.value, 42);
});

test('Maybe.fromNullable - Nothing for null', () => {
    const n = Maybe.fromNullable(null);
    assert(n.isNothing());
});

test('Maybe.fromNullable - Nothing for undefined', () => {
    const n = Maybe.fromNullable(undefined);
    assert(n.isNothing());
});

test('Maybe.fold - pattern matching', () => {
    const onNothing = () => 'No value';
    const onJust = v => `Value: ${v}`;

    assertEquals(Maybe.fold(onNothing, onJust, Maybe.Just(42)), 'Value: 42');
    assertEquals(Maybe.fold(onNothing, onJust, Maybe.Nothing()), 'No value');
});

// ========== MaybeFunctor ==========
console.log('\n📦 MaybeFunctor...');

const MaybeFunctor = Functor.types.MaybeFunctor;

test('MaybeFunctor.map - Just', () => {
    const result = MaybeFunctor.map(x => x * 2, Maybe.Just(21));
    assert(result.isJust());
    assertEquals(result.value, 42);
});

test('MaybeFunctor.map - Nothing (unchanged)', () => {
    const result = MaybeFunctor.map(x => x * 2, Maybe.Nothing());
    assert(result.isNothing());
});

// ========== MaybeApply ==========
console.log('\n📦 MaybeApply...');

const MaybeApply = Apply.types.MaybeApply;

test('MaybeApply.ap - both Just', () => {
    const result = MaybeApply.ap(Maybe.Just(x => x * 2), Maybe.Just(21));
    assert(result.isJust());
    assertEquals(result.value, 42);
});

test('MaybeApply.ap - Nothing function', () => {
    const result = MaybeApply.ap(Maybe.Nothing(), Maybe.Just(21));
    assert(result.isNothing());
});

test('MaybeApply.ap - Nothing value', () => {
    const result = MaybeApply.ap(Maybe.Just(x => x * 2), Maybe.Nothing());
    assert(result.isNothing());
});

// ========== MaybeApplicative ==========
console.log('\n📦 MaybeApplicative...');

const MaybeApplicative = Applicative.types.MaybeApplicative;

test('MaybeApplicative.of - creates Just', () => {
    const result = MaybeApplicative.of(42);
    assert(result.isJust());
    assertEquals(result.value, 42);
});

// ========== MaybeChain ==========
console.log('\n📦 MaybeChain...');

const MaybeChain = Chain.types.MaybeChain;

test('MaybeChain.chain - Just', () => {
    const result = MaybeChain.chain(x => Maybe.Just(x * 2), Maybe.Just(21));
    assert(result.isJust());
    assertEquals(result.value, 42);
});

test('MaybeChain.chain - Nothing (unchanged)', () => {
    const result = MaybeChain.chain(x => Maybe.Just(x * 2), Maybe.Nothing());
    assert(result.isNothing());
});

// ========== MaybeMonad ==========
console.log('\n📦 MaybeMonad...');

const MaybeMonad = Monad.types.MaybeMonad;

test('MaybeMonad has all methods', () => {
    assert(typeof MaybeMonad.map === 'function');
    assert(typeof MaybeMonad.ap === 'function');
    assert(typeof MaybeMonad.of === 'function');
    assert(typeof MaybeMonad.chain === 'function');
});

// ========== Monad Laws ==========
console.log('\n📦 Monad Laws...');

test('Maybe Monad Law: Left Identity', () => {
    const a = 10;
    const f = x => Maybe.Just(x * 2);

    const left = MaybeMonad.chain(f, MaybeMonad.of(a));
    const right = f(a);

    assertEquals(left.value, right.value);
});

test('Maybe Monad Law: Right Identity', () => {
    const m = Maybe.Just(42);
    const result = MaybeMonad.chain(MaybeMonad.of, m);

    assertEquals(result.value, m.value);
});

test('Maybe Monad Law: Associativity', () => {
    const m = Maybe.Just(10);
    const f = x => Maybe.Just(x + 1);
    const g = x => Maybe.Just(x * 2);

    const left = MaybeMonad.chain(g, MaybeMonad.chain(f, m));
    const right = MaybeMonad.chain(x => MaybeMonad.chain(g, f(x)), m);

    assertEquals(left.value, right.value);
});

// ========== Functor Laws ==========
console.log('\n📦 Functor Laws...');

test('Maybe Functor Law: Identity', () => {
    const m = Maybe.Just(42);
    const result = MaybeFunctor.map(x => x, m);
    assertEquals(result.value, m.value);
});

test('Maybe Functor Law: Composition', () => {
    const m = Maybe.Just(10);
    const f = x => x + 1;
    const g = x => x * 2;

    const left = MaybeFunctor.map(x => g(f(x)), m);
    const right = MaybeFunctor.map(g, MaybeFunctor.map(f, m));

    assertEquals(left.value, right.value);
});

// ========== Practical Examples ==========
console.log('\n📦 Practical Examples...');

test('Maybe - safe property access', () => {
    const getUser = id => id === 1 ? Maybe.Just({ name: 'Alice' }) : Maybe.Nothing();
    const getName = user => Maybe.Just(user.name);

    // Success case
    const success = MaybeMonad.chain(getName, getUser(1));
    assert(success.isJust());
    assertEquals(success.value, 'Alice');

    // Failure case
    const failure = MaybeMonad.chain(getName, getUser(999));
    assert(failure.isNothing());
});

console.log('\n✅ All Maybe tests completed!');
