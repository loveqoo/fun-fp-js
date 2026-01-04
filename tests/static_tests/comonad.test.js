const { test, assert, assertEquals, assertThrows } = require('../utils.js');
const $core = require('../../static_modules/impl.js');
const {
    Comonad,
    ArrayComonad
} = $core;

console.log('🚀 Starting Comonad tests...\n');

// ========== ArrayComonad ==========
console.log('📦 ArrayComonad...');

test('ArrayComonad.extract - returns first element', () => {
    assertEquals(ArrayComonad.extract([1, 2, 3]), 1);
});

test('ArrayComonad.extract - single element', () => {
    assertEquals(ArrayComonad.extract([42]), 42);
});

test('ArrayComonad.extend - inherited from Extend', () => {
    const sum = arr => arr.reduce((a, b) => a + b, 0);
    const result = ArrayComonad.extend(sum, [1, 2, 3, 4]);
    assertEquals(result, [10, 9, 7, 4]);
});

test('ArrayComonad.map - inherited from Functor', () => {
    const result = ArrayComonad.map(x => x * 2, [1, 2, 3]);
    assertEquals(result, [2, 4, 6]);
});

// ========== Comonad.of API ==========
console.log('\n📦 Comonad.of...');

test('Comonad.of - array', () => {
    const C = Comonad.of('array');
    assertEquals(C.extract([5, 10, 15]), 5);
});

test('Comonad.of - throws on unsupported key', () => {
    assertThrows(() => Comonad.of('unsupported'), 'unsupported key');
});

// ========== Comonad Laws ==========
console.log('\n📦 Comonad Laws...');

// Law 1: Left Identity - extend(extract, w) ≡ w
test('Comonad Law: Left Identity - extend(extract, w) ≡ w', () => {
    const w = [1, 2, 3];
    const result = ArrayComonad.extend(ArrayComonad.extract, w);
    assertEquals(result, w);
});

// Law 2: Right Identity - extract(extend(f, w)) ≡ f(w)
test('Comonad Law: Right Identity - extract(extend(f, w)) ≡ f(w)', () => {
    const w = [1, 2, 3, 4];
    const f = arr => arr.reduce((a, b) => a + b, 0);

    const left = ArrayComonad.extract(ArrayComonad.extend(f, w));
    const right = f(w);

    assertEquals(left, right);
});

// Law 3: Associativity - extend(f, extend(g, w)) ≡ extend(w' => f(extend(g, w')), w)
test('Comonad Law: Associativity', () => {
    const w = [1, 2, 3];
    const f = arr => arr.length;
    const g = arr => arr.reduce((a, b) => a + b, 0);

    const left = ArrayComonad.extend(f, ArrayComonad.extend(g, w));
    const right = ArrayComonad.extend(w2 => f(ArrayComonad.extend(g, w2)), w);

    assertEquals(left, right);
});

// ========== Monad vs Comonad ==========
console.log('\n📦 Monad vs Comonad (conceptual)...');

test('Comonad is dual to Monad', () => {
    // Monad: of wraps, chain unwraps and transforms
    // Comonad: extract unwraps, extend transforms and wraps

    // extract is dual to of
    const extracted = ArrayComonad.extract([42]);
    assertEquals(extracted, 42);

    // extend is dual to chain
    const extended = ArrayComonad.extend(arr => arr[0] * 2, [5, 10]);
    assertEquals(extended, [10, 20]);
});

console.log('\n✅ All Comonad tests completed!');
