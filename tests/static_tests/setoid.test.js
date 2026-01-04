const { test, assert, assertEquals, assertThrows } = require('../utils.js');
const $core = require('../../static_modules/impl.js');
const { Algebra, Setoid } = $core;
const { NumberSetoid, StringSetoid, BooleanSetoid } = Setoid.types;
const DateSetoid = Setoid.types.date;

console.log('🚀 Starting Setoid tests...\n');

// ========== Algebra 유틸리티 ==========
console.log('📦 Algebra utilities...');

test('Algebra.typeOf - number', () => {
    assertEquals(Algebra.typeOf(42), 'number');
});

test('Algebra.typeOf - string', () => {
    assertEquals(Algebra.typeOf('hello'), 'string');
});

test('Algebra.typeOf - boolean', () => {
    assertEquals(Algebra.typeOf(true), 'boolean');
});

test('Algebra.typeOf - null', () => {
    assertEquals(Algebra.typeOf(null), 'null');
});

test('Algebra.typeOf - undefined', () => {
    assertEquals(Algebra.typeOf(undefined), 'undefined');
});

test('Algebra.typeOf - Date', () => {
    assertEquals(Algebra.typeOf(new Date()), 'Date');
});

test('Algebra.isSameType - same types', () => {
    assert(Algebra.isSameType(1, 2));
    assert(Algebra.isSameType('a', 'b'));
    assert(Algebra.isSameType(true, false));
});

test('Algebra.isSameType - different types', () => {
    assert(!Algebra.isSameType(1, '1'));
    assert(!Algebra.isSameType(true, 1));
});

// ========== NumberSetoid ==========
console.log('\n📦 NumberSetoid...');

test('NumberSetoid.equals - same numbers', () => {
    assert(NumberSetoid.equals(1, 1));
    assert(NumberSetoid.equals(0, 0));
    assert(NumberSetoid.equals(-5, -5));
});

test('NumberSetoid.equals - different numbers', () => {
    assert(!NumberSetoid.equals(1, 2));
    assert(!NumberSetoid.equals(0, 1));
});

// ========== StringSetoid ==========
console.log('\n📦 StringSetoid...');

test('StringSetoid.equals - same strings', () => {
    assert(StringSetoid.equals('hello', 'hello'));
    assert(StringSetoid.equals('', ''));
});

test('StringSetoid.equals - different strings', () => {
    assert(!StringSetoid.equals('hello', 'world'));
    assert(!StringSetoid.equals('a', 'A'));
});

// ========== BooleanSetoid ==========
console.log('\n📦 BooleanSetoid...');

test('BooleanSetoid.equals - same booleans', () => {
    assert(BooleanSetoid.equals(true, true));
    assert(BooleanSetoid.equals(false, false));
});

test('BooleanSetoid.equals - different booleans', () => {
    assert(!BooleanSetoid.equals(true, false));
});

// ========== DateSetoid ==========
console.log('\n📦 DateSetoid...');

test('DateSetoid.equals - same dates', () => {
    const d1 = new Date('2024-01-01');
    const d2 = new Date('2024-01-01');
    assert(DateSetoid.equals(d1, d2));
});

test('DateSetoid.equals - different dates', () => {
    const d1 = new Date('2024-01-01');
    const d2 = new Date('2024-12-31');
    assert(!DateSetoid.equals(d1, d2));
});

test('DateSetoid.equals - same timestamp different objects', () => {
    const timestamp = Date.now();
    const d1 = new Date(timestamp);
    const d2 = new Date(timestamp);
    assert(DateSetoid.equals(d1, d2));
});

// ========== Setoid.of (API) ==========
console.log('\n📦 Setoid.of...');

test('Setoid.of - number', () => {
    assert(Setoid.of('number').equals(42, 42));
    assert(!Setoid.of('number').equals(42, 43));
});

test('Setoid.of - string', () => {
    assert(Setoid.of('string').equals('test', 'test'));
    assert(!Setoid.of('string').equals('test', 'TEST'));
});

test('Setoid.of - boolean', () => {
    assert(Setoid.of('boolean').equals(true, true));
    assert(!Setoid.of('boolean').equals(true, false));
});

test('Setoid.of - throws on type mismatch', () => {
    assertThrows(() => Setoid.of('number').equals(1, '1'), 'type mismatch');
});

// ========== Setoid Laws ==========
console.log('\n📦 Setoid Laws...');

test('Setoid Law: Reflexivity - a equals a', () => {
    assert(Setoid.of('number').equals(5, 5));
    assert(Setoid.of('string').equals('x', 'x'));
});

test('Setoid Law: Symmetry - equals(a, b) === equals(b, a)', () => {
    const setoid = Setoid.of('number');
    assertEquals(setoid.equals(1, 2), setoid.equals(2, 1));
});

test('Setoid Law: Transitivity - if a=b and b=c then a=c', () => {
    const setoid = Setoid.of('number');
    const a = 5, b = 5, c = 5;
    if (setoid.equals(a, b) && setoid.equals(b, c)) {
        assert(setoid.equals(a, c));
    }
});

// ========== 확장성 테스트 ==========
console.log('\n📦 Extensibility...');

test('Custom Setoid - can add to types', () => {
    class ArrayLengthSetoid extends Setoid {
        constructor() {
            super((a, b) => a.length === b.length, 'Array');
        }
    }
    Setoid.types.arraylength = new ArrayLengthSetoid();
    assert(Setoid.of('arraylength').equals([1, 2], [3, 4]));
    assert(!Setoid.of('arraylength').equals([1], [1, 2]));
});

console.log('\n✅ All Setoid tests completed!');
