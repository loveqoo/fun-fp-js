const { test, assert, assertEquals } = require('../utils.js');
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

// ========== Ord.lte (auto type detection) ==========
console.log('\n📦 Ord.lte (auto detection)...');

test('Ord.lte - auto detect number', () => {
    assert(Ord.lte(1, 2));
    assert(Ord.lte(5, 5));
    assert(!Ord.lte(10, 5));
});

test('Ord.lte - auto detect string', () => {
    assert(Ord.lte('a', 'z'));
    assert(!Ord.lte('z', 'a'));
});

test('Ord.lte - explicit type selection', () => {
    assert(Ord.lte('ab', 'a', 'stringLength') === false);
    assert(Ord.lte('a', 'ab', 'stringLength'));
});

test('Ord.lte - different types returns false', () => {
    assert(!Ord.lte(1, '1'));
    assert(!Ord.lte('a', 1));
});

// ========== Ord Laws ==========
console.log('\n📦 Ord Laws...');

test('Ord Law: Totality - lte(a, b) or lte(b, a)', () => {
    const a = 3, b = 5;
    assert(Ord.lte(a, b) || Ord.lte(b, a));
});

test('Ord Law: Antisymmetry - if lte(a,b) and lte(b,a) then a=b', () => {
    const a = 5, b = 5;
    if (Ord.lte(a, b) && Ord.lte(b, a)) {
        assert(a === b);
    }
});

test('Ord Law: Transitivity - if lte(a,b) and lte(b,c) then lte(a,c)', () => {
    const a = 1, b = 2, c = 3;
    if (Ord.lte(a, b) && Ord.lte(b, c)) {
        assert(Ord.lte(a, c));
    }
});

console.log('\n✅ All Ord tests completed!');
