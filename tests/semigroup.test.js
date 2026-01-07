// Semigroup Laws Tests
import fp from '../index.js';
import { test, assertEquals, logSection } from './utils.js';

const { Semigroup } = fp;

logSection('Semigroup Laws');

// === String Semigroup ===
const strSemigroup = Semigroup.of('string');

test('String Semigroup - Associativity: concat(concat(a, b), c) === concat(a, concat(b, c))', () => {
    const a = 'Hello', b = ' ', c = 'World';
    assertEquals(
        strSemigroup.concat(strSemigroup.concat(a, b), c),
        strSemigroup.concat(a, strSemigroup.concat(b, c))
    );
});

// === Array Semigroup ===
const arrSemigroup = Semigroup.of('array');

test('Array Semigroup - Associativity', () => {
    const a = [1, 2], b = [3], c = [4, 5];
    assertEquals(
        arrSemigroup.concat(arrSemigroup.concat(a, b), c),
        arrSemigroup.concat(a, arrSemigroup.concat(b, c))
    );
});

// === Number Sum Semigroup ===
const numSumSemigroup = Semigroup.of('number');

test('Number Sum Semigroup - Associativity: (a + b) + c === a + (b + c)', () => {
    const a = 1, b = 2, c = 3;
    assertEquals(
        numSumSemigroup.concat(numSumSemigroup.concat(a, b), c),
        numSumSemigroup.concat(a, numSumSemigroup.concat(b, c))
    );
});

// === Number Product Semigroup ===
const numProductSemigroup = Semigroup.of('NumberProductSemigroup');

test('Number Product Semigroup - Associativity: (a * b) * c === a * (b * c)', () => {
    const a = 2, b = 3, c = 4;
    assertEquals(
        numProductSemigroup.concat(numProductSemigroup.concat(a, b), c),
        numProductSemigroup.concat(a, numProductSemigroup.concat(b, c))
    );
});

// === Number Max Semigroup ===
const numMaxSemigroup = Semigroup.of('NumberMaxSemigroup');

test('Number Max Semigroup - Associativity', () => {
    const a = 5, b = 10, c = 3;
    assertEquals(
        numMaxSemigroup.concat(numMaxSemigroup.concat(a, b), c),
        numMaxSemigroup.concat(a, numMaxSemigroup.concat(b, c))
    );
});

// === Number Min Semigroup ===
const numMinSemigroup = Semigroup.of('NumberMinSemigroup');

test('Number Min Semigroup - Associativity', () => {
    const a = 5, b = 10, c = 3;
    assertEquals(
        numMinSemigroup.concat(numMinSemigroup.concat(a, b), c),
        numMinSemigroup.concat(a, numMinSemigroup.concat(b, c))
    );
});

// === Boolean All Semigroup ===
const boolAllSemigroup = Semigroup.of('boolean');

test('Boolean All Semigroup - Associativity: (a && b) && c === a && (b && c)', () => {
    const a = true, b = true, c = false;
    assertEquals(
        boolAllSemigroup.concat(boolAllSemigroup.concat(a, b), c),
        boolAllSemigroup.concat(a, boolAllSemigroup.concat(b, c))
    );
});

// === Boolean Any Semigroup ===
const boolAnySemigroup = Semigroup.of('BooleanAnySemigroup');

test('Boolean Any Semigroup - Associativity: (a || b) || c === a || (b || c)', () => {
    const a = false, b = true, c = false;
    assertEquals(
        boolAnySemigroup.concat(boolAnySemigroup.concat(a, b), c),
        boolAnySemigroup.concat(a, boolAnySemigroup.concat(b, c))
    );
});

// === Boolean Xor Semigroup ===
const boolXorSemigroup = Semigroup.of('BooleanXorSemigroup');

test('Boolean Xor Semigroup - Associativity', () => {
    const a = true, b = false, c = true;
    assertEquals(
        boolXorSemigroup.concat(boolXorSemigroup.concat(a, b), c),
        boolXorSemigroup.concat(a, boolXorSemigroup.concat(b, c))
    );
});

// === Function Semigroup (compose) ===
const fnSemigroup = Semigroup.of('function');

test('Function Semigroup - Associativity: compose(compose(f, g), h) === compose(f, compose(g, h))', () => {
    const f = x => x + 1;
    const g = x => x * 2;
    const h = x => x - 3;
    const input = 10;

    const left = fnSemigroup.concat(fnSemigroup.concat(f, g), h);
    const right = fnSemigroup.concat(f, fnSemigroup.concat(g, h));

    assertEquals(left(input), right(input));
});

console.log('\n✅ Semigroup tests completed');
