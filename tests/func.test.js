const $func = require('../modules/func.js');
const { fp: f } = $func();

const { test, assert, assertEquals } = require('./utils.js');
console.log('🚀 Starting modules/func.js tests...\n');
const add2_1 = (a, b) => a + b;
const add2_2 = ([a, b]) => a + b;
const add2_3 = a => b => a + b;
const add3_1 = (a, b, c) => a + b + c;
const add3_2 = ([a, b, c]) => a + b + c;
const add3_3 = a => b => c => a + b + c;
const minus_2_1 = (a, b) => a - b;
const minus_2_2 = a => b => a - b;
const minus_3_1 = (a, b, c) => a - b - c;
const isNumber = x => typeof x === 'number';

// core tests
test('identity', () => {
    assertEquals(f.identity(42), 42);
});
test('constant', () => {
    assertEquals(f.constant(42)(), 42);
});
test('tuple', () => {
    assertEquals(f.tuple(1, 2, 3), [1, 2, 3]);
});
test('apply', () => {
    assertEquals(f.apply(add3_1)([1, 2, 3]), 6);
});
test('unapply', () => {
    assertEquals(f.unapply(add3_2)(1, 2, 3), 6);
});
test('unapply(apply(f)) = f', () => {
    assertEquals(f.unapply(f.apply(add3_1))(1, 2, 3), add3_1(1, 2, 3));
});
test('apply(unapply(g)) = g', () => {
    assertEquals(f.apply(f.unapply(add3_2))([1, 2, 3]), add3_2([1, 2, 3]));
});
test('apply2', () => {
    assertEquals(f.apply2(add2_1)([1, 2]), 3);
});
test('unapply2', () => {
    assertEquals(f.unapply2(add2_2)(1, 2), 3);
});
test('unapply2(apply2(f)) = f', () => {
    assertEquals(f.unapply2(f.apply2(add2_1))(1, 2), add2_1(1, 2));
});
test('apply2(unapply2(g)) = g', () => {
    assertEquals(f.apply2(f.unapply2(add2_2))([1, 2]), add2_2([1, 2]));
});
test('curry', () => {
    assertEquals(f.curry(add3_1)(1)(2)(3), 6);
});
test('uncurry', () => {
    assertEquals(f.uncurry(add3_3)(1, 2, 3), 6);
});
test('curry(uncurry(f)) = f', () => {
    assertEquals(f.curry(f.uncurry(add3_3))(1)(2)(3), add3_3(1)(2)(3));
});
test('uncurry(curry(f)) = f', () => {
    assertEquals(f.uncurry(f.curry(add3_1))(1, 2, 3), add3_1(1, 2, 3));
});
test('curry2', () => {
    assertEquals(f.curry2(add2_1)(1)(2), 3);
});
test('uncurry2', () => {
    assertEquals(f.uncurry2(add2_3)(1, 2), 3);
});
test('curry2(uncurry2(f)) = f', () => {
    assertEquals(f.curry2(f.uncurry2(add2_3))(1)(2), add2_3(1)(2));
});
test('uncurry2(curry2(f)) = f', () => {
    assertEquals(f.uncurry2(f.curry2(add2_1))(1, 2), add2_1(1, 2));
});
test('predicate', () => {
    assertEquals(f.predicate(isNumber)(42), true);
    // 다항 지원 테스트
    const isSumEven = (a, b) => (a + b) % 2 === 0;
    assert(f.predicate(isSumEven)(1, 3), 'Sum should be even');
    assert(!f.predicate(isSumEven)(1, 2), 'Sum should not be even');
});
test('negate', () => {
    assertEquals(f.negate(isNumber)(42), false);
});
test('negate(negate(f)) = predicate(f)', () => {
    assertEquals(f.negate(f.negate(isNumber))(42), f.predicate(isNumber)(42));
});
test('flip', () => {
    assertEquals(f.flip(minus_3_1)(3, 2, 1), -4);
    assertEquals(f.flip(f.flip(minus_3_1))(3, 2, 1), 0);
});
test('flip(flip(f)) = f', () => {
    assertEquals(f.flip(f.flip(minus_3_1))(3, 2, 1), 0);
});
test('flip2', () => {
    assertEquals(f.flip2(minus_2_1)(2, 1), -1);
    assertEquals(f.flip2(f.flip2(minus_2_1))(2, 1), 1);
});
test('flip2(flip2(f)) = f', () => {
    assertEquals(f.flip2(f.flip2(minus_2_1))(2, 1), 1);
});
test('flipC', () => {
    assertEquals(f.flipC(minus_2_2)(2)(1), -1);
});
test('flipC(flipC(f)) = f', () => {
    assertEquals(f.flipC(f.flipC(minus_2_2))(2)(1), 1);
});
test('partial', () => {
    assertEquals(f.partial(add3_1)(1, 2, 3), 6);
    assertEquals(f.partial(add3_1, 1)(2, 3), 6);
    assertEquals(f.partial(add3_1, 1, 2)(3), 6);
    assertEquals(f.partial(add3_1, 1, 2, 3)(), 6);
});
test('pipe', () => {
    assertEquals(f.pipe(x => x + 1, x => x * 2)(3), 8);
});
test('compose', () => {
    assertEquals(f.compose(x => x * 2, x => x + 1)(3), 8);
});
test('tap', () => {
    assertEquals(f.tap(x => x + 1, x => x * 2)(3), 3);
});
test('also', () => {
    assertEquals(f.also(3)(x => x + 1, x => x * 2), 3);
});

test('converge', () => {
    assertEquals(f.converge(
        (sum, count) => sum / count,
        arr => arr.reduce((a, b) => a + b, 0),
        arr => arr.length
    )([1, 2, 3, 4, 5]), 3);
});

test('once', () => {
    let count = 0;
    const increment = f.once(() => ++count);
    assertEquals(increment(), 1);
    assertEquals(increment(), 1);
    assertEquals(increment(), 1);
    assertEquals(count, 1, 'Should only execute once');
});

test('runOrDefault', () => {
    assertEquals(f.runOrDefault(0)(() => 42), 42);
    assertEquals(f.runOrDefault(0)(() => { throw new Error(); }), 0);
    assertEquals(f.runOrDefault(100)(null), 100);
});

test('capture', () => {
    const add = (a, b) => a + b;
    assertEquals(f.capture(1, 2)(add), 3);

    let errorCaught = false;
    const fail = () => { throw new Error(); };
    f.capture()(fail, () => { errorCaught = true; });
    assert(errorCaught, 'Should catch error via captured handler');
});

test('useOrLift', () => {
    const isString = x => typeof x === 'string';
    const toStr = x => String(x);
    const ensureString = f.useOrLift(isString, toStr);

    assertEquals(ensureString('hello'), 'hello');
    assertEquals(ensureString(123), '123');
});

test('range & rangeBy', () => {
    assertEquals(f.range(3), [0, 1, 2]);
    assertEquals(f.rangeBy(2, 5), [2, 3, 4]);
});

test('isFunction & isPlainObject', () => {
    assert(f.isFunction(() => { }), 'Function should be function');
    assert(!f.isFunction({}), 'Object should not be function');

    assert(f.isPlainObject({ a: 1 }), 'Plain object should be true');
    assert(!f.isPlainObject([]), 'Array should not be plain object');
    assert(!f.isPlainObject(null), 'Null should not be plain object');
    assert(!f.isPlainObject(new Date()), 'Instance should not be plain object');
});

test('Monad type checks (isFunctor, isApplicative, isMonad)', () => {
    const functor = {
        map: x => x,
        [f.Types.Functor]: true
    };
    const applicative = {
        ...functor,
        ap: x => x,
        [f.Types.Applicative]: true
    };
    const monad = {
        ...applicative,
        flatMap: x => x,
        [f.Types.Monad]: true
    };

    assert(f.isFunctor(functor));
    assert(!f.isApplicative(functor));

    assert(f.isApplicative(applicative));
    assert(!f.isMonad(applicative));

    assert(f.isMonad(monad));
});

// boundary and error tests
console.log('\n🛡️ Starting Boundary and Error tests...');

test('apply - non-array input', () => {
    try {
        f.apply(x => x)(42);
        assert(false, 'Should have thrown TypeError');
    } catch (e) {
        assert(e instanceof TypeError, 'Expected TypeError');
    }
});

test('uncurry - partial application exhaustion', () => {
    // 2단계 커리된 함수
    const curried2 = a => b => a + b;
    try {
        // 인자를 3개 넘기면, (curried2(1)(2))(3) -> 3(3) 이 되어 에러가 나야 함
        f.uncurry(curried2)(1, 2, 3);
        assert(false, 'Should have thrown TypeError at the 3rd argument');
    } catch (e) {
        assert(e instanceof TypeError, 'Expected TypeError');
        assert(e.message.includes('expected a curried function'), 'Error message should indicate uncurry failure');
    }
});

test('predicate - with throwing function', () => {
    const throwingF = () => { throw new Error('Boom'); };
    assertEquals(f.predicate(throwingF, true)(42), true);
    assertEquals(f.predicate(throwingF, false)(42), false);
});

test('pipe - no arguments', () => {
    assertEquals(f.pipe()(42), 42);
});

test('range - zero and negative', () => {
    assertEquals(f.range(0), []);
    assertEquals(f.range(-5), []);
});

test('rangeBy - start >= end', () => {
    assertEquals(f.rangeBy(5, 5), []);
    assertEquals(f.rangeBy(10, 5), []);
});

test('assertFunction - validation', () => {
    try {
        f.assertFunction('testFunc', 'a function', 42);
        assert(false, 'Should have thrown TypeError');
    } catch (e) {
        assert(e instanceof TypeError, 'Expected TypeError');
        assert(e.message.includes('testFunc: expected a function'), 'Error message should match');
    }
});

test('runCatch - error handling', () => {
    const errorF = () => { throw new Error('Catch me'); };
    let caught = false;
    const handled = f.catch(errorF, (e) => {
        caught = true;
        return 'handled';
    });
    assertEquals(handled(), 'handled');
    assert(caught, 'Error should have been caught');
});

test('useArrayOrLift - non-array', () => {
    assertEquals(f.useArrayOrLift(42), [42]);
    assertEquals(f.useArrayOrLift([1, 2]), [1, 2]);
});