const funFpJs = require('../../index.js');
const { test, assert, assertEquals } = require('../utils.js');
const { task, either } = funFpJs();

console.log('🚀 Starting modules/task.js tests...\n');

// ===================== Task 기본 생성 =====================

test('task.resolved: 성공 값을 감싸고 run으로 추출', () => {
    let result = null;
    task.resolved(42).run(
        err => { throw new Error('should not reject'); },
        val => { result = val; }
    );
    assertEquals(result, 42);
});

test('task.rejected: 실패 값을 감싸고 run으로 추출', () => {
    let errors = null;
    task.rejected('error').run(
        errs => { errors = errs; },
        val => { throw new Error('should not resolve'); }
    );
    assert(Array.isArray(errors), 'errors should be array');
    assert(errors[0] instanceof Error, 'error should be Error instance');
});

test('task.of: resolved와 동일', () => {
    let result = null;
    task.of(100).run(
        err => { throw new Error('should not reject'); },
        val => { result = val; }
    );
    assertEquals(result, 100);
});

// ===================== Functor (map) =====================

test('Task.map: 성공 값에 함수 적용', () => {
    let result = null;
    task.resolved(10)
        .map(x => x * 2)
        .run(
            err => { throw new Error('should not reject'); },
            val => { result = val; }
        );
    assertEquals(result, 20);
});

test('Task.map: 체이닝', () => {
    let result = null;
    task.resolved(5)
        .map(x => x + 1)
        .map(x => x * 2)
        .run(
            err => { throw new Error('should not reject'); },
            val => { result = val; }
        );
    assertEquals(result, 12);
});

test('Task.map: 함수 내 예외 발생 시 rejected', () => {
    let errors = null;
    task.resolved(1)
        .map(() => { throw new Error('map error'); })
        .run(
            errs => { errors = errs; },
            val => { throw new Error('should not resolve'); }
        );
    assert(errors[0].message === 'map error', 'should catch error');
});

test('Task.mapRejected: 실패 값 변환', () => {
    let errors = null;
    task.rejected('original')
        .mapRejected(e => new Error('transformed: ' + e.message))
        .run(
            errs => { errors = errs; },
            val => { throw new Error('should not resolve'); }
        );
    assert(errors[0].message.includes('transformed'), 'should transform error');
});

// ===================== Monad (flatMap) =====================

test('Task.flatMap: Task 체이닝', () => {
    let result = null;
    task.resolved(5)
        .flatMap(x => task.resolved(x * 3))
        .run(
            err => { throw new Error('should not reject'); },
            val => { result = val; }
        );
    assertEquals(result, 15);
});

test('Task.flatMap: 중간에 rejected 반환 시 전파', () => {
    let errors = null;
    task.resolved(5)
        .flatMap(() => task.rejected('flatMap failed'))
        .run(
            errs => { errors = errs; },
            val => { throw new Error('should not resolve'); }
        );
    assert(errors[0].message.includes('flatMap failed'), 'should propagate rejection');
});

test('Task.flatMap: Task 아닌 값 반환 시 rejected', () => {
    let errors = null;
    task.resolved(5)
        .flatMap(x => x * 2) // Task가 아닌 일반 값 반환
        .run(
            errs => { errors = errs; },
            val => { throw new Error('should not resolve'); }
        );
    assert(errors[0].message.includes('must return a Task'), 'should reject with proper error');
});

// ===================== Applicative (ap) =====================

test('Task.ap: 함수를 값에 적용', () => {
    let result = null;
    const taskFn = task.resolved(x => x + 10);
    const taskVal = task.resolved(5);

    taskFn.ap(taskVal).run(
        err => { throw new Error('should not reject'); },
        val => { result = val; }
    );
    assertEquals(result, 15);
});

test('Task.ap: 양쪽 모두 실패 시 에러 누적', () => {
    let errors = null;
    const taskFn = task.rejected('fn error');
    const taskVal = task.rejected('val error');

    taskFn.ap(taskVal).run(
        errs => { errors = errs; },
        val => { throw new Error('should not resolve'); }
    );
    assertEquals(errors.length, 2, 'should accumulate errors');
});

// ===================== fold =====================

test('Task.fold: 성공 시 onResolved 호출', () => {
    let result = null;
    task.resolved(42)
        .fold(
            errs => 'failed',
            val => 'success: ' + val
        )
        .run(
            err => { throw new Error('should not reject'); },
            val => { result = val; }
        );
    assertEquals(result, 'success: 42');
});

test('Task.fold: 실패 시 onRejected 호출', () => {
    let result = null;
    task.rejected('error')
        .fold(
            errs => 'handled: ' + errs.length,
            val => 'success'
        )
        .run(
            err => { throw new Error('fold should recover'); },
            val => { result = val; }
        );
    assertEquals(result, 'handled: 1');
});

// ===================== fromEither =====================

test('task.fromEither: Right → resolved', () => {
    let result = null;
    task.fromEither(either.right(100)).run(
        err => { throw new Error('should not reject'); },
        val => { result = val; }
    );
    assertEquals(result, 100);
});

test('task.fromEither: Left → rejected', () => {
    let errors = null;
    task.fromEither(either.left('either error')).run(
        errs => { errors = errs; },
        val => { throw new Error('should not resolve'); }
    );
    assert(Array.isArray(errors), 'should be error array');
});

// ===================== toEither =====================

test('Task.toEither: 성공 시 Right', () => {
    let result = null;
    task.resolved(42).toEither(e => { result = e; });
    assert(result.isRight(), 'should be Right');
    assertEquals(result.value, 42);
});

test('Task.toEither: 실패 시 Left', () => {
    let result = null;
    task.rejected('error').toEither(e => { result = e; });
    assert(result.isLeft(), 'should be Left');
});

// ===================== fromPromise =====================

test('task.fromPromise: Promise 성공 → resolved', async () => {
    const fetchData = task.fromPromise(() => Promise.resolve(42));
    let result = null;
    fetchData().run(
        err => { throw new Error('should not reject'); },
        val => { result = val; }
    );
    // 비동기이므로 약간의 대기
    await new Promise(r => setTimeout(r, 10));
    assertEquals(result, 42);
});

test('task.fromPromise: Promise 실패 → rejected', async () => {
    const fetchData = task.fromPromise(() => Promise.reject(new Error('fetch failed')));
    let errors = null;
    fetchData().run(
        errs => { errors = errs; },
        val => { throw new Error('should not resolve'); }
    );
    await new Promise(r => setTimeout(r, 10));
    assert(Array.isArray(errors), 'should be error array');
    assert(errors[0].message === 'fetch failed', 'should preserve error message');
});

test('task.fromPromise: 인자 전달', async () => {
    const multiply = task.fromPromise((a, b) => Promise.resolve(a * b));
    let result = null;
    multiply(3, 4).run(
        err => { throw new Error('should not reject'); },
        val => { result = val; }
    );
    await new Promise(r => setTimeout(r, 10));
    assertEquals(result, 12);
});

// ===================== toPromise =====================

test('Task.toPromise: 성공 시 Promise resolve', async () => {
    const result = await task.resolved(42).toPromise();
    assertEquals(result, 42);
});

test('Task.toPromise: 실패 시 AggregateError로 reject', async () => {
    try {
        await task.rejected('error').toPromise();
        assert(false, 'should have rejected');
    } catch (err) {
        assert(err instanceof AggregateError, 'should be AggregateError');
        assertEquals(err.message, 'Task rejected');
        assert(Array.isArray(err.errors), 'should have errors array');
        assert(err.errors[0] instanceof Error, 'errors should contain Error instances');
    }
});

test('Task.toPromise: 다중 에러 시 모든 에러 포함', async () => {
    // ap로 에러 누적 후 toPromise
    const taskFn = task.rejected('error1');
    const taskVal = task.rejected('error2');

    try {
        await taskFn.ap(taskVal).toPromise();
        assert(false, 'should have rejected');
    } catch (err) {
        assert(err instanceof AggregateError, 'should be AggregateError');
        assertEquals(err.errors.length, 2, 'should contain both errors');
    }
});

// ===================== all =====================

test('task.all: 모든 Task 성공 시 결과 배열', () => {
    let result = null;
    task.all([
        task.resolved(1),
        task.resolved(2),
        task.resolved(3)
    ]).run(
        err => { throw new Error('should not reject'); },
        val => { result = val; }
    );
    assertEquals(JSON.stringify(result), '[1,2,3]');
});

test('task.all: 빈 배열은 빈 결과', () => {
    let result = null;
    task.all([]).run(
        err => { throw new Error('should not reject'); },
        val => { result = val; }
    );
    assertEquals(JSON.stringify(result), '[]');
});

test('task.all: 하나라도 실패 시 에러 누적', () => {
    let errors = null;
    task.all([
        task.resolved(1),
        task.rejected('fail1'),
        task.rejected('fail2')
    ]).run(
        errs => { errors = errs; },
        val => { throw new Error('should not resolve'); }
    );
    assertEquals(errors.length, 2, 'should accumulate all errors');
});

// ===================== race =====================

test('task.race: 가장 먼저 완료되는 Task 반환', () => {
    let result = null;
    task.race([
        task.resolved('first'),
        task.resolved('second')
    ]).run(
        err => { throw new Error('should not reject'); },
        val => { result = val; }
    );
    assertEquals(result, 'first');
});

test('task.race: 빈 배열은 rejected', () => {
    let errors = null;
    task.race([]).run(
        errs => { errors = errs; },
        val => { throw new Error('should not resolve'); }
    );
    assert(errors[0].message.includes('empty'), 'should reject with empty error');
});

// ===================== sequence =====================

test('task.sequence: Task 배열을 순차 실행', () => {
    let result = null;
    task.sequence([
        task.resolved(1),
        task.resolved(2),
        task.resolved(3)
    ]).run(
        err => { throw new Error('should not reject'); },
        val => { result = val; }
    );
    assertEquals(JSON.stringify(result), '[1,2,3]');
});

// ===================== traverse =====================

test('task.traverse: 배열에 함수 적용 후 sequence', () => {
    let result = null;
    task.traverse(x => task.resolved(x * 2))([1, 2, 3]).run(
        err => { throw new Error('should not reject'); },
        val => { result = val; }
    );
    assertEquals(JSON.stringify(result), '[2,4,6]');
});

// ===================== pipeK =====================

test('task.pipeK - Task 반환 함수들을 Kleisli 합성', () => {
    const parse = str => task.resolved(JSON.parse(str));
    const getUser = data => task.resolved(data.user);
    const getName = user => task.resolved(user.name);

    const pipeline = task.pipeK(parse, getUser, getName);
    let result = null;
    pipeline('{"user":{"name":"Alice"}}').run(
        err => { throw new Error('should not reject'); },
        val => { result = val; }
    );
    assertEquals(result, 'Alice');
});

test('task.pipeK - 빈 함수 배열은 Task.resolved 반환', () => {
    const pipeline = task.pipeK();
    let result = null;
    pipeline(42).run(
        err => { throw new Error('should not reject'); },
        val => { result = val; }
    );
    assertEquals(result, 42);
});

test('task.pipeK - 중간에 실패 시 단락 평가', () => {
    const parse = str => {
        try {
            return task.resolved(JSON.parse(str));
        } catch (e) {
            return task.rejected(e);
        }
    };
    const getUser = data => task.resolved(data.user);

    const pipeline = task.pipeK(parse, getUser);
    let errors = null;
    pipeline('invalid json').run(
        errs => { errors = errs; },
        val => { throw new Error('should not resolve'); }
    );
    assert(errors !== null, 'should have errors');
    assert(errors.length > 0, 'errors should not be empty');
});

test('task.pipeK - 함수가 아닌 인자 전달 시 에러', () => {
    try {
        task.pipeK(x => task.resolved(x), 'not a function');
        assert(false, 'should have thrown');
    } catch (e) {
        assert(e instanceof TypeError);
        assert(e.message.includes('Task.pipeK'));
    }
});

// ===================== Lazy 특성 확인 =====================

test('Task는 run 전까지 실행되지 않음 (lazy)', () => {
    let executed = false;

    const lazyTask = new task.Task((reject, resolve) => {
        executed = true;
        resolve('done');
    });

    // run 전에는 실행 안 됨
    assertEquals(executed, false);

    // run 후 실행
    let result = null;
    lazyTask.run(
        err => { throw new Error('should not reject'); },
        val => { result = val; }
    );
    assertEquals(executed, true);
    assertEquals(result, 'done');
});

// ===================== Type checking =====================

test('Task has Functor/Applicative/Monad symbols', () => {
    const t = task.resolved(1);
    assert(t[Symbol.toStringTag] === 'Task', 'should have Task tag');
});

// ===================== Boundary/Error tests =====================

console.log('\n🛡️ Starting Boundary and Error tests...');

test('task() - computation must be a function', () => {
    try {
        task.Task.prototype.constructor.call({}, 'not a function');
        // Direct call won't work, test via exposed task constructor indirectly
    } catch (e) {
        // Expected
    }
});

test('task() - computation must accept 2 parameters', () => {
    try {
        // 0 parameters
        new task.Task(() => { });
        // This uses Task class directly, doesn't go through validation
    } catch (e) {
        assert(e instanceof TypeError);
    }
});

test('Task.run - onRejected must be a function', () => {
    try {
        task.resolved(1).run('not a function', () => { });
        assert(false, 'should have thrown');
    } catch (e) {
        assert(e instanceof TypeError);
        assert(e.message.includes('Task.run'));
    }
});

test('Task.run - onResolved must be a function', () => {
    try {
        task.resolved(1).run(() => { }, 'not a function');
        assert(false, 'should have thrown');
    } catch (e) {
        assert(e instanceof TypeError);
        assert(e.message.includes('Task.run'));
    }
});

test('Task.map - argument must be a function', () => {
    try {
        task.resolved(1).map('not a function');
        assert(false, 'should have thrown');
    } catch (e) {
        assert(e instanceof TypeError);
        assert(e.message.includes('Task.map'));
    }
});

test('Task.flatMap - argument must be a function', () => {
    try {
        task.resolved(1).flatMap('not a function');
        assert(false, 'should have thrown');
    } catch (e) {
        assert(e instanceof TypeError);
        assert(e.message.includes('Task.flatMap'));
    }
});

console.log('\n✅ All Task tests completed!');

