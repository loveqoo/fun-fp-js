const $free = (dependencies = {}) => {
    const { fp } = dependencies.$func;
    class Pure {
        constructor(value) {
            this.value = value;
            this[Symbol.toStringTag] = 'Pure';
            this[fp.Types.Functor] = true;
            this[fp.Types.Monad] = true;
        }
        map(f) { return new Pure(f(this.value)); }
        flatMap(f) { return f(this.value); }
    }
    class Impure {
        constructor(functor) {
            fp.isFunctor(functor) || fp.raise(new Error(`impure: expected a functor`));
            this.functor = functor;
            this[Symbol.toStringTag] = 'Impure';
            this[fp.Types.Functor] = true;
            this[fp.Types.Monad] = true;
        }
        map(f) { return new Impure(this.functor.map(free => free.map(f))); }
        flatMap(f) { return new Impure(this.functor.map(free => free.flatMap(f))); }
    }
    const pure = x => new Pure(x);
    const impure = functor => new Impure(functor);
    const isPure = x => x instanceof Pure;
    const isImpure = x => x instanceof Impure;
    const liftF = command => {
        fp.isFunctor(command) || fp.raise(new Error(`liftF: expected a functor`));
        return isPure(command) || isImpure(command) ? command : impure(command.map(pure));
    };
    const stackSafe = (runner, f, onReentry = f) => {
        let active = false;
        return (...args) => {
            if (active) return onReentry(...args);
            active = true;
            try {
                const result = runner(f(...args));
                // Handle Async Promise (for runAsync)
                if (result instanceof Promise || (result && typeof result.then === 'function')) {
                    return result.finally(() => { active = false; });
                }
                active = false;
                return result;
            } catch (e) {
                active = false;
                throw e;
            }
        };
    };
    const runSync = runner => target => {
        const execute = program => {
            let step = program;
            while (isImpure(step)) {
                step = runner(step.functor);
                if (isPure(step) && (isPure(step.value) || isImpure(step.value))) step = step.value;
            }
            return isPure(step) ? step.value : step;
        };
        return typeof target === 'function' ? stackSafe(execute, target) : execute(target);
    };
    const runAsync = runner => target => {
        const execute = async program => {
            let step = program;
            while (isImpure(step)) {
                step = await runner(step.functor);
                if (isPure(step) && (isPure(step.value) || isImpure(step.value))) step = step.value;
            }
            return isPure(step) ? step.value : step;
        };
        return typeof target === 'function' ? stackSafe(execute, target) : execute(target);
    };
    class Thunk {
        constructor(f) {
            fp.assertFunction('Thunk', 'a function', f);
            this.f = f;
            this[Symbol.toStringTag] = 'Thunk';
            this[fp.Types.Functor] = true;
        }
        map(g) { return new Thunk(fp.compose(g, this.f)); }
        run() { return this.f(); }
    }
    const done = value => pure(value);
    const suspend = f => liftF(new Thunk(f));
    const trampoline = runSync(thunk => thunk.run());
    return {
        free: {
            pure, impure, isPure, isImpure, liftF,
            runSync, runAsync, trampoline, done, suspend,
        },
    };
};
if (typeof module !== 'undefined' && module.exports) module.exports = $free;