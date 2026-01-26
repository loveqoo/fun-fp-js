const fp = require('../dist/fun-fp.cjs');

const { test, testAsync, assertEquals, assertThrows } = require('./utils.js');

// Test utilities
const createMockSemigroup = () => {
    const obj = { concat: (a, b) => a + b };
    obj[Symbol.for('fun-fp-js/Semigroup')] = true;
    return obj;
};

const createMockSemigroupoid = () => {
    const obj = { compose: (f, g) => x => f(g(x)) };
    obj[Symbol.for('fun-fp-js/Semigroupoid')] = true;
    return obj;
};

const createMockApply = () => {
    const obj = {
        map: (f, a) => f(a),
        ap: (fs, vs) => fs.map(f => vs.map(f))
    };
    obj[Symbol.for('fun-fp-js/Functor')] = true;
    obj[Symbol.for('fun-fp-js/Apply')] = true;
    return obj;
};

const createMockAlt = () => {
    const obj = {
        map: (f, a) => f(a),
        alt: (a, b) => a || b
    };
    obj[Symbol.for('fun-fp-js/Functor')] = true;
    obj[Symbol.for('fun-fp-js/Alt')] = true;
    return obj;
};

// ============================================
// MONOID TESTS
// ============================================

test('Monoid (strict mode): accepts function as empty', () => {
    fp.setStrictMode(true);
    const semigroup = createMockSemigroup();
    const monoid = new fp.Monoid(semigroup, () => 'identity', 'test');

    assertEquals(typeof monoid.empty, 'function');
    assertEquals(monoid.empty(), 'identity');
});

test('Monoid (strict mode): rejects non-function empty', () => {
    fp.setStrictMode(true);
    const semigroup = createMockSemigroup();

    assertThrows(() => {
        new fp.Monoid(semigroup, 'not a function', 'test');
    }, /Monoid\.empty: empty must be a function/);
});

test('Monoid (strict mode): rejects non-semigroup argument', () => {
    fp.setStrictMode(true);

    assertThrows(() => {
        new fp.Monoid({}, () => 'identity', 'test');
    }, /Monoid: argument must be a Semigroup/);
});

test('Monoid (loose mode): accepts any value as empty', () => {
    fp.setStrictMode(false);
    const semigroup = createMockSemigroup();

    // Should not throw
    const monoid1 = new fp.Monoid(semigroup, 'string', 'test1');
    const monoid2 = new fp.Monoid(semigroup, 42, 'test2');
    const monoid3 = new fp.Monoid(semigroup, null, 'test3');

    assertEquals(monoid1.empty, 'string');
    assertEquals(monoid2.empty, 42);
    assertEquals(monoid3.empty, null);
});

test('Monoid (loose mode): accepts non-semigroup', () => {
    fp.setStrictMode(false);

    // Should not throw - in loose mode, validation is relaxed
    const monoid = new fp.Monoid({}, () => 'identity', 'test');
    assertEquals(typeof monoid.empty, 'function');
});

// ============================================
// CATEGORY TESTS
// ============================================

test('Category (strict mode): accepts function as id', () => {
    fp.setStrictMode(true);
    const semigroupoid = createMockSemigroupoid();
    const category = new fp.Category(semigroupoid, x => x, 'test');

    assertEquals(typeof category.id, 'function');
    assertEquals(category.id(5), 5);
});

test('Category (strict mode): rejects non-function id', () => {
    fp.setStrictMode(true);
    const semigroupoid = createMockSemigroupoid();

    assertThrows(() => {
        new fp.Category(semigroupoid, 'not a function', 'test');
    }, /Category\.id: id must be a function/);
});

test('Category (strict mode): rejects non-semigroupoid argument', () => {
    fp.setStrictMode(true);

    assertThrows(() => {
        new fp.Category({}, x => x, 'test');
    }, /Category: argument must be a Semigroupoid/);
});

test('Category (loose mode): accepts any value as id', () => {
    fp.setStrictMode(false);
    const semigroupoid = createMockSemigroupoid();

    const category1 = new fp.Category(semigroupoid, 'string', 'test1');
    const category2 = new fp.Category(semigroupoid, 42, 'test2');

    assertEquals(category1.id, 'string');
    assertEquals(category2.id, 42);
});

// ============================================
// APPLICATIVE TESTS
// ============================================

test('Applicative (strict mode): accepts function as of', () => {
    fp.setStrictMode(true);
    const apply = createMockApply();
    const applicative = new fp.Applicative(apply, x => ({ value: x }), 'test');

    assertEquals(typeof applicative.of, 'function');
    assertEquals(applicative.of(5).value, 5);
});

test('Applicative (strict mode): rejects non-function of', () => {
    fp.setStrictMode(true);
    const apply = createMockApply();

    assertThrows(() => {
        new fp.Applicative(apply, 'not a function', 'test');
    }, /Applicative\.of: of must be a function/);
});

test('Applicative (strict mode): rejects non-Apply argument', () => {
    fp.setStrictMode(true);

    assertThrows(() => {
        new fp.Applicative({}, x => x, 'test');
    }, /Applicative: argument must be an Apply/);
});

test('Applicative (loose mode): accepts any value as of', () => {
    fp.setStrictMode(false);
    const apply = createMockApply();

    const app1 = new fp.Applicative(apply, 'string', 'test1');
    const app2 = new fp.Applicative(apply, 42, 'test2');

    assertEquals(app1.of, 'string');
    assertEquals(app2.of, 42);
});

// ============================================
// PLUS TESTS
// ============================================

test('Plus (strict mode): accepts function as zero', () => {
    fp.setStrictMode(true);
    const alt = createMockAlt();
    const plus = new fp.Plus(alt, () => null, 'test');

    assertEquals(typeof plus.zero, 'function');
    assertEquals(plus.zero(), null);
});

test('Plus (strict mode): rejects non-function zero', () => {
    fp.setStrictMode(true);
    const alt = createMockAlt();

    assertThrows(() => {
        new fp.Plus(alt, 'not a function', 'test');
    }, /Plus\.zero: zero must be a function/);
});

test('Plus (strict mode): rejects non-Alt argument', () => {
    fp.setStrictMode(true);

    assertThrows(() => {
        new fp.Plus({}, () => null, 'test');
    }, /Plus: argument must be an Alt/);
});

test('Plus (loose mode): accepts any value as zero', () => {
    fp.setStrictMode(false);
    const alt = createMockAlt();

    const plus1 = new fp.Plus(alt, 'string', 'test1');
    const plus2 = new fp.Plus(alt, 42, 'test2');

    assertEquals(plus1.zero, 'string');
    assertEquals(plus2.zero, 42);
});

// ============================================
// INTEGRATION TESTS (Real Instances)
// ============================================

test('Integration: FunctionMonoid has function empty', () => {
    fp.setStrictMode(true);
    // FunctionMonoid should work normally with function empty
    const monoid = fp.Monoid.of('function');
    assertEquals(typeof monoid.empty, 'function');
});

test('Integration: FunctionCategory has function id', () => {
    fp.setStrictMode(true);
    // FunctionCategory should work normally with function id
    const category = fp.Category.of('function');
    assertEquals(typeof category.id, 'function');
});

test('Integration: Monoid.of("string") has function empty', () => {
    fp.setStrictMode(true);
    // StringMonoid should have function empty
    const monoid = fp.Monoid.of('string');
    assertEquals(typeof monoid.empty, 'function');
    assertEquals(monoid.empty(), '');
});

test('Integration: Array monoid operations work correctly', () => {
    fp.setStrictMode(true);
    const arrayMonoid = fp.Monoid.of('array');

    // empty should return a function that produces empty array
    const emptyResult = arrayMonoid.empty();
    assertEquals(Array.isArray(emptyResult), true);
    assertEquals(emptyResult.length, 0);
});

// ============================================
// CROSS-CUTTING BEHAVIOR
// ============================================

test('Mixed modes: strict then loose', () => {
    fp.setStrictMode(true);
    const alt = createMockAlt();

    // This should throw in strict mode
    assertThrows(() => {
        new fp.Plus(alt, 'not a function', 'test');
    }, /Plus\.zero: zero must be a function/);

    // Switch to loose mode
    fp.setStrictMode(false);

    // This should not throw in loose mode
    const plus = new fp.Plus(alt, 'not a function', 'test');
    assertEquals(plus.zero, 'not a function');
});

test('Error messages are clear and specific', () => {
    fp.setStrictMode(true);
    const semigroup = createMockSemigroup();

    try {
        new fp.Monoid(semigroup, 42, 'test');
        throw new Error('Should have thrown');
    } catch (e) {
        // Verify error message contains type class and property name
        assertEquals(e.message.includes('Monoid'), true);
        assertEquals(e.message.includes('empty'), true);
        assertEquals(e.message.includes('function'), true);
    }
});

// Reset to dev mode for any subsequent tests
console.log('\n✓ All unit validation tests completed');
console.log('Resetting strict mode to default (dev mode)');
fp.setStrictMode(typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production');
