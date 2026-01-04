const { test, assert, assertEquals, assertThrows } = require('../utils.js');
const $core = require('../../static_modules/impl.js');
const {
    Plus,
    ArrayPlus
} = $core;

console.log('🚀 Starting Plus tests...\n');

// ========== ArrayPlus ==========
console.log('📦 ArrayPlus...');

test('ArrayPlus.zero - returns an empty array', () => {
    assertEquals(ArrayPlus.zero(), []);
});

test('ArrayPlus.alt - inherited from Alt', () => {
    assertEquals(ArrayPlus.alt([1, 2], [3, 4]), [1, 2, 3, 4]);
});

test('ArrayPlus.map - inherited from Functor', () => {
    assertEquals(ArrayPlus.map(x => x * 2, [1, 2, 3]), [2, 4, 6]);
});

// ========== Plus.of API ==========
console.log('\n📦 Plus.of...');

test('Plus.of - array', () => {
    const P = Plus.of('array');
    assertEquals(P.zero(), []);
    assertEquals(P.alt([1], [2]), [1, 2]);
    assertEquals(P.map(x => x + 1, [1, 2]), [2, 3]);
});

test('Plus.of - throws on unsupported key', () => {
    assertThrows(() => Plus.of('unsupported'), 'unsupported key');
});

// ========== Plus Laws ==========
console.log('\n📦 Plus Laws...');

// Law 1: Left Identity - alt(zero(), a) ≡ a
test('Plus Law: Left Identity - alt(zero(), a) ≡ a', () => {
    const a = [1, 2, 3];
    const result = ArrayPlus.alt(ArrayPlus.zero(), a);
    assertEquals(result, a);
});

// Law 2: Right Identity - alt(a, zero()) ≡ a
test('Plus Law: Right Identity - alt(a, zero()) ≡ a', () => {
    const a = [1, 2, 3];
    const result = ArrayPlus.alt(a, ArrayPlus.zero());
    assertEquals(result, a);
});

// Law 3: Annihilation - map(f, zero()) ≡ zero()
test('Plus Law: Annihilation - map(f, zero()) ≡ zero()', () => {
    const f = x => x * 2;
    const left = ArrayPlus.map(f, ArrayPlus.zero());
    const right = ArrayPlus.zero();
    assertEquals(left, right);
});

// ========== Practical Examples ==========
console.log('\n📦 Practical Examples...');

test('ArrayPlus - as fallback', () => {
    const getResults = (isEmpty) => isEmpty ? ArrayPlus.zero() : ['result'];

    const results1 = getResults(true);
    const results2 = getResults(false);

    assertEquals(ArrayPlus.alt(results1, ['fallback']), ['fallback']);
    assertEquals(ArrayPlus.alt(results2, ['fallback']), ['result', 'fallback']);
});

console.log('\n✅ All Plus tests completed!');
