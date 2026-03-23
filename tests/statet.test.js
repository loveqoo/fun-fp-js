// StateT Monad Transformer tests
import fp from '../index.js';
import { test, testAsync, assertEquals, assert, assertThrows, logSection } from './utils.js';

const { Free, StateT, Maybe, Either, Task, Functor, Apply, Chain, Monad } = fp;

// Identity: 테스트용 로컬 헬퍼
const Identity = {
    of: x => ({ value: x, _typeName: 'Identity' }),
    map: (f, ia) => Identity.of(f(ia.value)),
    chain: (f, ia) => f(ia.value),
    type: 'Identity'
};

/* ═══════════════════════════════════════════════════
   기본 동작
   ═══════════════════════════════════════════════════ */
logSection('StateT - Basic Operations');

const ST = StateT(Identity);

test('ST.of returns ST wrapping Free.pure', () => {
    const program = ST.of(42);
    assert(Free.isPure(program._program), 'internal should be Free.pure');
    assertEquals(program._typeName, 'StateT(Identity)');
});

test('ST.get returns ST wrapping Free.impure(GetF)', () => {
    assert(Free.isImpure(ST.get._program), 'internal should be Free.impure');
});

test('ST.put returns ST wrapping Free.impure(PutF)', () => {
    const program = ST.put(10);
    assert(Free.isImpure(program._program), 'internal should be Free.impure');
});

test('ST.modify returns ST wrapping Free.impure(ModifyF)', () => {
    const program = ST.modify(s => s + 1);
    assert(Free.isImpure(program._program), 'internal should be Free.impure');
});

test('ST.gets returns ST wrapping Free.impure(GetF)', () => {
    const program = ST.gets(s => s * 2);
    assert(Free.isImpure(program._program), 'internal should be Free.impure');
});

/* ═══════════════════════════════════════════════════
   run / eval / exec
   ═══════════════════════════════════════════════════ */
logSection('StateT - Runners');

test('runState: of returns M([value, state])', () => {
    const result = ST.runState(0, ST.of(42));
    assertEquals(result.value, [42, 0]);
});

test('runState: get returns M([state, state])', () => {
    const result = ST.runState(5, ST.get);
    assertEquals(result.value, [5, 5]);
});

test('runState: put sets state', () => {
    const result = ST.runState(0, ST.put(10));
    assertEquals(result.value, [undefined, 10]);
});

test('runState: modify transforms state', () => {
    const result = ST.runState(3, ST.modify(s => s * 2));
    assertEquals(result.value, [undefined, 6]);
});

test('runState: gets applies function to state', () => {
    const result = ST.runState(5, ST.gets(s => s + 10));
    assertEquals(result.value, [15, 5]);
});

test('runState: chain composes operations', () => {
    const program = ST.get
        .chain(s => ST.put(s + 1))
        .chain(_ => ST.get);
    const result = ST.runState(0, program);
    assertEquals(result.value, [1, 1]);
});

test('eval extracts value only', () => {
    const program = ST.get.chain(s => ST.of(s * 10));
    const result = program.eval(5);
    assertEquals(result.value, 50);
});

test('exec extracts state only', () => {
    const result = ST.put(99).exec(0);
    assertEquals(result.value, 99);
});

/* ═══════════════════════════════════════════════════
   타입 클래스 통합
   ═══════════════════════════════════════════════════ */
logSection('StateT - Type Class Integration');

test('Functor.of(alias).map works', () => {
    const alias = 'statet(identity)';
    const st = ST.of(5);
    const mapped = Functor.of(alias).map(x => x * 2, st);
    const result = ST.runState(0, mapped);
    assertEquals(result.value, [10, 0]);
});

test('Chain.of(alias).chain works', () => {
    const alias = 'statet(identity)';
    const st = ST.of(5);
    const chained = Chain.of(alias).chain(x => ST.of(x + 1), st);
    const result = ST.runState(0, chained);
    assertEquals(result.value, [6, 0]);
});

test('Monad.of(alias) exists', () => {
    const alias = 'statet(identity)';
    const monad = Monad.of(alias);
    assert(monad != null, 'Monad instance should exist');
    assert(typeof monad.of === 'function', 'should have of');
    assert(typeof monad.chain === 'function', 'should have chain');
    assert(typeof monad.map === 'function', 'should have map');
});

test('ST.map static method works', () => {
    const result = ST.runState(0, ST.map(x => x * 3, ST.of(7)));
    assertEquals(result.value, [21, 0]);
});

test('ST.chain static method works', () => {
    const result = ST.runState(0, ST.chain(x => ST.put(x), ST.of(42)));
    assertEquals(result.value, [undefined, 42]);
});

/* ═══════════════════════════════════════════════════
   내부 모나드 통합
   ═══════════════════════════════════════════════════ */
logSection('StateT - Inner Monad Integration');

test('StateT(maybe): Nothing propagates through lift', () => {
    const STM = StateT('maybe');
    const program = STM.get
        .chain(_ => STM.lift(Maybe.Nothing()))
        .chain(_ => STM.put(999));
    const result = STM.runState(0, program);
    assert(Maybe.isNothing(result), 'Nothing should propagate');
});

test('StateT(maybe): Just passes value through lift', () => {
    const STM = StateT('maybe');
    const program = STM.lift(Maybe.Just(42))
        .chain(x => STM.put(x))
        .chain(_ => STM.get);
    const result = STM.runState(0, program);
    assert(Maybe.isJust(result), 'Should be Just');
    assertEquals(result.value, [42, 42]);
});

test('StateT(either): Left propagates through lift', () => {
    const STE = StateT('either');
    const program = STE.get
        .chain(_ => STE.lift(Either.Left('error')))
        .chain(_ => STE.put(999));
    const result = STE.runState(0, program);
    assert(Either.isLeft(result), 'Left should propagate');
    assertEquals(result.value, 'error');
});

test('StateT(either): Right passes value through lift', () => {
    const STE = StateT('either');
    const program = STE.lift(Either.Right(10))
        .chain(x => STE.put(x))
        .chain(_ => STE.get);
    const result = STE.runState(0, program);
    assert(Either.isRight(result), 'Should be Right');
    assertEquals(result.value, [10, 10]);
});

testAsync('StateT(task): async StateT with fork', async () => {
    const STT = StateT('task');
    const program = STT.get
        .chain(s => STT.put(s + 1))
        .chain(_ => STT.get);
    const taskResult = STT.runState(0, program);
    const result = await new Promise((resolve, reject) => {
        taskResult.fork(reject, resolve);
    });
    assertEquals(result, [1, 1]);
});

testAsync('StateT(task): lift with Task.of', async () => {
    const STT = StateT('task');
    const program = STT.lift(Task.of(42))
        .chain(x => STT.put(x))
        .chain(_ => STT.get);
    const taskResult = STT.runState(0, program);
    const result = await new Promise((resolve, reject) => {
        taskResult.fork(reject, resolve);
    });
    assertEquals(result, [42, 42]);
});

/* ═══════════════════════════════════════════════════
   Free 위 chain 법칙
   ═══════════════════════════════════════════════════ */
logSection('StateT - Chain Laws');

test('Left identity: chain(f, of(a)) === f(a)', () => {
    const a = 5;
    const f = x => ST.put(x * 2).chain(_ => ST.get);
    const left = ST.runState(0, ST.of(a).chain(f));
    const right = ST.runState(0, f(a));
    assertEquals(left.value, right.value);
});

test('Right identity: chain(of, m) === m', () => {
    const m = ST.get.chain(s => ST.put(s + 1)).chain(_ => ST.get);
    const left = ST.runState(0, m.chain(ST.of));
    const right = ST.runState(0, m);
    assertEquals(left.value, right.value);
});

test('Associativity', () => {
    const m = ST.get;
    const f = x => ST.put(x + 1).chain(_ => ST.get);
    const g = x => ST.put(x * 2).chain(_ => ST.get);
    const left = ST.runState(0, m.chain(f).chain(g));
    const right = ST.runState(0, m.chain(x => f(x).chain(g)));
    assertEquals(left.value, right.value);
});

/* ═══════════════════════════════════════════════════
   스택 안전
   ═══════════════════════════════════════════════════ */
logSection('StateT - Stack Safety');

test('10000+ get/put chain is stack-safe', () => {
    const n = 10000;
    let program = ST.get;
    for (let i = 0; i < n; i++) {
        program = program.chain(s => ST.put(s + 1)).chain(_ => ST.get);
    }
    const result = ST.runState(0, program);
    assertEquals(result.value, [n, n]);
});

/* ═══════════════════════════════════════════════════
   에러 처리
   ═══════════════════════════════════════════════════ */
logSection('StateT - Error Handling');

test('lift short-circuit: Nothing stops subsequent operations', () => {
    const STM = StateT('maybe');
    const program = STM.put(10)
        .chain(_ => STM.lift(Maybe.Nothing()))
        .chain(_ => STM.put(999))
        .chain(_ => STM.get);
    const result = STM.runState(0, program);
    assert(Maybe.isNothing(result), 'Nothing should short-circuit');
});

test('Unknown functor throws descriptive error', () => {
    const foreignFunctor = {
        [Symbol.for('fun-fp-js/Functor')]: true,
        map: f => foreignFunctor
    };
    const foreignProgram = Free.liftF(foreignFunctor);
    const st = new (StateT(Identity))(foreignProgram);
    assertThrows(
        () => ST.runState(0, st),
        'Unknown functor should throw'
    );
});

/* ═══════════════════════════════════════════════════
   입력 검증
   ═══════════════════════════════════════════════════ */
logSection('StateT - Input Validation');

test('normalizeMonad: missing of throws TypeError', () => {
    assertThrows(
        () => StateT({ map: () => {}, chain: () => {} }),
        'Missing of should throw'
    );
});

test('normalizeMonad: missing chain throws TypeError', () => {
    assertThrows(
        () => StateT({ of: () => {}, map: () => {} }),
        'Missing chain should throw'
    );
});

test('normalizeMonad: missing map throws TypeError', () => {
    assertThrows(
        () => StateT({ of: () => {}, chain: () => {} }),
        'Missing map should throw'
    );
});

test('runState: non-ST instance throws TypeError', () => {
    assertThrows(
        () => ST.runState(0, 42),
        'Non-ST should throw'
    );
    assertThrows(
        () => ST.runState(0, { _program: Free.pure(1), _typeName: 'fake' }),
        'Structural match but wrong instance should throw'
    );
});

test('runState: different StateT(X) instance throws TypeError', () => {
    const STM = StateT('maybe');
    const maybeProgram = STM.of(1);
    assertThrows(
        () => ST.runState(0, maybeProgram),
        'Different StateT instance should throw'
    );
});

/* ═══════════════════════════════════════════════════
   인프라
   ═══════════════════════════════════════════════════ */
logSection('StateT - Infrastructure');

test('Caching: same M returns same ST', () => {
    const a = StateT(Identity);
    const b = StateT(Identity);
    assert(a === b, 'Same M reference should return cached ST');
});

test('Caching: same string alias returns same ST', () => {
    const a = StateT('maybe');
    const b = StateT('maybe');
    assert(a === b, 'Same string alias should return cached ST');
});

test('Alias uniqueness: type-less custom monads get unique aliases', () => {
    const M1 = { of: x => ({ v: x }), map: (f, a) => ({ v: f(a.v) }), chain: (f, a) => f(a.v) };
    const M2 = { of: x => ({ v: x }), map: (f, a) => ({ v: f(a.v) }), chain: (f, a) => f(a.v) };
    const ST1 = StateT(M1);
    const ST2 = StateT(M2);
    assert(ST1 !== ST2, 'Different M objects should produce different STs');
    // ST1과 ST2의 alias가 달라야 함
    const r1 = ST1.runState(0, ST1.of(1));
    const r2 = ST2.runState(0, ST2.of(2));
    assertEquals(r1.v, [1, 0]);
    assertEquals(r2.v, [2, 0]);
    // ST1 인스턴스를 ST2의 runState에 넣으면 TypeError
    assertThrows(
        () => ST2.runState(0, ST1.of(1)),
        'Cross-ST instance should be rejected'
    );
});

test('Type class nominal typing: map rejects non-ST instance', () => {
    const alias = 'statet(identity)';
    const fake = { _program: Free.pure(1), _typeName: 'StateT(Identity)' };
    assertThrows(
        () => Functor.of(alias).map(x => x, fake),
        'Fake structural match should be rejected by map'
    );
});

test('Type class nominal typing: chain rejects non-ST instance', () => {
    const alias = 'statet(identity)';
    const fake = { _program: Free.pure(1), _typeName: 'StateT(Identity)' };
    assertThrows(
        () => Chain.of(alias).chain(x => ST.of(x), fake),
        'Fake structural match should be rejected by chain'
    );
});

test('Registry: generic keys not polluted', () => {
    // StateT 생성 후에도 기존 generic 키가 보존되어야 함
    StateT(Identity); // 등록 트리거
    const maybeFunctor = Functor.of('maybe');
    assert(maybeFunctor != null, 'Functor.of(maybe) should still work');
    assert(maybeFunctor.type === 'Maybe', 'Maybe Functor type should be preserved');

    const freeChain = Chain.of('free');
    assert(freeChain != null, 'Chain.of(free) should still work');
    assert(freeChain.type === 'Free', 'Free Chain type should be preserved');
});

console.log('\n✅ StateT tests completed\n');
