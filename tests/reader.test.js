// Reader Monad Tests
import fp from '../index.js';
import { test, assertEquals, logSection } from './utils.js';

const { Reader, Functor, Apply, Chain, Monad } = fp;

logSection('Reader Monad');

// === Constructors ===
test('Reader.of creates Reader that ignores environment', () => {
    const reader = Reader.of(42);
    assertEquals(reader.run('any env'), 42);
    assertEquals(reader.run(null), 42);
});

test('Reader constructor wraps a function', () => {
    const reader = new Reader(env => env.value * 2);
    assertEquals(reader.run({ value: 21 }), 42);
});

// === Type checks ===
test('Reader.isReader', () => {
    assertEquals(Reader.isReader(Reader.of(5)), true);
    assertEquals(Reader.isReader(new Reader(_ => 5)), true);
    assertEquals(Reader.isReader(5), false);
    assertEquals(Reader.isReader(_ => 5), false);
    assertEquals(Reader.isReader(null), false);
});

// === Reader.ask ===
test('Reader.ask returns the environment', () => {
    const env = { db: 'connection', user: 'admin' };
    assertEquals(Reader.ask.run(env), env);
});

// === Reader.asks ===
test('Reader.asks selects part of the environment', () => {
    const env = { db: 'connection', user: 'admin' };
    const getUser = Reader.asks(e => e.user);
    assertEquals(getUser.run(env), 'admin');
});

// === Reader.local ===
test('Reader.local modifies environment for a Reader', () => {
    const reader = Reader.ask;
    const modified = Reader.local(e => e * 2, reader);
    assertEquals(modified.run(5), 10);
});

test('Reader.local with object environment', () => {
    const reader = Reader.asks(e => e.multiplier);
    const modified = Reader.local(e => ({ ...e, multiplier: e.multiplier * 2 }), reader);
    assertEquals(modified.run({ multiplier: 5 }), 10);
});

// === Functor (map) ===
test('Reader.map transforms the result', () => {
    const reader = Reader.of(21);
    const mapped = reader.map(x => x * 2);
    assertEquals(mapped.run(null), 42);
});

test('Reader.map static method', () => {
    const reader = Reader.of(21);
    const mapped = Reader.map(x => x * 2, reader);
    assertEquals(mapped.run(null), 42);
});

test('Reader.map with environment', () => {
    const reader = new Reader(env => env.base);
    const mapped = reader.map(x => x + 10);
    assertEquals(mapped.run({ base: 32 }), 42);
});

// === Apply (ap) ===
test('Reader.ap applies function in context', () => {
    const rf = Reader.of(x => x * 2);
    const ra = Reader.of(21);
    const result = Reader.ap(rf, ra);
    assertEquals(result.run(null), 42);
});

test('Reader.ap with environment-dependent function', () => {
    const rf = new Reader(env => x => x * env.multiplier);
    const ra = Reader.of(7);
    const result = Reader.ap(rf, ra);
    assertEquals(result.run({ multiplier: 6 }), 42);
});

// === Chain ===
test('Reader.chain sequences computations', () => {
    const getConfig = Reader.ask;
    const useConfig = config => Reader.of(config.value + 10);
    const result = getConfig.chain(useConfig);
    assertEquals(result.run({ value: 32 }), 42);
});

test('Reader.chain static method', () => {
    const reader = Reader.of(5);
    const result = Reader.chain(x => Reader.of(x * 2), reader);
    assertEquals(result.run(null), 10);
});

test('Reader.chain multiple chains', () => {
    const result = Reader.of(1)
        .chain(a => Reader.of(a + 2))
        .chain(b => Reader.of(b * 3));
    assertEquals(result.run(null), 9);
});

// === Monad Laws ===
test('Monad Law - Left Identity: of(a).chain(f) === f(a)', () => {
    const f = x => Reader.of(x * 2);
    const a = 21;
    const env = {};

    const left = Reader.of(a).chain(f);
    const right = f(a);

    assertEquals(left.run(env), right.run(env));
});

test('Monad Law - Right Identity: m.chain(of) === m', () => {
    const m = Reader.of(42);
    const env = {};

    const left = m.chain(Reader.of);
    const right = m;

    assertEquals(left.run(env), right.run(env));
});

test('Monad Law - Associativity: m.chain(f).chain(g) === m.chain(x => f(x).chain(g))', () => {
    const m = Reader.of(5);
    const f = x => Reader.of(x + 3);
    const g = x => Reader.of(x * 2);
    const env = {};

    const left = m.chain(f).chain(g);
    const right = m.chain(x => f(x).chain(g));

    assertEquals(left.run(env), right.run(env));
});

// === Functor Laws ===
test('Functor Law - Identity: map(id) === id', () => {
    const reader = Reader.of(42);
    const env = {};
    const id = x => x;

    assertEquals(reader.map(id).run(env), reader.run(env));
});

test('Functor Law - Composition: map(f . g) === map(f) . map(g)', () => {
    const reader = Reader.of(5);
    const f = x => x * 2;
    const g = x => x + 3;
    const env = {};

    const left = reader.map(x => f(g(x)));
    const right = reader.map(g).map(f);

    assertEquals(left.run(env), right.run(env));
});

// === Type class instances ===
test('Functor.of("reader") returns ReaderFunctor', () => {
    const functor = Functor.of('reader');
    const reader = Reader.of(21);
    const mapped = functor.map(x => x * 2, reader);
    assertEquals(mapped.run(null), 42);
});

test('Apply.of("reader") returns ReaderApply', () => {
    const apply = Apply.of('reader');
    const rf = Reader.of(x => x + 1);
    const ra = Reader.of(41);
    const result = apply.ap(rf, ra);
    assertEquals(result.run(null), 42);
});

test('Chain.of("reader") returns ReaderChain', () => {
    const chain = Chain.of('reader');
    const reader = Reader.of(5);
    const result = chain.chain(x => Reader.of(x * 2), reader);
    assertEquals(result.run(null), 10);
});

test('Monad.of("reader") returns ReaderMonad', () => {
    const monad = Monad.of('reader');
    assertEquals(monad.of(42).run(null), 42);
});

// === Reader.pipeK ===
test('Reader.pipeK composes Kleisli arrows', () => {
    const addEnv = x => Reader.asks(env => x + env.offset);
    const double = x => Reader.of(x * 2);
    const toString = x => Reader.of(`Result: ${x}`);

    const pipeline = Reader.pipeK(addEnv, double, toString);
    const result = pipeline(5);

    assertEquals(result.run({ offset: 3 }), 'Result: 16');
    // (5 + 3) * 2 = 16
});

test('Reader.pipeK with single function', () => {
    const f = x => Reader.of(x * 2);
    const pipeline = Reader.pipeK(f);
    assertEquals(pipeline(21).run(null), 42);
});

// === Reader.lift ===
test('Reader.lift lifts binary function', () => {
    const add = (a, b) => a + b;
    const liftedAdd = Reader.lift(add);

    const r1 = Reader.of(10);
    const r2 = Reader.of(32);

    const result = liftedAdd(r1, r2);
    assertEquals(result.run(null), 42);
});

test('Reader.lift lifts ternary function', () => {
    const sum3 = (a, b, c) => a + b + c;
    const liftedSum = Reader.lift(sum3);

    const r1 = Reader.of(10);
    const r2 = Reader.of(20);
    const r3 = Reader.of(12);

    const result = liftedSum(r1, r2, r3);
    assertEquals(result.run(null), 42);
});

test('Reader.lift with environment-dependent Readers', () => {
    const multiply = (a, b) => a * b;
    const liftedMultiply = Reader.lift(multiply);

    const r1 = Reader.asks(env => env.x);
    const r2 = Reader.asks(env => env.y);

    const result = liftedMultiply(r1, r2);
    assertEquals(result.run({ x: 6, y: 7 }), 42);
});

// === Practical usage example ===
test('Reader for dependency injection', () => {
    // Simulating a service that depends on config
    const getGreeting = Reader.asks(config => config.greeting);
    const getName = Reader.asks(config => config.name);

    const greet = getGreeting.chain(greeting =>
        getName.map(name => `${greeting}, ${name}!`)
    );

    const config = { greeting: 'Hello', name: 'World' };
    assertEquals(greet.run(config), 'Hello, World!');
});

console.log('\n✅ Reader tests completed');
