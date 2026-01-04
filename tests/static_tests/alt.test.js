const { test, assert, assertEquals, assertThrows } = require('../utils.js');
const $core = require('../../static_modules/impl.js');
const {
    Alt,
    ArrayAlt,
    ArrayFunctor
} = $core;

console.log('🚀 Starting Alt tests...\n');

// ========== ArrayAlt ==========
console.log('📦 ArrayAlt...');

test('ArrayAlt.alt - concatenates two arrays', () => {
    const result = ArrayAlt.alt([1, 2], [3, 4]);
    assertEquals(result, [1, 2, 3, 4]);
});

test('ArrayAlt.alt - with empty arrays', () => {
    assertEquals(ArrayAlt.alt([], [1, 2]), [1, 2]);
    assertEquals(ArrayAlt.alt([1, 2], []), [1, 2]);
    assertEquals(ArrayAlt.alt([], []), []);
});

test('ArrayAlt.alt - with strings', () => {
    const result = ArrayAlt.alt(['a', 'b'], ['c', 'd']);
    assertEquals(result, ['a', 'b', 'c', 'd']);
});

test('ArrayAlt.map - inherited from Functor', () => {
    const result = ArrayAlt.map(x => x * 2, [1, 2, 3]);
    assertEquals(result, [2, 4, 6]);
});

// ========== Alt.of API ==========
console.log('\n📦 Alt.of...');

test('Alt.of - array', () => {
    const A = Alt.of('array');
    assertEquals(A.alt([1], [2]), [1, 2]);
    assertEquals(A.map(x => x + 1, [1, 2]), [2, 3]);
});

test('Alt.of - throws on unsupported key', () => {
    assertThrows(() => Alt.of('unsupported'), 'unsupported key');
});

test('Alt.of - throws on non-array arguments', () => {
    const A = Alt.of('array');
    assertThrows(() => A.alt('notArray', [1, 2]), 'must be arrays');
    assertThrows(() => A.alt([1, 2], 'notArray'), 'must be arrays');
});

// ========== Alt Laws ==========
console.log('\n📦 Alt Laws...');

// Law 1: Associativity - alt(alt(a, b), c) ≡ alt(a, alt(b, c))
test('Alt Law: Associativity', () => {
    const a = [1, 2];
    const b = [3, 4];
    const c = [5, 6];

    const left = ArrayAlt.alt(ArrayAlt.alt(a, b), c);
    const right = ArrayAlt.alt(a, ArrayAlt.alt(b, c));

    assertEquals(left, right);  // [1, 2, 3, 4, 5, 6]
});

// Law 2: Distributivity - map(f, alt(a, b)) ≡ alt(map(f, a), map(f, b))
test('Alt Law: Distributivity', () => {
    const f = x => x * 2;
    const a = [1, 2];
    const b = [3, 4];

    const left = ArrayAlt.map(f, ArrayAlt.alt(a, b));
    const right = ArrayAlt.alt(ArrayAlt.map(f, a), ArrayAlt.map(f, b));

    assertEquals(left, right);  // [2, 4, 6, 8]
});

// ========== Practical Examples ==========
console.log('\n📦 Practical Examples...');

test('ArrayAlt - combining search results', () => {
    const localResults = ['file1', 'file2'];
    const remoteResults = ['file3', 'file4'];
    const allResults = ArrayAlt.alt(localResults, remoteResults);
    assertEquals(allResults, ['file1', 'file2', 'file3', 'file4']);
});

test('ArrayAlt - fallback pattern', () => {
    // 첫 번째가 비어있으면 두 번째 사용
    const primary = [];
    const fallback = ['default'];
    const result = ArrayAlt.alt(primary, fallback);
    assertEquals(result, ['default']);
});

// ========== Edge Cases ==========
console.log('\n📦 Edge Cases...');

test('ArrayAlt - chaining multiple alts', () => {
    const result = ArrayAlt.alt(
        ArrayAlt.alt([1], [2]),
        ArrayAlt.alt([3], [4])
    );
    assertEquals(result, [1, 2, 3, 4]);
});

test('ArrayAlt - with mixed types', () => {
    const result = ArrayAlt.alt([1, 'a'], [true, null]);
    assertEquals(result, [1, 'a', true, null]);
});

console.log('\n✅ All Alt tests completed!');
