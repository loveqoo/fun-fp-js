const {
    Task, TaskFunctor, TaskApply, TaskApplicative, TaskChain, TaskMonad
} = require('../../static_modules/impl.js');

const test = (name, fn) => {
    try { fn(); console.log(`✅ [PASS] ${name}`); }
    catch (e) { console.log(`❌ [FAIL] ${name}\n   Error: ${e.message}`); }
};
const assert = (cond, msg) => { if (!cond) throw new Error(msg || 'Assertion failed'); };

console.log('🚀 Starting Task tests...\n');

console.log('📦 Task Basics...');
test('Task.of - creates a resolved task', done => {
    let result;
    Task.of(42).fork(_ => { }, x => result = x);
    assert(result === 42);
});
test('Task.rejected - creates a rejected task', done => {
    let error;
    Task.rejected('error').fork(e => error = e, _ => { });
    assert(error === 'error');
});
test('Task.isTask - identifies Task instances', done => {
    assert(Task.isTask(Task.of(1)) === true);
    assert(Task.isTask({}) === false);
});
test('Task.fold - executes the task with callbacks', done => {
    let result;
    Task.fold(_ => { }, x => result = x, Task.of(10));
    assert(result === 10);
});

console.log('\n📦 TaskFunctor...');
test('TaskFunctor.map - transforms resolved value', done => {
    let result;
    const doubled = TaskFunctor.map(x => x * 2, Task.of(21));
    doubled.fork(_ => { }, x => result = x);
    assert(result === 42);
});
test('TaskFunctor.map - does not transform rejected value', done => {
    let error;
    const mapped = TaskFunctor.map(x => x * 2, Task.rejected('fail'));
    mapped.fork(e => error = e, _ => { });
    assert(error === 'fail');
});

console.log('\n📦 TaskApply...');
test('TaskApply.ap - applies function in Task to value in Task', done => {
    let result;
    const taskFn = Task.of(x => x + 1);
    const taskVal = Task.of(5);
    TaskApply.ap(taskFn, taskVal).fork(_ => { }, x => result = x);
    assert(result === 6);
});

console.log('\n📦 TaskApplicative...');
test('TaskApplicative.of - wraps value in Task', done => {
    let result;
    TaskApplicative.of(99).fork(_ => { }, x => result = x);
    assert(result === 99);
});

console.log('\n📦 TaskChain...');
test('TaskChain.chain - chains computations', done => {
    let result;
    const task = Task.of(5);
    TaskChain.chain(x => Task.of(x * 3), task).fork(_ => { }, x => result = x);
    assert(result === 15);
});
test('TaskChain.chain - propagates rejection', done => {
    let error;
    const task = Task.rejected('oops');
    TaskChain.chain(x => Task.of(x * 3), task).fork(e => error = e, _ => { });
    assert(error === 'oops');
});

console.log('\n📦 TaskMonad...');
test('TaskMonad.of - wraps value', done => {
    let result;
    TaskMonad.of(123).fork(_ => { }, x => result = x);
    assert(result === 123);
});
test('TaskMonad.chain - sequences tasks', done => {
    let result;
    TaskMonad.chain(x => Task.of(x + 'b'), Task.of('a')).fork(_ => { }, x => result = x);
    assert(result === 'ab');
});
test('TaskMonad.map - transforms value', done => {
    let result;
    TaskMonad.map(x => x.toUpperCase(), Task.of('hello')).fork(_ => { }, x => result = x);
    assert(result === 'HELLO');
});

console.log('\n📦 Monad Laws...');
test('Monad Law: Left Identity - chain(f, of(a)) ≡ f(a)', done => {
    const f = x => Task.of(x * 2);
    let left, right;
    TaskMonad.chain(f, TaskMonad.of(5)).fork(_ => { }, x => left = x);
    f(5).fork(_ => { }, x => right = x);
    assert(left === right);
});
test('Monad Law: Right Identity - chain(of, m) ≡ m', done => {
    const m = Task.of(42);
    let left, right;
    TaskMonad.chain(TaskMonad.of, m).fork(_ => { }, x => left = x);
    m.fork(_ => { }, x => right = x);
    assert(left === right);
});

console.log('\n📦 Practical Examples...');
test('Task - async-like sequencing', done => {
    let result;
    const fetchUser = Task.of({ id: 1, name: 'Alice' });
    const fetchPosts = user => Task.of([{ userId: user.id, title: 'Post 1' }]);
    TaskMonad.chain(fetchPosts, fetchUser).fork(_ => { }, posts => result = posts);
    assert(result[0].title === 'Post 1');
});

console.log('\n✅ All Task tests completed!');
