// ReaderT Monad Transformer tests
import fp from '../index.js';
import { test, testAsync, assertEquals, assert, assertThrows, logSection } from './utils.js';

const { Free, ReaderT, Maybe, Either, Task, Functor, Chain, Monad } = fp;

const Identity = {
    of: x => ({ value: x, _typeName: 'Identity' }),
    map: (f, ia) => Identity.of(f(ia.value)),
    chain: (f, ia) => f(ia.value),
    type: 'Identity'
};

/* ═══════════════════════════════════════════════════
   기본 동작
   ═══════════════════════════════════════════════════ */
logSection('ReaderT - Basic Operations');

const RT = ReaderT(Identity);

test('RT.of wraps Free.pure', () => {
    assert(Free.isPure(RT.of(42)._program), 'should be Free.pure');
    assertEquals(RT.of(42)._typeName, 'ReaderT(Identity)');
});

test('RT.ask reads environment', () => {
    const result = RT.runReaderT({ name: 'test' }, RT.ask);
    assertEquals(result.value, { name: 'test' });
});

test('RT.asks applies function to environment', () => {
    const result = RT.runReaderT({ x: 10 }, RT.asks(env => env.x * 2));
    assertEquals(result.value, 20);
});

test('RT.local modifies environment for sub-program', () => {
    const program = RT.local(
        env => ({ ...env, x: env.x + 100 }),
        RT.asks(env => env.x)
    );
    const result = RT.runReaderT({ x: 1 }, program);
    assertEquals(result.value, 101);
});

test('RT.local does not affect outer environment', () => {
    const program = RT.local(env => ({ ...env, x: 999 }), RT.asks(env => env.x))
        .chain(inner => RT.asks(env => [inner, env.x]));
    const result = RT.runReaderT({ x: 1 }, program);
    assertEquals(result.value, [999, 1]);
});

/* ═══════════════════════════════════════════════════
   Runners
   ═══════════════════════════════════════════════════ */
logSection('ReaderT - Runners');

test('runReaderT: of returns M(value)', () => {
    const result = RT.runReaderT('env', RT.of(42));
    assertEquals(result.value, 42);
});

test('runReaderT: chain composes with environment', () => {
    const program = RT.ask
        .chain(env => RT.of(env.toUpperCase()));
    const result = RT.runReaderT('hello', program);
    assertEquals(result.value, 'HELLO');
});

test('run instance method works', () => {
    const result = RT.of(42).run('env');
    assertEquals(result.value, 42);
});

/* ═══════════════════════════════════════════════════
   타입 클래스 통합
   ═══════════════════════════════════════════════════ */
logSection('ReaderT - Type Class Integration');

test('Functor.of(alias).map works', () => {
    const alias = 'readert(identity)';
    const mapped = Functor.of(alias).map(x => x * 2, RT.of(5));
    const result = RT.runReaderT('env', mapped);
    assertEquals(result.value, 10);
});

test('Monad.of(alias) exists', () => {
    const monad = Monad.of('readert(identity)');
    assert(monad != null, 'should exist');
    assert(typeof monad.of === 'function', 'should have of');
});

/* ═══════════════════════════════════════════════════
   내부 모나드 통합
   ═══════════════════════════════════════════════════ */
logSection('ReaderT - Inner Monad Integration');

test('ReaderT(maybe): lift Maybe.Just', () => {
    const RTM = ReaderT('maybe');
    const program = RTM.lift(Maybe.Just(42));
    const result = RTM.runReaderT('env', program);
    assert(Maybe.isJust(result), 'should be Just');
    assertEquals(result.value, 42);
});

test('ReaderT(maybe): lift Maybe.Nothing propagates', () => {
    const RTM = ReaderT('maybe');
    const program = RTM.ask
        .chain(_ => RTM.lift(Maybe.Nothing()))
        .chain(x => RTM.of(x + 1));
    const result = RTM.runReaderT('env', program);
    assert(Maybe.isNothing(result), 'Nothing should propagate');
});

testAsync('ReaderT(task): async with fork', async () => {
    const RTT = ReaderT('task');
    const program = RTT.ask
        .chain(env => RTT.of(env + '!'));
    const taskResult = RTT.runReaderT('hello', program);
    const result = await new Promise((resolve, reject) => {
        taskResult.fork(reject, resolve);
    });
    assertEquals(result, 'hello!');
});

/* ═══════════════════════════════════════════════════
   Functor 법칙
   ═══════════════════════════════════════════════════ */
logSection('ReaderT - Functor Laws');

test('Functor identity: map(id, m) === m', () => {
    const m = RT.of(42);
    const left = RT.runReaderT('e', m.map(x => x));
    const right = RT.runReaderT('e', m);
    assertEquals(left.value, right.value);
});

test('Functor composition: map(f∘g, m) === map(f, map(g, m))', () => {
    const m = RT.of(5);
    const f = x => x * 2;
    const g = x => x + 1;
    const left = RT.runReaderT('e', m.map(x => f(g(x))));
    const right = RT.runReaderT('e', m.map(g).map(f));
    assertEquals(left.value, right.value);
});

/* ═══════════════════════════════════════════════════
   Applicative 법칙
   ═══════════════════════════════════════════════════ */
logSection('ReaderT - Applicative Laws');

test('Applicative identity: ap(of(id), v) === v', () => {
    const v = RT.of(42);
    const left = RT.runReaderT('e', RT.ap(RT.of(x => x), v));
    const right = RT.runReaderT('e', v);
    assertEquals(left.value, right.value);
});

test('Applicative homomorphism: ap(of(f), of(x)) === of(f(x))', () => {
    const f = x => x * 2;
    const left = RT.runReaderT('e', RT.ap(RT.of(f), RT.of(5)));
    const right = RT.runReaderT('e', RT.of(f(5)));
    assertEquals(left.value, right.value);
});

test('Applicative interchange: ap(u, of(y)) === ap(of(f => f(y)), u)', () => {
    const u = RT.of(x => x + 10);
    const y = 5;
    const left = RT.runReaderT('e', RT.ap(u, RT.of(y)));
    const right = RT.runReaderT('e', RT.ap(RT.of(f => f(y)), u));
    assertEquals(left.value, right.value);
});

/* ═══════════════════════════════════════════════════
   Transformer 법칙
   ═══════════════════════════════════════════════════ */
logSection('ReaderT - Transformer Laws');

test('lift(M.of(a)) === T.of(a)', () => {
    const RTM = ReaderT('maybe');
    const left = RTM.runReaderT('e', RTM.lift(Maybe.of(42)));
    const right = RTM.runReaderT('e', RTM.of(42));
    assertEquals(left.value, right.value);
});

test('lift(M.chain(f, m)) === T.chain(x => lift(f(x)), lift(m))', () => {
    const RTM = ReaderT('maybe');
    const m = Maybe.Just(5);
    const f = x => Maybe.Just(x * 2);
    const left = RTM.runReaderT('e', RTM.lift(Maybe.chain(f, m)));
    const right = RTM.runReaderT('e', RTM.lift(m).chain(x => RTM.lift(f(x))));
    assertEquals(left.value, right.value);
});

/* ═══════════════════════════════════════════════════
   Chain 법칙 (Monad)
   ═══════════════════════════════════════════════════ */
logSection('ReaderT - Chain Laws');

test('Left identity', () => {
    const f = x => RT.of(x * 2);
    const left = RT.runReaderT('e', RT.of(5).chain(f));
    const right = RT.runReaderT('e', f(5));
    assertEquals(left.value, right.value);
});

test('Right identity', () => {
    const m = RT.ask;
    const left = RT.runReaderT('e', m.chain(RT.of));
    const right = RT.runReaderT('e', m);
    assertEquals(left.value, right.value);
});

test('Associativity', () => {
    const m = RT.ask;
    const f = x => RT.of(x + '!');
    const g = x => RT.of(x + '?');
    const left = RT.runReaderT('e', m.chain(f).chain(g));
    const right = RT.runReaderT('e', m.chain(x => f(x).chain(g)));
    assertEquals(left.value, right.value);
});

/* ═══════════════════════════════════════════════════
   입력 검증
   ═══════════════════════════════════════════════════ */
logSection('ReaderT - Input Validation');

test('runReaderT: non-RT instance throws TypeError', () => {
    assertThrows(() => RT.runReaderT('env', 42), 'should throw');
});

test('chain callback returning non-RT throws TypeError', () => {
    assertThrows(
        () => RT.runReaderT('env', RT.of(1).chain(_ => 42)),
        'should throw'
    );
});

test('local: non-function first arg throws TypeError', () => {
    assertThrows(() => RT.local(42, RT.ask), 'should throw');
});

test('local: non-RT second arg throws TypeError', () => {
    assertThrows(() => RT.local(x => x, 42), 'should throw');
});

test('Caching: same M returns same RT', () => {
    assert(ReaderT(Identity) === ReaderT(Identity), 'should be cached');
});

console.log('\n✅ ReaderT tests completed\n');
