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
    const runSync = runner => program => {
        let step = program;
        while (isImpure(step)) {
            step = runner(step.functor);
            if (isPure(step) && (isPure(step.value) || isImpure(step.value))) step = step.value;
        }
        return isPure(step) ? step.value : step;
    };
    const runAsync = runner => async program => {
        let step = program;
        while (isImpure(step)) {
            step = await runner(step.functor);
            if (isPure(step) && (isPure(step.value) || isImpure(step.value))) step = step.value;
        }
        return isPure(step) ? step.value : step;
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
    const stackSafe = (runner, f, onReentry = f) => {
        let active = false;
        return (...args) => {
            if (active) return onReentry(...args);
            active = true;
            try { return runner(f(...args)); }
            finally { active = false; }
        };
    };
    const trampoline = program => {
        assertFunction('trampoline', 'a function', program);
        return stackSafe(runSync(thunk => thunk.run()), program);
    };
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
    };
};
if (typeof module !== 'undefined' && module.exports) module.exports = $free;