// Task Operations Tests
import fp from '../index.js';
import { test, assertEquals, testAsync, logSection } from './utils.js';

const { Task, Either } = fp;

logSection('Task Operations');

// === Constructors ===
test('Task.of creates resolved Task', () => {
    Task.of(5).fork(
        e => { throw new Error(`Unexpected rejection: ${e}`); },
        v => assertEquals(v, 5)
    );
});

test('Task.rejected creates rejected Task', () => {
    Task.rejected('error').fork(
        e => assertEquals(e, 'error'),
        v => { throw new Error(`Unexpected resolve: ${v}`); }
    );
});

// === Type checks ===
test('Task.isTask', () => {
    assertEquals(Task.isTask(Task.of(5)), true);
    assertEquals(Task.isTask(Task.rejected('error')), true);
    assertEquals(Task.isTask(5), false);
    assertEquals(Task.isTask(Promise.resolve(5)), false);
});

// === fold ===
test('Task.fold - Resolved Task', () => {
    let result;
    Task.fold(
        e => { result = `error: ${e}`; },
        v => { result = `success: ${v}`; },
        Task.of(42)
    );
    assertEquals(result, 'success: 42');
});

test('Task.fold - Rejected Task', () => {
    let result;
    Task.fold(
        e => { result = `error: ${e}`; },
        v => { result = `success: ${v}`; },
        Task.rejected('oops')
    );
    assertEquals(result, 'error: oops');
});

// === fromPromise ===
test('Task.fromPromise - Resolved promise', () => {
    const fetchData = Task.fromPromise(() => Promise.resolve(42));
    fetchData().fork(
        e => { throw new Error(`Unexpected rejection: ${e}`); },
        v => assertEquals(v, 42)
    );
});

test('Task.fromPromise - Rejected promise', () => {
    const fetchData = Task.fromPromise(() => Promise.reject('network error'));
    fetchData().fork(
        e => assertEquals(e, 'network error'),
        v => { throw new Error(`Unexpected resolve: ${v}`); }
    );
});

test('Task.fromPromise - With arguments', () => {
    const add = Task.fromPromise((a, b) => Promise.resolve(a + b));
    add(3, 4).fork(
        e => { throw new Error(`Unexpected rejection: ${e}`); },
        v => assertEquals(v, 7)
    );
});

// === fromEither ===
test('Task.fromEither - Right becomes resolved Task', () => {
    Task.fromEither(Either.Right(42)).fork(
        e => { throw new Error(`Unexpected rejection: ${e}`); },
        v => assertEquals(v, 42)
    );
});

test('Task.fromEither - Left becomes rejected Task', () => {
    Task.fromEither(Either.Left('error')).fork(
        e => assertEquals(e, 'error'),
        v => { throw new Error(`Unexpected resolve: ${v}`); }
    );
});

// === all ===
test('Task.all - All resolve', () => {
    const tasks = [Task.of(1), Task.of(2), Task.of(3)];
    Task.all(tasks).fork(
        e => { throw new Error(`Unexpected rejection: ${e}`); },
        v => assertEquals(v, [1, 2, 3])
    );
});

test('Task.all - Empty array', () => {
    Task.all([]).fork(
        e => { throw new Error(`Unexpected rejection: ${e}`); },
        v => assertEquals(v, [])
    );
});

test('Task.all - One rejects', () => {
    const tasks = [Task.of(1), Task.rejected('error'), Task.of(3)];
    Task.all(tasks).fork(
        e => assertEquals(e, 'error'),
        v => { throw new Error(`Unexpected resolve: ${JSON.stringify(v)}`); }
    );
});

test('Task.all - Preserves order', () => {
    const tasks = [Task.of('a'), Task.of('b'), Task.of('c')];
    Task.all(tasks).fork(
        e => { throw new Error(`Unexpected rejection: ${e}`); },
        v => assertEquals(v, ['a', 'b', 'c'])
    );
});

// === race ===
test('Task.race - First to resolve wins', () => {
    // Note: In synchronous Tasks, the first one always wins
    const tasks = [Task.of(1), Task.of(2)];
    Task.race(tasks).fork(
        e => { throw new Error(`Unexpected rejection: ${e}`); },
        v => assertEquals(v, 1)
    );
});

test('Task.race - First to reject wins', () => {
    const tasks = [Task.rejected('error1'), Task.rejected('error2')];
    Task.race(tasks).fork(
        e => assertEquals(e, 'error1'),
        v => { throw new Error(`Unexpected resolve: ${v}`); }
    );
});

test('Task.race - Empty array rejects', () => {
    Task.race([]).fork(
        e => assertEquals(e.message, 'race: empty task list'),
        v => { throw new Error(`Unexpected resolve: ${v}`); }
    );
});

// === Lazy execution ===
test('Task is lazy - Does not execute until forked', () => {
    let executed = false;
    const task = new Task((reject, resolve) => {
        executed = true;
        resolve(42);
    });

    assertEquals(executed, false);

    task.fork(_ => { }, v => {
        assertEquals(v, 42);
    });

    assertEquals(executed, true);
});

test('Task can be forked multiple times', () => {
    let count = 0;
    const task = new Task((reject, resolve) => {
        count++;
        resolve(count);
    });

    let results = [];
    task.fork(_ => { }, v => { results.push(v); });
    task.fork(_ => { }, v => { results.push(v); });
    task.fork(_ => { }, v => { results.push(v); });

    assertEquals(results, [1, 2, 3]);
});

console.log('\n✅ Task tests completed');
