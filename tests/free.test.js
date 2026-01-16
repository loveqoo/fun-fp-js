// Free Monad tests
import fp from '../index.js';
import { test, testAsync, assertEquals, assert, logSection } from './utils.js';

const { Free, Functor, Chain, Monad, trampoline } = fp;
const { Thunk } = Free;

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

test('Free.isFree checks Free type', () => {
    const pure = Free.pure(42);
    const impure = Thunk.suspend(() => 42);
    assert(Free.isFree(pure), 'Pure should be Free');
    assert(Free.isFree(impure), 'Impure should be Free');
    assert(!Free.isFree(42), 'Number should not be Free');
});

test('Functor.of("free").map transforms value', () => {
    const pure = Free.pure(5);
    const mapped = Functor.of('free').map(x => x * 2, pure);
    assert(Free.isPure(mapped), 'should still be Pure');
    assertEquals(mapped.value, 10);
});

test('Chain.of("free").chain chains computation', () => {
    const pure = Free.pure(5);
    const result = Chain.of('free').chain(x => Free.pure(x + 1), pure);
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

test('trampoline - chained computation using Chain', () => {
    const chain = Chain.of('free');
    const program = chain.chain(
        x => chain.chain(
            y => Thunk.done(y + 1),
            Thunk.suspend(() => x * 2)
        ),
        Thunk.suspend(() => 5)
    );
    const result = trampoline(program);
    assertEquals(result, 11); // (5 * 2) + 1 = 11
});

test('trampoline - stack safe recursion', () => {
    const chain = Chain.of('free');
    // Factorial using trampoline (stack safe)
    const factorial = n => {
        const go = (n, acc) =>
            n <= 1
                ? Thunk.done(acc)
                : chain.chain(x => x, Thunk.suspend(() => go(n - 1, n * acc)));
        return trampoline(go(n, 1));
    };
    assertEquals(factorial(5), 120);
    assertEquals(factorial(10), 3628800);
});

test('trampoline - sum with large recursion', () => {
    const chain = Chain.of('free');
    const sum = n => {
        const go = (n, acc) =>
            n <= 0
                ? Thunk.done(acc)
                : chain.chain(x => x, Thunk.suspend(() => go(n - 1, acc + n)));
        return trampoline(go(n, 0));
    };
    assertEquals(sum(100), 5050);
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

testAsync('runAsync - chains async computations using Chain', async () => {
    const chain = Chain.of('free');
    const asyncInterpreter = async thunk => {
        await new Promise(r => setTimeout(r, 1));
        return thunk.run();
    };
    const program = chain.chain(
        x => Thunk.suspend(() => x * 2),
        Thunk.suspend(() => 5)
    );
    const result = await Free.runAsync(asyncInterpreter)(program);
    assertEquals(result, 10);
});

logSection('Free Monad - Static Land Laws');

test('Left identity: chain(f, of(a)) === f(a)', () => {
    const chain = Chain.of('free');
    const f = x => Free.pure(x * 2);
    const a = 5;
    const left = chain.chain(f, Free.pure(a));
    const right = f(a);
    assertEquals(left.value, right.value);
});

test('Right identity: chain(of, m) === m', () => {
    const chain = Chain.of('free');
    const m = Free.pure(42);
    const result = chain.chain(Free.pure, m);
    assertEquals(result.value, m.value);
});

test('Associativity: chain(g, chain(f, m)) === chain(x => chain(g, f(x)), m)', () => {
    const chain = Chain.of('free');
    const m = Free.pure(5);
    const f = x => Free.pure(x + 1);
    const g = x => Free.pure(x * 2);
    const left = chain.chain(g, chain.chain(f, m));
    const right = chain.chain(x => chain.chain(g, f(x)), m);
    assertEquals(left.value, right.value);
});

logSection('Free Monad - pipeK');

test('Free.pipeK composes Kleisli arrows', () => {
    const inc = x => Free.pure(x + 1);
    const double = x => Free.pure(x * 2);
    const pipeline = Free.pipeK(inc, double);
    const result = trampoline(pipeline(5));
    assertEquals(result, 12); // (5 + 1) * 2 = 12
});

console.log('\n✅ Free Monad tests completed\n');
