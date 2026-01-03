const { test, assert, assertEquals, assertThrows } = require('../utils.js');
const $core = require('../../static_modules/core.js');
const { Ord, NumberOrd, StringOrd, StringLengthOrd, StringLocaleOrd } = $core;

console.log('🚀 Starting Ord tests...\n');

// ========== NumberOrd ==========
console.log('📦 NumberOrd...');

test('NumberOrd.lte - less than', () => {
    assert(NumberOrd.lte(1, 2));
    assert(NumberOrd.lte(-5, 0));
});

test('NumberOrd.lte - equal', () => {
    assert(NumberOrd.lte(5, 5));
    assert(NumberOrd.lte(0, 0));
});

test('NumberOrd.lte - greater than', () => {
    assert(!NumberOrd.lte(5, 3));
    assert(!NumberOrd.lte(0, -1));
});

// ========== StringOrd ==========
console.log('\n📦 StringOrd...');

test('StringOrd.lte - lexicographic order', () => {
    assert(StringOrd.lte('a', 'b'));
    assert(StringOrd.lte('apple', 'banana'));
});

test('StringOrd.lte - equal strings', () => {
    assert(StringOrd.lte('hello', 'hello'));
});

test('StringOrd.lte - greater', () => {
    assert(!StringOrd.lte('z', 'a'));
});

// ========== StringLengthOrd ==========
console.log('\n📦 StringLengthOrd...');

test('StringLengthOrd.lte - shorter string', () => {
    assert(StringLengthOrd.lte('a', 'abc'));
    assert(StringLengthOrd.lte('', 'x'));
});

test('StringLengthOrd.lte - same length', () => {
    assert(StringLengthOrd.lte('abc', 'xyz'));
});

test('StringLengthOrd.lte - longer string', () => {
    assert(!StringLengthOrd.lte('hello', 'hi'));
});

// ========== StringLocaleOrd ==========
console.log('\n📦 StringLocaleOrd...');

test('StringLocaleOrd.lte - locale order', () => {
    assert(StringLocaleOrd.lte('a', 'b'));
    assert(StringLocaleOrd.lte('가', '나'));  // Korean
});

test('StringLocaleOrd.lte - equal', () => {
    assert(StringLocaleOrd.lte('test', 'test'));
});

// ========== Ord.of (API) ==========
console.log('\n📦 Ord.of...');

test('Ord.of - number', () => {
    assert(Ord.of('number').lte(1, 2));
    assert(Ord.of('number').lte(5, 5));
    assert(!Ord.of('number').lte(10, 5));
});

test('Ord.of - string', () => {
    assert(Ord.of('string').lte('a', 'z'));
    assert(!Ord.of('string').lte('z', 'a'));
});

test('Ord.of - explicit type selection', () => {
    assert(Ord.of('StringLengthOrd').lte('ab', 'a') === false);
    assert(Ord.of('StringLengthOrd').lte('a', 'ab'));
});

test('Ord.of - throws on type mismatch', () => {
    assertThrows(() => Ord.of('number').lte(1, '1'), 'type mismatch');
});

// ========== Ord Laws ==========
console.log('\n📦 Ord Laws...');

test('Ord Law: Totality - lte(a, b) or lte(b, a)', () => {
    const ord = Ord.of('number');
    const a = 3, b = 5;
    assert(ord.lte(a, b) || ord.lte(b, a));
});

test('Ord Law: Antisymmetry - if lte(a,b) and lte(b,a) then a=b', () => {
    const ord = Ord.of('number');
    const a = 5, b = 5;
    if (ord.lte(a, b) && ord.lte(b, a)) {
        assert(a === b);
    }
});

test('Ord Law: Transitivity - if lte(a,b) and lte(b,c) then lte(a,c)', () => {
    const ord = Ord.of('number');
    const a = 1, b = 2, c = 3;
    if (ord.lte(a, b) && ord.lte(b, c)) {
        assert(ord.lte(a, c));
    }
});

console.log('\n✅ All Ord tests completed!');
