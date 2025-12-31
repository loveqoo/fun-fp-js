const $core = require('../modules/core.js');
const { core } = $core({ enableLog: false });

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

test('typeOf', () => {
    // Primitives
    assertEquals(core.typeOf(undefined), 'undefined');
    assertEquals(core.typeOf(true), 'boolean');
    assertEquals(core.typeOf(false), 'boolean');
    assertEquals(core.typeOf(42), 'number');
    assertEquals(core.typeOf(3.14), 'number');
    assertEquals(core.typeOf(NaN), 'number');
    assertEquals(core.typeOf(Infinity), 'number');
    assertEquals(core.typeOf('hello'), 'string');
    assertEquals(core.typeOf(''), 'string');
    assertEquals(core.typeOf(Symbol('test')), 'symbol');
    assertEquals(core.typeOf(() => { }), 'function');
    assertEquals(core.typeOf(function () { }), 'function');

    // null
    assertEquals(core.typeOf(null), 'null');

    // Objects - constructor.name 방식
    assertEquals(core.typeOf({}), 'Object');
    assertEquals(core.typeOf({ a: 1 }), 'Object');
    assertEquals(core.typeOf([]), 'Array');
    assertEquals(core.typeOf([1, 2, 3]), 'Array');
    assertEquals(core.typeOf(new Set()), 'Set');
    assertEquals(core.typeOf(new Map()), 'Map');
    assertEquals(core.typeOf(new WeakSet()), 'WeakSet');
    assertEquals(core.typeOf(new WeakMap()), 'WeakMap');
    assertEquals(core.typeOf(new Date()), 'Date');
    assertEquals(core.typeOf(/regex/), 'RegExp');
    assertEquals(core.typeOf(new Error('test')), 'Error');
    assertEquals(core.typeOf(new TypeError('test')), 'TypeError');
    assertEquals(core.typeOf(Promise.resolve()), 'Promise');

    // Custom class
    class MyClass { }
    assertEquals(core.typeOf(new MyClass()), 'MyClass');

    // Object.create(null) - no constructor
    assertEquals(core.typeOf(Object.create(null)), 'object');
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
        core.assertFunction('testFunc', 'a function')(42);
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

// === Tests migrated from also_variadic.test.js ===
test('also - variadic (multiple side effect functions)', () => {
    let count1 = 0;
    let count2 = 0;
    const spy1 = () => { count1++; };
    const spy2 = () => { count2++; };
    const data = { val: 42 };

    const result = core.also(data)(spy1, spy2);
    assertEquals(count1, 1, 'First side effect should execute');
    assertEquals(count2, 1, 'Second side effect should execute');
    assertEquals(result.val, 42, 'Original data should be returned');
});

// === Tests migrated from issues.test.js ===
test('once - retry on failure', () => {
    let count = 0;
    const onceF = core.once(() => {
        count++;
        if (count === 1) throw new Error('First fail');
        return 'Success';
    });

    // First call fails
    try { onceF(); } catch (e) { /* expected */ }
    assertEquals(count, 1, 'Should have been called once');

    // Second call succeeds (retry allowed)
    const result = onceF();
    assertEquals(result, 'Success');
    assertEquals(count, 2, 'Should have been called twice');

    // Third call uses cached success
    const thirdResult = onceF();
    assertEquals(thirdResult, 'Success');
    assertEquals(count, 2, 'Should not call again after success');
});

test('apply2 - strictness (exactly 2 args)', () => {
    const add = (a, b) => a + b;
    const applied = core.apply2(add);

    // Should work with 2 elements
    assertEquals(applied([1, 2]), 3);

    // Should throw for 3 elements
    try {
        applied([1, 2, 3]);
        assert(false, 'Should throw for 3 elements');
    } catch (e) {
        assert(e instanceof TypeError);
    }

    // Should throw for 1 element
    try {
        applied([1]);
        assert(false, 'Should throw for 1 element');
    } catch (e) {
        assert(e instanceof TypeError);
    }
});

// === Tests migrated from predicate_async.test.js ===
test('predicate - async function protection', () => {
    const asyncTrue = async () => true;
    const p = core.predicate(asyncTrue, false);

    const result = p();
    // Should return fallback instead of Boolean(Promise) === true
    assertEquals(result, false, 'Async predicate should return fallback');
});

// === Additional tests for missing functions ===
test('raise - throws error', () => {
    try {
        core.raise(new Error('test error'));
        assert(false, 'Should have thrown');
    } catch (e) {
        assertEquals(e.message, 'test error');
    }
});

test('raise - throws TypeError', () => {
    try {
        core.raise(new TypeError('type error'));
        assert(false, 'Should have thrown');
    } catch (e) {
        assert(e instanceof TypeError);
    }
});

test('hasFunctions - checks function properties', () => {
    const hasMap = core.hasFunctions([obj => obj.map]);

    assert(hasMap([1, 2, 3]), 'Array has map');
    assert(!hasMap({}), 'Empty object has no map');
    assert(!hasMap(null), 'null has no map');
    assert(!hasMap(undefined), 'undefined has no map');
});

test('hasFunctions - with custom check', () => {
    const isArrayLike = core.hasFunctions(
        [obj => obj.map, obj => obj.filter],
        obj => Array.isArray(obj)
    );

    assert(isArrayLike([1, 2, 3]), 'Array is array-like');
    assert(!isArrayLike({ map: x => x, filter: x => x }), 'Object with map/filter but not array');
});

test('pipe2 - composes two functions left-to-right', () => {
    const add1 = x => x + 1;
    const double = x => x * 2;

    const fn = core.pipe2(add1, double);
    assertEquals(fn(5), 12); // (5 + 1) * 2
});

test('compose2 - composes two functions right-to-left', () => {
    const add1 = x => x + 1;
    const double = x => x * 2;

    const fn = core.compose2(add1, double);
    assertEquals(fn(5), 11); // add1(double(5)) = 5*2 + 1
});

test('pipe2 vs compose2 - opposite order', () => {
    const add1 = x => x + 1;
    const double = x => x * 2;

    // pipe2: left to right
    assertEquals(core.pipe2(add1, double)(5), 12); // (5+1)*2

    // compose2: right to left  
    assertEquals(core.compose2(add1, double)(5), 11); // (5*2)+1
});

test('into - data-first pipe', () => {
    const result = core.into(5)(
        x => x + 1,
        x => x * 2
    );
    assertEquals(result, 12); // (5 + 1) * 2
});

test('into - with multiple transformations', () => {
    const result = core.into([1, 2, 3, 4, 5])(
        arr => arr.filter(x => x % 2 === 1),
        arr => arr.map(x => x * 2),
        arr => arr.reduce((a, b) => a + b, 0)
    );
    assertEquals(result, 18); // [1,3,5] -> [2,6,10] -> 18
});

test('into - empty pipeline returns identity', () => {
    assertEquals(core.into(42)(), 42);
});

test('Types - symbols are unique', () => {
    assert(typeof core.Types.Functor === 'symbol');
    assert(typeof core.Types.Applicative === 'symbol');
    assert(typeof core.Types.Monad === 'symbol');
    assert(core.Types.Functor !== core.Types.Applicative);
    assert(core.Types.Applicative !== core.Types.Monad);
});

test('toIterator - normalizes input', () => {
    // Case 1: Iterable (Array)
    const arrIter = core.toIterator([1, 2]);
    assertEquals([...arrIter], [1, 2]);

    // Case 2: Object
    const objIter = core.toIterator({ a: 1 });
    assertEquals([...objIter], [1]);

    // Case 3: Primitive (Number) - Fallback
    const numIter = core.toIterator(123);
    assertEquals([...numIter], [123]);

    // Case 4: Null/Undefined
    const nullIter = core.toIterator(null);
    assertEquals([...nullIter], []);

    const undefinedIter = core.toIterator(undefined);
    assertEquals([...undefinedIter], []);
});

// === Tests migrated from pure_transducer.test.js ===
console.log('\n🔀 Starting Transducer tests...');

const { compose, pipe, transducer } = core;
const { map, filter, take, transduce } = transducer;

// 기본 Reducer: 배열에 push
const pushReducer = (acc, x) => {
    acc.push(x);
    return acc;
};

test('transducer - compose map -> filter (Standard Order)', () => {
    // 1. x + 1
    // 2. 짝수만 (map 결과에 대해)
    // compose(map, filter)는 실행 시 filter(map(reducer))가 되어
    // 데이터는 map -> filter 순서로 흐름
    const xf = compose(
        map(x => x + 1),
        filter(x => x % 2 === 0)
    );

    const data = [1, 2, 3, 4, 5];
    // [2, 3, 4, 5, 6] -> [2, 4, 6]
    const result = transduce(xf)(pushReducer)([])(data);

    assertEquals(result, [2, 4, 6]);
});

test('transducer - pipe map -> filter (Reverse Order)', () => {
    // pipe(map, filter)는 실행 시 map(filter(reducer))가 되어
    // 데이터는 filter -> map 순서로 흐름
    const xf = pipe(
        map(x => x + 1),
        filter(x => x % 2 === 0)
    );

    const data = [1, 2, 3, 4, 5];
    // filter: [2, 4] -> map: [3, 5]
    const result = transduce(xf)(pushReducer)([])(data);

    assertEquals(result, [3, 5]);
});

test('transducer - take with early termination', () => {
    const xf = compose(
        map(x => x * 10),
        take(2)
    );

    const data = [1, 2, 3, 4, 5];
    // [10, 20] 하고 종료
    const result = transduce(xf)(pushReducer)([])(data);

    assertEquals(result, [10, 20]);
});

test('transducer - Boundary Checks (Error handling)', () => {
    const assertThrows = (fn, desc) => {
        try {
            fn();
            throw new Error(`Expected '${desc}' to throw, but it did not.`);
        } catch (e) {
            if (e.message.startsWith('Expected')) throw e;
            // Success: it threw an error as expected
        }
    };

    assertThrows(() => transduce(null), 'transduce(null)');
    assertThrows(() => transduce(() => { })(null), 'transduce(fn)(null)');
    assertThrows(() => transduce(() => { })(() => { })(null)(123), 'transduce(fn)(fn)(acc)(123)');
    assertThrows(() => map(null), 'map(null)');
    assertThrows(() => filter(null), 'filter(null)');
});