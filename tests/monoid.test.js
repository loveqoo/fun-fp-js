// Monoid Laws Tests
import fp from '../index.js';
import { test, assertEquals, logSection } from './utils.js';

const { Monoid } = fp;

logSection('Monoid Laws');

// === String Monoid ===
const strMonoid = Monoid.of('string');

test('String Monoid - Right identity: concat(a, empty()) === a', () => {
    const a = 'Hello';
    assertEquals(strMonoid.concat(a, strMonoid.empty()), a);
});

test('String Monoid - Left identity: concat(empty(), a) === a', () => {
    const a = 'Hello';
    assertEquals(strMonoid.concat(strMonoid.empty(), a), a);
});

// === Array Monoid ===
const arrMonoid = Monoid.of('array');

test('Array Monoid - Right identity', () => {
    const a = [1, 2, 3];
    assertEquals(arrMonoid.concat(a, arrMonoid.empty()), a);
});

test('Array Monoid - Left identity', () => {
    const a = [1, 2, 3];
    assertEquals(arrMonoid.concat(arrMonoid.empty(), a), a);
});

// === Number Sum Monoid ===
const numSumMonoid = Monoid.of('number');

test('Number Sum Monoid - Right identity: a + 0 === a', () => {
    const a = 42;
    assertEquals(numSumMonoid.concat(a, numSumMonoid.empty()), a);
});

test('Number Sum Monoid - Left identity: 0 + a === a', () => {
    const a = 42;
    assertEquals(numSumMonoid.concat(numSumMonoid.empty(), a), a);
});

// === Number Product Monoid ===
const numProductMonoid = Monoid.of('NumberProductMonoid');

test('Number Product Monoid - Right identity: a * 1 === a', () => {
    const a = 42;
    assertEquals(numProductMonoid.concat(a, numProductMonoid.empty()), a);
});

test('Number Product Monoid - Left identity: 1 * a === a', () => {
    const a = 42;
    assertEquals(numProductMonoid.concat(numProductMonoid.empty(), a), a);
});

// === Number Max Monoid ===
const numMaxMonoid = Monoid.of('NumberMaxMonoid');

test('Number Max Monoid - Right identity: max(a, -Infinity) === a', () => {
    const a = 42;
    assertEquals(numMaxMonoid.concat(a, numMaxMonoid.empty()), a);
});

test('Number Max Monoid - Left identity: max(-Infinity, a) === a', () => {
    const a = 42;
    assertEquals(numMaxMonoid.concat(numMaxMonoid.empty(), a), a);
});

// === Number Min Monoid ===
const numMinMonoid = Monoid.of('NumberMinMonoid');

test('Number Min Monoid - Right identity: min(a, Infinity) === a', () => {
    const a = 42;
    assertEquals(numMinMonoid.concat(a, numMinMonoid.empty()), a);
});

test('Number Min Monoid - Left identity: min(Infinity, a) === a', () => {
    const a = 42;
    assertEquals(numMinMonoid.concat(numMinMonoid.empty(), a), a);
});

// === Boolean All Monoid ===
const boolAllMonoid = Monoid.of('boolean');

test('Boolean All Monoid - Right identity: a && true === a', () => {
    assertEquals(boolAllMonoid.concat(true, boolAllMonoid.empty()), true);
    assertEquals(boolAllMonoid.concat(false, boolAllMonoid.empty()), false);
});

test('Boolean All Monoid - Left identity: true && a === a', () => {
    assertEquals(boolAllMonoid.concat(boolAllMonoid.empty(), true), true);
    assertEquals(boolAllMonoid.concat(boolAllMonoid.empty(), false), false);
});

// === Boolean Any Monoid ===
const boolAnyMonoid = Monoid.of('BooleanAnyMonoid');

test('Boolean Any Monoid - Right identity: a || false === a', () => {
    assertEquals(boolAnyMonoid.concat(true, boolAnyMonoid.empty()), true);
    assertEquals(boolAnyMonoid.concat(false, boolAnyMonoid.empty()), false);
});

test('Boolean Any Monoid - Left identity: false || a === a', () => {
    assertEquals(boolAnyMonoid.concat(boolAnyMonoid.empty(), true), true);
    assertEquals(boolAnyMonoid.concat(boolAnyMonoid.empty(), false), false);
});

// === Boolean Xor Monoid ===
const boolXorMonoid = Monoid.of('BooleanXorMonoid');

test('Boolean Xor Monoid - Right identity: a !== false === a', () => {
    assertEquals(boolXorMonoid.concat(true, boolXorMonoid.empty()), true);
    assertEquals(boolXorMonoid.concat(false, boolXorMonoid.empty()), false);
});

test('Boolean Xor Monoid - Left identity: false !== a === a', () => {
    assertEquals(boolXorMonoid.concat(boolXorMonoid.empty(), true), true);
    assertEquals(boolXorMonoid.concat(boolXorMonoid.empty(), false), false);
});

// === Function Monoid ===
const fnMonoid = Monoid.of('function');

test('Function Monoid - Right identity: compose(f, identity) === f', () => {
    const f = x => x * 2;
    const result = fnMonoid.concat(f, fnMonoid.empty());
    assertEquals(result(5), f(5));
});

test('Function Monoid - Left identity: compose(identity, f) === f', () => {
    const f = x => x * 2;
    const result = fnMonoid.concat(fnMonoid.empty(), f);
    assertEquals(result(5), f(5));
});

console.log('\n✅ Monoid tests completed');
