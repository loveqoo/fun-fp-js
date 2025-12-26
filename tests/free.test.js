const lib = require('../index.js')();
const { free, core } = lib;

const { test, assert, assertEquals } = require('./utils.js');
console.log('🚀 Starting modules/free.js tests...\n');

// === Pure ===
test('pure - wraps value', () => {
    const p = free.pure(42);
    assert(free.isPure(p), 'Should be Pure');
    assert(!free.isImpure(p), 'Should not be Impure');
    assertEquals(p.value, 42);
});

test('pure - map transforms value', () => {
    const p = free.pure(5).map(x => x * 2);
    assert(free.isPure(p));
    assertEquals(p.value, 10);
});

test('pure - flatMap returns new Free', () => {
    const p = free.pure(5).flatMap(x => free.pure(x * 2));
    assert(free.isPure(p));
    assertEquals(p.value, 10);
});

// === done & suspend ===
test('done - equivalent to pure', () => {
    const d = free.done(42);
    assert(free.isPure(d));
    assertEquals(d.value, 42);
});

test('suspend - creates Impure with Thunk', () => {
    const s = free.suspend(() => 42);
    assert(free.isImpure(s), 'Should be Impure');
    assert(!free.isPure(s), 'Should not be Pure');
});

// === Trampoline ===
test('trampoline - factorial', () => {
    const factorial = free.trampoline((n, acc = 1) =>
        n <= 1 ? free.done(acc) : free.suspend(() => factorial(n - 1, n * acc))
    );

    assertEquals(factorial(0), 1);
    assertEquals(factorial(1), 1);
    assertEquals(factorial(5), 120);
    assertEquals(factorial(10), 3628800);
});

test('trampoline - fibonacci (tail recursive)', () => {
    const fib = free.trampoline((n, a = 0, b = 1) =>
        n <= 0 ? free.done(a) : free.suspend(() => fib(n - 1, b, a + b))
    );

    assertEquals(fib(0), 0);
    assertEquals(fib(1), 1);
    assertEquals(fib(10), 55);
    assertEquals(fib(20), 6765);
});

test('trampoline - stack safety (deep recursion)', () => {
    const countDown = free.trampoline(n =>
        n <= 0 ? free.done('done') : free.suspend(() => countDown(n - 1))
    );

    // Should not throw RangeError
    const result = countDown(10000);
    assertEquals(result, 'done');
});

test('trampoline - sum range', () => {
    const sumRange = free.trampoline((n, acc = 0) =>
        n <= 0 ? free.done(acc) : free.suspend(() => sumRange(n - 1, acc + n))
    );

    assertEquals(sumRange(100), 5050);
});

// === Pure/Impure type checks ===
test('isPure & isImpure', () => {
    const p = free.pure(1);
    const i = free.suspend(() => 1);

    assert(free.isPure(p), 'pure should be Pure');
    assert(!free.isImpure(p), 'pure should not be Impure');
    assert(!free.isPure(i), 'suspend should not be Pure');
    assert(free.isImpure(i), 'suspend should be Impure');
});

// === liftF ===
test('liftF - lifts functor into Free', () => {
    // Create a simple functor
    const myFunctor = {
        value: 42,
        map(f) {
            return { ...this, value: f(this.value), map: this.map };
        },
        [core.Types.Functor]: true
    };

    const lifted = free.liftF(myFunctor);
    assert(free.isImpure(lifted), 'liftF should create Impure');
});

test('liftF - passes through Pure/Impure', () => {
    const p = free.pure(42);
    const result = free.liftF(p);
    assert(result === p, 'Should return same Pure');
});

// === runSync ===
test('runSync - executes program with custom runner', () => {
    // Simple counter functor
    class Counter {
        constructor(n, next) {
            this.n = n;
            this.next = next;
            this[core.Types.Functor] = true;
        }
        map(f) {
            return new Counter(this.n, f(this.next));
        }
    }

    let count = 0;
    const runner = functor => {
        count += functor.n;
        return functor.next;
    };

    const program = free.impure(new Counter(1, free.impure(new Counter(2, free.pure('done')))));
    const result = free.runSync(runner)(program);

    assertEquals(count, 3);
    assertEquals(result, 'done');
});

// === Functor/Monad protocol ===
test('Pure has Functor/Monad symbols', () => {
    const p = free.pure(42);
    assert(core.isFunctor(p), 'Pure should be Functor');
    assert(core.isMonad(p), 'Pure should be Monad');
});

test('Impure has Functor/Monad symbols', () => {
    const i = free.suspend(() => 42);
    assert(core.isFunctor(i), 'Impure should be Functor');
    assert(core.isMonad(i), 'Impure should be Monad');
});

// === Impure map/flatMap ===
test('Impure - map distributes through functor', () => {
    const thunk = free.suspend(() => 5);
    const mapped = thunk.map(x => x * 2);
    assert(free.isImpure(mapped));

    // Execute to verify
    const result = free.trampoline(_ => mapped)();
    assertEquals(result, 10);
});

test('Impure - flatMap distributes through functor', () => {
    const thunk = free.suspend(() => 5);
    const chained = thunk.flatMap(x => free.pure(x * 2));
    assert(free.isImpure(chained));

    const result = free.trampoline(_ => chained)();
    assertEquals(result, 10);
});

console.log('\n🛡️ Starting Boundary and Error tests...');

test('liftF - throws for non-functor', () => {
    try {
        free.liftF({ notAFunctor: true });
        assert(false, 'Should have thrown');
    } catch (e) {
        assert(e.message.includes('expected a functor'));
    }
});

test('impure - throws for non-functor', () => {
    try {
        free.impure({ notAFunctor: true });
        assert(false, 'Should have thrown');
    } catch (e) {
        assert(e.message.includes('expected a functor'));
    }
});

test('suspend - throws for non-function', () => {
    try {
        free.suspend(42);
        assert(false, 'Should have thrown');
    } catch (e) {
        assert(e instanceof TypeError);
    }
});
