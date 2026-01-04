const { test, assert, assertEquals, assertThrows } = require('../utils.js');
const $core = require('../../static_modules/impl.js');
const {
    Profunctor,
    FunctionProfunctor
} = $core;

console.log('🚀 Starting Profunctor tests...\n');

// ========== FunctionProfunctor ==========
console.log('📦 FunctionProfunctor...');

test('FunctionProfunctor.promap - transforms input and output', () => {
    const double = x => x * 2;  // number => number
    const stringDouble = FunctionProfunctor.promap(
        s => parseInt(s),      // f: string => number
        n => n.toString(),     // g: number => string
        double
    );
    assertEquals(stringDouble('5'), '10');
    assertEquals(stringDouble('12'), '24');
});

test('FunctionProfunctor.promap - with object transformation', () => {
    const increment = x => x + 1;  // number => number
    const userAgeIncrement = FunctionProfunctor.promap(
        user => user.age,              // f: User => number
        age => ({ newAge: age }),      // g: number => object
        increment
    );
    assertEquals(userAgeIncrement({ name: 'Kim', age: 25 }), { newAge: 26 });
});

test('FunctionProfunctor.promap - chaining transformations', () => {
    const identity = x => x;
    const result = FunctionProfunctor.promap(
        arr => arr.length,             // [a] => number
        n => n > 0 ? 'non-empty' : 'empty',  // number => string
        identity
    );
    assertEquals(result([1, 2, 3]), 'non-empty');
    assertEquals(result([]), 'empty');
});

// ========== Profunctor.of API ==========
console.log('\n📦 Profunctor.of...');

test('Profunctor.of - function', () => {
    const P = Profunctor.of('function');
    const addOne = x => x + 1;
    const stringAddOne = P.promap(
        s => parseInt(s),
        n => `Result: ${n}`,
        addOne
    );
    assertEquals(stringAddOne('10'), 'Result: 11');
});

test('Profunctor.of - throws on unsupported key', () => {
    assertThrows(() => Profunctor.of('unsupported'), 'unsupported key');
});

test('Profunctor.of - throws on non-function arguments', () => {
    const P = Profunctor.of('function');
    assertThrows(() => P.promap('notAFunc', x => x, x => x), 'must be functions');
    assertThrows(() => P.promap(x => x, 123, x => x), 'must be functions');
    assertThrows(() => P.promap(x => x, x => x, 'notAFunc'), 'must be functions');
});

// ========== Profunctor Laws ==========
console.log('\n📦 Profunctor Laws...');

// Law 1: Identity - promap(id, id, fn) ≡ fn
test('Profunctor Law: Identity - promap(id, id, fn) ≡ fn', () => {
    const id = x => x;
    const double = x => x * 2;
    const result = FunctionProfunctor.promap(id, id, double);
    assertEquals(result(5), double(5));
    assertEquals(result(10), double(10));
});

// Law 2: Composition
// promap(f1∘f2, g1∘g2, fn) ≡ promap(f2, g1, promap(f1, g2, fn))
test('Profunctor Law: Composition', () => {
    const f1 = x => x + 1;
    const f2 = x => x * 2;
    const g1 = x => x.toString();
    const g2 = x => x + 10;
    const fn = x => x * 3;

    // 방법 1: 합성
    const left = FunctionProfunctor.promap(
        x => f1(f2(x)),  // f2 먼저, f1 나중
        x => g1(g2(x)),  // g2 먼저, g1 나중
        fn
    );

    // 방법 2: 중첩 promap
    const right = FunctionProfunctor.promap(
        f2,
        g1,
        FunctionProfunctor.promap(f1, g2, fn)
    );

    assertEquals(left(5), right(5));
});

// ========== Edge Cases ==========
console.log('\n📦 Edge Cases...');

test('FunctionProfunctor.promap - with async-like transformation', () => {
    const getValue = x => x.value;
    const wrapResult = v => ({ result: v, timestamp: Date.now() });
    const double = x => x * 2;

    const process = FunctionProfunctor.promap(getValue, wrapResult, double);
    const output = process({ value: 21 });

    assertEquals(output.result, 42);
    assert(typeof output.timestamp === 'number', 'should have timestamp');
});

test('FunctionProfunctor.promap - identity preserves function', () => {
    const id = x => x;
    const original = x => x * x;
    const mapped = FunctionProfunctor.promap(id, id, original);

    for (let i = 0; i < 5; i++) {
        assertEquals(mapped(i), original(i));
    }
});

console.log('\n✅ All Profunctor tests completed!');
