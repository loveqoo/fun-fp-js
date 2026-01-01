const $task = (dependencies = {}) => {
    const { core } = dependencies.$core;
    const { expectedFunction, expectedFunctions } = core;
    const { either } = dependencies.$either;
    // @build-start
    expectedFunctions['task:computation-to-be-a-function'] = expectedFunction('a computation function (reject, resolve) => ...');
    expectedFunctions['task:a-function-returning-task'] = expectedFunction('a function returning Task');
    expectedFunctions['a-function-returning-promise'] = expectedFunction('a function returning Promise');
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
            expectedFunctions['core:a-function']('Task.map:f')(f);
            return new Task((reject, resolve) => {
                this.computation(
                    reject,
                    core.catch(core.compose(resolve, f), rejectWith(reject))
                );
            });
        }
        mapRejected(f) {
            expectedFunctions['core:a-function']('Task.mapRejected:f')(f);
            return new Task((reject, resolve) => {
                this.computation(
                    core.compose(reject, errs => errs.map(core.catch(f, core.identity))),
                    resolve
                );
            });
        }
        flatMap(f) {
            expectedFunctions['task:a-function-returning-task']('Task.flatMap:f')(f);
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
            expectedFunctions['core:a-function']('Task.run:onRejected')(onRejected);
            expectedFunctions['core:a-function']('Task.run:onResolved')(onResolved);
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
            this.run(core.compose(callback, either.left), core.compose(callback, either.right));
        }
        static of(x) { return new Task((_, resolve) => resolve(x)); }
        static resolved(x) { return Task.of(x); }
        static rejected(e) { return new Task((reject, _) => reject(toTaskErrorArray(e))); }
        static create(computation) {
            expectedFunctions['task:computation-to-be-a-function']('Task.create:computation')(computation);
            if (computation.length !== 2) {
                core.raise(new TypeError(
                    `Task: computation must accept exactly 2 parameters (reject, resolve), but got ${computation.length}`
                ));
            }
            return new Task(computation);
        }
        static fromPromise(promiseFn) {
            expectedFunctions['a-function-returning-promise']('Task.fromPromise:promiseFn')(promiseFn);
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
        static all(tasks) { // Promise.allSettled
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
        static race(tasks) { // Promise.allSettled
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
        static pipeK(...fs) {
            expectedFunctions['core:all-arguments-to-be-functions']('Task.pipeK:fs')(...fs);
            if (fs.length === 0) return Task.resolved;
            return (x) => fs.reduce((acc, f) => acc.flatMap(f), Task.resolved(x));
        }
    }
    return {
        task: {
            Task, of: Task.of,
            resolved: Task.resolved, rejected: Task.rejected, create: Task.create,
            fromPromise: Task.fromPromise, fromEither: Task.fromEither,
            all: Task.all, race: Task.race, sequence: Task.sequence, traverse: Task.traverse,
            pipeK: Task.pipeK,
        },
    };
};

if (typeof module !== 'undefined' && module.exports) module.exports = $task;
