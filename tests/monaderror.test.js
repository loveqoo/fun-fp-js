// MonadError — 실패를 일급으로. 법칙은 staticland-laws(동기)·task-async-laws(비동기)가
// 돌리고, 여기는 조회·동치·거부 문안·기존 문과의 관계를 고정한다.
import fp from '../index.js';
import { test, testAsync, assertEquals, assert, assertThrowsWith, logSection } from './utils.js';

const { MonadError, Task, Either } = fp;

logSection('MonadError');

test('lookup — task·either 두 인스턴스가 등록되어 있다', () => {
    assertEquals(MonadError.lookup('task').type, 'Task');
    assertEquals(MonadError.lookup('either').type, 'Either');
    assertThrowsWith(() => MonadError.lookup('maybe'), 'MonadError.lookup: unsupported key');
});

testAsync('동치 — Task 인스턴스는 기존 문(rejected·catchError)과 같은 몸이다', async () => {
    const ME = MonadError.lookup('task');
    const viaME = await new Promise(res => ME.handleError(e => Task.of('복구:' + e.message), ME.raiseError(new Error('X'))).fork(e => res(['err', e]), v => res(['ok', v])));
    const viaTask = await new Promise(res => Task.rejected(new Error('X')).catchError(e => Task.of('복구:' + e.message)).fork(e => res(['err', e]), v => res(['ok', v])));
    assertEquals(viaME, viaTask);
});

test('동치 — Either 인스턴스는 Left 분기와 같다', () => {
    const ME = MonadError.lookup('either');
    assertEquals(ME.handleError(e => Either.of('복구:' + e), Either.Left('X')).value, '복구:X');
    assertEquals(ME.handleError(e => Either.of('안 됨'), Either.of(7)).value, 7);
    assertEquals(ME.raiseError('e').isLeft(), true);
});

test('거부 문안 — Either 핸들러가 Either 아닌 것을 돌려주면 즉시 던진다', () => {
    const ME = MonadError.lookup('either');
    assertThrowsWith(() => ME.handleError(() => 42, Either.Left('X')),
        'MonadError.handleError: handler must return an Either');
});

testAsync('거부 문안 — Task 는 실행 시점에 기존 catchError 라벨로 거부한다 (계약: 시점·라벨이 타입마다 다름)', async () => {
    const ME = MonadError.lookup('task');
    const e = await new Promise(res => ME.handleError(() => 42, ME.raiseError(new Error('X'))).fork(res, () => res(null)));
    assertEquals(e.message, 'Task.catchError: handler must return a Task');
});

test('거부 문안 — handleError 의 인자 검증은 Chain 과 같은 모양이다 (함수 + 그 타입의 캐리어)', () => {
    assertThrowsWith(() => MonadError.lookup('either').handleError(42, Either.of(1)),
        'MonadError.handleError: arguments must be (function, Either)');
    // 캐리어 위조 — isLeft 흉내만 낸 객체는 통과하면 안 된다 (구현 리뷰 Major 3)
    assertThrowsWith(() => MonadError.lookup('either').handleError(() => Either.of(1), { isLeft: () => false, value: 9 }),
        'MonadError.handleError: arguments must be (function, Either)');
    assertThrowsWith(() => MonadError.lookup('task').handleError(() => fp.Task.of(1), { catchError: () => 42 }),
        'MonadError.handleError: arguments must be (function, Task)');
});

test('상속 — MonadError 는 Monad 다 (of·chain·map 이 그대로 있다)', () => {
    const ME = MonadError.lookup('either');
    assertEquals(ME.chain(x => Either.of(x + 1), ME.of(1)).value, 2);
    assertEquals(ME.map(x => x * 2, ME.of(3)).value, 6);
});
