const { test, assert, assertEquals, assertThrows } = require('../utils.js');
const $core = require('../../static_modules/impl.js');
const {
    Bifunctor,
    TupleBifunctor
} = $core;

console.log('🚀 Starting Bifunctor tests...\n');

// ========== TupleBifunctor ==========
console.log('📦 TupleBifunctor...');

test('TupleBifunctor.bimap - transforms both elements', () => {
    const result = TupleBifunctor.bimap(x => x * 2, s => s.toUpperCase(), [5, 'hello']);
    assertEquals(result, [10, 'HELLO']);
});

test('TupleBifunctor.bimap - with same type', () => {
    const result = TupleBifunctor.bimap(x => x + 1, x => x * 2, [3, 4]);
    assertEquals(result, [4, 8]);
});

test('TupleBifunctor.bimap - type transformation', () => {
    const result = TupleBifunctor.bimap(x => x.toString(), n => n * 10, ['abc', 5]);
    assertEquals(result, ['abc', 50]);
});

test('TupleBifunctor.bimap - with objects', () => {
    const result = TupleBifunctor.bimap(
        user => user.name,
        nums => nums.reduce((a, b) => a + b, 0),
        [{ name: 'Kim', age: 30 }, [1, 2, 3]]
    );
    assertEquals(result, ['Kim', 6]);
});

// ========== Bifunctor.of API ==========
console.log('\n📦 Bifunctor.of...');

test('Bifunctor.of - tuple', () => {
    const B = Bifunctor.of('tuple');
    const result = B.bimap(x => x * 2, x => x + '!', [10, 'hi']);
    assertEquals(result, [20, 'hi!']);
});

test('Bifunctor.of - throws on unsupported key', () => {
    assertThrows(() => Bifunctor.of('unsupported'), 'unsupported key');
});

test('Bifunctor.of - throws on non-function arguments', () => {
    const B = Bifunctor.of('tuple');
    assertThrows(() => B.bimap('notAFunction', x => x, [1, 2]), 'must be functions');
    assertThrows(() => B.bimap(x => x, 123, [1, 2]), 'must be functions');
});

// ========== Bifunctor Laws ==========
console.log('\n📦 Bifunctor Laws...');

// Law 1: Identity - bimap(x => x, x => x, a) ≡ a
test('Bifunctor Law: Identity - bimap(id, id, a) ≡ a', () => {
    const id = x => x;
    const a = [42, 'test'];
    const result = TupleBifunctor.bimap(id, id, a);
    assertEquals(result, a);
});

// Law 2: Composition - bimap(f1∘f2, g1∘g2, a) ≡ bimap(f1, g1, bimap(f2, g2, a))
test('Bifunctor Law: Composition', () => {
    const f1 = x => x * 2;
    const f2 = x => x + 1;
    const g1 = s => s.toUpperCase();
    const g2 = s => s + '!';
    const a = [5, 'hello'];

    const left = TupleBifunctor.bimap(x => f1(f2(x)), s => g1(g2(s)), a);
    const right = TupleBifunctor.bimap(f1, g1, TupleBifunctor.bimap(f2, g2, a));

    assertEquals(left, right);  // [12, 'HELLO!']
});

// ========== Edge Cases ==========
console.log('\n📦 Edge Cases...');

test('TupleBifunctor.bimap - with null/undefined values', () => {
    const result = TupleBifunctor.bimap(x => x ?? 'default', x => x ?? 0, [null, undefined]);
    assertEquals(result, ['default', 0]);
});

test('TupleBifunctor.bimap - chaining', () => {
    const result = TupleBifunctor.bimap(
        x => x * 10,
        s => s.length,
        TupleBifunctor.bimap(x => x + 1, s => s.toUpperCase(), [5, 'hello'])
    );
    assertEquals(result, [60, 5]);  // (5+1)*10 = 60, 'HELLO'.length = 5
});

test('TupleBifunctor.bimap - preserves tuple structure', () => {
    const result = TupleBifunctor.bimap(x => [x], x => [x], [1, 2]);
    assertEquals(result, [[1], [2]]);
});

console.log('\n✅ All Bifunctor tests completed!');
