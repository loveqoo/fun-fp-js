// Actor tests
import fp from '../index.js';
import { test, testAsync, assertEquals, assert, assertThrows, logSection } from './utils.js';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const { Actor, Task, Free } = fp;

/* ═══════════════════════════════════════════════════
   기본 동작
   ═══════════════════════════════════════════════════ */
logSection('Actor - Basic Operations');

testAsync('send returns Task with result', async () => {
    const actor = Actor({
        init: 0,
        handle: (state, msg) => [msg * 2, state]
    });
    const result = await new Promise((resolve, reject) => {
        actor.send(5).fork(reject, resolve);
    });
    assertEquals(result, 10);
});

testAsync('handle updates state', async () => {
    const actor = Actor({
        init: 0,
        handle: (state, msg) => [state + msg, state + msg]
    });
    await new Promise((resolve, reject) => actor.send(1).fork(reject, resolve));
    await new Promise((resolve, reject) => actor.send(2).fork(reject, resolve));
    await new Promise((resolve, reject) => actor.send(3).fork(reject, resolve));
    assertEquals(actor.getState(), 6);
});

testAsync('getState reflects current state', async () => {
    const actor = Actor({
        init: 0,
        handle: (state, msg) => ['ok', msg]
    });
    assertEquals(actor.getState(), 0);
    await new Promise((resolve, reject) => actor.send(42).fork(reject, resolve));
    assertEquals(actor.getState(), 42);
});

/* ═══════════════════════════════════════════════════
   비동기 handle (Task 반환)
   ═══════════════════════════════════════════════════ */
logSection('Actor - Async Handle');

testAsync('handle returning Task works', async () => {
    const actor = Actor({
        init: 0,
        handle: (state, msg) => new Task((_, resolve) => {
            setTimeout(() => resolve([msg * 2, state + msg]), 10);
        })
    });
    const result = await new Promise((resolve, reject) => {
        actor.send(5).fork(reject, resolve);
    });
    assertEquals(result, 10);
    assertEquals(actor.getState(), 5);
});

testAsync('async handle serializes correctly', async () => {
    const order = [];
    const actor = Actor({
        init: 0,
        handle: (state, msg) => new Task((_, resolve) => {
            setTimeout(() => {
                order.push(msg);
                resolve([state + msg, state + msg]);
            }, 5);
        })
    });
    const results = await Promise.all([
        new Promise((resolve, reject) => actor.send(1).fork(reject, resolve)),
        new Promise((resolve, reject) => actor.send(2).fork(reject, resolve)),
        new Promise((resolve, reject) => actor.send(3).fork(reject, resolve)),
    ]);
    assertEquals(results, [1, 3, 6]);
    assertEquals(order, [1, 2, 3]);
});

testAsync('async handle error rejects Task', async () => {
    const actor = Actor({
        init: 0,
        handle: (state, msg) => new Task((reject, _) => {
            setTimeout(() => reject('async-error'), 5);
        })
    });
    let caught = null;
    await new Promise((resolve) => {
        actor.send('x').fork(err => { caught = err; resolve(); }, resolve);
    });
    assertEquals(caught, 'async-error');
    assertEquals(actor.getState(), 0);
});

testAsync('async handle error does not block next message', async () => {
    const actor = Actor({
        init: 0,
        handle: (state, msg) => msg === 'bad'
            ? new Task((reject) => setTimeout(() => reject('fail'), 5))
            : new Task((_, resolve) => setTimeout(() => resolve(['ok', msg]), 5))
    });
    await new Promise((resolve) => actor.send('bad').fork(_ => resolve(), resolve));
    const result = await new Promise((resolve, reject) => actor.send(42).fork(reject, resolve));
    assertEquals(result, 'ok');
    assertEquals(actor.getState(), 42);
});

/* ═══════════════════════════════════════════════════
   순차 처리 (경합 방지)
   ═══════════════════════════════════════════════════ */
logSection('Actor - Sequential Processing');

testAsync('concurrent sends are serialized', async () => {
    const order = [];
    const actor = Actor({
        init: 0,
        handle: (state, msg) => {
            order.push(msg);
            return [state + msg, state + msg];
        }
    });
    const results = await Promise.all([
        new Promise((resolve, reject) => actor.send(1).fork(reject, resolve)),
        new Promise((resolve, reject) => actor.send(2).fork(reject, resolve)),
        new Promise((resolve, reject) => actor.send(3).fork(reject, resolve)),
    ]);
    assertEquals(results, [1, 3, 6]);
    assertEquals(order, [1, 2, 3]);
    assertEquals(actor.getState(), 6);
});

/* ═══════════════════════════════════════════════════
   subscribe / unsubscribe
   ═══════════════════════════════════════════════════ */
logSection('Actor - Subscribe');

testAsync('subscribe receives (result, state) notifications', async () => {
    const actor = Actor({
        init: 0,
        handle: (state, msg) => ['ok', msg]
    });
    const events = [];
    actor.subscribe((result, state) => events.push({ result, state }));
    await new Promise((resolve, reject) => actor.send(10).fork(reject, resolve));
    await new Promise((resolve, reject) => actor.send(20).fork(reject, resolve));
    assertEquals(events.length, 2);
    assertEquals(events[0], { result: 'ok', state: 10 });
    assertEquals(events[1], { result: 'ok', state: 20 });
});

testAsync('unsubscribe via returned function', async () => {
    const actor = Actor({
        init: 0,
        handle: (state, msg) => [msg, state]
    });
    const events = [];
    const unsub = actor.subscribe((result) => events.push(result));
    await new Promise((resolve, reject) => actor.send(1).fork(reject, resolve));
    unsub();
    await new Promise((resolve, reject) => actor.send(2).fork(reject, resolve));
    assertEquals(events.length, 1);
    assertEquals(events[0], 1);
});

/* ═══════════════════════════════════════════════════
   에러 처리
   ═══════════════════════════════════════════════════ */
logSection('Actor - Error Handling');

testAsync('handle error rejects the Task', async () => {
    const actor = Actor({
        init: 0,
        handle: (state, msg) => { throw new Error('boom'); }
    });
    let caught = null;
    await new Promise((resolve) => {
        actor.send('x').fork(err => { caught = err; resolve(); }, resolve);
    });
    assert(caught instanceof Error, 'should be Error');
    assertEquals(caught.message, 'boom');
});

testAsync('error does not corrupt state, next message processes normally', async () => {
    const actor = Actor({
        init: 0,
        handle: (state, msg) => {
            if (msg === 'bad') throw new Error('fail');
            return ['ok', msg];
        }
    });
    await new Promise((resolve) => {
        actor.send('bad').fork(_ => resolve(), resolve);
    });
    assertEquals(actor.getState(), 0);
    const result = await new Promise((resolve, reject) => {
        actor.send(42).fork(reject, resolve);
    });
    assertEquals(result, 'ok');
    assertEquals(actor.getState(), 42);
});

/* ═══════════════════════════════════════════════════
   입력 검증
   ═══════════════════════════════════════════════════ */
logSection('Actor - Input Validation');

test('handle must be a function', () => {
    assertThrows(() => Actor({ init: 0, handle: 42 }), 'should throw');
});

test('subscribe argument must be a function', () => {
    const actor = Actor({ init: 0, handle: (s, m) => [m, s] });
    assertThrows(() => actor.subscribe(42), 'should throw');
});

// 비동기 handler 경로에서 구독자가 던져도 actor 는 멈추지 않는다(코덱스 2차 ①).
testAsync('subscribe - 비동기 처리 중 구독자 예외가 진행을 막지 않는다', async () => {
    const seen = [];
    const actor = fp.Actor({ init: 0, handle: (s, m) => new fp.Task((_, ok) => setTimeout(() => ok([m, s + 1]), 0)) });
    actor.subscribe(() => seen.push('first'));
    actor.subscribe(() => { throw new Error('subscriber-boom'); });
    actor.subscribe(() => seen.push('third'));
    const r1 = await new Promise((res, rej) => actor.send('one').fork(rej, res));
    assertEquals(r1, 'one');                       // 던지는 구독자에도 첫 send 는 정착한다
    assertEquals(seen.includes('third'), true);    // 던지는 구독자 뒤도 통지된다
    const r2 = await new Promise((res, rej) => actor.send('two').fork(rej, res));
    assertEquals(r2, 'two');                        // 큐가 고착되지 않아 다음 메시지도 처리된다
});

console.log('\n✅ Actor tests completed\n');

/* ═══════════════════════════════════════════════════
   4차 감사 회귀 — .dev/review/260817-codex-index-audit-4.md
   ═══════════════════════════════════════════════════ */
logSection('Actor - 4차 감사 회귀');

testAsync('4차-5: 구독자가 재진입해도 통지의 result 와 state 는 같은 메시지를 가리킨다', async () => {
    const events = [];
    const actor = Actor({ init: 0, handle: (s, m) => [m, s + 1] });
    actor.subscribe((r, s) => { events.push(['A', r, s]); if (r === 'one') actor.send('two').fork(() => {}, () => {}); });
    actor.subscribe((r, s) => events.push(['B', r, s]));
    await new Promise((resolve, reject) => actor.send('one').fork(reject, resolve));
    await new Promise(res => setTimeout(res, 10));
    assertEquals(events.find(e => e[0] === 'B' && e[1] === 'one'), ['B', 'one', 1]);
});

testAsync('4차-6: 비동기 handle 이 쌍이 아닌 값을 내면 라벨 있는 거부, 큐는 계속 돈다', async () => {
    const actor = Actor({ init: 0, handle: () => new Task((_, resolve) => setTimeout(() => resolve(123), 0)) });
    const settle = t => new Promise(res => {
        t.fork(e => res(['reject', String(e.message || e)]), v => res(['resolve', v]));
        setTimeout(() => res(['pending', null]), 100);
    });
    const first = await settle(actor.send('one'));
    const second = await settle(actor.send('two'));
    assertEquals(first[0], 'reject');
    assert(first[1].indexOf('[result, newState]') >= 0, '라벨 있는 문안이어야 한다: ' + first[1]);
    assertEquals(second[0], 'reject');
    assertEquals(actor.getState(), 0);
});

testAsync('5차 후속: handle 이 Promise 를 돌려줘도 된다 (해석기 핸들러와 같은 관용도)', async () => {
    const actor = Actor({ init: 0, handle: (state, n) => Promise.resolve([n * 2, state + n]) });
    const first = await new Promise((res, rej) => actor.send(3).fork(rej, res));
    assertEquals(first, 6);
    assertEquals(actor.getState(), 3);
});

testAsync('5차 후속: Promise 거부는 그대로 거부로 도착하고 큐는 계속 돈다', async () => {
    const actor = Actor({ init: 0, handle: (state, n) => n === 1
        ? Promise.reject(new Error('첫 메시지 실패'))
        : Promise.resolve([n, state + n]) });
    const e = await new Promise(res => actor.send(1).fork(res, () => res(null)));
    assertEquals(e.message, '첫 메시지 실패');
    const ok = await new Promise((res, rej) => actor.send(2).fork(rej, res));
    assertEquals(ok, 2);
    assertEquals(actor.getState(), 2);
});

testAsync('5차 후속: Free.api.run 의 Promise 를 그대로 넘길 수 있다 (조합)', async () => {
    const api = Free.api('inc');
    const it = Free.interpreter(api, { inc: n => Promise.resolve(n + 1) });
    const actor = Actor({ init: 0, handle: (state, n) => it.run(api.inc(n)).then(v => [v, state + v]) });
    const v = await new Promise((res, rej) => actor.send(1).fork(rej, res));
    assertEquals(v, 2);
    assertEquals(actor.getState(), 2);
});

testAsync('5차 후속: Promise 가 쌍이 아닌 값을 내면 라벨 거부 (동기 경로와 같은 문안)', async () => {
    const actor = Actor({ init: 0, handle: () => Promise.resolve(123) });
    const e = await new Promise(res => actor.send(1).fork(res, () => res(null)));
    assertEquals(e.message, 'Actor: handle must produce a [result, newState] pair');
});

// 6차 감사 [11] — 구독자 배열을 순회하면서 직접 줄여, 해지 뒤의 구독자가 통째로 건너뛰어졌다.
testAsync('6차-11: 구독자가 통지 중 자기를 해지해도 다음 구독자가 받는다', async () => {
    const seen = [];
    const actor = Actor({ init: 0, handle: (s, m) => [m, s + 1] });
    let off;
    off = actor.subscribe(r => { seen.push('A:' + r); off(); });
    actor.subscribe(r => seen.push('B:' + r));
    await new Promise((res, rej) => actor.send('x').fork(rej, res));
    assertEquals(seen, ['A:x', 'B:x']);
    await new Promise((res, rej) => actor.send('y').fork(rej, res));
    assertEquals(seen, ['A:x', 'B:x', 'B:y']);   // A 는 해지됐으니 다음 통지엔 없다
});

testAsync('6차-11: 남을 해지하면 그 통지부터 즉시 빠진다', async () => {
    const seen = [];
    const actor = Actor({ init: 0, handle: (s, m) => [m, s + 1] });
    let offB;
    actor.subscribe(r => { seen.push('A:' + r); offB(); });
    offB = actor.subscribe(r => seen.push('B:' + r));
    await new Promise((res, rej) => actor.send('x').fork(rej, res));
    assertEquals(seen, ['A:x']);   // B 는 이번 통지에서 이미 빠졌다
});

// 6차 감사 [2] — 알림이 메시지 순서를 안 따랐다. 첫 메시지를 미정착으로 붙잡고 둘째를 동기로
// 처리하면 구독자가 `둘째 → 첫째` 로 받았다(상태는 FIFO 였다). 소유자 결정(2026-08-19):
// 순서 보장을 기본으로 하고, 옛 동작은 notifyInOrder: false 로 고를 수 있게 한다.
testAsync('6차-2: 알림이 메시지 순서를 따른다 (기본값)', async () => {
    const events = [];
    let release;
    const actor = Actor({
        init: 0,
        handle: (s, m) => m === 'one' ? new Promise(r => { release = () => r([m, s + 1]); }) : [m, s + 1],
    });
    actor.subscribe((r, st) => events.push([r, st]));
    const p1 = new Promise((res, rej) => actor.send('one').fork(rej, res));
    const p2 = new Promise((res, rej) => actor.send('two').fork(rej, res));
    release();
    await Promise.all([p1, p2]);
    assertEquals(events, [['one', 1], ['two', 2]]);
    assertEquals(actor.getState(), 2);
});

testAsync('6차-2: notifyInOrder:false 는 옛 동작(진행 먼저, 알림 나중)이다', async () => {
    const events = [];
    let release;
    const actor = Actor({
        init: 0,
        notifyInOrder: false,
        handle: (s, m) => m === 'one' ? new Promise(r => { release = () => r([m, s + 1]); }) : [m, s + 1],
    });
    actor.subscribe(r => events.push(r));
    const p1 = new Promise((res, rej) => actor.send('one').fork(rej, res));
    const p2 = new Promise((res, rej) => actor.send('two').fork(rej, res));
    release();
    await Promise.all([p1, p2]);
    assertEquals(events, ['two', 'one']);
});

testAsync('6차-2: 순서 보장이 통지 예외로 큐를 멈추지 않는다', async () => {
    const actor = Actor({ init: 0, handle: (s, m) => [m, s + 1] });
    actor.subscribe(() => { throw new Error('구독자 터짐'); });
    await new Promise((res, rej) => actor.send('m1').fork(rej, res));
    const second = await new Promise((res, rej) => actor.send('m2').fork(rej, res));
    assertEquals(second, 'm2');           // 큐가 살아 있다
    assertEquals(actor.getState(), 2);
});

// 6차 감사 곁가지 — 핸들러가 영영 정착 안 하면 큐가 영구히 막히고 뒤 메시지의 Task 도 안 온다
// (실측). 소유자 결정: 밀리초 타임아웃을 옵션으로. 기본은 없음(지금처럼 영영 기다림).
testAsync('타임아웃: 정착 안 하는 핸들러를 끝내고 큐를 진행시킨다', async () => {
    const actor = Actor({
        init: 0,
        timeout: 20,
        handle: (s, m) => m === 'stuck' ? new Promise(() => {}) : [m, s + 1],
    });
    const e = await new Promise(res => actor.send('stuck').fork(res, () => res(null)));
    assert(e !== null, '타임아웃이 거부로 안 왔다');
    assertEquals(e.message, 'Actor: handle timed out after 20ms');
    assertEquals(e.timedOut, true);
    const after = await new Promise((res, rej) => actor.send('go').fork(rej, res));
    assertEquals(after, 'go');            // 큐가 살아났다
    assertEquals(actor.getState(), 1);    // 막힌 메시지는 상태를 안 옮긴다
});

testAsync('타임아웃: 늦게 도착한 결과는 무시된다 (일회 정착)', async () => {
    const seen = [];
    const actor = Actor({
        init: 0,
        timeout: 20,
        handle: (s, m) => m === 'late' ? new Promise(r => setTimeout(() => r(['늦음', 99]), 60)) : [m, s + 1],
    });
    actor.subscribe(r => seen.push(r));
    await new Promise(res => actor.send('late').fork(res, () => res(null)));
    await new Promise((res, rej) => actor.send('next').fork(rej, res));
    await new Promise(r => setTimeout(r, 80));
    assertEquals(seen, ['next']);          // 늦게 온 '늦음' 이 통지되지 않았다
    assertEquals(actor.getState(), 1);     // 99 로 덮이지 않았다
});

// 소유자 결정(2026-08-19): 순차 진행의 기본 타임아웃은 1초다.
testAsync('타임아웃: 기본값은 1초다', async () => {
    const actor = Actor({ init: 0, handle: () => new Promise(() => {}) });
    const e = await new Promise(res => actor.send('stuck').fork(res, () => res(null)));
    assert(e !== null, '기본 타임아웃이 안 걸렸다');
    assertEquals(e.message, 'Actor: handle timed out after 1000ms');
    assertEquals(e.timedOut, true);
});

testAsync('타임아웃: 1초 안에 끝나는 핸들러는 그대로 통과한다', async () => {
    const actor = Actor({ init: 0, handle: (s, m) => new Promise(r => setTimeout(() => r([m, s + 1]), 40)) });
    assertEquals(await new Promise((res, rej) => actor.send('slow').fork(rej, res)), 'slow');
});

testAsync('타임아웃: Infinity 면 끄고 영영 기다린다 (옛 동작)', async () => {
    const actor = Actor({ init: 0, timeout: Infinity, handle: (s, m) => new Promise(r => setTimeout(() => r([m, s + 1]), 1200)) });
    assertEquals(await new Promise((res, rej) => actor.send('slow').fork(rej, res)), 'slow');
});

test('타임아웃: 숫자가 아니거나 양수가 아니면 만들 때 던진다', () => {
    assertThrows(() => Actor({ init: 0, handle: () => [1, 1], timeout: -1 }));
    assertThrows(() => Actor({ init: 0, handle: () => [1, 1], timeout: '20' }));
});

// GAS 에는 setTimeout 이 없다(1차 자료 확인, 2026-08-19). 그 환경에서는 마감 Task 를 만들 수
// 없으므로 **다음 경계에서** 만료시킨다 — Free.api 의 협조적 취소와 같은 의미론이다.
// hasTimer 는 모듈을 읽을 때 정해지므로, 자식 프로세스에서 지운 뒤 import 해야 그 경로가 돈다.
test('타임아웃: 타이머가 없는 환경(GAS)에서는 다음 경계에서 만료된다', () => {
    const indexUrl = pathToFileURL(join(dirname(dirname(fileURLToPath(import.meta.url))), 'index.js')).href;
    const source = `
        delete globalThis.setTimeout;
        const fp = (await import(${JSON.stringify(indexUrl)})).default;
        if (typeof setTimeout === 'function') throw new Error('setTimeout 이 안 지워졌다');
        const a = fp.Actor({ init: 0, timeout: 30, handle: (s, m) => m === 'stuck' ? new Promise(() => {}) : [m, s + 1] });
        let stuck = null;
        a.send('stuck').fork(e => { stuck = e.timedOut === true ? 'timedOut' : 'other'; }, () => { stuck = 'resolved'; });
        const start = Date.now();
        while (Date.now() - start < 50) {}          // 타이머가 없으니 바쁜 대기로 마감을 넘긴다
        const after = await new Promise(res => a.send('after').fork(() => res('rejected'), v => res(v)));
        console.log(JSON.stringify({ stuck, after, state: a.getState() }));
    `;
    const r = spawnSync(process.execPath, ['--input-type=module', '-e', source], { encoding: 'utf8' });
    assertEquals(r.status, 0, `자식 프로세스가 죽었다: ${r.stderr}`);
    assertEquals(JSON.parse(r.stdout.trim()), { stuck: 'timedOut', after: 'after', state: 1 });
});

// 타이머가 없으면 Task.race 가 없으므로 **일회 정착을 once 가 혼자 진다** — 경계에서 만료된 뒤
// 늦게 도착한 결과가 상태를 덮거나 구독자에게 통지되면 안 된다. 타이머 경로만 보면 race 가
// 가려 주기 때문에 이 표본이 없으면 once 를 걷어내도 게이트가 초록이다(실측으로 확인했다).
test('타임아웃: 타이머가 없을 때 늦게 도착한 결과는 버려진다', () => {
    const indexUrl = pathToFileURL(join(dirname(dirname(fileURLToPath(import.meta.url))), 'index.js')).href;
    const source = `
        delete globalThis.setTimeout;
        const fp = (await import(${JSON.stringify(indexUrl)})).default;
        let late;
        const seen = [];
        const a = fp.Actor({ init: 0, timeout: 30, handle: (s, m) => m === 'late'
            ? new Promise(r => { late = () => r(['늦음', 99]); })
            : [m, s + 1] });
        a.subscribe(r => seen.push(r));
        a.send('late').fork(() => seen.push('rejected'), () => seen.push('resolved'));
        const start = Date.now();
        while (Date.now() - start < 50) {}
        await new Promise(res => a.send('after').fork(() => res(), res));   // 경계 — 여기서 만료된다
        late();                                                            // 그 뒤에 도착
        await null; await null; await null;
        console.log(JSON.stringify({ seen, state: a.getState() }));
    `;
    const r = spawnSync(process.execPath, ['--input-type=module', '-e', source], { encoding: 'utf8' });
    assertEquals(r.status, 0, `자식 프로세스가 죽었다: ${r.stderr}`);
    assertEquals(JSON.parse(r.stdout.trim()), { seen: ['rejected', 'after'], state: 1 });
});
