const { test, assert, assertEquals, assertThrows } = require('../utils.js');
const $core = require('../../static_modules/impl.js');
const {
    Monad
} = $core;
const { ArrayMonad } = Monad.types;

console.log('🚀 Starting Monad tests...\n');

// ========== ArrayMonad ==========
console.log('📦 ArrayMonad...');

test('ArrayMonad.of - identity (inherited from Applicative)', () => {
    assertEquals(ArrayMonad.of(42), [42]);
});

test('ArrayMonad.chain - flatMap (inherited from Chain)', () => {
    const result = ArrayMonad.chain(x => [x, x * 2], [1, 2]);
    assertEquals(result, [1, 2, 2, 4]);
});

test('ArrayMonad.map - map (inherited from Functor)', () => {
    assertEquals(ArrayMonad.map(x => x + 1, [1, 2]), [2, 3]);
});

test('ArrayMonad.ap - ap (inherited from Apply)', () => {
    assertEquals(ArrayMonad.ap([x => x * 2], [1, 2]), [2, 4]);
});

// ========== Monad.of API ==========
console.log('\n📦 Monad.of...');

test('Monad.of - array', () => {
    const M = Monad.of('array');
    assertEquals(M.of(1), [1]);
    assertEquals(M.chain(x => [x, x], [1]), [1, 1]);
    assertEquals(M.map(x => x + 1, [1]), [2]);
    assertEquals(M.ap([x => x * 3], [2]), [6]);
});

test('Monad.of - throws on unsupported key', () => {
    assertThrows(() => Monad.of('unsupported'), 'unsupported key');
});

// ========== Monad Laws ==========
console.log('\n📦 Monad Laws...');

// Law 1: Left Identity - chain(f, of(a)) ≡ f(a)
test('Monad Law: Left Identity - chain(f, of(a)) ≡ f(a)', () => {
    const a = 10;
    const f = x => [x, x + 1];

    const left = ArrayMonad.chain(f, ArrayMonad.of(a));
    const right = f(a);

    assertEquals(left, right);
});

// Law 2: Right Identity - chain(of, m) ≡ m
test('Monad Law: Right Identity - chain(of, m) ≡ m', () => {
    const m = [1, 2, 3];
    const left = ArrayMonad.chain(ArrayMonad.of, m);
    const right = m;

    assertEquals(left, right);
});

// Law 3: Associativity (Inherited from Chain) - chain(g, chain(f, m)) ≡ chain(x => chain(g, f(x)), m)
test('Monad Law: Associativity', () => {
    const m = [1, 2];
    const f = x => [x, x * 2];
    const g = x => [x, x + 10];

    const left = ArrayMonad.chain(g, ArrayMonad.chain(f, m));
    const right = ArrayMonad.chain(x => ArrayMonad.chain(g, f(x)), m);

    assertEquals(left, right);
});

// ========== Practical Examples ==========
console.log('\n📦 Practical Examples...');

test('Monad - sequencing operations', () => {
    const result = ArrayMonad.chain(
        x => ArrayMonad.chain(
            y => ArrayMonad.of(x + y),
            [10, 20]
        ),
        [1, 2]
    );
    // [1+10, 1+20, 2+10, 2+20] -> [11, 21, 12, 22]
    assertEquals(result, [11, 21, 12, 22]);
});

console.log('\n✅ All Monad tests completed!');
