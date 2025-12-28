const $task = (dependencies = {}) => {
    const { core } = dependencies.$core;
    const { either } = dependencies.$either;

    const assertFunctions = {
        'task': core.assertFunction('Task', 'a computation function (reject, resolve) => ...'),
        'task_map': core.assertFunction('Task.map', 'a function'),
        'task_flat_map': core.assertFunction('Task.flatMap', 'a function returning Task'),
        'task_run': core.assertFunction('Task.run', 'reject and resolve to be functions'),
    };

    // Error normalization helper
    const normalizeError = e => e instanceof Error ? e : new Error(String(e));
    const toErrorArray = e => core.useArrayOrLift(e).map(normalizeError);
    const rejectWith = reject => core.compose(reject, toErrorArray);

    class Task {
        constructor(computation) {
            this.computation = computation;
            this[Symbol.toStringTag] = 'Task';
            this[core.Types.Functor] = true;
            this[core.Types.Applicative] = true;
            this[core.Types.Monad] = true;
        }

        map(f) {
            assertFunctions['task_map'](f);
            return new Task((reject, resolve) => {
                this.computation(
                    reject,
                    core.catch(core.compose(resolve, f), rejectWith(reject))
                );
            });
        }

        mapRejected(f) {
            return new Task((reject, resolve) => {
                this.computation(
                    core.compose(reject, errs => errs.map(core.catch(f, core.identity))),
                    resolve
                );
            });
        }

        flatMap(f) {
            assertFunctions['task_flat_map'](f);
            return new Task((reject, resolve) => {
                this.computation(
                    reject,
                    core.catch(
                        x => {
                            const nextTask = f(x);
                            return nextTask instanceof Task
                                ? nextTask.computation(reject, resolve)
                                : reject([new Error('flatMap: function must return a Task')]);
                        },
                        rejectWith(reject)
                    )
                );
            });
        }

        ap(taskValue) {
            return new Task((reject, resolve) => {
                let fn = null, val = null, fnDone = false, valDone = false;
                let errors = [];

                const tryResolve = () => {
                    if (fnDone && valDone) {
                        errors.length > 0
                            ? reject(errors)
                            : core.catch(() => resolve(fn(val)), rejectWith(reject))();
                    }
                };

                this.computation(
                    errs => { errors = errors.concat(errs); fnDone = true; tryResolve(); },
                    f => { fn = f; fnDone = true; tryResolve(); }
                );

                taskValue.computation(
                    errs => { errors = errors.concat(errs); valDone = true; tryResolve(); },
                    x => { val = x; valDone = true; tryResolve(); }
                );
            });
        }

        fold(onRejected, onResolved) {
            return new Task((reject, resolve) => {
                this.computation(
                    core.catch(core.compose(resolve, onRejected), rejectWith(reject)),
                    core.catch(core.compose(resolve, onResolved), rejectWith(reject))
                );
            });
        }

        run(onRejected, onResolved) {
            assertFunctions['task_run'](onRejected);
            assertFunctions['task_run'](onResolved);
            this.computation(onRejected, onResolved);
        }

        toPromise() {
            return new Promise((resolve, reject) => {
                this.computation(reject, resolve);
            });
        }

        toEither(callback) {
            this.run(
                core.compose(callback, either.left),
                core.compose(callback, either.right)
            );
        }
    }

    // Constructors
    const task = computation => {
        assertFunctions['task'](computation);
        if (computation.length !== 2) {
            core.raise(new TypeError(
                `Task: computation must accept exactly 2 parameters (reject, resolve), but got ${computation.length}`
            ));
        }
        return new Task(computation);
    };

    const resolved = x => new Task((_, resolve) => resolve(x));

    const rejected = e => new Task((reject, _) => reject(toErrorArray(e)));

    const fromPromise = promiseFn => (...args) => new Task((reject, resolve) => {
        promiseFn(...args)
            .then(resolve)
            .catch(rejectWith(reject));
    });

    const fromEither = e => e.isRight()
        ? resolved(e.value)
        : rejected(e.value);

    // Combinators
    const all = tasks => new Task((reject, resolve) => {
        const list = core.useArrayOrLift(tasks);
        if (list.length === 0) return resolve([]);

        const results = [];
        let completed = 0;
        let errors = [];

        const onComplete = () => {
            if (completed === list.length) {
                errors.length > 0 ? reject(errors) : resolve(results);
            }
        };

        list.forEach((t, i) => {
            t.computation(
                errs => { errors = errors.concat(errs); completed++; onComplete(); },
                val => { results[i] = val; completed++; onComplete(); }
            );
        });
    });

    const race = tasks => new Task((reject, resolve) => {
        const list = core.useArrayOrLift(tasks);
        if (list.length === 0) return reject([new Error('race: empty task list')]);

        const shared = { called: false };
        const onceReject = core.once(reject, { state: shared });
        const onceResolve = core.once(resolve, { state: shared });

        list.forEach(t => t.computation(onceReject, onceResolve));
    });

    const taskSequence = tasks => {
        const list = core.useArrayOrLift(tasks);
        return list.reduce(
            (acc, t) => acc.flatMap(arr => t.map(val => [...arr, val])),
            resolved([])
        );
    };

    const taskTraverse = f => list => taskSequence(core.useArrayOrLift(list).map(f));

    return {
        task: {
            of: resolved,
            resolved,
            rejected,
            fromPromise,
            fromEither,
            all,
            race,
            sequence: taskSequence,
            traverse: taskTraverse,
            Task,
        },
    };
};

if (typeof module !== 'undefined' && module.exports) module.exports = $task;
