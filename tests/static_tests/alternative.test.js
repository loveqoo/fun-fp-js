const { test, assert, assertEquals, assertThrows } = require('../utils.js');
const $core = require('../../static_modules/impl.js');
const {
    Alternative,
    ArrayAlternative
} = $core;

console.log('🚀 Starting Alternative tests...\n');

// ========== ArrayAlternative ==========
console.log('📦 ArrayAlternative...');

test('ArrayAlternative.of - wraps value in array', () => {
    assertEquals(ArrayAlternative.of(42), [42]);
});

test('ArrayAlternative.zero - returns an empty array', () => {
    assertEquals(ArrayAlternative.zero(), []);
});

test('ArrayAlternative.ap - inherited from Applicative', () => {
    const result = ArrayAlternative.ap([x => x * 2], [1, 2, 3]);
    assertEquals(result, [2, 4, 6]);
});

test('ArrayAlternative.alt - inherited from Plus', () => {
    const result = ArrayAlternative.alt([1, 2], [3, 4]);
    assertEquals(result, [1, 2, 3, 4]);
});

test('ArrayAlternative.map - inherited from Functor', () => {
    const result = ArrayAlternative.map(x => x * 2, [1, 2, 3]);
    assertEquals(result, [2, 4, 6]);
});

// ========== Alternative.of API ==========
console.log('\n📦 Alternative.of...');

test('Alternative.of - array', () => {
    const A = Alternative.of('array');
    assertEquals(A.of(42), [42]);
    assertEquals(A.zero(), []);
    assertEquals(A.alt([1], [2]), [1, 2]);
    assertEquals(A.ap([x => x + 1], [10]), [11]);
});

test('Alternative.of - throws on unsupported key', () => {
    assertThrows(() => Alternative.of('unsupported'), 'unsupported key');
});

// ========== Alternative Laws ==========
console.log('\n📦 Alternative Laws...');

// Law 1: Distributivity - ap(alt(f, g), x) ≡ alt(ap(f, x), ap(g, x))
test('Alternative Law: Distributivity - ap(alt(f, g), x) ≡ alt(ap(f, x), ap(g, x))', () => {
    const f = [x => x * 2];
    const g = [x => x + 10];
    const x = [5];

    // ap(alt(f, g), x) -> ap([*2, +10], [5]) -> [10, 15]
    const left = ArrayAlternative.ap(ArrayAlternative.alt(f, g), x);
    // alt(ap(f, x), ap(g, x)) -> alt([10], [15]) -> [10, 15]
    const right = ArrayAlternative.alt(ArrayAlternative.ap(f, x), ArrayAlternative.ap(g, x));

    assertEquals(left, right);
});

// Law 2: Annihilation - ap(zero(), x) ≡ zero()
test('Alternative Law: Annihilation - ap(zero(), x) ≡ zero()', () => {
    const x = [1, 2, 3];
    const left = ArrayAlternative.ap(ArrayAlternative.zero(), x);
    const right = ArrayAlternative.zero();

    assertEquals(left, right);
});

// ========== Edge Cases ==========
console.log('\n📦 Edge Cases...');

test('ArrayAlternative - inheritance chain', () => {
    assert(ArrayAlternative instanceof $core.Applicative, 'should be instance of Applicative');
    assert(ArrayAlternative instanceof $core.Apply, 'should be instance of Apply');
    assert(ArrayAlternative instanceof $core.Functor, 'should be instance of Functor');
    // Note: ArrayAlternative extends Applicative, and we mixed in Plus methods.
    // It is not an instance of Plus because JS doesn't support multiple inheritance,
    // but it has all the methods.
    assertEquals(typeof ArrayAlternative.alt, 'function');
    assertEquals(typeof ArrayAlternative.zero, 'function');
});

console.log('\n✅ All Alternative tests completed!');
