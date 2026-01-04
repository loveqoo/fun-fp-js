const { test, assert, assertEquals, assertThrows } = require('../utils.js');
const $core = require('../../static_modules/impl.js');
const {
    Filterable,
    ArrayFilterable,
    ObjectFilterable
} = $core;

console.log('🚀 Starting Filterable tests...\n');

// ========== ArrayFilterable ==========
console.log('📦 ArrayFilterable...');

test('ArrayFilterable.filter - filters array elements', () => {
    const result = ArrayFilterable.filter(x => x > 2, [1, 2, 3, 4, 5]);
    assertEquals(result, [3, 4, 5]);
});

test('ArrayFilterable.filter - with string predicate', () => {
    const result = ArrayFilterable.filter(s => s.length > 3, ['a', 'ab', 'abc', 'abcd', 'abcde']);
    assertEquals(result, ['abcd', 'abcde']);
});

test('ArrayFilterable.filter - empty result', () => {
    const result = ArrayFilterable.filter(x => x > 100, [1, 2, 3]);
    assertEquals(result, []);
});

test('ArrayFilterable.filter - all pass', () => {
    const result = ArrayFilterable.filter(x => x > 0, [1, 2, 3]);
    assertEquals(result, [1, 2, 3]);
});

// ========== ObjectFilterable ==========
console.log('\n📦 ObjectFilterable...');

test('ObjectFilterable.filter - filters object values', () => {
    const obj = { a: 1, b: 2, c: 3, d: 4 };
    const result = ObjectFilterable.filter(v => v > 2, obj);
    assertEquals(result, { c: 3, d: 4 });
});

test('ObjectFilterable.filter - empty result', () => {
    const obj = { x: 1, y: 2 };
    const result = ObjectFilterable.filter(v => v > 100, obj);
    assertEquals(result, {});
});

test('ObjectFilterable.filter - all pass', () => {
    const obj = { a: 1, b: 2 };
    const result = ObjectFilterable.filter(v => v > 0, obj);
    assertEquals(result, { a: 1, b: 2 });
});

// ========== Filterable.of API ==========
console.log('\n📦 Filterable.of...');

test('Filterable.of - array', () => {
    const F = Filterable.of('array');
    assertEquals(F.filter(x => x % 2 === 0, [1, 2, 3, 4]), [2, 4]);
});

test('Filterable.of - object', () => {
    const F = Filterable.of('object');
    assertEquals(F.filter(v => v > 2, { a: 1, b: 2, c: 3 }), { c: 3 });
});

test('Filterable.of - throws on unsupported key', () => {
    assertThrows(() => Filterable.of('unsupported'), 'unsupported key');
});

test('Filterable.of - throws on non-function predicate', () => {
    const F = Filterable.of('array');
    assertThrows(() => F.filter('notAFunction', [1, 2, 3]), 'predicate must be a function');
    assertThrows(() => F.filter(123, [1, 2, 3]), 'predicate must be a function');
});

// ========== Filterable Laws ==========
console.log('\n📦 Filterable Laws...');

// Law 1: Distributivity - F.filter(x => f(x) && g(x), a) ≡ F.filter(g, F.filter(f, a))
test('Filterable Law: Distributivity', () => {
    const f = x => x > 1;
    const g = x => x < 5;
    const a = [0, 1, 2, 3, 4, 5, 6];

    const left = ArrayFilterable.filter(x => f(x) && g(x), a);
    const right = ArrayFilterable.filter(g, ArrayFilterable.filter(f, a));

    assertEquals(left, right);  // [2, 3, 4]
});

// Law 2: Identity - F.filter(x => true, a) ≡ a
test('Filterable Law: Identity', () => {
    const a = [1, 2, 3, 4, 5];
    const result = ArrayFilterable.filter(x => true, a);
    assertEquals(result, a);
});

// Law 3: Annihilation - F.filter(x => false, a) ≡ F.filter(x => false, b)
test('Filterable Law: Annihilation', () => {
    const a = [1, 2, 3];
    const b = ['x', 'y', 'z', 'w'];

    const resultA = ArrayFilterable.filter(x => false, a);
    const resultB = ArrayFilterable.filter(x => false, b);

    assertEquals(resultA, []);
    assertEquals(resultB, []);
    assertEquals(resultA, resultB);  // 둘 다 빈 배열
});

// ========== Edge Cases ==========
console.log('\n📦 Edge Cases...');

test('ArrayFilterable.filter - empty array', () => {
    const result = ArrayFilterable.filter(x => x > 0, []);
    assertEquals(result, []);
});

test('ArrayFilterable.filter - with objects', () => {
    const users = [
        { name: 'Kim', age: 25 },
        { name: 'Lee', age: 17 },
        { name: 'Park', age: 30 }
    ];
    const adults = ArrayFilterable.filter(u => u.age >= 18, users);
    assertEquals(adults.length, 2);
    assertEquals(adults[0].name, 'Kim');
    assertEquals(adults[1].name, 'Park');
});

test('ArrayFilterable.filter - preserves order', () => {
    const result = ArrayFilterable.filter(x => x % 2 === 1, [5, 4, 3, 2, 1]);
    assertEquals(result, [5, 3, 1]);
});

console.log('\n✅ All Filterable tests completed!');
