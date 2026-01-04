const { test, assert, assertEquals, assertThrows } = require('../utils.js');
const $core = require('../../static_modules/impl.js');
const {
    Traversable,
    ArrayTraversable,
    Applicative
} = $core;

console.log('🚀 Starting Traversable tests...\n');

// Helper: Array Applicative for traverse
const ArrayApplicative = Applicative.of('array');

// ========== ArrayTraversable ==========
console.log('📦 ArrayTraversable...');

test('ArrayTraversable.traverse - identity', () => {
    // traverse(of, arr) ≡ of(arr)
    const result = ArrayTraversable.traverse(ArrayApplicative, x => [x], [1, 2, 3]);
    // [1].ap(of([]).map(a => b => [...a, b])) -> ...
    // 결과: [[1, 2, 3]]
    assertEquals(result, [[1, 2, 3]]);
});

test('ArrayTraversable.traverse - with multiple results', () => {
    // [1, 2].traverse(x => [x, x * 10]) gives cartesian product
    const result = ArrayTraversable.traverse(ArrayApplicative, x => [x, x * 10], [1, 2]);
    // 1 -> [1, 10], 2 -> [2, 20]
    // combinations: [1,2], [1,20], [10,2], [10,20]
    assertEquals(result, [[1, 2], [1, 20], [10, 2], [10, 20]]);
});

test('ArrayTraversable.traverse - empty array', () => {
    const result = ArrayTraversable.traverse(ArrayApplicative, x => [x], []);
    assertEquals(result, [[]]); // of([])
});

test('ArrayTraversable.map - inherited from Functor', () => {
    const result = ArrayTraversable.map(x => x * 2, [1, 2, 3]);
    assertEquals(result, [2, 4, 6]);
});

test('ArrayTraversable.reduce - inherited from Foldable', () => {
    const result = ArrayTraversable.reduce((acc, x) => acc + x, 0, [1, 2, 3]);
    assertEquals(result, 6);
});

// ========== Traversable.of API ==========
console.log('\n📦 Traversable.of...');

test('Traversable.of - array', () => {
    const T = Traversable.of('array');
    const result = T.traverse(ArrayApplicative, x => [x], [1, 2]);
    assertEquals(result, [[1, 2]]);
});

test('Traversable.of - throws on unsupported key', () => {
    assertThrows(() => Traversable.of('unsupported'), 'unsupported key');
});

// ========== Traversable Laws ==========
console.log('\n📦 Traversable Laws...');

// Law: Naturality - traverse is natural in the applicative functor
test('Traversable Law: Identity', () => {
    // traverse(Identity, x => Identity(x), arr) ≡ Identity(arr)
    // Using Array as our "Identity" for testing
    const result = ArrayTraversable.traverse(ArrayApplicative, x => [x], [1, 2, 3]);
    assertEquals(result, [[1, 2, 3]]);
});

// ========== Practical Examples ==========
console.log('\n📦 Practical Examples...');

test('ArrayTraversable - sequence-like behavior', () => {
    // [[1, 2], [3, 4]] 을 traverse하면 cartesian product
    // 하지만 우리는 [1, 2]를 traverse하고 각 요소에 [x, x*10] 적용
    const result = ArrayTraversable.traverse(ArrayApplicative, x => [x, -x], [1, 2]);
    // 1 -> [1, -1], 2 -> [2, -2]
    // combinations: [1,2], [1,-2], [-1,2], [-1,-2]
    assertEquals(result, [[1, 2], [1, -2], [-1, 2], [-1, -2]]);
});

console.log('\n✅ All Traversable tests completed!');
