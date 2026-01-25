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

testAsync('Task.all - Does not resolve after rejection (race condition)', async () => {
    const delay = (ms, value) => new Task((_, resolve) => setTimeout(() => resolve(value), ms));
    const delayedReject = (ms, error) => new Task((reject) => setTimeout(() => reject(error), ms));

    // t1 resolves at 25ms, t2 rejects at 50ms, t3 resolves at 75ms
    const t1 = delay(25, 1);
    const t2 = delayedReject(50, 'error');
    const t3 = delay(75, 3);

    let callCount = 0;
    let rejectCalled = false;

    await new Promise(done => {
        Task.all([t1, t2, t3]).fork(
            e => { callCount++; rejectCalled = true; },
            v => { callCount++; }
        );

        setTimeout(() => {
            assertEquals(callCount, 1);
            assertEquals(rejectCalled, true);
            done();
        }, 150);
    });
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

test('Task.race - Single Task resolves', () => {
    Task.race(Task.of(42)).fork(
        e => { throw new Error(`Unexpected rejection: ${e}`); },
        v => assertEquals(v, 42)
    );
});

test('Task.race - Single Task rejects', () => {
    Task.race(Task.rejected('single error')).fork(
        e => assertEquals(e, 'single error'),
        v => { throw new Error(`Unexpected resolve: ${v}`); }
    );
});

test('Task.race - All tasks reject (first wins)', () => {
    const tasks = [
        Task.rejected('error1'),
        Task.rejected('error2'),
        Task.rejected('error3')
    ];
    Task.race(tasks).fork(
        e => assertEquals(e, 'error1'),
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

// === Task.lift ===
logSection('Task.lift');

test('Task.lift lifts binary function', () => {
    const add = (a, b) => a + b;
    const liftedAdd = Task.lift(add);

    const t1 = Task.of(10);
    const t2 = Task.of(32);

    liftedAdd(t1, t2).fork(
        e => { throw new Error(`Unexpected rejection: ${e}`); },
        v => assertEquals(v, 42)
    );
});

test('Task.lift lifts ternary function', () => {
    const sum3 = (a, b, c) => a + b + c;
    const liftedSum = Task.lift(sum3);

    const t1 = Task.of(10);
    const t2 = Task.of(20);
    const t3 = Task.of(12);

    liftedSum(t1, t2, t3).fork(
        e => { throw new Error(`Unexpected rejection: ${e}`); },
        v => assertEquals(v, 42)
    );
});

test('Task.lift with mixed resolved and rejected tasks', () => {
    const add = (a, b) => a + b;
    const liftedAdd = Task.lift(add);

    const t1 = Task.of(10);
    const t2 = Task.rejected('error');

    liftedAdd(t1, t2).fork(
        e => assertEquals(e, 'error'),
        v => { throw new Error(`Unexpected resolve: ${v}`); }
    );
});

test('Task.lift preserves laziness', () => {
    let executed = false;
    const add = (a, b) => {
        executed = true;
        return a + b;
    };
    const liftedAdd = Task.lift(add);

    const t1 = Task.of(5);
    const t2 = Task.of(3);

    const result = liftedAdd(t1, t2);
    assertEquals(executed, false); // Not executed yet

    result.fork(
        e => { throw new Error(`Unexpected rejection: ${e}`); },
        v => {
            assertEquals(executed, true);
            assertEquals(v, 8);
        }
    );
});

test('Task.lift catches exceptions and returns rejected Task', () => {
    const throwingFn = (a, b) => {
        throw new Error('computation error');
    };
    const liftedFn = Task.lift(throwingFn);

    const t1 = Task.of(5);
    const t2 = Task.of(3);

    liftedFn(t1, t2).fork(
        e => {
            assertEquals(e.message, 'computation error');
        },
        v => { throw new Error(`Unexpected resolve: ${v}`); }
    );
});

console.log('\n✅ Task tests completed');
