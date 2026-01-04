const { test, assert, assertEquals, assertThrows } = require('../utils.js');
const $core = require('../../static_modules/impl.js');
const {
    Foldable,
    ArrayFoldable
} = $core;

console.log('🚀 Starting Foldable tests...\n');

// ========== ArrayFoldable ==========
console.log('📦 ArrayFoldable...');

test('ArrayFoldable.reduce - sum of numbers', () => {
    const result = ArrayFoldable.reduce((acc, x) => acc + x, 0, [1, 2, 3, 4, 5]);
    assertEquals(result, 15);
});

test('ArrayFoldable.reduce - product of numbers', () => {
    const result = ArrayFoldable.reduce((acc, x) => acc * x, 1, [1, 2, 3, 4]);
    assertEquals(result, 24);
});

test('ArrayFoldable.reduce - string concatenation', () => {
    const result = ArrayFoldable.reduce((acc, x) => acc + x, '', ['a', 'b', 'c']);
    assertEquals(result, 'abc');
});

test('ArrayFoldable.reduce - empty array', () => {
    const result = ArrayFoldable.reduce((acc, x) => acc + x, 0, []);
    assertEquals(result, 0);
});

test('ArrayFoldable.reduce - building an object', () => {
    const result = ArrayFoldable.reduce(
        (acc, [k, v]) => ({ ...acc, [k]: v }),
        {},
        [['a', 1], ['b', 2]]
    );
    assertEquals(JSON.stringify(result), JSON.stringify({ a: 1, b: 2 }));
});

// ========== Foldable.of API ==========
console.log('\n📦 Foldable.of...');

test('Foldable.of - array', () => {
    const F = Foldable.of('array');
    assertEquals(F.reduce((acc, x) => acc + x, 0, [1, 2, 3]), 6);
});

test('Foldable.of - throws on unsupported key', () => {
    assertThrows(() => Foldable.of('unsupported'), 'unsupported key');
});

test('Foldable.of - throws on invalid arguments', () => {
    const F = Foldable.of('array');
    assertThrows(() => F.reduce('not a function', 0, [1, 2]), 'arguments must be');
});

// ========== Foldable Laws ==========
console.log('\n📦 Foldable Laws...');

// Law: reduce is equivalent to Array.prototype.reduce
test('Foldable Law: Equivalence to native reduce', () => {
    const arr = [1, 2, 3, 4, 5];
    const f = (acc, x) => acc + x;
    const init = 0;

    const left = ArrayFoldable.reduce(f, init, arr);
    const right = arr.reduce(f, init);

    assertEquals(left, right);
});

// ========== Practical Examples ==========
console.log('\n📦 Practical Examples...');

test('ArrayFoldable - find max', () => {
    const result = ArrayFoldable.reduce(
        (max, x) => x > max ? x : max,
        -Infinity,
        [3, 1, 4, 1, 5, 9, 2, 6]
    );
    assertEquals(result, 9);
});

test('ArrayFoldable - count occurrences', () => {
    const result = ArrayFoldable.reduce(
        (counts, x) => ({ ...counts, [x]: (counts[x] || 0) + 1 }),
        {},
        ['a', 'b', 'a', 'c', 'b', 'a']
    );
    assertEquals(JSON.stringify(result), JSON.stringify({ a: 3, b: 2, c: 1 }));
});

console.log('\n✅ All Foldable tests completed!');
