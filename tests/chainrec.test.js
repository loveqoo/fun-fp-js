// ChainRec tests
import fp from '../index.js';
import { test, testAsync, assertEquals, assert, logSection } from './utils.js';

const { ChainRec, Either, Task } = fp;

logSection('ChainRec');

test('ChainRec.types has EitherChainRec', () => {
    assert(ChainRec.types.EitherChainRec, 'should have EitherChainRec');
});

test('ChainRec.types has TaskChainRec', () => {
    assert(ChainRec.types.TaskChainRec, 'should have TaskChainRec');
});

test('ChainRec.next and ChainRec.done exist', () => {
    assert(typeof ChainRec.next === 'function', 'next should be function');
    assert(typeof ChainRec.done === 'function', 'done should be function');
});

test('EitherChainRec.chainRec - simple iteration', () => {
    // f(next, done, i) signature
    // Sum numbers from 1 to n
    const result = ChainRec.types.EitherChainRec.chainRec(
        (next, done, { sum, i }) =>
            i > 10
                ? Either.Right(done(sum))         // Done
                : Either.Right(next({ sum: sum + i, i: i + 1 })),  // Continue
        { sum: 0, i: 1 }
    );

    assert(Either.isRight(result), 'should be Right');
    assertEquals(result.value, 55);  // 1+2+...+10 = 55
});

test('EitherChainRec.chainRec - stack safe', () => {
    // Large iteration that would overflow without tail-call optimization
    const result = ChainRec.types.EitherChainRec.chainRec(
        (next, done, i) => i >= 1000
            ? Either.Right(done(i))
            : Either.Right(next(i + 1)),
        0
    );

    assertEquals(result.value, 1000);
});

test('EitherChainRec.chainRec - early failure with Left', () => {
    const result = ChainRec.types.EitherChainRec.chainRec(
        (next, done, i) => i >= 5
            ? Either.Left('error at 5')
            : Either.Right(next(i + 1)),
        0
    );

    assert(Either.isLeft(result), 'should stop with Left');
    assertEquals(result.value, 'error at 5');
});

test('EitherChainRec.chainRec - stack safe with 10000 iterations', () => {
    const result = ChainRec.types.EitherChainRec.chainRec(
        (next, done, i) => i >= 10000
            ? Either.Right(done(i))
            : Either.Right(next(i + 1)),
        0
    );

    assertEquals(result.value, 10000);
});

test('EitherChainRec.chainRec - stack safe with 100000 iterations', () => {
    const result = ChainRec.types.EitherChainRec.chainRec(
        (next, done, i) => i >= 100000
            ? Either.Right(done(i))
            : Either.Right(next(i + 1)),
        0
    );

    assertEquals(result.value, 100000);
});

console.log('\n✅ ChainRec tests completed\n');
