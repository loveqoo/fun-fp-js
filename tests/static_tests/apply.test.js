const { test, assert, assertEquals, assertThrows } = require('../utils.js');
const $core = require('../../static_modules/impl.js');
const {
    Apply,
    ArrayApply,
    ArrayFunctor
} = $core;

console.log('🚀 Starting Apply tests...\n');

// ========== ArrayApply ==========
console.log('📦 ArrayApply...');

test('ArrayApply.ap - applies each function to each value', () => {
    const fns = [x => x * 2, x => x + 10];
    const vals = [1, 2, 3];
    const result = ArrayApply.ap(fns, vals);
    assertEquals(result, [2, 4, 6, 11, 12, 13]);
});

test('ArrayApply.ap - single function', () => {
    const fns = [x => x * x];
    const vals = [1, 2, 3, 4];
    const result = ArrayApply.ap(fns, vals);
    assertEquals(result, [1, 4, 9, 16]);
});

test('ArrayApply.ap - string functions', () => {
    const fns = [s => s.toUpperCase(), s => s + '!'];
    const vals = ['hello', 'world'];
    const result = ArrayApply.ap(fns, vals);
    assertEquals(result, ['HELLO', 'WORLD', 'hello!', 'world!']);
});

test('ArrayApply.ap - empty arrays', () => {
    assertEquals(ArrayApply.ap([], [1, 2, 3]), []);
    assertEquals(ArrayApply.ap([x => x], []), []);
});

// ========== Apply.of API ==========
console.log('\n📦 Apply.of...');

test('Apply.of - array', () => {
    const A = Apply.of('array');
    const result = A.ap([x => x * 2], [5, 10]);
    assertEquals(result, [10, 20]);
});

test('Apply.of - throws on unsupported key', () => {
    assertThrows(() => Apply.of('unsupported'), 'unsupported key');
});

test('Apply.of - throws on non-array arguments', () => {
    const A = Apply.of('array');
    assertThrows(() => A.ap('notArray', [1, 2]), 'must be arrays');
    assertThrows(() => A.ap([x => x], 'notArray'), 'must be arrays');
});

// ========== Apply Laws ==========
console.log('\n📦 Apply Laws...');

// Law: Composition
// ap(ap(map(f => g => x => f(g(x)), a), u), v) ≡ ap(a, ap(u, v))
test('Apply Law: Composition', () => {
    const a = [x => x * 2];
    const u = [x => x + 1];
    const v = [3, 4];

    // 합성 함수 생성: f => g => x => f(g(x))
    const compose = f => g => x => f(g(x));

    // 왼쪽: ap(ap(map(compose, a), u), v)
    const mappedA = ArrayFunctor.map(compose, a);  // [g => x => (x * 2)(g(x))]
    const appliedU = ArrayApply.ap(mappedA, u);     // [x => (x * 2)((x + 1)(x))]
    const left = ArrayApply.ap(appliedU, v);

    // 오른쪽: ap(a, ap(u, v))
    const appliedV = ArrayApply.ap(u, v);           // [4, 5]
    const right = ArrayApply.ap(a, appliedV);

    assertEquals(left, right);  // [(3+1)*2, (4+1)*2] = [8, 10]
});

// ========== Practical Examples ==========
console.log('\n📦 Practical Examples...');

test('ArrayApply.ap - combining operations', () => {
    const ops = [x => x * 2, x => x * 3, x => x * 4];
    const nums = [10];
    const result = ArrayApply.ap(ops, nums);
    assertEquals(result, [20, 30, 40]);
});

test('ArrayApply.ap - cartesian product like behavior', () => {
    // 두 배열의 조합 생성
    const combine = a => b => [a, b];
    const as = ['a', 'b'];
    const bs = [1, 2];

    const fns = ArrayFunctor.map(combine, as);  // [b => ['a', b], b => ['b', b]]
    const result = ArrayApply.ap(fns, bs);
    assertEquals(result, [['a', 1], ['a', 2], ['b', 1], ['b', 2]]);
});

// ========== Edge Cases ==========
console.log('\n📦 Edge Cases...');

test('ArrayApply.ap - chaining with map', () => {
    // liftA2 패턴: f(a, b) -> ap(map(curry(f), [a]), [b])
    const add = a => b => a + b;
    const fns = ArrayFunctor.map(add, [1, 2]);  // [b => 1+b, b => 2+b]
    const result = ArrayApply.ap(fns, [10, 20]);
    assertEquals(result, [11, 21, 12, 22]);
});

test('ArrayApply.ap - with complex objects', () => {
    const extractors = [u => u.name, u => u.age.toString()];
    const users = [{ name: 'Kim', age: 30 }];
    const result = ArrayApply.ap(extractors, users);
    assertEquals(result, ['Kim', '30']);
});

console.log('\n✅ All Apply tests completed!');
