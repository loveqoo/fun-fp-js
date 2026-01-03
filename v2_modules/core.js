const $core = (dependencies = {}) => {
    // @build-start
    const isFunction = f => typeof f === 'function';
    const log = dependencies.enableLog === false ? () => { } : (isFunction(dependencies.log) ? dependencies.log : console.log);
    const Types = { Functor: Symbol.for('fun-fp-js/Functor'), Applicative: Symbol.for('fun-fp-js/Applicative'), Monad: Symbol.for('fun-fp-js/Monad') };
    const raise = e => { throw e; };
    const typeOf = a => {
        if (a === null) { return 'null'; }
        const typeName = typeof a;
        if (typeName !== 'object') { return typeName; }
        if (Array.isArray(a)) { return 'Array'; }
        return a.constructor && a.constructor.name || 'object';
    };
    const isPlainObject = a => typeof a === 'object' && a !== null && !Array.isArray(a) && Object.getPrototypeOf(a) === Object.prototype;
    const isIterable = a => a != null && typeof a[Symbol.iterator] === 'function';
    const toIterator = function* (iterable) {
        if (iterable == null) return;
        if (isIterable(iterable)) {
            yield* iterable;
        } else if (isPlainObject(iterable)) {
            for (const key in iterable) {
                if (Object.prototype.hasOwnProperty.call(iterable, key)) {
                    yield iterable[key];
                }
            }
        } else {
            yield iterable;
        }
    };
    const expectedFunction = expected => name => (...fs) => {
        const invalids = fs.map((f, i) => [i, f]).filter(([_, f]) => !isFunction(f)).map(([i, f]) => `argument ${i} is ${typeOf(f)}`);
        if (invalids.length > 0) raise(new TypeError(`${name}: expected ${expected}, but ${invalids.join(', ')}`));
        return fs; // array
    };
    const expectedFunctions = {
        'core:a-function': expectedFunction('a function'),
        'core:extracts-to-be-functions': expectedFunction('extracts to be functions'),
        'core:on-error-to-be-a-function': expectedFunction('onError to be a function'),
        'core:all-arguments-to-be-functions': expectedFunction('all arguments to be functions'),
        'core:all-branch-arguments-to-be-functions': expectedFunction('all branch arguments to be functions'),
        'core:check-to-be-a-function': expectedFunction('check to be a function'),
        'core:lift-to-be-a-function': expectedFunction('lift to be a function'),
        'core:transducer-to-be-a-function': expectedFunction('transducer to be a function'),
        'core:reducer-to-be-a-function': expectedFunction('reducer to be a function'),
    };
    const hasFunctions = (extracts, check = _ => true) => obj => obj
        && expectedFunctions['core:extracts-to-be-functions']('hasFunction')(...extracts).every(extract => isFunction(extract(obj)))
        && check(obj);
    const runCatch = (f, onError = e => log(e)) => {
        expectedFunctions['core:a-function']('runCatch:f')(f);
        expectedFunctions['core:on-error-to-be-a-function']('runCatch:onError')(onError);
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
        expectedFunctions['core:a-function']('apply')(f);
        return args => {
            if (!Array.isArray(args)) {
                raise(new TypeError(`apply: expected an array of arguments, but got ${typeOf(args)}`));
            }
            return f(...args);
        };
    };
    const apply2 = f => {
        expectedFunctions['core:a-function']('apply2')(f);
        return args => {
            if (!Array.isArray(args) || args.length !== 2) {
                raise(new TypeError(`apply2: expected an array of exactly 2 arguments, but got ${Array.isArray(args) ? args.length : typeOf(args)}`));
            }
            return f(args[0], args[1]);
        };
    };
    const unapply = f => (expectedFunctions['core:a-function']('unapply')(f), (...args) => f(args));
    const unapply2 = f => (expectedFunctions['core:a-function']('unapply2')(f), (a, b) => f([a, b]));
    const curry = (f, arity = f.length) => {
        expectedFunctions['core:a-function']('curry')(f);
        return function _curry(...args) {
            return args.length >= arity ? f(...args) : (...next) => _curry(...args, ...next);
        };
    };
    const curry2 = f => (expectedFunctions['core:a-function']('curry2')(f), a => b => f(a, b));
    const uncurry = f => {
        expectedFunctions['core:a-function']('uncurry')(f);
        return (...args) => args.reduce((acc, arg, i) => {
            if (!isFunction(acc)) {
                raise(new TypeError(`uncurry: expected a curried function (function returning functions), but got ${typeOf(acc)} before applying argument ${i}`));
            }
            return acc(arg);
        }, f);
    };
    const uncurry2 = f => {
        expectedFunctions['core:a-function']('uncurry2')(f);
        return (a, b) => {
            const next = f(a);
            if (!isFunction(next)) {
                raise(new TypeError(`uncurry2: expected a curried function (function returning a function), but got ${typeOf(next)}`));
            }
            return next(b);
        };
    };
    const partial = (f, ...args) => (expectedFunctions['core:a-function']('partial')(f), (...next) => f(...args, ...next));
    const predicate = (f, fallbackValue = false) => {
        expectedFunctions['core:a-function']('predicate')(f);
        return (...args) => {
            const result = runCatch(f, _ => fallbackValue)(...args);
            if (result instanceof Promise || (result && typeof result.then === 'function')) {
                log(new TypeError('predicate: Async functions (Promises) are not supported in sync predicate.'));
                return Boolean(fallbackValue);
            }
            return Boolean(result);
        };
    };
    const negate = f => (expectedFunctions['core:a-function']('negate')(f), (...args) => !f(...args));
    const flip = f => (expectedFunctions['core:a-function']('flip')(f), (...args) => f(...args.slice().reverse()));
    const flip2 = f => (expectedFunctions['core:a-function']('flip2')(f), (a, b, ...args) => f(b, a, ...args));
    const flipC = f => (expectedFunctions['core:a-function']('flipC')(f), a => b => f(b)(a));
    const flipCV = f => (expectedFunctions['core:a-function']('flipCV')(f), (...as) => (...bs) => f(...bs)(...as));
    const pipe = (...fs) => {
        if (fs.length === 0) return identity;
        expectedFunctions['core:all-arguments-to-be-functions']('pipe')(...fs);
        return x => fs.reduce((acc, f) => f(acc), x);
    };
    const pipe2 = (f, g) => pipe(f, g);
    const compose = (...fs) => pipe(...fs.slice().reverse());
    const compose2 = (f, g) => compose(f, g);
    const once = (f, option = {}) => {
        expectedFunctions['core:a-function']('once')(f);
        const state = option.state || { called: false };
        const defaultValue = option.defaultValue;
        let result = defaultValue;
        return (...args) => {
            if (!state.called) {
                const val = f(...args);  // 예외 발생 시 called가 true가 되지 않음
                result = val;
                state.called = true;
            }
            return result;
        };
    };
    const converge = (f, ...branches) => {
        expectedFunctions['core:a-function']('converge:f')(f);
        expectedFunctions['core:all-branch-arguments-to-be-functions']('converge:branches')(...branches);
        return (...args) => f(...branches.map(branch => branch(...args)));
    };
    const runOrDefault = fallbackValue => g => isFunction(g) ? runCatch(g, _ => fallbackValue)() : fallbackValue;
    const capture = (...args) => (f, onError = e => log(e)) => runCatch(f, onError)(...args);
    const tap = (...fs) => {
        expectedFunctions['core:all-arguments-to-be-functions']('tap')(...fs);
        return x => {
            const runAgainstX = f => runCatch(f)(x);
            fs.forEach(runAgainstX);
            return x;
        };
    };
    const also = flipCV(tap);
    const into = flipCV(pipe);
    const useOrLift = (check, lift) => {
        expectedFunctions['core:check-to-be-a-function']('useOrLift:check')(check);
        expectedFunctions['core:lift-to-be-a-function']('useOrLift:lift')(lift);
        return x => predicate(check)(x) ? x : lift(x);
    };
    const useArrayOrLift = useOrLift(Array.isArray, Array.of);
    const range = n => n >= 0 ? Array.from({ length: n }, (_, i) => i) : [];
    const rangeBy = (start, end) => start >= end ? [] : range(end - start).map(i => start + i);
    const { transducer } = (() => {
        class Reduced {
            constructor(value) { this.value = value; }
            static of(value) { return new Reduced(value); }
            static isReduced(value) { return value instanceof Reduced; }
        }
        const transduce = transducer => {
            expectedFunctions['core:transducer-to-be-a-function']('transducer.transduce:transducer')(transducer);
            return reducer => {
                expectedFunctions['core:reducer-to-be-a-function']('transducer.transduce:reducer')(reducer);
                return initialValue => collection => {
                    if (!isIterable(collection)) {
                        raise(new TypeError(`transduce: expected an iterable, but got ${typeof collection}`));
                    }
                    const transformedReducer = transducer(reducer);
                    let accumulator = initialValue;
                    for (const item of collection) {
                        accumulator = transformedReducer(accumulator, item);
                        if (Reduced.isReduced(accumulator)) {
                            return accumulator.value;
                        }
                    }
                    return accumulator;
                };
            };
        };
        const map = f => (expectedFunctions['core:a-function']('transducer.map')(f), reducer => (acc, val) => reducer(acc, f(val)));
        const filter = p => (expectedFunctions['core:a-function']('transducer.filter')(p), reducer => (acc, val) => p(val) ? reducer(acc, val) : acc);
        const take = count => {
            if (typeof count !== 'number' || !Number.isInteger(count) || count < 1) {
                raise(new TypeError(`transducer.take: expected a positive integer (>= 1), but got ${count}`));
            }
            return reducer => {
                let taken = 0;
                return (accumulator, value) => {
                    if (taken < count) {
                        taken++;
                        const result = reducer(accumulator, value);
                        return taken === count ? Reduced.of(result) : result;
                    }
                    return Reduced.of(accumulator);
                };
            };
        };
        return {
            transducer: {
                Reduced, of: Reduced.of, isReduced: Reduced.isReduced, transduce, map, filter, take,
            },
        };
    })();
    return {
        core: {
            Types, raise, typeOf, isFunction, isPlainObject, isIterable, toIterator, expectedFunction, expectedFunctions, hasFunctions,
            isFunctor, isApplicative, isMonad, identity, constant, tuple,
            apply, unapply, apply2, unapply2, curry, uncurry, curry2, uncurry2,
            partial, predicate, negate, flip, flip2, flipC, flipCV,
            pipe, pipe2, compose, compose2, once, converge, catch: runCatch, runOrDefault, capture,
            tap, also, into, useOrLift, useArrayOrLift, range, rangeBy, transducer,
        },
    };
};
if (typeof module !== 'undefined' && module.exports) module.exports = $core;