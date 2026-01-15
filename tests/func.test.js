// Function manipulation utilities tests
import fp from '../index.js';
import { test, assertEquals, assert, assertThrows, logSection } from './utils.js';

const {
    identity, compose, compose2, constant, tuple,
    apply, unapply, unapply2, curry, curry2, uncurry, uncurry2,
    predicate, predicateN, negate, negateN,
    flip, flip2, flipCurried, flipCurried2, pipe, pipe2,
    tap, also, into, useOrLift, partial, once, converge, range, rangeBy, transducer
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

test('also - flipped tap (value first, then functions)', () => {
    let captured = 0;
    const capture = x => { captured = x; };
    also(5)(capture);
    assertEquals(captured, 5);
});

test('into - flipped pipe (value first, then functions)', () => {
    const addOne = x => x + 1;
    const double = x => x * 2;
    const result = into(5)(addOne, double);
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

test('once - supports external state', () => {
    const state = { called: false };
    const fn = once(() => 42, { state });
    assertEquals(fn(), 42);
    assertEquals(state.called, true);
});

test('once - supports default value', () => {
    const fn = once(() => 'result', { defaultValue: 'default' });
    assertEquals(fn(), 'result');
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

test('range - returns empty array for negative', () => {
    assertEquals(range(-5), []);
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
    const result = transducer.transduce(transducer.map(double))((acc, x) => [...acc, x])([])([1, 2, 3]);
    assertEquals(result, [2, 4, 6]);
});

test('transducer.filter - filters values', () => {
    const isEven = x => x % 2 === 0;
    const result = transducer.transduce(transducer.filter(isEven))((acc, x) => [...acc, x])([])([1, 2, 3, 4, 5]);
    assertEquals(result, [2, 4]);
});

test('transducer.take - takes first n values', () => {
    const result = transducer.transduce(transducer.take(3))((acc, x) => [...acc, x])([])([1, 2, 3, 4, 5]);
    assertEquals(result, [1, 2, 3]);
});

test('transducer.take - handles less than n values', () => {
    const result = transducer.transduce(transducer.take(10))((acc, x) => [...acc, x])([])([1, 2, 3]);
    assertEquals(result, [1, 2, 3]);
});

test('transducer composition - filter then map (right to left)', () => {
    const double = x => x * 2;
    const isEven = x => x % 2 === 0;
    // Transducers compose right-to-left: filter first, then map
    const composed = x => transducer.filter(isEven)(transducer.map(double)(x));
    const result = transducer.transduce(composed)((acc, x) => [...acc, x])([])([1, 2, 3, 4, 5]);
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

test('transducer.transduce - with sum reducer', () => {
    const double = x => x * 2;
    const result = transducer.transduce(transducer.map(double))((acc, x) => acc + x)(0)([1, 2, 3]);
    assertEquals(result, 12); // (1*2) + (2*2) + (3*2) = 2 + 4 + 6 = 12
});

console.log('\n✅ Function manipulation tests completed\n');
