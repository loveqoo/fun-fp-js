const funFpJs = (dependencies = {}) => {
    const log = typeof dependencies.log === 'function' ? dependencies.log : console.log;
    const Types = { Functor: Symbol('fun-fp-js/Functor'), Applicative: Symbol('fun-fp-js/Applicative'), Monad: Symbol('fun-fp-js/Monad') };
    const raise = e => { throw e; };
    const isFunction = f => typeof f === 'function';
    const isPlainObject = a => typeof a === 'object' && a !== null && !Array.isArray(a) && Object.getPrototypeOf(a) === Object.prototype;
    const assertFunction = (name, expected, ...fs) => {
        const invalids = fs.map((f, i) => [i, f]).filter(([_, f]) => !isFunction(f)).map(([i, f]) => `argument ${i} is ${typeof f}`);
        if (invalids.length > 0) raise(new TypeError(`${name}: expected ${expected}, but ${invalids.join(', ')}`));
        return fs;
    };
    const hasFunctions = (extracts, check = _ => true) => {
        assertFunction('hasFunctions', 'extracts to be functions', ...extracts);
        return obj => obj && extracts.every(extract => isFunction(extract(obj))) && check(obj);
    };
    const isFunctor = hasFunctions([obj => obj.map], obj => obj[Types.Functor]);
    const isApplicative = hasFunctions([obj => obj.map, obj => obj.ap], obj => obj[Types.Functor] && obj[Types.Applicative]);
    const isMonad = hasFunctions([obj => obj.map, obj => obj.flatMap], obj => obj[Types.Functor] && obj[Types.Monad]);
    const identity = x => x;
    const constant = x => () => x;
    const partial = (f, ...args) => {
        assertFunction('partial', 'a function', f);
        return (...next) => f(...args, ...next);
    };
    const negate = f => {
        assertFunction('negate', 'a function', f);
        return (...args) => !f(...args);
    };
    const flip = f => {
        assertFunction('flip', 'a function', f);
        return (a, b, ...args) => f(b, a, ...args);
    };
    const curry = (f, arity = f.length) => {
        assertFunction('curry', 'a function', f);
        return function _curry(...args) {
            return args.length >= arity ? f(...args) : (...next) => _curry(...args, ...next);
        };
    };
    const pipe = (...fs) => {
        if (fs.length === 0) return identity;
        assertFunction('pipe', 'all arguments to be functions', ...fs);
        return x => fs.reduce((acc, f) => f(acc), x);
    };
    const compose = (...fs) => pipe(...fs.slice().reverse());
    const once = f => {
        assertFunction('once', 'a function', f);
        let called = false, result;
        return (...args) => {
            if (!called) {
                called = true;
                result = f(...args);
            }
            return result;
        };
    };
    const converge = (f, ...branches) => {
        assertFunction('converge', 'a function', f);
        assertFunction('converge', 'all branch arguments to be functions', ...branches);
        return (...args) => f(...branches.map(branch => branch(...args)));
    };
    const runCatch = (f, onError = e => log(e)) => {
        assertFunction('runCatch', 'a function', f);
        assertFunction('runCatch', 'onError to be a function', onError);
        return (...args) => {
            try {
                return f(...args);
            } catch (e) {
                return onError(e);
            }
        };
    };
    const runOrDefault = fallbackValue => g => isFunction(g) ? runCatch(g, _ => fallbackValue)() : fallbackValue;
    const predicate = (f, fallbackValue = false) => isFunction(f) ? v => Boolean(runCatch(f, _ => fallbackValue)(v)) : _ => Boolean(fallbackValue);
    const capture = (...args) => (f, onError = e => log(e)) => runCatch(f, onError)(...args);
    const tap = (...fs) => {
        assertFunction('tap', 'all arguments to be functions', ...fs);
        return x => {
            const runAgainstX = f => runCatch(f)(x);
            fs.forEach(runAgainstX);
            return x;
        };
    };
    const also = flip(tap);
    const useOrLift = (check, lift) => {
        assertFunction('useOrLift', 'check to be a function', check);
        assertFunction('useOrLift', 'lift to be a function', lift);
        return x => predicate(check)(x) ? x : lift(x);
    };
    const useArrayOrLift = useOrLift(Array.isArray, Array.of);
    const range = n => n >= 0 ? Array.from({ length: n }, (_, i) => i) : [];
    const rangeBy = (start, end) => start >= end ? [] : range(end - start).map(i => start + i);
    class Left {
        [Symbol.toStringTag] = 'Left';
        [Types.Functor] = true;
        [Types.Applicative] = true;
        [Types.Monad] = true;
        constructor(value) {
            this.value = value;
        }
        map() { return this; }
        mapLeft(f) { return compose(left, runCatch(f, identity))(this.value); }
        flatMap() { return this; }
        filter() { return this; }
        fold(onLeft, _) {
            assertFunction('fold', 'a function', onLeft);
            return onLeft(this.value);
        }
        ap(v) {
            return (v instanceof Left && hasConcat(this.value) && hasConcat(v.value)) ? left(this.value.concat(v.value)) : this;
        }
        getOrElse(v) { return v; }
        isLeft() { return true; }
        isRight() { return false; }
        tapLeft(f) {
            runCatch(f)(this.value);
            return this;
        }
    }
    class Right {
        [Symbol.toStringTag] = 'Right';
        [Types.Functor] = true;
        [Types.Applicative] = true;
        [Types.Monad] = true;
        constructor(value) {
            this.value = value;
        }
        map(f) { return attempt(f)(this.value); }
        mapLeft() { return this; }
        flatMap(f) { return runCatch(compose(checkEither, f), left)(this.value); }
        filter(f, onError = () => 'filter: predicate failed') { return predicate(f)(this.value) ? this : runCatch(compose(left, onError), left)(this.value); }
        fold(_, onRight) {
            assertFunction('fold', 'a function', onRight);
            return onRight(this.value);
        }
        ap(v) {
            if (v instanceof Left) return v;
            if (v instanceof Right) return attempt(this.value)(v.value);
            else return attempt(this.value)(v);
        }
        getOrElse(_) { return this.value; }
        isLeft() { return false; }
        isRight() { return true; }
        tapLeft(_) { return this; }
    }
    const hasConcat = hasFunctions([obj => obj.concat]);
    const checkEither = v => (v instanceof Left || v instanceof Right)
        ? v : raise(new Error(`checkEither: expected Either, got ${typeof v}`));
    const left = e => new Left(useArrayOrLift(e).map(v => v instanceof Error ? v : new Error(String(v))));
    const right = x => new Right(x);
    const attempt = f => {
        assertFunction('attempt', 'a function', f);
        const tryRight = compose(right, f);
        return runCatch(tryRight, left);
    };
    const _from = (checkNull, name = 'from') => x => {
        if (checkNull && (x === null || x === undefined)) return left(new Error(`${name}: expected a value, got ${x}`));
        if (x instanceof Left || x instanceof Right) return x;
        return right(x);
    };
    const from = _from(false);
    const fromNullable = _from(true, 'fromNullable');
    const validate = (condition, onError) => {
        assertFunction('validate', 'condition to be a function', condition);
        assertFunction('validate', 'onError to be a function', onError);
        return x => predicate(condition)(x) ? right(x) : runCatch(compose(left, onError), left)(x);
    };
    const validateAll = list => useArrayOrLift(list).reduce((acc, x) => {
        if (x instanceof Left || x instanceof Right) {
            return right(a => b => [...a, b]).ap(acc).ap(x);
        }
        return raise(new Error(`validateAll: expected Either, got ${typeof x}`));
    }, right([]));
    const sequence = list => {
        let acc = [];
        for (const x of useArrayOrLift(list)) {
            if (x instanceof Right) {
                acc.push(x.value);
            } else if (x instanceof Left) {
                return x;
            } else {
                return raise(new Error(`sequence: expected Either, got ${typeof x}`));
            }
        }
        return right(acc);
    };
    const pipeK = (...fs) => {
        if (fs.length === 0) return from;
        assertFunction('pipeK', 'all arguments to be functions', ...fs);
        return x => fs.reduce((acc, f) => acc.flatMap(f), from(x));
    };
    const traverse = f => {
        assertFunction('traverse', 'a function', f);
        return list => sequence(useArrayOrLift(list).map(f));
    };
    const traverseAll = f => {
        assertFunction('traverseAll', 'a function', f);
        return list => validateAll(useArrayOrLift(list).map(f));
    };
    const monoid = (check, concat, empty) => ({ check, concat, empty });
    const group = (check, concat, empty, invert) => ({ check, concat, empty, invert });
    const of = {
        number: {
            sum: group(a => typeof a === 'number', (a, b) => a + b, 0, a => -a),
            product: group(a => typeof a === 'number', (a, b) => a * b, 1, a => 1 / a),
            max: monoid(a => typeof a === 'number', (a, b) => Math.max(a, b), -Infinity),
            min: monoid(a => typeof a === 'number', (a, b) => Math.min(a, b), Infinity),
        },
        string: {
            concat: monoid(a => typeof a === 'string', (a, b) => a + b, ""),
        },
        boolean: {
            any: monoid(a => typeof a === 'boolean', (a, b) => a || b, false),
            all: monoid(a => typeof a === 'boolean', (a, b) => a && b, true),
            xor: group(a => typeof a === 'boolean', (a, b) => a !== b, false, a => a),
        },
        array: {
            concat: monoid(a => Array.isArray(a), (a, b) => a.concat(b), []),
        },
        object: {
            merge: monoid(isPlainObject, (a, b) => ({ ...a, ...b }), {}),
        },
        function: {
            endo: monoid(isFunction, compose, identity),
        },
        any: {
            first: monoid(_ => true, (a, _) => a, null),
            last: monoid(_ => true, (_, b) => b, null),
        },
    };
    const isMonoid = obj => obj && isFunction(obj.check) && isFunction(obj.concat) && 'empty' in obj;
    const fold = (M, f = identity) => {
        if (!isMonoid(M)) {
            return () => left(new TypeError('fold: expected a monoid'));
        }
        return list => {
            const arr = useArrayOrLift(list).map(f);
            if (arr.length === 0) return right(M.empty);
            if (!arr.every(M.check)) return left(new TypeError('fold: expected an array of values of the same type'));
            return attempt(() => arr.reduce(M.concat, M.empty))();
        };
    };
    const concat = M => {
        if (!isMonoid(M)) {
            return () => left(new TypeError('concat: expected a monoid'));
        }
        return (a, b) => {
            if (!M.check(a) || !M.check(b)) {
                return left(new TypeError('concat: expected values of the same type'));
            }
            return attempt(() => M.concat(a, b))();
        };
    };
    const invert = M => {
        if (!isMonoid(M)) {
            return () => left(new TypeError('invert: expected a monoid'));
        }
        if (!('invert' in M)) {
            return () => left(new TypeError('invert: expected a monoid with an invert function'));
        }
        return value => {
            if (!M.check(value)) return left(new TypeError('invert: expected a value of the same type'));
            return attempt(() => M.invert(value))();
        };
    };
    const power = M => {
        if (!isMonoid(M)) {
            return () => left(new TypeError('power: expected a monoid'));
        }
        return (value, nth) => {
            if (!M.check(value)) return left(new TypeError('power: expected a value of the same type'));
            if (typeof nth !== 'number') return left(new TypeError('power: expected a number'));
            if (nth < 0) return left(new TypeError('power: expected a non-negative number'));
            if (nth === 0) return right(M.empty);
            return attempt(() => range(nth).reduce(acc => M.concat(acc, value), M.empty))();
        };
    };
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
    const template = (message, data) => message.replace(/\{\{([^}]+)\}\}/g,
        (match, key) => key.split('.').reduce((acc, prop) =>
            acc.flatMap(obj => fromNullable(obj[prop])),
            fromNullable(data)
        ).fold(_ => match, identity));
    return {
        Types,
        raise, isFunction, isPlainObject, assertFunction, hasFunctions,
        isFunctor, isApplicative, isMonad,
        identity, constant, partial, negate,
        flip, curry, pipe, compose, once, converge,
        runCatch, runOrDefault, predicate, capture,
        tap, also, useOrLift, useArrayOrLift, range, rangeBy,
        left, right, attempt, from, fromNullable,
        validate, validateAll, sequence, pipeK, traverse, traverseAll,
        ...of, isMonoid, fold, concat, invert, power, pure, impure, isPure, isImpure,
        liftF, runSync, runAsync, trampoline, done, suspend,
        template,
    };
};
if (typeof module !== 'undefined' && module.exports) module.exports = funFpJs;