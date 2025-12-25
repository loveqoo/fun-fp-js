const $core = require('../modules/core.js');
const { core } = $core();

const { test, assert, assertEquals } = require('./utils.js');
console.log('🚀 Starting modules/core.js tests...\n');
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
    assertEquals(core.identity(42), 42);
});
test('constant', () => {
    assertEquals(core.constant(42)(), 42);
});
test('tuple', () => {
    assertEquals(core.tuple(1, 2, 3), [1, 2, 3]);
});
test('apply', () => {
    assertEquals(core.apply(add3_1)([1, 2, 3]), 6);
});
test('unapply', () => {
    assertEquals(core.unapply(add3_2)(1, 2, 3), 6);
});
test('unapply(apply(core)) = core', () => {
    assertEquals(core.unapply(core.apply(add3_1))(1, 2, 3), add3_1(1, 2, 3));
});
test('apply(unapply(g)) = g', () => {
    assertEquals(core.apply(core.unapply(add3_2))([1, 2, 3]), add3_2([1, 2, 3]));
});
test('apply2', () => {
    assertEquals(core.apply2(add2_1)([1, 2]), 3);
});
test('unapply2', () => {
    assertEquals(core.unapply2(add2_2)(1, 2), 3);
});
test('unapply2(apply2(core)) = core', () => {
    assertEquals(core.unapply2(core.apply2(add2_1))(1, 2), add2_1(1, 2));
});
test('apply2(unapply2(g)) = g', () => {
    assertEquals(core.apply2(core.unapply2(add2_2))([1, 2]), add2_2([1, 2]));
});
test('curry', () => {
    assertEquals(core.curry(add3_1)(1)(2)(3), 6);
});
test('uncurry', () => {
    assertEquals(core.uncurry(add3_3)(1, 2, 3), 6);
});
test('curry(uncurry(core)) = core', () => {
    assertEquals(core.curry(core.uncurry(add3_3))(1)(2)(3), add3_3(1)(2)(3));
});
test('uncurry(curry(core)) = core', () => {
    assertEquals(core.uncurry(core.curry(add3_1))(1, 2, 3), add3_1(1, 2, 3));
});
test('curry2', () => {
    assertEquals(core.curry2(add2_1)(1)(2), 3);
});
test('uncurry2', () => {
    assertEquals(core.uncurry2(add2_3)(1, 2), 3);
});
test('curry2(uncurry2(core)) = core', () => {
    assertEquals(core.curry2(core.uncurry2(add2_3))(1)(2), add2_3(1)(2));
});
test('uncurry2(curry2(core)) = core', () => {
    assertEquals(core.uncurry2(core.curry2(add2_1))(1, 2), add2_1(1, 2));
});
test('predicate', () => {
    assertEquals(core.predicate(isNumber)(42), true);
    // 다항 지원 테스트
    const isSumEven = (a, b) => (a + b) % 2 === 0;
    assert(core.predicate(isSumEven)(1, 3), 'Sum should be even');
    assert(!core.predicate(isSumEven)(1, 2), 'Sum should not be even');
});
test('negate', () => {
    assertEquals(core.negate(isNumber)(42), false);
});
test('negate(negate(core)) = predicate(core)', () => {
    assertEquals(core.negate(core.negate(isNumber))(42), core.predicate(isNumber)(42));
});
test('flip', () => {
    assertEquals(core.flip(minus_3_1)(3, 2, 1), -4);
    assertEquals(core.flip(core.flip(minus_3_1))(3, 2, 1), 0);
});
test('flip(flip(core)) = core', () => {
    assertEquals(core.flip(core.flip(minus_3_1))(3, 2, 1), 0);
});
test('flip2', () => {
    assertEquals(core.flip2(minus_2_1)(2, 1), -1);
    assertEquals(core.flip2(core.flip2(minus_2_1))(2, 1), 1);
});
test('flip2(flip2(core)) = core', () => {
    assertEquals(core.flip2(core.flip2(minus_2_1))(2, 1), 1);
});
test('flipC', () => {
    assertEquals(core.flipC(minus_2_2)(2)(1), -1);
});
test('flipC(flipC(core)) = core', () => {
    assertEquals(core.flipC(core.flipC(minus_2_2))(2)(1), 1);
});
test('partial', () => {
    assertEquals(core.partial(add3_1)(1, 2, 3), 6);
    assertEquals(core.partial(add3_1, 1)(2, 3), 6);
    assertEquals(core.partial(add3_1, 1, 2)(3), 6);
    assertEquals(core.partial(add3_1, 1, 2, 3)(), 6);
});
test('pipe', () => {
    assertEquals(core.pipe(x => x + 1, x => x * 2)(3), 8);
});
test('compose', () => {
    assertEquals(core.compose(x => x * 2, x => x + 1)(3), 8);
});
test('tap', () => {
    assertEquals(core.tap(x => x + 1, x => x * 2)(3), 3);
});
test('also', () => {
    assertEquals(core.also(3)(x => x + 1, x => x * 2), 3);
});

test('converge', () => {
    assertEquals(core.converge(
        (sum, count) => sum / count,
        arr => arr.reduce((a, b) => a + b, 0),
        arr => arr.length
    )([1, 2, 3, 4, 5]), 3);
});

test('once', () => {
    let count = 0;
    const increment = core.once(() => ++count);
    assertEquals(increment(), 1);
    assertEquals(increment(), 1);
    assertEquals(increment(), 1);
    assertEquals(count, 1, 'Should only execute once');
});

test('runOrDefault', () => {
    assertEquals(core.runOrDefault(0)(() => 42), 42);
    assertEquals(core.runOrDefault(0)(() => { throw new Error(); }), 0);
    assertEquals(core.runOrDefault(100)(null), 100);
});

test('capture', () => {
    const add = (a, b) => a + b;
    assertEquals(core.capture(1, 2)(add), 3);

    let errorCaught = false;
    const fail = () => { throw new Error(); };
    core.capture()(fail, () => { errorCaught = true; });
    assert(errorCaught, 'Should catch error via captured handler');
});

test('useOrLift', () => {
    const isString = x => typeof x === 'string';
    const toStr = x => String(x);
    const ensureString = core.useOrLift(isString, toStr);

    assertEquals(ensureString('hello'), 'hello');
    assertEquals(ensureString(123), '123');
});

test('range & rangeBy', () => {
    assertEquals(core.range(3), [0, 1, 2]);
    assertEquals(core.rangeBy(2, 5), [2, 3, 4]);
});

test('isFunction & isPlainObject', () => {
    assert(core.isFunction(() => { }), 'Function should be function');
    assert(!core.isFunction({}), 'Object should not be function');

    assert(core.isPlainObject({ a: 1 }), 'Plain object should be true');
    assert(!core.isPlainObject([]), 'Array should not be plain object');
    assert(!core.isPlainObject(null), 'Null should not be plain object');
    assert(!core.isPlainObject(new Date()), 'Instance should not be plain object');
});

test('Monad type checks (isFunctor, isApplicative, isMonad)', () => {
    const functor = {
        map: x => x,
        [core.Types.Functor]: true
    };
    const applicative = {
        ...functor,
        ap: x => x,
        [core.Types.Applicative]: true
    };
    const monad = {
        ...applicative,
        flatMap: x => x,
        [core.Types.Monad]: true
    };

    assert(core.isFunctor(functor));
    assert(!core.isApplicative(functor));

    assert(core.isApplicative(applicative));
    assert(!core.isMonad(applicative));

    assert(core.isMonad(monad));
});

// boundary and error tests
console.log('\n🛡️ Starting Boundary and Error tests...');

test('apply - non-array input', () => {
    try {
        core.apply(x => x)(42);
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
        core.uncurry(curried2)(1, 2, 3);
        assert(false, 'Should have thrown TypeError at the 3rd argument');
    } catch (e) {
        assert(e instanceof TypeError, 'Expected TypeError');
        assert(e.message.includes('expected a curried function'), 'Error message should indicate uncurry failure');
    }
});

test('predicate - with throwing function', () => {
    const throwingF = () => { throw new Error('Boom'); };
    assertEquals(core.predicate(throwingF, true)(42), true);
    assertEquals(core.predicate(throwingF, false)(42), false);
});

test('pipe - no arguments', () => {
    assertEquals(core.pipe()(42), 42);
});

test('range - zero and negative', () => {
    assertEquals(core.range(0), []);
    assertEquals(core.range(-5), []);
});

test('rangeBy - start >= end', () => {
    assertEquals(core.rangeBy(5, 5), []);
    assertEquals(core.rangeBy(10, 5), []);
});

test('assertFunction - validation', () => {
    try {
        core.assertFunction('testFunc', 'a function', 42);
        assert(false, 'Should have thrown TypeError');
    } catch (e) {
        assert(e instanceof TypeError, 'Expected TypeError');
        assert(e.message.includes('testFunc: expected a function'), 'Error message should match');
    }
});

test('runCatch - error handling', () => {
    const errorF = () => { throw new Error('Catch me'); };
    let caught = false;
    const handled = core.catch(errorF, (e) => {
        caught = true;
        return 'handled';
    });
    assertEquals(handled(), 'handled');
    assert(caught, 'Error should have been caught');
});

test('useArrayOrLift - non-array', () => {
    assertEquals(core.useArrayOrLift(42), [42]);
    assertEquals(core.useArrayOrLift([1, 2]), [1, 2]);
});