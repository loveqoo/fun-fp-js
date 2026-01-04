const { test, assert, assertEquals, assertThrows } = require('../utils.js');
const $core = require('../../static_modules/impl.js');
const {
    Applicative,
    ArrayApplicative
} = $core;

console.log('🚀 Starting Applicative tests...\n');

// ========== ArrayApplicative ==========
console.log('📦 ArrayApplicative...');

test('ArrayApplicative.of - wraps value in array', () => {
    assertEquals(ArrayApplicative.of(42), [42]);
    assertEquals(ArrayApplicative.of('hello'), ['hello']);
    assertEquals(ArrayApplicative.of(null), [null]);
});

test('ArrayApplicative.map - inherited from Functor', () => {
    const result = ArrayApplicative.map(x => x * 2, [1, 2, 3]);
    assertEquals(result, [2, 4, 6]);
});

test('ArrayApplicative.ap - inherited from Apply', () => {
    const result = ArrayApplicative.ap([x => x * 2], [1, 2, 3]);
    assertEquals(result, [2, 4, 6]);
});

// ========== Applicative.of API ==========
console.log('\n📦 Applicative.of...');

test('Applicative.of - array', () => {
    const A = Applicative.of('array');
    assertEquals(A.of(42), [42]);
    assertEquals(A.map(x => x + 1, [1, 2]), [2, 3]);
    assertEquals(A.ap([x => x * 2], [5]), [10]);
});

test('Applicative.of - throws on unsupported key', () => {
    assertThrows(() => Applicative.of('unsupported'), 'unsupported key');
});

// ========== Applicative Laws ==========
console.log('\n📦 Applicative Laws...');

// Law 1: Identity - ap(of(x => x), v) ≡ v
test('Applicative Law: Identity - ap(of(id), v) ≡ v', () => {
    const v = [1, 2, 3];
    const id = x => x;
    const result = ArrayApplicative.ap(ArrayApplicative.of(id), v);
    assertEquals(result, v);
});

// Law 2: Homomorphism - ap(of(f), of(x)) ≡ of(f(x))
test('Applicative Law: Homomorphism - ap(of(f), of(x)) ≡ of(f(x))', () => {
    const f = x => x * 2;
    const x = 21;
    const left = ArrayApplicative.ap(ArrayApplicative.of(f), ArrayApplicative.of(x));
    const right = ArrayApplicative.of(f(x));
    assertEquals(left, right);  // [42]
});

// Law 3: Interchange - ap(u, of(y)) ≡ ap(of(f => f(y)), u)
test('Applicative Law: Interchange - ap(u, of(y)) ≡ ap(of(f => f(y)), u)', () => {
    const u = [x => x * 2, x => x + 10];
    const y = 5;
    const left = ArrayApplicative.ap(u, ArrayApplicative.of(y));
    const right = ArrayApplicative.ap(ArrayApplicative.of(f => f(y)), u);
    assertEquals(left, right);  // [10, 15]
});

// ========== Practical Examples ==========
console.log('\n📦 Practical Examples...');

test('ArrayApplicative - liftA2 pattern', () => {
    // liftA2(f, a, b) = ap(map(f, a), b)
    const add = a => b => a + b;
    const a = [1, 2];
    const b = [10, 20];

    const fns = ArrayApplicative.map(add, a);  // [b => 1+b, b => 2+b]
    const result = ArrayApplicative.ap(fns, b);
    assertEquals(result, [11, 21, 12, 22]);
});

test('ArrayApplicative - pure computation', () => {
    // pure value → apply functions → result
    const pure = ArrayApplicative.of(10);
    const result = ArrayApplicative.ap([x => x * 2, x => x + 5], pure);
    assertEquals(result, [20, 15]);
});

// ========== Edge Cases ==========
console.log('\n📦 Edge Cases...');

test('ArrayApplicative.of - with complex objects', () => {
    const obj = { name: 'Kim', age: 30 };
    const result = ArrayApplicative.of(obj);
    assertEquals(result.length, 1);
    assertEquals(result[0], obj);
});

test('ArrayApplicative - inheritance chain', () => {
    assert(ArrayApplicative instanceof $core.Apply, 'should be instance of Apply');
    assert(ArrayApplicative instanceof $core.Functor, 'should be instance of Functor');
    assert(ArrayApplicative instanceof $core.Algebra, 'should be instance of Algebra');
});

console.log('\n✅ All Applicative tests completed!');
