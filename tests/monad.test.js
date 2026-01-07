// Monad Laws Tests
import fp from '../index.js';
import { test, assertEquals, deepEquals, logSection } from './utils.js';

const { Monad, Chain, Applicative, Maybe, Either, Task } = fp;

logSection('Monad Laws');

// Helper functions
const f = x => Maybe.Just(x + 1);
const g = x => Maybe.Just(x * 2);
const fEither = x => Either.Right(x + 1);
const gEither = x => Either.Right(x * 2);
const fArr = x => [x, x + 1];
const gArr = x => [x * 2];
const fTask = x => Task.of(x + 1);
const gTask = x => Task.of(x * 2);

// === Array Monad ===
const arrMonad = Monad.of('array');
const arrChain = Chain.of('array');
const arrApplicative = Applicative.of('array');

test('Array Monad - Left identity: chain(f, of(a)) === f(a)', () => {
    const a = 5;
    assertEquals(
        arrChain.chain(fArr, arrApplicative.of(a)),
        fArr(a)
    );
});

test('Array Monad - Right identity: chain(of, m) === m', () => {
    const m = [1, 2, 3];
    assertEquals(
        arrChain.chain(arrApplicative.of, m),
        m
    );
});

test('Array Monad - Associativity: chain(g, chain(f, m)) === chain(x => chain(g, f(x)), m)', () => {
    const m = [5];
    assertEquals(
        arrChain.chain(gArr, arrChain.chain(fArr, m)),
        arrChain.chain(x => arrChain.chain(gArr, fArr(x)), m)
    );
});

// === Maybe Monad ===
const maybeMonad = Monad.of('maybe');
const maybeChain = Chain.of('maybe');
const maybeApplicative = Applicative.of('maybe');

test('Maybe Monad - Left identity (Just)', () => {
    const a = 5;
    const left = maybeChain.chain(f, maybeApplicative.of(a));
    const right = f(a);
    assertEquals(left.value, right.value);
});

test('Maybe Monad - Right identity (Just)', () => {
    const m = Maybe.Just(5);
    const result = maybeChain.chain(Maybe.Just, m);
    assertEquals(result.value, m.value);
});

test('Maybe Monad - Right identity (Nothing)', () => {
    const m = Maybe.Nothing();
    const result = maybeChain.chain(Maybe.Just, m);
    assertEquals(result.isNothing(), true);
});

test('Maybe Monad - Associativity (Just)', () => {
    const m = Maybe.Just(5);
    const left = maybeChain.chain(g, maybeChain.chain(f, m));
    const right = maybeChain.chain(x => maybeChain.chain(g, f(x)), m);
    assertEquals(left.value, right.value);
});

test('Maybe Monad - Associativity (Nothing)', () => {
    const m = Maybe.Nothing();
    const left = maybeChain.chain(g, maybeChain.chain(f, m));
    const right = maybeChain.chain(x => maybeChain.chain(g, f(x)), m);
    assertEquals(left.isNothing(), true);
    assertEquals(right.isNothing(), true);
});

// === Either Monad ===
const eitherMonad = Monad.of('either');
const eitherChain = Chain.of('either');
const eitherApplicative = Applicative.of('either');

test('Either Monad - Left identity (Right)', () => {
    const a = 5;
    const left = eitherChain.chain(fEither, eitherApplicative.of(a));
    const right = fEither(a);
    assertEquals(left.value, right.value);
});

test('Either Monad - Right identity (Right)', () => {
    const m = Either.Right(5);
    const result = eitherChain.chain(Either.Right, m);
    assertEquals(result.value, m.value);
});

test('Either Monad - Right identity (Left)', () => {
    const m = Either.Left('error');
    const result = eitherChain.chain(Either.Right, m);
    assertEquals(result.isLeft(), true);
    assertEquals(result.value, m.value);
});

test('Either Monad - Associativity (Right)', () => {
    const m = Either.Right(5);
    const left = eitherChain.chain(gEither, eitherChain.chain(fEither, m));
    const right = eitherChain.chain(x => eitherChain.chain(gEither, fEither(x)), m);
    assertEquals(left.value, right.value);
});

// === Task Monad ===
const taskMonad = Monad.of('task');
const taskChain = Chain.of('task');
const taskApplicative = Applicative.of('task');

test('Task Monad - Left identity', () => {
    const a = 5;
    const left = taskChain.chain(fTask, taskApplicative.of(a));
    const right = fTask(a);

    let leftVal, rightVal;
    left.fork(_ => { }, v => { leftVal = v; });
    right.fork(_ => { }, v => { rightVal = v; });

    assertEquals(leftVal, rightVal);
});

test('Task Monad - Right identity', () => {
    const m = Task.of(5);
    const result = taskChain.chain(Task.of, m);

    let mVal, resultVal;
    m.fork(_ => { }, v => { mVal = v; });
    result.fork(_ => { }, v => { resultVal = v; });

    assertEquals(resultVal, mVal);
});

test('Task Monad - Associativity', () => {
    const m = Task.of(5);
    const left = taskChain.chain(gTask, taskChain.chain(fTask, m));
    const right = taskChain.chain(x => taskChain.chain(gTask, fTask(x)), m);

    let leftVal, rightVal;
    left.fork(_ => { }, v => { leftVal = v; });
    right.fork(_ => { }, v => { rightVal = v; });

    assertEquals(leftVal, rightVal);
});

console.log('\n✅ Monad tests completed');
