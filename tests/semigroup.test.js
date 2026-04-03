// Semigroup Laws Tests
import fp from '../index.js';
import { test, assertEquals, assertDeepEquals, assert, assertThrowsWith, logSection } from './utils.js';

const { Semigroup, Maybe, Either } = fp;

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

// === Maybe Semigroup ===
logSection('Maybe Semigroup');

const maybeSG = Maybe.Semigroup('array');

test('Maybe Semigroup - Associativity: concat(concat(a, b), c) === concat(a, concat(b, c))', () => {
    const a = Maybe.Just([1]), b = Maybe.Just([2]), c = Maybe.Just([3]);
    assertDeepEquals(
        maybeSG.concat(maybeSG.concat(a, b), c),
        maybeSG.concat(a, maybeSG.concat(b, c))
    );
});

test('Maybe Semigroup - Just concat Just', () => {
    assertDeepEquals(maybeSG.concat(Maybe.Just([1, 2]), Maybe.Just([3, 4])), Maybe.Just([1, 2, 3, 4]));
});

test('Maybe Semigroup - Just concat Nothing', () => {
    assertDeepEquals(maybeSG.concat(Maybe.Just([1]), Maybe.Nothing()), Maybe.Just([1]));
});

test('Maybe Semigroup - Nothing concat Just', () => {
    assertDeepEquals(maybeSG.concat(Maybe.Nothing(), Maybe.Just([1])), Maybe.Just([1]));
});

test('Maybe Semigroup - Nothing concat Nothing', () => {
    assertDeepEquals(maybeSG.concat(Maybe.Nothing(), Maybe.Nothing()), Maybe.Nothing());
});

test('Maybe Semigroup - cache: string and instance produce same reference', () => {
    assert(Maybe.Semigroup('array') === Maybe.Semigroup(Semigroup.of('array')));
});

test('Maybe Semigroup - registry: Semigroup.of resolves parameterized key', () => {
    assert(Semigroup.of('maybe(array)') === Maybe.Semigroup('array'));
});

// === Either Semigroup ===
logSection('Either Semigroup');

const eitherSG = Either.Semigroup('array');

test('Either Semigroup - Associativity: concat(concat(a, b), c) === concat(a, concat(b, c))', () => {
    const a = Either.Right([1]), b = Either.Right([2]), c = Either.Right([3]);
    assertDeepEquals(
        eitherSG.concat(eitherSG.concat(a, b), c),
        eitherSG.concat(a, eitherSG.concat(b, c))
    );
});

test('Either Semigroup - Right concat Right', () => {
    assertDeepEquals(eitherSG.concat(Either.Right([1]), Either.Right([2])), Either.Right([1, 2]));
});

test('Either Semigroup - Left concat Right (first Left wins)', () => {
    assertDeepEquals(eitherSG.concat(Either.Left('err'), Either.Right([1])), Either.Left('err'));
});

test('Either Semigroup - Right concat Left', () => {
    assertDeepEquals(eitherSG.concat(Either.Right([1]), Either.Left('err')), Either.Left('err'));
});

test('Either Semigroup - Left concat Left (first Left wins)', () => {
    assertDeepEquals(eitherSG.concat(Either.Left('e1'), Either.Left('e2')), Either.Left('e1'));
});

test('Either Semigroup - cache: string and instance produce same reference', () => {
    assert(Either.Semigroup('array') === Either.Semigroup(Semigroup.of('array')));
});

test('Either Semigroup - registry: Semigroup.of resolves parameterized key', () => {
    assert(Semigroup.of('either(array)') === Either.Semigroup('array'));
});

// === Nested Semigroup ===
logSection('Nested Semigroup');

test('Nested maybe - Semigroup.of resolves maybe(maybe(array))', () => {
    const nested = Semigroup.of('maybe(maybe(array))');
    assert(nested === Maybe.Semigroup('maybe(array)'));
});

test('Nested maybe - concat works on nested structure', () => {
    const nested = Semigroup.of('maybe(maybe(array))');
    assertDeepEquals(
        nested.concat(Maybe.Just(Maybe.Just([1])), Maybe.Just(Maybe.Just([2]))),
        Maybe.Just(Maybe.Just([1, 2]))
    );
});

// === Error Cases ===
logSection('Container Semigroup Error Cases');

test('Semigroup.of with mixed-case container key throws', () => {
    assertThrowsWith(() => Semigroup.of('Maybe(array)'), 'unsupported key Maybe(array)');
});

test('Maybe.Semigroup with non-Semigroup object throws', () => {
    assertThrowsWith(() => Maybe.Semigroup({}), 'Maybe.Semigroup: innerSG must be a supported semigroup key or Semigroup instance');
});

test('Either.Semigroup with non-Semigroup object throws', () => {
    assertThrowsWith(() => Either.Semigroup({}), 'Either.Semigroup: innerSG must be a supported semigroup key or Semigroup instance');
});

test('Maybe.Semigroup with unsupported key propagates Semigroup.of error', () => {
    assertThrowsWith(() => Maybe.Semigroup('unknown'), 'unsupported key unknown');
});

test('Maybe.Monoid with unsupported key propagates Semigroup.of error', () => {
    assertThrowsWith(() => Maybe.Monoid('unknown'), 'unsupported key unknown');
});

test('Maybe Semigroup - strict mode: type mismatch throws (Just vs Right)', () => {
    fp.setStrictMode(true);
    try {
        const sg = Maybe.Semigroup('array');
        assertThrowsWith(
            () => sg.concat(Maybe.Just([]), Either.Right([])),
            'Semigroup.concat'
        );
    } finally {
        fp.setStrictMode(false);
    }
});

console.log('\n✅ Semigroup tests completed');
