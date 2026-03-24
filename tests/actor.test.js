// Actor tests
import fp from '../index.js';
import { test, testAsync, assertEquals, assert, assertThrows, logSection } from './utils.js';

const { Actor, Task } = fp;

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

console.log('\n✅ Actor tests completed\n');
