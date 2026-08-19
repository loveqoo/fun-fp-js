/**
 * Fun-FP-JS - Functional Programming Library
 * Version: 0.1.0
 * Commit: 28a93ef2be2e91733143625298bf3df1399a4a30
 * Built: 2026-08-19T10:31:34.732Z
 * Changelog: https://github.com/loveqoo/fun-fp-js/blob/main/CHANGELOG.md
 * Static Land specification compliant
 */
// ES2018 상한 *위*의 둘만 검사한다 — 아래의 것은 상한을 지키는 런타임에 반드시 있다. docs/internals.md#es-ceiling
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
        filter: (pred, obj) => polyfills.object.fromEntries(
            Object.entries(obj).filter(([k, v]) => pred(v, k))
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
    MonadError: Symbol.for('fun-fp-js/MonadError'),
    Foldable: Symbol.for('fun-fp-js/Foldable'),
    Reducible: Symbol.for('fun-fp-js/Reducible'),
    Extend: Symbol.for('fun-fp-js/Extend'),
    Comonad: Symbol.for('fun-fp-js/Comonad'),
    Traversable: Symbol.for('fun-fp-js/Traversable'),
    // Static Land 밖이다 — optics 가 요구하는 profunctor 확장 셋. docs/internals.md#optics
    Strong: Symbol.for('fun-fp-js/Strong'),
    Choice: Symbol.for('fun-fp-js/Choice'),
    Wander: Symbol.for('fun-fp-js/Wander'),
    Identity: Symbol.for('fun-fp-js/Identity'),
    Maybe: Symbol.for('fun-fp-js/Maybe'),
    Either: Symbol.for('fun-fp-js/Either'),
    Task: Symbol.for('fun-fp-js/Task'),
    Free: Symbol.for('fun-fp-js/Free'),
    Pure: Symbol.for('fun-fp-js/Pure'),
    Impure: Symbol.for('fun-fp-js/Impure'),
    Reduced: Symbol.for('fun-fp-js/Reduced'),
    Validation: Symbol.for('fun-fp-js/Validation'),
    NonEmptyList: Symbol.for('fun-fp-js/NonEmptyList'),
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
        return (a.constructor && a.constructor.name) || 'object';
    },
    equals: (a, b, typeName = '') => typeName ? types.of(a) === typeName && types.of(b) === typeName : types.of(a) === types.of(b),
    check: (val, expected) => {
        if (typeof expected !== 'string') return false;
        // 'any' 는 "값 타입을 보지 않는다" 는 뜻이다 — 같은 타입 검사는 types.equals 가 따로 진다. docs/internals.md#any
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
// predicate 가 참인 동안만 잇는 pipe — 값이 안 바뀌면 predicate 도 안 바뀌므로 사실상 멈춘다.
const pipeWhile = predicate => {
    types.checkFunction(predicate, 'pipeWhile');
    return (value, ...fns) => fns.reduce(
        (acc, fn) => predicate(acc) ? types.checkFunction(fn, 'pipeWhile')(acc) : acc,
        value
    );
};
// 꺼내는 수단을 새로 쓰지 않고 조합자로 세운다 — apply(identity) 가 첫 인자, flip 을 씌우면 마지막 인자다.
const fst = apply(identity);
const snd = apply(flip(identity));
// 모듈 지역이다 — second/right 유도(dimap(swap, swap) ∘ first)에만 쓰이므로 공개하지 않는다.
const swap = apply(flip(tuple));
const tap = (...fs) => x => (fs.forEach(f => runCatch(f, config.tapErrorHandler)(x)), x);
const also = flipCurried(tap);
const pipeFrom = flipCurried(pipe);
const partial = (f, ...args) => (...next) => types.checkFunction(f, 'partial')(...args, ...next);
const useOrLift = check => lift => x => predicate(check)(x) ? x : types.checkFunction(lift, 'useOrLift')(x);
const once = f => {
    types.checkFunction(f, 'once');
    let called = false;
    let result;
    return (...args) => {
        // called 를 f 실행 전에 세운다 — 안 그러면 f 안에서 자기를 다시 부를 때 두 번 실행된다.
        if (!called) {
            called = true;
            result = f(...args);
        }
        return result;
    };
};
const converge = (f, ...branches) => (...args) => types.checkFunction(f, 'converge')(...branches.map((branch, i) => types.checkFunction(branch, `converge:${i}`)(...args)));
// 정수·유한을 입구에서 본다 — 안 보면 NaN 은 [], 1.5 는 [0], '3' 은 [0,1,2], Infinity 는 RangeError 로 갈린다(6차 감사 12).
const range = n => {
    if (!Number.isInteger(n) || n < 0) raise(new RangeError(`range: n must be a non-negative integer, got ${String(n)}`));
    return Array.from({ length: n }, (_, i) => i);
};
const rangeBy = (start, end) => {
    if (!Number.isInteger(start) || !Number.isInteger(end)) {
        raise(new RangeError(`rangeBy: start and end must be integers, got ${String(start)} and ${String(end)}`));
    }
    return start >= end ? [] : range(end - start).map(i => start + i);
};
// 레지스트리에 쓰는 **유일한 문** — 우회하면 역인덱스가 어긋나 Algebra.all 에서 조용히 사라진다. docs/internals.md#registry-writes
const registryIndex = new Map();
const registerAs = (types, key, instance) => {
    types[key] = instance;
    if (!instance || typeof instance.type !== 'string') return;
    const typeKey = instance.type.toLowerCase();
    if (!registryIndex.has(typeKey)) registryIndex.set(typeKey, new Map());
    const bucket = registryIndex.get(typeKey);
    let entry = bucket.get(instance);
    if (entry === undefined || entry === null) entry = { name: null, key: null };
    // 대문자로 시작하는 키는 클래스 이름이고, 그것이 표시 이름이 된다.
    const field = key[0] === key[0].toUpperCase() ? 'name' : 'key';
    if (entry[field] === undefined || entry[field] === null) entry[field] = key;
    bucket.set(instance, entry);
};
const register = (target, instance, ...aliases) => {
    registerAs(target, instance.constructor.name, instance);
    for (const alias of aliases) { registerAs(target, alias.toLowerCase(), instance); }
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
// 'any' 에 "match any" 라고 쓰면 원인을 가린다 — 남는 실패 이유는 "두 인자가 다른 타입" 뿐이다. docs/internals.md#any
const binaryTypeError = (label, type) => new TypeError(
    type === 'any'
        ? `${label}: arguments must be the same type`
        : `${label}: arguments must be the same type and match ${type}`
);
// 단항 연산용 — type 이 'any' 면 짝이 없어 검사가 남지 않고, 메시지가 그 사실을 숨기지 않는다. docs/internals.md#any
const unaryTypeError = (label, type) => new TypeError(`${label}: argument must match ${type}`);
const checkAndSet = (config => {
    const rules = {
        Setoid: {
            strict: (instance, equals) => {
                typeof equals !== 'function' && raise(new TypeError('Setoid.equals: equals must be a function'));
                instance.equals = (a, b) => (types.equals(a, b) && types.check(a, instance.type)) ? equals(a, b) : raise(binaryTypeError('Setoid.equals', instance.type));
            }, loose: (instance, equals) => { instance.equals = (a, b) => equals(a, b); }
        },
        'Ord.super': {
            strict: (setoid) => { !(setoid && setoid[Symbols.Setoid]) && raise(new TypeError('Ord: argument must be a Setoid')); },
            loose: emptyFunc
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
        // 명세는 id 를 "불러서" 항등 사상을 얻는다: id :: () -> T a a. 사상 자체가 아니다.
        Category: {
            strict: (instance, semigroupoid, id) => {
                typeof id !== 'function' && raise(new TypeError('Category.id: id must be a function'));
                instance.id = () => id;
            },
            loose: (instance, semigroupoid, id) => { instance.id = () => id; }
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
                // 세 번째 인자는 함수가 아닐 수 있다(Tagged a b = b) — 함수로 못 박지 않고 instance.type 으로 본다. docs/internals.md#optics
                instance.promap = (f, g, fn) => (types.equals(f, g, 'function') && types.check(fn, instance.type)) ? promap(f, g, fn) : raise(new TypeError(`Profunctor.promap: f and g must be functions and the third argument must match ${instance.type}`));
            },
            loose: (instance, promap) => { instance.promap = (f, g, fn) => promap(f, g, fn); }
        },
        // profunctor 값에 공통 모양은 없다 — 함수(function·Forget)도 아무 값(Tagged, .type 'any')도 된다. docs/internals.md#optics
        'Strong.super': {
            strict: (profunctor) => { !(profunctor && profunctor[Symbols.Profunctor]) && raise(new TypeError('Strong: argument must be a Profunctor')); },
            loose: emptyFunc
        },
        Strong: {
            strict: (instance, _profunctor, first, second) => {
                typeof first !== 'function' && raise(new TypeError('Strong.first: first must be a function'));
                typeof second !== 'function' && raise(new TypeError('Strong.second: second must be a function'));
                instance.first = p => types.check(p, instance.type) ? first(p) : raise(unaryTypeError('Strong.first', instance.type));
                instance.second = p => types.check(p, instance.type) ? second(p) : raise(unaryTypeError('Strong.second', instance.type));
            },
            loose: (instance, _profunctor, first, second) => {
                instance.first = p => first(p);
                instance.second = p => second(p);
            }
        },
        'Choice.super': {
            strict: (profunctor) => { !(profunctor && profunctor[Symbols.Profunctor]) && raise(new TypeError('Choice: argument must be a Profunctor')); },
            loose: emptyFunc
        },
        Choice: {
            strict: (instance, _profunctor, left, right) => {
                typeof left !== 'function' && raise(new TypeError('Choice.left: left must be a function'));
                typeof right !== 'function' && raise(new TypeError('Choice.right: right must be a function'));
                instance.left = p => types.check(p, instance.type) ? left(p) : raise(unaryTypeError('Choice.left', instance.type));
                instance.right = p => types.check(p, instance.type) ? right(p) : raise(unaryTypeError('Choice.right', instance.type));
            },
            loose: (instance, _profunctor, left, right) => {
                instance.left = p => left(p);
                instance.right = p => right(p);
            }
        },
        // Traversable.super 와 같은 모양 — JS 는 다중 상속이 안 되므로 둘째 부모를 받아 검증한다.
        'Wander.super': {
            strict: (strong, choice) => {
                !(strong && strong[Symbols.Strong]) && raise(new TypeError('Wander: first argument must be a Strong'));
                !(choice && choice[Symbols.Choice]) && raise(new TypeError('Wander: second argument must be a Choice'));
            },
            loose: emptyFunc
        },
        Wander: {
            strict: (instance, _strong, _choice, wander) => {
                typeof wander !== 'function' && raise(new TypeError('Wander.wander: wander must be a function'));
                instance.wander = (traverse, p) => types.isFunction(traverse)
                    ? wander(traverse, p)
                    : raise(new TypeError('Wander.wander: first argument must be a traverse function'));
            },
            loose: (instance, _strong, _choice, wander) => { instance.wander = (traverse, p) => wander(traverse, p); }
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
        MonadError: {
            strict: (instance, raiseError, handleError) => {
                typeof raiseError !== 'function' && raise(new TypeError('MonadError: raiseError must be a function'));
                typeof handleError !== 'function' && raise(new TypeError('MonadError: handleError must be a function'));
                instance.raiseError = e => raiseError(e);
                instance.handleError = (f, fa) => (types.isFunction(f) && types.check(fa, instance.type)) ? handleError(f, fa) : raise(new TypeError(`MonadError.handleError: arguments must be (function, ${instance.type})`));
            },
            loose: (instance, raiseError, handleError) => { instance.raiseError = e => raiseError(e); instance.handleError = (f, fa) => handleError(f, fa); }
        },
        Foldable: {
            strict: (instance, reduce) => {
                typeof reduce !== 'function' && raise(new TypeError('Foldable.reduce: reduce must be a function'));
                instance.reduce = (f, init, a) => (types.isFunction(f) && types.check(a, instance.type)) ? reduce(f, init, a) : raise(new TypeError(`Foldable.reduce: arguments must be (function, initial, ${instance.type})`));
            },
            loose: (instance, reduce) => { instance.reduce = (f, init, a) => reduce(f, init, a); }
        },
        'Reducible.super': {
            strict: (foldable) => { !(foldable && foldable[Symbols.Foldable]) && raise(new TypeError('Reducible: argument must be a Foldable')); },
            loose: emptyFunc
        },
        Reducible: {
            strict: (instance, reduceLeft, reduceMap) => {
                typeof reduceLeft !== 'function' && raise(new TypeError('Reducible: reduceLeft must be a function'));
                typeof reduceMap !== 'function' && raise(new TypeError('Reducible: reduceMap must be a function'));
                instance.reduceLeft = (f, fa) => (types.isFunction(f) && types.check(fa, instance.type)) ? reduceLeft(f, fa) : raise(new TypeError(`Reducible.reduceLeft: arguments must be (function, ${instance.type})`));
                instance.reduceMap = (semigroup, f, fa) => {
                    (semigroup && semigroup[Symbols.Semigroup] === true) || raise(new TypeError('Reducible.reduceMap: first argument must be a Semigroup'));
                    return (types.isFunction(f) && types.check(fa, instance.type)) ? reduceMap(semigroup, f, fa) : raise(new TypeError(`Reducible.reduceMap: arguments must be (Semigroup, function, ${instance.type})`));
                };
            },
            loose: (instance, reduceLeft, reduceMap) => { instance.reduceLeft = (f, fa) => reduceLeft(f, fa); instance.reduceMap = (sg, f, fa) => reduceMap(sg, f, fa); }
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
// 같은 type 이면 상위의 검사와 글자 그대로 같다 — docs/internals.md#unwrap (성능은 근거가 아니다)
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
// Static Land 의 "Ord must also implement Setoid" — 순서를 아는 것은 같음도 안다.
class Ord extends Setoid {
    constructor(setoid, lte, type, registry, ...aliases) {
        checkAndSet('Ord.super')(setoid);
        super(setoid.equals, type);
        unwrapIfSameType(this, setoid, 'equals');
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
// ── Static Land 밖의 셋 — first/left/wander 가 각각 Lens/Prism/Traversal 을 낸다. docs/internals.md#optics ──
class Strong extends Profunctor {
    constructor(profunctor, first, second, type, registry, ...aliases) {
        checkAndSet('Strong.super')(profunctor);
        super(profunctor.promap, type);
        checkAndSet('Strong')(this, profunctor, first, second);
        registry && register(registry, this, ...aliases);
    }
    first() { raise(new Error('Strong: first is not implemented')); }
    second() { raise(new Error('Strong: second is not implemented')); }
}
Strong.prototype[Symbols.Strong] = true;
class Choice extends Profunctor {
    constructor(profunctor, left, right, type, registry, ...aliases) {
        checkAndSet('Choice.super')(profunctor);
        super(profunctor.promap, type);
        checkAndSet('Choice')(this, profunctor, left, right);
        registry && register(registry, this, ...aliases);
    }
    left() { raise(new Error('Choice: left is not implemented')); }
    right() { raise(new Error('Choice: right is not implemented')); }
}
Choice.prototype[Symbols.Choice] = true;
// 부모가 둘이라 Traversable 선례를 따른다 — 하나만 상속하고 나머지는 생성자로 받아 복사한다.
class Wander extends Strong {
    constructor(strong, choice, wander, type, registry, ...aliases) {
        checkAndSet('Wander.super')(strong, choice);
        super(strong, strong.first, strong.second, type);
        this.left = choice.left;
        this.right = choice.right;
        checkAndSet('Wander')(this, strong, choice, wander);
        registry && register(registry, this, ...aliases);
    }
    wander() { raise(new Error('Wander: wander is not implemented')); }
}
Wander.prototype[Symbols.Wander] = true;
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
// Plus 는 alt+zero 를 다 가져 구조적으로 Monoid 다. 키는 그 타입 이름 그대로 — docs/internals.md#plus-monoid
const deriveFromPlus = (plus, type, aliases) => {
    const semigroup = new Semigroup(plus.alt, type);
    const monoid = new Monoid(semigroup, plus.zero, type);
    for (const alias of aliases) {
        const key = alias.toLowerCase();
        // 이미 Monoid 가 있으면 유도본은 중복이고, registerAs 는 조용히 덮는다 — 여기서 막는다. docs/internals.md#plus-monoid
        if (Semigroup.types[key] === undefined) registerAs(Semigroup.types, key, semigroup);
        if (Monoid.types[key] === undefined) registerAs(Monoid.types, key, monoid);
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
// 명세 밖 — 실패를 일급으로. raiseError 가 실패를 만들고 handleError 가 잡는다. docs/internals.md#monaderror
class MonadError extends Monad {
    constructor(applicative, chain, raiseError, handleError, type, registry, ...aliases) {
        super(applicative, chain, type);
        checkAndSet('MonadError')(this, raiseError, handleError);
        registry && register(registry, this, ...aliases);
    }
    raiseError() { raise(new Error('MonadError: raiseError is not implemented')); }
    handleError() { raise(new Error('MonadError: handleError is not implemented')); }
}
MonadError.prototype[Symbols.MonadError] = true;
class Foldable extends Algebra {
    constructor(reduce, type, registry, ...aliases) {
        super(type);
        checkAndSet('Foldable')(this, reduce);
        registry && register(registry, this, ...aliases);
    }
    reduce() { raise(new Error('Foldable: reduce is not implemented')); }
}
Foldable.prototype[Symbols.Foldable] = true;
// 명세 밖 — 비어 있을 수 없는 것의 접기. Monoid(빈 경우의 답) 없이 Semigroup 만 받는다. docs/internals.md#reducible
class Reducible extends Foldable {
    constructor(foldable, reduceLeft, reduceMap, type, registry, ...aliases) {
        checkAndSet('Reducible.super')(foldable);
        super(foldable.reduce, type);
        unwrapIfSameType(this, foldable, 'reduce');
        checkAndSet('Reducible')(this, reduceLeft, reduceMap);
        registry && register(registry, this, ...aliases);
    }
    reduceLeft() { raise(new Error('Reducible: reduceLeft is not implemented')); }
    reduceMap() { raise(new Error('Reducible: reduceMap is not implemented')); }
}
Reducible.prototype[Symbols.Reducible] = true;
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

// 정적 조회는 lookup 이다. of 는 값 주입 전용 — docs/README.md 「lookup 과 of」
const withTypeRegistry = TypeClass => {
    TypeClass.types = {};
    // 프로토타입 구성원(constructor·toString)이 조회에 걸리면 안 된다 — 등록된 것만 인스턴스다.
    TypeClass.resolver = key => Object.prototype.hasOwnProperty.call(TypeClass.types, key) ? TypeClass.types[key] : undefined;
    TypeClass.lookup = key => TypeClass.resolver(key)
        || raise(new TypeError(`${TypeClass.name}.lookup: unsupported key ${key}`));
};
const addResolver = (TypeClass, resolver) => {
    const prev = TypeClass.resolver;
    TypeClass.resolver = key => prev(key) || resolver(key);
};
// Algebra.all(<타입키>) — 그 타입의 인스턴스를 한 객체로. docs/internals.md#algebra-all
const capHead = s => s.charAt(0).toUpperCase() + s.slice(1);
const camelHead = s => s.charAt(0).toLowerCase() + s.slice(1);
const composedName = (key, className) =>
    camelHead(key.split(/[(),]+/).filter(Boolean).map(capHead).join('') + className);
Algebra.all = key => {
    typeof key === 'string' || raise(new TypeError('Algebra.all: key must be a string'));
    // 소문자만 받는다 — 역인덱스가 .type 을 소문자로 눕혀 쌓으므로 입구도 하나로 고정한다. docs/internals.md#algebra-all
    key === key.toLowerCase() || raise(new TypeError(`Algebra.all: key must be lowercase, got ${key}`));
    const found = registryIndex.get(key);
    (found && found.size > 0) || raise(new TypeError(`Algebra.all: unsupported type ${key}`));
    const result = {};
    for (const [instance, { name, key: composed }] of found) {
        result[name ? camelHead(name) : composedName(composed, instance.constructor.name)] = instance;
    }
    return result;
};

Setoid.op = (a, b) => a === b;
withTypeRegistry(Setoid);

Ord.op = (a, b) => a <= b;
withTypeRegistry(Ord);

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
// 빼먹으면 Strong.types 가 정적 상속으로 Profunctor.types 를 가리켜 남의 인스턴스를 자기 것으로 착각한다.
withTypeRegistry(Strong);
withTypeRegistry(Choice);
withTypeRegistry(Wander);
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
withTypeRegistry(MonadError);
withTypeRegistry(Foldable);
withTypeRegistry(Reducible);
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
        super((f, pred) => compose2(pred, f), 'function', Contravariant.types, 'predicate');
    }
}
modules.push(PredicateContravariant);
// 입력을 고정한 (a ->) 의 Functor. map 은 후합성이다 — compose2 와 같은 연산.
class FunctionFunctor extends Functor {
    constructor() {
        super(compose2, 'function', Functor.types, 'function');
    }
}
modules.push(FunctionFunctor);
class FunctionProfunctor extends Profunctor {
    constructor() {
        super((f, g, fn) => compose(g, fn, f), 'function', Profunctor.types, 'function');
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
        super(Monoid.types.BooleanXorMonoid, identity, 'boolean', Group.types);
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
        super(Setoid.types.NumberSetoid, Ord.op, 'number', Ord.types, 'number');
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
        super(Setoid.types.StringSetoid, Ord.op, 'string', Ord.types, 'string');
    }
}
modules.push(StringOrd);
// 길이·로케일 순서는 글자 동등과 다른 동치를 낳고, 그 동치가 곧 짝 Setoid 다 — docs/internals.md#ord-setoid
class StringLengthSetoid extends Setoid {
    constructor() {
        super((x, y) => x.length === y.length, 'string', Setoid.types);
    }
}
modules.push(StringLengthSetoid);
class StringLengthOrd extends Ord {
    constructor() {
        super(Setoid.types.StringLengthSetoid, (x, y) => x.length <= y.length, 'string', Ord.types);
    }
}
modules.push(StringLengthOrd);
class StringLocaleSetoid extends Setoid {
    constructor() {
        super((x, y) => x.localeCompare(y) === 0, 'string', Setoid.types);
    }
}
modules.push(StringLocaleSetoid);
class StringLocaleOrd extends Ord {
    constructor() {
        super(Setoid.types.StringLocaleSetoid, (x, y) => x.localeCompare(y) <= 0, 'string', Ord.types);
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
// Monoid 가 아니다(항등원 없음). Maybe 로 감쌀 때 갈리는 두 길: docs/internals.md#any
class FirstSemigroup extends Semigroup {
    constructor() {
        super(identity, 'any', Semigroup.types, 'first');
    }
}
modules.push(FirstSemigroup);
class LastSemigroup extends Semigroup {
    constructor() {
        super((x, y) => y, 'any', Semigroup.types, 'last');
    }
}
modules.push(LastSemigroup);
// lookup('default') 의 실체. 값 타입은 안 보지만 인자끼리 같은 타입이어야 한다 — 'any' 의 뜻 그대로다.
class DefaultSetoid extends Setoid {
    constructor() {
        super(Setoid.op, 'any', Setoid.types, 'default');
    }
}
modules.push(DefaultSetoid);
// 확실히 비교되는 것만 답한다(소유자, 2026-08-19) — 객체끼리 `<=` 는 둘 다 "[object Object]" 로
// 강제 변환돼 서로 다른 값이 양방향으로 참이 되고, 짝 Setoid(===)와 어긋난다. docs/internals.md#any
const ORDERABLE = ['number', 'string', 'boolean', 'bigint'];
const defaultLte = (a, b) => ORDERABLE.indexOf(typeof a) === -1
    ? raise(new TypeError(`Ord.lte: default Ord compares number, string, boolean, and bigint only, got ${typeof a}`))
    : Ord.op(a, b);
class DefaultOrd extends Ord {
    constructor() {
        super(Setoid.types.DefaultSetoid, defaultLte, 'any', Ord.types, 'default');
    }
}
modules.push(DefaultOrd);
/* Object */
class ObjectFilterable extends Filterable {
    constructor() {
        super((pred, obj) => polyfills.object.filter(pred, obj), 'Object', Filterable.types, 'object');
    }
}
modules.push(ObjectFilterable);
class ObjectFoldable extends Foldable {
    constructor() {
        super((f, init, obj) => Object.values(obj).reduce(f, init), 'Object', Foldable.types, 'object');
    }
}
modules.push(ObjectFoldable);
// 키 문자열이든 인스턴스든 { key, instance } 로 정규화한다 — key 가 null 이면 "레지스트리 대신 인스턴스로 캐시" 신호다.
const normalizeTypeClassKey = (TypeClass, symbol, label) => x => {
    const instance = typeof x === 'string' ? TypeClass.lookup(x) : x;
    if (typeof x !== 'string' && !(x && x[symbol] === true)) {
        raise(new TypeError(`${label}: argument must be a string or ${TypeClass.name} instance`));
    }
    const ctor = instance.constructor;
    const rawName = ctor && ctor.name;
    const ctorName = (rawName && typeof rawName.toLowerCase === 'function') ? rawName.toLowerCase() : '';
    let best = null;
    for (const [k, v] of Object.entries(TypeClass.types)) {
        if (v === instance && k === k.toLowerCase() && k !== ctorName) {
            if (best === null || k.length < best.length || (k.length === best.length && k < best)) best = k;
        }
    }
    return { key: best, instance };
};
/* Identity / Const — traverse 에 넘기는 Applicative 두 개 */
// 캐리어가 스스로를 밝힌다 — { value } 만으로는 Identity·Const·평범한 객체가 섞인다. docs/internals.md#identity-const
class Identity {
    constructor(value) { this.value = value; this._typeName = 'Identity'; }
    map(f) { return Functor.lookup('identity').map(f, this); }
    extend(f) { return Extend.lookup('identity').extend(f, this); }
    extract() { return Comonad.lookup('identity').extract(this); }
}
Identity.prototype[Symbols.Identity] = true;
Identity.of = value => new Identity(value);
// 문자열은 베낄 수 있지만 심볼은 이 표에서만 온다 — isIdentity 는 위조를 가른다.
Identity.isIdentity = x => x != null && x[Symbols.Identity] === true;
const identityOf = Identity.of;
class IdentityFunctor extends Functor {
    constructor() {
        super((f, x) => identityOf(f(x.value)), 'Identity', Functor.types, 'identity');
    }
}
modules.push(IdentityFunctor);
class IdentityApply extends Apply {
    constructor() {
        super(Functor.types.IdentityFunctor,
              (ff, fa) => identityOf(ff.value(fa.value)), 'Identity', Apply.types, 'identity');
    }
}
modules.push(IdentityApply);
class IdentityApplicative extends Applicative {
    constructor() {
        super(Apply.types.IdentityApply, identityOf, 'Identity', Applicative.types, 'identity');
    }
}
modules.push(IdentityApplicative);
// Optics 가 캐리어에서 값을 꺼낼 때 `.value` 를 직접 읽고 있었다 — 꺼내는 것의 이름은 extract 다.
class IdentityExtend extends Extend {
    constructor() {
        super(Functor.types.IdentityFunctor, (f, w) => identityOf(f(w)), 'Identity', Extend.types, 'identity');
    }
}
modules.push(IdentityExtend);
class IdentityComonad extends Comonad {
    constructor() {
        super(Extend.types.IdentityExtend, w => w.value, 'Identity', Comonad.types, 'identity');
    }
}
modules.push(IdentityComonad);
class IdentityFoldable extends Foldable {
    constructor() {
        super((f, init, id) => f(init, id.value), 'Identity', Foldable.types, 'identity');
    }
}
modules.push(IdentityFoldable);
class IdentityReducible extends Reducible {
    constructor() {
        super(Foldable.types.IdentityFoldable, (f, id) => id.value, (sg, f, id) => f(id.value),
            'Identity', Reducible.types, 'identity');
    }
}
modules.push(IdentityReducible);
// Const 는 monoid 마다 다르므로 매개변수화하고, 담는 모양이 있으니 클래스로 선언한다. docs/internals.md#identity-const
class Const {
    constructor(value, typeName) { this.value = value; this._typeName = typeName; }
}
// 키 없는 모노이드에 붙이는 고유 번호 — 없으면 합 모노이드 Const 와 곱 모노이드 Const 가 한 태그로 섞인다. docs/internals.md#anon-monoid-tag
let _anonMonoidId = 0;
const normalizeConstMonoid = normalizeTypeClassKey(Monoid, Symbols.Monoid, 'Applicative.Const');
Applicative.Const = monoid => {
    const { key, instance: m } = normalizeConstMonoid(monoid);
    if (key !== null && Applicative.Const._keyCache.has(key)) return Applicative.Const._keyCache.get(key);
    if (key === null && Applicative.Const._instanceCache.has(m)) return Applicative.Const._instanceCache.get(m);
    // 태그가 안쪽까지 말한다 — const(array) 는 "배열로 모으는 Const" 다. 키가 없으면 고유 번호로 갈린다. docs/internals.md#anon-monoid-tag
    const tag = key === null ? `Const(#${++_anonMonoidId})` : `Const(${key})`;
    const constOf = value => new Const(value, tag);
    const result = new Applicative(
        new Apply(new Functor((_f, x) => x, tag),
                  (a, b) => constOf(m.concat(a.value, b.value)), tag),
        () => constOf(m.empty()), tag);
    // of 는 값을 버린다(법칙 요구) — 값을 담는 수단은 wrap 이 따로 진다. docs/internals.md#identity-const
    result.wrap = v => constOf(m.concat(m.empty(), v));
    result.unwrap = c => c.value;
    if (key !== null) {
        // identity 와 같이 3단 등록 — Applicative 만 올리면 Functor.lookup('const(array)') 가 안 된다.
        registerAs(Functor.types, `const(${key})`, result);
        registerAs(Apply.types, `const(${key})`, result);
        registerAs(Applicative.types, `const(${key})`, result);
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
// 튜플은 JS 타입이 아니다 — .type 은 'Array' 로 두고 길이를 여기서 본다(느슨한 모드에서도 산다). docs/Bifunctor.md
class TupleBifunctor extends Bifunctor {
    constructor() {
        super((f, g, t) => t.length === 2 ? [f(t[0]), g(t[1])]
            : raise(new TypeError(`Bifunctor.bimap: tuple must have exactly 2 elements, got ${t.length}`)),
            'Array', Bifunctor.types, 'tuple');
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
        // 스택으로 돈다 — shift/unshift 는 큐 길이만큼 원소를 옮겨 갈래가 쌓이면 제곱이 된다(6차 감사 8).
        // 자식을 거꾸로 쌓으면 깊이 우선 순서가 그대로다 — 그 순서는 결과 배열에 그대로 드러난다.
        super(Chain.types.ArrayChain, (f, i) => {
            const res = [];
            const stack = f(ChainRec.next, ChainRec.done, i).slice().reverse();
            while (stack.length > 0) {
                const step = stack.pop();
                if (step.tag !== 'next') { res.push(step.value); continue; }
                const children = f(ChainRec.next, ChainRec.done, step.value);
                for (let k = children.length - 1; k >= 0; k--) stack.push(children[k]);
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
        super(Extend.types.ArrayExtend, fst, 'Array', Comonad.types, 'array');
    }
}
modules.push(ArrayComonad);
class ArrayTraversable extends Traversable {
    constructor() {
        super(Functor.types.ArrayFunctor,
            Foldable.types.ArrayFoldable,
            // 누적을 걸음마다 펼치면([...a, b]) 원소 수의 제곱만큼 복사한다(6차 감사 9).
            // cons 로 O(1) 씩 잇고 **끝에서 한 번만** 편다 — 변이가 없으니 비결정 applicative(Array)도 안전하다.
            (applicative, f, arr) => applicative.map(
                node => {
                    const out = [];
                    for (let at = node; at !== null; at = at.prev) out.push(at.value);
                    return out.reverse();
                },
                arr.reduce(
                    (acc, x) => applicative.ap(applicative.map(prev => value => ({ prev, value }), acc), f(x)),
                    applicative.of(null)
                )
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
        super(Setoid.types.DateSetoid, (x, y) => types.dateCheckAndGet(x).getTime() <= types.dateCheckAndGet(y).getTime(), 'Date', Ord.types, 'date');
    }
}
modules.push(DateOrd);
/* Maybe */
// 상자 표기용 — 자기 toString 을 지닌 값(중첩 상자·Date)은 그것을, 나머지는 JSON 을 쓴다.
const showValue = v => {
    if (typeof v === 'string') return JSON.stringify(v);
    if (typeof v === 'function') return '<function>';
    try {
        if (v !== null && typeof v === 'object' && !Array.isArray(v)
            && typeof v.toString === 'function' && v.toString !== Object.prototype.toString) return String(v);
        const s = JSON.stringify(v);
        return s === undefined ? String(v) : s;
    } catch (e) { return '[unprintable]'; }
};
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
    toString() { return `Just(${showValue(this.value)})`; }
}
class Nothing extends Maybe {
    constructor() {
        super(); this._typeName = 'Maybe';
    }
    isNothing() { return true; }
    map(f) { return Functor.lookup('maybe').map(f, this); }
    chain(f) { return Chain.lookup('maybe').chain(f, this); }
    toString() { return 'Nothing'; }
}
Just.prototype[Symbols.Maybe] = true;
Nothing.prototype[Symbols.Maybe] = true;
Maybe.Just = x => new Just(x);
Maybe.Nothing = () => new Nothing();
Maybe.of = x => new Just(x);
Maybe.isMaybe = x => x != null && x[Symbols.Maybe] === true;
Maybe.isJust = x => Maybe.isMaybe(x) && x.isJust();
Maybe.isNothing = x => Maybe.isMaybe(x) && x.isNothing();
Maybe.fromNullable = x => x == null ? new Nothing() : new Just(x);
Maybe.fold = (onNothing, onJust, m) => m.isJust() ? onJust(m.value) : onNothing();
Maybe.catch = runCatch(f => Maybe.Just(f()), Maybe.Nothing);
// Kleisli 합성이라 인자가 함수다 — 셋(Maybe/Either/Task)의 공용 몸이고, 짝 Chain 조회는 호출 시점이다. docs/internals.md#type
const kleisliCompose = chainOf => {
    types.checkFunction(chainOf, 'kleisliCompose');
    return (f, g) => x => {
        const chain = chainOf();
        (chain && chain[Symbols.Chain] === true) || raise(new TypeError('kleisliCompose: chainOf() must return a Chain'));
        return chain.chain(f, g(x));
    };
};
class MaybeSemigroupoid extends Semigroupoid {
    constructor() {
        super(kleisliCompose(() => Chain.types.MaybeChain), 'function', Semigroupoid.types, 'maybe');
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
    toString() { return `Left(${showValue(this.value)})`; }
}
class Right extends Either {
    constructor(value) { super(); this.value = value; this._typeName = 'Either'; }
    isRight() { return true; }
    map(f) { return Functor.lookup('either').map(f, this); }
    chain(f) { return Chain.lookup('either').chain(f, this); }
    toString() { return `Right(${showValue(this.value)})`; }
}
Left.prototype[Symbols.Either] = true;
Right.prototype[Symbols.Either] = true;
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
        super(kleisliCompose(() => Chain.types.EitherChain), 'function', Semigroupoid.types, 'either');
    }
}
modules.push(EitherSemigroupoid);
class EitherCategory extends Category {
    constructor() {
        super(Semigroupoid.types.EitherSemigroupoid, Either.Right, 'function', Category.types, 'either');
    }
}
modules.push(EitherCategory);
// Filterable 로 등록하지 않는다 — 소멸·항등 법칙을 동시에 만족할 수 없다. docs/internals.md#filterable
const eitherFilter = (pred, e, onFalse = identity) =>
    types.checkFunction(pred, 'Either.filter') && Either.isEither(e)
        ? (e.isLeft() ? e : (pred(e.value) ? e : Either.Left(onFalse(e.value))))
        : raise(new TypeError('Either.filter: arguments must be (function, Either)'));
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
class EitherMonadError extends MonadError {
    constructor() {
        super(Applicative.types.EitherApplicative, Chain.types.EitherChain,
            e => Either.Left(e),
            (f, fa) => {
                if (fa.isLeft()) {
                    const out = f(fa.value);
                    return Either.isEither(out) ? out : raise(new TypeError('MonadError.handleError: handler must return an Either'));
                }
                return fa;
            },
            'Either', MonadError.types, 'either');
    }
}
modules.push(EitherMonadError);
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
/* Container 공용 뼈대 — 아래 두 구역(Semigroup/Monoid, Setoid/Ord)이 함께 쓴다 */
// 안쪽 해석의 실패는 전부 이 한 문장으로 나간다 — 어느 팩토리에서 났는지를 label 이 남긴다.
const innerResolver = (normalize, kind) => (label, inner) => {
    try { return normalize(inner); }
    catch (e) {
        if (e instanceof TypeError) raise(new TypeError(`${label}: inner must be a supported ${kind} key or ${kind} instance`));
        throw e;
    }
};
// 키가 중첩될 수 있으므로(either(maybe(number),array(string))) 최상위 쉼표에서만 자른다.
const splitTopLevel = s => {
    const out = [];
    let depth = 0, start = 0;
    for (let i = 0; i < s.length; i++) {
        if (s[i] === '(') depth++;
        else if (s[i] === ')') depth--;
        else if (s[i] === ',' && depth === 0) { out.push(s.slice(start, i)); start = i + 1; }
    }
    return (out.push(s.slice(start)), out);
};
// 안쪽이 전부 키일 때만 레지스트리에 올린다 — 인스턴스 캐시(WeakMap)는 안쪽이 하나일 때만 자리가 있다.
const cachedInnerFactory = (label, resolveInner, registry, keyOf, build) => {
    // 받을 안쪽의 개수는 키를 만드는 함수에서 끌어온다 — 따로 적으면 키 모양과 갈라진다.
    const arity = keyOf.length;
    arity > 0 || raise(new TypeError(`${label}: keyOf must declare its parameters`));
    const factory = (...inners) => {
        // 빈 배열에 every 는 공허하게 참이다 — 개수를 먼저 막지 않으면 undefined 가 키에 박힌다.
        inners.length === arity || raise(new TypeError(
            `${label}: expects ${arity} inner argument${arity > 1 ? 's' : ''}, got ${inners.length}`));
        const resolved = inners.map(inner => resolveInner(label, inner));
        const key = resolved.every(r => r.key !== null) ? keyOf(...resolved.map(r => r.key)) : null;
        if (key !== null && factory._keyCache.has(key)) return factory._keyCache.get(key);
        const only = resolved.length === 1 ? resolved[0].instance : null;
        if (key === null && only !== null && factory._instanceCache.has(only)) return factory._instanceCache.get(only);
        const result = build(...resolved.map(r => r.instance));
        if (key !== null) { registerAs(registry, key, result); factory._keyCache.set(key, result); }
        else if (only !== null) factory._instanceCache.set(only, result);
        return result;
    };
    factory._keyCache = new Map();
    factory._instanceCache = new WeakMap();
    return factory;
};
/* Container Semigroup / Monoid */
const normalizeSemigroupKey = normalizeTypeClassKey(Semigroup, Symbols.Semigroup, 'normalizeSemigroupKey');
const resolveInnerSemigroup = innerResolver(normalizeSemigroupKey, 'Semigroup');
Semigroup.Maybe = cachedInnerFactory('Semigroup.Maybe', resolveInnerSemigroup, Semigroup.types, k => `maybe(${k})`,
    sg => new Semigroup((a, b) => a.isNothing() ? b : b.isNothing() ? a : Maybe.Just(sg.concat(a.value, b.value)), 'Maybe', null));
// inner 가 Semigroup 이기만 해도 Monoid 가 된다 — Nothing 이 항등원이라 inner 의 empty 가 필요 없다.
Monoid.Maybe = cachedInnerFactory('Monoid.Maybe', resolveInnerSemigroup, Monoid.types, k => `maybe(${k})`,
    sg => new Monoid(Semigroup.Maybe(sg), () => Maybe.Nothing(), 'Maybe', null));
// 자리가 둘이면 합치는 법도 둘이다 — 둘 다 Left 면 왼쪽 법으로 누적한다(Validation 선례). docs/internals.md#container-setoid
Semigroup.Either = cachedInnerFactory('Semigroup.Either', resolveInnerSemigroup, Semigroup.types,
    (l, r) => `either(${l},${r})`,
    (l, r) => new Semigroup((a, b) =>
        a.isLeft() ? (b.isLeft() ? Either.Left(l.concat(a.value, b.value)) : a)
        : b.isLeft() ? b
        : Either.Right(r.concat(a.value, b.value)), 'Either', null));
addResolver(Semigroup, key => {
    const m = /^(maybe|either)\((.+)\)$/.exec(key);
    if (!m) return null;
    if (m[1] === 'maybe') return Semigroup.Maybe(m[2]);
    const parts = splitTopLevel(m[2]);
    return parts.length === 2 ? Semigroup.Either(parts[0], parts[1]) : null;
});
addResolver(Monoid, key => {
    const m = /^maybe\((.+)\)$/.exec(key);
    return m ? Monoid.Maybe(m[1]) : null;
});
// Applicative.Const(monoid) 의 지연 해석 — 클로저 안에서 부르므로 정의 순서와 무관하다.
addResolver(Applicative, key => {
    const m = /^const\((.+)\)$/.exec(key);
    return m ? Applicative.Const(m[1]) : null;
});
/* Container Setoid / Ord — 안쪽 비교법을 받아 상자 비교법을 만든다 */
// 안쪽을 항상 밝힌다('maybe(number)'). Either 는 자리가 둘이라 비교법도 둘 — docs/internals.md#container-setoid
const normalizeSetoidKey = normalizeTypeClassKey(Setoid, Symbols.Setoid, 'normalizeSetoidKey');
const normalizeOrdKey = normalizeTypeClassKey(Ord, Symbols.Ord, 'normalizeOrdKey');
const resolveInnerSetoid = innerResolver(normalizeSetoidKey, 'Setoid');
const resolveInnerOrd = innerResolver(normalizeOrdKey, 'Ord');
Setoid.Maybe = cachedInnerFactory('Setoid.Maybe', resolveInnerSetoid, Setoid.types, k => `maybe(${k})`,
    inner => new Setoid((a, b) => a.isNothing() ? b.isNothing() : b.isJust() && inner.equals(a.value, b.value), 'Maybe', null));
// Nothing 이 가장 작다 — fp-ts 의 getOrd 와 같고, Haskell 의 생성자 선언 순서와도 같다.
Ord.Maybe = cachedInnerFactory('Ord.Maybe', resolveInnerOrd, Ord.types, k => `maybe(${k})`,
    inner => new Ord(Setoid.Maybe(inner), (a, b) => a.isNothing() || (b.isJust() && inner.lte(a.value, b.value)), 'Maybe', null));
Setoid.Array = cachedInnerFactory('Setoid.Array', resolveInnerSetoid, Setoid.types, k => `array(${k})`,
    inner => new Setoid((a, b) => a.length === b.length && a.every((x, i) => inner.equals(x, b[i])), 'Array', null));
// 사전식. Ord 는 lte 만 있으므로 "양쪽으로 lte" 를 같음으로 읽어 자리를 넘긴다.
const arrayOrdLte = inner => (a, b) => {
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) {
        if (!inner.lte(a[i], b[i])) return false;
        if (!inner.lte(b[i], a[i])) return true;
    }
    return a.length <= b.length;
};
Ord.Array = cachedInnerFactory('Ord.Array', resolveInnerOrd, Ord.types, k => `array(${k})`,
    inner => new Ord(Setoid.Array(inner), arrayOrdLte(inner), 'Array', null));
// Either 만 안쪽이 둘이라 양쪽 키를 다 알 때만 캐시된다 — 한쪽이 미등록이면 캐시가 없다.
Setoid.Either = cachedInnerFactory('Setoid.Either', resolveInnerSetoid, Setoid.types, (l, r) => `either(${l},${r})`,
    (l, r) => new Setoid((a, b) => a.isLeft()
        ? b.isLeft() && l.equals(a.value, b.value)
        : b.isRight() && r.equals(a.value, b.value), 'Either', null));
// Either 의 Ord 는 만들지 않는다 — Left/Right 의 순서에 정답이 없다. docs/internals.md#container-setoid
// 레코드는 필드별 비교법을 받고(Eq.struct 격) 필드 집합은 엄격 일치, Ord.Struct 는 없다 — 같은 앵커.
Setoid.Struct = fields => {
    types.isPlainObject(fields) || raise(new TypeError('Setoid.Struct: fields must be a plain object'));
    const names = Object.keys(fields).sort();
    names.length > 0 || raise(new TypeError('Setoid.Struct: fields must not be empty'));
    const resolved = names.map(n => [n, resolveInnerSetoid('Setoid.Struct', fields[n])]);
    // 레코드는 즉석 모양이라 레지스트리에 안 올린다. 키의 ':' ',' 는 JSON 으로 무해화한다. docs/internals.md#container-setoid
    const cacheKey = resolved.every(([, r]) => r.key !== null)
        ? JSON.stringify(resolved.map(([n, r]) => [n, r.key]))
        : null;
    if (cacheKey !== null && Setoid.Struct._keyCache.has(cacheKey)) return Setoid.Struct._keyCache.get(cacheKey);
    const result = new Setoid((a, b) => {
        // 자기 소유 필드만 본다 — n in a 는 상속 필드까지 인정한다(Object.create({a:1}) 통과).
        const own = (o, n) => Object.prototype.hasOwnProperty.call(o, n);
        const ka = Object.keys(a), kb = Object.keys(b);
        return ka.length === names.length && kb.length === names.length
            && names.every(n => own(a, n) && own(b, n))
            && resolved.every(([n, r]) => r.instance.equals(a[n], b[n]));
    }, 'Object', null);
    if (cacheKey !== null) Setoid.Struct._keyCache.set(cacheKey, result);
    return result;
};
Setoid.Struct._keyCache = new Map();
// struct 는 여기 없다 — 레코드는 즉석 모양이라 레지스트리 밖이다. Setoid.Struct 팩토리만이 입구다.
addResolver(Setoid, key => {
    const m = /^(maybe|array|either)\((.+)\)$/.exec(key);
    if (!m) return null;
    if (m[1] === 'maybe') return Setoid.Maybe(m[2]);
    if (m[1] === 'array') return Setoid.Array(m[2]);
    const parts = splitTopLevel(m[2]);
    return parts.length === 2 ? Setoid.Either(parts[0], parts[1]) : null;
});
addResolver(Ord, key => {
    const m = /^(maybe|array)\((.+)\)$/.exec(key);
    return !m ? null : m[1] === 'maybe' ? Ord.Maybe(m[2]) : Ord.Array(m[2]);
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
            // then 만 가진 thenable 도 규격이다 — Promise.resolve 동화라야 .catch 가정이 없다.
            Promise.resolve(result).then(resolve, reject);
        } else {
            resolve(result); // non-Promise 값은 그대로 resolve
        }
    } catch (e) {
        reject(e); // 즉시 throw 시 reject
    }
});
Task.fromEither = e => Either.fold(Task.rejected, Task.of, e);
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
        e => {
            // 핸들러의 예외·비Task 반환을 삼키면 Task 가 영원히 안 열린다 — reject 로 돌린다.
            let recovered;
            try { recovered = handler(e); } catch (err) { reject(err); return; }
            Task.isTask(recovered)
                ? recovered.fork(reject, resolve)
                : reject(new TypeError('Task.catchError: handler must return a Task'));
        },
        resolve
    );
});
class TaskSemigroupoid extends Semigroupoid {
    constructor() {
        super(kleisliCompose(() => Chain.types.TaskChain), 'function', Semigroupoid.types, 'task');
    }
}
modules.push(TaskSemigroupoid);
class TaskCategory extends Category {
    constructor() {
        super(Semigroupoid.types.TaskSemigroupoid, Task.of, 'function', Category.types, 'task');
    }
}
modules.push(TaskCategory);
// Either 와 같은 이유로 Filterable 이 아니다 — 정규 빈 상자가 없다. docs/internals.md#filterable
const taskFilter = (pred, t) =>
    types.checkFunction(pred, 'Task.filter') && Task.isTask(t)
        ? new Task((reject, resolve) => t.fork(reject, x => pred(x) ? resolve(x) : reject(x)))
        : raise(new TypeError('Task.filter: arguments must be (function, Task)'));
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
                // 동기 완료를 재귀로 이으면 스택이 걸음 수만큼 자란다 — docs/internals.md#chainrec-stack
                const loop = start => {
                    let current = start;
                    for (;;) {
                        let sync = true, bounce = false, next = null;
                        try {
                            f(ChainRec.next, ChainRec.done, current).fork(reject, result => {
                                // 'next' 만 계속한다 — 규격 밖 태그를 계속으로 읽으면 무한 반복이 된다(코덱스 리뷰).
                                if (result.tag !== 'next') { resolve(result.value); return; }
                                if (sync) { bounce = true; next = result.value; }
                                else loop(result.value);
                            });
                        } catch (e) { reject(e); return; }
                        sync = false;
                        if (!bounce) return;
                        current = next;
                    }
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
class TaskMonadError extends MonadError {
    constructor() {
        super(Applicative.types.TaskApplicative, Chain.types.TaskChain,
            e => Task.rejected(e),
            (f, fa) => fa.catchError(f),
            'Task', MonadError.types, 'task');
    }
}
modules.push(TaskMonadError);
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
Valid.prototype[Symbols.Validation] = true;
Invalid.prototype[Symbols.Validation] = true;
Validation.Valid = x => new Valid(x);
Validation.Invalid = (errors, monoid) => new Invalid(errors, monoid);
Validation.of = x => new Valid(x);
Validation.isValidation = x => x != null && x[Symbols.Validation] === true;
Validation.isValid = x => Validation.isValidation(x) && x.isValid();
Validation.isInvalid = x => Validation.isValidation(x) && x.isInvalid();
Validation.fromEither = (e, monoid) => Either.fold(v => Validation.Invalid(v, monoid), Validation.Valid, e);
Validation.prototype.toEither = function () {
    return Validation.fold(Either.Left, Either.Right, this);
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
    return lift(Applicative.lookup('validation'))(f)(...validations);
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
                    // 왼쪽을 조용히 채택하면 피연산자 순서에 따라 값이 바뀐다 — 다르면 거부한다.
                    vf.monoid !== va.monoid && raise(new TypeError('Validation.ap: both Invalid must carry the same Monoid'));
                    return Validation.Invalid(vf.monoid.concat(vf.errors, va.errors), vf.monoid);
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
/* NonEmptyList */
// 비어 있을 수 없는 목록 — 비지 않음을 검사가 아니라 구조(head 자리)가 보증한다. docs/NonEmptyList.md
class NonEmptyList {
    constructor(head, tail) {
        Array.isArray(tail) || raise(new TypeError('NonEmptyList: tail must be an array'));
        // 복사 후 동결 — 호출자 배열 별칭도, 직접 push 도 이 값을 못 바꾼다(d.ts 의 ReadonlyArray 계약).
        this.head = head; this.tail = Object.freeze(tail.slice()); this._typeName = 'NonEmptyList';
    }
    toArray() { return [this.head, ...this.tail]; }
    last() { return this.tail.length ? this.tail[this.tail.length - 1] : this.head; }
}
NonEmptyList.prototype[Symbols.NonEmptyList] = true;
NonEmptyList.of = x => new NonEmptyList(x, []);
NonEmptyList.make = (head, ...rest) => new NonEmptyList(head, rest);
NonEmptyList.fromArray = xs => (Array.isArray(xs) && xs.length > 0)
    ? Maybe.Just(new NonEmptyList(xs[0], xs.slice(1)))
    : Maybe.Nothing();
NonEmptyList.isNonEmptyList = x => x != null && x[Symbols.NonEmptyList] === true;
// 위임 — 접기의 소유자는 Reducible 인스턴스다(검증·문안 포함). docs/NonEmptyList.md
NonEmptyList.reduceLeft = (f, nel) => Reducible.types.NonEmptyListReducible.reduceLeft(f, nel);
NonEmptyList.reduceMap = (semigroup, f, nel) => Reducible.types.NonEmptyListReducible.reduceMap(semigroup, f, nel);
class NonEmptyListFunctor extends Functor {
    constructor() {
        super((f, w) => new NonEmptyList(f(w.head), w.tail.map(f)),
            'NonEmptyList', Functor.types, 'nonEmptyList');
    }
}
modules.push(NonEmptyListFunctor);
class NonEmptyListApply extends Apply {
    constructor() {
        super(Functor.types.NonEmptyListFunctor, (ff, fa) => {
            const out = [];
            for (const f of ff.toArray()) for (const x of fa.toArray()) out.push(f(x));
            return new NonEmptyList(out[0], out.slice(1));
        }, 'NonEmptyList', Apply.types, 'nonEmptyList');
    }
}
modules.push(NonEmptyListApply);
class NonEmptyListApplicative extends Applicative {
    constructor() {
        super(Apply.types.NonEmptyListApply, x => NonEmptyList.of(x),
            'NonEmptyList', Applicative.types, 'nonEmptyList');
    }
}
modules.push(NonEmptyListApplicative);
class NonEmptyListChain extends Chain {
    constructor() {
        super(Apply.types.NonEmptyListApply, (f, fa) => {
            const out = [];
            for (const x of fa.toArray()) { const r = f(x); out.push(r.head, ...r.tail); }
            return new NonEmptyList(out[0], out.slice(1));
        }, 'NonEmptyList', Chain.types, 'nonEmptyList');
    }
}
modules.push(NonEmptyListChain);
class NonEmptyListChainRec extends ChainRec {
    constructor() {
        // Array 쪽과 같은 스택 — shift/unshift 는 큐 길이만큼 옮겨 제곱이고, spread 는 갈래가
        // 넓으면 인자 한도를 넘겨 **스택을 터뜨린다**(7차 감사 1). ChainRec 은 스택 안전이 존재
        // 이유이므로 그 자리에서 터지면 안 된다. 자식을 거꾸로 쌓아 깊이 우선 순서를 지킨다.
        super(Chain.types.NonEmptyListChain, (f, i) => {
            const res = [];
            const stack = f(ChainRec.next, ChainRec.done, i).toArray().reverse();
            while (stack.length > 0) {
                const step = stack.pop();
                if (step.tag !== 'next') { res.push(step.value); continue; }
                const children = f(ChainRec.next, ChainRec.done, step.value).toArray();
                for (let k = children.length - 1; k >= 0; k--) stack.push(children[k]);
            }
            return new NonEmptyList(res[0], res.slice(1));
        }, 'NonEmptyList', ChainRec.types, 'nonEmptyList');
    }
}
modules.push(NonEmptyListChainRec);
class NonEmptyListMonad extends Monad {
    constructor() {
        super(Applicative.types.NonEmptyListApplicative, Chain.types.NonEmptyListChain,
            'NonEmptyList', Monad.types, 'nonEmptyList');
    }
}
modules.push(NonEmptyListMonad);
class NonEmptyListSemigroup extends Semigroup {
    constructor() {
        super((a, b) => new NonEmptyList(a.head, [...a.tail, b.head, ...b.tail]),
            'NonEmptyList', Semigroup.types, 'nonEmptyList');
    }
}
modules.push(NonEmptyListSemigroup);
class NonEmptyListAlt extends Alt {
    constructor() {
        // alt ≡ concat — 실패 개념이 없는 타입의 대안은 결합이다. Plus(zero=빈 목록)는 구조상 불가.
        super(Functor.types.NonEmptyListFunctor,
            (a, b) => Semigroup.types.NonEmptyListSemigroup.concat(a, b),
            'NonEmptyList', Alt.types, 'nonEmptyList');
    }
}
modules.push(NonEmptyListAlt);
class NonEmptyListFoldable extends Foldable {
    constructor() {
        super((f, init, w) => w.toArray().reduce(f, init),
            'NonEmptyList', Foldable.types, 'nonEmptyList');
    }
}
modules.push(NonEmptyListFoldable);
class NonEmptyListReducible extends Reducible {
    constructor() {
        super(Foldable.types.NonEmptyListFoldable,
            (f, w) => w.tail.reduce(f, w.head),
            (sg, f, w) => w.tail.reduce((acc, x) => sg.concat(acc, f(x)), f(w.head)),
            'NonEmptyList', Reducible.types, 'nonEmptyList');
    }
}
modules.push(NonEmptyListReducible);
class NonEmptyListTraversable extends Traversable {
    constructor() {
        super(Functor.types.NonEmptyListFunctor, Foldable.types.NonEmptyListFoldable,
            // Array 쪽과 같은 cons 누적 — concat([y]) 는 걸음마다 누적을 통째로 복사해 제곱이다
            // (7차 감사 3). 변이가 없으니 비결정 applicative 에서도 안전하다.
            (A, f, w) => A.map(
                node => {
                    const out = [];
                    for (let at = node; at !== null; at = at.prev) out.push(at.value);
                    out.reverse();
                    return new NonEmptyList(out[0], out.slice(1));
                },
                w.toArray().reduce(
                    (acc, x) => A.ap(A.map(prev => value => ({ prev, value }), acc), f(x)),
                    A.of(null)
                )
            ),
            'NonEmptyList', Traversable.types, 'nonEmptyList');
    }
}
modules.push(NonEmptyListTraversable);
class NonEmptyListExtend extends Extend {
    constructor() {
        super(Functor.types.NonEmptyListFunctor, (f, w) => {
            const arr = w.toArray();
            const out = arr.map((_, i) => f(new NonEmptyList(arr[i], arr.slice(i + 1))));
            return new NonEmptyList(out[0], out.slice(1));
        }, 'NonEmptyList', Extend.types, 'nonEmptyList');
    }
}
modules.push(NonEmptyListExtend);
class NonEmptyListComonad extends Comonad {
    constructor() {
        // extract = head — 빈 경우가 없어 전체 정의된다. 배열 Comonad 의 빈 배열 구멍을 채우는 자리.
        super(Extend.types.NonEmptyListExtend, w => w.head,
            'NonEmptyList', Comonad.types, 'nonEmptyList');
    }
}
modules.push(NonEmptyListComonad);
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
Reader.ask = new Reader(identity);
Reader.asks = f => new Reader(f);
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
    eval() { return this.value; }
    exec() { return this.output; }
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
            (wf, wa) => wf.monoid !== wa.monoid
                ? raise(new TypeError('Writer.ap: both Writer must carry the same Monoid'))
                : new Writer(wf.value(wa.value), wf.monoid.concat(wf.output, wa.output), wf.monoid),
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
                w.monoid !== next.monoid && raise(new TypeError('Writer.chain: both Writer must carry the same Monoid'));
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
// 등록본의 of 는 array monoid 를 박으므로 monoid 마다 하나씩 만든다 — 의존하는 것은 of 뿐이다. docs/internals.md#writer-factory-internals
const normalizeWriterMonoid = normalizeTypeClassKey(Monoid, Symbols.Monoid, 'Writer factory');
const buildWriterMonad = monoid => {
    const { key, instance: m } = normalizeWriterMonoid(monoid);
    if (key !== null && buildWriterMonad._keyCache.has(key)) return buildWriterMonad._keyCache.get(key);
    if (key === null && buildWriterMonad._instanceCache.has(m)) return buildWriterMonad._instanceCache.get(m);
    const applicative = new Applicative(Apply.types.WriterApply, x => Writer.of(x, m), 'Writer');
    const monad = new Monad(applicative, Chain.types.WriterChain, 'Writer');
    const bundle = { applicative, monad };
    if (key !== null) {
        // const(<키>) 와 같이 등록한다 — of 를 지닌 두 층만 새것, 나머지 셋은 등록 인스턴스.
        registerAs(Functor.types, `writer(${key})`, Functor.types.WriterFunctor);
        registerAs(Apply.types, `writer(${key})`, Apply.types.WriterApply);
        registerAs(Applicative.types, `writer(${key})`, applicative);
        registerAs(Chain.types, `writer(${key})`, Chain.types.WriterChain);
        registerAs(Monad.types, `writer(${key})`, monad);
        buildWriterMonad._keyCache.set(key, bundle);
    } else {
        buildWriterMonad._instanceCache.set(m, bundle);
    }
    return bundle;
};
buildWriterMonad._keyCache = new Map();
buildWriterMonad._instanceCache = new WeakMap();
Applicative.Writer = monoid => buildWriterMonad(monoid).applicative;
Monad.Writer = monoid => buildWriterMonad(monoid).monad;
/* State */
class State {
    constructor(run) {
        types.checkFunction(run, 'State');
        this._run = run;
        this._typeName = 'State';
    }
    run(s) { return this._run(s); }
    eval(s) { return fst(this.run(s)); }
    exec(s) { return snd(this.run(s)); }
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
Maybe.toEither = (defaultLeft, m) => Maybe.fold(() => Either.Left(defaultLeft), Either.Right, m);
// Just 인 동안만 잇는다 — Maybe.isJust 가 「타입이 맞고 성공인가」를 한 몸에 담고 있다.
Maybe.pipe = (m, ...fns) => {
    if (!Maybe.isMaybe(m)) raise(new TypeError('Maybe.pipe: first argument must be a Maybe'));
    return pipeWhile(Maybe.isJust)(m, ...fns);
};
Either.toMaybe = e => Either.fold(Maybe.Nothing, Maybe.Just, e);
Either.pipe = (e, ...fns) => {
    if (!Either.isEither(e)) raise(new TypeError('Either.pipe: first argument must be an Either'));
    return pipeWhile(Either.isRight)(e, ...fns);
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
    const transduce = (transducer, reducer, initialValue, collection) => {
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
    /* into — 그릇을 보고 리듀서를 유도한다. Clojure 의미: 내용 보존·원본 불변. docs/Transducer.md#into */
    const intoPair = value => (Array.isArray(value) && value.length === 2) ? value
        : raise(new TypeError('transducer.into: Map/object vessels expect [key, value] pairs'));
    const into = (vessel, transducer, collection) => {
        if (Array.isArray(vessel)) return transduce(transducer, (acc, v) => (acc.push(v), acc), vessel.slice(), collection);
        if (typeof vessel === 'string') return transduce(transducer, (acc, v) => acc + v, vessel, collection);
        if (vessel instanceof Set) return transduce(transducer, (acc, v) => acc.add(v), new Set(vessel), collection);
        if (vessel instanceof Map) return transduce(transducer, (acc, v) => { const [k, val] = intoPair(v); return acc.set(k, val); }, new Map(vessel), collection);
        // 복제도 defineProperty 로 — Object.assign 은 그릇의 own __proto__ 를 프로토타입으로 둔갑시킨다(5차 감사).
        const putOwn = (acc, k, val) => (Object.defineProperty(acc, k, { value: val, enumerable: true, writable: true, configurable: true }), acc);
        if (types.isPlainObject(vessel)) {
            const seed = Object.keys(vessel).reduce((acc, k) => putOwn(acc, k, vessel[k]), {});
            return transduce(transducer, (acc, v) => { const [k, val] = intoPair(v); return putOwn(acc, k, val); }, seed, collection);
        }
        return raise(new TypeError('transducer.into: vessel must be an array, string, Set, Map, or plain object'));
    };
    // f·p 는 생성 시점에 검사한다 — 원소 처리 시로 미루면 빈 입력에서 잘못된 호출이 통과한다.
    const map = f => (types.checkFunction(f, 'transducer.map:f'), reducer => (acc, val) => types.checkFunction(reducer, 'transducer.map:reducer')(acc, f(val)));
    const filter = p => (types.checkFunction(p, 'transducer.filter:p'), reducer => (acc, val) => p(val) ? types.checkFunction(reducer, 'transducer.filter:reducer')(acc, val) : acc);
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
            Reduced, of: Reduced.of, isReduced: Reduced.isReduced, transduce, into, map, filter, take,
        },
    };
})();
const { Free, trampoline } = (() => {
    // 러너 셋의 **입구**만 검사한다 — 러너가 마지막에 평범한 값을 내는 것은 문서화된 정상 계약이다(6차 감사 10).
    const checkProgram = (label, program) => Free.isFree(program)
        ? program
        : raise(new TypeError(`Free.${label}: program must be a Free value`));
    const reentrantGuard = (runner, f, onReentry = f) => {
        let active = false;
        return (...args) => {
            if (active) return onReentry(...args);
            active = true;
            return runCatch(
                () => {
                    const result = runner(f(...args));
                    // then 만 보고 인정했으면 then 만으로 다뤄야 한다 — finally 는 Promise 의
                    // 선택 메서드라 최소 thenable 에는 없다(8차 감사 4). 정착하면 가드를 푼다.
                    if (result instanceof Promise || (result && typeof result.then === 'function')) {
                        const release = () => { active = false; };
                        result.then(release, release);
                        return result;
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
                return typeof target === 'function' ? reentrantGuard(execute, target) : execute(checkProgram('runSync', target));
            };
        }
        static runAsync(runner) {
            return target => {
                const execute = async program => {
                    checkProgram('runAsync', program);
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
                if (!Free.isFree(program)) return reject(new TypeError('Free.runWithTask: program must be a Free value'));
                // 걸음마다 감싼다 — 첫 step 밖에서 도는 후속 step 의 예외가 안 새게. docs/Free.md
                const step = free => {
                    try {
                        if (Free.isPure(free)) return resolve(free.value);
                        if (Free.isImpure(free)) {
                            runner(free.functor).fork(reject, step);
                        } else {
                            reject(new Error('runWithTask: unknown Free type'));
                        }
                    } catch (e) { reject(e); }
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
/* Profunctor 확장 인스턴스 — optics 가 주입하는 세 P. docs/internals.md#optics */
// 함수: p a b = a -> b.  over/set 이 쓴다.
class FunctionStrong extends Strong {
    constructor() {
        super(Profunctor.types.FunctionProfunctor,
            p => t => Bifunctor.types.TupleBifunctor.bimap(p, identity, t),
            p => t => Bifunctor.types.TupleBifunctor.bimap(identity, p, t),
            'function', Strong.types, 'function');
    }
}
modules.push(FunctionStrong);
class FunctionChoice extends Choice {
    constructor() {
        super(Profunctor.types.FunctionProfunctor,
            p => e => Bifunctor.types.EitherBifunctor.bimap(p, identity, e),
            p => e => Bifunctor.types.EitherBifunctor.bimap(identity, p, e),
            'function', Choice.types, 'function');
    }
}
modules.push(FunctionChoice);
class FunctionWander extends Wander {
    constructor() {
        super(Strong.types.FunctionStrong, Choice.types.FunctionChoice,
            (traverse, p) => s => {
                const I = Applicative.types.IdentityApplicative;
                return Comonad.types.IdentityComonad.extract(traverse(I, compose2(I.of, p), s));
            },
            'function', Wander.types, 'function');
    }
}
modules.push(FunctionWander);
// Tagged: p a b = b. 입력을 무시해 review 만 쓴다 — first/wander 의 부재가 곧 타입 안전성이다. docs/internals.md#optics
const taggedProfunctorBase = new Profunctor((_f, g, p) => g(p), 'any');
class TaggedChoice extends Choice {
    constructor() {
        super(taggedProfunctorBase, Either.Left, Either.Right, 'any', Choice.types, 'tagged');
    }
}
modules.push(TaggedChoice);
// Forget<r>: p a b = a -> r. monoid 마다 다른 팩토리이고, 담는 모양이 있으니 클래스다. docs/internals.md#forget-newtype
class Forget {
    constructor(run, typeName) { this.run = run; this._typeName = typeName; }
}
const normalizeForgetMonoid = normalizeTypeClassKey(Monoid, Symbols.Monoid, 'Wander.Forget');
Wander.Forget = monoid => {
    const { key, instance: m } = normalizeForgetMonoid(monoid);
    if (key !== null && Wander.Forget._keyCache.has(key)) return Wander.Forget._keyCache.get(key);
    if (key === null && Wander.Forget._instanceCache.has(m)) return Wander.Forget._instanceCache.get(m);
    const C = Applicative.Const(m);
    // 캐리어가 스스로를 밝힌다 — 벌거벗은 함수로 두면 FunctionWander 와 한 태그가 된다. docs/internals.md#forget-newtype
    const tag = key === null ? `Forget(#${++_anonMonoidId})` : `Forget(${key})`;
    const forgetOf = fn => new Forget(fn, tag);
    // 출력을 버리므로 첫 인자에만 반변이다 — 그 이름이 Contravariant 다.
    const P = new Profunctor((f, _g, p) =>
        forgetOf(Contravariant.types.PredicateContravariant.contramap(f, p.run)), tag);
    const S = new Strong(P, p => forgetOf(compose2(p.run, fst)), p => forgetOf(compose2(p.run, snd)), tag);
    const Ch = new Choice(P,
        p => forgetOf(e => Either.fold(p.run, () => m.empty(), e)),
        p => forgetOf(e => Either.fold(() => m.empty(), p.run, e)), tag);
    const result = new Wander(S, Ch,
        (traverse, p) => forgetOf(s => C.unwrap(traverse(C, compose2(C.wrap, p.run), s))), tag);
    // Const 와 같은 문 — 들어올 때 C.wrap 이 모노이드 값 검사를 진다(Lens 경로는 traverse 를 안 지난다). docs/internals.md#optics
    result.wrap = fn => forgetOf(a => C.unwrap(C.wrap(fn(a))));
    result.unwrap = p => p.run;
    if (key !== null) {
        // Forget 은 Profunctor 의 하위 개념이라 네 층에 다 올린다(소유자, 2026-08-15). docs/Profunctor.md
        registerAs(Profunctor.types, `forget(${key})`, result);
        registerAs(Strong.types, `forget(${key})`, result);
        registerAs(Choice.types, `forget(${key})`, result);
        registerAs(Wander.types, `forget(${key})`, result);
        Wander.Forget._keyCache.set(key, result);
    } else {
        Wander.Forget._instanceCache.set(m, result);
    }
    return result;
};
Wander.Forget._keyCache = new Map();
Wander.Forget._instanceCache = new WeakMap();

load(...modules);

/* Optics */
// transducer 와 같은 모양으로 IIFE 안에 가둔다 — 모듈 객체 하나만 밖으로 낸다.
const { Optics } = (() => {
    // Optic s a = P => P a a -> P s s — 주입하는 P 가 연산을 정한다(함수=over·Forget=view·Tagged=review). docs/internals.md#optics

    // ── 주입하는 P 셋 — 사설 딕셔너리가 아니라 등록 인스턴스다(게이트가 본다). docs/internals.md#optics ──
    const functionProfunctor = Wander.types.FunctionWander;
    const forgetProfunctor = monoid => Wander.Forget(monoid);
    // Tagged 는 Choice 일 뿐이다 — first/wander 의 부재가 "Lens/Traversal 은 review 할 수 없다" 를 말한다. docs/internals.md#optics
    const taggedProfunctor = Choice.types.TaggedChoice;
    // 등록 인스턴스는 깨끗하게 두고, review 경로에서만 그 부재를 사용자 언어로 옮긴다. docs/internals.md#optics
    const taggedForReview = Object.assign(Object.create(taggedProfunctor), {
        first: () => raise(new TypeError('review: argument must be a Prism (a Lens cannot be reviewed)')),
        wander: () => raise(new TypeError('review: argument must be a Prism (a Traversal cannot be reviewed)')),
    });

    // ── optic 생성자 ───────────────────────────────────────────────────
    // Iso 는 dimap 만 써서 모든 연산에 통한다(계층 최상단) — docs/internals.md#optics
    const Iso = (to, from) => {
        typeof to !== 'function' && raise(new TypeError('Iso: to must be a function'));
        typeof from !== 'function' && raise(new TypeError('Iso: from must be a function'));
        return P => pab => P.promap(to, from, pab);
    };
    const Lens = (getter, setter) => {
        typeof getter !== 'function' && raise(new TypeError('Lens: getter must be a function'));
        typeof setter !== 'function' && raise(new TypeError('Lens: setter must be a function'));
        return P => pab => P.promap(s => tuple(getter(s), s), ([b, s]) => setter(b, s), P.first(pab));
    };
    // match: s -> Maybe a,  build: a -> s
    const Prism = (match, build) => {
        typeof match !== 'function' && raise(new TypeError('Prism: match must be a function'));
        typeof build !== 'function' && raise(new TypeError('Prism: build must be a function'));
        return P => pab => P.promap(
            s => {
                const m = match(s);
                Maybe.isMaybe(m) || raise(new TypeError('Prism: match must return a Maybe'));
                return Maybe.fold(() => Either.Right(s), Either.Left, m);
            },
            e => Either.fold(build, identity, e),
            P.left(pab)
        );
    };
    // 속성 하나를 보는 Lens — 배열도 받는다(복사가 자기 모양을 지켜야 순회 optic 과 합성된다). docs/Optics.md
    const prop = key => {
        (typeof key === 'string' || typeof key === 'number')
            || raise(new TypeError('Optics.prop: key must be a string or number'));
        // 복제도 대입도 defineProperty 로 — `=` 와 Object.assign 은 __proto__ 를 프로토타입으로 둔갑시킨다(6차 감사 1).
        const putOwn = (acc, k, val) => (Object.defineProperty(acc, k, { value: val, enumerable: true, writable: true, configurable: true }), acc);
        return Lens(o => o[key], (v, o) => putOwn(
            Array.isArray(o) ? o.slice() : Object.keys(o).reduce((acc, k) => putOwn(acc, k, o[k]), {}),
            key, v
        ));
    };
    // 기존 Traversable 인스턴스를 optic으로 끌어온다 ('array' | 'maybe' | 'either' ...)
    const traversed = key => {
        const instance = Traversable.lookup(key);
        return P => pab => P.wander(instance.traverse, pab);
    };

    // ── 연산: P 를 고르는 것이 전부다 — 결과에 s 를 적용하는 것은 호출자 몫이다. docs/internals.md#optics ──
    const runOptic = (name, optic, P, pab) => {
        typeof optic !== 'function' && raise(new TypeError(`${name}: optic must be a function`));
        return optic(P)(pab);
    };
    const resolveFoldMonoid = normalizeTypeClassKey(Monoid, Symbols.Monoid, 'foldMapOf');
    // 읽기 셋의 공통 몸 — monoid 상시 요구는 optic 종류별 검사 갈림을 막는다. docs/internals.md#optics
    const foldMapOf = (monoid, optic, f, s) => {
        // 키든 인스턴스든 받는다 — 안에서 부르는 Applicative.Const 가 이미 그래서 입구만 좁으면 체인이 어긋난다.
        const { instance: m } = resolveFoldMonoid(monoid);
        typeof f !== 'function' && raise(new TypeError('foldMapOf: f must be a function'));
        const P = forgetProfunctor(m);
        return P.unwrap(runOptic('foldMapOf', optic, P, P.wrap(f)))(s);
    };
    // 읽기 셋은 각자의 이름으로 던져야 한다 — foldMapOf 에 위임하면 귀속을 잃는다.
    const toList = (optic, s) => {
        typeof optic !== 'function' && raise(new TypeError('toList: optic must be a function'));
        return foldMapOf(Monoid.lookup('array'), optic, a => [a], s);
    };
    // preview 는 합치는 게 아니라 고르는 것이라 컨테이너를 안 여는 Monoid.lookup('maybe') 를 쓴다. docs/internals.md#optics
    const preview = (optic, s) => {
        typeof optic !== 'function' && raise(new TypeError('preview: optic must be a function'));
        return foldMapOf(Monoid.lookup('maybe'), optic, Maybe.Just, s);
    };
    // Lens/Iso 전용 — Forget 은 wander 가 있어 구조가 못 막으므로 대상 수를 센다. docs/internals.md#optics
    const view = (lens, s) => {
        typeof lens !== 'function' && raise(new TypeError('view: optic must be a function'));
        const targets = toList(lens, s);
        targets.length !== 1 && raise(new TypeError(
            `view: expected exactly one target, got ${targets.length} — use preview or toList`));
        return targets[0];
    };
    const over = (optic, f, s) => {
        typeof f !== 'function' && raise(new TypeError('over: f must be a function'));
        return runOptic('over', optic, functionProfunctor, f)(s);
    };
    const set = (optic, b, s) => {
        typeof optic !== 'function' && raise(new TypeError('set: optic must be a function'));
        return over(optic, constant(b), s);
    };
    // review는 Tagged를 주입한다. Lens/Traversal이면 first/wander가 없어 여기서 실패한다.
    const review = (prism, a) => {
        typeof prism !== 'function' && raise(new TypeError('review: prism must be a function'));
        return prism(taggedForReview)(a);
    };
    // optic 합성 = 함수 합성. P를 모두에 주입한 뒤 그 층에서 잇는다.
    const composeOptic = (...optics) => {
        optics.forEach((o, i) => {
            typeof o !== 'function' && raise(new TypeError(`Optics.compose: argument ${i} must be an optic`));
        });
        // P를 모두에 주입하면 평범한 함수 N개가 되므로 이 파일의 compose 를 그대로 쓴다.
        return P => compose(...optics.map(o => o(P)));
    };

    // 정의는 composeOptic 이고 모듈 키에서만 compose 로 낸다 — 같은 이름이면 최상위 compose 를 가린다.
    return {
        Optics: {
            Iso, Lens, Prism, prop, traversed,
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

// 5단 동적 등록 — registry=null 키 오염 방지·nominal typing·XT.of 선완성 전제. docs/internals.md#transformer-register
const registerTransformerTypeClasses = (XT, typeName, alias) => {
    // 같은 alias 를 다른 트랜스포머가 덮으면 먼저 만든 쪽 인스턴스가 통째로 죽는다 — 거부한다.
    Object.prototype.hasOwnProperty.call(Functor.types, alias)
        && raise(new TypeError(`${typeName}: a transformer with the same .type is already registered`));
    const check = (val, method) => {
        if (!(val instanceof XT)) raise(new TypeError(`${typeName}.${method}: argument must be a ${typeName} instance`));
    };
    const tFunctor = new Functor(
        (f, t) => { check(t, 'map'); return new XT(Functor.lookup('free').map(f, t._program)); },
        typeName, null
    );
    registerAs(Functor.types, alias, tFunctor);
    const tApply = new Apply(tFunctor, (tf, ta) => {
        check(tf, 'ap'); check(ta, 'ap');
        return new XT(Chain.lookup('free').chain(f => Functor.lookup('free').map(f, ta._program), tf._program));
    }, typeName, null);
    registerAs(Apply.types, alias, tApply);
    const tApplicative = new Applicative(tApply, XT.of, typeName, null);
    registerAs(Applicative.types, alias, tApplicative);
    const tChain = new Chain(tApply, (f, t) => {
        check(t, 'chain');
        return new XT(Chain.lookup('free').chain(x => {
            const result = f(x);
            check(result, 'chain callback');
            return result._program;
        }, t._program));
    }, typeName, null);
    registerAs(Chain.types, alias, tChain);
    const tMonad = new Monad(tApplicative, tChain, typeName, null);
    registerAs(Monad.types, alias, tMonad);
    XT.map = tFunctor.map;
    XT.ap = tApply.ap;
    XT.chain = tChain.chain;
    XT.pipeK = (...fns) => pipeK(tMonad)(fns);
    XT.composeK = (...fns) => composeK(tMonad)(fns);
};

// 자동 alias 는 실행 순서에 따라 달라진다 — M 은 문자열로. docs/internals.md#transformer-register
let _transformerAutoId = 0;
const resolveMonadType = (M, nm) => nm.type || (typeof M === 'string' ? M : `M${++_transformerAutoId}`);

/* ── StateT ── */
const StateT = (M) => {
    const nm = normalizeMonad(M);
    if (StateT._cache.has(nm)) return StateT._cache.get(nm);
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
            return nm.map(fst, this.run(s));
        }
        exec(s) {
            if (!(this instanceof ST)) raise(new TypeError(`${typeName}.exec: must be called on a ${typeName} instance`));
            return nm.map(snd, this.run(s));
        }
        map(f) { return Functor.lookup(alias).map(f, this); }
        chain(f) { return Chain.lookup(alias).chain(f, this); }
    }
    ST.of = x => new ST(Free.pure(x));
    ST.get = new ST(Free.liftF(new GetF(identity)));
    ST.put = s => new ST(Free.liftF(new PutF(s, undefined)));
    ST.modify = f => new ST(Free.liftF(new ModifyF(f, undefined)));
    ST.gets = f => new ST(Free.liftF(new GetF(f)));
    ST.lift = ma => new ST(Free.liftF(new LiftF(ma, identity)));

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
    StateT._cache.set(nm, ST);
    return ST;
};
StateT._cache = new Map();

/* ── EitherT ── */
const EitherT = (M) => {
    const nm = normalizeMonad(M);
    if (EitherT._cache.has(nm)) return EitherT._cache.get(nm);
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
    ET.lift = ma => new ET(Free.liftF(new LiftF(ma, identity)));
    ET.fromEither = either => Either.fold(ET.throwError, ET.of, either);

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
    EitherT._cache.set(nm, ET);
    return ET;
};
EitherT._cache = new Map();

/* ── ReaderT ── */
const ReaderT = (M) => {
    const nm = normalizeMonad(M);
    if (ReaderT._cache.has(nm)) return ReaderT._cache.get(nm);
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
    RT.ask = new RT(Free.liftF(new AskF(identity)));
    RT.asks = f => new RT(Free.liftF(new AskF(f)));
    RT.local = (f, rt) => {
        if (typeof f !== 'function') raise(new TypeError(`${typeName}.local: first argument must be a function`));
        if (!(rt instanceof RT)) raise(new TypeError(`${typeName}.local: second argument must be a ${typeName} instance`));
        return new RT(Free.liftF(new LocalF(f, rt._program)));
    };
    RT.lift = ma => new RT(Free.liftF(new LiftF(ma, identity)));

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
    ReaderT._cache.set(nm, RT);
    return RT;
};
ReaderT._cache = new Map();

/* ── WriterT ── */
// 모노이드 정체성은 등록 키가 가른다 — .type 만 보면 합/곱 Number 가 한 자리를 다툰다.
const normalizeWriterTMonoid = normalizeTypeClassKey(Monoid, Symbols.Monoid, 'WriterT');
const WriterT = (M, writerMonoid) => {
    if (!writerMonoid) writerMonoid = Monoid.lookup('array');
    if (typeof writerMonoid.empty !== 'function' || typeof writerMonoid.concat !== 'function') {
        raise(new TypeError('WriterT: monoid must have empty() and concat(a, b) methods'));
    }
    const nm = normalizeMonad(M);
    if (!WriterT._cache.has(nm)) WriterT._cache.set(nm, new Map());
    if (WriterT._cache.get(nm).has(writerMonoid)) return WriterT._cache.get(nm).get(writerMonoid);
    const mType = resolveMonadType(M, nm);
    const wtKey = writerMonoid[Symbols.Monoid] === true ? normalizeWriterTMonoid(writerMonoid).key : null;
    const mt = writerMonoid.type;
    // 등록 키가 .type 의 소문자와 같으면 기존 표기(.type)를 유지한다 — 문서·별칭 불변.
    const monoidId = wtKey !== null
        ? (mt && wtKey === String(mt).toLowerCase() ? mt : wtKey)
        : (mt ? `${mt}#${++_transformerAutoId}` : `monoid${++_transformerAutoId}`);
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
    WT.lift = ma => new WT(Free.liftF(new LiftF(ma, identity)));

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
    WriterT._cache.get(nm).set(writerMonoid, WT);
    return WT;
};
WriterT._cache = new Map();

// 핸들러가 낸 것을 Task 로 들어올린다(Task 는 그대로·thenable 은 동화·값은 of) — Actor 와 해석기의 공용 몸. docs/Actor.md
const liftHandlerResult = r => {
    if (Task.isTask(r)) return r;
    if (r !== null && r !== undefined && typeof r.then === 'function') {
        return new Task((reject, resolve) => Promise.resolve(r).then(resolve, reject));
    }
    return Task.of(r);
};

/* ═══════════════════════════════════════════════════════════════
   Actor — 가벼운 메시지 큐 + 순차 처리
   ═══════════════════════════════════════════════════════════════ */

// 타이머가 있으면 타이머로, 없으면 경계 검사로 — GAS 에는 setTimeout 이 없다(실측·1차 자료).
// 경계 검사는 이 라이브러리의 협조적 취소(Free.api start/cancel)와 같은 의미론이다. docs/Actor.md
const hasTimer = typeof setTimeout === 'function';
const Actor = ({ init, handle, notifyInOrder = true, timeout = 1000 }) => {
    if (typeof handle !== 'function') raise(new TypeError('Actor: handle must be a function'));
    (typeof timeout === 'number' && timeout > 0 && !Number.isNaN(timeout))
        || raise(new TypeError('Actor: timeout must be a positive number of milliseconds (Infinity to disable)'));
    let state = init;
    const queue = [];
    let processing = false;
    const subscribers = [];
    let inflight = null;
    const timers = [];   // 이긴 뒤 남은 마감 타이머를 걷는다 — 안 걷으면 프로세스가 그만큼 더 산다.

    const notify = (result, newState) => {
        // 사본을 돈다 — 통지 중 해지가 원본을 줄이면 뒤의 구독자를 건너뛴다(6차 감사 11).
        // 다만 해지는 즉시 발효한다: 사본에 있어도 그 사이 빠졌으면 안 부른다.
        const current = subscribers.slice();
        for (let i = 0; i < current.length; i++) {
            if (subscribers.indexOf(current[i]) === -1) continue;
            try { current[i](result, newState); }
            catch (e) { runCatch(config.tapErrorHandler, emptyFunc)(e); }
        }
    };

    // 타이머 없는 환경(GAS)의 몫 — 다음 경계에서 마감을 확인한다. 타이머가 있으면 이미 발동했다.
    // 이미 정착한 것을 다시 만료시키려 해도 once 가 막으므로 여기서 상태를 따로 안 본다.
    const expireIfDue = () => {
        if (inflight === null || timeout === Infinity) return;
        if (Date.now() - inflight.startedAt >= timeout) inflight.expire();
    };

    // 마감을 Task 로 세운다 — 그러면 「먼저 정착한 쪽이 이긴다」는 Task.race 가 진다.
    // 타이머가 없는 환경(GAS)에서는 이 Task 를 만들 수 없어 경계 검사가 대신한다.
    const deadline = ms => new Task(reject => {
        const timer = setTimeout(() => {
            const e = new Error(`Actor: handle timed out after ${ms}ms`);
            e.timedOut = true;
            reject(e);
        }, ms);
        timers.push(timer);
    });

    const process = () => {
        if (processing || queue.length === 0) return;
        processing = true;
        const { msg, resolve, reject } = queue.shift();
        const done = () => { processing = false; if (queue.length > 0) process(); };
        // 일회 정착은 라이브러리의 once 가 진다 — 늦게 온 결과도, 중복 만료도 한 자리에서 막힌다.
        // 정착하면 남은 마감 타이머를 걷는다 — 한 번에 한 메시지만 비행하므로 목록은 그것 하나다.
        const settleOnce = once(step => {
            while (timers.length > 0) clearTimeout(timers.pop());
            inflight = null;
            step();
        });
        const finish = step => settleOnce(step);
        inflight = {
            startedAt: Date.now(),
            expire: () => finish(() => {
                const e = new Error(`Actor: handle timed out after ${timeout}ms`);
                e.timedOut = true;
                reject(e);
                done();
            }),
        };
        const onSuccess = value => finish(() => {
            // 비동기 경로에서 모양이 틀리면 던질 곳이 없다 — 거부로 돌려야 큐가 산다.
            if (!Array.isArray(value) || value.length !== 2) {
                reject(new TypeError('Actor: handle must produce a [result, newState] pair'));
                return done();
            }
            const [result, newState] = value;
            state = newState;
            resolve(result);
            // notifyInOrder 면 진행보다 통지가 먼저다 — 안 그러면 다음 메시지의 통지가 앞질러
            // 구독자가 역순으로 받는다(6차 감사 2). 구독자 호출은 각각 감싸여 있어 큐는 안 멈춘다.
            if (notifyInOrder) { notify(result, newState); done(); }
            else { done(); notify(result, newState); }
        });
        const onError = e => finish(() => { reject(e); done(); });
        try {
            // 값·Promise·Task 를 다 받는다 — Free.api 해석기 핸들러와 같은 관용도(같은 헬퍼).
            const work = liftHandlerResult(handle(state, msg));
            (hasTimer && timeout !== Infinity ? Task.race([deadline(timeout), work]) : work).fork(onError, onSuccess);
        } catch (e) {
            onError(e);
        }
    };

    return {
        send: msg => new Task((reject, resolve) => {
            expireIfDue();                            // 타이머 없는 환경의 경계 — 새 메시지가 곧 경계다
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
Task.filter = taskFilter;

// Foldable (3+ args - no eta reduction)
Maybe.reduce = (f, init, m) => Foldable.lookup('maybe').reduce(f, init, m);
Either.reduce = (f, init, e) => Foldable.lookup('either').reduce(f, init, e);

// Traversable (3+ args - no eta reduction)
Maybe.traverse = (applicative, f, m) => Traversable.lookup('maybe').traverse(applicative, f, m);
Either.traverse = (applicative, f, e) => Traversable.lookup('either').traverse(applicative, f, e);

// Bifunctor (3 args - no eta reduction)
Either.bimap = (f, g, e) => Bifunctor.lookup('either').bimap(f, g, e);

// Either/Task 는 Filterable 이 아니라 평범한 함수다 — 위 정의 참조
Either.filter = eitherFilter;

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

/* Free.api — 어휘만 선언하고 해석기는 몇 벌이든 별도로 단다. 사용자는 함자를 모른다. */
// 연속은 함수 목록이다 — 클로저 중첩이면 깊은 map 사슬에서 스택이 넘친다. docs/Free.md
/* 연속은 cons 리스트({ f, prev }) — map 마다 앞에 한 노드, 복사 없음. 형태는 미문서 내부다. */
const makeApiCommand = (name, args, fns, api) => {
    const cmd = { name, args, fns, api, map(f) { return makeApiCommand(name, args, { f, prev: fns }, api); } };
    cmd[Symbols.Functor] = true;
    return cmd;
};
// 반복문이라 스택이 안 자란다. 연속은 사용자 코드라 걸음마다 취소 경계를 검사한다. docs/Free.md
const CONTINUATION_CANCELLED = Symbol('fun-fp-js/Free.api.cancelled');
const runApiContinuation = (fns, value, token) => {
    const stack = [];
    for (let node = fns; node !== null; node = node.prev) stack.push(node.f);
    let v = value;
    for (let i = stack.length - 1; i >= 0; i--) {
        if (token.cancelled) return CONTINUATION_CANCELLED;
        v = stack[i](v);
    }
    return token.cancelled ? CONTINUATION_CANCELLED : v;
};
// 해석기 → 라우팅 명부. 모듈 사설 WeakMap — 밖에서 등록·열람·변조가 불가능하다(위조 차단).
const interpreterRegistry = new WeakMap();
// 취소는 사용 오류가 아니다 — TypeError 대신 Error, 문안+표식 이중 신호. 핸들러가 이 표식을 직접 만들면 자기 발등이다.
const cancelledError = () => {
    const e = new Error('Free.api.run: cancelled');
    e.cancelled = true;
    return e;
};
const makeApiStart = tables => program => {
    const token = { cancelled: false };
    const promise = Free.isFree(program)
        ? new Promise((resolve, reject) => {
            Free.runWithTask(cmd => {
                // 옛 가드와 같은 읽기 순서(name 먼저). 표식(cmd.api)이 명부를 고르니 동명 다른 api 도 걸린다.
                const name = cmd.name;
                const table = tables.get(cmd.api);
                const h = table === undefined ? undefined : table[name];
                if (typeof h !== 'function') {
                    // 이름이 다른 명부에 있으면 원인을 지목한다 — 동명 명령은 이 문안 없이는 오진을 부른다.
                    let hint = '';
                    for (const t of tables.values()) {
                        if (Object.prototype.hasOwnProperty.call(t, name)) {
                            hint = ` (the api owning this command has no interpreter here — another api also defines '${name}')`;
                            break;
                        }
                    }
                    return Task.rejected(new TypeError(`Free.api.run: no handler for '${name}'${hint}`));
                }
                // 취소 경계 — 비행 완료 직후부터 연속의 매 걸음 사이까지, 걸음마다 검사한다. docs/Free.md
                return liftHandlerResult(h(...cmd.args)).chain(v => {
                    const out = runApiContinuation(cmd.fns, v, token);
                    return out === CONTINUATION_CANCELLED ? Task.rejected(cancelledError()) : Task.of(out);
                });
            })(program).then(resolve, reject);
        })
        : Promise.reject(new TypeError('Free.api.run: program must be a Free value'));
    return { promise, cancel: () => { token.cancelled = true; } };
};
Free.api = (...names) => {
    // 어휘·api·핸들러 테이블은 전부 null-프로토타입 + own-property — 예약된 이름도 안전하다. docs/Free.md
    const vocabulary = Object.create(null);
    for (const name of names) {
        (typeof name !== 'string' || name.length === 0) && raise(new TypeError('Free.api: command name must be a non-empty string'));
        name === 'interpreter' && raise(new TypeError("Free.api: command name 'interpreter' is reserved"));
        vocabulary[name] && raise(new TypeError(`Free.api: duplicate command name '${name}'`));
        vocabulary[name] = true;
    }
    const api = Object.create(null);
    for (const name of names) api[name] = (...args) => Free.liftF(makeApiCommand(name, args, null, vocabulary));
    api.interpreter = handlers => {
        types.isPlainObject(handlers) || raise(new TypeError('Free.api.interpreter: handlers must be a plain object (inherited handlers are not accepted)'));
        const table = Object.create(null);
        // own key 만 본다 — 상속된 핸들러를 인정하면 프로토타입이 어휘 대조를 우회한다.
        for (const key of Object.keys(handlers)) {
            vocabulary[key] || raise(new TypeError(`Free.api.interpreter: unknown command '${key}'`));
            table[key] = handlers[key];
        }
        for (const name of names) {
            typeof table[name] !== 'function' && raise(new TypeError(`Free.api.interpreter: missing handler '${name}'`));
        }
        const tables = new Map([[vocabulary, table]]);
        const start = makeApiStart(tables);
        const it = { run: program => start(program).promise, start };
        interpreterRegistry.set(it, tables);
        return it;
    };
    return api;
};
/* Free.interpreters — 여러 api 의 명부를 아는 문지기. 명령의 표식이 자기 명부를 고른다. */
Free.interpreters = (...its) => {
    its.length > 0 || raise(new TypeError('Free.interpreters: at least one interpreter is required'));
    const tables = new Map();
    for (const it of its) {
        const src = interpreterRegistry.get(it);
        src || raise(new TypeError('Free.interpreters: arguments must be Free.api interpreters'));
        for (const [vocab, table] of src) {
            tables.has(vocab) && raise(new TypeError('Free.interpreters: duplicate interpreter for the same api'));
            tables.set(vocab, table);
        }
    }
    const start = makeApiStart(tables);
    const router = { run: program => start(program).promise, start };
    interpreterRegistry.set(router, tables);
    return router;
};

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
    // 자기 소유 프로퍼티만 본다 — 상속된 toString·constructor 를 "찾음" 으로 처리하면 안 된다.
    const own = (obj, key) => (obj != null && Object.prototype.hasOwnProperty.call(obj, key)) ? obj[key] : null;
    const path = keyStr => data => keyStr.split('.').map(k => k.trim()).reduce(
        (acc, key) => Chain.types.EitherChain.chain(obj => Either.fromNullable(own(obj, key)), acc),
        Either.fromNullable(data)
    );
    const template = (message, data) => message.replace(/\{\{([^}]+)\}\}/g,
        (match, keyStr) => Either.fold(_ => match, identity, path(keyStr)(data)));
    return { path, template };
})();

export default {
    Algebra, Setoid, Ord, Semigroup, Monoid, Group, Semigroupoid, Category,
    Filterable, Functor, Bifunctor, Contravariant, Profunctor, Strong, Choice, Wander,
    Apply, Applicative, Alt, Plus, Alternative, Chain, ChainRec, Monad, MonadError, Foldable, Reducible,
    Extend, Comonad, Traversable, Identity, Maybe, Either, Task, Free, Validation, NonEmptyList, Reader, Writer, State,
    StateT, EitherT, ReaderT, WriterT, Actor,
    Optics,
    identity, compose, compose2, sequence, foldMap, lift, pipeK, composeK, runCatch,
    constant, tuple, fst, snd, apply, unapply, unapply2, curry, curry2, uncurry, uncurry2,
    predicate, predicateN, negate, negateN,
    flip, flip2, flipCurried, flipCurried2, pipe, pipe2, pipeWhile,
    tap, also, pipeFrom, useOrLift, partial, once, converge, range, rangeBy, transducer, trampoline,
    extra, setStrictMode, setTapErrorHandler
};
