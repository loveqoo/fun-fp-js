const { test, assert, assertEquals, assertThrows } = require('../utils.js');
const $core = require('../../static_modules/core.js');
const {
    Monoid,
    NumberSumMonoid,
    NumberProductMonoid,
    NumberMaxMonoid,
    NumberMinMonoid,
    StringMonoid,
    BooleanAllMonoid,
    BooleanAnyMonoid,
    FirstMonoid,
    LastMonoid,
    ArrayMonoid
} = $core;

console.log('🚀 Starting Monoid tests...\n');

// ========== NumberSumMonoid ==========
console.log('📦 NumberSumMonoid...');

test('NumberSumMonoid.concat - adds numbers', () => {
    assertEquals(NumberSumMonoid.concat(1, 2), 3);
    assertEquals(NumberSumMonoid.empty(), 0);
    assertEquals(NumberSumMonoid.concat(NumberSumMonoid.empty(), 5), 5);
});

// ========== NumberProductMonoid ==========
console.log('\n📦 NumberProductMonoid...');

test('NumberProductMonoid.concat - multiplies numbers', () => {
    assertEquals(NumberProductMonoid.concat(2, 3), 6);
    assertEquals(NumberProductMonoid.empty(), 1);
    assertEquals(NumberProductMonoid.concat(NumberProductMonoid.empty(), 10), 10);
});

// ========== NumberMaxMonoid ==========
console.log('\n📦 NumberMaxMonoid...');

test('NumberMaxMonoid.concat - returns max', () => {
    assertEquals(NumberMaxMonoid.concat(1, 5), 5);
    assertEquals(NumberMaxMonoid.empty(), -Infinity);
    assertEquals(NumberMaxMonoid.concat(NumberMaxMonoid.empty(), 42), 42);
});

// ========== NumberMinMonoid ==========
console.log('\n📦 NumberMinMonoid...');

test('NumberMinMonoid.concat - returns min', () => {
    assertEquals(NumberMinMonoid.concat(1, 5), 1);
    assertEquals(NumberMinMonoid.empty(), Infinity);
    assertEquals(NumberMinMonoid.concat(NumberMinMonoid.empty(), 42), 42);
});

// ========== StringMonoid ==========
console.log('\n📦 StringMonoid...');

test('StringMonoid.concat - concatenates strings', () => {
    assertEquals(StringMonoid.concat('hello', ' world'), 'hello world');
    assertEquals(StringMonoid.empty(), '');
    assertEquals(StringMonoid.concat(StringMonoid.empty(), 'test'), 'test');
});

// ========== BooleanAllMonoid ==========
console.log('\n📦 BooleanAllMonoid...');

test('BooleanAllMonoid.concat - logical AND', () => {
    assertEquals(BooleanAllMonoid.concat(true, true), true);
    assertEquals(BooleanAllMonoid.empty(), true);
    assertEquals(BooleanAllMonoid.concat(BooleanAllMonoid.empty(), false), false);
});

// ========== BooleanAnyMonoid ==========
console.log('\n📦 BooleanAnyMonoid...');

test('BooleanAnyMonoid.concat - logical OR', () => {
    assertEquals(BooleanAnyMonoid.concat(false, false), false);
    assertEquals(BooleanAnyMonoid.empty(), false);
    assertEquals(BooleanAnyMonoid.concat(BooleanAnyMonoid.empty(), true), true);
});

// ========== ArrayMonoid ==========
console.log('\n📦 ArrayMonoid...');

test('ArrayMonoid.concat - concatenates arrays', () => {
    assertEquals(ArrayMonoid.concat([1, 2], [3, 4]), [1, 2, 3, 4]);
    assertEquals(ArrayMonoid.empty(), []);
    assertEquals(ArrayMonoid.concat(ArrayMonoid.empty(), [1, 2]), [1, 2]);
});

// ========== Monoid.of (API) ==========
console.log('\n📦 Monoid.of...');

test('Monoid.of - number (default: sum)', () => {
    const m = Monoid.of('number');
    assertEquals(m.concat(1, 2), 3);
    assertEquals(m.empty(), 0);
});

test('Monoid.of - string', () => {
    const m = Monoid.of('string');
    assertEquals(m.concat('a', 'b'), 'ab');
    assertEquals(m.empty(), '');
});

test('Monoid.of - boolean (default: all)', () => {
    const m = Monoid.of('boolean');
    assertEquals(m.concat(true, false), false);
    assertEquals(m.empty(), true);
});

test('Monoid.of - explicit type selection', () => {
    assertEquals(Monoid.of('NumberProductMonoid').concat(2, 3), 6);
    assertEquals(Monoid.of('NumberMaxMonoid').empty(), -Infinity);
    assertEquals(Monoid.of('BooleanAnyMonoid').empty(), false);
});

// ========== Error handling ==========
console.log('\n📦 Error handling...');

test('Monoid.of - throws on type mismatch', () => {
    assertThrows(() => Monoid.of('number').concat(1, '1'), 'type mismatch');
});

test('Monoid.of - throws on unsupported key', () => {
    assertThrows(() => Monoid.of('unsupported_type'), 'unsupported key');
});

// ========== Monoid Laws ==========
console.log('\n📦 Monoid Laws...');

test('Monoid Law: Associativity - concat(concat(a,b),c) = concat(a,concat(b,c))', () => {
    const m = Monoid.of('number');
    const a = 1, b = 2, c = 3;
    assertEquals(
        m.concat(m.concat(a, b), c),
        m.concat(a, m.concat(b, c))
    );
});

test('Monoid Law: Right Identity - concat(a, empty()) = a', () => {
    const m = Monoid.of('string');
    const a = 'hello';
    assertEquals(m.concat(a, m.empty()), a);
});

test('Monoid Law: Left Identity - concat(empty(), a) = a', () => {
    const m = Monoid.of('array');
    const a = [1, 2, 3];
    assertEquals(m.concat(m.empty(), a), a);
});

// ========== 확장성 테스트 ==========
console.log('\n📦 Extensibility...');

test('Custom Monoid - can add to types', () => {
    const { Semigroup } = $core;
    // 먼저 Custom Semigroup 생성
    class CustomObjectSemigroup extends Semigroup {
        constructor() {
            super((a, b) => ({ ...a, ...b }), 'object');
        }
    }
    Semigroup.types.custom_obj = new CustomObjectSemigroup();

    // Monoid는 Semigroup 객체를 받음
    class CustomObjectMonoid extends Monoid {
        constructor() {
            super(Semigroup.types.custom_obj, () => ({}), 'object');
        }
    }
    Monoid.types.custom_obj = new CustomObjectMonoid();

    const m = Monoid.of('custom_obj');
    assertEquals(m.concat({ a: 1 }, { b: 2 }), { a: 1, b: 2 });
    assertEquals(m.empty(), {});
});

console.log('\n✅ All Monoid tests completed!');
