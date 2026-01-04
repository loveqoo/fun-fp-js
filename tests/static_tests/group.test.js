const { test, assert, assertEquals, assertThrows } = require('../utils.js');
const $core = require('../../static_modules/core.js');
const {
    Group,
    NumberSumGroup,
    NumberProductGroup,
    BooleanXorGroup
} = $core;

console.log('🚀 Starting Group tests...\n');

// ========== NumberSumGroup ==========
console.log('📦 NumberSumGroup...');

test('NumberSumGroup.concat - adds numbers', () => {
    assertEquals(NumberSumGroup.concat(1, 2), 3);
});

test('NumberSumGroup.empty - returns 0', () => {
    assertEquals(NumberSumGroup.empty(), 0);
});

test('NumberSumGroup.invert - negates number', () => {
    assertEquals(NumberSumGroup.invert(5), -5);
    assertEquals(NumberSumGroup.invert(-3), 3);
});

// ========== NumberProductGroup ==========
console.log('\n📦 NumberProductGroup...');

test('NumberProductGroup.concat - multiplies numbers', () => {
    assertEquals(NumberProductGroup.concat(2, 3), 6);
});

test('NumberProductGroup.empty - returns 1', () => {
    assertEquals(NumberProductGroup.empty(), 1);
});

test('NumberProductGroup.invert - returns reciprocal', () => {
    assertEquals(NumberProductGroup.invert(2), 0.5);
    assertEquals(NumberProductGroup.invert(4), 0.25);
});

// ========== BooleanXorGroup ==========
console.log('\n📦 BooleanXorGroup...');

test('BooleanXorGroup.concat - XOR operation', () => {
    assertEquals(BooleanXorGroup.concat(true, true), false);
    assertEquals(BooleanXorGroup.concat(true, false), true);
    assertEquals(BooleanXorGroup.concat(false, true), true);
    assertEquals(BooleanXorGroup.concat(false, false), false);
});

test('BooleanXorGroup.empty - returns false', () => {
    assertEquals(BooleanXorGroup.empty(), false);
});

test('BooleanXorGroup.invert - self-inverse (returns same value)', () => {
    // XOR 그룹에서 역원은 자기 자신 (a XOR a = empty)
    assertEquals(BooleanXorGroup.invert(true), true);
    assertEquals(BooleanXorGroup.invert(false), false);
});

// ========== Group Laws ==========
console.log('\n📦 Group Laws...');

test('Group Law: Associativity - concat(concat(a,b),c) = concat(a,concat(b,c))', () => {
    const a = 1, b = 2, c = 3;
    assertEquals(
        NumberSumGroup.concat(NumberSumGroup.concat(a, b), c),
        NumberSumGroup.concat(a, NumberSumGroup.concat(b, c))
    );
});

test('Group Law: Right Identity - concat(a, empty()) = a', () => {
    const a = 42;
    assertEquals(NumberSumGroup.concat(a, NumberSumGroup.empty()), a);
});

test('Group Law: Left Identity - concat(empty(), a) = a', () => {
    const a = 42;
    assertEquals(NumberSumGroup.concat(NumberSumGroup.empty(), a), a);
});

test('Group Law: Right Inverse - concat(a, invert(a)) = empty()', () => {
    const a = 10;
    assertEquals(NumberSumGroup.concat(a, NumberSumGroup.invert(a)), NumberSumGroup.empty());
});

test('Group Law: Left Inverse - concat(invert(a), a) = empty()', () => {
    const a = 10;
    assertEquals(NumberSumGroup.concat(NumberSumGroup.invert(a), a), NumberSumGroup.empty());
});

// ========== NumberProductGroup의 역원 법칙 ==========
console.log('\n📦 NumberProductGroup Inverse Laws...');

test('NumberProductGroup: Right Inverse - concat(a, invert(a)) = empty()', () => {
    const a = 5;
    assertEquals(NumberProductGroup.concat(a, NumberProductGroup.invert(a)), NumberProductGroup.empty());
});

test('NumberProductGroup: Left Inverse - concat(invert(a), a) = empty()', () => {
    const a = 5;
    assertEquals(NumberProductGroup.concat(NumberProductGroup.invert(a), a), NumberProductGroup.empty());
});

// ========== BooleanXorGroup의 역원 법칙 ==========
console.log('\n📦 BooleanXorGroup Inverse Laws...');

test('BooleanXorGroup: XOR is self-inverse - concat(a, a) = empty()', () => {
    // XOR에서 a XOR a = false (empty)
    assertEquals(BooleanXorGroup.concat(true, true), BooleanXorGroup.empty());
    assertEquals(BooleanXorGroup.concat(false, false), BooleanXorGroup.empty());
});

test('BooleanXorGroup: Right Inverse - concat(a, invert(a)) = empty()', () => {
    // invert(a) = a이므로, a XOR a = empty
    assertEquals(BooleanXorGroup.concat(true, BooleanXorGroup.invert(true)), BooleanXorGroup.empty());
    assertEquals(BooleanXorGroup.concat(false, BooleanXorGroup.invert(false)), BooleanXorGroup.empty());
});

test('BooleanXorGroup: Left Inverse - concat(invert(a), a) = empty()', () => {
    assertEquals(BooleanXorGroup.concat(BooleanXorGroup.invert(true), true), BooleanXorGroup.empty());
    assertEquals(BooleanXorGroup.concat(BooleanXorGroup.invert(false), false), BooleanXorGroup.empty());
});

console.log('\n✅ All Group tests completed!');
