const lib = require('../index.js')();
const { monoid: M } = lib;

const { test, assert, assertEquals } = require('./utils.js');
console.log('🚀 Starting modules/monoid.js tests...\n');

// === Number Monoids ===
test('number.sum - fold', () => {
    const result = M.fold(M.number.sum)([1, 2, 3, 4, 5]);
    assert(result.isRight());
    assertEquals(result.value, 15);
});

test('number.sum - empty array returns empty (0)', () => {
    const result = M.fold(M.number.sum)([]);
    assert(result.isRight());
    assertEquals(result.value, 0);
});

test('number.product - fold', () => {
    const result = M.fold(M.number.product)([1, 2, 3, 4]);
    assert(result.isRight());
    assertEquals(result.value, 24);
});

test('number.product - empty array returns empty (1)', () => {
    const result = M.fold(M.number.product)([]);
    assert(result.isRight());
    assertEquals(result.value, 1);
});

test('number.max - fold', () => {
    const result = M.fold(M.number.max)([1, 5, 3, 2]);
    assert(result.isRight());
    assertEquals(result.value, 5);
});

test('number.min - fold', () => {
    const result = M.fold(M.number.min)([1, 5, 3, 2]);
    assert(result.isRight());
    assertEquals(result.value, 1);
});

// === String Monoid ===
test('string.concat - fold', () => {
    const result = M.fold(M.string.concat)(['a', 'b', 'c']);
    assert(result.isRight());
    assertEquals(result.value, 'abc');
});

test('string.concat - empty array returns empty ("")', () => {
    const result = M.fold(M.string.concat)([]);
    assert(result.isRight());
    assertEquals(result.value, '');
});

// === Boolean Monoids ===
test('boolean.all - fold (all true)', () => {
    const result = M.fold(M.boolean.all)([true, true, true]);
    assert(result.isRight());
    assertEquals(result.value, true);
});

test('boolean.all - fold (one false)', () => {
    const result = M.fold(M.boolean.all)([true, false, true]);
    assert(result.isRight());
    assertEquals(result.value, false);
});

test('boolean.any - fold (all false)', () => {
    const result = M.fold(M.boolean.any)([false, false, false]);
    assert(result.isRight());
    assertEquals(result.value, false);
});

test('boolean.any - fold (one true)', () => {
    const result = M.fold(M.boolean.any)([false, true, false]);
    assert(result.isRight());
    assertEquals(result.value, true);
});

test('boolean.xor - fold', () => {
    const result = M.fold(M.boolean.xor)([true, false, true]);
    assert(result.isRight());
    assertEquals(result.value, false); // true xor false xor true = false
});

// === Array Monoid ===
test('array.concat - fold', () => {
    const result = M.fold(M.array.concat)([[1], [2, 3], [4]]);
    assert(result.isRight());
    assertEquals(result.value, [1, 2, 3, 4]);
});

test('array.concat - empty array returns empty ([])', () => {
    const result = M.fold(M.array.concat)([]);
    assert(result.isRight());
    assertEquals(result.value, []);
});

// === Object Monoid ===
test('object.merge - fold', () => {
    const result = M.fold(M.object.merge)([{ a: 1 }, { b: 2 }, { c: 3 }]);
    assert(result.isRight());
    assertEquals(result.value, { a: 1, b: 2, c: 3 });
});

test('object.merge - later values override', () => {
    const result = M.fold(M.object.merge)([{ a: 1 }, { a: 2 }]);
    assert(result.isRight());
    assertEquals(result.value, { a: 2 });
});

// === Function Monoid (endo) ===
test('function.endo - fold', () => {
    const add1 = x => x + 1;
    const double = x => x * 2;

    // fold now works with compose2 (ignores extra reduce args)
    const result = M.fold(M.function.endo)([add1, double]);
    assert(result.isRight());
    // compose2(compose2(identity, add1), double)(5)
    // = compose2(add1, double)(5) = add1(double(5)) = 11
    assertEquals(result.value(5), 11);
});

// === Any Monoids (first/last) ===
test('any.first - fold', () => {
    const result = M.fold(M.any.first)([1, 2, 3]);
    assert(result.isRight());
    assertEquals(result.value, 1);
});

test('any.first - empty array returns null', () => {
    const result = M.fold(M.any.first)([]);
    assert(result.isRight());
    assertEquals(result.value, null);
});

test('any.last - fold', () => {
    const result = M.fold(M.any.last)([1, 2, 3]);
    assert(result.isRight());
    assertEquals(result.value, 3);
});

test('any.last - empty array returns null', () => {
    const result = M.fold(M.any.last)([]);
    assert(result.isRight());
    assertEquals(result.value, null);
});

// === foldMap (fold with mapper) ===
test('fold with mapper - sum of lengths', () => {
    const result = M.fold(M.number.sum, s => s.length)(['hello', 'world']);
    assert(result.isRight());
    assertEquals(result.value, 10);
});

test('fold with mapper - all positive', () => {
    const result = M.fold(M.boolean.all, x => x > 0)([1, 2, 3]);
    assert(result.isRight());
    assertEquals(result.value, true);
});

// === concat ===
test('concat - two values', () => {
    const result = M.concat(M.number.sum)(3, 5);
    assert(result.isRight());
    assertEquals(result.value, 8);
});

test('concat - type mismatch returns Left', () => {
    const result = M.concat(M.number.sum)(3, 'five');
    assert(result.isLeft());
});

// === invert (Group) ===
test('invert - number.sum', () => {
    const result = M.invert(M.number.sum)(5);
    assert(result.isRight());
    assertEquals(result.value, -5);
});

test('invert - number.product', () => {
    const result = M.invert(M.number.product)(5);
    assert(result.isRight());
    assertEquals(result.value, 0.2);
});

test('invert - boolean.xor (self-inverse)', () => {
    const result = M.invert(M.boolean.xor)(true);
    assert(result.isRight());
    assertEquals(result.value, true);
});

test('invert - monoid without inverse returns Left', () => {
    const result = M.invert(M.number.max)(5);
    assert(result.isLeft());
});

// === power ===
test('power - repeat sum', () => {
    const result = M.power(M.number.sum)(3, 4);
    assert(result.isRight());
    assertEquals(result.value, 12); // 3+3+3+3
});

test('power - repeat string', () => {
    const result = M.power(M.string.concat)('ab', 3);
    assert(result.isRight());
    assertEquals(result.value, 'ababab');
});

test('power - 0 returns empty', () => {
    const result = M.power(M.number.sum)(100, 0);
    assert(result.isRight());
    assertEquals(result.value, 0);
});

test('power - negative returns Left', () => {
    const result = M.power(M.number.sum)(3, -1);
    assert(result.isLeft());
});

// === isMonoid ===
test('isMonoid - validates monoid structure', () => {
    assert(M.isMonoid(M.number.sum), 'number.sum should be monoid');
    assert(M.isMonoid(M.string.concat), 'string.concat should be monoid');
    assert(!M.isMonoid({}), 'empty object should not be monoid');
    assert(!M.isMonoid(null), 'null should not be monoid');
});

console.log('\n🛡️ Starting Boundary and Error tests...');

test('fold - invalid monoid returns Left', () => {
    const result = M.fold({})([1, 2, 3]);
    assert(result.isLeft());
});

test('fold - type mismatch returns Left', () => {
    const result = M.fold(M.number.sum)([1, 'two', 3]);
    assert(result.isLeft());
});

test('power - non-number nth returns Left', () => {
    const result = M.power(M.number.sum)(3, 'many');
    assert(result.isLeft());
});

test('power - type mismatch returns Left', () => {
    const result = M.power(M.number.sum)('three', 4);
    assert(result.isLeft());
});
