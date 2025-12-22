const $func = (dependencies = {}) => {
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
    return {
        Types,
        raise,
        isFunction,
        isPlainObject,
        assertFunction,
        hasFunctions,
        isFunctor,
        isApplicative,
        isMonad,
        identity,
        constant,
        partial,
        negate,
        flip,
        curry,
        pipe,
        compose,
        once,
        converge,
        runCatch,
        runOrDefault,
        predicate,
        capture,
        tap,
        also,
        useOrLift,
        useArrayOrLift,
        range,
        rangeBy,
    };
};
if (typeof module !== 'undefined' && module.exports) module.exports = $func;