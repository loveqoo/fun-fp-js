const types = {
    of: a => {
        if (a === null) { return 'null'; }
        const typeName = typeof a;
        if (typeName !== 'object') { return typeName; }
        if (Array.isArray(a)) { return 'Array'; }
        if (a._typeName) { return a._typeName; }
        return a.constructor && a.constructor.name || 'object';
    },
    equals: (a, b, typeName = '') => typeName ? types.of(a) === typeName && types.of(b) === typeName : types.of(a) === types.of(b),
    check: (val, expected) => {
        if (expected === 'any') return true;
        const actual = types.of(val);
        return actual === expected || actual.toLowerCase() === expected.toLowerCase();
    },
    isFunction: f => typeof f === 'function',
};
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
const identity = x => x;
const compose = (f, g) => x => f(g(x));
const raise = e => { throw e; };
const register = (target, instance, ...aliases) => {
    target[instance.constructor.name] = instance;
    for (const alias of aliases) { target[alias.toLowerCase()] = instance; }
};
export default {
    types,
    identity,
    compose,
    raise,
    register,
    es6,
};