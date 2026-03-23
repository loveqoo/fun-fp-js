// EitherT Monad Transformer tests
import fp from '../index.js';
import { test, testAsync, assertEquals, assert, assertThrows, logSection } from './utils.js';

const { Free, EitherT, Either, Maybe, Task, Functor, Chain, Monad } = fp;

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
logSection('EitherT - Basic Operations');

const ET = EitherT(Identity);

test('ET.of returns ET wrapping Free.pure', () => {
    const program = ET.of(42);
    assert(Free.isPure(program._program), 'internal should be Free.pure');
    assertEquals(program._typeName, 'EitherT(Identity)');
});

test('ET.throwError returns ET wrapping ThrowF', () => {
    const program = ET.throwError('boom');
    assert(Free.isImpure(program._program), 'internal should be Free.impure');
});

test('ET.lift returns ET wrapping EitherLiftF', () => {
    const program = ET.lift(Identity.of(1));
    assert(Free.isImpure(program._program), 'internal should be Free.impure');
});

test('ET.fromEither converts Right to of', () => {
    const result = ET.runEitherT(ET.fromEither(Either.Right(42)));
    assertEquals(result.value, Either.Right(42));
});

test('ET.fromEither converts Left to throwError', () => {
    const result = ET.runEitherT(ET.fromEither(Either.Left('err')));
    assert(Either.isLeft(result.value), 'should be Left');
    assertEquals(result.value.value, 'err');
});

/* ═══════════════════════════════════════════════════
   runEitherT
   ═══════════════════════════════════════════════════ */
logSection('EitherT - Runners');

test('runEitherT: of returns M(Right(value))', () => {
    const result = ET.runEitherT(ET.of(42));
    assertEquals(result.value, Either.Right(42));
});

test('runEitherT: throwError returns M(Left(error))', () => {
    const result = ET.runEitherT(ET.throwError('fail'));
    assert(Either.isLeft(result.value), 'should be Left');
    assertEquals(result.value.value, 'fail');
});

test('runEitherT: chain composes Right values', () => {
    const program = ET.of(5)
        .chain(x => ET.of(x * 2))
        .chain(x => ET.of(x + 1));
    const result = ET.runEitherT(program);
    assertEquals(result.value, Either.Right(11));
});

test('runEitherT: throwError short-circuits chain', () => {
    const program = ET.of(5)
        .chain(_ => ET.throwError('stopped'))
        .chain(x => ET.of(x * 999));
    const result = ET.runEitherT(program);
    assert(Either.isLeft(result.value), 'should be Left');
    assertEquals(result.value.value, 'stopped');
});

test('catchError recovers from throwError', () => {
    const program = ET.throwError('oops');
    const recovered = ET.catchError(program, e => ET.of(`recovered: ${e}`));
    const result = ET.runEitherT(recovered);
    assertEquals(result.value, Either.Right('recovered: oops'));
});

test('catchError passes through Right', () => {
    const program = ET.of(42);
    const recovered = ET.catchError(program, e => ET.of(`recovered: ${e}`));
    const result = ET.runEitherT(recovered);
    assertEquals(result.value, Either.Right(42));
});

test('catchError can re-throw', () => {
    const program = ET.throwError('original');
    const recovered = ET.catchError(program, e => ET.throwError(`wrapped: ${e}`));
    const result = ET.runEitherT(recovered);
    assert(Either.isLeft(result.value), 'should be Left');
    assertEquals(result.value.value, 'wrapped: original');
});

/* ═══════════════════════════════════════════════════
   타입 클래스 통합
   ═══════════════════════════════════════════════════ */
logSection('EitherT - Type Class Integration');

test('Functor.of(alias).map works', () => {
    const alias = 'eithert(identity)';
    const mapped = Functor.of(alias).map(x => x * 2, ET.of(5));
    const result = ET.runEitherT(mapped);
    assertEquals(result.value, Either.Right(10));
});

test('Chain.of(alias).chain works', () => {
    const alias = 'eithert(identity)';
    const chained = Chain.of(alias).chain(x => ET.of(x + 1), ET.of(5));
    const result = ET.runEitherT(chained);
    assertEquals(result.value, Either.Right(6));
});

test('Monad.of(alias) exists', () => {
    const alias = 'eithert(identity)';
    const monad = Monad.of(alias);
    assert(monad != null, 'Monad instance should exist');
    assert(typeof monad.of === 'function', 'should have of');
    assert(typeof monad.chain === 'function', 'should have chain');
});

/* ═══════════════════════════════════════════════════
   내부 모나드 통합
   ═══════════════════════════════════════════════════ */
logSection('EitherT - Inner Monad Integration');

test('EitherT(maybe): lift Maybe.Just', () => {
    const ETM = EitherT('maybe');
    const program = ETM.lift(Maybe.Just(42))
        .chain(x => ETM.of(x + 1));
    const result = ETM.runEitherT(program);
    assert(Maybe.isJust(result), 'outer should be Just');
    assertEquals(result.value, Either.Right(43));
});

test('EitherT(maybe): lift Maybe.Nothing propagates', () => {
    const ETM = EitherT('maybe');
    const program = ETM.of(1)
        .chain(_ => ETM.lift(Maybe.Nothing()))
        .chain(x => ETM.of(x + 1));
    const result = ETM.runEitherT(program);
    assert(Maybe.isNothing(result), 'Nothing should propagate through M');
});

test('EitherT(maybe): throwError inside Maybe produces Just(Left)', () => {
    const ETM = EitherT('maybe');
    const program = ETM.throwError('err');
    const result = ETM.runEitherT(program);
    assert(Maybe.isJust(result), 'outer should be Just');
    assert(Either.isLeft(result.value), 'inner should be Left');
    assertEquals(result.value.value, 'err');
});

testAsync('EitherT(task): async with fork', async () => {
    const ETT = EitherT('task');
    const program = ETT.of(10)
        .chain(x => ETT.of(x * 2));
    const taskResult = ETT.runEitherT(program);
    const result = await new Promise((resolve, reject) => {
        taskResult.fork(reject, resolve);
    });
    assertEquals(result, Either.Right(20));
});

testAsync('EitherT(task): throwError in task', async () => {
    const ETT = EitherT('task');
    const program = ETT.throwError('async-err');
    const taskResult = ETT.runEitherT(program);
    const result = await new Promise((resolve, reject) => {
        taskResult.fork(reject, resolve);
    });
    assert(Either.isLeft(result), 'should be Left');
    assertEquals(result.value, 'async-err');
});

/* ═══════════════════════════════════════════════════
   Functor 법칙
   ═══════════════════════════════════════════════════ */
logSection('EitherT - Functor Laws');

test('Functor identity: map(id, m) === m', () => {
    const m = ET.of(42);
    const left = ET.runEitherT(m.map(x => x));
    const right = ET.runEitherT(m);
    assertEquals(left.value, right.value);
});

test('Functor composition: map(f∘g, m) === map(f, map(g, m))', () => {
    const m = ET.of(5);
    const f = x => x * 2;
    const g = x => x + 1;
    const left = ET.runEitherT(m.map(x => f(g(x))));
    const right = ET.runEitherT(m.map(g).map(f));
    assertEquals(left.value, right.value);
});

/* ═══════════════════════════════════════════════════
   Applicative 법칙
   ═══════════════════════════════════════════════════ */
logSection('EitherT - Applicative Laws');

test('Applicative identity: ap(of(id), v) === v', () => {
    const v = ET.of(42);
    const left = ET.runEitherT(ET.ap(ET.of(x => x), v));
    const right = ET.runEitherT(v);
    assertEquals(left.value, right.value);
});

test('Applicative homomorphism: ap(of(f), of(x)) === of(f(x))', () => {
    const f = x => x * 2;
    const left = ET.runEitherT(ET.ap(ET.of(f), ET.of(5)));
    const right = ET.runEitherT(ET.of(f(5)));
    assertEquals(left.value, right.value);
});

test('Applicative interchange: ap(u, of(y)) === ap(of(f => f(y)), u)', () => {
    const u = ET.of(x => x + 10);
    const y = 5;
    const left = ET.runEitherT(ET.ap(u, ET.of(y)));
    const right = ET.runEitherT(ET.ap(ET.of(f => f(y)), u));
    assertEquals(left.value, right.value);
});

/* ═══════════════════════════════════════════════════
   Transformer 법칙
   ═══════════════════════════════════════════════════ */
logSection('EitherT - Transformer Laws');

test('lift(M.of(a)) === T.of(a)', () => {
    const a = 42;
    const ETM = EitherT('maybe');
    const left = ETM.runEitherT(ETM.lift(Maybe.of(a)));
    const right = ETM.runEitherT(ETM.of(a));
    assertEquals(left.value, right.value);
});

test('lift(M.chain(f, m)) === T.chain(x => lift(f(x)), lift(m))', () => {
    const ETM = EitherT('maybe');
    const m = Maybe.Just(5);
    const f = x => Maybe.Just(x * 2);
    const left = ETM.runEitherT(ETM.lift(Maybe.chain(f, m)));
    const right = ETM.runEitherT(ETM.lift(m).chain(x => ETM.lift(f(x))));
    assertEquals(left.value, right.value);
});

/* ═══════════════════════════════════════════════════
   Chain 법칙 (Monad)
   ═══════════════════════════════════════════════════ */
logSection('EitherT - Chain Laws');

test('Left identity: chain(f, of(a)) === f(a)', () => {
    const a = 5;
    const f = x => ET.of(x * 2);
    const left = ET.runEitherT(ET.of(a).chain(f));
    const right = ET.runEitherT(f(a));
    assertEquals(left.value, right.value);
});

test('Right identity: chain(of, m) === m', () => {
    const m = ET.of(42);
    const left = ET.runEitherT(m.chain(ET.of));
    const right = ET.runEitherT(m);
    assertEquals(left.value, right.value);
});

test('Associativity', () => {
    const m = ET.of(5);
    const f = x => ET.of(x + 1);
    const g = x => ET.of(x * 2);
    const left = ET.runEitherT(m.chain(f).chain(g));
    const right = ET.runEitherT(m.chain(x => f(x).chain(g)));
    assertEquals(left.value, right.value);
});

/* ═══════════════════════════════════════════════════
   에러 처리
   ═══════════════════════════════════════════════════ */
logSection('EitherT - Error Handling');

test('throwError stops subsequent chain', () => {
    const program = ET.of(1)
        .chain(_ => ET.throwError('err'))
        .chain(_ => ET.of(999));
    const result = ET.runEitherT(program);
    assert(Either.isLeft(result.value), 'should be Left');
    assertEquals(result.value.value, 'err');
});

test('catchError followed by chain continues', () => {
    const program = ET.catchError(
        ET.throwError('err'),
        e => ET.of(0)
    ).chain(x => ET.of(x + 1));
    const result = ET.runEitherT(program);
    assertEquals(result.value, Either.Right(1));
});

/* ═══════════════════════════════════════════════════
   입력 검증
   ═══════════════════════════════════════════════════ */
logSection('EitherT - Input Validation');

test('runEitherT: non-ET instance throws TypeError', () => {
    assertThrows(
        () => ET.runEitherT(42),
        'Non-ET should throw'
    );
});

test('runEitherT: different EitherT(X) instance throws TypeError', () => {
    const ETM = EitherT('maybe');
    assertThrows(
        () => ET.runEitherT(ETM.of(1)),
        'Different EitherT instance should throw'
    );
});

test('chain callback returning non-ET throws TypeError', () => {
    assertThrows(
        () => ET.runEitherT(ET.of(1).chain(_ => 42)),
        'Non-ET return from chain callback should throw'
    );
});

test('catchError handler returning non-ET throws TypeError at runtime', () => {
    const program = ET.catchError(ET.throwError('x'), _ => 42);
    assertThrows(
        () => ET.runEitherT(program),
        'Non-ET return from handler should throw at runtime'
    );
});

test('catchError: non-ET first arg throws TypeError', () => {
    assertThrows(
        () => ET.catchError(42, e => ET.of(e)),
        'Non-ET should throw'
    );
});

test('Type class nominal typing: map rejects non-ET instance', () => {
    const alias = 'eithert(identity)';
    assertThrows(
        () => Functor.of(alias).map(x => x, { _program: Free.pure(1) }),
        'Fake should be rejected'
    );
});

/* ═══════════════════════════════════════════════════
   인프라
   ═══════════════════════════════════════════════════ */
logSection('EitherT - Infrastructure');

test('Caching: same M returns same ET', () => {
    const a = EitherT(Identity);
    const b = EitherT(Identity);
    assert(a === b, 'Same M should return cached ET');
});

test('Caching: same string alias returns same ET', () => {
    const a = EitherT('maybe');
    const b = EitherT('maybe');
    assert(a === b, 'Same string should return cached ET');
});

test('Registry: generic keys not polluted', () => {
    EitherT(Identity);
    assert(Functor.of('maybe').type === 'Maybe', 'Maybe Functor preserved');
    assert(Chain.of('free').type === 'Free', 'Free Chain preserved');
});

console.log('\n✅ EitherT tests completed\n');
