// State Monad Tests
import fp from '../index.js';
import { test, assertEquals, logSection } from './utils.js';

const { State, Functor, Apply, Chain, Monad } = fp;

logSection('State Monad');

// === Constructors ===
test('State.of creates State that preserves state', () => {
    const state = State.of(42);
    const [value, newState] = state.run('initial');
    assertEquals(value, 42);
    assertEquals(newState, 'initial');
});

test('State constructor wraps a state transformation function', () => {
    const state = new State(s => [s * 2, s + 1]);
    const [value, newState] = state.run(5);
    assertEquals(value, 10);
    assertEquals(newState, 6);
});

// === Type checks ===
test('State.isState', () => {
    assertEquals(State.isState(State.of(5)), true);
    assertEquals(State.isState(new State(s => [s, s])), true);
    assertEquals(State.isState(5), false);
    assertEquals(State.isState(s => [s, s]), false);
    assertEquals(State.isState(null), false);
});

// === run, eval, exec ===
test('State.run returns [value, newState] tuple', () => {
    const state = new State(s => [s * 2, s + 10]);
    assertEquals(state.run(5), [10, 15]);
});

test('State.eval returns only the value', () => {
    const state = new State(s => [s * 2, s + 10]);
    assertEquals(state.eval(5), 10);
});

test('State.exec returns only the new state', () => {
    const state = new State(s => [s * 2, s + 10]);
    assertEquals(state.exec(5), 15);
});

// === State.get ===
test('State.get returns current state as value', () => {
    const [value, newState] = State.get.run(42);
    assertEquals(value, 42);
    assertEquals(newState, 42);
});

// === State.put ===
test('State.put replaces the state', () => {
    const state = State.put(100);
    const [value, newState] = state.run(42);
    assertEquals(value, undefined);
    assertEquals(newState, 100);
});

// === State.modify ===
test('State.modify transforms the state', () => {
    const state = State.modify(s => s * 2);
    const [value, newState] = state.run(21);
    assertEquals(value, undefined);
    assertEquals(newState, 42);
});

// === State.gets ===
test('State.gets extracts a value from state', () => {
    const state = State.gets(s => s.name);
    const [value, newState] = state.run({ name: 'Alice', age: 30 });
    assertEquals(value, 'Alice');
    assertEquals(newState, { name: 'Alice', age: 30 });
});

// === Functor (map) ===
test('State.map transforms the value', () => {
    const state = State.of(21);
    const mapped = state.map(x => x * 2);
    assertEquals(mapped.eval(null), 42);
});

test('State.map static method', () => {
    const state = State.of(21);
    const mapped = State.map(x => x * 2, state);
    assertEquals(mapped.eval(null), 42);
});

test('State.map preserves state transformation', () => {
    const state = new State(s => [s, s + 10]);
    const mapped = state.map(x => x * 2);
    const [value, newState] = mapped.run(5);
    assertEquals(value, 10);
    assertEquals(newState, 15);
});

// === Apply (ap) ===
test('State.ap applies function in stateful context', () => {
    const sf = State.of(x => x * 2);
    const sa = State.of(21);
    const result = State.ap(sf, sa);
    assertEquals(result.eval(null), 42);
});

test('State.ap threads state through both computations', () => {
    const sf = new State(s => [x => x + s, s * 2]);
    const sa = new State(s => [s, s + 1]);
    const result = State.ap(sf, sa);
    const [value, newState] = result.run(5);
    // sf: s=5 -> [x => x + 5, 10]
    // sa: s=10 -> [10, 11]
    // apply: (x => x + 5)(10) = 15
    assertEquals(value, 15);
    assertEquals(newState, 11);
});

// === Chain ===
test('State.chain sequences stateful computations', () => {
    const state = State.of(5);
    const result = state.chain(x => new State(s => [x + s, s * 2]));
    const [value, newState] = result.run(10);
    // of(5): [5, 10]
    // chain: [5 + 10, 10 * 2] = [15, 20]
    assertEquals(value, 15);
    assertEquals(newState, 20);
});

test('State.chain static method', () => {
    const state = State.of(5);
    const result = State.chain(x => State.of(x * 2), state);
    assertEquals(result.eval(null), 10);
});

test('State.chain multiple chains', () => {
    const result = State.of(1)
        .chain(a => new State(s => [a + s, s + 1]))
        .chain(b => new State(s => [b * s, s + 1]));
    // start: s = 10
    // of(1): [1, 10]
    // chain 1: [1 + 10, 10 + 1] = [11, 11]
    // chain 2: [11 * 11, 11 + 1] = [121, 12]
    assertEquals(result.run(10), [121, 12]);
});

// === Monad Laws ===
test('Monad Law - Left Identity: of(a).chain(f) === f(a)', () => {
    const f = x => new State(s => [x * 2, s + 1]);
    const a = 21;
    const initialState = 0;

    const left = State.of(a).chain(f);
    const right = f(a);

    assertEquals(left.run(initialState), right.run(initialState));
});

test('Monad Law - Right Identity: m.chain(of) === m', () => {
    const m = new State(s => [s * 2, s + 1]);
    const initialState = 5;

    const left = m.chain(State.of);
    const right = m;

    assertEquals(left.run(initialState), right.run(initialState));
});

test('Monad Law - Associativity: m.chain(f).chain(g) === m.chain(x => f(x).chain(g))', () => {
    const m = State.of(5);
    const f = x => new State(s => [x + s, s + 1]);
    const g = x => new State(s => [x * s, s * 2]);
    const initialState = 2;

    const left = m.chain(f).chain(g);
    const right = m.chain(x => f(x).chain(g));

    assertEquals(left.run(initialState), right.run(initialState));
});

// === Functor Laws ===
test('Functor Law - Identity: map(id) === id', () => {
    const state = new State(s => [s * 2, s + 1]);
    const id = x => x;
    const initialState = 5;

    assertEquals(state.map(id).run(initialState), state.run(initialState));
});

test('Functor Law - Composition: map(f . g) === map(f) . map(g)', () => {
    const state = State.of(5);
    const f = x => x * 2;
    const g = x => x + 3;
    const initialState = 0;

    const left = state.map(x => f(g(x)));
    const right = state.map(g).map(f);

    assertEquals(left.run(initialState), right.run(initialState));
});

// === Type class instances ===
test('Functor.of("state") returns StateFunctor', () => {
    const functor = Functor.of('state');
    const state = State.of(21);
    const mapped = functor.map(x => x * 2, state);
    assertEquals(mapped.eval(null), 42);
});

test('Apply.of("state") returns StateApply', () => {
    const apply = Apply.of('state');
    const sf = State.of(x => x + 1);
    const sa = State.of(41);
    const result = apply.ap(sf, sa);
    assertEquals(result.eval(null), 42);
});

test('Chain.of("state") returns StateChain', () => {
    const chain = Chain.of('state');
    const state = State.of(5);
    const result = chain.chain(x => State.of(x * 2), state);
    assertEquals(result.eval(null), 10);
});

test('Monad.of("state") returns StateMonad', () => {
    const monad = Monad.of('state');
    assertEquals(monad.of(42).eval(null), 42);
});

// === State.pipeK ===
test('State.pipeK composes Kleisli arrows and threads state', () => {
    const add5 = x => new State(s => [x + 5, s + 1]);
    const double = x => new State(s => [x * 2, s + 1]);
    const toString = x => new State(s => [`Result: ${x}`, s + 1]);

    const pipeline = State.pipeK(add5, double, toString);
    const result = pipeline(1);

    const [value, finalState] = result.run(0);
    assertEquals(value, 'Result: 12');
    assertEquals(finalState, 3); // state incremented 3 times
});

test('State.pipeK with single function', () => {
    const f = x => new State(s => [x * 2, s + 1]);
    const pipeline = State.pipeK(f);
    const [value, state] = pipeline(21).run(0);
    assertEquals(value, 42);
    assertEquals(state, 1);
});

// === State.lift ===
test('State.lift lifts binary function', () => {
    const add = (a, b) => a + b;
    const liftedAdd = State.lift(add);

    const s1 = new State(s => [10, s + 1]);
    const s2 = new State(s => [32, s + 1]);

    const result = liftedAdd(s1, s2);
    const [value, finalState] = result.run(0);
    assertEquals(value, 42);
    assertEquals(finalState, 2);
});

test('State.lift lifts ternary function', () => {
    const sum3 = (a, b, c) => a + b + c;
    const liftedSum = State.lift(sum3);

    const s1 = State.of(10);
    const s2 = State.of(20);
    const s3 = State.of(12);

    const result = liftedSum(s1, s2, s3);
    assertEquals(result.eval('init'), 42);
});

test('State.lift with state-dependent computations', () => {
    const multiply = (a, b) => a * b;
    const liftedMultiply = State.lift(multiply);

    const s1 = State.gets(s => s.x);
    const s2 = State.gets(s => s.y);

    const result = liftedMultiply(s1, s2);
    assertEquals(result.eval({ x: 6, y: 7 }), 42);
});

// === Practical usage examples ===
test('State for counter', () => {
    const increment = State.modify(n => n + 1);
    const decrement = State.modify(n => n - 1);
    const getCount = State.get;

    const program = increment
        .chain(() => increment)
        .chain(() => increment)
        .chain(() => decrement)
        .chain(() => getCount);

    assertEquals(program.eval(0), 2);
    assertEquals(program.exec(0), 2);
});

test('State for stack operations', () => {
    const push = x => State.modify(stack => [...stack, x]);
    const pop = new State(stack => {
        const newStack = [...stack];
        const value = newStack.pop();
        return [value, newStack];
    });

    const program = push(1)
        .chain(() => push(2))
        .chain(() => push(3))
        .chain(() => pop)
        .chain(top => State.of(top * 10));

    const [result, finalStack] = program.run([]);
    assertEquals(result, 30);
    assertEquals(finalStack, [1, 2]);
});

test('State for random number generation (pseudo)', () => {
    // Simple linear congruential generator
    const nextRandom = new State(seed => {
        const newSeed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return [newSeed % 100, newSeed];
    });

    const threeRandoms = nextRandom
        .chain(r1 => nextRandom
            .chain(r2 => nextRandom
                .map(r3 => [r1, r2, r3])));

    const [randoms, finalSeed] = threeRandoms.run(42);
    assertEquals(randoms.length, 3);
    assertEquals(typeof finalSeed, 'number');
});

test('State for label generation', () => {
    const freshLabel = new State(n => [`label_${n}`, n + 1]);

    const program = freshLabel
        .chain(l1 => freshLabel
            .chain(l2 => freshLabel
                .map(l3 => [l1, l2, l3])));

    const [labels, nextId] = program.run(0);
    assertEquals(labels, ['label_0', 'label_1', 'label_2']);
    assertEquals(nextId, 3);
});

console.log('\n✅ State tests completed');
