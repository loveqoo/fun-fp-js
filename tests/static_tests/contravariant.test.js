const { test, assert, assertEquals, assertThrows } = require('../utils.js');
const $core = require('../../static_modules/impl.js');
const {
    Contravariant,
    PredicateContravariant
} = $core;

console.log('🚀 Starting Contravariant tests...\n');

// ========== PredicateContravariant ==========
console.log('📦 PredicateContravariant...');

test('PredicateContravariant.contramap - transforms predicate input', () => {
    const isLong = s => s.length > 5;  // string => boolean
    const numIsLong = PredicateContravariant.contramap(n => n.toString(), isLong);
    assertEquals(numIsLong(123456), true);   // '123456'.length > 5
    assertEquals(numIsLong(12), false);      // '12'.length > 5
});

test('PredicateContravariant.contramap - with object property access', () => {
    const isAdult = age => age >= 18;  // number => boolean
    const userIsAdult = PredicateContravariant.contramap(user => user.age, isAdult);
    assertEquals(userIsAdult({ name: 'Kim', age: 25 }), true);
    assertEquals(userIsAdult({ name: 'Lee', age: 15 }), false);
});

test('PredicateContravariant.contramap - chaining', () => {
    const isPositive = n => n > 0;  // number => boolean
    // string → number → greater than 0?
    const stringLengthIsPositive = PredicateContravariant.contramap(
        s => s.length,
        isPositive
    );
    assertEquals(stringLengthIsPositive('hello'), true);
    assertEquals(stringLengthIsPositive(''), false);
});

// ========== Contravariant.of API ==========
console.log('\n📦 Contravariant.of...');

test('Contravariant.of - predicate', () => {
    const C = Contravariant.of('predicate');
    const isEven = n => n % 2 === 0;
    const strLengthIsEven = C.contramap(s => s.length, isEven);
    assertEquals(strLengthIsEven('ab'), true);
    assertEquals(strLengthIsEven('abc'), false);
});

test('Contravariant.of - throws on unsupported key', () => {
    assertThrows(() => Contravariant.of('unsupported'), 'unsupported key');
});

test('Contravariant.of - throws on non-function arguments', () => {
    const C = Contravariant.of('predicate');
    assertThrows(() => C.contramap('notAFunction', x => x > 0), 'must be functions');
    assertThrows(() => C.contramap(x => x, 'notAFunction'), 'must be functions');
});

// ========== Contravariant Laws ==========
console.log('\n📦 Contravariant Laws...');

// Law 1: Identity - contramap(x => x, pred) ≡ pred
test('Contravariant Law: Identity - contramap(id, pred) ≡ pred', () => {
    const id = x => x;
    const isPositive = n => n > 0;
    const result = PredicateContravariant.contramap(id, isPositive);
    assertEquals(result(5), isPositive(5));
    assertEquals(result(-3), isPositive(-3));
});

// Law 2: Composition - contramap(x => f(g(x)), pred) ≡ contramap(g, contramap(f, pred))
// Note: 순서가 Functor와 반대!
test('Contravariant Law: Composition - contramap(f∘g) ≡ contramap(g, contramap(f, pred))', () => {
    const f = s => s.length;       // string => number
    const g = user => user.name;   // object => string
    const isPositive = n => n > 0; // number => boolean

    // 방법 1: 합성 함수로 한 번에
    const left = PredicateContravariant.contramap(user => f(g(user)), isPositive);

    // 방법 2: 차례대로 contramap (순서 주의: f 먼저, g 나중)
    const right = PredicateContravariant.contramap(
        g,
        PredicateContravariant.contramap(f, isPositive)
    );

    const user = { name: 'Kim' };
    assertEquals(left(user), right(user));  // 'Kim'.length > 0 → true
});

// ========== Edge Cases ==========
console.log('\n📦 Edge Cases...');

test('PredicateContravariant.contramap - multiple transformations', () => {
    const exists = x => x != null;  // any => boolean

    // 3단계 변환: array → first element → property → exists check
    const firstUserHasName = PredicateContravariant.contramap(
        arr => arr[0]?.name,
        exists
    );

    assertEquals(firstUserHasName([{ name: 'Kim' }]), true);
    assertEquals(firstUserHasName([{}]), false);
    assertEquals(firstUserHasName([]), false);
});

test('PredicateContravariant.contramap - with array predicates', () => {
    const isEmpty = arr => arr.length === 0;
    const objHasNoKeys = PredicateContravariant.contramap(obj => Object.keys(obj), isEmpty);

    assertEquals(objHasNoKeys({}), true);
    assertEquals(objHasNoKeys({ a: 1 }), false);
});

console.log('\n✅ All Contravariant tests completed!');
