const { test, assert, assertEquals, assertThrows } = require('../utils.js');
const $core = require('../../static_modules/impl.js');
const {
    Chain,
    ArrayChain
} = $core;

console.log('🚀 Starting Chain tests...\n');

// ========== ArrayChain ==========
console.log('📦 ArrayChain...');

test('ArrayChain.chain - binds function to array (flatMap)', () => {
    const result = ArrayChain.chain(x => [x, x * 2], [1, 2]);
    assertEquals(result, [1, 2, 2, 4]);
});

test('ArrayChain.chain - empty array', () => {
    const result = ArrayChain.chain(x => [x, x * 2], []);
    assertEquals(result, []);
});

test('ArrayChain.ap - inherited through Apply', () => {
    const result = ArrayChain.ap([x => x * 2], [1, 2, 3]);
    assertEquals(result, [2, 4, 6]);
});

test('ArrayChain.map - inherited through Functor', () => {
    const result = ArrayChain.map(x => x + 1, [1, 2, 3]);
    assertEquals(result, [2, 3, 4]);
});

// ========== Chain.of API ==========
console.log('\n📦 Chain.of...');

test('Chain.of - array', () => {
    const C = Chain.of('array');
    assertEquals(C.chain(x => [x, x], [1]), [1, 1]);
    assertEquals(C.map(x => x * 2, [1]), [2]);
    assertEquals(C.ap([x => x + 1], [5]), [6]);
});

test('Chain.of - throws on unsupported key', () => {
    assertThrows(() => Chain.of('unsupported'), 'unsupported key');
});

test('Chain.of - check dynamic type validation', () => {
    const C = Chain.of('array');
    // a must be Array
    assertThrows(() => C.chain(x => [x], 'not an array'), 'arguments must be');
    // f must be function
    assertThrows(() => C.chain('not a function', [1]), 'arguments must be');
});

// ========== Chain Laws ==========
console.log('\n📦 Chain Laws...');

// Law: Associativity - chain(g, chain(f, u)) ≡ chain(x => chain(g, f(x)), u)
test('Chain Law: Associativity', () => {
    const u = [1, 2];
    const f = x => [x, x + 1];
    const g = x => [x * 2];

    // Left: chain(g, [1, 2, 2, 3]) -> [2, 4, 4, 6]
    const left = ArrayChain.chain(g, ArrayChain.chain(f, u));

    // Right: chain(x => chain(g, f(x)), [1, 2])
    // for 1: f(1) -> [1, 2], chain(g, [1, 2]) -> [2, 4]
    // for 2: f(2) -> [2, 3], chain(g, [2, 3]) -> [4, 6]
    // combined: [2, 4, 4, 6]
    const right = ArrayChain.chain(x => ArrayChain.chain(g, f(x)), u);

    assertEquals(left, right);
});

// ========== Practical Examples ==========
console.log('\n📦 Practical Examples...');

test('ArrayChain - nested computation', () => {
    // [1, 2] -> [1, 1, 2, 2] -> [2, 2, 2, 2, 4, 4, 4, 4] (if we chain multiple)
    const result = ArrayChain.chain(
        x => ArrayChain.map(y => x + y, [10, 20]),
        [1, 2]
    );
    assertEquals(result, [11, 21, 12, 22]); // same as liftA2 with ap
});

console.log('\n✅ All Chain tests completed!');
