const { test, assert, assertEquals, assertThrows } = require('../utils.js');
const $core = require('../../static_modules/impl.js');
const {
    Extend,
    ArrayExtend
} = $core;

console.log('🚀 Starting Extend tests...\n');

// ========== ArrayExtend ==========
console.log('📦 ArrayExtend...');

test('ArrayExtend.extend - sum of suffixes', () => {
    // extend(sum, [1, 2, 3, 4]) = [sum([1,2,3,4]), sum([2,3,4]), sum([3,4]), sum([4])]
    const sum = arr => arr.reduce((a, b) => a + b, 0);
    const result = ArrayExtend.extend(sum, [1, 2, 3, 4]);
    assertEquals(result, [10, 9, 7, 4]);
});

test('ArrayExtend.extend - length of suffixes', () => {
    const result = ArrayExtend.extend(arr => arr.length, [1, 2, 3, 4, 5]);
    assertEquals(result, [5, 4, 3, 2, 1]);
});

test('ArrayExtend.extend - first element of each suffix', () => {
    const result = ArrayExtend.extend(arr => arr[0], [1, 2, 3, 4]);
    assertEquals(result, [1, 2, 3, 4]);
});

test('ArrayExtend.extend - empty array', () => {
    const result = ArrayExtend.extend(arr => arr.length, []);
    assertEquals(result, []);
});

test('ArrayExtend.map - inherited from Functor', () => {
    const result = ArrayExtend.map(x => x * 2, [1, 2, 3]);
    assertEquals(result, [2, 4, 6]);
});

// ========== Extend.of API ==========
console.log('\n📦 Extend.of...');

test('Extend.of - array', () => {
    const E = Extend.of('array');
    const sum = arr => arr.reduce((a, b) => a + b, 0);
    assertEquals(E.extend(sum, [1, 2, 3]), [6, 5, 3]);
});

test('Extend.of - throws on unsupported key', () => {
    assertThrows(() => Extend.of('unsupported'), 'unsupported key');
});

// ========== Extend Laws ==========
console.log('\n📦 Extend Laws...');

// Law: Associativity - extend(f, extend(g, w)) ≡ extend(w' => f(extend(g, w')), w)
test('Extend Law: Associativity', () => {
    const w = [1, 2, 3];
    const f = arr => arr.length;
    const g = arr => arr.reduce((a, b) => a + b, 0);

    const left = ArrayExtend.extend(f, ArrayExtend.extend(g, w));
    const right = ArrayExtend.extend(w2 => f(ArrayExtend.extend(g, w2)), w);

    assertEquals(left, right);
});

// ========== Practical Examples ==========
console.log('\n📦 Practical Examples...');

test('ArrayExtend - moving average (conceptual)', () => {
    // 각 위치에서 나머지 요소들의 평균
    const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
    const result = ArrayExtend.extend(avg, [10, 20, 30, 40]);
    assertEquals(result, [25, 30, 35, 40]);
});

console.log('\n✅ All Extend tests completed!');
