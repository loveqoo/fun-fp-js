// Task 의 비동기 법칙 게이트 — staticland-laws 의 동기 관측(forkSync)이 못 보는 영역.
//
// 왜 별도 파일인가: 동기 순회 게이트의 관측기는 fork 직후 값을 읽어서, 비동기 Task 는
// 성공·실패·영구 미정착이 전부 ['(안 열림)'] 한 덩어리로 보인다(실측, 2026-08-18).
// 무음 정지 계열 결함 네 건이 전부 법칙 게이트 밖에서 잡힌 이유가 이것이다.
//
// 세 겹으로 본다:
//   ① 등식 — 비동기 표본에서 법칙의 양변이 같은 정착에 도달한다
//   ② 생존성 — 정상 표본의 합성은 반드시 정착한다(미정착이면 빨강). 등식만으로는
//     양변이 같이 미정착일 때 "같다"로 통과하므로 이 겹이 없으면 게이트가 공허하다.
//   ③ 일회 정착 — 두 번째 정착은 위반 목록에 쌓이고, 파일 끝 검사가 목록이 비었음을 단언한다.
//     (첫 정착이 Promise 를 이미 정착시킨 뒤라 관측값으로는 못 돌려준다 — 목록이 유일한 통로다.)
import fp from '../index.js';
import { testAsync, assertEquals, assert, logSection } from './utils.js';

const { Task, Functor, Apply, Applicative, Chain, Monad, MonadError, Alt } = fp;

logSection('Task 비동기 법칙');

// 관측기 — 정착까지 기다리고, 못 오면 미정착으로 구분하고, 이중 정착을 잡는다.
const TIMEOUT = 200;
const doubleSettles = [];
const awaitObserve = t => new Promise(res => {
    let settled = 0;
    const settle = tag => v => {
        settled++;
        if (settled > 1) { doubleSettles.push('이중정착:' + tag); return; }
        res([tag, tag === 'err' ? String(v && v.message || v) : v]);
    };
    t.fork(settle('err'), settle('ok'));
    setTimeout(() => { if (settled === 0) res(['(미정착)']); }, TIMEOUT);
});
const same = async (a, b, label) => {
    const [oa, ob] = [await awaitObserve(a), await awaitObserve(b)];
    assertEquals(oa, ob, label);
    assert(oa[0] === 'ok' || oa[0] === 'err', label + ' — 생존성: ' + JSON.stringify(oa));
    return oa;
};

// 비동기 표본 — 성공·실패, 지연 두 종
const ok = v => new Task((_, res) => setTimeout(() => res(v), 5));
const err = m => new Task(rej => setTimeout(() => rej(new Error(m)), 5));

testAsync('관측기 자기검사 — 성공·실패·미정착·이중 정착을 실제로 가른다', async () => {
    assertEquals(await awaitObserve(ok(1)), ['ok', 1]);
    assertEquals((await awaitObserve(err('X')))[0], 'err');
    assertEquals(await awaitObserve(new Task(() => {})), ['(미정착)']);
    // 정상 Task 는 fork 자체가 이중 정착을 막는다 — 관측기 분기는 가짜 fork 로만 시험 가능
    assertEquals(await awaitObserve({ fork: (_, res) => { res(1); res(2); } }), ['ok', 1]);
    assertEquals(doubleSettles, ['이중정착:ok'], '이중 정착이 목록에 잡혀야 한다');
    doubleSettles.length = 0;   // 자기검사분은 지운다 — 아래 법칙들의 실제 위반만 남긴다
});

testAsync('Functor — 항등·합성 (비동기 표본)', async () => {
    const F = Functor.lookup('task');
    await same(F.map(x => x, ok(7)), ok(7), 'map 항등');
    const f = x => x + 1, g = x => x * 2;
    await same(F.map(x => g(f(x)), ok(3)), F.map(g, F.map(f, ok(3))), 'map 합성');
    await same(F.map(f, err('실패 통과')), err('실패 통과'), 'map 은 실패를 통과시킨다');
});

testAsync('Apply·Applicative — 비동기 함수와 값이 둘 다 도착해야 한다', async () => {
    const A = Applicative.lookup('task');
    const obs = await same(A.ap(ok(x => x + 1), ok(41)), ok(42), 'ap: 비동기×비동기');
    assertEquals(obs, ['ok', 42]);
    await same(A.ap(A.of(x => x * 2), ok(21)), Functor.lookup('task').map(x => x * 2, ok(21)),
        'ap(of(f)) ≡ map(f)');
    await same(A.ap(err('fn 실패'), ok(1)), err('fn 실패'), 'ap: 함수 쪽 실패 전파');
    await same(A.ap(A.of(x => x), err('값 실패')), err('값 실패'), 'ap: 값 쪽 실패 전파');
});

testAsync('Chain·Monad — 결합·항등 (비동기 kleisli)', async () => {
    const M = Monad.lookup('task');
    const f = x => ok(x + 1), g = x => ok(x * 2);
    await same(M.chain(g, M.chain(f, ok(5))), M.chain(x => M.chain(g, f(x)), ok(5)), 'chain 결합');
    await same(M.chain(f, M.of(5)), f(5), '왼쪽 항등');
    await same(M.chain(M.of, ok(9)), ok(9), '오른쪽 항등');
    await same(M.chain(f, err('단락')), err('단락'), '실패는 사슬을 단락시킨다');
});

testAsync('Alt — 실패의 대안이 비동기에서도 성립한다', async () => {
    const A = Alt.lookup('task');
    await same(A.alt(err('앞이 실패'), ok(2)), ok(2), 'alt: 첫째가 실패하면 둘째로');
    await same(A.alt(ok(99), ok(1)), ok(99), 'alt: 첫째가 성공하면 둘째 무시');
});

testAsync('MonadError — 실패 경로 법칙 (비동기 표본)', async () => {
    const ME = MonadError.lookup('task');
    const boom = () => err('늦은 실패');
    await same(ME.handleError(e2 => ok('복구:' + e2.message), boom()), ok('복구:늦은 실패'), '잡으면 핸들러');
    await same(ME.handleError(() => ok('안 됨'), ok(1)), ok(1), '성공 불변');
    const refail = e2 => ME.raiseError(new Error('재실패:' + e2.message));
    const g = e2 => ok('바깥복구:' + e2.message);
    await same(ME.handleError(g, ME.handleError(refail, boom())),
               ok('바깥복구:재실패:늦은 실패'), '중첩/재실패');
    await same(ME.chain(x => ok(x + 1), boom()), boom(), '실패 단락');
});

testAsync('일회 정착 — 위 법칙들 어디서도 두 번 정착하지 않았다', async () => {
    await new Promise(r => setTimeout(r, 50));   // 뒤늦은 두 번째 정착까지 기다린다
    assertEquals(doubleSettles, [], '이중 정착 위반 목록');
});
