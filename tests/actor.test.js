// Actor tests
import fp from '../index.js';
import { test, testAsync, assertEquals, assert, assertThrows, logSection } from './utils.js';

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
    const it = api.interpreter({ inc: n => Promise.resolve(n + 1) });
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
