const { test, assert, assertEquals, assertThrows } = require('../utils.js');
const $core = require('../../static_modules/core.js');
const {
    Semigroup,
    NumberSumSemigroup,
    NumberProductSemigroup,
    NumberMaxSemigroup,
    NumberMinSemigroup,
    StringSemigroup,
    BooleanAllSemigroup,
    BooleanAnySemigroup
} = $core;

console.log('🚀 Starting Semigroup tests...\n');

// ========== NumberSumSemigroup ==========
console.log('📦 NumberSumSemigroup...');

test('NumberSumSemigroup.concat - adds numbers', () => {
    assertEquals(NumberSumSemigroup.concat(1, 2), 3);
    assertEquals(NumberSumSemigroup.concat(0, 5), 5);
    assertEquals(NumberSumSemigroup.concat(-3, 3), 0);
});

// ========== NumberProductSemigroup ==========
console.log('\n📦 NumberProductSemigroup...');

test('NumberProductSemigroup.concat - multiplies numbers', () => {
    assertEquals(NumberProductSemigroup.concat(2, 3), 6);
    assertEquals(NumberProductSemigroup.concat(5, 0), 0);
    assertEquals(NumberProductSemigroup.concat(-2, 3), -6);
});

// ========== NumberMaxSemigroup ==========
console.log('\n📦 NumberMaxSemigroup...');

test('NumberMaxSemigroup.concat - returns max', () => {
    assertEquals(NumberMaxSemigroup.concat(1, 5), 5);
    assertEquals(NumberMaxSemigroup.concat(10, 3), 10);
    assertEquals(NumberMaxSemigroup.concat(-5, -1), -1);
});

// ========== NumberMinSemigroup ==========
console.log('\n📦 NumberMinSemigroup...');

test('NumberMinSemigroup.concat - returns min', () => {
    assertEquals(NumberMinSemigroup.concat(1, 5), 1);
    assertEquals(NumberMinSemigroup.concat(10, 3), 3);
    assertEquals(NumberMinSemigroup.concat(-5, -1), -5);
});

// ========== StringSemigroup ==========
console.log('\n📦 StringSemigroup...');

test('StringSemigroup.concat - concatenates strings', () => {
    assertEquals(StringSemigroup.concat('hello', ' world'), 'hello world');
    assertEquals(StringSemigroup.concat('', 'test'), 'test');
    assertEquals(StringSemigroup.concat('a', 'b'), 'ab');
});

// ========== BooleanAllSemigroup ==========
console.log('\n📦 BooleanAllSemigroup...');

test('BooleanAllSemigroup.concat - logical AND', () => {
    assertEquals(BooleanAllSemigroup.concat(true, true), true);
    assertEquals(BooleanAllSemigroup.concat(true, false), false);
    assertEquals(BooleanAllSemigroup.concat(false, false), false);
});

// ========== BooleanAnySemigroup ==========
console.log('\n📦 BooleanAnySemigroup...');

test('BooleanAnySemigroup.concat - logical OR', () => {
    assertEquals(BooleanAnySemigroup.concat(false, false), false);
    assertEquals(BooleanAnySemigroup.concat(true, false), true);
    assertEquals(BooleanAnySemigroup.concat(true, true), true);
});

// ========== Semigroup.concat (auto type detection) ==========
console.log('\n📦 Semigroup.concat (auto detection)...');

test('Semigroup.concat - auto detect number (default: sum)', () => {
    assertEquals(Semigroup.concat(1, 2), 3);
});

test('Semigroup.concat - auto detect string', () => {
    assertEquals(Semigroup.concat('a', 'b'), 'ab');
});

test('Semigroup.concat - auto detect boolean (default: all)', () => {
    assertEquals(Semigroup.concat(true, false), false);
});

test('Semigroup.concat - explicit type selection', () => {
    assertEquals(Semigroup.concat(2, 3, 'numberProduct'), 6);
    assertEquals(Semigroup.concat(5, 10, 'numberMax'), 10);
    assertEquals(Semigroup.concat(5, 10, 'numberMin'), 5);
    assertEquals(Semigroup.concat(false, true, 'booleanAny'), true);
});

// ========== Error handling ==========
console.log('\n📦 Error handling...');

test('Semigroup.concat - throws on type mismatch', () => {
    assertThrows(() => Semigroup.concat(1, '1'), 'type mismatch');
});

test('Semigroup.concat - throws on unsupported type', () => {
    assertThrows(() => Semigroup.concat({}, {}), 'unsupported type');
});

// ========== Semigroup Laws ==========
console.log('\n📦 Semigroup Laws...');

test('Semigroup Law: Associativity - concat(concat(a,b),c) = concat(a,concat(b,c))', () => {
    const a = 1, b = 2, c = 3;
    assertEquals(
        Semigroup.concat(Semigroup.concat(a, b), c),
        Semigroup.concat(a, Semigroup.concat(b, c))
    );
});

test('Semigroup Law: Associativity - string', () => {
    const a = 'x', b = 'y', c = 'z';
    assertEquals(
        Semigroup.concat(Semigroup.concat(a, b), c),
        Semigroup.concat(a, Semigroup.concat(b, c))
    );
});

test('Semigroup Law: Associativity - boolean (all)', () => {
    const a = true, b = true, c = false;
    assertEquals(
        Semigroup.concat(Semigroup.concat(a, b), c),
        Semigroup.concat(a, Semigroup.concat(b, c))
    );
});

// ========== 확장성 테스트 ==========
console.log('\n📦 Extensibility...');

test('Custom Semigroup - can add to types', () => {
    class ArrayConcatSemigroup extends Semigroup {
        constructor() {
            super((a, b) => [...a, ...b], 'Array');
        }
    }
    Semigroup.types.array = new ArrayConcatSemigroup();
    assertEquals(Semigroup.concat([1, 2], [3, 4], 'array'), [1, 2, 3, 4]);
});

console.log('\n✅ All Semigroup tests completed!');
