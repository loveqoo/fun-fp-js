const { test, assert, assertEquals, assertThrows } = require('../utils.js');
const $core = require('../../static_modules/impl.js');
const {
    Semigroupoid,
    FunctionSemigroupoid
} = $core;

console.log('🚀 Starting Semigroupoid tests...\n');

// ========== FunctionSemigroupoid ==========
console.log('📦 FunctionSemigroupoid...');

test('FunctionSemigroupoid.compose - composes two functions (right to left)', () => {
    const double = x => x * 2;
    const addOne = x => x + 1;
    const composed = FunctionSemigroupoid.compose(double, addOne);
    assertEquals(composed(3), 8);  // double(addOne(3)) = double(4) = 8
});

test('FunctionSemigroupoid.compose - with string functions', () => {
    const toUpper = s => s.toUpperCase();
    const exclaim = s => s + '!';
    const composed = FunctionSemigroupoid.compose(exclaim, toUpper);
    assertEquals(composed('hello'), 'HELLO!');
});

test('FunctionSemigroupoid.compose - chaining multiple', () => {
    const double = x => x * 2;
    const addOne = x => x + 1;
    const square = x => x * x;
    // square(double(addOne(2))) = square(double(3)) = square(6) = 36
    const composed = FunctionSemigroupoid.compose(
        square,
        FunctionSemigroupoid.compose(double, addOne)
    );
    assertEquals(composed(2), 36);
});

// ========== Semigroupoid.of API ==========
console.log('\n📦 Semigroupoid.of...');

test('Semigroupoid.of - function', () => {
    const sg = Semigroupoid.of('function');
    const double = x => x * 2;
    const addOne = x => x + 1;
    assertEquals(sg.compose(double, addOne)(5), 12);  // double(addOne(5)) = double(6) = 12
});

test('Semigroupoid.of - throws on unsupported key', () => {
    assertThrows(() => Semigroupoid.of('unsupported'), 'unsupported key');
});

test('Semigroupoid.of - throws on non-function compose', () => {
    const sg = Semigroupoid.of('function');
    assertThrows(() => sg.compose('notAFunction', x => x), 'type mismatch');
    assertThrows(() => sg.compose(x => x, 123), 'type mismatch');
    assertThrows(() => sg.compose(null, undefined), 'type mismatch');
});

// ========== Semigroupoid Laws ==========
console.log('\n📦 Semigroupoid Laws...');

test('Semigroupoid Law: Associativity - compose(compose(f, g), h) = compose(f, compose(g, h))', () => {
    const f = x => x * 2;
    const g = x => x + 1;
    const h = x => x * x;

    // (f . g) . h = f . (g . h)
    const left = FunctionSemigroupoid.compose(
        FunctionSemigroupoid.compose(f, g),
        h
    );
    const right = FunctionSemigroupoid.compose(
        f,
        FunctionSemigroupoid.compose(g, h)
    );

    assertEquals(left(3), right(3));  // f(g(h(3))) = f(g(9)) = f(10) = 20
});

test('Semigroupoid Law: Associativity - with different functions', () => {
    const f = s => s.toUpperCase();
    const g = s => s + '!';
    const h = s => s.trim();

    const left = FunctionSemigroupoid.compose(
        FunctionSemigroupoid.compose(f, g),
        h
    );
    const right = FunctionSemigroupoid.compose(
        f,
        FunctionSemigroupoid.compose(g, h)
    );

    assertEquals(left('  hello  '), right('  hello  ')); // 'HELLO!'
});

// ========== Edge Cases ==========
console.log('\n📦 Edge Cases...');

test('FunctionSemigroupoid.compose - with identity', () => {
    const identity = x => x;
    const double = x => x * 2;

    // compose(f, identity) = f
    assertEquals(FunctionSemigroupoid.compose(double, identity)(5), double(5));

    // compose(identity, f) = f
    assertEquals(FunctionSemigroupoid.compose(identity, double)(5), double(5));
});

test('FunctionSemigroupoid.compose - works with closures', () => {
    const multiplier = n => x => x * n;
    const adder = n => x => x + n;

    const composed = FunctionSemigroupoid.compose(multiplier(3), adder(2));
    assertEquals(composed(5), 21);  // (5 + 2) * 3 = 21
});

console.log('\n✅ All Semigroupoid tests completed!');
