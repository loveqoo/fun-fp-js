import {
    Semigroupoid, Category, Functor, Apply, Applicative, Alt, Chain,
    ChainRec, Monad
} from '../spec.js';

class Task {
    constructor(fork) {
        this.fork = fork;
        this._typeName = 'Task';
    }
}
Task.of = x => new Task((_, resolve) => resolve(x));
Task.rejected = x => new Task((reject, _) => reject(x));
Task.isTask = x => x instanceof Task;
Task.fold = (onRejected, onResolved, task) => task.fork(onRejected, onResolved);
Task.fromPromise = promiseFn => (...args) => new Task((reject, resolve) => promiseFn(...args).then(resolve).catch(reject));
Task.fromEither = e => e.isRight() ? Task.of(e.value) : Task.rejected(e.value);
Task.all = tasks => new Task((reject, resolve) => {
    const list = Array.isArray(tasks) ? tasks : [tasks];
    if (list.length === 0) return resolve([]);
    const results = new Array(list.length);
    let completed = 0, rejected = false;
    list.forEach((t, i) => {
        t.fork(
            e => {
                if (!rejected) {
                    rejected = true;
                    reject(e);
                }
            },
            v => {
                results[i] = v;
                completed++;
                if (completed === list.length) resolve(results);
            }
        );
    });
});
Task.race = tasks => new Task((reject, resolve) => {
    const list = Array.isArray(tasks) ? tasks : [tasks];
    if (list.length === 0) return reject(new Error('race: empty task list'));
    let done = false;
    list.forEach(t => {
        t.fork(
            e => {
                if (!done) {
                    done = true;
                    reject(e);
                }
            },
            v => {
                if (!done) {
                    done = true;
                    resolve(v);
                }
            }
        );
    });
});
Task.sequence = tasks => {
    const list = Array.isArray(tasks) ? tasks : [tasks];
    return list.reduce(
        (acc, t) => new Task((reject, resolve) => {
            acc.fork(
                reject,
                arr => t.fork(reject, v => resolve([...arr, v]))
            );
        }),
        Task.of([])
    );
};

class TaskSemigroupoid extends Semigroupoid {
    constructor() {
        super((f, g) => x => Chain.types.TaskChain.chain(f, g(x)), 'function', Semigroupoid.types, 'task');
    }
}
class TaskCategory extends Category {
    constructor() {
        super(Semigroupoid.types.TaskSemigroupoid, Task.of, 'function', Category.types, 'task');
    }
}
class TaskFunctor extends Functor {
    constructor() {
        super((f, task) => new Task((reject, resolve) => task.fork(reject, x => resolve(f(x)))), 'Task', Functor.types, 'task');
    }
}
class TaskApply extends Apply {
    constructor() {
        super(Functor.types.TaskFunctor, (taskFn, taskVal) => new Task((reject, resolve) => {
            let fn, val, fnDone = false, valDone = false, rejected = false;
            taskFn.fork(
                e => {
                    rejected || (rejected = true, reject(e));
                },
                f => {
                    fn = f;
                    fnDone = true;
                    fnDone && valDone && resolve(fn(val));
                }
            );
            taskVal.fork(
                e => {
                    rejected || (rejected = true, reject(e));
                },
                v => {
                    val = v;
                    valDone = true;
                    fnDone && valDone && resolve(fn(val));
                }
            );
        }), 'Task', Apply.types, 'task');
    }
}
class TaskApplicative extends Applicative {
    constructor() {
        super(Apply.types.TaskApply, Task.of, 'Task', Applicative.types, 'task');
    }
}
class TaskAlt extends Alt {
    constructor() {
        super(Functor.types.TaskFunctor, (a, b) => new Task((reject, resolve) => {
            a.fork(_ => b.fork(reject, resolve), resolve);
        }), 'Task', Alt.types, 'task');
    }
}
class TaskChain extends Chain {
    constructor() {
        super(Apply.types.TaskApply,
            (f, task) => new Task((reject, resolve) => task.fork(reject, x => f(x).fork(reject, resolve))),
            'Task', Chain.types, 'task');
    }
}
class TaskChainRec extends ChainRec {
    constructor() {
        super(Chain.types.TaskChain,
            (f, i) => new Task((reject, resolve) => {
                const loop = val => {
                    f(ChainRec.next, ChainRec.done, val).fork(reject, step => {
                        step.tag === 'next' ? loop(step.value) : resolve(step.value);
                    });
                };
                loop(i);
            }), 'Task', ChainRec.types, 'task');
    }
}
class TaskMonad extends Monad {
    constructor() {
        super(Applicative.types.TaskApplicative, Chain.types.TaskChain, 'Task', Monad.types, 'task');
    }
}

(new TaskSemigroupoid(), new TaskCategory(), new TaskFunctor(), new TaskApply(), new TaskApplicative(), new TaskAlt(),
    new TaskChain(), new TaskChainRec(), new TaskMonad());