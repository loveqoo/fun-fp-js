// Writer Monad Tests
import fp from '../index.js';
import { test, assertEquals, logSection } from './utils.js';

const { Writer, Monoid, Functor, Apply, Chain, Monad } = fp;

logSection('Writer Monad');

// === Constructors ===
test('Writer.of creates Writer with empty output', () => {
    const writer = Writer.of(42);
    const [value, output] = writer.run();
    assertEquals(value, 42);
    assertEquals(output, []);
});

test('Writer constructor creates Writer with value and output', () => {
    const writer = new Writer(42, ['log entry']);
    const [value, output] = writer.run();
    assertEquals(value, 42);
    assertEquals(output, ['log entry']);
});

// === Type checks ===
test('Writer.isWriter', () => {
    assertEquals(Writer.isWriter(Writer.of(5)), true);
    assertEquals(Writer.isWriter(new Writer(5, [])), true);
    assertEquals(Writer.isWriter(5), false);
    assertEquals(Writer.isWriter([5, []]), false);
    assertEquals(Writer.isWriter(null), false);
});

// === run and exec ===
test('Writer.run returns [value, output] tuple', () => {
    const writer = new Writer(42, ['a', 'b']);
    assertEquals(writer.run(), [42, ['a', 'b']]);
});

test('Writer.exec returns only the value', () => {
    const writer = new Writer(42, ['a', 'b']);
    assertEquals(writer.exec(), 42);
});

// === Writer.tell ===
test('Writer.tell adds output with undefined value', () => {
    const writer = Writer.tell(['log1', 'log2']);
    const [value, output] = writer.run();
    assertEquals(value, undefined);
    assertEquals(output, ['log1', 'log2']);
});

test('Writer.tell with custom monoid (string)', () => {
    const stringMonoid = Monoid.of('string');
    const writer = Writer.tell('hello', stringMonoid);
    const [value, output] = writer.run();
    assertEquals(value, undefined);
    assertEquals(output, 'hello');
});

// === Writer.listen ===
test('Writer.listen exposes the output alongside value', () => {
    const writer = new Writer(42, ['log']);
    const listened = Writer.listen(writer);
    const [value, output] = listened.run();
    assertEquals(value, [42, ['log']]);
    assertEquals(output, ['log']);
});

// === Writer.listens ===
test('Writer.listens applies function to observed output', () => {
    const writer = new Writer(42, ['a', 'b', 'c']);
    const listened = Writer.listens(logs => logs.length, writer);
    const [value, output] = listened.run();
    assertEquals(value, [42, 3]);
    assertEquals(output, ['a', 'b', 'c']);
});

// === Writer.pass ===
test('Writer.pass transforms output using function from value', () => {
    const writer = new Writer([42, logs => logs.map(l => l.toUpperCase())], ['hello', 'world']);
    const passed = Writer.pass(writer);
    const [value, output] = passed.run();
    assertEquals(value, 42);
    assertEquals(output, ['HELLO', 'WORLD']);
});

// === Writer.censor ===
test('Writer.censor transforms output', () => {
    const writer = new Writer(42, ['secret', 'public']);
    const censored = Writer.censor(logs => logs.filter(l => l !== 'secret'), writer);
    const [value, output] = censored.run();
    assertEquals(value, 42);
    assertEquals(output, ['public']);
});

// === Functor (map) ===
test('Writer.map transforms the value, preserves output', () => {
    const writer = new Writer(21, ['log']);
    const mapped = writer.map(x => x * 2);
    const [value, output] = mapped.run();
    assertEquals(value, 42);
    assertEquals(output, ['log']);
});

test('Writer.map static method', () => {
    const writer = new Writer(21, ['log']);
    const mapped = Writer.map(x => x * 2, writer);
    const [value, output] = mapped.run();
    assertEquals(value, 42);
    assertEquals(output, ['log']);
});

// === Apply (ap) ===
test('Writer.ap applies function and concatenates outputs', () => {
    const wf = new Writer(x => x * 2, ['applying']);
    const wa = new Writer(21, ['to value']);
    const result = Writer.ap(wf, wa);
    const [value, output] = result.run();
    assertEquals(value, 42);
    assertEquals(output, ['applying', 'to value']);
});

// === Chain ===
test('Writer.chain sequences computations and accumulates output', () => {
    const writer = new Writer(5, ['start']);
    const result = writer.chain(x => new Writer(x * 2, ['doubled']));
    const [value, output] = result.run();
    assertEquals(value, 10);
    assertEquals(output, ['start', 'doubled']);
});

test('Writer.chain static method', () => {
    const writer = new Writer(5, ['start']);
    const result = Writer.chain(x => new Writer(x + 1, ['incremented']), writer);
    const [value, output] = result.run();
    assertEquals(value, 6);
    assertEquals(output, ['start', 'incremented']);
});

test('Writer.chain multiple chains accumulates all output', () => {
    const result = Writer.of(1)
        .chain(a => new Writer(a + 2, ['added 2']))
        .chain(b => new Writer(b * 3, ['multiplied by 3']));
    const [value, output] = result.run();
    assertEquals(value, 9);
    assertEquals(output, ['added 2', 'multiplied by 3']);
});

// === Monad Laws ===
test('Monad Law - Left Identity: of(a).chain(f) === f(a)', () => {
    const f = x => new Writer(x * 2, ['doubled']);
    const a = 21;

    const left = Writer.of(a).chain(f);
    const right = f(a);

    assertEquals(left.run(), right.run());
});

test('Monad Law - Right Identity: m.chain(of) === m (output preserved)', () => {
    const m = new Writer(42, ['log']);

    const left = m.chain(Writer.of);
    const right = m;

    // Note: Right identity holds for value, output may differ due to empty concat
    assertEquals(left.exec(), right.exec());
    // Output: ['log'] concat [] = ['log']
    assertEquals(left.run()[1], right.run()[1]);
});

test('Monad Law - Associativity: m.chain(f).chain(g) === m.chain(x => f(x).chain(g))', () => {
    const m = new Writer(5, ['start']);
    const f = x => new Writer(x + 3, ['f']);
    const g = x => new Writer(x * 2, ['g']);

    const left = m.chain(f).chain(g);
    const right = m.chain(x => f(x).chain(g));

    assertEquals(left.run(), right.run());
});

// === Functor Laws ===
test('Functor Law - Identity: map(id) === id', () => {
    const writer = new Writer(42, ['log']);
    const id = x => x;

    assertEquals(writer.map(id).run(), writer.run());
});

test('Functor Law - Composition: map(f . g) === map(f) . map(g)', () => {
    const writer = new Writer(5, ['log']);
    const f = x => x * 2;
    const g = x => x + 3;

    const left = writer.map(x => f(g(x)));
    const right = writer.map(g).map(f);

    assertEquals(left.run(), right.run());
});

// === Custom Monoids ===
test('Writer with String Monoid', () => {
    const stringMonoid = Monoid.of('string');
    const w1 = new Writer(1, 'Hello', stringMonoid);
    const w2 = w1.chain(x => new Writer(x + 1, ' World', stringMonoid));
    const [value, output] = w2.run();
    assertEquals(value, 2);
    assertEquals(output, 'Hello World');
});

test('Writer with Number Sum Monoid', () => {
    const numberMonoid = Monoid.of('number');
    const w1 = new Writer('result', 10, numberMonoid);
    const w2 = w1.chain(x => new Writer(x + '!', 5, numberMonoid));
    const [value, output] = w2.run();
    assertEquals(value, 'result!');
    assertEquals(output, 15);
});

// === Type class instances ===
test('Functor.of("writer") returns WriterFunctor', () => {
    const functor = Functor.of('writer');
    const writer = new Writer(21, ['log']);
    const mapped = functor.map(x => x * 2, writer);
    assertEquals(mapped.exec(), 42);
});

test('Apply.of("writer") returns WriterApply', () => {
    const apply = Apply.of('writer');
    const wf = new Writer(x => x + 1, ['f']);
    const wa = new Writer(41, ['a']);
    const result = apply.ap(wf, wa);
    assertEquals(result.exec(), 42);
});

test('Chain.of("writer") returns WriterChain', () => {
    const chain = Chain.of('writer');
    const writer = new Writer(5, ['start']);
    const result = chain.chain(x => new Writer(x * 2, ['doubled']), writer);
    assertEquals(result.run(), [10, ['start', 'doubled']]);
});

test('Monad.of("writer") returns WriterMonad', () => {
    const monad = Monad.of('writer');
    assertEquals(monad.of(42).exec(), 42);
});

// === Writer.pipeK ===
test('Writer.pipeK composes Kleisli arrows and accumulates output', () => {
    const add5 = x => new Writer(x + 5, ['add 5']);
    const double = x => new Writer(x * 2, ['double']);
    const toString = x => new Writer(`Result: ${x}`, ['to string']);

    const pipeline = Writer.pipeK(add5, double, toString);
    const result = pipeline(1);

    const [value, logs] = result.run();
    assertEquals(value, 'Result: 12');
    assertEquals(logs, ['add 5', 'double', 'to string']);
});

test('Writer.pipeK with single function', () => {
    const f = x => new Writer(x * 2, ['doubled']);
    const pipeline = Writer.pipeK(f);
    const [value, logs] = pipeline(21).run();
    assertEquals(value, 42);
    assertEquals(logs, ['doubled']);
});

// === Writer.lift ===
test('Writer.lift lifts binary function', () => {
    const add = (a, b) => a + b;
    const liftedAdd = Writer.lift(add);

    const w1 = new Writer(10, ['w1']);
    const w2 = new Writer(32, ['w2']);

    const result = liftedAdd(w1, w2);
    const [value, logs] = result.run();
    assertEquals(value, 42);
    assertEquals(logs, ['w1', 'w2']);
});

test('Writer.lift lifts ternary function', () => {
    const sum3 = (a, b, c) => a + b + c;
    const liftedSum = Writer.lift(sum3);

    const w1 = new Writer(10, ['a']);
    const w2 = new Writer(20, ['b']);
    const w3 = new Writer(12, ['c']);

    const result = liftedSum(w1, w2, w3);
    const [value, logs] = result.run();
    assertEquals(value, 42);
    assertEquals(logs, ['a', 'b', 'c']);
});

test('Writer.lift with string monoid', () => {
    const stringMonoid = Monoid.of('string');
    const concat = (a, b) => a + b;
    const liftedConcat = Writer.lift(concat);

    const w1 = new Writer('Hello', ' from', stringMonoid);
    const w2 = new Writer(' World', ' Writer', stringMonoid);

    const result = liftedConcat(w1, w2);
    const [value, logs] = result.run();
    assertEquals(value, 'Hello World');
    assertEquals(logs, ' from Writer');
});

// === Practical usage examples ===
test('Writer for logging computation steps', () => {
    const addWithLog = (x, y) =>
        new Writer(x + y, [`Added ${x} + ${y} = ${x + y}`]);

    const multiplyWithLog = (x, y) =>
        new Writer(x * y, [`Multiplied ${x} * ${y} = ${x * y}`]);

    const result = addWithLog(3, 4)
        .chain(sum => multiplyWithLog(sum, 2));

    const [value, logs] = result.run();
    assertEquals(value, 14);
    assertEquals(logs.length, 2);
    assertEquals(logs[0], 'Added 3 + 4 = 7');
    assertEquals(logs[1], 'Multiplied 7 * 2 = 14');
});

test('Writer for accumulating costs', () => {
    const numberMonoid = Monoid.of('number');

    const step1 = new Writer('data', 10, numberMonoid);
    const step2 = step1.chain(d => new Writer(d + ' processed', 25, numberMonoid));
    const step3 = step2.chain(d => new Writer(d + ' completed', 15, numberMonoid));

    const [value, totalCost] = step3.run();
    assertEquals(value, 'data processed completed');
    assertEquals(totalCost, 50);
});

console.log('\n✅ Writer tests completed');
