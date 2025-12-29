const $task = (dependencies = {}) => {
    const { core } = dependencies.$core;
    const { either } = dependencies.$either;
    const assertFunctions = {
        'task': core.assertFunction('Task', 'a computation function (reject, resolve) => ...'),
        'task_map': core.assertFunction('Task.map', 'a function'),
        'task_map_rejected': core.assertFunction('Task.mapRejected', 'a function'),
        'task_flat_map': core.assertFunction('Task.flatMap', 'a function returning Task'),
        'task_run': core.assertFunction('Task.run', 'reject and resolve to be functions'),
        'task_from_promise': core.assertFunction('Task.fromPromise', 'a function returning Promise'),
    };
    const normalizeTaskError = e => e instanceof Error ? e : new Error(String(e));
    const toTaskErrorArray = e => core.useArrayOrLift(e).map(normalizeTaskError);
    const rejectWith = reject => core.compose(reject, toTaskErrorArray);
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
            assertFunctions['task_map_rejected'](f);
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
                let f = null, a = null, fDone = false, aDone = false;
                let errors = [];

                const tryResolve = () => {
                    if (fDone && aDone) {
                        errors.length > 0
                            ? reject(errors)
                            : core.catch(() => resolve(f(a)), rejectWith(reject))();
                    }
                };

                this.computation(
                    errs => { errors = errors.concat(errs); fDone = true; tryResolve(); },
                    fn => { f = fn; fDone = true; tryResolve(); }
                );

                taskValue.computation(
                    errs => { errors = errors.concat(errs); aDone = true; tryResolve(); },
                    x => { a = x; aDone = true; tryResolve(); }
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
                this.computation(
                    errs => reject(new AggregateError(errs, 'Task rejected')),
                    resolve
                );
            });
        }
        toEither(callback) {
            this.run(
                core.compose(callback, either.left),
                core.compose(callback, either.right)
            );
        }
        static of(x) { return new Task((_, resolve) => resolve(x)); }
        static resolved(x) { return Task.of(x); }
        static rejected(e) { return new Task((reject, _) => reject(toTaskErrorArray(e))); }
        static create(computation) {
            assertFunctions['task'](computation);
            if (computation.length !== 2) {
                core.raise(new TypeError(
                    `Task: computation must accept exactly 2 parameters (reject, resolve), but got ${computation.length}`
                ));
            }
            return new Task(computation);
        }
        static fromPromise(promiseFn) {
            assertFunctions['task_from_promise'](promiseFn);
            return (...args) => new Task((reject, resolve) => {
                promiseFn(...args)
                    .then(resolve)
                    .catch(rejectWith(reject));
            });
        }
        static fromEither(e) {
            either.checkEither(e);
            return e.isRight() ? Task.resolved(e.value) : Task.rejected(e.value);
        }
        static all(tasks) {
            return new Task((reject, resolve) => {
                const list = core.useArrayOrLift(tasks);
                if (list.length === 0) return resolve([]);

                const results = [];
                const errors = [];
                let completed = 0;

                const onComplete = () => {
                    if (completed === list.length) {
                        const flatErrors = errors.flat().filter(Boolean);
                        flatErrors.length > 0 ? reject(flatErrors) : resolve(results);
                    }
                };

                list.forEach((t, i) => {
                    t.computation(
                        errs => { errors[i] = errs; completed++; onComplete(); },
                        val => { results[i] = val; completed++; onComplete(); }
                    );
                });
            });
        }
        static race(tasks) {
            return new Task((reject, resolve) => {
                const list = core.useArrayOrLift(tasks);
                if (list.length === 0) return reject([new Error('race: empty task list')]);

                const shared = { called: false };
                const onceReject = core.once(reject, { state: shared });
                const onceResolve = core.once(resolve, { state: shared });

                list.forEach(t => t.computation(onceReject, onceResolve));
            });
        }
        static sequence(tasks) {
            const list = core.useArrayOrLift(tasks);
            return list.reduce(
                (acc, t) => acc.flatMap(arr => t.map(val => [...arr, val])),
                Task.resolved([])
            );
        }
        static traverse(f) { return list => Task.sequence(core.useArrayOrLift(list).map(f)); }
    }
    return {
        task: {
            Task,
            of: Task.of,
            resolved: Task.resolved,
            rejected: Task.rejected,
            create: Task.create,
            fromPromise: Task.fromPromise,
            fromEither: Task.fromEither,
            all: Task.all,
            race: Task.race,
            sequence: Task.sequence,
            traverse: Task.traverse,
        },
    };
};

if (typeof module !== 'undefined' && module.exports) module.exports = $task;
