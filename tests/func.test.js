// Function manipulation utilities tests
import fp from '../index.js';
import { test, assertEquals, assert, assertThrows, assertThrowsWith, logSection } from './utils.js';

const {
    identity, compose, compose2, constant, tuple,
    apply, unapply, unapply2, curry, curry2, uncurry, uncurry2,
    predicate, predicateN, negate, negateN,
    flip, flip2, flipCurried, flipCurried2, pipe, pipe2, pipeWhile,
    tap, also, pipeFrom, useOrLift, partial, once, converge, range, rangeBy, transducer,
    composeK, foldMap, Maybe, Either, Foldable, Monoid, Monad, setTapErrorHandler
} = fp;

// === Basic Utilities ===
logSection('Basic Utilities');

test('identity - returns same value', () => {
    assertEquals(identity(5), 5);
    assertEquals(identity('hello'), 'hello');
    const obj = { a: 1 };
    assert(identity(obj) === obj, 'should return same reference');
});

test('constant - always returns the same value', () => {
    const always5 = constant(5);
    assertEquals(always5(), 5);
    assertEquals(always5(100), 5);
    assertEquals(always5('ignored'), 5);
});

test('compose - right to left composition', () => {
    const double = x => x * 2;
    const addOne = x => x + 1;
    const composed = compose(double, addOne);
    assertEquals(composed(5), 12); // double(addOne(5)) = double(6) = 12
});

test('tuple - creates array from arguments', () => {
    assertEquals(tuple(1, 2), [1, 2]);
    assertEquals(tuple(1, 2, 3), [1, 2, 3]);
    assertEquals(tuple(), []);
});

// tuple 로 만드는 수단만 있고 꺼내는 수단이 없었다. 셋 다 조합자로 세운 것이라
// 손으로 쓴 인덱스 접근이 아니다 — 그래서 apply 의 검증을 그대로 물려받는다.
test('fst / snd - tuple 에서 꺼낸다', () => {
    assertEquals(fp.fst([7, 9]), 7);
    assertEquals(fp.snd([7, 9]), 9);
    // 서로 다른 자리를 본다 — 바꿔치기하면 여기서 잡힌다.
    assert(fp.fst([1, 2]) !== fp.snd([1, 2]), 'fst 와 snd 가 같은 자리를 본다');
    assertEquals(fp.fst(['a', { x: 1 }]), 'a');
    assertEquals(fp.snd(['a', { x: 1 }]), { x: 1 });
});

test('fst / snd - 배열이 아니면 던진다 (apply 의 검증을 물려받는다)', () => {
    for (const f of [fp.fst, fp.snd]) {
        assertThrows(() => f(42), /args must be an array/);
        assertThrows(() => f(null), /args must be an array/);
    }
});

// === Binary Function Manipulation ===
logSection('Binary Function Manipulation');

test('apply - applies array as arguments', () => {
    const sum3 = (a, b, c) => a + b + c;
    assertEquals(apply(sum3)([1, 2, 3]), 6);
});

test('apply - throws for non-function', () => {
    assertThrows(() => apply(5)([1]), 'apply with non-function');
});

test('apply - throws for non-array', () => {
    assertThrows(() => apply(x => x)(5), 'apply with non-array');
});

test('unapply2 - converts args to array', () => {
    const add = (a, b) => a + b;
    assertEquals(unapply2(add)(3, 4), 7);
});

test('curry2 - converts binary function to curried', () => {
    const add = (a, b) => a + b;
    const curriedAdd = curry2(add);
    assertEquals(curriedAdd(3)(4), 7);
});

test('uncurry2 - converts curried function to binary', () => {
    const curriedAdd = a => b => a + b;
    const uncurriedAdd = uncurry2(curriedAdd);
    assertEquals(uncurriedAdd(3, 4), 7);
});

test('predicate - wraps function to return boolean', () => {
    const isPositive = predicate(x => x > 0);
    assertEquals(isPositive(5), true);
    assertEquals(isPositive(-5), false);
    assertEquals(isPositive(0), false);
});

test('predicate - returns false on error', () => {
    const unsafe = predicate(x => x.nonexistent.property);
    assertEquals(unsafe({}), false);
});

test('negate - negates predicate result', () => {
    const isPositive = x => x > 0;
    const isNotPositive = negate(isPositive);
    assertEquals(isNotPositive(5), false);
    assertEquals(isNotPositive(-5), true);
});

test('flip2 - swaps binary function arguments', () => {
    const subtract = (a, b) => a - b;
    const flipped = flip2(subtract);
    assertEquals(flipped(3, 10), 7); // 10 - 3 = 7
});

test('flipCurried2 - swaps curried function arguments', () => {
    const subtract = a => b => a - b;
    const flipped = flipCurried2(subtract);
    assertEquals(flipped(3)(10), 7); // subtract(10)(3) = 10 - 3 = 7
});

test('pipe2 - left to right composition (2 functions)', () => {
    const double = x => x * 2;
    const addOne = x => x + 1;
    const piped = pipe2(addOne, double);
    assertEquals(piped(5), 12); // double(addOne(5)) = double(6) = 12
});

// === N-ary Function Manipulation ===
logSection('N-ary Function Manipulation');



test('unapply - converts variadic to array-taking function', () => {
    const toArray = unapply(x => x);
    assertEquals(toArray(1, 2, 3), [1, 2, 3]);
});

test('curry - curries multi-argument function', () => {
    const sum3 = (a, b, c) => a + b + c;
    const curried = curry(sum3);
    assertEquals(curried(1)(2)(3), 6);
    assertEquals(curried(1, 2)(3), 6);
    assertEquals(curried(1)(2, 3), 6);
    assertEquals(curried(1, 2, 3), 6);
});

test('curry - respects custom arity', () => {
    const sum = (...args) => args.reduce((a, b) => a + b, 0);
    const curried2 = curry(sum, 2);
    assertEquals(curried2(1)(2), 3);
});

test('uncurry - uncurries deeply nested curried function', () => {
    const curriedSum3 = a => b => c => a + b + c;
    const uncurried = uncurry(curriedSum3);
    assertEquals(uncurried(1, 2, 3), 6);
});

test('predicateN - wraps variadic function to return boolean', () => {
    const allPositive = predicateN((...args) => args.every(x => x > 0));
    assertEquals(allPositive(1, 2, 3), true);
    assertEquals(allPositive(1, -2, 3), false);
});

test('predicateN - returns false on error', () => {
    const unsafe = predicateN((...args) => args[0].nonexistent.property);
    assertEquals(unsafe({}), false);
});

test('negateN - negates variadic predicate', () => {
    const hasNegative = (...args) => args.some(x => x < 0);
    const allNonNegative = negateN(hasNegative);
    assertEquals(allNonNegative(1, 2, 3), true);
    assertEquals(allNonNegative(1, -2, 3), false);
});

test('flip - reverses all arguments', () => {
    const joinWithSep = (sep, ...args) => args.join(sep);
    const flipped = flip(joinWithSep);
    assertEquals(flipped('c', 'b', 'a', '-'), 'a-b-c');
});

test('flipCurried - swaps argument groups', () => {
    const f = (a, b) => (c, d) => [a, b, c, d];
    const flipped = flipCurried(f);
    // flipped(3, 4)(1, 2) calls f(1, 2)(3, 4) = [1, 2, 3, 4]
    assertEquals(flipped(3, 4)(1, 2), [1, 2, 3, 4]);
});

test('pipe - composes left to right with multiple functions', () => {
    const addOne = x => x + 1;
    const double = x => x * 2;
    const square = x => x * x;
    const piped = pipe(addOne, double, square);
    assertEquals(piped(5), 144); // square(double(addOne(5))) = square(double(6)) = square(12) = 144
});

test('compose - composes right to left with multiple functions', () => {
    const addOne = x => x + 1;
    const double = x => x * 2;
    const square = x => x * x;
    const composed = compose(square, double, addOne);
    assertEquals(composed(5), 144); // same as pipe(addOne, double, square)
});

test('pipeWhile - predicate 가 참인 동안만 적용한다', () => {
    const under100 = x => x < 100;
    // 2 → 20 → 200 에서 predicate 가 거짓이 되어 남은 함수는 건너뛴다
    assertEquals(pipeWhile(under100)(2, x => x * 10, x => x * 10, x => x + 1), 200);
    assertEquals(pipeWhile(under100)(2), 2); // 함수가 없으면 값 그대로
    assertEquals(pipeWhile(x => x < 0)(5, x => x * 10), 5); // 첫 값부터 거짓이면 그대로
});

test('pipeWhile - 한 번 거짓이면 값이 안 바뀌므로 남은 함수는 전부 건너뛴다', () => {
    let applied = 0;
    const count = x => { applied++; return x; };
    pipeWhile(x => x < 10)(5, x => x + 10, count, count);
    assertEquals(applied, 0); // 15 에서 멈춘 뒤 count 는 한 번도 안 불린다
});

test('pipeWhile - 건너뛴 자리는 함수가 아니어도 통과, 적용될 자리는 라벨 있는 에러', () => {
    assertEquals(pipeWhile(x => x < 0)(5, '함수 아님'), 5); // 건너뛰므로 검사도 없다
    assertThrowsWith(() => pipeWhile(x => x < 10)(5, '함수 아님'), 'pipeWhile');
    assertThrowsWith(() => pipeWhile('함수 아님'), 'pipeWhile'); // predicate 는 만들 때 검사
});

// === Combinators ===
logSection('Combinators');

test('tap - executes side effects and returns value', () => {
    let sideEffect = 0;
    const result = tap(x => { sideEffect = x; })(5);
    assertEquals(result, 5);
    assertEquals(sideEffect, 5);
});

test('tap - executes multiple side effects', () => {
    let a = 0, b = 0;
    tap(x => { a = x; }, x => { b = x * 2; })(5);
    assertEquals(a, 5);
    assertEquals(b, 10);
});

test('tap - catches errors in side effects', () => {
    // Should not throw, just log
    const result = tap(x => { throw new Error('side effect error'); })(5);
    assertEquals(result, 5);
});

test('setTapErrorHandler - rejects non-function', () => {
    assertThrows(() => setTapErrorHandler(null));
    assertThrows(() => setTapErrorHandler(undefined));
    assertThrows(() => setTapErrorHandler(42));
});

test('setTapErrorHandler - accepts function and routes errors', () => {
    let captured;
    setTapErrorHandler(e => { captured = e.message; });
    tap(() => { throw new Error('boom'); })(1);
    assertEquals(captured, 'boom');
    setTapErrorHandler(() => {});
});

test('also - flipped tap (value first, then functions)', () => {
    let captured = 0;
    const capture = x => { captured = x; };
    also(5)(capture);
    assertEquals(captured, 5);
});

test('pipeFrom - flipped pipe (value first, then functions)', () => {
    const addOne = x => x + 1;
    const double = x => x * 2;
    const result = pipeFrom(5)(addOne, double);
    assertEquals(result, 12); // double(addOne(5)) = 12
});

test('useOrLift - returns value if check passes', () => {
    const ensureArray = useOrLift(Array.isArray)(x => [x]);
    assertEquals(ensureArray([1, 2]), [1, 2]);
});

test('useOrLift - lifts value if check fails', () => {
    const ensureArray = useOrLift(Array.isArray)(x => [x]);
    assertEquals(ensureArray(5), [5]);
});

test('useOrLift - practical example: ensure string', () => {
    const ensureString = useOrLift(x => typeof x === 'string')(String);
    assertEquals(ensureString('hello'), 'hello');
    assertEquals(ensureString(123), '123');
});

// === Error Cases ===
logSection('Error Cases');

test('curry - throws for non-function', () => {
    assertThrows(() => curry(5)(1)(2), 'curry with non-function');
});

test('uncurry2 - throws for non-function', () => {
    assertThrows(() => uncurry2(5)(1, 2), 'uncurry2 with non-function');
});

test('flip2 - throws for non-function', () => {
    assertThrows(() => flip2(5)(1, 2), 'flip2 with non-function');
});

test('pipe - throws for non-function in chain', () => {
    assertThrows(() => pipe(x => x, 5)(1), 'pipe with non-function');
});

test('compose - throws for non-function in chain', () => {
    assertThrows(() => compose(5, x => x)(1), 'compose with non-function');
});

// === Composition Laws ===
logSection('Composition Laws');

test('compose - associativity: compose(f, compose(g, h)) === compose(compose(f, g), h)', () => {
    const f = x => x + 1;
    const g = x => x * 2;
    const h = x => x - 3;
    const left = compose(f, compose(g, h));
    const right = compose(compose(f, g), h);
    assertEquals(left(10), right(10));
});

test('compose - identity: compose(f, identity) === f', () => {
    const f = x => x * 2;
    assertEquals(compose(f, identity)(5), f(5));
});

test('compose - identity: compose(identity, f) === f', () => {
    const f = x => x * 2;
    assertEquals(compose(identity, f)(5), f(5));
});

test('pipe - associativity', () => {
    const f = x => x + 1;
    const g = x => x * 2;
    const h = x => x - 3;
    assertEquals(pipe(f, g, h)(10), pipe(pipe(f, g), h)(10));
});

// === Additional Utilities ===
logSection('Additional Utilities');

test('partial - partially applies arguments', () => {
    const add3 = (a, b, c) => a + b + c;
    const add5And = partial(add3, 5);
    assertEquals(add5And(3, 2), 10);
});

test('partial - works with single argument', () => {
    const greet = (greeting, name) => `${greeting}, ${name}!`;
    const sayHello = partial(greet, 'Hello');
    assertEquals(sayHello('World'), 'Hello, World!');
});

test('once - executes function only once', () => {
    let counter = 0;
    const increment = once(() => ++counter);
    assertEquals(increment(), 1);
    assertEquals(increment(), 1);
    assertEquals(increment(), 1);
    assertEquals(counter, 1);
});

test('once - returns first result on subsequent calls', () => {
    const getTime = once(() => Date.now());
    const first = getTime();
    const second = getTime();
    assertEquals(first, second);
});

test('converge - combines branch results', () => {
    const add = (a, b) => a + b;
    const double = x => x * 2;
    const square = x => x * x;
    const combined = converge(add, double, square);
    assertEquals(combined(3), 15); // add(double(3), square(3)) = add(6, 9) = 15
});

test('converge - works with multiple arguments', () => {
    const multiply = (a, b) => a * b;
    const first = (a, b) => a;
    const second = (a, b) => b;
    const combined = converge(multiply, first, second);
    assertEquals(combined(3, 4), 12);
});

test('range - creates array from 0 to n-1', () => {
    assertEquals(range(5), [0, 1, 2, 3, 4]);
    assertEquals(range(0), []);
    assertEquals(range(1), [0]);
});

test('range - throws for negative', () => {
    assertThrows(() => range(-5));
});

// 6차 감사 [12] — 같은 계열의 잘못된 입력이 빈 배열·절삭·강제 변환·RangeError 넷으로 갈렸다.
test('6차-12: range 가 정수·유한이 아닌 입력을 한 문안으로 거부한다', () => {
    for (const bad of [NaN, 1.5, '3', Infinity, -Infinity, null, undefined, {}]) {
        assertThrowsWith(() => range(bad), `range: n must be a non-negative integer, got ${String(bad)}`);
    }
    assertEquals(range(3), [0, 1, 2]);   // 정상 경로는 그대로
    assertEquals(range(0), []);
});

test('6차-12: rangeBy 도 두 끝을 검사한다', () => {
    assertThrowsWith(() => rangeBy(1.5, 4), 'rangeBy: start and end must be integers, got 1.5 and 4');
    assertThrowsWith(() => rangeBy(1, '4'), 'rangeBy: start and end must be integers, got 1 and 4');
    assertThrowsWith(() => rangeBy(NaN, 4), 'rangeBy: start and end must be integers, got NaN and 4');
    assertEquals(rangeBy(2, 6), [2, 3, 4, 5]);   // 정상 경로는 그대로
    assertEquals(rangeBy(5, 5), []);
});

test('rangeBy - creates array from start to end-1', () => {
    assertEquals(rangeBy(2, 6), [2, 3, 4, 5]);
    assertEquals(rangeBy(0, 3), [0, 1, 2]);
});

test('rangeBy - returns empty array when start >= end', () => {
    assertEquals(rangeBy(5, 5), []);
    assertEquals(rangeBy(5, 3), []);
});


// === Transducer ===
logSection('Transducer');

test('transducer.map - transforms values', () => {
    const double = x => x * 2;
    const result = transducer.transduce(transducer.map(double), (acc, x) => [...acc, x], [], [1, 2, 3]);
    assertEquals(result, [2, 4, 6]);
});

test('transducer.filter - filters values', () => {
    const isEven = x => x % 2 === 0;
    const result = transducer.transduce(transducer.filter(isEven), (acc, x) => [...acc, x], [], [1, 2, 3, 4, 5]);
    assertEquals(result, [2, 4]);
});

test('transducer.take - takes first n values', () => {
    const result = transducer.transduce(transducer.take(3), (acc, x) => [...acc, x], [], [1, 2, 3, 4, 5]);
    assertEquals(result, [1, 2, 3]);
});

test('transducer.take - handles less than n values', () => {
    const result = transducer.transduce(transducer.take(10), (acc, x) => [...acc, x], [], [1, 2, 3]);
    assertEquals(result, [1, 2, 3]);
});

test('transducer composition - filter then map (right to left)', () => {
    const double = x => x * 2;
    const isEven = x => x % 2 === 0;
    // Transducers compose right-to-left: filter first, then map
    const composed = x => transducer.filter(isEven)(transducer.map(double)(x));
    const result = transducer.transduce(composed, (acc, x) => [...acc, x], [], [1, 2, 3, 4, 5]);
    // filter([1,2,3,4,5]) -> [2,4], then map(double) -> [4, 8]
    assertEquals(result, [4, 8]);
});

test('transducer.take - throws for invalid count', () => {
    assertThrows(() => transducer.take(0), 'take with 0');
    assertThrows(() => transducer.take(-1), 'take with negative');
    assertThrows(() => transducer.take(1.5), 'take with float');
    assertThrows(() => transducer.take('3'), 'take with string');
});

test('transducer.Reduced - early termination', () => {
    const reduced = transducer.Reduced.of(42);
    assert(transducer.isReduced(reduced), 'should be Reduced');
    assertEquals(reduced.value, 42);
});

test('transducer.into - array vessel: seed preserved, original untouched', () => {
    const seed = [0];
    const result = transducer.into(seed, transducer.map(x => x + 1), [1, 2]);
    assertEquals(result, [0, 2, 3]);
    assertEquals(seed, [0]);
});

test('transducer.into - string vessel concatenates', () => {
    assertEquals(transducer.into('x', transducer.map(s => s.toUpperCase()), 'ab'), 'xAB');
});

test('transducer.into - Set vessel: copy + dedupe', () => {
    const seed = new Set([1]);
    const r = transducer.into(seed, transducer.map(x => x % 2), [2, 3, 4]);
    assertEquals([...r], [1, 0]);
    assertEquals([...seed], [1]);
});

test('transducer.into - Map/object vessels take [key, value] pairs', () => {
    const m = transducer.into(new Map([['a', 1]]), transducer.map(x => [x, x * 10]), [1, 2]);
    assertEquals([...m.entries()], [['a', 1], [1, 10], [2, 20]]);
    assertEquals(transducer.into({ a: 1 }, transducer.map(x => [x, x * 10]), [1, 2]), { a: 1, 1: 10, 2: 20 });
});

test('transducer.into - early termination flows through (infinite generator)', () => {
    function* naturals() { let n = 1; while (true) yield n++; }
    assertEquals(transducer.into([], transducer.take(2), naturals()), [1, 2]);
});

test('transducer.into - labeled rejections', () => {
    assertThrowsWith(() => transducer.into(42, transducer.map(x => x), []),
        'transducer.into: vessel must be an array, string, Set, Map, or plain object');
    assertThrowsWith(() => transducer.into({}, transducer.map(x => x), [1]),
        'transducer.into: Map/object vessels expect [key, value] pairs');
});

test('transducer.transduce - with sum reducer', () => {
    const double = x => x * 2;
    const result = transducer.transduce(transducer.map(double), (acc, x) => acc + x, 0, [1, 2, 3]);
    assertEquals(result, 12); // (1*2) + (2*2) + (3*2) = 2 + 4 + 6 = 12
});

// === composeK ===
logSection('composeK - Kleisli composition (right to left)');

test('Maybe.composeK - composes right to left', () => {
    const safeDouble = x => Maybe.Just(x * 2);
    const safeAddOne = x => Maybe.Just(x + 1);

    // compose: safeDouble(safeAddOne(5)) = safeDouble(6) = 12
    const composed = Maybe.composeK(safeDouble, safeAddOne);
    const result = composed(5);
    assertEquals(result.value, 12);
});

test('Maybe.composeK - short-circuits on Nothing', () => {
    const safeHead = arr => arr.length > 0 ? Maybe.Just(arr[0]) : Maybe.Nothing();
    const safeProp = key => obj => obj[key] != null ? Maybe.Just(obj[key]) : Maybe.Nothing();

    const getFirstName = Maybe.composeK(safeProp('name'), safeHead);

    // 성공 케이스
    const success = getFirstName([{ name: 'Alice' }]);
    assertEquals(success.value, 'Alice');

    // 실패 케이스 (빈 배열)
    const fail = getFirstName([]);
    assert(fail.isNothing(), 'should be Nothing for empty array');
});

test('Either.composeK - composes right to left', () => {
    const safeDouble = x => Either.Right(x * 2);
    const safeAddOne = x => Either.Right(x + 1);

    const composed = Either.composeK(safeDouble, safeAddOne);
    const result = composed(5);
    assertEquals(result.value, 12);
});

test('Either.composeK - short-circuits on Left', () => {
    const safeDiv = y => x => y === 0 ? Either.Left('Division by zero') : Either.Right(x / y);
    const safeDouble = x => Either.Right(x * 2);

    const composed = Either.composeK(safeDouble, safeDiv(0));
    const result = composed(10);
    assert(result.isLeft(), 'should be Left');
    assertEquals(result.value, 'Division by zero');
});

test('composeK - generic function works correctly', () => {
    const safeDouble = x => Maybe.Just(x * 2);
    const safeAddOne = x => Maybe.Just(x + 1);
    const safeSquare = x => Maybe.Just(x * x);

    // compose: safeSquare(safeDouble(safeAddOne(3))) = safeSquare(safeDouble(4)) = safeSquare(8) = 64
    const composed = composeK(Monad.lookup('maybe'))([safeSquare, safeDouble, safeAddOne]);
    const result = composed(3);
    assertEquals(result.value, 64);
});

// === foldMap ===
logSection('foldMap - Foldable with Monoid');

test('foldMap - array monoid (flatten)', () => {
    const duplicate = x => [x, x];
    const result = foldMap(Foldable.lookup('array'), Monoid.lookup('array'))(duplicate)([1, 2, 3]);
    assertEquals(result, [1, 1, 2, 2, 3, 3]);
});

test('foldMap - number sum monoid', () => {
    const toLength = str => str.length;
    const result = foldMap(Foldable.lookup('array'), Monoid.lookup('number'))(toLength)(['a', 'bb', 'ccc']);
    assertEquals(result, 6); // 1 + 2 + 3
});

test('foldMap - string monoid', () => {
    const wrap = x => `[${x}]`;
    const result = foldMap(Foldable.lookup('array'), Monoid.lookup('string'))(wrap)([1, 2, 3]);
    assertEquals(result, '[1][2][3]');
});

test('foldMap - empty array returns monoid empty', () => {
    const result = foldMap(Foldable.lookup('array'), Monoid.lookup('number'))(x => x)([]);
    assertEquals(result, 0);
});

test('foldMap - with Maybe array (flatten Just values)', () => {
    const toMaybeLength = str => str.length > 0 ? Maybe.Just(str.length) : Maybe.Nothing();
    // This test shows foldMap composing functions that return monoid values
    const lengths = ['a', '', 'bb', '', 'ccc'].map(toMaybeLength);
    // [Just(1), Nothing, Just(2), Nothing, Just(3)]

    // foldMap with array monoid extracts values
    const extractJusts = m => m.isJust() ? [m.value] : [];
    const result = foldMap(Foldable.lookup('array'), Monoid.lookup('array'))(extractJusts)(lengths);
    assertEquals(result, [1, 2, 3]);
});

console.log('\n✅ Function manipulation tests completed\n');

// map/filter 는 생성 시점에 함수를 검사한다 — 빈 입력에서 잘못된 호출이 통과하면 안 된다(코덱스 2차 ⑤).
test('transducer.map/filter - 잘못된 인자는 생성 시점에 던진다', () => {
    assertThrows(() => transducer.map(42), 'map 이 비함수를 생성 시 안 막았다');
    assertThrows(() => transducer.filter(99), 'filter 가 비함수를 생성 시 안 막았다');
    // 빈 입력에서도 잘못된 호출이 통과하지 않는다
    assertThrows(() => transducer.transduce(transducer.map(42), (a, x) => a + x, 0, []), '빈 입력에서 map(42)가 통과했다');
});

// once 는 최대 한 번 실행한다 — f 안에서 자기를 다시 불러도 두 번 실행되면 안 된다(코덱스 3차 #7).
test('once - 재진입해도 두 번 실행되지 않는다', () => {
    let calls = 0, w;
    w = once(() => { calls++; return calls === 1 ? w() : 'inner'; });
    w();
    assertEquals(calls, 1, 'once 가 재진입 시 두 번 실행됐다');
    let c = 0; const g = once(() => ++c); g(); g();
    assertEquals(c, 1, 'once 의 기본 계약(한 번)이 깨졌다');
});

test('transducer.into - 객체 그릇의 __proto__ 쌍은 데이터로 저장된다 (4차-1)', () => {
    const out = transducer.into({}, x => x, [['__proto__', { hijacked: true }], ['safe', 1]]);
    assert(Object.prototype.hasOwnProperty.call(out, '__proto__'), '__proto__ 가 own 키여야 한다');
    assert(Object.getPrototypeOf(out) === Object.prototype, '프로토타입이 바뀌면 안 된다');
    assertEquals(out.safe, 1);
});

test('transducer.into - 그릇의 own __proto__ 데이터도 복제에서 보존된다 (5차 감사)', () => {
    const vessel = {};
    Object.defineProperty(vessel, '__proto__', { value: { seed: true }, enumerable: true, writable: true, configurable: true });
    vessel.base = 1;
    const out = transducer.into(vessel, x => x, [['k', 7]]);
    assert(Object.prototype.hasOwnProperty.call(out, '__proto__'), '그릇의 __proto__ 가 own 키로 남아야 한다');
    assert(Object.getPrototypeOf(out) === Object.prototype, '결과 프로토타입이 변조되면 안 된다');
    assertEquals(out.base, 1);
    assertEquals(out.k, 7);
    assertEquals(Object.prototype.hasOwnProperty.call(vessel, '__proto__'), true);   // 원본 불변
});

// 9차 감사 [4] — into 의 그릇 복제도 Object.keys 라 심볼·숨은 속성을 잃었다.
// 문서가 약속한 "그릇 내용 보존"을 어긴다. Optics.prop 과 같은 뿌리이고 같은 수법으로 고친다.
test('9차-4: transducer.into 가 그릇의 심볼·숨은 속성을 보존한다', () => {
    const sym = Symbol('s');
    const vessel = { plain: 3 };
    vessel[sym] = 2;
    Object.defineProperty(vessel, 'hidden', { value: 1, enumerable: false });

    const out = transducer.into(vessel, transducer.map(x => x), [['k', 9]]);

    assertEquals(out.plain, 3);
    assertEquals(out.k, 9);
    assertEquals(out[sym], 2, '심볼 속성이 사라졌다');
    assertEquals(out.hidden, 1, '숨은 속성이 사라졌다');
    assertEquals(Object.getOwnPropertyNames(vessel).indexOf('k'), -1, '원본이 변했다');
});

test('9차-4: into 가 그릇의 own __proto__ 를 프로토타입으로 둔갑시키지 않는다 (5차 수리 유지)', () => {
    const vessel = {};
    Object.defineProperty(vessel, '__proto__', { value: { hacked: 1 }, enumerable: true, configurable: true, writable: true });
    const out = transducer.into(vessel, transducer.map(x => x), []);
    assert(Object.getPrototypeOf(out) === Object.prototype, '프로토타입이 바뀌었다');
    assert(out.hacked === undefined, 'hacked 가 프로토타입을 타고 보인다');
});

// 10차 감사 [1] — into 도 같은 자리. 동결 그릇의 기존 키를 갱신하지 못했다.
test('10차-1: transducer.into 가 동결 그릇의 기존 키를 갱신한다', () => {
    const frozen = Object.freeze({ a: 1, keep: 2 });
    const out = transducer.into(frozen, transducer.map(x => x), [['a', 9]]);
    assertEquals(out.a, 9);
    assertEquals(out.keep, 2);
    assertEquals(frozen.a, 1, '원본이 변했다');
});
