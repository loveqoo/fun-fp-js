const { test, assert, assertEquals, assertThrows } = require('../utils.js');
const $core = require('../../static_modules/core.js');
const {
    Category,
    FunctionCategory
} = $core;

console.log('🚀 Starting Category tests...\n');

// ========== FunctionCategory ==========
console.log('📦 FunctionCategory...');

test('FunctionCategory.compose - composes two functions (right to left)', () => {
    const double = x => x * 2;
    const addOne = x => x + 1;
    const composed = FunctionCategory.compose(double, addOne);
    assertEquals(composed(3), 8);  // double(addOne(3)) = 8
});

test('FunctionCategory.id - returns identity function', () => {
    assertEquals(FunctionCategory.id(42), 42);
    assertEquals(FunctionCategory.id('hello'), 'hello');
    assertEquals(FunctionCategory.id(null), null);
});

// ========== Category.of API ==========
console.log('\n📦 Category.of...');

test('Category.of - function', () => {
    const cat = Category.of('function');
    const double = x => x * 2;
    assertEquals(cat.compose(double, cat.id)(5), 10);
    assertEquals(cat.id(100), 100);
});

test('Category.of - throws on unsupported key', () => {
    assertThrows(() => Category.of('unsupported'), 'unsupported key');
});

test('Category.of - throws on non-function compose', () => {
    const cat = Category.of('function');
    assertThrows(() => cat.compose('notAFunction', x => x), 'type mismatch');
    assertThrows(() => cat.compose(x => x, 123), 'type mismatch');
    assertThrows(() => cat.compose({}, []), 'type mismatch');
});

// ========== Category Laws ==========
console.log('\n📦 Category Laws...');

// Law 1: Associativity (inherited from Semigroupoid)
test('Category Law: Associativity - compose(compose(f, g), h) = compose(f, compose(g, h))', () => {
    const f = x => x * 2;
    const g = x => x + 1;
    const h = x => x * x;

    const left = FunctionCategory.compose(
        FunctionCategory.compose(f, g),
        h
    );
    const right = FunctionCategory.compose(
        f,
        FunctionCategory.compose(g, h)
    );

    assertEquals(left(3), right(3));
});

// Law 2: Right Identity - compose(f, id) = f
test('Category Law: Right Identity - compose(f, id) = f', () => {
    const f = x => x * 2;
    const composed = FunctionCategory.compose(f, FunctionCategory.id);
    assertEquals(composed(5), f(5));
    assertEquals(composed(10), f(10));
});

// Law 3: Left Identity - compose(id, f) = f
test('Category Law: Left Identity - compose(id, f) = f', () => {
    const f = x => x + 10;
    const composed = FunctionCategory.compose(FunctionCategory.id, f);
    assertEquals(composed(5), f(5));
    assertEquals(composed(20), f(20));
});

// ========== Category vs Monoid 비교 ==========
console.log('\n📦 Category vs Monoid (conceptual)...');

test('Category mirrors Monoid structure for functions', () => {
    // Category: compose + id
    // Monoid:   concat  + empty
    // 둘 다 결합법칙과 항등원 법칙을 만족

    const f = x => x * 2;
    const g = x => x + 1;

    // compose(f, compose(g, id)) = compose(f, g) - Right Identity in chain
    const withId = FunctionCategory.compose(f, FunctionCategory.compose(g, FunctionCategory.id));
    const withoutId = FunctionCategory.compose(f, g);
    assertEquals(withId(3), withoutId(3));
});

// ========== Edge Cases ==========
console.log('\n📦 Edge Cases...');

test('FunctionCategory.id - works with objects', () => {
    const obj = { a: 1, b: 2 };
    assert(FunctionCategory.id(obj) === obj, 'id should return the same object reference');
});

test('FunctionCategory.id - works with arrays', () => {
    const arr = [1, 2, 3];
    assert(FunctionCategory.id(arr) === arr, 'id should return the same array reference');
});

test('FunctionCategory.compose - id composed multiple times', () => {
    const multiId = FunctionCategory.compose(
        FunctionCategory.id,
        FunctionCategory.compose(FunctionCategory.id, FunctionCategory.id)
    );
    assertEquals(multiId(42), 42);
});

console.log('\n✅ All Category tests completed!');
