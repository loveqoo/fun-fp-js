const { test, assert, assertEquals, assertThrows } = require('../utils.js');
const $core = require('../../static_modules/core.js');
const {
    Functor,
    ArrayFunctor
} = $core;

console.log('🚀 Starting Functor tests...\n');

// ========== ArrayFunctor ==========
console.log('📦 ArrayFunctor...');

test('ArrayFunctor.map - transforms array elements', () => {
    const result = ArrayFunctor.map(x => x * 2, [1, 2, 3, 4, 5]);
    assertEquals(result, [2, 4, 6, 8, 10]);
});

test('ArrayFunctor.map - with string transformation', () => {
    const result = ArrayFunctor.map(s => s.toUpperCase(), ['a', 'b', 'c']);
    assertEquals(result, ['A', 'B', 'C']);
});

test('ArrayFunctor.map - type transformation', () => {
    const result = ArrayFunctor.map(x => x.toString(), [1, 2, 3]);
    assertEquals(result, ['1', '2', '3']);
});

test('ArrayFunctor.map - empty array', () => {
    const result = ArrayFunctor.map(x => x * 2, []);
    assertEquals(result, []);
});

// ========== Functor.of API ==========
console.log('\n📦 Functor.of...');

test('Functor.of - array', () => {
    const F = Functor.of('array');
    assertEquals(F.map(x => x + 1, [1, 2, 3]), [2, 3, 4]);
});

test('Functor.of - throws on unsupported key', () => {
    assertThrows(() => Functor.of('unsupported'), 'unsupported key');
});

test('Functor.of - throws on non-function mapper', () => {
    const F = Functor.of('array');
    assertThrows(() => F.map('notAFunction', [1, 2, 3]), 'must be a function');
    assertThrows(() => F.map(123, [1, 2, 3]), 'must be a function');
});

// ========== Functor Laws ==========
console.log('\n📦 Functor Laws...');

// Law 1: Identity - F.map(x => x, a) ≡ a
test('Functor Law: Identity - map(x => x, a) ≡ a', () => {
    const a = [1, 2, 3, 4, 5];
    const result = ArrayFunctor.map(x => x, a);
    assertEquals(result, a);
});

// Law 2: Composition - F.map(x => f(g(x)), a) ≡ F.map(f, F.map(g, a))
test('Functor Law: Composition - map(f∘g, a) ≡ map(f, map(g, a))', () => {
    const f = x => x * 2;
    const g = x => x + 1;
    const a = [1, 2, 3];

    const left = ArrayFunctor.map(x => f(g(x)), a);
    const right = ArrayFunctor.map(f, ArrayFunctor.map(g, a));

    assertEquals(left, right);  // [4, 6, 8]
});

test('Functor Law: Composition - with different functions', () => {
    const f = s => s.toUpperCase();
    const g = s => s + '!';
    const a = ['a', 'b', 'c'];

    const left = ArrayFunctor.map(x => f(g(x)), a);
    const right = ArrayFunctor.map(f, ArrayFunctor.map(g, a));

    assertEquals(left, right);  // ['A!', 'B!', 'C!']
});

// ========== Edge Cases ==========
console.log('\n📦 Edge Cases...');

test('ArrayFunctor.map - with objects', () => {
    const users = [{ name: 'Kim' }, { name: 'Lee' }];
    const names = ArrayFunctor.map(u => u.name, users);
    assertEquals(names, ['Kim', 'Lee']);
});

test('ArrayFunctor.map - preserves length', () => {
    const result = ArrayFunctor.map(x => null, [1, 2, 3]);
    assertEquals(result.length, 3);
});

test('ArrayFunctor.map - chaining', () => {
    const result = ArrayFunctor.map(
        x => x * 10,
        ArrayFunctor.map(x => x + 1, [1, 2, 3])
    );
    assertEquals(result, [20, 30, 40]);
});

console.log('\n✅ All Functor tests completed!');
