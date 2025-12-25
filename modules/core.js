const $core = (dependencies = {}) => {
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
    return {
        core: {
            Types, raise, isFunction, isPlainObject, assertFunction, hasFunctions,
            isFunctor, isApplicative, isMonad, identity, constant, tuple,
            apply, unapply, apply2, unapply2, curry, uncurry, curry2, uncurry2,
            partial, predicate, negate, flip, flip2, flipC,
            pipe, compose, once, converge, catch: runCatch, runOrDefault, capture,
            tap, also, into, useOrLift, useArrayOrLift, range, rangeBy,
        },
    };
};
if (typeof module !== 'undefined' && module.exports) module.exports = $core;