const $free = (dependencies = {}) => {
    const { isFunctor, assertFunction, raise, Types, compose } = dependencies.$func;
    class Pure {
        [Symbol.toStringTag] = 'Pure';
        [Types.Functor] = true;
        [Types.Monad] = true;
        constructor(value) { this.value = value; }
        map(f) { return new Pure(f(this.value)); }
        flatMap(f) { return f(this.value); }
    }
    class Impure {
        [Symbol.toStringTag] = 'Impure';
        [Types.Functor] = true;
        [Types.Monad] = true;
        constructor(functor) {
            isFunctor(functor) || raise(new Error(`impure: expected a functor`));
            this.functor = functor;
        }
        map(f) { return new Impure(this.functor.map(free => free.map(f))); }
        flatMap(f) { return new Impure(this.functor.map(free => free.flatMap(f))); }
    }
    const pure = x => new Pure(x);
    const impure = functor => new Impure(functor);
    const isPure = x => x instanceof Pure;
    const isImpure = x => x instanceof Impure;
    const liftF = command => {
        isFunctor(command) || raise(new Error(`liftF: expected a functor`));
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
    const runSync = runner => (target) => {
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
    const runAsync = runner => (target) => {
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
        [Symbol.toStringTag] = 'Thunk';
        [Types.Functor] = true;
        constructor(f) {
            assertFunction('Thunk', 'a function', f);
            this.f = f;
        }
        map(g) { return new Thunk(compose(g, this.f)); }
        run() { return this.f(); }
    }
    const done = value => pure(value);
    const suspend = f => liftF(new Thunk(f));
    const trampoline = runSync(thunk => thunk.run());
    return {
        pure,
        impure,
        isPure,
        isImpure,
        liftF,
        runSync,
        runAsync,
        trampoline,
        done,
        suspend,
        stackSafe, // 필요할 경우 직접 쓸 수 있도록 노출 유지
    };
};
if (typeof module !== 'undefined' && module.exports) module.exports = $free;