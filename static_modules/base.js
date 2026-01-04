// ========== Core Utilities ==========
const typeOf = a => {
    if (a === null) { return 'null'; }
    const typeName = typeof a;
    if (typeName !== 'object') { return typeName; }
    if (Array.isArray(a)) { return 'Array'; }
    if (a._typeName) { return a._typeName; }
    return a.constructor && a.constructor.name || 'object';
};
const raise = e => { throw e; };
const isSameType = (a, b, typeName = '') => typeName ? typeOf(a) === typeName && typeOf(b) === typeName : typeOf(a) === typeOf(b);
const register = (target, instance, ...aliases) => {
    target[instance.constructor.name] = instance;
    for (const alias of aliases) { target[alias.toLowerCase()] = instance; }
};
const isFunction = f => typeof f === 'function';
const isIterable = a => a != null && typeof a[Symbol.iterator] === 'function';

// ========== Function Utilities ==========
const identity = x => x;
const constant = x => () => x;
const tuple = (...args) => args;
const compose = (f, g) => x => f(g(x));
const composeN = (...fs) => fs.length === 0 ? identity : fs.reduce(compose);
const pipe = (f, g) => x => g(f(x));
const pipeN = (...fs) => fs.length === 0 ? identity : fs.reduce((a, b) => x => b(a(x)));
const curry = f => a => b => f(a, b);
const curryN = (f, arity = f.length) => {
    const _curry = (...args) => args.length >= arity ? f(...args) : (...next) => _curry(...args, ...next);
    return _curry;
};
const partial = (f, ...args) => (...next) => f(...args, ...next);
const flip = f => (a, b, ...rest) => f(b, a, ...rest);
const flipC = f => a => b => f(b)(a);
const flipCV = f => (...as) => (...bs) => f(...bs)(...as);
const negate = f => (...args) => !f(...args);

const runCatch = (f, onError = e => { throw e; }) => (...args) => {
    try { return f(...args); }
    catch (e) { return onError(e); }
};
const predicate = (f, fallbackValue = false) => (...args) => {
    try { return Boolean(f(...args)); }
    catch (_) { return fallbackValue; }
};
const once = (f, option = {}) => {
    const state = option.state || { called: false };
    let result = option.defaultValue;
    return (...args) => {
        if (!state.called) { result = f(...args); state.called = true; }
        return result;
    };
};
const converge = (f, ...branches) => (...args) => f(...branches.map(branch => branch(...args)));
const tap = (f, g) => x => { runCatch(f)(x); runCatch(g)(x); return x; };
const tapN = (...fs) => x => { fs.forEach(f => runCatch(f)(x)); return x; };

// ========== Array/Object Utilities ==========
const range = n => n >= 0 ? Array.from({ length: n }, (_, i) => i) : [];
const rangeBy = (start, end) => start >= end ? [] : range(end - start).map(i => start + i);
const hasFunctions = (...extractors) => obj => obj && extractors.every(extract => isFunction(extract(obj)));

// ========== Transducer ==========
class Reduced {
    constructor(value) { this.value = value; }
    static of(value) { return new Reduced(value); }
    static isReduced(value) { return value instanceof Reduced; }
}
const transducer = {
    Reduced,
    of: Reduced.of,
    isReduced: Reduced.isReduced,
    transduce: xform => reducer => init => coll => {
        if (!isIterable(coll)) { raise(new TypeError(`transduce: expected iterable, got ${typeOf(coll)}`)); }
        const xf = xform(reducer);
        let acc = init;
        for (const item of coll) {
            acc = xf(acc, item);
            if (Reduced.isReduced(acc)) { return acc.value; }
        }
        return acc;
    },
    map: f => reducer => (acc, val) => reducer(acc, f(val)),
    filter: p => reducer => (acc, val) => p(val) ? reducer(acc, val) : acc,
    take: count => reducer => {
        let taken = 0;
        return (acc, val) => {
            if (taken < count) {
                taken++;
                const result = reducer(acc, val);
                return taken === count ? Reduced.of(result) : result;
            }
            return Reduced.of(acc);
        };
    }
};

// ========== ES6 Polyfills ==========
const es6 = {
    array: {
        flatMap: (f, arr) => arr.reduce((acc, x) => acc.concat(f(x)), [])
    },
    object: {
        fromEntries: entries => entries.reduce((obj, [k, v]) => (obj[k] = v, obj), {}),
        entries: obj => Object.keys(obj).map(k => [k, obj[k]]),
        values: obj => Object.keys(obj).map(k => obj[k]),
        filter: (pred, obj) => es6.object.fromEntries(es6.object.entries(obj).filter(([k, v]) => pred(v, k)))
    }
};

// ========== Template ==========
const template = (message, data) => message.replace(/\{\{([^}]+)\}\}/g, (match, keyStr) => {
    const keys = keyStr.split('.').map(k => k.trim());
    let val = data;
    for (const k of keys) { if (val == null) return match; val = val[k]; }
    return val == null ? match : val;
});

module.exports = {
    // Core
    typeOf, raise, isSameType, register, isFunction, isIterable,
    // Function utilities
    identity, constant, tuple, compose, composeN, pipe, pipeN,
    curry, curryN, partial, flip, flipC, flipCV, negate,
    runCatch, predicate, once, converge, tap, tapN,
    // Array/Object
    range, rangeBy, hasFunctions,
    // Transducer
    Reduced, transducer,
    // ES6
    es6,
    // Extra
    template
};
