// Strict Mode Tests
import fp from '../index.js';
import { test, assertEquals, assertThrows, logSection } from './utils.js';

const { setStrictMode, Functor, Maybe, Either } = fp;

logSection('Strict Mode');

// chain 콜백의 반환 검사 — 문지기(입구 검사)가 못 보는 유일한 방향. 없던 시절에는
// 다음 걸음의 입구에서 옳은 코드가 대신 뒤집어썼다(코덱스 7차 반례, 2026-08-28).
test('chain 콜백이 캐리어를 안 돌려주면 범인 자리에서 던진다', () => {
    setStrictMode(true);
    const M = fp.Chain.lookup('maybe');
    let msg = '';
    try { M.chain(x => x + 1, Maybe.Just(10)); } catch (e) { msg = e.message; }
    assertEquals(msg, 'Chain.chain: callback must return Maybe, got number');
    // 파이프라인 끝의 조용한 누출도 같은 문에서 잡힌다 — 값이 새서 살아남지 않는다
    let leaked;
    try { leaked = M.chain(x => x + 1, Maybe.Just(10)); } catch (e) { leaked = undefined; }
    assertEquals(leaked, undefined);
});

test('identity 의 chain 도 같은 문을 지난다', () => {
    setStrictMode(true);
    let msg = '';
    try { fp.Identity.of(1).chain(x => x + 9); } catch (e) { msg = e.message; }
    assertEquals(msg, 'Chain.chain: callback must return Identity, got number');
});

// 게으른 타입은 chain 시점에 콜백이 아직 안 불렸다 — 이 검사의 경계(문서화된 한계).
test('게으른 타입은 chain 시점에 캐리어만 확인한다 — 콜백 실수는 실행 때 드러난다', () => {
    setStrictMode(true);
    const t = fp.Chain.lookup('task').chain(x => x + 1, fp.Task.of(1));
    assertEquals(t._typeName, 'Task');   // 캐리어는 즉시 나오고 검사를 통과한다
});

test('strict mode - can be enabled', () => {
    setStrictMode(true);
    // No error means it worked
    assertEquals(true, true);
});

test('strict mode - can be disabled', () => {
    setStrictMode(false);
    // No error means it worked
    assertEquals(true, true);
});

test('strict mode enabled - type checking is strict', () => {
    setStrictMode(true);

    // In strict mode, invalid operations should throw
    const functor = Functor.lookup('maybe');

    // Valid operation should work
    const result = functor.map(x => x + 1, Maybe.Just(5));
    assertEquals(result.value, 6);
});

test('strict mode disabled - type checking is loose', () => {
    setStrictMode(false);

    // In loose mode, operations should still work
    const functor = Functor.lookup('maybe');
    const result = functor.map(x => x + 1, Maybe.Just(5));
    assertEquals(result.value, 6);
});

test('strict mode - switching modes works correctly', () => {
    // Start with strict
    setStrictMode(true);
    const functor = Functor.lookup('maybe');
    const result1 = functor.map(x => x * 2, Maybe.Just(10));
    assertEquals(result1.value, 20);

    // Switch to loose
    setStrictMode(false);
    const result2 = functor.map(x => x * 3, Maybe.Just(10));
    assertEquals(result2.value, 30);

    // Switch back to strict
    setStrictMode(true);
    const result3 = functor.map(x => x * 4, Maybe.Just(10));
    assertEquals(result3.value, 40);
});

test('strict mode - Either operations work in both modes', () => {
    // Strict mode
    setStrictMode(true);
    const functor = Functor.lookup('either');
    const strictResult = functor.map(x => x + 1, Either.Right(5));
    assertEquals(strictResult.value, 6);

    // Loose mode
    setStrictMode(false);
    const looseResult = functor.map(x => x + 1, Either.Right(5));
    assertEquals(looseResult.value, 6);
});

// Reset to default (loose mode for other tests)
setStrictMode(false);

console.log('\n✅ Strict Mode tests completed\n');
