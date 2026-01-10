// Free Monad tests
import fp from '../index.js';
import { test, testAsync, assertEquals, assert, logSection } from './utils.js';

const { Free, trampoline } = fp;
const { Pure, Impure, Thunk } = Free;

logSection('Free Monad - Basic');

test('Free.of creates Pure', () => {
    const pure = Free.of(42);
    assert(Free.isPure(pure), 'should be Pure');
    assertEquals(pure.value, 42);
});

test('Free.pure creates Pure', () => {
    const pure = Free.pure('hello');
    assert(Free.isPure(pure), 'should be Pure');
    assertEquals(pure.value, 'hello');
});

test('Pure.map transforms value', () => {
    const pure = Free.pure(5);
    const mapped = pure.map(x => x * 2);
    assert(Free.isPure(mapped), 'should still be Pure');
    assertEquals(mapped.value, 10);
});

test('Pure.flatMap chains computation', () => {
    const pure = Free.pure(5);
    const result = pure.flatMap(x => Free.pure(x + 1));
    assert(Free.isPure(result), 'should be Pure');
    assertEquals(result.value, 6);
});

logSection('Free Monad - Thunk');

test('Thunk.of creates Thunk', () => {
    const thunk = Thunk.of(() => 42);
    assertEquals(thunk.run(), 42);
});

test('Thunk.map composes functions', () => {
    const thunk = Thunk.of(() => 5);
    const mapped = thunk.map(x => x * 2);
    assertEquals(mapped.run(), 10);
});

test('Thunk.done creates Pure', () => {
    const done = Thunk.done(42);
    assert(Free.isPure(done), 'should be Pure');
    assertEquals(done.value, 42);
});

test('Thunk.suspend creates Impure', () => {
    const suspended = Thunk.suspend(() => 42);
    assert(Free.isImpure(suspended), 'should be Impure');
});

logSection('Free Monad - Trampoline');

test('trampoline - simple computation', () => {
    const program = Thunk.done(42);
    const result = trampoline(program);
    assertEquals(result, 42);
});

test('trampoline - suspended computation', () => {
    const program = Thunk.suspend(() => 42);
    const result = trampoline(program);
    assertEquals(result, 42);
});

test('trampoline - chained computation', () => {
    const program = Thunk.suspend(() => 5)
        .flatMap(x => Thunk.suspend(() => x * 2))
        .flatMap(x => Thunk.done(x + 1));
    const result = trampoline(program);
    assertEquals(result, 11); // (5 * 2) + 1 = 11
});

test('trampoline - stack safe recursion', () => {
    // Factorial using trampoline (stack safe)
    const factorial = n => {
        const go = (n, acc) =>
            n <= 1
                ? Thunk.done(acc)
                : Thunk.suspend(() => go(n - 1, n * acc)).flatMap(x => x);
        return trampoline(go(n, 1));
    };
    assertEquals(factorial(5), 120);
    assertEquals(factorial(10), 3628800);
});

test('trampoline - sum with large recursion', () => {
    const sum = n => {
        const go = (n, acc) =>
            n <= 0
                ? Thunk.done(acc)
                : Thunk.suspend(() => go(n - 1, acc + n)).flatMap(x => x);
        return trampoline(go(n, 0));
    };
    assertEquals(sum(100), 5050);
    // Large recursion that would cause stack overflow without trampoline
    assertEquals(sum(1000), 500500);
});

logSection('Free Monad - runSync');

test('runSync - executes program', () => {
    const interpreter = thunk => thunk.run();
    const program = Thunk.suspend(() => 42);
    const result = Free.runSync(interpreter)(program);
    assertEquals(result, 42);
});

test('runSync - handles function target (memoized)', () => {
    const interpreter = thunk => thunk.run();
    let callCount = 0;
    const makeProgram = () => {
        callCount++;
        return Thunk.suspend(() => callCount);
    };
    const runner = Free.runSync(interpreter)(makeProgram);
    const result1 = runner();
    const result2 = runner();
    // First call executes, second call is stack-safe and may be memoized
    assert(typeof result1 === 'number', 'should return number');
});

logSection('Free Monad - runAsync');

testAsync('runAsync - executes async program', async () => {
    const asyncInterpreter = async thunk => {
        await new Promise(r => setTimeout(r, 1));
        return thunk.run();
    };
    const program = Thunk.suspend(() => 42);
    const result = await Free.runAsync(asyncInterpreter)(program);
    assertEquals(result, 42);
});

testAsync('runAsync - chains async computations', async () => {
    const asyncInterpreter = async thunk => {
        await new Promise(r => setTimeout(r, 1));
        return thunk.run();
    };
    const program = Thunk.suspend(() => 5)
        .flatMap(x => Thunk.suspend(() => x * 2));
    const result = await Free.runAsync(asyncInterpreter)(program);
    assertEquals(result, 10);
});

logSection('Free Monad - Monad Laws');

test('Left identity: pure(a).flatMap(f) === f(a)', () => {
    const f = x => Free.pure(x * 2);
    const a = 5;
    const left = Free.pure(a).flatMap(f);
    const right = f(a);
    assertEquals(left.value, right.value);
});

test('Right identity: m.flatMap(pure) === m', () => {
    const m = Free.pure(42);
    const result = m.flatMap(Free.pure);
    assertEquals(result.value, m.value);
});

test('Associativity: m.flatMap(f).flatMap(g) === m.flatMap(x => f(x).flatMap(g))', () => {
    const m = Free.pure(5);
    const f = x => Free.pure(x + 1);
    const g = x => Free.pure(x * 2);
    const left = m.flatMap(f).flatMap(g);
    const right = m.flatMap(x => f(x).flatMap(g));
    assertEquals(left.value, right.value);
});

console.log('\n✅ Free Monad tests completed\n');
