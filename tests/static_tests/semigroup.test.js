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
    BooleanAnySemigroup,
    ArraySemigroup
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

// ========== ArraySemigroup ==========
console.log('\n📦 ArraySemigroup...');

test('ArraySemigroup.concat - concatenates arrays', () => {
    assertEquals(ArraySemigroup.concat([1, 2], [3, 4]), [1, 2, 3, 4]);
    assertEquals(ArraySemigroup.concat([], [1]), [1]);
    assertEquals(ArraySemigroup.concat(['a'], ['b']), ['a', 'b']);
});

// ========== Semigroup.of (API) ==========
console.log('\n📦 Semigroup.of...');

test('Semigroup.of - number (default: sum)', () => {
    assertEquals(Semigroup.of('number').concat(1, 2), 3);
});

test('Semigroup.of - string', () => {
    assertEquals(Semigroup.of('string').concat('a', 'b'), 'ab');
});

test('Semigroup.of - boolean (default: all)', () => {
    assertEquals(Semigroup.of('boolean').concat(true, false), false);
});

test('Semigroup.of - explicit type selection', () => {
    assertEquals(Semigroup.of('NumberProductSemigroup').concat(2, 3), 6);
    assertEquals(Semigroup.of('NumberMaxSemigroup').concat(5, 10), 10);
    assertEquals(Semigroup.of('NumberMinSemigroup').concat(5, 10), 5);
    assertEquals(Semigroup.of('BooleanAnySemigroup').concat(false, true), true);
});

// ========== Error handling ==========
console.log('\n📦 Error handling...');

test('Semigroup.of - throws on type mismatch', () => {
    assertThrows(() => Semigroup.of('number').concat(1, '1'), 'type mismatch');
});

test('Semigroup.of - throws on unsupported key', () => {
    assertThrows(() => Semigroup.of('unsupported_type'), 'unsupported key');
});

// ========== Semigroup Laws ==========
console.log('\n📦 Semigroup Laws...');

test('Semigroup Law: Associativity - concat(concat(a,b),c) = concat(a,concat(b,c))', () => {
    const sg = Semigroup.of('number');
    const a = 1, b = 2, c = 3;
    assertEquals(
        sg.concat(sg.concat(a, b), c),
        sg.concat(a, sg.concat(b, c))
    );
});

test('Semigroup Law: Associativity - string', () => {
    const sg = Semigroup.of('string');
    const a = 'x', b = 'y', c = 'z';
    assertEquals(
        sg.concat(sg.concat(a, b), c),
        sg.concat(a, sg.concat(b, c))
    );
});

test('Semigroup Law: Associativity - boolean (all)', () => {
    const sg = Semigroup.of('boolean');
    const a = true, b = true, c = false;
    assertEquals(
        sg.concat(sg.concat(a, b), c),
        sg.concat(a, sg.concat(b, c))
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
    Semigroup.types.custom_array = new ArrayConcatSemigroup();
    assertEquals(Semigroup.of('custom_array').concat([1, 2], [3, 4]), [1, 2, 3, 4]);
});

console.log('\n✅ All Semigroup tests completed!');
