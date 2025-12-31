const $free = (dependencies = {}) => {
    const { core } = dependencies.$core;
    const assertFunctions = {
        'thunk': core.assertFunction('Thunk', 'a function'),
    };
    const stackSafe = (runner, f, onReentry = f) => {
        let active = false;
        return (...args) => {
            if (active) return onReentry(...args);
            active = true;
            return core.catch(
                () => {
                    const result = runner(f(...args));
                    if (result instanceof Promise || (result && typeof result.then === 'function')) {
                        return result.finally(() => { active = false; });
                    }
                    active = false;
                    return result;
                },
                e => { active = false; throw e; }
            )();
        };
    };
    class Free {
        static of(x) { return new Pure(x); }
        static pure(x) { return new Pure(x); }
        static impure(functor) {
            core.isFunctor(functor) || core.raise(new Error(`impure: expected a functor`));
            return new Impure(functor);
        }
        static isPure(x) { return x instanceof Pure; }
        static isImpure(x) { return x instanceof Impure; }
        static liftF(command) {
            core.isFunctor(command) || core.raise(new Error(`liftF: expected a functor`));
            return Free.isPure(command) || Free.isImpure(command)
                ? command
                : Free.impure(command.map(Free.pure));
        }
        static runSync(runner) {
            return target => {
                const execute = program => {
                    let step = program;
                    while (Free.isImpure(step)) {
                        step = runner(step.functor);
                        if (Free.isPure(step) && (Free.isPure(step.value) || Free.isImpure(step.value))) {
                            step = step.value;
                        }
                    }
                    return Free.isPure(step) ? step.value : step;
                };
                return typeof target === 'function' ? stackSafe(execute, target) : execute(target);
            };
        }
        static runAsync(runner) {
            return target => {
                const execute = async program => {
                    let step = program;
                    while (Free.isImpure(step)) {
                        step = await runner(step.functor);
                        if (Free.isPure(step) && (Free.isPure(step.value) || Free.isImpure(step.value))) {
                            step = step.value;
                        }
                    }
                    return Free.isPure(step) ? step.value : step;
                };
                return typeof target === 'function' ? stackSafe(execute, target) : execute(target);
            };
        }
    }
    class Pure extends Free {
        constructor(value) {
            super();
            this.value = value;
            this[Symbol.toStringTag] = 'Pure';
            this[core.Types.Functor] = true;
            this[core.Types.Monad] = true;
        }
        map(f) { return new Pure(f(this.value)); }
        flatMap(f) { return f(this.value); }
    }
    class Impure extends Free {
        constructor(functor) {
            super();
            core.isFunctor(functor) || core.raise(new Error(`impure: expected a functor`));
            this.functor = functor;
            this[Symbol.toStringTag] = 'Impure';
            this[core.Types.Functor] = true;
            this[core.Types.Monad] = true;
        }
        map(f) { return new Impure(this.functor.map(free => free.map(f))); }
        flatMap(f) { return new Impure(this.functor.map(free => free.flatMap(f))); }
    }
    class Thunk {
        constructor(f) {
            this.f = assertFunctions['thunk'](f)[0];
            this[Symbol.toStringTag] = 'Thunk';
            this[core.Types.Functor] = true;
        }
        map(g) { return new Thunk(core.compose(g, this.f)); }
        run() { return this.f(); }
        static of(f) { return new Thunk(f); }
        static done(value) { return Free.pure(value); }
        static suspend(f) { return Free.liftF(new Thunk(f)); }
    }
    const trampoline = Free.runSync(thunk => thunk.run());
    return {
        free: {
            Free, Thunk,
            of: Free.of, pure: Free.pure, impure: Free.impure,
            isPure: Free.isPure, isImpure: Free.isImpure,
            liftF: Free.liftF, runSync: Free.runSync, runAsync: Free.runAsync,
            done: Thunk.done, suspend: Thunk.suspend, trampoline,
        },
    };
};
if (typeof module !== 'undefined' && module.exports) module.exports = $free;