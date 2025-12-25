const funFpJs = (dependencies = {}) => {
    const log = typeof dependencies.log === 'function' ? dependencies.log : console.log;
    const Types = { Functor: Symbol.for('fun-fp-js/Functor'), Applicative: Symbol.for('fun-fp-js/Applicative'), Monad: Symbol.for('fun-fp-js/Monad') };
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
    const isFunctor = hasFunctions([obj => obj.map], obj => obj[Types.Functor]);
    const isApplicative = hasFunctions([obj => obj.map, obj => obj.ap], obj => obj[Types.Functor] && obj[Types.Applicative]);
    const isMonad = hasFunctions([obj => obj.map, obj => obj.flatMap], obj => obj[Types.Functor] && obj[Types.Monad]);
    const identity = x => x;
    const constant = x => () => x;
    const tuple = (...args) => args;
    const apply = f => {
        assertFunction('apply', 'a function', f);
        return args => {
            if (!Array.isArray(args)) {
                raise(new TypeError(`apply: expected an array of arguments, but got ${typeof args}`));
            }
            return f(...args);
        };
    };
    const apply2 = f => {
        assertFunction('apply2', 'a function', f);
        return args => {
            if (!Array.isArray(args) || args.length !== 2) {
                raise(new TypeError(`apply2: expected an array of exactly 2 arguments, but got ${Array.isArray(args) ? args.length : typeof args}`));
            }
            return f(args[0], args[1]);
        };
    };
    const unapply = f => {
        assertFunction('unapply', 'a function', f);
        return (...args) => f(args);
    };
    const unapply2 = f => {
        assertFunction('unapply2', 'a function', f);
        return (a, b) => f([a, b]);
    };
    const curry = (f, arity = f.length) => {
        assertFunction('curry', 'a function', f);
        return function _curry(...args) {
            return args.length >= arity ? f(...args) : (...next) => _curry(...args, ...next);
        };
    };
    const curry2 = f => {
        assertFunction('curry2', 'a function', f);
        return a => b => f(a, b);
    };
    const uncurry = f => {
        assertFunction('uncurry', 'a function', f);
        return (...args) => args.reduce((acc, arg, i) => {
            if (!isFunction(acc)) {
                raise(new TypeError(`uncurry: expected a curried function (function returning functions), but got ${typeof acc} before applying argument ${i}`));
            }
            return acc(arg);
        }, f);
    };
    const uncurry2 = f => {
        assertFunction('uncurry2', 'a function', f);
        return (a, b) => {
            const next = f(a);
            if (!isFunction(next)) {
                raise(new TypeError(`uncurry2: expected a curried function (function returning a function), but got ${typeof next}`));
            }
            return next(b);
        };
    };
    const partial = (f, ...args) => {
        assertFunction('partial', 'a function', f);
        return (...next) => f(...args, ...next);
    };
    const predicate = (f, fallbackValue = false) => {
        if (!isFunction(f)) return (..._) => Boolean(fallbackValue);
        return (...args) => {
            const result = runCatch(f, _ => fallbackValue)(...args);
            if (result instanceof Promise || (result && typeof result.then === 'function')) {
                log(new TypeError('predicate: Async functions (Promises) are not supported in sync predicate.'));
                return Boolean(fallbackValue);
            }
            return Boolean(result);
        };
    };
    const negate = f => {
        assertFunction('negate', 'a function', f);
        return (...args) => !f(...args);
    };
    const flip = f => {
        assertFunction('flip', 'a function', f);
        return (...args) => f(...args.slice().reverse());
    };
    const flip2 = f => {
        assertFunction('flip2', 'a function', f);
        return (a, b, ...args) => f(b, a, ...args);
    };
    const flipC = f => {
        assertFunction('flipC', 'a function', f);
        return a => b => f(b)(a);
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
                const val = f(...args);
                result = val;
                called = true;
            }
            return result;
        };
    };
    const converge = (f, ...branches) => {
        assertFunction('converge', 'a function', f);
        assertFunction('converge', 'all branch arguments to be functions', ...branches);
        return (...args) => f(...branches.map(branch => branch(...args)));
    };
    const runOrDefault = fallbackValue => g => isFunction(g) ? runCatch(g, _ => fallbackValue)() : fallbackValue;
    const capture = (...args) => (f, onError = e => log(e)) => runCatch(f, onError)(...args);
    const tap = (...fs) => {
        assertFunction('tap', 'all arguments to be functions', ...fs);
        return x => {
            const runAgainstX = f => runCatch(f)(x);
            fs.forEach(runAgainstX);
            return x;
        };
    };
    const also = x => (...fs) => tap(...fs)(x);
    const into = x => (...fs) => pipe(...fs)(x);
    const useOrLift = (check, lift) => {
        assertFunction('useOrLift', 'check to be a function', check);
        assertFunction('useOrLift', 'lift to be a function', lift);
        return x => predicate(check)(x) ? x : lift(x);
    };
    const useArrayOrLift = useOrLift(Array.isArray, Array.of);
    const range = n => n >= 0 ? Array.from({ length: n }, (_, i) => i) : [];
    const rangeBy = (start, end) => start >= end ? [] : range(end - start).map(i => start + i);
    class Left {
        constructor(value) {
            this.value = value;
            this[Symbol.toStringTag] = 'Left';
            this[Types.Functor] = true;
            this[Types.Applicative] = true;
            this[Types.Monad] = true;
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
        constructor(value) {
            this.value = value;
            this[Symbol.toStringTag] = 'Right';
            this[Types.Functor] = true;
            this[Types.Applicative] = true;
            this[Types.Monad] = true;
        }
        map(f) { return eitherCatch(f)(this.value); }
        mapLeft() { return this; }
        flatMap(f) { return runCatch(compose(checkEither, f), left)(this.value); }
        filter(f, onError = () => 'filter: predicate failed') { return predicate(f)(this.value) ? this : runCatch(compose(left, onError), left)(this.value); }
        fold(_, onRight) {
            assertFunction('fold', 'a function', onRight);
            return onRight(this.value);
        }
        /**
         * Apply the function wrapped in Right to another Either.
         * Throws TypeError if this.value is not a function (Developer Error).
         */
        ap(v) {
            if (v instanceof Left) return v;
            if (v instanceof Right) return eitherCatch(this.value)(v.value);
            else return eitherCatch(this.value)(v);
        }
        getOrElse(_) { return this.value; }
        isLeft() { return false; }
        isRight() { return true; }
        tapLeft(_) { return this; }
    }
    const hasConcat = hasFunctions([obj => obj.concat]);
    const checkEither = v => (v instanceof Left || v instanceof Right)
        ? v : raise(new Error(`checkEither: expected Either, got ${typeof v}`));
    const left = e => new Left(useArrayOrLift(e).map(v =>
        v instanceof Error ? v : new Error(typeof v === 'string' ? v : 'Left Error', { cause: v })
    ));
    const right = x => new Right(x);
    const eitherCatch = (f, lift = right) => {
        assertFunction('eitherCatch', 'a function', f);
        const tryRight = compose(lift, f);
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
            return eitherCatch(() => arr.reduce(M.concat, M.empty))();
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
            return eitherCatch(() => M.concat(a, b))();
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
            return eitherCatch(() => M.invert(value))();
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
            return eitherCatch(() => range(nth).reduce(acc => M.concat(acc, value), M.empty))();
        };
    };
    class Pure {
        constructor(value) {
            this.value = value;
            this[Symbol.toStringTag] = 'Pure';
            this[Types.Functor] = true;
            this[Types.Monad] = true;
        }
        map(f) { return new Pure(f(this.value)); }
        flatMap(f) { return f(this.value); }
    }
    class Impure {
        constructor(functor) {
            isFunctor(functor) || raise(new Error(`impure: expected a functor`));
            this.functor = functor;
            this[Symbol.toStringTag] = 'Impure';
            this[Types.Functor] = true;
            this[Types.Monad] = true;
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
            assertFunction('Thunk', 'a function', f);
            this.f = f;
            this[Symbol.toStringTag] = 'Thunk';
            this[Types.Functor] = true;
        }
        map(g) { return new Thunk(compose(g, this.f)); }
        run() { return this.f(); }
    }
    const done = value => pure(value);
    const suspend = f => liftF(new Thunk(f));
    const trampoline = runSync(thunk => thunk.run());
    const template = (message, data) => message.replace(/\{\{([^}]+)\}\}/g,
        (match, key) => key.split('.').reduce((acc, prop) =>
            acc.flatMap(obj => fromNullable(obj[prop.trim()])),
            fromNullable(data)
        ).fold(_ => match, identity));
    return {
        core: {
            Types, raise, isFunction, isPlainObject, assertFunction, hasFunctions,
            isFunctor, isApplicative, isMonad, identity, constant, tuple,
            apply, unapply, apply2, unapply2, curry, uncurry, curry2, uncurry2,
            partial, predicate, negate, flip, flip2, flipC,
            pipe, compose, once, converge, catch: runCatch, runOrDefault, capture,
            tap, also, into, useOrLift, useArrayOrLift, range, rangeBy,
        },
        either: {
            left, right, catch: eitherCatch, from, fromNullable,
            validate, validateAll, sequence, pipeK, traverse, traverseAll,
        },
        monoid: {
            ...of, isMonoid, fold, concat, invert, power,
        },
        free: {
            pure, impure, isPure, isImpure, liftF,
            runSync, runAsync, trampoline, done, suspend,
        },
        extra: {
            template,
        },
    };
};
if (typeof module !== 'undefined' && module.exports) module.exports = funFpJs;