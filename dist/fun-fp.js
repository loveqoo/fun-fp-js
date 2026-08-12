/**
 * Fun-FP-JS - Functional Programming Library
 * Built: 2026-08-12T16:44:20.546Z
 * Static Land specification compliant
 */
const polyfills = {
    array: {
        flatMap: Array.prototype.flatMap
            ? (f, arr) => arr.flatMap(f)
            : (f, arr) => arr.reduce((acc, x) => acc.concat(f(x)), [])
    },
    object: {
        fromEntries: Object.fromEntries
            ? entries => Object.fromEntries(entries)
            : entries => entries.reduce((obj, [k, v]) => (Object.defineProperty(obj, k, {
                value: v, writable: true, enumerable: true, configurable: true
            }), obj), {}),
        entries: Object.entries
            ? obj => Object.entries(obj)
            : obj => Object.keys(obj).map(k => [k, obj[k]]),
        values: Object.values
            ? obj => Object.values(obj)
            : obj => Object.keys(obj).map(k => obj[k]),
        filter: (pred, obj) => polyfills.object.fromEntries(
            polyfills.object.entries(obj).filter(([k, v]) => pred(v, k))
        )
    }
};
const Symbols = {
    Algebra: Symbol.for('fun-fp-js/Algebra'),
    Setoid: Symbol.for('fun-fp-js/Setoid'),
    Ord: Symbol.for('fun-fp-js/Ord'),
    Semigroup: Symbol.for('fun-fp-js/Semigroup'),
    Monoid: Symbol.for('fun-fp-js/Monoid'),
    Group: Symbol.for('fun-fp-js/Group'),
    Semigroupoid: Symbol.for('fun-fp-js/Semigroupoid'),
    Category: Symbol.for('fun-fp-js/Category'),
    Filterable: Symbol.for('fun-fp-js/Filterable'),
    Functor: Symbol.for('fun-fp-js/Functor'),
    Bifunctor: Symbol.for('fun-fp-js/Bifunctor'),
    Contravariant: Symbol.for('fun-fp-js/Contravariant'),
    Profunctor: Symbol.for('fun-fp-js/Profunctor'),
    Apply: Symbol.for('fun-fp-js/Apply'),
    Applicative: Symbol.for('fun-fp-js/Applicative'),
    Alt: Symbol.for('fun-fp-js/Alt'),
    Plus: Symbol.for('fun-fp-js/Plus'),
    Alternative: Symbol.for('fun-fp-js/Alternative'),
    Chain: Symbol.for('fun-fp-js/Chain'),
    ChainRec: Symbol.for('fun-fp-js/ChainRec'),
    Monad: Symbol.for('fun-fp-js/Monad'),
    Foldable: Symbol.for('fun-fp-js/Foldable'),
    Extend: Symbol.for('fun-fp-js/Extend'),
    Comonad: Symbol.for('fun-fp-js/Comonad'),
    Traversable: Symbol.for('fun-fp-js/Traversable'),
    Maybe: Symbol.for('fun-fp-js/Maybe'),
    Either: Symbol.for('fun-fp-js/Either'),
    Task: Symbol.for('fun-fp-js/Task'),
    Free: Symbol.for('fun-fp-js/Free'),
    Pure: Symbol.for('fun-fp-js/Pure'),
    Impure: Symbol.for('fun-fp-js/Impure'),
    Reduced: Symbol.for('fun-fp-js/Reduced'),
    Validation: Symbol.for('fun-fp-js/Validation'),
    Reader: Symbol.for('fun-fp-js/Reader'),
    Writer: Symbol.for('fun-fp-js/Writer'),
    State: Symbol.for('fun-fp-js/State')
};
const types = {
    of: a => {
        if (a == null) return a === null ? 'null' : 'undefined';
        if (a._typeName !== undefined) return a._typeName;
        const typeName = typeof a;
        if (typeName !== 'object') return typeName;
        if (Array.isArray(a)) return 'Array';
        return a.constructor?.name || 'object';
    },
    equals: (a, b, typeName = '') => typeName ? types.of(a) === typeName && types.of(b) === typeName : types.of(a) === types.of(b),
    check: (val, expected) => {
        if (typeof expected !== 'string') return false;
        // 'any' 는 "이 인스턴스는 값 타입을 보지 않는다"는 뜻이다 (first/last 처럼).
        // 인자끼리 같은 타입이어야 한다는 검사는 types.equals 가 따로 하므로 여전히 살아 있다.
        if (expected === 'any') return true;
        const actual = types.of(val);
        return actual === expected || actual.toLowerCase() === expected.toLowerCase();
    },
    isFunction: f => typeof f === 'function',
    checkFunction: (f, msg = '') => {
        types.isFunction(f) || raise(new TypeError(`Argument must be a function${msg ? ': ' + msg : ''}`));
        return f;
    },
    isPlainObject: a => typeof a === 'object' && a !== null && !Array.isArray(a) && Object.getPrototypeOf(a) === Object.prototype,
    isIterable: a => a != null && typeof a[Symbol.iterator] === 'function',
    dateCheckAndGet: d => {
        if (Number.isNaN(d.getTime())) raise(new TypeError('Invalid Date'));
        return d;
    },
};
const emptyFunc = () => { };
const identity = x => x;
const compose2 = (f, g) => x => types.checkFunction(f, 'compose2')(types.checkFunction(g, 'compose2')(x));
const raise = e => { throw e; };
const runCatch = (f, onError = emptyFunc) => (...args) => {
    try { return types.checkFunction(f, 'runCatch')(...args); }
    catch (e) { return onError(e); }
};
const constant = x => () => x;
const tuple = (...args) => args;
const unapply2 = f => (a, b) => types.checkFunction(f, 'unapply2')(a, b);
const curry2 = f => a => b => types.checkFunction(f, 'curry2')(a, b);
const uncurry2 = f => (a, b) => types.checkFunction(f, 'uncurry2')(a)(b);
const predicate = f => x => Boolean(runCatch(types.checkFunction(f, 'predicate'), () => false)(x));
const negate = f => x => !predicate(types.checkFunction(f, 'negate'))(x);
const flip2 = f => (a, b) => types.checkFunction(f, 'flip2')(b, a);
const flipCurried2 = f => a => b => types.checkFunction(f, 'flipCurried2')(b)(a);
const pipe2 = (f, g) => x => types.checkFunction(g, 'pipe2')(types.checkFunction(f, 'pipe2')(x));
const apply = f => args => {
    types.of(args) !== 'Array' && raise(new TypeError('apply: args must be an array'));
    return types.checkFunction(f, 'apply')(...args);
};
const unapply = f => (...args) => types.checkFunction(f, 'unapply')(args);
const curry = (f, arity = f.length) => {
    types.checkFunction(f, 'curry');
    return function _curry(...args) {
        return args.length >= arity ? f(...args) : (...next) => _curry(...args, ...next);
    }
};
const uncurry = f => (...args) => args.reduce((acc, arg, i) => types.checkFunction(acc, `uncurry(${i})`)(arg), f);
const predicateN = f => (...args) => runCatch(f, () => false)(...args);
const negateN = f => (...args) => !predicateN(f)(...args);
const flip = f => (...args) => types.checkFunction(f, 'flip')(...args.slice().reverse());
const flipCurried = f => (...as) => (...bs) => types.checkFunction(f, 'flipCurried')(...bs)(...as);
const pipe = (...fs) => x => fs.reduce((acc, f) => types.checkFunction(f, `pipe(${fs.length})`)(acc), x);
const compose = (...fs) => pipe(...fs.slice().reverse());
const tap = (...fs) => x => (fs.forEach(f => runCatch(f, config.tapErrorHandler)(x)), x);
const also = flipCurried(tap);
const into = flipCurried(pipe);
const partial = (f, ...args) => (...next) => types.checkFunction(f, 'partial')(...args, ...next);
const useOrLift = check => lift => x => predicate(check)(x) ? x : types.checkFunction(lift, 'useOrLift')(x);
const once = f => {
    types.checkFunction(f, 'once');
    let called = false;
    let result;
    return (...args) => {
        if (!called) {
            result = f(...args);
            called = true;
        }
        return result;
    };
};
const converge = (f, ...branches) => (...args) => types.checkFunction(f, 'converge')(...branches.map((branch, i) => types.checkFunction(branch, `converge:${i}`)(...args)));
const range = n => {
    if (n < 0) raise(new RangeError(`range: n must be non-negative, got ${n}`));
    return Array.from({ length: n }, (_, i) => i);
};
const rangeBy = (start, end) => start >= end ? [] : range(end - start).map(i => start + i);
const register = (target, instance, ...aliases) => {
    target[instance.constructor.name] = instance;
    for (const alias of aliases) { target[alias.toLowerCase()] = instance; }
};
const loadedModules = new Set();
const load = (...modules) => {
    for (const module of modules) {
        if (!loadedModules.has(module)) {
            new module();
            loadedModules.add(module);
        }
    }
};
const modules = [];
const DEV = typeof process !== 'undefined' && process.env
    ? process.env.NODE_ENV !== 'production'
    : true;
const config = { strictMode: DEV, tapErrorHandler: emptyFunc };
const setStrictMode = (val) => { config.strictMode = !!val; };
const setTapErrorHandler = (handler) => {
    types.checkFunction(handler, 'setTapErrorHandler');
    config.tapErrorHandler = handler;
};
// type 이 'any' 인 인스턴스는 값 타입을 보지 않으므로 "match any" 라고 하면 원인을 가린다.
// 그때 남는 실패 이유는 "두 인자의 타입이 다르다" 하나뿐이다.
const binaryTypeError = (label, type) => new TypeError(
    type === 'any'
        ? `${label}: arguments must be the same type`
        : `${label}: arguments must be the same type and match ${type}`
);
const checkAndSet = (config => {
    const rules = {
        Setoid: {
            strict: (instance, equals) => {
                typeof equals !== 'function' && raise(new TypeError('Setoid.equals: equals must be a function'));
                instance.equals = (a, b) => (types.equals(a, b) && types.check(a, instance.type)) ? equals(a, b) : raise(binaryTypeError('Setoid.equals', instance.type));
            }, loose: (instance, equals) => { instance.equals = (a, b) => equals(a, b); }
        },
        Ord: {
            strict: (instance, lte) => {
                typeof lte !== 'function' && raise(new TypeError('Ord.lte: lte must be a function'));
                instance.lte = (a, b) => (types.equals(a, b) && types.check(a, instance.type)) ? lte(a, b) : raise(binaryTypeError('Ord.lte', instance.type));
            },
            loose: (instance, lte) => { instance.lte = (a, b) => lte(a, b); }
        },
        Semigroup: {
            strict: (instance, concat) => {
                typeof concat !== 'function' && raise(new TypeError('Semigroup.concat: concat must be a function'));
                instance.concat = (a, b) => (types.equals(a, b) && types.check(a, instance.type)) ? concat(a, b) : raise(binaryTypeError('Semigroup.concat', instance.type));
            },
            loose: (instance, concat) => { instance.concat = (a, b) => concat(a, b); }
        },
        'Monoid.super': {
            strict: (semigroup) => { !(semigroup && semigroup[Symbols.Semigroup]) && raise(new TypeError('Monoid: argument must be a Semigroup')); },
            loose: emptyFunc
        },
        Monoid: {
            strict: (instance, semigroup, empty) => {
                typeof empty !== 'function' && raise(new TypeError('Monoid.empty: empty must be a function'));
                instance.empty = empty;
            },
            loose: (instance, semigroup, empty) => { instance.empty = empty; }
        },
        'Group.super': {
            strict: (monoid) => { !(monoid && monoid[Symbols.Monoid]) && raise(new TypeError('Group: argument must be a Monoid')); },
            loose: emptyFunc
        },
        Group: {
            strict: (instance, monoid, invert) => {
                !(monoid && monoid[Symbols.Monoid]) && raise(new TypeError('Group: argument must be a Monoid'));
                if (invert) {
                    typeof invert !== 'function' && raise(new TypeError('Group.invert: invert must be a function'));
                    instance.invert = a => types.check(a, instance.type) ? invert(a) : raise(new TypeError(`Group.invert: argument must be ${instance.type}`));
                }
            },
            loose: (instance, monoid, invert) => { if (invert) instance.invert = a => invert(a); }
        },
        Semigroupoid: {
            strict: (instance, compose) => {
                typeof compose !== 'function' && raise(new TypeError('Semigroupoid.compose: compose must be a function'));
                instance.compose = (f, g) => types.equals(f, g, 'function') ? compose(f, g) : raise(new TypeError('Semigroupoid.compose: both arguments must be functions'));
            },
            loose: (instance, compose) => { instance.compose = (f, g) => compose(f, g); }
        },
        'Category.super': {
            strict: (semigroupoid) => { !(semigroupoid && semigroupoid[Symbols.Semigroupoid]) && raise(new TypeError('Category: argument must be a Semigroupoid')); },
            loose: emptyFunc
        },
        Category: {
            strict: (instance, semigroupoid, id) => {
                typeof id !== 'function' && raise(new TypeError('Category.id: id must be a function'));
                instance.id = id;
            },
            loose: (instance, semigroupoid, id) => { instance.id = id; }
        },
        Filterable: {
            strict: (instance, filter) => {
                typeof filter !== 'function' && raise(new TypeError('Filterable.filter: filter must be a function'));
                instance.filter = (pred, a, ...rest) => (types.isFunction(pred) && types.check(a, instance.type)) ? filter(pred, a, ...rest) : raise(new TypeError(`Filterable.filter: arguments must be (function, ${instance.type})`));
            },
            loose: (instance, filter) => { instance.filter = (pred, a, ...rest) => filter(pred, a, ...rest); }
        },
        Functor: {
            strict: (instance, map) => {
                typeof map !== 'function' && raise(new TypeError('Functor.map: map must be a function'));
                instance.map = (f, a) => (types.isFunction(f) && types.check(a, instance.type)) ? map(f, a) : raise(new TypeError(`Functor.map: arguments must be (function, ${instance.type})`));
            },
            loose: (instance, map) => { instance.map = (f, a) => map(f, a); }
        },
        Bifunctor: {
            strict: (instance, bimap) => {
                typeof bimap !== 'function' && raise(new TypeError('Bifunctor.bimap: bimap must be a function'));
                instance.bimap = (f, g, a) => (types.equals(f, g, 'function') && types.check(a, instance.type)) ? bimap(f, g, a) : raise(new TypeError(`Bifunctor.bimap: arguments must be (function, function, ${instance.type})`));
            },
            loose: (instance, bimap) => { instance.bimap = (f, g, a) => bimap(f, g, a); }
        },
        Contravariant: {
            strict: (instance, contramap) => {
                typeof contramap !== 'function' && raise(new TypeError('Contravariant.contramap: contramap must be a function'));
                instance.contramap = (f, g) => types.equals(f, g, 'function') ? contramap(f, g) : raise(new TypeError('Contravariant.contramap: both arguments must be functions'));
            },
            loose: (instance, contramap) => { instance.contramap = (f, g) => contramap(f, g); }
        },
        Profunctor: {
            strict: (instance, promap) => {
                typeof promap !== 'function' && raise(new TypeError('Profunctor.promap: promap must be a function'));
                instance.promap = (f, g, fn) => (types.equals(f, g, 'function') && types.isFunction(fn)) ? promap(f, g, fn) : raise(new TypeError('Profunctor.promap: all arguments must be functions'));
            },
            loose: (instance, promap) => { instance.promap = (f, g, fn) => promap(f, g, fn); }
        },
        'Apply.super': {
            strict: (functor) => { !(functor && functor[Symbols.Functor]) && raise(new TypeError('Apply: argument must be a Functor')); },
            loose: emptyFunc
        },
        Apply: {
            strict: (instance, functor, ap) => {
                if (ap) {
                    typeof ap !== 'function' && raise(new TypeError('Apply.ap: ap must be a function'));
                    instance.ap = (fs, values) => types.equals(fs, values, instance.type) ? ap(fs, values) : raise(new TypeError(`Apply.ap: both arguments must be ${instance.type}`));
                }
            },
            loose: (instance, functor, ap) => { if (ap) instance.ap = (fs, values) => ap(fs, values); }
        },
        'Applicative.super': {
            strict: (apply) => { !(apply && apply[Symbols.Apply]) && raise(new TypeError('Applicative: argument must be an Apply')); },
            loose: emptyFunc
        },
        Applicative: {
            strict: (instance, apply, of) => {
                typeof of !== 'function' && raise(new TypeError('Applicative.of: of must be a function'));
                instance.of = of;
            },
            loose: (instance, apply, of) => { instance.of = of; }
        },
        'Alt.super': {
            strict: (functor) => { !(functor && functor[Symbols.Functor]) && raise(new TypeError('Alt: argument must be a Functor')); },
            loose: emptyFunc
        },
        Alt: {
            strict: (instance, functor, alt) => {
                if (alt) {
                    typeof alt !== 'function' && raise(new TypeError('Alt.alt: alt must be a function'));
                    instance.alt = (a, b) => types.equals(a, b, instance.type) ? alt(a, b) : raise(new TypeError(`Alt.alt: both arguments must be ${instance.type}`));
                }
            },
            loose: (instance, functor, alt) => { if (alt) instance.alt = (a, b) => alt(a, b); }
        },
        'Plus.super': {
            strict: (alt) => { !(alt && alt[Symbols.Alt]) && raise(new TypeError('Plus: argument must be an Alt')); },
            loose: emptyFunc
        },
        Plus: {
            strict: (instance, alt, zero) => {
                typeof zero !== 'function' && raise(new TypeError('Plus.zero: zero must be a function'));
                instance.zero = zero;
            },
            loose: (instance, alt, zero) => { instance.zero = zero; }
        },
        'Chain.super': {
            strict: (apply) => { !(apply && apply[Symbols.Apply]) && raise(new TypeError('Chain: argument must be an Apply')); },
            loose: emptyFunc
        },
        Alternative: {
            strict: (applicative, plus) => {
                !(applicative && applicative[Symbols.Applicative]) && raise(new TypeError('Alternative: first argument must be an Applicative'));
                !(plus && plus[Symbols.Plus]) && raise(new TypeError('Alternative: second argument must be a Plus'));
            },
            loose: emptyFunc
        },
        Chain: {
            strict: (instance, apply, chain) => {
                if (chain) {
                    typeof chain !== 'function' && raise(new TypeError('Chain.chain: chain must be a function'));
                    instance.chain = (f, a) => (types.isFunction(f) && types.check(a, instance.type)) ? chain(f, a) : raise(new TypeError(`Chain.chain: arguments must be (function, ${instance.type})`));
                }
            },
            loose: (instance, apply, chain) => { if (chain) instance.chain = (f, a) => chain(f, a); }
        },
        'ChainRec.super': {
            strict: (chain) => { !(chain && chain[Symbols.Chain]) && raise(new TypeError('ChainRec: argument must be a Chain')); },
            loose: emptyFunc
        },
        ChainRec: {
            strict: (instance, chain, chainRec) => {
                if (chainRec) {
                    typeof chainRec !== 'function' && raise(new TypeError('ChainRec.chainRec: chainRec must be a function'));
                    instance.chainRec = (f, i) => types.isFunction(f) ? chainRec(f, i) : raise(new TypeError('ChainRec.chainRec: first argument must be a function'));
                }
            },
            loose: (instance, chain, chainRec) => { if (chainRec) instance.chainRec = (f, i) => chainRec(f, i); }
        },
        Monad: {
            strict: (applicative, chain) => {
                !(applicative && applicative[Symbols.Applicative]) && raise(new TypeError('Monad: first argument must be an Applicative'));
                !(chain && chain[Symbols.Chain]) && raise(new TypeError('Monad: second argument must be a Chain'));
            },
            loose: emptyFunc
        },
        Foldable: {
            strict: (instance, reduce) => {
                typeof reduce !== 'function' && raise(new TypeError('Foldable.reduce: reduce must be a function'));
                instance.reduce = (f, init, a) => (types.isFunction(f) && types.check(a, instance.type)) ? reduce(f, init, a) : raise(new TypeError(`Foldable.reduce: arguments must be (function, initial, ${instance.type})`));
            },
            loose: (instance, reduce) => { instance.reduce = (f, init, a) => reduce(f, init, a); }
        },
        'Extend.super': {
            strict: (functor) => { !(functor && functor[Symbols.Functor]) && raise(new TypeError('Extend: argument must be a Functor')); },
            loose: emptyFunc
        },
        Extend: {
            strict: (instance, functor, extend) => {
                if (extend) {
                    typeof extend !== 'function' && raise(new TypeError('Extend.extend: extend must be a function'));
                    instance.extend = (f, a) => (types.isFunction(f) && types.check(a, instance.type)) ? extend(f, a) : raise(new TypeError(`Extend.extend: arguments must be (function, ${instance.type})`));
                }
            },
            loose: (instance, functor, extend) => { if (extend) instance.extend = (f, a) => extend(f, a); }
        },
        'Comonad.super': {
            strict: (extend) => { !(extend && extend[Symbols.Extend]) && raise(new TypeError('Comonad: argument must be an Extend')); },
            loose: emptyFunc
        },
        Comonad: {
            strict: (instance, extend, extract) => {
                if (extract) {
                    typeof extract !== 'function' && raise(new TypeError('Comonad.extract: extract must be a function'));
                    instance.extract = a => types.check(a, instance.type) ? extract(a) : raise(new TypeError(`Comonad.extract: argument must be ${instance.type}`));
                }
            },
            loose: (instance, extend, extract) => { if (extract) instance.extract = a => extract(a); }
        },
        'Traversable.super': {
            strict: (functor, foldable) => {
                !(functor && functor[Symbols.Functor]) && raise(new TypeError('Traversable: first argument must be a Functor'));
                !(foldable && foldable[Symbols.Foldable]) && raise(new TypeError('Traversable: second argument must be a Foldable'));
            },
            loose: emptyFunc
        },
        Traversable: {
            strict: (instance, functor, foldable, traverse) => {
                if (traverse) {
                    typeof traverse !== 'function' && raise(new TypeError('Traversable.traverse: traverse must be a function'));
                    instance.traverse = (applicative, f, a) => {
                        if (!applicative[Symbols.Applicative]) return raise(new TypeError('Traversable.traverse: first argument must be an Applicative'));
                        if (!types.isFunction(f)) return raise(new TypeError('Traversable.traverse: second argument must be a function'));
                        if (!types.check(a, instance.type)) return raise(new TypeError(`Traversable.traverse: third argument must be ${instance.type}`));
                        return traverse(applicative, f, a);
                    };
                }
            },
            loose: (instance, functor, foldable, traverse) => { if (traverse) instance.traverse = (applicative, f, a) => traverse(applicative, f, a); }
        },
    };
    return key => {
        const rule = rules[key];
        if (!rule) raise(new TypeError(`checkAndSet: unknown key '${key}'`));
        return (instance, ...args) => { config.strictMode ? rule.strict(instance, ...args) : rule.loose(instance, ...args); };
    };
})(config);
class Algebra { constructor(type) { this.type = type; } }
// 상위 클래스에 넘기는 map/ap 은 이미 검사가 씌워진 것이다. 같은 type 이면 상위가 씌우는
// 검사가 **글자 그대로 같으므로**(둘 다 types.isFunction(f) && types.check(a, instance.type))
// 바깥 겹은 안전성을 더하지 않는다. 그것이 벗기는 유일한 근거다.
// Alternative 가 this.alt = plus.alt 로 재래핑을 피하는 것과 같은 처리다.
// type 이 다르면 바깥 검사가 다른 것이므로 그대로 둔다.
//
// 성능을 근거로 삼지 마라 — 같은 회차가 first/left 를 Bifunctor.bimap 위임으로 바꿔
// 원소마다 레지스트리 조회를 새로 넣었고, 그쪽이 벗긴 겹보다 크다(실측 1.37~1.60배).
// 레지스트리 재사용은 POLICY 6 에 따른 옳은 선택이고 되돌리지 않는다.
const unwrapIfSameType = (instance, source, ...methods) => {
    if (instance.type !== source.type) return;
    for (const m of methods) { if (source[m]) instance[m] = source[m]; }
};
Algebra.prototype[Symbols.Algebra] = true;
class Setoid extends Algebra {
    constructor(equals, type, registry, ...registryKeys) {
        super(type);
        checkAndSet('Setoid')(this, equals);
        registry && register(registry, this, ...registryKeys);
    }
    equals() { raise(new Error('Setoid: equals is not implemented')); }
}
Setoid.prototype[Symbols.Setoid] = true;
class Ord extends Algebra {
    constructor(lte, type, registry, ...aliases) {
        super(type);
        checkAndSet('Ord')(this, lte);
        registry && register(registry, this, ...aliases);
    }
    lte() { raise(new Error('Ord: lte is not implemented')); }
}
Ord.prototype[Symbols.Ord] = true;
class Semigroup extends Algebra {
    constructor(concat, type, registry, ...aliases) {
        super(type);
        checkAndSet('Semigroup')(this, concat);
        registry && register(registry, this, ...aliases);
    }
    concat() { raise(new Error('Semigroup: concat is not implemented')); }
}
Semigroup.prototype[Symbols.Semigroup] = true;
class Monoid extends Semigroup {
    constructor(semigroup, empty, type, registry, ...aliases) {
        checkAndSet('Monoid.super')(semigroup);
        super(semigroup.concat, type);
        unwrapIfSameType(this, semigroup, 'concat');
        checkAndSet('Monoid')(this, semigroup, empty);
        registry && register(registry, this, ...aliases);
    }
    empty() { raise(new Error('Monoid: empty is not implemented')); }
}
Monoid.prototype[Symbols.Monoid] = true;
class Group extends Monoid {
    constructor(monoid, invert, type, registry, ...aliases) {
        checkAndSet('Group.super')(monoid);
        super(monoid, monoid.empty, type);
        checkAndSet('Group')(this, monoid, invert);
        registry && register(registry, this, ...aliases);
    }
    invert() { raise(new Error('Group: invert is not implemented')); }
}
Group.prototype[Symbols.Group] = true;
class Semigroupoid extends Algebra {
    constructor(compose, type, registry, ...registryKeys) {
        super(type);
        checkAndSet('Semigroupoid')(this, compose);
        registry && register(registry, this, ...registryKeys);
    }
    compose() { raise(new Error('Semigroupoid: compose is not implemented')); }
}
Semigroupoid.prototype[Symbols.Semigroupoid] = true;
class Category extends Semigroupoid {
    constructor(semigroupoid, id, type, registry, ...aliases) {
        checkAndSet('Category.super')(semigroupoid);
        super(semigroupoid.compose, type);
        checkAndSet('Category')(this, semigroupoid, id);
        registry && register(registry, this, ...aliases);
    }
    id() { raise(new Error('Category: id is not implemented')); }
}
Category.prototype[Symbols.Category] = true;
class Filterable extends Algebra {
    constructor(filter, type, registry, ...aliases) {
        super(type);
        checkAndSet('Filterable')(this, filter);
        registry && register(registry, this, ...aliases);
    }
    filter() { raise(new Error('Filterable: filter is not implemented')); }
}
Filterable.prototype[Symbols.Filterable] = true;
class Functor extends Algebra {
    constructor(map, type, registry, ...aliases) {
        super(type);
        checkAndSet('Functor')(this, map);
        registry && register(registry, this, ...aliases);
    }
    map() { raise(new Error('Functor: map is not implemented')); }
}
Functor.prototype[Symbols.Functor] = true;
class Bifunctor extends Algebra {
    constructor(bimap, type, registry, ...aliases) {
        super(type);
        checkAndSet('Bifunctor')(this, bimap);
        registry && register(registry, this, ...aliases);
    }
    bimap() { raise(new Error('Bifunctor: bimap is not implemented')); }
}
Bifunctor.prototype[Symbols.Bifunctor] = true;
class Contravariant extends Algebra {
    constructor(contramap, type, registry, ...aliases) {
        super(type);
        checkAndSet('Contravariant')(this, contramap);
        registry && register(registry, this, ...aliases);
    }
    contramap() { raise(new Error('Contravariant: contramap is not implemented')); }
}
Contravariant.prototype[Symbols.Contravariant] = true;
class Profunctor extends Algebra {
    constructor(promap, type, registry, ...aliases) {
        super(type);
        checkAndSet('Profunctor')(this, promap);
        registry && register(registry, this, ...aliases);
    }
    promap() { raise(new Error('Profunctor: promap is not implemented')); }
}
Profunctor.prototype[Symbols.Profunctor] = true;
class Apply extends Functor { // F(a -> b) => F(a) => F(b)
    constructor(functor, ap, type, registry, ...aliases) {
        checkAndSet('Apply.super')(functor);
        super(functor.map, type);
        unwrapIfSameType(this, functor, 'map');
        checkAndSet('Apply')(this, functor, ap);
        registry && register(registry, this, ...aliases);
    }
    ap() { raise(new Error('Apply: ap is not implemented')); }
}
Apply.prototype[Symbols.Apply] = true;
class Applicative extends Apply {
    constructor(apply, of, type, registry, ...aliases) {
        checkAndSet('Applicative.super')(apply);
        super(apply, apply.ap, type);
        unwrapIfSameType(this, apply, 'map', 'ap');
        checkAndSet('Applicative')(this, apply, of);
        registry && register(registry, this, ...aliases);
    }
    of() { raise(new Error('Applicative: of is not implemented')); }
}
Applicative.prototype[Symbols.Applicative] = true;
class Alt extends Functor {
    constructor(functor, alt, type, registry, ...aliases) {
        checkAndSet('Alt.super')(functor);
        super(functor.map, type);
        unwrapIfSameType(this, functor, 'map');
        checkAndSet('Alt')(this, functor, alt);
        registry && register(registry, this, ...aliases);
    }
    alt() { raise(new Error('Alt: alt is not implemented')); }
}
Alt.prototype[Symbols.Alt] = true;
// Plus 는 alt(결합 이항 연산)와 zero(항등원)를 둘 다 갖고 있어 구조적으로 Monoid 다 —
// 태그만 없다. 그래서 등록된 Plus 는 전부 짝 Semigroup/Monoid 를 plus(<alias>) 키로 얻는다.
// 특례를 손으로 쓰지 않는다: Plus 를 새로 등록하면 짝도 자동으로 따라온다.
//
// 이렇게 얻은 Monoid 는 컨테이너를 열지 않고 한쪽을 통째로 고른다. Maybe 의 경우
// Maybe.Monoid(innerSG)(= maybe(first))와 대비된다 — 그쪽은 둘 다 Just 일 때 안쪽 값을
// innerSG.concat 으로 합치므로 안의 타입이 같아야 한다. payload 타입이 같으면 결과도
// 같고, 섞였을 때만 갈린다 — 앞엣것은 던지고 이쪽은 고른다.
//
// register() 를 쓰지 않는 이유: 그것은 instance.constructor.name 도 키로 넣으므로
// Monoid.types['Monoid'] 가 생기고 Plus 들이 서로 덮는다. Maybe.Monoid 의 선례대로
// 키를 직접 넣는다.
const deriveFromPlus = (plus, type, aliases) => {
    const semigroup = new Semigroup(plus.alt, type);
    const monoid = new Monoid(semigroup, plus.zero, type);
    for (const alias of aliases) {
        const key = `plus(${alias.toLowerCase()})`;
        Semigroup.types[key] = semigroup;
        Monoid.types[key] = monoid;
    }
};
class Plus extends Alt {
    constructor(alt, zero, type, registry, ...aliases) {
        checkAndSet('Plus.super')(alt);
        super(alt, alt.alt, type);
        unwrapIfSameType(this, alt, 'map', 'alt');
        checkAndSet('Plus')(this, alt, zero);
        if (registry) {
            register(registry, this, ...aliases);
            deriveFromPlus(this, type, aliases);
        }
    }
    zero() { raise(new Error('Plus: zero is not implemented')); }
}
Plus.prototype[Symbols.Plus] = true;
class Alternative extends Applicative {
    constructor(applicative, plus, type, registry, ...aliases) {
        checkAndSet('Alternative')(applicative, plus);
        super(applicative, applicative.of, type);
        this.ap = applicative.ap;
        this.alt = plus.alt;
        this.zero = plus.zero;
        registry && register(registry, this, ...aliases);
    }
}
Alternative.prototype[Symbols.Alternative] = true;
class Chain extends Apply {
    constructor(apply, chain, type, registry, ...aliases) {
        checkAndSet('Chain.super')(apply);
        super(apply, apply.ap, type);
        checkAndSet('Chain')(this, apply, chain);
        registry && register(registry, this, ...aliases);
    }
    chain() { raise(new Error('Chain: chain is not implemented')); }
}
Chain.prototype[Symbols.Chain] = true;
class ChainRec extends Chain {
    constructor(chain, chainRec, type, registry, ...aliases) {
        checkAndSet('ChainRec.super')(chain);
        super(chain, chain.chain, type);
        checkAndSet('ChainRec')(this, chain, chainRec);
        registry && register(registry, this, ...aliases);
    }
    chainRec() { raise(new Error('ChainRec: chainRec is not implemented')); }
}
ChainRec.prototype[Symbols.ChainRec] = true;
class Monad extends Applicative {
    constructor(applicative, chain, type, registry, ...aliases) {
        checkAndSet('Monad')(applicative, chain);
        super(applicative, applicative.of, type);
        this.ap = applicative.ap;
        this.chain = chain.chain;
        registry && register(registry, this, ...aliases);
    }
}
Monad.prototype[Symbols.Monad] = true;
class Foldable extends Algebra {
    constructor(reduce, type, registry, ...aliases) {
        super(type);
        checkAndSet('Foldable')(this, reduce);
        registry && register(registry, this, ...aliases);
    }
    reduce() { raise(new Error('Foldable: reduce is not implemented')); }
}
Foldable.prototype[Symbols.Foldable] = true;
class Extend extends Functor {
    constructor(functor, extend, type, registry, ...aliases) {
        checkAndSet('Extend.super')(functor);
        super(functor.map, type);
        checkAndSet('Extend')(this, functor, extend);
        registry && register(registry, this, ...aliases);
    }
    extend() { raise(new Error('Extend: extend is not implemented')); }
}
Extend.prototype[Symbols.Extend] = true;
class Comonad extends Extend {
    constructor(extend, extract, type, registry, ...aliases) {
        checkAndSet('Comonad.super')(extend);
        super(extend, extend.extend, type);
        checkAndSet('Comonad')(this, extend, extract);
        registry && register(registry, this, ...aliases);
    }
    extract() { raise(new Error('Comonad: extract is not implemented')); }
}
Comonad.prototype[Symbols.Comonad] = true;
class Traversable extends Functor {
    constructor(functor, foldable, traverse, type, registry, ...aliases) {
        checkAndSet('Traversable.super')(functor, foldable);
        super(functor.map, type);
        this.reduce = foldable.reduce;
        checkAndSet('Traversable')(this, functor, foldable, traverse);
        registry && register(registry, this, ...aliases);
    }
    traverse() { raise(new Error('Traversable: traverse is not implemented')); }
}
Traversable.prototype[Symbols.Traversable] = true;

// 타입클래스의 정적 조회는 `lookup` 이다 — `of` 가 아니다.
// `of` 는 값을 컨테이너에 넣는 생성자 하나만 뜻한다(`Maybe.of(1)` === `Just(1)`,
// `Applicative.lookup('maybe').of(1)`). 한 이름이 조회와 주입을 겸하면 읽는 쪽이
// `Maybe.of('array')` 를 조회로 오해한다 — 그건 `Just('array')` 다.
const withTypeRegistry = (TypeClass, defaultResolver = null) => {
    TypeClass.types = {};
    TypeClass.resolver = key => TypeClass.types[key] || defaultResolver?.(key);
    TypeClass.lookup = key => TypeClass.resolver(key)
        || raise(new TypeError(`${TypeClass.name}.lookup: unsupported key ${key}`));
};
const addResolver = (TypeClass, resolver) => {
    const prev = TypeClass.resolver;
    TypeClass.resolver = key => prev(key) || resolver(key);
};

Setoid.op = (a, b) => a === b;
withTypeRegistry(Setoid, key => key === 'default' ? { equals: Setoid.op } : null);

Ord.op = (a, b) => a <= b;
withTypeRegistry(Ord, key => key === 'default' ? { lte: Ord.op } : null);

withTypeRegistry(Semigroup);
withTypeRegistry(Monoid);
withTypeRegistry(Group);
withTypeRegistry(Semigroupoid);
withTypeRegistry(Category);
withTypeRegistry(Filterable);
withTypeRegistry(Functor);
withTypeRegistry(Bifunctor);
withTypeRegistry(Contravariant);
withTypeRegistry(Profunctor);
withTypeRegistry(Apply);
withTypeRegistry(Applicative);
withTypeRegistry(Alt);
withTypeRegistry(Plus);
withTypeRegistry(Alternative);
withTypeRegistry(Chain);
withTypeRegistry(ChainRec);
ChainRec.next = value => ({ tag: 'next', value });
ChainRec.done = value => ({ tag: 'done', value });
withTypeRegistry(Monad);
withTypeRegistry(Foldable);
withTypeRegistry(Extend);
withTypeRegistry(Comonad);
withTypeRegistry(Traversable);

/* Function */
class FunctionSemigroup extends Semigroup {
    constructor() {
        super(compose2, 'function', Semigroup.types, 'function');
    }
}
modules.push(FunctionSemigroup);
class FunctionMonoid extends Monoid {
    constructor() {
        super(Semigroup.types.FunctionSemigroup, () => identity, 'function', Monoid.types, 'function');
    }
}
modules.push(FunctionMonoid);
class FunctionSemigroupoid extends Semigroupoid {
    constructor() {
        super(compose2, 'function', Semigroupoid.types, 'function');
    }
}
modules.push(FunctionSemigroupoid);
class FunctionCategory extends Category {
    constructor() {
        super(Semigroupoid.types.FunctionSemigroupoid, identity, 'function', Category.types, 'function');
    }
}
modules.push(FunctionCategory);
class PredicateContravariant extends Contravariant {
    constructor() {
        super((f, pred) => a => pred(f(a)), 'function', Contravariant.types, 'predicate');
    }
}
modules.push(PredicateContravariant);
class FunctionProfunctor extends Profunctor {
    constructor() {
        super((f, g, fn) => x => g(fn(f(x))), 'function', Profunctor.types, 'function');
    }
}
modules.push(FunctionProfunctor);
/* Boolean */
class BooleanSetoid extends Setoid {
    constructor() {
        super(Setoid.op, 'boolean', Setoid.types, 'boolean');
    }
}
modules.push(BooleanSetoid);
class BooleanAllSemigroup extends Semigroup {
    constructor() {
        super((x, y) => x && y, 'boolean', Semigroup.types, 'boolean');
    }
}
modules.push(BooleanAllSemigroup);
class BooleanAnySemigroup extends Semigroup {
    constructor() {
        super((x, y) => x || y, 'boolean', Semigroup.types);
    }
}
modules.push(BooleanAnySemigroup);
class BooleanXorSemigroup extends Semigroup {
    constructor() {
        super((x, y) => x !== y, 'boolean', Semigroup.types);
    }
}
modules.push(BooleanXorSemigroup);
class BooleanAllMonoid extends Monoid {
    constructor() {
        super(Semigroup.types.BooleanAllSemigroup, () => true, 'boolean', Monoid.types, 'boolean');
    }
}
modules.push(BooleanAllMonoid);
class BooleanAnyMonoid extends Monoid {
    constructor() {
        super(Semigroup.types.BooleanAnySemigroup, () => false, 'boolean', Monoid.types);
    }
}
modules.push(BooleanAnyMonoid);
class BooleanXorMonoid extends Monoid {
    constructor() {
        super(Semigroup.types.BooleanXorSemigroup, () => false, 'boolean', Monoid.types);
    }
}
modules.push(BooleanXorMonoid);
class BooleanXorGroup extends Group {
    constructor() {
        super(Monoid.types.BooleanXorMonoid, x => x, 'boolean', Group.types);
    }
}
modules.push(BooleanXorGroup);
/* Number */
class NumberSetoid extends Setoid {
    constructor() {
        super(Setoid.op, 'number', Setoid.types, 'number');
    }
}
modules.push(NumberSetoid);
class NumberOrd extends Ord {
    constructor() {
        super(Ord.op, 'number', Ord.types, 'number');
    }
}
modules.push(NumberOrd);
class NumberSumSemigroup extends Semigroup {
    constructor() {
        super((x, y) => x + y, 'number', Semigroup.types, 'number');
    }
}
modules.push(NumberSumSemigroup);
class NumberProductSemigroup extends Semigroup {
    constructor() {
        super((x, y) => x * y, 'number', Semigroup.types);
    }
}
modules.push(NumberProductSemigroup);
class NumberMaxSemigroup extends Semigroup {
    constructor() {
        super(Math.max, 'number', Semigroup.types);
    }
}
modules.push(NumberMaxSemigroup);
class NumberMinSemigroup extends Semigroup {
    constructor() {
        super(Math.min, 'number', Semigroup.types);
    }
}
modules.push(NumberMinSemigroup);
class NumberSumMonoid extends Monoid {
    constructor() {
        super(Semigroup.types.NumberSumSemigroup, () => 0, 'number', Monoid.types, 'number');
    }
}
modules.push(NumberSumMonoid);
class NumberProductMonoid extends Monoid {
    constructor() {
        super(Semigroup.types.NumberProductSemigroup, () => 1, 'number', Monoid.types);
    }
}
modules.push(NumberProductMonoid);
class NumberMaxMonoid extends Monoid {
    constructor() {
        super(Semigroup.types.NumberMaxSemigroup, () => -Infinity, 'number', Monoid.types);
    }
}
modules.push(NumberMaxMonoid);
class NumberMinMonoid extends Monoid {
    constructor() {
        super(Semigroup.types.NumberMinSemigroup, () => Infinity, 'number', Monoid.types);
    }
}
modules.push(NumberMinMonoid);
class NumberSumGroup extends Group {
    constructor() {
        super(Monoid.types.NumberSumMonoid, x => -x, 'number', Group.types, 'number');
    }
}
modules.push(NumberSumGroup);
class NumberProductGroup extends Group {
    constructor() {
        super(Monoid.types.NumberProductMonoid, x => 1 / x, 'number', Group.types);
    }
}
modules.push(NumberProductGroup);
/* String */
class StringSetoid extends Setoid {
    constructor() {
        super(Setoid.op, 'string', Setoid.types, 'string');
    }
}
modules.push(StringSetoid);
class StringOrd extends Ord {
    constructor() {
        super(Ord.op, 'string', Ord.types, 'string');
    }
}
modules.push(StringOrd);
class StringLengthOrd extends Ord {
    constructor() {
        super((x, y) => x.length <= y.length, 'string', Ord.types);
    }
}
modules.push(StringLengthOrd);
class StringLocaleOrd extends Ord {
    constructor() {
        super((x, y) => x.localeCompare(y) <= 0, 'string', Ord.types);
    }
}
modules.push(StringLocaleOrd);
class StringSemigroup extends Semigroup {
    constructor() {
        super((x, y) => x + y, 'string', Semigroup.types, 'string');
    }
}
modules.push(StringSemigroup);
class StringMonoid extends Monoid {
    constructor() {
        super(Semigroup.types.StringSemigroup, () => '', 'string', Monoid.types, 'string');
    }
}
modules.push(StringMonoid);
/* Polymorphic — 값 타입을 보지 않는 인스턴스 ('any') */
// first/last 는 (a,b) => a · (a,b) => b 라 값의 타입과 무관하다. 한때 /* Object */ 섹션에
// 있어 'object' 로 등록돼 있었는데, 그건 위치를 따라간 것이고 types/data/builtins.d.ts 의
// 선언(readonly first: unknown)이 처음부터 모든 타입이었다.
// 이 둘은 Monoid 가 아니다 — 항등원이 없다 (commit e3d2b82 에서 FirstMonoid/LastMonoid 제거).
// Monoid 가 필요하면 Maybe 로 감싸는데, 무엇을 원하느냐에 따라 둘로 갈린다:
//   Maybe.Monoid('first')     = maybe(first)  — 둘 다 Just 면 안쪽 값을 first 로 합친다
//   Monoid.lookup('plus(maybe)')  = Alt/Plus 유도 — 안을 열지 않고 첫 Just 를 통째로 고른다
// 둘은 payload 타입이 같으면 결과도 같다. 갈리는 것은 타입이 섞였을 때뿐이고, 그때
// 앞엣것은 안쪽 concat 의 타입 검사에 걸려 던진다. "합치기" 면 앞, "고르기" 면 뒤.
class FirstSemigroup extends Semigroup {
    constructor() {
        super(x => x, 'any', Semigroup.types, 'first');
    }
}
modules.push(FirstSemigroup);
class LastSemigroup extends Semigroup {
    constructor() {
        super((x, y) => y, 'any', Semigroup.types, 'last');
    }
}
modules.push(LastSemigroup);
/* Object */
class ObjectFilterable extends Filterable {
    constructor() {
        super((pred, obj) => polyfills.object.filter(pred, obj), 'Object', Filterable.types, 'object');
    }
}
modules.push(ObjectFilterable);
class ObjectFoldable extends Foldable {
    constructor() {
        super((f, init, obj) => polyfills.object.values(obj).reduce(f, init), 'Object', Foldable.types, 'object');
    }
}
modules.push(ObjectFoldable);
// 키 문자열이든 인스턴스든 { key, instance } 로 정규화한다.
// key 는 등록된 소문자 alias 중 가장 짧은 것이고, 등록 안 된 인스턴스면 null 이다.
// 그 null 이 "레지스트리에 올릴 수 없다 → 인스턴스로 캐시한다" 의 신호가 된다.
const normalizeTypeClassKey = (TypeClass, symbol, label) => x => {
    const instance = typeof x === 'string' ? TypeClass.lookup(x) : x;
    if (typeof x !== 'string' && !(x && x[symbol] === true)) {
        raise(new TypeError(`${label}: argument must be a string or ${TypeClass.name} instance`));
    }
    const ctorName = instance.constructor?.name?.toLowerCase?.() || '';
    let best = null;
    for (const [k, v] of Object.entries(TypeClass.types)) {
        if (v === instance && k === k.toLowerCase() && k !== ctorName) {
            if (best === null || k.length < best.length || (k.length === best.length && k < best)) best = k;
        }
    }
    return { key: best, instance };
};
/* Identity / Const — traverse 에 넘기는 Applicative 두 개 */
// Identity: 값을 그대로 나른다. traverse 를 "그냥 매핑" 으로 쓰고 싶을 때 쓴다 (optics 의 over).
// Const<r>: 값을 버리고 monoid 로 r 만 모은다. traverse 를 "접기" 로 쓴다 (optics 의 preview).
// 담는 모양은 { value } 이므로 type 은 'Object' 다 — types.of({}) 가 'Object' 를 준다.
// 등록된 다른 모든 Applicative 와 같은 3단이다 — Functor → Apply → Applicative.
// type 이 'Object' (대문자) 인 것은 types.of({}) 가 'Object' 를 주기 때문이고,
// **여기를 소문자로 바꾸면 optics 가 전부 죽는다** — Identity/Const 는 Apply.ap 를 지나고
// 거기 쓰이는 types.equals(a, b, instance.type) 는 types.check 와 달리 대소문자 폴백이
// 없다. 그 3인자형을 쓰는 곳은 파일 전체에서 Apply.ap 와 Alt.alt 둘뿐이다.
// (2026-08-13 이전에는 ObjectFilterable/ObjectFoldable 이 소문자 'object' 를 써서 이 자리가
//  "예외" 처럼 보였다. 그쪽은 폴백이 있는 types.check 만 지나 우연히 살아 있었던 것이고,
//  지금은 넷 다 정규 태그다. tests/algebra-type.test.js 가 전수로 강제한다.)
class IdentityFunctor extends Functor {
    constructor() {
        super((f, x) => ({ value: f(x.value) }), 'Object', Functor.types, 'identity');
    }
}
modules.push(IdentityFunctor);
class IdentityApply extends Apply {
    constructor() {
        super(Functor.types.IdentityFunctor,
              (ff, fa) => ({ value: ff.value(fa.value) }), 'Object', Apply.types, 'identity');
    }
}
modules.push(IdentityApply);
class IdentityApplicative extends Applicative {
    constructor() {
        super(Apply.types.IdentityApply, v => ({ value: v }), 'Object', Applicative.types, 'identity');
    }
}
modules.push(IdentityApplicative);
// Const 는 monoid 마다 다르므로 매개변수화한다 — Maybe.Monoid(innerSG) 와 같은 모양이다.
// 키로 만들면 const(<키>) 로 레지스트리에 올리고, 등록 안 된 인스턴스면 인스턴스로 캐시한다.
const normalizeConstMonoid = normalizeTypeClassKey(Monoid, Symbols.Monoid, 'Applicative.Const');
Applicative.Const = monoid => {
    const { key, instance: m } = normalizeConstMonoid(monoid);
    if (key !== null && Applicative.Const._keyCache.has(key)) return Applicative.Const._keyCache.get(key);
    if (key === null && Applicative.Const._instanceCache.has(m)) return Applicative.Const._instanceCache.get(m);
    const result = new Applicative(
        new Apply(new Functor((_f, x) => x, 'Object'),
                  (a, b) => ({ value: m.concat(a.value, b.value) }), 'Object'),
        () => ({ value: m.empty() }), 'Object');
    if (key !== null) {
        // identity 와 같이 3단으로 등록한다 — Applicative 만 올리면 Functor.lookup('const(array)')
        // 가 안 된다(회차 1 리뷰 #2 를 identity 에서 고치고 여기서 재발시켰다).
        Functor.types[`const(${key})`] = result;
        Apply.types[`const(${key})`] = result;
        Applicative.types[`const(${key})`] = result;
        Applicative.Const._keyCache.set(key, result);
    } else {
        Applicative.Const._instanceCache.set(m, result);
    }
    return result;
};
Applicative.Const._keyCache = new Map();
Applicative.Const._instanceCache = new WeakMap();
/* Array */
class ArraySemigroup extends Semigroup {
    constructor() {
        super((x, y) => x.concat(y), 'Array', Semigroup.types, 'array');
    }
}
modules.push(ArraySemigroup);
class ArrayMonoid extends Monoid {
    constructor() {
        super(Semigroup.types.ArraySemigroup, () => [], 'Array', Monoid.types, 'array');
    }
}
modules.push(ArrayMonoid);
class ArrayFilterable extends Filterable {
    constructor() {
        super((pred, arr) => arr.filter(pred), 'Array', Filterable.types, 'array');
    }
}
modules.push(ArrayFilterable);
class ArrayFunctor extends Functor {
    constructor() {
        super((f, arr) => arr.map(f), 'Array', Functor.types, 'array');
    }
}
modules.push(ArrayFunctor);
class TupleBifunctor extends Bifunctor {
    constructor() {
        super((f, g, [a, b]) => [f(a), g(b)], 'Array', Bifunctor.types, 'tuple');
    }
}
modules.push(TupleBifunctor);
class ArrayApply extends Apply {
    constructor() {
        super(Functor.types.ArrayFunctor,
            (fs, values) => polyfills.array.flatMap(f => Functor.types.ArrayFunctor.map(f, values), fs),
            'Array', Apply.types, 'array');
    }
}
modules.push(ArrayApply);
class ArrayApplicative extends Applicative {
    constructor() {
        super(Apply.types.ArrayApply, x => [x], 'Array', Applicative.types, 'array');
    }
}
modules.push(ArrayApplicative);
class ArrayAlt extends Alt {
    constructor() {
        super(Functor.types.ArrayFunctor, (a, b) => a.concat(b), 'Array', Alt.types, 'array');
    }
}
modules.push(ArrayAlt);
class ArrayPlus extends Plus {
    constructor() {
        super(Alt.types.ArrayAlt, () => [], 'Array', Plus.types, 'array');
    }
}
modules.push(ArrayPlus);
class ArrayAlternative extends Alternative {
    constructor() {
        super(Applicative.types.ArrayApplicative, Plus.types.ArrayPlus, 'Array', Alternative.types, 'array');
    }
}
modules.push(ArrayAlternative);
class ArrayChain extends Chain {
    constructor() {
        super(Apply.types.ArrayApply, polyfills.array.flatMap, 'Array', Chain.types, 'array');
    }
}
modules.push(ArrayChain);
class ArrayChainRec extends ChainRec {
    constructor() {
        super(Chain.types.ArrayChain, (f, i) => {
            const res = [];
            const queue = f(ChainRec.next, ChainRec.done, i);
            while (queue.length > 0) {
                const step = queue.shift();
                step.tag === 'next' ? queue.unshift(...f(ChainRec.next, ChainRec.done, step.value)) : res.push(step.value);
            }
            return res;
        }, 'Array', ChainRec.types, 'array');
    }
}
modules.push(ArrayChainRec);
class ArrayMonad extends Monad {
    constructor() {
        super(Applicative.types.ArrayApplicative, Chain.types.ArrayChain, 'Array', Monad.types, 'array');
    }
}
modules.push(ArrayMonad);
class ArrayFoldable extends Foldable {
    constructor() {
        super((f, init, arr) => arr.reduce(f, init), 'Array', Foldable.types, 'array');
    }
}
modules.push(ArrayFoldable);
class ArrayExtend extends Extend {
    constructor() {
        super(Functor.types.ArrayFunctor,
            (f, arr) => arr.map((_, i) => f(arr.slice(i))),
            'Array', Extend.types, 'array');
    }
}
modules.push(ArrayExtend);
class ArrayComonad extends Comonad {
    constructor() {
        super(Extend.types.ArrayExtend, arr => arr[0], 'Array', Comonad.types, 'array');
    }
}
modules.push(ArrayComonad);
class ArrayTraversable extends Traversable {
    constructor() {
        super(Functor.types.ArrayFunctor,
            Foldable.types.ArrayFoldable,
            (applicative, f, arr) => arr.reduce(
                (acc, x) => applicative.ap(applicative.map(a => b => [...a, b], acc), f(x)),
                applicative.of([])
            ),
            'Array', Traversable.types, 'array');
    }
}
modules.push(ArrayTraversable);
/* Date */
class DateSetoid extends Setoid {
    constructor() {
        super((x, y) => types.dateCheckAndGet(x).getTime() === types.dateCheckAndGet(y).getTime(), 'Date', Setoid.types, 'date');
    }
}
modules.push(DateSetoid);
class DateOrd extends Ord {
    constructor() {
        super((x, y) => types.dateCheckAndGet(x).getTime() <= types.dateCheckAndGet(y).getTime(), 'Date', Ord.types, 'date');
    }
}
modules.push(DateOrd);
/* Maybe */
class Maybe {
    isJust() { return false; }
    isNothing() { return false; }
}
class Just extends Maybe {
    constructor(value) {
        super(); this.value = value; this._typeName = 'Maybe';
    }
    isJust() { return true; }
    map(f) { return Functor.lookup('maybe').map(f, this); }
    chain(f) { return Chain.lookup('maybe').chain(f, this); }
}
class Nothing extends Maybe {
    constructor() {
        super(); this._typeName = 'Maybe';
    }
    isNothing() { return true; }
    map(f) { return Functor.lookup('maybe').map(f, this); }
    chain(f) { return Chain.lookup('maybe').chain(f, this); }
}
Maybe.prototype[Symbols.Maybe] = true;
Maybe.Just = x => new Just(x);
Maybe.Nothing = () => new Nothing();
Maybe.of = x => new Just(x);
Maybe.isMaybe = x => x != null && x[Symbols.Maybe] === true;
Maybe.isJust = x => Maybe.isMaybe(x) && x.isJust();
Maybe.isNothing = x => Maybe.isMaybe(x) && x.isNothing();
Maybe.fromNullable = x => x == null ? new Nothing() : new Just(x);
Maybe.fold = (onNothing, onJust, m) => m.isJust() ? onJust(m.value) : onNothing();
Maybe.catch = runCatch(f => Maybe.Just(f()), Maybe.Nothing);
// Kleisli 합성이므로 compose 가 받는 것은 a -> Maybe b 꼴의 **함수**다. 'Maybe' 는 합성
// 결과가 품는 타입이지 인자의 타입이 아니다 — Either/Task 쪽과 같이 'function' 이다.
class MaybeSemigroupoid extends Semigroupoid {
    constructor() {
        super((f, g) => x => Chain.types.MaybeChain.chain(f, g(x)), 'function', Semigroupoid.types, 'maybe');
    }
}
modules.push(MaybeSemigroupoid);
class MaybeCategory extends Category {
    constructor() {
        super(Semigroupoid.types.MaybeSemigroupoid, Maybe.Just, 'function', Category.types, 'maybe');
    }
}
modules.push(MaybeCategory);
class MaybeFilterable extends Filterable {
    constructor() {
        super((pred, m) => m.isJust() && pred(m.value) ? m : Maybe.Nothing(), 'Maybe', Filterable.types, 'maybe');
    }
}
modules.push(MaybeFilterable);
class MaybeFunctor extends Functor {
    constructor() {
        super((f, m) => m.isJust() ? Maybe.Just(f(m.value)) : m, 'Maybe', Functor.types, 'maybe');
    }
}
modules.push(MaybeFunctor);
class MaybeApply extends Apply {
    constructor() {
        super(Functor.types.MaybeFunctor,
            (mf, mx) => mf.isNothing() ? mf : mx.isNothing() ? mx : Maybe.Just(mf.value(mx.value)),
            'Maybe', Apply.types, 'maybe');
    }
}
modules.push(MaybeApply);
class MaybeApplicative extends Applicative {
    constructor() {
        super(Apply.types.MaybeApply, Maybe.Just, 'Maybe', Applicative.types, 'maybe');
    }
}
modules.push(MaybeApplicative);
class MaybeAlt extends Alt {
    constructor() {
        super(Functor.types.MaybeFunctor, (a, b) => a.isNothing() ? b : a, 'Maybe', Alt.types, 'maybe');
    }
}
modules.push(MaybeAlt);
class MaybePlus extends Plus {
    constructor() {
        super(Alt.types.MaybeAlt, Maybe.Nothing, 'Maybe', Plus.types, 'maybe');
    }
}
modules.push(MaybePlus);
class MaybeAlternative extends Alternative {
    constructor() {
        super(Applicative.types.MaybeApplicative, Plus.types.MaybePlus, 'Maybe', Alternative.types, 'maybe');
    }
}
modules.push(MaybeAlternative);
class MaybeChain extends Chain {
    constructor() {
        super(Apply.types.MaybeApply, (f, m) => m.isJust() ? f(m.value) : m, 'Maybe', Chain.types, 'maybe');
    }
}
modules.push(MaybeChain);
class MaybeChainRec extends ChainRec {
    constructor() {
        super(Chain.types.MaybeChain, (f, i) => {
            let result = f(ChainRec.next, ChainRec.done, i);
            while (result.isJust() && result.value.tag === 'next') {
                result = f(ChainRec.next, ChainRec.done, result.value.value);
            }
            return result.isNothing() ? result : Maybe.Just(result.value.value);
        }, 'Maybe', ChainRec.types, 'maybe');
    }
}
modules.push(MaybeChainRec);
class MaybeMonad extends Monad {
    constructor() {
        super(Applicative.types.MaybeApplicative, Chain.types.MaybeChain, 'Maybe', Monad.types, 'maybe');
    }
}
modules.push(MaybeMonad);
class MaybeFoldable extends Foldable {
    constructor() {
        super((f, init, m) => m.isJust() ? f(init, m.value) : init, 'Maybe', Foldable.types, 'maybe');
    }
}
modules.push(MaybeFoldable);
class MaybeTraversable extends Traversable {
    constructor() {
        super(Functor.types.MaybeFunctor, Foldable.types.MaybeFoldable, (applicative, f, m) =>
            m.isJust() ? applicative.map(Maybe.Just, f(m.value)) : applicative.of(m)
            , 'Maybe', Traversable.types, 'maybe');
    }
}
modules.push(MaybeTraversable);
/* Either */
class Either {
    isLeft() { return false; }
    isRight() { return false; }
}
class Left extends Either {
    constructor(value) { super(); this.value = value; this._typeName = 'Either'; }
    isLeft() { return true; }
    map(f) { return Functor.lookup('either').map(f, this); }
    chain(f) { return Chain.lookup('either').chain(f, this); }
}
class Right extends Either {
    constructor(value) { super(); this.value = value; this._typeName = 'Either'; }
    isRight() { return true; }
    map(f) { return Functor.lookup('either').map(f, this); }
    chain(f) { return Chain.lookup('either').chain(f, this); }
}
Either.prototype[Symbols.Either] = true;
Either.Left = x => new Left(x);
Either.Right = x => new Right(x);
Either.of = x => new Right(x);
Either.isEither = x => x != null && x[Symbols.Either] === true;
Either.isLeft = x => Either.isEither(x) && x.isLeft();
Either.isRight = x => Either.isEither(x) && x.isRight();
Either.fromNullable = x => x == null ? Either.Left(null) : Either.Right(x);
Either.fold = (onLeft, onRight, e) => e.isLeft() ? onLeft(e.value) : onRight(e.value);
Either.catch = runCatch(f => Either.Right(f()), Either.Left);
class EitherSemigroupoid extends Semigroupoid {
    constructor() {
        super((f, g) => x => Chain.types.EitherChain.chain(f, g(x)), 'function', Semigroupoid.types, 'either');
    }
}
modules.push(EitherSemigroupoid);
class EitherCategory extends Category {
    constructor() {
        super(Semigroupoid.types.EitherSemigroupoid, Either.Right, 'function', Category.types, 'either');
    }
}
modules.push(EitherCategory);
class EitherFilterable extends Filterable {
    constructor() {
        super((pred, e, onFalse = identity) => e.isLeft() ? e : (pred(e.value) ? e : Either.Left(onFalse(e.value))), 'Either', Filterable.types, 'either');
    }
}
modules.push(EitherFilterable);
class EitherFunctor extends Functor {
    constructor() {
        super((f, e) => e.isRight() ? Either.Right(f(e.value)) : e, 'Either', Functor.types, 'either');
    }
}
modules.push(EitherFunctor);
class EitherBifunctor extends Bifunctor {
    constructor() {
        super((f, g, e) => e.isLeft() ? Either.Left(f(e.value)) : Either.Right(g(e.value)),
            'Either', Bifunctor.types, 'either');
    }
}
modules.push(EitherBifunctor);
class EitherApply extends Apply {
    constructor() {
        super(Functor.types.EitherFunctor,
            (ef, ex) => ef.isLeft() ? ef : ex.isLeft() ? ex : Either.Right(ef.value(ex.value)),
            'Either', Apply.types, 'either');
    }
}
modules.push(EitherApply);
class EitherApplicative extends Applicative {
    constructor() {
        super(Apply.types.EitherApply, Either.Right, 'Either', Applicative.types, 'either');
    }
}
modules.push(EitherApplicative);
class EitherAlt extends Alt {
    constructor() {
        super(Functor.types.EitherFunctor, (a, b) => a.isLeft() ? b : a, 'Either', Alt.types, 'either');
    }
}
modules.push(EitherAlt);
class EitherChain extends Chain {
    constructor() {
        super(Apply.types.EitherApply, (f, e) => e.isRight() ? f(e.value) : e, 'Either', Chain.types, 'either');
    }
}
modules.push(EitherChain);
class EitherChainRec extends ChainRec {
    constructor() {
        super(Chain.types.EitherChain, (f, i) => {
            let result = f(ChainRec.next, ChainRec.done, i);
            while (result.isRight() && result.value.tag === 'next') {
                result = f(ChainRec.next, ChainRec.done, result.value.value);
            }
            return result.isLeft() ? result : Either.Right(result.value.value);
        }, 'Either', ChainRec.types, 'either');
    }
}
modules.push(EitherChainRec);
class EitherMonad extends Monad {
    constructor() {
        super(Applicative.types.EitherApplicative, Chain.types.EitherChain, 'Either', Monad.types, 'either');
    }
}
modules.push(EitherMonad);
class EitherFoldable extends Foldable {
    constructor() {
        super((f, init, e) => e.isRight() ? f(init, e.value) : init, 'Either', Foldable.types, 'either');
    }
}
modules.push(EitherFoldable);
class EitherTraversable extends Traversable {
    constructor() {
        super(Functor.types.EitherFunctor, Foldable.types.EitherFoldable, (applicative, f, e) =>
            e.isRight() ? applicative.map(Either.Right, f(e.value)) : applicative.of(e)
            , 'Either', Traversable.types, 'either');
    }
}
modules.push(EitherTraversable);
/* Container Semigroup / Monoid */
const normalizeSemigroupKey = normalizeTypeClassKey(Semigroup, Symbols.Semigroup, 'normalizeSemigroupKey');
const resolveInnerSemigroup = (label, innerSG) => {
    if (typeof innerSG === 'string') return normalizeSemigroupKey(innerSG);
    try { return normalizeSemigroupKey(innerSG); }
    catch (e) {
        if (e instanceof TypeError) raise(new TypeError(`${label}: innerSG must be a supported semigroup key or Semigroup instance`));
        throw e;
    }
};
Maybe.Semigroup = innerSG => {
    const { key, instance: sg } = resolveInnerSemigroup('Maybe.Semigroup', innerSG);
    if (key !== null && Maybe.Semigroup._keyCache.has(key)) return Maybe.Semigroup._keyCache.get(key);
    if (key === null && Maybe.Semigroup._instanceCache.has(sg)) return Maybe.Semigroup._instanceCache.get(sg);
    const result = new Semigroup(
        (a, b) =>
            a.isNothing() ? b :
            b.isNothing() ? a :
            Maybe.Just(sg.concat(a.value, b.value)),
        'Maybe', null
    );
    if (key !== null) {
        Semigroup.types[`maybe(${key})`] = result;
        Maybe.Semigroup._keyCache.set(key, result);
    } else {
        Maybe.Semigroup._instanceCache.set(sg, result);
    }
    return result;
};
Maybe.Semigroup._keyCache = new Map();
Maybe.Semigroup._instanceCache = new WeakMap();
// Maybe는 inner가 Semigroup이기만 해도 Monoid를 구성할 수 있다.
// Nothing이 항등원 역할을 하므로 inner의 empty()가 필요 없다.
Maybe.Monoid = innerSG => {
    const { key, instance: sg } = resolveInnerSemigroup('Maybe.Monoid', innerSG);
    if (key !== null && Maybe.Monoid._keyCache.has(key)) return Maybe.Monoid._keyCache.get(key);
    if (key === null && Maybe.Monoid._instanceCache.has(sg)) return Maybe.Monoid._instanceCache.get(sg);
    const maybeSG = Maybe.Semigroup(sg);
    const result = new Monoid(maybeSG, () => Maybe.Nothing(), 'Maybe', null);
    if (key !== null) {
        Monoid.types[`maybe(${key})`] = result;
        Maybe.Monoid._keyCache.set(key, result);
    } else {
        Maybe.Monoid._instanceCache.set(sg, result);
    }
    return result;
};
Maybe.Monoid._keyCache = new Map();
Maybe.Monoid._instanceCache = new WeakMap();
Either.Semigroup = innerSG => {
    const { key, instance: sg } = resolveInnerSemigroup('Either.Semigroup', innerSG);
    if (key !== null && Either.Semigroup._keyCache.has(key)) return Either.Semigroup._keyCache.get(key);
    if (key === null && Either.Semigroup._instanceCache.has(sg)) return Either.Semigroup._instanceCache.get(sg);
    const result = new Semigroup(
        (a, b) =>
            a.isLeft() ? a :
            b.isLeft() ? b :
            Either.Right(sg.concat(a.value, b.value)),
        'Either', null
    );
    if (key !== null) {
        Semigroup.types[`either(${key})`] = result;
        Either.Semigroup._keyCache.set(key, result);
    } else {
        Either.Semigroup._instanceCache.set(sg, result);
    }
    return result;
};
Either.Semigroup._keyCache = new Map();
Either.Semigroup._instanceCache = new WeakMap();
addResolver(Semigroup, key => {
    const m = /^(maybe|either)\((.+)\)$/.exec(key);
    if (!m) return null;
    return m[1] === 'maybe' ? Maybe.Semigroup(m[2])
         : m[1] === 'either' ? Either.Semigroup(m[2])
         : null;
});
addResolver(Monoid, key => {
    const m = /^maybe\((.+)\)$/.exec(key);
    return m ? Maybe.Monoid(m[1]) : null;
});
// Applicative.Const(monoid) 의 지연 해석 — 팩토리를 부르기 전에도 const(<키>) 로 꺼낼 수 있다.
// key => 클로저 안에서 부르므로 Applicative.Const 정의(위쪽)와의 순서는 문제되지 않는다.
addResolver(Applicative, key => {
    const m = /^const\((.+)\)$/.exec(key);
    return m ? Applicative.Const(m[1]) : null;
});
/* Task */
class Task {
    constructor(computation) {
        // fork를 1회 settle로 래핑하여 다중 호출 방지
        this.fork = (reject, resolve) => {
            let settled = false;
            try {
                computation(
                    e => { if (settled) return; settled = true; reject(e); },
                    v => { if (settled) return; settled = true; resolve(v); }
                );
            } catch (e) {
                if (!settled) { settled = true; reject(e); }
            }
        };
        this._typeName = 'Task';
    }
    map(f) { return Functor.lookup('task').map(f, this); }
    chain(f) { return Chain.lookup('task').chain(f, this); }
    catchError(handler) { return Task.catchError(handler, this); }
}
Task.prototype[Symbols.Task] = true;
const settledFork = (task, onReject, onResolve) => {
    let settled = false;
    task.fork(
        e => { if (!settled) { settled = true; onReject(e); } },
        v => { if (!settled) { settled = true; onResolve(v); } }
    );
};
const createSettledGuard = () => {
    let settled = false;
    return {
        isSettled: () => settled,
        guard: callback => (...args) => {
            if (settled) return;
            settled = true;
            callback(...args);
        },
        check: callback => (...args) => {
            if (settled) return;
            callback(...args);
        }
    };
};
Task.of = x => new Task((_, resolve) => resolve(x));
Task.rejected = x => new Task((reject, _) => reject(x));
Task.isTask = x => x != null && x[Symbols.Task] === true;
Task.fold = (onRejected, onResolved, task) => task.fork(onRejected, onResolved);
Task.fromPromise = promiseFn => (...args) => new Task((reject, resolve) => {
    try {
        const result = promiseFn(...args);
        if (result && typeof result.then === 'function') {
            result.then(resolve).catch(reject);
        } else {
            resolve(result); // non-Promise 값은 그대로 resolve
        }
    } catch (e) {
        reject(e); // 즉시 throw 시 reject
    }
});
Task.fromEither = e => e.isRight() ? Task.of(e.value) : Task.rejected(e.value);
Task.all = tasks => new Task((reject, resolve) => {
    const list = Array.isArray(tasks) ? tasks : [tasks];
    if (list.length === 0) return resolve([]);
    if (!list.every(Task.isTask)) raise(new TypeError('Task.all: all elements must be Task'));
    const results = new Array(list.length);
    let completed = 0, done = false;
    list.forEach((t, i) => {
        t.fork(
            e => { if (done) return; done = true; reject(e); },
            v => {
                if (done) return;
                results[i] = v;
                completed++;
                if (completed === list.length) {
                    done = true;
                    resolve(results);
                }
            }
        );
    });
});
Task.race = tasks => new Task((reject, resolve) => {
    const list = Array.isArray(tasks) ? tasks : [tasks];
    if (list.length === 0) return reject(new Error('race: empty task list'));
    if (!list.every(Task.isTask)) raise(new TypeError('Task.race: all elements must be Task'));
    let done = false;
    list.forEach(t => t.fork(e => { if (!done) { done = true; reject(e); } }, v => { if (!done) { done = true; resolve(v); } }));
});
Task.catchError = (handler, task) => new Task((reject, resolve) => {
    task.fork(
        e => handler(e).fork(reject, resolve),
        resolve
    );
});
class TaskSemigroupoid extends Semigroupoid {
    constructor() {
        super((f, g) => x => Chain.types.TaskChain.chain(f, g(x)), 'function', Semigroupoid.types, 'task');
    }
}
modules.push(TaskSemigroupoid);
class TaskCategory extends Category {
    constructor() {
        super(Semigroupoid.types.TaskSemigroupoid, Task.of, 'function', Category.types, 'task');
    }
}
modules.push(TaskCategory);
class TaskFilterable extends Filterable {
    constructor() {
        super((pred, t) => new Task((reject, resolve) =>
            t.fork(reject, x => pred(x) ? resolve(x) : reject(x))
        ), 'Task', Filterable.types, 'task');
    }
}
modules.push(TaskFilterable);
class TaskFunctor extends Functor {
    constructor() {
        super((f, task) => new Task((reject, resolve) => {
            settledFork(task, reject, x => {
                try { resolve(f(x)); }
                catch (e) { reject(e); }
            });
        }), 'Task', Functor.types, 'task');
    }
}
modules.push(TaskFunctor);
class TaskApply extends Apply {
    constructor() {
        super(Functor.types.TaskFunctor, (taskFn, taskVal) => new Task((reject, resolve) => {
            const g = createSettledGuard();
            let func, value, funcReady = false, valueReady = false;
            const tryResolve = () => {
                if (funcReady && valueReady) {
                    try { g.guard(resolve)(func(value)); }
                    catch (e) { g.guard(reject)(e); }
                }
            };
            taskFn.fork(g.guard(reject), g.check(f => { func = f; funcReady = true; tryResolve(); }));
            taskVal.fork(g.guard(reject), g.check(v => { value = v; valueReady = true; tryResolve(); }));
        }), 'Task', Apply.types, 'task');
    }
}
modules.push(TaskApply);
class TaskApplicative extends Applicative {
    constructor() {
        super(Apply.types.TaskApply, Task.of, 'Task', Applicative.types, 'task');
    }
}
modules.push(TaskApplicative);
class TaskAlt extends Alt {
    constructor() {
        super(Functor.types.TaskFunctor, (a, b) => new Task((reject, resolve) => {
            const g = createSettledGuard();
            a.fork(
                g.check(_ => b.fork(g.guard(reject), g.guard(resolve))),
                g.guard(resolve)
            );
        }), 'Task', Alt.types, 'task');
    }
}
modules.push(TaskAlt);
class TaskChain extends Chain {
    constructor() {
        super(Apply.types.TaskApply,
            (f, task) => new Task((reject, resolve) => {
                const g = createSettledGuard();
                task.fork(
                    g.guard(reject),
                    g.check(x => {
                        try { f(x).fork(g.guard(reject), g.guard(resolve)); }
                        catch (e) { g.guard(reject)(e); }
                    })
                );
            }),
            'Task', Chain.types, 'task');
    }
}
modules.push(TaskChain);
class TaskChainRec extends ChainRec {
    constructor() {
        super(Chain.types.TaskChain,
            (f, initial) => new Task((reject, resolve) => {
                const loop = current => {
                    try {
                        f(ChainRec.next, ChainRec.done, current)
                            .fork(reject, result => {
                                result.tag === 'next' ? loop(result.value) : resolve(result.value);
                            });
                    } catch (e) { reject(e); }
                };
                loop(initial);
            }), 'Task', ChainRec.types, 'task');
    }
}
modules.push(TaskChainRec);
class TaskMonad extends Monad {
    constructor() {
        super(Applicative.types.TaskApplicative, Chain.types.TaskChain, 'Task', Monad.types, 'task');
    }
}
modules.push(TaskMonad);
/* Validation */
class Validation {
    isValid() { return false; }
    isInvalid() { return false; }
}
class Valid extends Validation {
    constructor(value) { super(); this.value = value; this._typeName = 'Validation'; }
    isValid() { return true; }
    map(f) { return Functor.lookup('validation').map(f, this); }
}
class Invalid extends Validation {
    constructor(errors, monoid = Monoid.lookup('array')) {
        super();
        this.errors = errors;
        this.monoid = monoid;
        this._typeName = 'Validation';
    }
    isInvalid() { return true; }
    map(f) { return this; }
}
Validation.prototype[Symbols.Validation] = true;
Validation.Valid = x => new Valid(x);
Validation.Invalid = (errors, monoid) => new Invalid(errors, monoid);
Validation.of = x => new Valid(x);
Validation.isValidation = x => x != null && x[Symbols.Validation] === true;
Validation.isValid = x => Validation.isValidation(x) && x.isValid();
Validation.isInvalid = x => Validation.isValidation(x) && x.isInvalid();
Validation.fromEither = (e, monoid) => e.isRight()
    ? Validation.Valid(e.value)
    : Validation.Invalid(e.value, monoid);
Validation.prototype.toEither = function () {
    return this.isValid() ? Either.Right(this.value) : Either.Left(this.errors);
};
Validation.fold = (onInvalid, onValid, v) =>
    v.isValid() ? onValid(v.value) : onInvalid(v.errors);
Validation.map = (f, v) => Functor.lookup('validation').map(f, v);
Validation.ap = (vf, va) => Apply.lookup('validation').ap(vf, va);
Validation.bimap = (f, g, v) => Bifunctor.lookup('validation').bimap(f, g, v);
Validation.reduce = (f, init, v) => Foldable.lookup('validation').reduce(f, init, v);
Validation.collect = (...validators) => f => (...args) => {
    if (validators.length === 0) return Validation.Valid(f());
    const validations = validators.map((validator, i) => {
        const result = validator(args[i]);
        return result.isRight()
            ? Validation.Valid(result.value)
            : Validation.Invalid([result.value]); // wrap in array for Monoid.lookup('array')
    });
    const curriedF = curry(f, validators.length);
    return validations.reduce(
        (acc, v) => Apply.lookup('validation').ap(acc, v),
        Validation.Valid(curriedF)
    );
};
class ValidationFunctor extends Functor {
    constructor() {
        super((f, v) => v.isValid() ? Validation.Valid(f(v.value)) : v,
            'Validation', Functor.types, 'validation');
    }
}
modules.push(ValidationFunctor);
class ValidationBifunctor extends Bifunctor {
    constructor() {
        super((f, g, v) => v.isInvalid()
            ? Validation.Invalid(f(v.errors), v.monoid)
            : Validation.Valid(g(v.value)),
            'Validation', Bifunctor.types, 'validation');
    }
}
modules.push(ValidationBifunctor);
class ValidationApply extends Apply {
    constructor() {
        super(Functor.types.ValidationFunctor,
            (vf, va) => {
                if (vf.isInvalid() && va.isInvalid()) {
                    const monoid = vf.monoid;
                    return Validation.Invalid(
                        monoid.concat(vf.errors, va.errors),
                        monoid
                    );
                }
                if (vf.isInvalid()) return vf;
                if (va.isInvalid()) return va;
                return Validation.Valid(vf.value(va.value));
            },
            'Validation', Apply.types, 'validation');
    }
}
modules.push(ValidationApply);
class ValidationApplicative extends Applicative {
    constructor() {
        super(Apply.types.ValidationApply, Validation.Valid,
            'Validation', Applicative.types, 'validation');
    }
}
modules.push(ValidationApplicative);
class ValidationFoldable extends Foldable {
    constructor() {
        super((f, init, v) => v.isValid() ? f(init, v.value) : init,
            'Validation', Foldable.types, 'validation');
    }
}
modules.push(ValidationFoldable);
/* Reader */
class Reader {
    constructor(run) {
        types.checkFunction(run, 'Reader');
        this._run = run;
        this._typeName = 'Reader';
    }
    run(env) { return this._run(env); }
    map(f) { return Functor.lookup('reader').map(f, this); }
    chain(f) { return Chain.lookup('reader').chain(f, this); }
}
Reader.prototype[Symbols.Reader] = true;
Reader.of = x => new Reader(_ => x);
Reader.isReader = x => x != null && x[Symbols.Reader] === true;
Reader.ask = new Reader(env => env);
Reader.asks = f => new Reader(env => f(env));
Reader.local = (f, reader) => new Reader(env => reader.run(f(env)));
class ReaderFunctor extends Functor {
    constructor() {
        super((f, r) => new Reader(env => f(r.run(env))), 'Reader', Functor.types, 'reader');
    }
}
modules.push(ReaderFunctor);
class ReaderApply extends Apply {
    constructor() {
        super(Functor.types.ReaderFunctor,
            (rf, ra) => new Reader(env => rf.run(env)(ra.run(env))),
            'Reader', Apply.types, 'reader');
    }
}
modules.push(ReaderApply);
class ReaderApplicative extends Applicative {
    constructor() {
        super(Apply.types.ReaderApply, Reader.of, 'Reader', Applicative.types, 'reader');
    }
}
modules.push(ReaderApplicative);
class ReaderChain extends Chain {
    constructor() {
        super(Apply.types.ReaderApply,
            (f, r) => new Reader(env => f(r.run(env)).run(env)),
            'Reader', Chain.types, 'reader');
    }
}
modules.push(ReaderChain);
class ReaderMonad extends Monad {
    constructor() {
        super(Applicative.types.ReaderApplicative, Chain.types.ReaderChain, 'Reader', Monad.types, 'reader');
    }
}
modules.push(ReaderMonad);
/* Writer */
class Writer {
    constructor(value, output, monoid = Monoid.lookup('array')) {
        this.value = value;
        this.output = output;
        this.monoid = monoid;
        this._typeName = 'Writer';
    }
    run() { return [this.value, this.output]; }
    exec() { return this.value; }
    map(f) { return Functor.lookup('writer').map(f, this); }
    chain(f) { return Chain.lookup('writer').chain(f, this); }
}
Writer.prototype[Symbols.Writer] = true;
Writer.of = (x, monoid = Monoid.lookup('array')) => new Writer(x, monoid.empty(), monoid);
Writer.isWriter = x => x != null && x[Symbols.Writer] === true;
Writer.tell = (output, monoid = Monoid.lookup('array')) => new Writer(undefined, output, monoid);
Writer.listen = w => new Writer([w.value, w.output], w.output, w.monoid);
Writer.listens = (f, w) => new Writer([w.value, f(w.output)], w.output, w.monoid);
Writer.pass = w => {
    const [a, f] = w.value;
    return new Writer(a, f(w.output), w.monoid);
};
Writer.censor = (f, w) => new Writer(w.value, f(w.output), w.monoid);
class WriterFunctor extends Functor {
    constructor() {
        super((f, w) => new Writer(f(w.value), w.output, w.monoid), 'Writer', Functor.types, 'writer');
    }
}
modules.push(WriterFunctor);
class WriterApply extends Apply {
    constructor() {
        super(Functor.types.WriterFunctor,
            (wf, wa) => new Writer(wf.value(wa.value), wf.monoid.concat(wf.output, wa.output), wf.monoid),
            'Writer', Apply.types, 'writer');
    }
}
modules.push(WriterApply);
class WriterApplicative extends Applicative {
    constructor() {
        super(Apply.types.WriterApply, Writer.of, 'Writer', Applicative.types, 'writer');
    }
}
modules.push(WriterApplicative);
class WriterChain extends Chain {
    constructor() {
        super(Apply.types.WriterApply,
            (f, w) => {
                const next = f(w.value);
                return new Writer(next.value, w.monoid.concat(w.output, next.output), w.monoid);
            },
            'Writer', Chain.types, 'writer');
    }
}
modules.push(WriterChain);
class WriterMonad extends Monad {
    constructor() {
        super(Applicative.types.WriterApplicative, Chain.types.WriterChain, 'Writer', Monad.types, 'writer');
    }
}
modules.push(WriterMonad);
/* State */
class State {
    constructor(run) {
        types.checkFunction(run, 'State');
        this._run = run;
        this._typeName = 'State';
    }
    run(s) { return this._run(s); }
    eval(s) { return this.run(s)[0]; }
    exec(s) { return this.run(s)[1]; }
    map(f) { return Functor.lookup('state').map(f, this); }
    chain(f) { return Chain.lookup('state').chain(f, this); }
}
State.prototype[Symbols.State] = true;
State.of = x => new State(s => [x, s]);
State.isState = x => x != null && x[Symbols.State] === true;
State.get = new State(s => [s, s]);
State.put = s => new State(_ => [undefined, s]);
State.modify = f => new State(s => [undefined, f(s)]);
State.gets = f => new State(s => [f(s), s]);
class StateFunctor extends Functor {
    constructor() {
        super((f, st) => new State(s => {
            const [a, s2] = st.run(s);
            return [f(a), s2];
        }), 'State', Functor.types, 'state');
    }
}
modules.push(StateFunctor);
class StateApply extends Apply {
    constructor() {
        super(Functor.types.StateFunctor,
            (sf, sa) => new State(s => {
                const [f, s2] = sf.run(s);
                const [a, s3] = sa.run(s2);
                return [f(a), s3];
            }),
            'State', Apply.types, 'state');
    }
}
modules.push(StateApply);
class StateApplicative extends Applicative {
    constructor() {
        super(Apply.types.StateApply, State.of, 'State', Applicative.types, 'state');
    }
}
modules.push(StateApplicative);
class StateChain extends Chain {
    constructor() {
        super(Apply.types.StateApply,
            (f, st) => new State(s => {
                const [a, s2] = st.run(s);
                return f(a).run(s2);
            }),
            'State', Chain.types, 'state');
    }
}
modules.push(StateChain);
class StateMonad extends Monad {
    constructor() {
        super(Applicative.types.StateApplicative, Chain.types.StateChain, 'State', Monad.types, 'state');
    }
}
modules.push(StateMonad);
/* Utilities */
const sequence = (traversable, applicative, u) => {
    if (!traversable || typeof traversable.traverse !== 'function') {
        raise(new TypeError('sequence: first argument must be a Traversable with traverse method'));
    }
    if (!types.check(u, traversable.type)) {
        raise(new TypeError(`sequence: u must be ${traversable.type}`));
    }
    return traversable.traverse(applicative, identity, u);
};
const foldMap = (foldable, monoid) => {
    if (!(foldable && foldable[Symbols.Foldable] === true)) {
        raise(new TypeError('foldMap: first argument must be a Foldable'));
    }
    if (!(monoid && monoid[Symbols.Monoid] === true)) {
        raise(new TypeError('foldMap: second argument must be a Monoid'));
    }
    return f => fa => foldable.reduce(
        (acc, a) => monoid.concat(acc, types.checkFunction(f, 'foldMap')(a)),
        monoid.empty(),
        fa
    );
};
const lift = applicative => {
    if (!(applicative && applicative[Symbols.Applicative] === true)) {
        raise(new TypeError('lift: first argument must be an Applicative'));
    }
    return f => (...args) => {
        types.checkFunction(f, 'lift');
        if (args.length === 0) return applicative.of(f());
        return args.slice(1).reduce((acc, arg) => applicative.ap(acc, arg), applicative.map(curry(f, args.length), args[0]));
    };
};
const pipeK = (monad, foldable = Foldable.lookup('array')) => {
    if (!(monad && monad[Symbols.Monad] === true)) {
        raise(new TypeError('pipeK: first argument must be a Monad'));
    }
    if (!(foldable && foldable[Symbols.Foldable] === true)) {
        raise(new TypeError('pipeK: second argument must be a Foldable'));
    }
    return fns => x => foldable.reduce((acc, fn) => monad.chain(types.checkFunction(fn, 'pipeK'), acc), monad.of(x), fns);
};
const composeK = (monad, foldable = Foldable.lookup('array')) => {
    if (!(monad && monad[Symbols.Monad] === true)) {
        raise(new TypeError('composeK: first argument must be a Monad'));
    }
    if (!(foldable && foldable[Symbols.Foldable] === true)) {
        raise(new TypeError('composeK: second argument must be a Foldable'));
    }
    return fns => pipeK(monad, foldable)(fns.slice().reverse());
};
Maybe.toEither = (defaultLeft, m) => m.isJust() ? Either.Right(m.value) : Either.Left(defaultLeft);
Maybe.pipe = (m, ...fns) => {
    if (!Maybe.isMaybe(m)) raise(new TypeError('Maybe.pipe: first argument must be a Maybe'));
    return fns.reduce((acc, fn) => {
        if (!Maybe.isMaybe(acc)) return acc;
        return acc.isJust() ? fn(acc) : acc;
    }, m);
};
Either.toMaybe = e => e.isRight() ? Maybe.Just(e.value) : Maybe.Nothing();
Either.pipe = (e, ...fns) => {
    if (!Either.isEither(e)) raise(new TypeError('Either.pipe: first argument must be an Either'));
    return fns.reduce((acc, fn) => {
        if (!Either.isEither(acc)) return acc;
        return acc.isRight() ? fn(acc) : acc;
    }, e);
};
const { transducer } = (() => {
    class Reduced {
        constructor(value) {
            this.value = value;
            this[Symbols.Reduced] = true;
        }
        static of(value) { return new Reduced(value); }
        static isReduced(value) { return value != null && value[Symbols.Reduced] === true; }
    }
    const transduce = transducer => reducer => initialValue => collection => {
        if (!types.isIterable(collection)) {
            raise(new TypeError(`transduce: expected an iterable, but got ${typeof collection}`));
        }
        const transformedReducer = types.checkFunction(transducer, 'transducer.transduce:transducer')(types.checkFunction(reducer, 'transducer.transduce:reducer'));
        let accumulator = initialValue;
        for (const item of collection) {
            accumulator = transformedReducer(accumulator, item);
            if (Reduced.isReduced(accumulator)) {
                return accumulator.value;
            }
        }
        return accumulator;
    };
    const map = f => reducer => (acc, val) => types.checkFunction(reducer, 'transducer.map:reducer')(acc, types.checkFunction(f, 'transducer.map:f')(val));
    const filter = p => reducer => (acc, val) => types.checkFunction(p, 'transducer.filter:p')(val) ? types.checkFunction(reducer, 'transducer.filter:reducer')(acc, val) : acc;
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
const { Free, trampoline } = (() => {
    const reentrantGuard = (runner, f, onReentry = f) => {
        let active = false;
        return (...args) => {
            if (active) return onReentry(...args);
            active = true;
            return runCatch(
                () => {
                    const result = runner(f(...args));
                    if (result instanceof Promise || (result && typeof result.then === 'function')) {
                        return result.finally(() => { active = false; });
                    }
                    active = false;
                    return result;
                },
                e => { active = false; throw e; }
            )();
        };
    };
    class Free {
        static of(x) { return new Pure(x); }
        static pure(x) { return new Pure(x); }
        static impure(functor) {
            functor[Symbols.Functor] || raise(new Error('Free.impure: expected a functor'));
            return new Impure(functor);
        }
        static isPure(x) { return x != null && x[Symbols.Pure] === true; }
        static isImpure(x) { return x != null && x[Symbols.Impure] === true; }
        static isFree(x) { return Free.isPure(x) || Free.isImpure(x); }
        static liftF(command) {
            command[Symbols.Functor] || raise(new Error('Free.liftF: expected a functor'));
            return Free.isFree(command)
                ? command
                : Free.impure(command.map(Free.pure));
        }
        static *runGenerator(runner, program) {
            let step = program;
            while (Free.isImpure(step)) {
                step = yield runner(step.functor);
                if (Free.isPure(step) && Free.isFree(step.value)) {
                    step = step.value;
                }
            }
            return Free.isPure(step) ? step.value : step;
        }
        static runSync(runner) {
            return target => {
                const execute = program => {
                    const gen = Free.runGenerator(runner, program);
                    let result = gen.next();
                    while (!result.done) {
                        result = gen.next(result.value);
                    }
                    return result.value;
                };
                return typeof target === 'function' ? reentrantGuard(execute, target) : execute(target);
            };
        }
        static runAsync(runner) {
            return target => {
                const execute = async program => {
                    const gen = Free.runGenerator(runner, program);
                    let result = gen.next();
                    while (!result.done) {
                        result = gen.next(await result.value);
                    }
                    return result.value;
                };
                return typeof target === 'function' ? reentrantGuard(execute, target) : execute(target);
            };
        }
        static runWithTask(runner) {
            return program => new Promise((resolve, reject) => {
                const step = free => {
                    if (Free.isPure(free)) return resolve(free.value);
                    if (Free.isImpure(free)) {
                        runner(free.functor).fork(reject, step);
                    } else {
                        reject(new Error('runWithTask: unknown Free type'));
                    }
                };
                step(program);
            });
        }
    }
    class Pure extends Free {
        constructor(value) {
            super();
            this.value = value;
            this._typeName = 'Free';
            this[Symbol.toStringTag] = 'Pure';
            this[Symbols.Pure] = true;
        }
        map(f) { return Functor.lookup('free').map(f, this); }
        chain(f) { return Chain.lookup('free').chain(f, this); }
    }
    class Impure extends Free {
        constructor(functor) {
            super();
            functor[Symbols.Functor] || raise(new Error('Impure: expected a functor'));
            this.functor = functor;
            this._typeName = 'Free';
            this[Symbol.toStringTag] = 'Impure';
            this[Symbols.Impure] = true;
        }
        map(f) { return Functor.lookup('free').map(f, this); }
        chain(f) { return Chain.lookup('free').chain(f, this); }
    }
    Free.prototype[Symbols.Free] = true;
    class Thunk {
        constructor(f) {
            types.checkFunction(f, 'Thunk');
            this.f = f;
            this[Symbol.toStringTag] = 'Thunk';
            this[Symbols.Functor] = true;
        }
        map(g) { return new Thunk(compose2(g, this.f)); }
        run() { return this.f(); }
        static of(f) { return new Thunk(f); }
        static done(value) { return Free.pure(value); }
        static suspend(f) { return Free.liftF(new Thunk(f)); }
    }
    const trampoline = Free.runSync(thunk => thunk.run());
    /* StateF — 상태 연산을 감싸는 Functor (Thunk과 동일 패턴)
       _mapChain: left-associated chain의 O(N) 스택 문제를 flat linked list로 해결 */
    const applyMapChain = (mapChain, value) => {
        const fns = [];
        let node = mapChain;
        while (node) { fns.push(node.fn); node = node.next; }
        let result = value;
        for (let i = fns.length - 1; i >= 0; i--) { result = fns[i](result); }
        return result;
    };
    class GetF {
        constructor(cont, _mapChain) {
            this.cont = cont;
            this._mapChain = _mapChain || null;
            this[Symbols.Functor] = true;
        }
        map(f) { return new GetF(this.cont, { fn: f, next: this._mapChain }); }
    }
    class PutF {
        constructor(state, next, _mapChain) {
            this.state = state;
            this.next = next;
            this._mapChain = _mapChain || null;
            this[Symbols.Functor] = true;
        }
        map(f) { return new PutF(this.state, this.next, { fn: f, next: this._mapChain }); }
    }
    class ModifyF {
        constructor(f, next, _mapChain) {
            this.f = f;
            this.next = next;
            this._mapChain = _mapChain || null;
            this[Symbols.Functor] = true;
        }
        map(g) { return new ModifyF(this.f, this.next, { fn: g, next: this._mapChain }); }
    }
    class LiftF {
        constructor(ma, cont, _mapChain) {
            this.ma = ma;
            this.cont = cont;
            this._mapChain = _mapChain || null;
            this[Symbols.Functor] = true;
        }
        map(f) { return new LiftF(this.ma, this.cont, { fn: f, next: this._mapChain }); }
    }
    /* EitherF — 에러 처리 연산을 감싸는 Functor */
    class ThrowF {
        constructor(error) {
            this.error = error;
            this[Symbols.Functor] = true;
        }
        map(_) { return this; }
    }
    class CatchF {
        constructor(program, handler, _mapChain) {
            this.program = program;
            this.handler = handler;
            this._mapChain = _mapChain || null;
            this[Symbols.Functor] = true;
        }
        map(f) { return new CatchF(this.program, this.handler, { fn: f, next: this._mapChain }); }
    }
    /* ReaderF — 환경 읽기 연산을 감싸는 Functor */
    class AskF {
        constructor(cont, _mapChain) {
            this.cont = cont;
            this._mapChain = _mapChain || null;
            this[Symbols.Functor] = true;
        }
        map(f) { return new AskF(this.cont, { fn: f, next: this._mapChain }); }
    }
    class LocalF {
        constructor(f, program, _mapChain) {
            this.f = f;
            this.program = program;
            this._mapChain = _mapChain || null;
            this[Symbols.Functor] = true;
        }
        map(g) { return new LocalF(this.f, this.program, { fn: g, next: this._mapChain }); }
    }
    /* WriterF — 출력 누적 연산을 감싸는 Functor */
    class TellF {
        constructor(output, next, _mapChain) {
            this.output = output;
            this.next = next;
            this._mapChain = _mapChain || null;
            this[Symbols.Functor] = true;
        }
        map(f) { return new TellF(this.output, this.next, { fn: f, next: this._mapChain }); }
    }
    Free.Pure = Pure;
    Free.Impure = Impure;
    Free.Thunk = Thunk;
    Free.trampoline = trampoline;
    Free.GetF = GetF;
    Free.PutF = PutF;
    Free.ModifyF = ModifyF;
    Free.LiftF = LiftF;
    Free.ThrowF = ThrowF;
    Free.CatchF = CatchF;
    Free.AskF = AskF;
    Free.LocalF = LocalF;
    Free.TellF = TellF;
    Free.applyMapChain = applyMapChain;
    return { Free, trampoline };
})();
/* Free Static Land */
class FreeFunctor extends Functor {
    constructor() {
        super(
            (f, free) => Free.isPure(free)
                ? Free.pure(f(free.value))
                : Free.impure(free.functor.map(prevFree => Functor.lookup('free').map(f, prevFree))),
            'Free', Functor.types, 'free'
        );
    }
}
modules.push(FreeFunctor);
class FreeApply extends Apply {
    constructor() {
        super(
            Functor.types.FreeFunctor,
            (mf, mx) => Chain.lookup('free').chain(f => Functor.lookup('free').map(f, mx), mf),
            'Free', Apply.types, 'free'
        );
    }
}
modules.push(FreeApply);
class FreeApplicative extends Applicative {
    constructor() {
        super(Apply.types.FreeApply, Free.pure, 'Free', Applicative.types, 'free');
    }
}
modules.push(FreeApplicative);
class FreeChain extends Chain {
    constructor() {
        super(
            Apply.types.FreeApply,
            (f, free) => Free.isPure(free)
                ? f(free.value)
                : Free.impure(free.functor.map(prevFree => Chain.lookup('free').chain(f, prevFree))),
            'Free', Chain.types, 'free'
        );
    }
}
modules.push(FreeChain);
class FreeMonad extends Monad {
    constructor() {
        super(Applicative.types.FreeApplicative, Chain.types.FreeChain, 'Free', Monad.types, 'free');
    }
}
modules.push(FreeMonad);
load(...modules);

/* Optics */
// transducer 와 같은 모양으로 IIFE 안에 가둔다 — 모듈 객체 하나만 밖으로 낸다.
const { Optics } = (() => {
    // Profunctor 인코딩: Optic s a = P => P a a -> P s s
    //
    // 어떤 P를 주입하느냐가 연산을 정한다 — 하나의 정의에서 읽기·쓰기·역생성이 모두 나온다.
    //   함수      → over/set        (dimap, first, left, wander)
    //   Forget<r> → view/preview/toList/foldMapOf  (같음. monoid로 누적)
    //   Tagged    → review          (dimap, left 만)
    //
    // Tagged에 first와 wander가 없다는 사실이 타입 안전성을 대신한다 —
    // Lens나 Traversal에 review를 쓰면 그 자리에서 TypeError가 난다.
    // P가 첫 인자이므로 plain compose로는 합성 불가 → Optics.compose 제공.

    // ── 구체 Profunctor 3종 ────────────────────────────────────────────
    // 세 딕셔너리가 공유하는 메서드가 optic 의 종류를 정한다:
    //   first  = 곱   — 짝 [a, c] 의 한쪽만 건드린다        → Lens
    //   left   = 합   — Either 의 Left 만 건드린다          → Prism
    //   wander = 순회 — 컨테이너 안의 모든 자리를 건드린다   → Traversal
    // 어느 것을 요구하느냐가 그 optic 에 무엇을 쓸 수 있는지를 정한다.

    // 함수: p a b = a -> b.  over/set 이 쓴다.
    const functionProfunctor = {
        dimap: Profunctor.lookup('function').promap,      // promap(f, g, fn) 이 dimap 과 같은 시그니처다
        first: p => t => Bifunctor.lookup('tuple').bimap(p, identity, t),
        left: p => e => Bifunctor.lookup('either').bimap(p, identity, e),
        wander: (traverse, p) => s =>
            traverse(Applicative.lookup('identity'), a => ({ value: p(a) }), s).value,
    };
    // Forget<r>: p a b = a -> r.  출력을 버리고 r 을 모은다. view/preview/toList/foldMapOf 가 쓴다.
    const forgetProfunctor = monoid => ({
        // 출력 변환을 버리므로 g 자리에 항등을 넣는다.
        dimap: (f, _g, p) => Profunctor.lookup('function').promap(f, identity, p),
        // Comonad.lookup('array').extract 가 배열의 head 라 2-튜플에서는 fst 다.
        first: p => t => p(Comonad.lookup('array').extract(t)),
        left: p => e => Either.fold(p, () => monoid.empty(), e),
        wander: (traverse, p) => s =>
            traverse(Applicative.Const(monoid), a => ({ value: p(a) }), s).value,
    });
    // Tagged: p a b = b.  입력을 무시하므로 거꾸로만 쓸 수 있다. review 가 쓴다.
    const taggedProfunctor = {
        // 여기만 Profunctor.promap 에 위임할 수 없다 — Tagged a b = b 라 profunctor 값이
        // 함수가 아닌데 promap 의 strict 검사가 세 인자 모두 함수일 것을 요구한다.
        dimap: (_f, g, p) => g(p),
        left: Either.Left,
        // Tagged 는 입력을 만들어낼 수 없으므로 곱(first)과 순회(wander)를 구현할 수 없다.
        // 그 부재가 곧 "Lens/Traversal 은 review 할 수 없다" 는 제약이다 — 명시적으로 거부한다.
        first: () => raise(new TypeError('review: argument must be a Prism (a Lens cannot be reviewed)')),
        wander: () => raise(new TypeError('review: argument must be a Prism (a Traversal cannot be reviewed)')),
    };

    // ── optic 생성자 ───────────────────────────────────────────────────
    // dimap만 쓴다 — 세 P가 모두 dimap을 가지므로 Iso는 모든 연산에서 동작한다.
    // Lens이자 Prism이라 view도 review도 되며, 그래서 optic 계층의 최상단이다.
    // 법칙: from(to(s)) === s, to(from(a)) === a (무손실 변환)
    const Iso = (to, from) => {
        typeof to !== 'function' && raise(new TypeError('Iso: to must be a function'));
        typeof from !== 'function' && raise(new TypeError('Iso: from must be a function'));
        return P => pab => P.dimap(to, from, pab);
    };
    const Lens = (getter, setter) => {
        typeof getter !== 'function' && raise(new TypeError('Lens: getter must be a function'));
        typeof setter !== 'function' && raise(new TypeError('Lens: setter must be a function'));
        return P => pab => P.dimap(s => [getter(s), s], ([b, s]) => setter(b, s), P.first(pab));
    };
    // match: s -> Maybe a,  build: a -> s
    const Prism = (match, build) => {
        typeof match !== 'function' && raise(new TypeError('Prism: match must be a function'));
        typeof build !== 'function' && raise(new TypeError('Prism: build must be a function'));
        return P => pab => P.dimap(
            s => {
                const m = match(s);
                Maybe.isMaybe(m) || raise(new TypeError('Prism: match must return a Maybe'));
                return Maybe.fold(() => Either.Right(s), a => Either.Left(a), m);
            },
            e => (e.isLeft() ? build(e.value) : e.value),
            P.left(pab)
        );
    };
    // 기존 Traversable 인스턴스를 optic으로 끌어온다 ('array' | 'maybe' | 'either' ...)
    const traversed = key => {
        const instance = Traversable.lookup(key);
        return P => pab => P.wander(instance.traverse, pab);
    };

    // ── 연산: P를 고르는 것이 전부 ─────────────────────────────────────
    const runOptic = (name, optic, P, pab, s) => {
        typeof optic !== 'function' && raise(new TypeError(`${name}: optic must be a function`));
        return optic(P)(pab)(s);
    };
    const resolveFoldMonoid = normalizeTypeClassKey(Monoid, Symbols.Monoid, 'foldMapOf');
    // 읽기 셋은 전부 foldMapOf 의 특수 경우다 — 어떤 Monoid 로 모으느냐만 다르다.
    // 인자 순서는 over(optic, f, s) 에 맞추고 monoid 를 앞에 둔다.
    // monoid 는 first 경로(Lens/Iso)에서 한 번도 안 쓰이므로, 검사하지 않으면 optic 종류에
    // 따라 통과 여부가 갈린다. 기존 foldMap(foldable, monoid) 과 같은 규칙으로 요구한다 —
    // 등록은 필요 없고 new Monoid(...) 로 만든 것이면 된다.
    const foldMapOf = (monoid, optic, f, s) => {
        // 키든 인스턴스든 받는다 — 안에서 부르는 Applicative.Const 가 이미 그러므로
        // 입구만 안 받으면 체인이 어긋난다. resolveFoldMonoid 는 Monoid 가 아니면 던진다.
        const { instance: m } = resolveFoldMonoid(monoid);
        typeof f !== 'function' && raise(new TypeError('foldMapOf: f must be a function'));
        return runOptic('foldMapOf', optic, forgetProfunctor(m), f, s);
    };
    // 읽기 셋은 각자의 이름으로 던져야 한다 — foldMapOf 에 위임하면 귀속을 잃는다.
    const toList = (optic, s) => {
        typeof optic !== 'function' && raise(new TypeError('toList: optic must be a function'));
        return foldMapOf(Monoid.lookup('array'), optic, a => [a], s);
    };
    // preview 는 대상을 "합치는" 게 아니라 "고르는" 것이므로 컨테이너를 열지 않는 Monoid 를
    // 쓴다 — plus(maybe) 다. maybe(first) 를 쓰면 안쪽 값을 합치려 들어 [1, 'a'] 처럼 타입이
    // 섞인 대상에서 던진다. 배열에 뭐가 들었든 "첫 번째" 는 답할 수 있어야 한다.
    const preview = (optic, s) => {
        typeof optic !== 'function' && raise(new TypeError('preview: optic must be a function'));
        return foldMapOf(Monoid.lookup('plus(maybe)'), optic, Maybe.Just, s);
    };
    // Lens/Iso 전용 — "정확히 1대상" 을 문서가 아니라 코드가 강제한다.
    // forgetProfunctor 에는 wander 가 있어서 Traversal 을 넘겨도 실행은 된다(review 와 달리
    // 구조가 막지 못한다). 그래서 대상 수를 세는 것이 유일한 방법이다. 0개면 undefined 를
    // 흘리지 않고, 2개 이상이면 첫 값을 조용히 주지 않는다.
    const view = (lens, s) => {
        typeof lens !== 'function' && raise(new TypeError('view: optic must be a function'));
        const targets = toList(lens, s);
        targets.length !== 1 && raise(new TypeError(
            `view: expected exactly one target, got ${targets.length} — use preview or toList`));
        return targets[0];
    };
    const over = (optic, f, s) => {
        typeof f !== 'function' && raise(new TypeError('over: f must be a function'));
        return runOptic('over', optic, functionProfunctor, f, s);
    };
    const set = (optic, b, s) => {
        typeof optic !== 'function' && raise(new TypeError('set: optic must be a function'));
        return over(optic, constant(b), s);
    };
    // review는 Tagged를 주입한다. Lens/Traversal이면 first/wander가 없어 여기서 실패한다.
    const review = (prism, a) => {
        typeof prism !== 'function' && raise(new TypeError('review: prism must be a function'));
        return prism(taggedProfunctor)(a);
    };
    // optic 합성 = 함수 합성. P를 모두에 주입한 뒤 그 층에서 잇는다.
    const composeOptic = (...optics) => {
        optics.forEach((o, i) => {
            typeof o !== 'function' && raise(new TypeError(`Optics.compose: argument ${i} must be an optic`));
        });
        // P를 모두에 주입하면 평범한 함수 N개가 되므로 이 파일의 compose 를 그대로 쓴다.
        return P => compose(...optics.map(o => o(P)));
    };

    // 내부 이름을 compose 로 두면 이 함수가 의존하는 최상위 compose 를 가린다.
    // 그래서 정의는 composeOptic 으로 두고 모듈 키에서만 compose 로 낸다.
    return {
        Optics: {
            Iso, Lens, Prism, traversed,
            compose: composeOptic, view, preview, toList, foldMapOf,
            over, set, review,
        },
    };
})();
/* ═══════════════════════════════════════════════════════════════
   Monad Transformer
   - load() 이후에 위치: Monad.lookup(), Functor.lookup() 등이 로드된 상태 필요
   - 타입 클래스 인스턴스를 동적 생성하여 레지스트리에 등록
   ═══════════════════════════════════════════════════════════════ */

const normalizeMonad = M => {
    if (typeof M === 'string') return Monad.lookup(M);
    if (!M || typeof M.of !== 'function' || typeof M.chain !== 'function' || typeof M.map !== 'function') {
        raise(new TypeError(
            'normalizeMonad: M must be a static-land style object with of(a), map(f, ma), chain(f, ma)'
        ));
    }
    return M;
};

const { GetF, PutF, ModifyF, LiftF, ThrowF, CatchF, AskF, LocalF, TellF, applyMapChain } = Free;

// _mapChain + cont를 해석하는 공통 헬퍼
const liftCont = f => f._mapChain
    ? a => applyMapChain(f._mapChain, f.cont(a))
    : f.cont;

// 타입 클래스 인스턴스 동적 등록: Functor → Apply → Applicative → Chain → Monad
// registry=null로 generic 키 오염 방지, alias만 수동 등록
// nominal typing (instanceof XT) 강제
// 전제: 호출 시점에 XT.of가 이미 완성되어 있어야 한다.
// WriterT처럼 추가 파라미터를 캡처하는 경우, of가 해당 클로저를 올바르게 품고 있어야 한다.
const registerTransformerTypeClasses = (XT, typeName, alias) => {
    const check = (val, method) => {
        if (!(val instanceof XT)) raise(new TypeError(`${typeName}.${method}: argument must be a ${typeName} instance`));
    };
    const tFunctor = new Functor(
        (f, t) => { check(t, 'map'); return new XT(Functor.lookup('free').map(f, t._program)); },
        typeName, null
    );
    Functor.types[alias] = tFunctor;
    const tApply = new Apply(tFunctor, (tf, ta) => {
        check(tf, 'ap'); check(ta, 'ap');
        return new XT(Chain.lookup('free').chain(f => Functor.lookup('free').map(f, ta._program), tf._program));
    }, typeName, null);
    Apply.types[alias] = tApply;
    const tApplicative = new Applicative(tApply, XT.of, typeName, null);
    Applicative.types[alias] = tApplicative;
    const tChain = new Chain(tApply, (f, t) => {
        check(t, 'chain');
        return new XT(Chain.lookup('free').chain(x => {
            const result = f(x);
            check(result, 'chain callback');
            return result._program;
        }, t._program));
    }, typeName, null);
    Chain.types[alias] = tChain;
    const tMonad = new Monad(tApplicative, tChain, typeName, null);
    Monad.types[alias] = tMonad;
    XT.map = tFunctor.map;
    XT.ap = tApply.ap;
    XT.chain = tChain.chain;
    XT.pipeK = (...fns) => pipeK(tMonad)(fns);
    XT.composeK = (...fns) => composeK(tMonad)(fns);
};

// type 없는 커스텀 모나드에 자동 부여되는 alias는 프로세스 실행 순서에 따라 달라진다.
// 이 alias를 외부에서 Functor.lookup('statet(m1)') 같은 식으로 참조하는 것은 권장하지 않는다.
// 문자열 M (예: 'maybe', 'either')이나 type 프로퍼티가 있는 객체 M을 사용하면 결정적 alias를 얻을 수 있다.
let _transformerAutoId = 0;
const resolveMonadType = (M, nm) => nm.type || (typeof M === 'string' ? M : `M${++_transformerAutoId}`);

/* ── StateT ── */
const StateT = (M) => {
    if (StateT._cache.has(M)) return StateT._cache.get(M);
    const nm = normalizeMonad(M);
    const typeName = `StateT(${resolveMonadType(M, nm)})`;
    const alias = typeName.toLowerCase();

    class ST {
        constructor(program) { this._program = program; this._typeName = typeName; }
        run(s) {
            if (!(this instanceof ST)) raise(new TypeError(`${typeName}.run: must be called on a ${typeName} instance`));
            return ST.runState(s, this);
        }
        eval(s) {
            if (!(this instanceof ST)) raise(new TypeError(`${typeName}.eval: must be called on a ${typeName} instance`));
            return nm.map(([a]) => a, this.run(s));
        }
        exec(s) {
            if (!(this instanceof ST)) raise(new TypeError(`${typeName}.exec: must be called on a ${typeName} instance`));
            return nm.map(([_, s2]) => s2, this.run(s));
        }
        map(f) { return Functor.lookup(alias).map(f, this); }
        chain(f) { return Chain.lookup(alias).chain(f, this); }
    }
    ST.of = x => new ST(Free.pure(x));
    ST.get = new ST(Free.liftF(new GetF(s => s)));
    ST.put = s => new ST(Free.liftF(new PutF(s, undefined)));
    ST.modify = f => new ST(Free.liftF(new ModifyF(f, undefined)));
    ST.gets = f => new ST(Free.liftF(new GetF(f)));
    ST.lift = ma => new ST(Free.liftF(new LiftF(ma, a => a)));

    ST.runState = (initial, st) => {
        if (!(st instanceof ST)) raise(new TypeError(`${typeName}.runState: second argument must be a ${typeName} instance`));
        const go = (s, free) => {
            while (Free.isImpure(free)) {
                const f = free.functor;
                const apply = val => f._mapChain ? applyMapChain(f._mapChain, val) : val;
                if (f instanceof GetF)    { free = apply(f.cont(s)); continue; }
                if (f instanceof PutF)    { s = f.state; free = apply(f.next); continue; }
                if (f instanceof ModifyF) { s = f.f(s); free = apply(f.next); continue; }
                if (f instanceof LiftF)   { return nm.chain(a => go(s, liftCont(f)(a)), f.ma); }
                throw new Error(`${typeName}.runState: unknown functor`);
            }
            return nm.of([Free.isPure(free) ? free.value : free, s]);
        };
        return go(initial, st._program);
    };

    registerTransformerTypeClasses(ST, typeName, alias);
    StateT._cache.set(M, ST);
    return ST;
};
StateT._cache = new Map();

/* ── EitherT ── */
const EitherT = (M) => {
    if (EitherT._cache.has(M)) return EitherT._cache.get(M);
    const nm = normalizeMonad(M);
    const typeName = `EitherT(${resolveMonadType(M, nm)})`;
    const alias = typeName.toLowerCase();

    class ET {
        constructor(program) { this._program = program; this._typeName = typeName; }
        run() {
            if (!(this instanceof ET)) raise(new TypeError(`${typeName}.run: must be called on a ${typeName} instance`));
            return ET.runEitherT(this);
        }
        map(f) { return Functor.lookup(alias).map(f, this); }
        chain(f) { return Chain.lookup(alias).chain(f, this); }
    }
    ET.of = x => new ET(Free.pure(x));
    ET.throwError = e => new ET(Free.liftF(new ThrowF(e)));
    ET.catchError = (et, handler) => {
        if (!(et instanceof ET)) raise(new TypeError(`${typeName}.catchError: first argument must be a ${typeName} instance`));
        return new ET(Free.liftF(new CatchF(et._program, e => {
            const result = handler(e);
            if (!(result instanceof ET)) raise(new TypeError(`${typeName}.catchError: handler must return a ${typeName} instance`));
            return result._program;
        })));
    };
    ET.lift = ma => new ET(Free.liftF(new LiftF(ma, a => a)));
    ET.fromEither = either => either.isRight() ? ET.of(either.value) : ET.throwError(either.value);

    ET.runEitherT = (et) => {
        if (!(et instanceof ET)) raise(new TypeError(`${typeName}.runEitherT: argument must be a ${typeName} instance`));
        const go = (free) => {
            while (Free.isImpure(free)) {
                const f = free.functor;
                if (f instanceof ThrowF) return nm.of(Either.Left(f.error));
                if (f instanceof CatchF) {
                    const apply = val => f._mapChain ? applyMapChain(f._mapChain, val) : Free.pure(val);
                    return nm.chain(either => {
                        if (either.isLeft()) {
                            return nm.chain(rec => rec.isLeft() ? nm.of(rec) : go(apply(rec.value)),
                                go(f.handler(either.value)));
                        }
                        return go(apply(either.value));
                    }, go(f.program));
                }
                if (f instanceof LiftF) { return nm.chain(a => go(liftCont(f)(a)), f.ma); }
                throw new Error(`${typeName}.runEitherT: unknown functor`);
            }
            return nm.of(Either.Right(Free.isPure(free) ? free.value : free));
        };
        return go(et._program);
    };

    registerTransformerTypeClasses(ET, typeName, alias);
    EitherT._cache.set(M, ET);
    return ET;
};
EitherT._cache = new Map();

/* ── ReaderT ── */
const ReaderT = (M) => {
    if (ReaderT._cache.has(M)) return ReaderT._cache.get(M);
    const nm = normalizeMonad(M);
    const typeName = `ReaderT(${resolveMonadType(M, nm)})`;
    const alias = typeName.toLowerCase();

    class RT {
        constructor(program) { this._program = program; this._typeName = typeName; }
        run(env) {
            if (!(this instanceof RT)) raise(new TypeError(`${typeName}.run: must be called on a ${typeName} instance`));
            return RT.runReaderT(env, this);
        }
        map(f) { return Functor.lookup(alias).map(f, this); }
        chain(f) { return Chain.lookup(alias).chain(f, this); }
    }
    RT.of = x => new RT(Free.pure(x));
    RT.ask = new RT(Free.liftF(new AskF(env => env)));
    RT.asks = f => new RT(Free.liftF(new AskF(f)));
    RT.local = (f, rt) => {
        if (typeof f !== 'function') raise(new TypeError(`${typeName}.local: first argument must be a function`));
        if (!(rt instanceof RT)) raise(new TypeError(`${typeName}.local: second argument must be a ${typeName} instance`));
        return new RT(Free.liftF(new LocalF(f, rt._program)));
    };
    RT.lift = ma => new RT(Free.liftF(new LiftF(ma, a => a)));

    RT.runReaderT = (env, rt) => {
        if (!(rt instanceof RT)) raise(new TypeError(`${typeName}.runReaderT: second argument must be a ${typeName} instance`));
        const go = (e, free) => {
            while (Free.isImpure(free)) {
                const f = free.functor;
                const apply = val => f._mapChain ? applyMapChain(f._mapChain, val) : val;
                if (f instanceof AskF) { free = apply(f.cont(e)); continue; }
                if (f instanceof LocalF) {
                    const applyL = val => f._mapChain ? applyMapChain(f._mapChain, val) : Free.pure(val);
                    return nm.chain(val => go(e, applyL(val)), go(f.f(e), f.program));
                }
                if (f instanceof LiftF) { return nm.chain(a => go(e, liftCont(f)(a)), f.ma); }
                throw new Error(`${typeName}.runReaderT: unknown functor`);
            }
            return nm.of(Free.isPure(free) ? free.value : free);
        };
        return go(env, rt._program);
    };

    registerTransformerTypeClasses(RT, typeName, alias);
    ReaderT._cache.set(M, RT);
    return RT;
};
ReaderT._cache = new Map();

/* ── WriterT ── */
const WriterT = (M, writerMonoid) => {
    if (!writerMonoid) writerMonoid = Monoid.lookup('array');
    if (typeof writerMonoid.empty !== 'function' || typeof writerMonoid.concat !== 'function') {
        raise(new TypeError('WriterT: monoid must have empty() and concat(a, b) methods'));
    }
    if (!WriterT._cache.has(M)) WriterT._cache.set(M, new Map());
    if (WriterT._cache.get(M).has(writerMonoid)) return WriterT._cache.get(M).get(writerMonoid);
    const nm = normalizeMonad(M);
    const mType = resolveMonadType(M, nm);
    const monoidId = writerMonoid.type || `monoid${++_transformerAutoId}`;
    const typeName = `WriterT(${mType},${monoidId})`;
    const alias = typeName.toLowerCase();

    class WT {
        constructor(program) { this._program = program; this._typeName = typeName; }
        run() {
            if (!(this instanceof WT)) raise(new TypeError(`${typeName}.run: must be called on a ${typeName} instance`));
            return WT.runWriterT(this);
        }
        map(f) { return Functor.lookup(alias).map(f, this); }
        chain(f) { return Chain.lookup(alias).chain(f, this); }
    }
    WT.of = x => new WT(Free.pure(x));
    WT.tell = output => new WT(Free.liftF(new TellF(output, undefined)));
    WT.lift = ma => new WT(Free.liftF(new LiftF(ma, a => a)));

    WT.runWriterT = (wt) => {
        if (!(wt instanceof WT)) raise(new TypeError(`${typeName}.runWriterT: argument must be a ${typeName} instance`));
        const go = (log, free) => {
            while (Free.isImpure(free)) {
                const f = free.functor;
                const apply = val => f._mapChain ? applyMapChain(f._mapChain, val) : val;
                if (f instanceof TellF) { log = writerMonoid.concat(log, f.output); free = apply(f.next); continue; }
                if (f instanceof LiftF) { return nm.chain(a => go(log, liftCont(f)(a)), f.ma); }
                throw new Error(`${typeName}.runWriterT: unknown functor`);
            }
            return nm.of([Free.isPure(free) ? free.value : free, log]);
        };
        return go(writerMonoid.empty(), wt._program);
    };

    registerTransformerTypeClasses(WT, typeName, alias);
    WriterT._cache.get(M).set(writerMonoid, WT);
    return WT;
};
WriterT._cache = new Map();

/* ═══════════════════════════════════════════════════════════════
   Actor — 가벼운 메시지 큐 + 순차 처리
   ═══════════════════════════════════════════════════════════════ */

const Actor = ({ init, handle }) => {
    if (typeof handle !== 'function') raise(new TypeError('Actor: handle must be a function'));
    let state = init;
    const queue = [];
    let processing = false;
    const subscribers = [];

    const process = () => {
        if (processing || queue.length === 0) return;
        processing = true;
        const { msg, resolve, reject } = queue.shift();
        const done = () => { processing = false; if (queue.length > 0) process(); };
        const onSuccess = ([result, newState]) => {
            state = newState;
            for (let i = 0; i < subscribers.length; i++) subscribers[i](result, state);
            resolve(result);
            done();
        };
        const onError = e => { reject(e); done(); };
        try {
            const returned = handle(state, msg);
            if (returned != null && typeof returned.fork === 'function') {
                returned.fork(onError, onSuccess);
            } else {
                onSuccess(returned);
            }
        } catch (e) {
            onError(e);
        }
    };

    return {
        send: msg => new Task((reject, resolve) => {
            queue.push({ msg, resolve, reject });
            process();
        }),
        subscribe: fn => {
            if (typeof fn !== 'function') raise(new TypeError('Actor.subscribe: argument must be a function'));
            subscribers.push(fn);
            return () => {
                const idx = subscribers.indexOf(fn);
                if (idx >= 0) subscribers.splice(idx, 1);
            };
        },
        getState: () => state,
    };
};

/* ═══════════════════════════════════════════════════════════════
   Static Methods (Eta Reduced)
   - load() 이후에 정의해야 TypeClass.lookup()가 정상 작동
   ═══════════════════════════════════════════════════════════════ */

// Functor
Maybe.map = Functor.lookup('maybe').map;
Either.map = Functor.lookup('either').map;
Task.map = Functor.lookup('task').map;
Reader.map = Functor.lookup('reader').map;
Writer.map = Functor.lookup('writer').map;
State.map = Functor.lookup('state').map;
Free.map = Functor.lookup('free').map;

// Apply
Maybe.ap = Apply.lookup('maybe').ap;
Either.ap = Apply.lookup('either').ap;
Task.ap = Apply.lookup('task').ap;
Reader.ap = Apply.lookup('reader').ap;
Writer.ap = Apply.lookup('writer').ap;
State.ap = Apply.lookup('state').ap;
Free.ap = Apply.lookup('free').ap;

// Chain
Maybe.chain = Chain.lookup('maybe').chain;
Either.chain = Chain.lookup('either').chain;
Task.chain = Chain.lookup('task').chain;
Reader.chain = Chain.lookup('reader').chain;
Writer.chain = Chain.lookup('writer').chain;
State.chain = Chain.lookup('state').chain;
Free.chain = Chain.lookup('free').chain;

// Alt
Maybe.alt = Alt.lookup('maybe').alt;
Either.alt = Alt.lookup('either').alt;
Task.alt = Alt.lookup('task').alt;

// Plus
Maybe.zero = () => Plus.lookup('maybe').zero();

// Filterable
Maybe.filter = Filterable.lookup('maybe').filter;
Task.filter = Filterable.lookup('task').filter;

// Foldable (3+ args - no eta reduction)
Maybe.reduce = (f, init, m) => Foldable.lookup('maybe').reduce(f, init, m);
Either.reduce = (f, init, e) => Foldable.lookup('either').reduce(f, init, e);

// Traversable (3+ args - no eta reduction)
Maybe.traverse = (applicative, f, m) => Traversable.lookup('maybe').traverse(applicative, f, m);
Either.traverse = (applicative, f, e) => Traversable.lookup('either').traverse(applicative, f, e);

// Bifunctor (3 args - no eta reduction)
Either.bimap = (f, g, e) => Bifunctor.lookup('either').bimap(f, g, e);

// Filterable with 3 args (no eta reduction)
Either.filter = (pred, e, onFalse) => Filterable.lookup('either').filter(pred, e, onFalse);

// ChainRec
Maybe.chainRec = ChainRec.lookup('maybe').chainRec;
Either.chainRec = ChainRec.lookup('either').chainRec;
Task.chainRec = ChainRec.lookup('task').chainRec;

// pipeK (현재 API 유지 - variadic)
Maybe.pipeK = (...fns) => pipeK(Monad.lookup('maybe'))(fns);
Either.pipeK = (...fns) => pipeK(Monad.lookup('either'))(fns);
Task.pipeK = (...fns) => pipeK(Monad.lookup('task'))(fns);
Reader.pipeK = (...fns) => pipeK(Monad.lookup('reader'))(fns);
Writer.pipeK = (...fns) => pipeK(Monad.lookup('writer'))(fns);
State.pipeK = (...fns) => pipeK(Monad.lookup('state'))(fns);
Free.pipeK = (...fns) => pipeK(Monad.lookup('free'))(fns);

// composeK (현재 API 유지 - variadic)
Maybe.composeK = (...fns) => composeK(Monad.lookup('maybe'))(fns);
Either.composeK = (...fns) => composeK(Monad.lookup('either'))(fns);
Task.composeK = (...fns) => composeK(Monad.lookup('task'))(fns);
Reader.composeK = (...fns) => composeK(Monad.lookup('reader'))(fns);
Writer.composeK = (...fns) => composeK(Monad.lookup('writer'))(fns);
State.composeK = (...fns) => composeK(Monad.lookup('state'))(fns);
Free.composeK = (...fns) => composeK(Monad.lookup('free'))(fns);

// lift (eta reduced)
Reader.lift = lift(Applicative.lookup('reader'));
Writer.lift = lift(Applicative.lookup('writer'));
State.lift = lift(Applicative.lookup('state'));
Free.lift = lift(Applicative.lookup('free'));

// lift (with error handling - cannot eta reduce)
Maybe.lift = f => runCatch(lift(Applicative.lookup('maybe'))(f), Maybe.Nothing);
Either.lift = f => runCatch(lift(Applicative.lookup('either'))(f), Either.Left);
Task.lift = f => runCatch(lift(Applicative.lookup('task'))(f), Task.rejected);

const extra = (() => {
    const path = keyStr => data => keyStr.split('.').map(k => k.trim()).reduce(
        (acc, key) => Chain.types.EitherChain.chain(obj => Either.fromNullable(obj[key]), acc),
        Either.fromNullable(data)
    );
    const template = (message, data) => message.replace(/\{\{([^}]+)\}\}/g,
        (match, keyStr) => Either.fold(_ => match, identity, path(keyStr)(data)));
    return { path, template };
})();

export default {
    Algebra, Setoid, Ord, Semigroup, Monoid, Group, Semigroupoid, Category,
    Filterable, Functor, Bifunctor, Contravariant, Profunctor,
    Apply, Applicative, Alt, Plus, Alternative, Chain, ChainRec, Monad, Foldable,
    Extend, Comonad, Traversable, Maybe, Either, Task, Free, Validation, Reader, Writer, State,
    StateT, EitherT, ReaderT, WriterT, Actor,
    Optics,
    identity, compose, compose2, sequence, foldMap, lift, pipeK, composeK, runCatch,
    constant, tuple, apply, unapply, unapply2, curry, curry2, uncurry, uncurry2,
    predicate, predicateN, negate, negateN,
    flip, flip2, flipCurried, flipCurried2, pipe, pipe2,
    tap, also, into, useOrLift, partial, once, converge, range, rangeBy, transducer, trampoline,
    extra, setStrictMode, setTapErrorHandler
};
