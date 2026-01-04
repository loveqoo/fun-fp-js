// ========== Either ==========
class Either {
    isLeft() { return false; }
    isRight() { return false; }
}
class Left extends Either {
    constructor(value) { super(); this.value = value; this._typeName = 'Either'; }
    isLeft() { return true; }
}
class Right extends Either {
    constructor(value) { super(); this.value = value; this._typeName = 'Either'; }
    isRight() { return true; }
}
Either.Left = x => new Left(x);
Either.Right = x => new Right(x);
Either.of = x => new Right(x);
Either.isEither = x => x instanceof Either;
Either.isLeft = x => x instanceof Left;
Either.isRight = x => x instanceof Right;
Either.fold = (onLeft, onRight, e) => e.isLeft() ? onLeft(e.value) : onRight(e.value);
// catch: try-catch를 Either로 감쌈
Either.catch = f => {
    try { return Either.Right(f()); }
    catch (e) { return Either.Left(e); }
};
// validate: 조건 검사
Either.validate = (condition, onError) => x => condition(x) ? Either.Right(x) : Either.Left(onError(x));
// validateAll: 여러 Either 결합 (모든 에러 수집)
Either.validateAll = list => list.reduce(
    (acc, e) => acc.isLeft() && e.isLeft()
        ? Either.Left([].concat(acc.value, e.value))
        : acc.isLeft() ? acc : e.isLeft() ? e : Either.Right([].concat(acc.value || [], e.value)),
    Either.Right([])
);
// sequence: [Either a] -> Either [a] (첫 Left에서 중단)
Either.sequence = list => {
    const results = [];
    for (const e of list) {
        if (e.isLeft()) return e;
        results.push(e.value);
    }
    return Either.Right(results);
};

// ========== Maybe ==========
class Maybe {
    isJust() { return false; }
    isNothing() { return false; }
}
class Just extends Maybe {
    constructor(value) { super(); this.value = value; this._typeName = 'Maybe'; }
    isJust() { return true; }
}
class Nothing extends Maybe {
    constructor() { super(); this._typeName = 'Maybe'; }
    isNothing() { return true; }
}
Maybe.Just = x => new Just(x);
Maybe.Nothing = () => new Nothing();
Maybe.of = x => new Just(x);
Maybe.isMaybe = x => x instanceof Maybe;
Maybe.isJust = x => x instanceof Just;
Maybe.isNothing = x => x instanceof Nothing;
Maybe.fromNullable = x => x == null ? new Nothing() : new Just(x);
Maybe.fold = (onNothing, onJust, m) => m.isJust() ? onJust(m.value) : onNothing();

// ========== Task ==========
class Task {
    constructor(fork) {
        this.fork = fork; // (reject, resolve) => ...
        this._typeName = 'Task';
    }
}
Task.of = x => new Task((_, resolve) => resolve(x));
Task.rejected = x => new Task((reject, _) => reject(x));
Task.isTask = x => x instanceof Task;
Task.fold = (onRejected, onResolved, task) => task.fork(onRejected, onResolved);
// fromPromise: Promise 함수를 Task로 변환
Task.fromPromise = promiseFn => (...args) => new Task((reject, resolve) => promiseFn(...args).then(resolve).catch(reject));
// fromEither: Either를 Task로 변환
Task.fromEither = e => e.isRight() ? Task.of(e.value) : Task.rejected(e.value);
// all: 병렬 실행 (Promise.all 유사)
Task.all = tasks => new Task((reject, resolve) => {
    const list = Array.isArray(tasks) ? tasks : [tasks];
    if (list.length === 0) return resolve([]);
    const results = new Array(list.length);
    let completed = 0, rejected = false;
    list.forEach((t, i) => {
        t.fork(
            e => { if (!rejected) { rejected = true; reject(e); } },
            v => { results[i] = v; completed++; if (completed === list.length) resolve(results); }
        );
    });
});
// race: 경쟁 실행 (Promise.race 유사)
Task.race = tasks => new Task((reject, resolve) => {
    const list = Array.isArray(tasks) ? tasks : [tasks];
    if (list.length === 0) return reject(new Error('race: empty task list'));
    let done = false;
    list.forEach(t => {
        t.fork(
            e => { if (!done) { done = true; reject(e); } },
            v => { if (!done) { done = true; resolve(v); } }
        );
    });
});
// sequence: 순차 실행
Task.sequence = tasks => {
    const list = Array.isArray(tasks) ? tasks : [tasks];
    return list.reduce(
        (acc, t) => new Task((reject, resolve) => {
            acc.fork(reject, arr => t.fork(reject, v => resolve([...arr, v])));
        }),
        Task.of([])
    );
};

module.exports = {
    Either, Left, Right, Maybe, Just, Nothing, Task
};
