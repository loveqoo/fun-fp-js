// WriterT Monad Transformer tests
import fp from '../index.js';
import { test, testAsync, assertEquals, assert, assertThrows, logSection } from './utils.js';

const { Free, WriterT, Maybe, Either, Task, Functor, Chain, Monad, Monoid } = fp;

const Identity = {
    of: x => ({ value: x, _typeName: 'Identity' }),
    map: (f, ia) => Identity.of(f(ia.value)),
    chain: (f, ia) => f(ia.value),
    type: 'Identity'
};

/* ═══════════════════════════════════════════════════
   기본 동작
   ═══════════════════════════════════════════════════ */
logSection('WriterT - Basic Operations');

const WT = WriterT(Identity);

test('WT.of wraps Free.pure', () => {
    assert(Free.isPure(WT.of(42)._program), 'should be Free.pure');
    assertEquals(WT.of(42)._typeName, 'WriterT(Identity,Array)');
});

test('WT.tell emits output', () => {
    assert(Free.isImpure(WT.tell([1, 2])._program), 'should be Free.impure');
});

/* ═══════════════════════════════════════════════════
   Runners
   ═══════════════════════════════════════════════════ */
logSection('WriterT - Runners');

test('runWriterT: of returns M([value, empty])', () => {
    const result = WT.runWriterT(WT.of(42));
    assertEquals(result.value, [42, []]);
});

test('runWriterT: tell accumulates output', () => {
    const program = WT.tell([1])
        .chain(_ => WT.tell([2]))
        .chain(_ => WT.tell([3]))
        .chain(_ => WT.of('done'));
    const result = WT.runWriterT(program);
    assertEquals(result.value, ['done', [1, 2, 3]]);
});

test('runWriterT: chain threads value alongside output', () => {
    const program = WT.of(10)
        .chain(x => WT.tell([`got ${x}`]).chain(_ => WT.of(x * 2)))
        .chain(x => WT.tell([`then ${x}`]).chain(_ => WT.of(x + 1)));
    const result = WT.runWriterT(program);
    assertEquals(result.value, [21, ['got 10', 'then 20']]);
});

test('run instance method works', () => {
    const result = WT.of(42).run();
    assertEquals(result.value, [42, []]);
});

/* ═══════════════════════════════════════════════════
   커스텀 Monoid
   ═══════════════════════════════════════════════════ */
logSection('WriterT - Custom Monoid');

test('WriterT with string monoid', () => {
    const stringMonoid = Monoid.of('string');
    const WTS = WriterT(Identity, stringMonoid);
    const program = WTS.tell('hello ')
        .chain(_ => WTS.tell('world'))
        .chain(_ => WTS.of(42));
    const result = WTS.runWriterT(program);
    assertEquals(result.value, [42, 'hello world']);
});

/* ═══════════════════════════════════════════════════
   타입 클래스 통합
   ═══════════════════════════════════════════════════ */
logSection('WriterT - Type Class Integration');

test('Functor.of(alias).map works', () => {
    const alias = 'writert(identity,array)';
    const mapped = Functor.of(alias).map(x => x * 2, WT.of(5));
    const result = WT.runWriterT(mapped);
    assertEquals(result.value, [10, []]);
});

test('Monad.of(alias) exists', () => {
    const monad = Monad.of('writert(identity,array)');
    assert(monad != null, 'should exist');
});

/* ═══════════════════════════════════════════════════
   내부 모나드 통합
   ═══════════════════════════════════════════════════ */
logSection('WriterT - Inner Monad Integration');

test('WriterT(maybe): lift Maybe.Just', () => {
    const WTM = WriterT('maybe');
    const program = WTM.lift(Maybe.Just(42))
        .chain(x => WTM.tell([x]).chain(_ => WTM.of(x)));
    const result = WTM.runWriterT(program);
    assert(Maybe.isJust(result), 'should be Just');
    assertEquals(result.value, [42, [42]]);
});

test('WriterT(maybe): lift Maybe.Nothing propagates', () => {
    const WTM = WriterT('maybe');
    const program = WTM.tell([1])
        .chain(_ => WTM.lift(Maybe.Nothing()))
        .chain(x => WTM.of(x));
    const result = WTM.runWriterT(program);
    assert(Maybe.isNothing(result), 'Nothing should propagate');
});

testAsync('WriterT(task): async with fork', async () => {
    const WTT = WriterT('task');
    const program = WTT.tell(['step1'])
        .chain(_ => WTT.of(42));
    const taskResult = WTT.runWriterT(program);
    const result = await new Promise((resolve, reject) => {
        taskResult.fork(reject, resolve);
    });
    assertEquals(result, [42, ['step1']]);
});

/* ═══════════════════════════════════════════════════
   chain 법칙
   ═══════════════════════════════════════════════════ */
logSection('WriterT - Functor Laws');

test('Functor identity: map(id, m) === m', () => {
    const m = WT.of(42);
    const left = WT.runWriterT(m.map(x => x));
    const right = WT.runWriterT(m);
    assertEquals(left.value, right.value);
});

test('Functor composition: map(f∘g, m) === map(f, map(g, m))', () => {
    const m = WT.of(5);
    const f = x => x * 2;
    const g = x => x + 1;
    const left = WT.runWriterT(m.map(x => f(g(x))));
    const right = WT.runWriterT(m.map(g).map(f));
    assertEquals(left.value, right.value);
});

/* ═══════════════════════════════════════════════════
   Applicative 법칙
   ═══════════════════════════════════════════════════ */
logSection('WriterT - Applicative Laws');

test('Applicative identity: ap(of(id), v) === v', () => {
    const v = WT.of(42);
    const left = WT.runWriterT(WT.ap(WT.of(x => x), v));
    const right = WT.runWriterT(v);
    assertEquals(left.value, right.value);
});

test('Applicative homomorphism: ap(of(f), of(x)) === of(f(x))', () => {
    const f = x => x * 2;
    const left = WT.runWriterT(WT.ap(WT.of(f), WT.of(5)));
    const right = WT.runWriterT(WT.of(f(5)));
    assertEquals(left.value, right.value);
});

test('Applicative interchange: ap(u, of(y)) === ap(of(f => f(y)), u)', () => {
    const u = WT.of(x => x + 10);
    const y = 5;
    const left = WT.runWriterT(WT.ap(u, WT.of(y)));
    const right = WT.runWriterT(WT.ap(WT.of(f => f(y)), u));
    assertEquals(left.value, right.value);
});

/* ═══════════════════════════════════════════════════
   Transformer 법칙
   ═══════════════════════════════════════════════════ */
logSection('WriterT - Transformer Laws');

test('lift(M.of(a)) === T.of(a)', () => {
    const WTM = WriterT('maybe');
    const left = WTM.runWriterT(WTM.lift(Maybe.of(42)));
    const right = WTM.runWriterT(WTM.of(42));
    assertEquals(left.value, right.value);
});

test('lift(M.chain(f, m)) === T.chain(x => lift(f(x)), lift(m))', () => {
    const WTM = WriterT('maybe');
    const m = Maybe.Just(5);
    const f = x => Maybe.Just(x * 2);
    const left = WTM.runWriterT(WTM.lift(Maybe.chain(f, m)));
    const right = WTM.runWriterT(WTM.lift(m).chain(x => WTM.lift(f(x))));
    assertEquals(left.value, right.value);
});

/* ═══════════════════════════════════════════════════
   Chain 법칙 (Monad)
   ═══════════════════════════════════════════════════ */
logSection('WriterT - Chain Laws');

test('Left identity', () => {
    const f = x => WT.of(x * 2);
    const left = WT.runWriterT(WT.of(5).chain(f));
    const right = WT.runWriterT(f(5));
    assertEquals(left.value, right.value);
});

test('Right identity', () => {
    const m = WT.tell([1]).chain(_ => WT.of(42));
    const left = WT.runWriterT(m.chain(WT.of));
    const right = WT.runWriterT(m);
    assertEquals(left.value, right.value);
});

test('Associativity', () => {
    const m = WT.of(5);
    const f = x => WT.tell([x]).chain(_ => WT.of(x + 1));
    const g = x => WT.tell([x]).chain(_ => WT.of(x * 2));
    const left = WT.runWriterT(m.chain(f).chain(g));
    const right = WT.runWriterT(m.chain(x => f(x).chain(g)));
    assertEquals(left.value, right.value);
});

/* ═══════════════════════════════════════════════════
   입력 검증
   ═══════════════════════════════════════════════════ */
logSection('WriterT - Input Validation');

test('runWriterT: non-WT instance throws TypeError', () => {
    assertThrows(() => WT.runWriterT(42), 'should throw');
});

test('chain callback returning non-WT throws TypeError', () => {
    assertThrows(
        () => WT.runWriterT(WT.of(1).chain(_ => 42)),
        'should throw'
    );
});

test('WriterT: bad monoid (missing concat) throws TypeError', () => {
    assertThrows(
        () => WriterT(Identity, { empty: () => [], concat: null }),
        'should throw'
    );
});

test('WriterT: bad monoid (missing empty) throws TypeError', () => {
    assertThrows(
        () => WriterT(Identity, { empty: null, concat: (a, b) => a.concat(b) }),
        'should throw'
    );
});

test('Caching: same M + monoid returns same WT', () => {
    assert(WriterT(Identity) === WriterT(Identity), 'should be cached');
});

console.log('\n✅ WriterT tests completed\n');
