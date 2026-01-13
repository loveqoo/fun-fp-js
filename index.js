const polyfills = {
    array: {
        flatMap: (f, arr) => arr.reduce((acc, x) => acc.concat(f(x)), [])
    },
    object: {
        fromEntries: entries => entries.reduce((obj, [k, v]) => (obj[k] = v, obj), {}),
        entries: obj => Object.keys(obj).map(k => [k, obj[k]]),
        values: obj => Object.keys(obj).map(k => obj[k]),
        filter: (pred, obj) => polyfills.object.fromEntries(polyfills.object.entries(obj).filter(([k, v]) => pred(v, k)))
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
    Task: Symbol.for('fun-fp-js/Task')
};
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
};
const identity = x => x;
const compose2 = (f, g) => x => f(g(x));
const raise = e => { throw e; };
const runCatch = (f, onError = console.log) => (...args) => {
    try { return f(...args); }
    catch (e) { return onError(e); }
};
const toIterator = function* (iterable) {
    if (iterable == null) return;
    if (types.isIterable(iterable)) {
        yield* iterable;
    } else if (types.isPlainObject(iterable)) {
        for (const key in iterable) {
            if (Object.prototype.hasOwnProperty.call(iterable, key)) {
                yield iterable[key];
            }
        }
    } else {
        yield iterable;
    }
};
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
class Algebra { constructor(type) { this.type = type; } }
Algebra.prototype[Symbols.Algebra] = true;
class Setoid extends Algebra {
    constructor(equals, type, registry, ...registryKeys) {
        super(type);
        if (equals) {
            this.equals = (a, b) => (types.equals(a, b) && types.check(a, this.type))
                ? equals(a, b)
                : raise(new TypeError(`Setoid.equals: arguments must be the same type and match ${this.type}`));
        }
        registry && register(registry, this, ...registryKeys);
    }
    equals() { raise(new Error('Setoid: equals is not implemented')); }
}
Setoid.prototype[Symbols.Setoid] = true;
class Ord extends Algebra {
    constructor(lte, type, registry, ...aliases) {
        super(type);
        if (lte) {
            this.lte = (a, b) => (types.equals(a, b) && types.check(a, this.type))
                ? lte(a, b)
                : raise(new TypeError(`Ord.lte: arguments must be the same type and match ${this.type}`));
        }
        registry && register(registry, this, ...aliases);
    }
    lte() { raise(new Error('Ord: lte is not implemented')); }
}
Ord.prototype[Symbols.Ord] = true;
class Semigroup extends Algebra {
    constructor(concat, type, registry, ...aliases) {
        super(type);
        if (concat) {
            this.concat = (a, b) => (types.equals(a, b) && types.check(a, this.type))
                ? concat(a, b)
                : raise(new TypeError(`Semigroup.concat: arguments must be the same type and match ${this.type}`));
        }
        registry && register(registry, this, ...aliases);
    }
    concat() { raise(new Error('Semigroup: concat is not implemented')); }
}
Semigroup.prototype[Symbols.Semigroup] = true;
class Monoid extends Semigroup {
    constructor(semigroup, empty, type, registry, ...aliases) {
        !(semigroup && semigroup[Symbols.Semigroup]) && raise(new TypeError('Monoid: argument must be a Semigroup'));
        super(semigroup.concat, type);
        this.empty = empty;
        registry && register(registry, this, ...aliases);
    }
    empty() { raise(new Error('Monoid: empty is not implemented')); }
}
Monoid.prototype[Symbols.Monoid] = true;
class Group extends Monoid {
    constructor(monoid, invert, type, registry, ...aliases) {
        !(monoid && monoid[Symbols.Monoid]) && raise(new TypeError('Group: argument must be a Monoid'));
        super(monoid, monoid.empty, type);
        if (invert) {
            this.invert = a => types.check(a, this.type)
                ? invert(a) : raise(new TypeError(`Group.invert: argument must be ${this.type}`));
        }
        registry && register(registry, this, ...aliases);
    }
    invert() { raise(new Error('Group: invert is not implemented')); }
}
Group.prototype[Symbols.Group] = true;
class Semigroupoid extends Algebra {
    constructor(compose, type, registry, ...registryKeys) {
        super(type);
        if (compose) {
            this.compose = (f, g) => (types.equals(f, g, 'function'))
                ? compose(f, g) : raise(new TypeError('Semigroupoid.compose: both arguments must be functions'));
        }
        registry && register(registry, this, ...registryKeys);
    }
    compose() { raise(new Error('Semigroupoid: compose is not implemented')); }
}
Semigroupoid.prototype[Symbols.Semigroupoid] = true;
class Category extends Semigroupoid {
    constructor(semigroupoid, id, type, registry, ...aliases) {
        !(semigroupoid && semigroupoid[Symbols.Semigroupoid]) && raise(new TypeError('Category: argument must be a Semigroupoid'));
        super(semigroupoid.compose, type);
        this.id = id;
        registry && register(registry, this, ...aliases);
    }
    id() { raise(new Error('Category: id is not implemented')); }
}
Category.prototype[Symbols.Category] = true;
class Filterable extends Algebra {
    constructor(filter, type, registry, ...aliases) {
        super(type);
        if (filter) {
            this.filter = (pred, a) => (types.isFunction(pred) && types.check(a, this.type))
                ? filter(pred, a) : raise(new TypeError(`Filterable.filter: arguments must be (function, ${this.type})`));
        }
        registry && register(registry, this, ...aliases);
    }
    filter() { raise(new Error('Filterable: filter is not implemented')); }
}
Filterable.prototype[Symbols.Filterable] = true;
class Functor extends Algebra {
    constructor(map, type, registry, ...aliases) {
        super(type);
        if (map) {
            this.map = (f, a) => (types.isFunction(f) && types.check(a, this.type))
                ? map(f, a) : raise(new TypeError(`Functor.map: arguments must be (function, ${this.type})`));
        }
        registry && register(registry, this, ...aliases);
    }
    map() { raise(new Error('Functor: map is not implemented')); }
}
Functor.prototype[Symbols.Functor] = true;
class Bifunctor extends Algebra {
    constructor(bimap, type, registry, ...aliases) {
        super(type);
        if (bimap) {
            this.bimap = (f, g, a) => (types.equals(f, g, 'function') && types.check(a, this.type))
                ? bimap(f, g, a) : raise(new TypeError(`Bifunctor.bimap: arguments must be (function, function, ${this.type})`));
        }
        registry && register(registry, this, ...aliases);
    }
    bimap() { raise(new Error('Bifunctor: bimap is not implemented')); }
}
Bifunctor.prototype[Symbols.Bifunctor] = true;
class Contravariant extends Algebra {
    constructor(contramap, type, registry, ...aliases) {
        super(type);
        if (contramap) {
            this.contramap = (f, g) => (types.equals(f, g, 'function'))
                ? contramap(f, g) : raise(new TypeError('Contravariant.contramap: both arguments must be functions'));
        }
        registry && register(registry, this, ...aliases);
    }
    contramap() { raise(new Error('Contravariant: contramap is not implemented')); }
}
Contravariant.prototype[Symbols.Contravariant] = true;
class Profunctor extends Algebra {
    constructor(promap, type, registry, ...aliases) {
        super(type);
        if (promap) {
            this.promap = (f, g, fn) => (types.equals(f, g, 'function') && types.isFunction(fn))
                ? promap(f, g, fn) : raise(new TypeError('Profunctor.promap: all arguments must be functions'));
        }
        registry && register(registry, this, ...aliases);
    }
    promap() { raise(new Error('Profunctor: promap is not implemented')); }
}
Profunctor.prototype[Symbols.Profunctor] = true;
class Apply extends Functor {
    constructor(functor, ap, type, registry, ...aliases) {
        !(functor && functor[Symbols.Functor]) && raise(new TypeError('Apply: argument must be a Functor'));
        super(functor.map, type);
        if (ap) {
            this.ap = (fs, values) => (types.equals(fs, values, this.type))
                ? ap(fs, values) : raise(new TypeError(`Apply.ap: both arguments must be ${this.type}`));
        }
        registry && register(registry, this, ...aliases);
    }
    ap() { raise(new Error('Apply: ap is not implemented')); }
}
Apply.prototype[Symbols.Apply] = true;
class Applicative extends Apply {
    constructor(apply, of, type, registry, ...aliases) {
        !(apply && apply[Symbols.Apply]) && raise(new TypeError('Applicative: argument must be an Apply'));
        super(apply, apply.ap, type);
        this.of = of;
        registry && register(registry, this, ...aliases);
    }
    of() { raise(new Error('Applicative: of is not implemented')); }
}
Applicative.prototype[Symbols.Applicative] = true;
class Alt extends Functor {
    constructor(functor, alt, type, registry, ...aliases) {
        !(functor && functor[Symbols.Functor]) && raise(new TypeError('Alt: argument must be a Functor'));
        super(functor.map, type);
        if (alt) {
            this.alt = (a, b) => (types.equals(a, b, this.type))
                ? alt(a, b) : raise(new TypeError(`Alt.alt: both arguments must be ${this.type}`));
        }
        registry && register(registry, this, ...aliases);
    }
    alt() { raise(new Error('Alt: alt is not implemented')); }
}
Alt.prototype[Symbols.Alt] = true;
class Plus extends Alt {
    constructor(alt, zero, type, registry, ...aliases) {
        !(alt && alt[Symbols.Alt]) && raise(new TypeError('Plus: argument must be an Alt'));
        super(alt, alt.alt, type);
        this.zero = zero;
        registry && register(registry, this, ...aliases);
    }
    zero() { raise(new Error('Plus: zero is not implemented')); }
}
Plus.prototype[Symbols.Plus] = true;
class Alternative extends Applicative {
    constructor(applicative, plus, type, registry, ...aliases) {
        !(applicative && applicative[Symbols.Applicative]) && raise(new TypeError('Alternative: first argument must be an Applicative'));
        !(plus && plus[Symbols.Plus]) && raise(new TypeError('Alternative: second argument must be a Plus'));
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
        !(apply && apply[Symbols.Apply]) && raise(new TypeError('Chain: argument must be an Apply'));
        super(apply, apply.ap, type);
        if (chain) {
            this.chain = (f, a) => (types.of(f) === 'function' && types.check(a, this.type))
                ? chain(f, a) : raise(new TypeError(`Chain.chain: arguments must be (function, ${this.type})`));
        }
        registry && register(registry, this, ...aliases);
    }
    chain() { raise(new Error('Chain: chain is not implemented')); }
}
Chain.prototype[Symbols.Chain] = true;
class ChainRec extends Chain {
    constructor(chain, chainRec, type, registry, ...aliases) {
        !(chain && chain[Symbols.Chain]) && raise(new TypeError('ChainRec: argument must be a Chain'));
        super(chain, chain.chain, type);
        if (chainRec) {
            this.chainRec = (f, i) => (types.isFunction(f))
                ? chainRec(f, i) : raise(new TypeError('ChainRec.chainRec: first argument must be a function'));
        }
        registry && register(registry, this, ...aliases);
    }
    chainRec() { raise(new Error('ChainRec: chainRec is not implemented')); }
}
ChainRec.prototype[Symbols.ChainRec] = true;
class Monad extends Applicative {
    constructor(applicative, chain, type, registry, ...aliases) {
        !(applicative && applicative[Symbols.Applicative]) && raise(new TypeError('Monad: first argument must be an Applicative'));
        !(chain && chain[Symbols.Chain]) && raise(new TypeError('Monad: second argument must be a Chain'));
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
        if (reduce) {
            this.reduce = (f, init, a) => (types.isFunction(f) && types.check(a, this.type))
                ? reduce(f, init, a) : raise(new TypeError(`Foldable.reduce: arguments must be (function, initial, ${this.type})`));
        }
        registry && register(registry, this, ...aliases);
    }
    reduce() { raise(new Error('Foldable: reduce is not implemented')); }
}
Foldable.prototype[Symbols.Foldable] = true;
class Extend extends Functor {
    constructor(functor, extend, type, registry, ...aliases) {
        !(functor && functor[Symbols.Functor]) && raise(new TypeError('Extend: argument must be a Functor'));
        super(functor.map, type);
        if (extend) {
            this.extend = (f, a) => (types.isFunction(f) && types.check(a, this.type))
                ? extend(f, a) : raise(new TypeError(`Extend.extend: arguments must be (function, ${this.type})`));
        }
        registry && register(registry, this, ...aliases);
    }
    extend() { raise(new Error('Extend: extend is not implemented')); }
}
Extend.prototype[Symbols.Extend] = true;
class Comonad extends Extend {
    constructor(extend, extract, type, registry, ...aliases) {
        !(extend && extend[Symbols.Extend]) && raise(new TypeError('Comonad: argument must be an Extend'));
        super(extend, extend.extend, type);
        if (extract) {
            this.extract = a => types.check(a, this.type) ? extract(a) : raise(new TypeError(`Comonad.extract: argument must be ${this.type}`));
        }
        registry && register(registry, this, ...aliases);
    }
    extract() { raise(new Error('Comonad: extract is not implemented')); }
}
Comonad.prototype[Symbols.Comonad] = true;
class Traversable extends Functor {
    constructor(functor, foldable, traverse, type, registry, ...aliases) {
        !(functor && functor[Symbols.Functor]) && raise(new TypeError('Traversable: first argument must be a Functor'));
        !(foldable && foldable[Symbols.Foldable]) && raise(new TypeError('Traversable: second argument must be a Foldable'));
        super(functor.map, type);
        this.reduce = foldable.reduce;
        if (traverse) {
            this.traverse = (applicative, f, a) => {
                if (!applicative[Symbols.Applicative]) {
                    return raise(new TypeError('Traversable.traverse: first argument must be an Applicative'));
                }
                if (!types.isFunction(f)) {
                    return raise(new TypeError('Traversable.traverse: second argument must be a function'));
                }
                if (!types.check(a, this.type)) {
                    return raise(new TypeError(`Traversable.traverse: third argument must be ${this.type}`));
                }
                return traverse(applicative, f, a);
            };
        }
        registry && register(registry, this, ...aliases);
    }
    traverse() { raise(new Error('Traversable: traverse is not implemented')); }
}
Traversable.prototype[Symbols.Traversable] = true;

Setoid.op = (a, b) => a === b;
Setoid.types = {};
Setoid.resolver = key => Setoid.types[key] || (key === 'default' ? { equals: Setoid.op } : null);
Setoid.of = key => Setoid.resolver(key) || raise(new TypeError(`Setoid.of: unsupported key ${key}`));

Ord.op = (a, b) => a <= b;
Ord.types = {};
Ord.resolver = key => Ord.types[key] || (key === 'default' ? { lte: Ord.op } : null);
Ord.of = key => Ord.resolver(key) || raise(new TypeError(`Ord.of: unsupported key ${key}`));

Semigroup.types = {};
Semigroup.resolver = key => Semigroup.types[key];
Semigroup.of = key => Semigroup.resolver(key) || raise(new TypeError(`Semigroup.of: unsupported key ${key}`));

Monoid.types = {};
Monoid.resolver = key => Monoid.types[key];
Monoid.of = key => Monoid.resolver(key) || raise(new TypeError(`Monoid.of: unsupported key ${key}`));

Group.types = {};
Group.resolver = key => Group.types[key];
Group.of = key => Group.resolver(key) || raise(new TypeError(`Group.of: unsupported key ${key}`));

Semigroupoid.types = {};
Semigroupoid.resolver = key => Semigroupoid.types[key];
Semigroupoid.of = key => Semigroupoid.resolver(key) || raise(new TypeError(`Semigroupoid.of: unsupported key ${key}`));

Category.types = {};
Category.resolver = key => Category.types[key];
Category.of = key => Category.resolver(key) || raise(new TypeError(`Category.of: unsupported key ${key}`));

Filterable.types = {};
Filterable.resolver = key => Filterable.types[key];
Filterable.of = key => Filterable.resolver(key) || raise(new TypeError(`Filterable.of: unsupported key ${key}`));

Functor.types = {};
Functor.resolver = key => Functor.types[key];
Functor.of = key => Functor.resolver(key) || raise(new TypeError(`Functor.of: unsupported key ${key}`));

Bifunctor.types = {};
Bifunctor.resolver = key => Bifunctor.types[key];
Bifunctor.of = key => Bifunctor.resolver(key) || raise(new TypeError(`Bifunctor.of: unsupported key ${key}`));

Contravariant.types = {};
Contravariant.resolver = key => Contravariant.types[key];
Contravariant.of = key => Contravariant.resolver(key) || raise(new TypeError(`Contravariant.of: unsupported key ${key}`));

Profunctor.types = {};
Profunctor.resolver = key => Profunctor.types[key];
Profunctor.of = key => Profunctor.resolver(key) || raise(new TypeError(`Profunctor.of: unsupported key ${key}`));

Apply.types = {};
Apply.resolver = key => Apply.types[key];
Apply.of = key => Apply.resolver(key) || raise(new TypeError(`Apply.of: unsupported key ${key}`));

Applicative.types = {};
Applicative.resolver = key => Applicative.types[key];
Applicative.of = key => Applicative.resolver(key) || raise(new TypeError(`Applicative.of: unsupported key ${key}`));

Alt.types = {};
Alt.resolver = key => Alt.types[key];
Alt.of = key => Alt.resolver(key) || raise(new TypeError(`Alt.of: unsupported key ${key}`));

Plus.types = {};
Plus.resolver = key => Plus.types[key];
Plus.of = key => Plus.resolver(key) || raise(new TypeError(`Plus.of: unsupported key ${key}`));

Alternative.types = {};
Alternative.resolver = key => Alternative.types[key];
Alternative.of = key => Alternative.resolver(key) || raise(new TypeError(`Alternative.of: unsupported key ${key}`));

Chain.types = {};
Chain.resolver = key => Chain.types[key];
Chain.of = key => Chain.resolver(key) || raise(new TypeError(`Chain.of: unsupported key ${key}`));

ChainRec.types = {};
ChainRec.next = value => ({ tag: 'next', value });
ChainRec.done = value => ({ tag: 'done', value });
ChainRec.resolver = key => ChainRec.types[key];
ChainRec.of = key => ChainRec.resolver(key) || raise(new TypeError(`ChainRec.of: unsupported key ${key}`));

Monad.types = {};
Monad.resolver = key => Monad.types[key];
Monad.of = key => Monad.resolver(key) || raise(new TypeError(`Monad.of: unsupported key ${key}`));

Foldable.types = {};
Foldable.resolver = key => Foldable.types[key];
Foldable.of = key => Foldable.resolver(key) || raise(new TypeError(`Foldable.of: unsupported key ${key}`));

Extend.types = {};
Extend.resolver = key => Extend.types[key];
Extend.of = key => Extend.resolver(key) || raise(new TypeError(`Extend.of: unsupported key ${key}`));

Comonad.types = {};
Comonad.resolver = key => Comonad.types[key];
Comonad.of = key => Comonad.resolver(key) || raise(new TypeError(`Comonad.of: unsupported key ${key}`));

Traversable.types = {};
Traversable.resolver = key => Traversable.types[key];
Traversable.of = key => Traversable.resolver(key) || raise(new TypeError(`Traversable.of: unsupported key ${key}`));

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
/* Object */
class FirstSemigroup extends Semigroup {
    constructor() {
        super(x => x, 'object', Semigroup.types, 'first');
    }
}
modules.push(FirstSemigroup);
class LastSemigroup extends Semigroup {
    constructor() {
        super((x, y) => y, 'object', Semigroup.types, 'last');
    }
}
modules.push(LastSemigroup);
class FirstMonoid extends Monoid {
    constructor() {
        super(Semigroup.types.FirstSemigroup, () => null, 'object', Monoid.types, 'first');
    }
}
modules.push(FirstMonoid);
class LastMonoid extends Monoid {
    constructor() {
        super(Semigroup.types.LastSemigroup, () => null, 'object', Monoid.types, 'last');
    }
}
modules.push(LastMonoid);
class ObjectFilterable extends Filterable {
    constructor() {
        super((pred, obj) => es6.object.filter(pred, obj), 'object', Filterable.types, 'object');
    }
}
modules.push(ObjectFilterable);
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
        super((x, y) => x.getTime() === y.getTime(), 'date', Setoid.types, 'date');
    }
}
modules.push(DateSetoid);
class DateOrd extends Ord {
    constructor() {
        super((x, y) => x.getTime() <= y.getTime(), 'date', Ord.types, 'date');
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
}
class Nothing extends Maybe {
    constructor() {
        super(); this._typeName = 'Maybe';
    }
    isNothing() { return true; }
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
class MaybeSemigroupoid extends Semigroupoid {
    constructor() {
        super((f, g) => x => Chain.types.MaybeChain.chain(f, g(x)), 'Maybe', Semigroupoid.types, 'maybe');
    }
}
modules.push(MaybeSemigroupoid);
class MaybeCategory extends Category {
    constructor() {
        super(Semigroupoid.types.MaybeSemigroupoid, Maybe.Just, 'Maybe', Category.types, 'maybe');
    }
}
modules.push(MaybeCategory);
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
}
class Right extends Either {
    constructor(value) { super(); this.value = value; this._typeName = 'Either'; }
    isRight() { return true; }
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
/* Task */
class Task {
    constructor(computation) {
        // fork를 1회 settle로 래핑하여 다중 호출 방지
        this.fork = (reject, resolve) => {
            let settled = false;
            computation(
                e => { if (settled) return; settled = true; reject(e); },
                v => { if (settled) return; settled = true; resolve(v); }
            );
        };
        this._typeName = 'Task';
    }
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
Task.fromPromise = promiseFn => (...args) => new Task((reject, resolve) => promiseFn(...args).then(resolve).catch(reject));
Task.fromEither = e => e.isRight() ? Task.of(e.value) : Task.rejected(e.value);
Task.all = tasks => new Task((reject, resolve) => {
    const list = Array.isArray(tasks) ? tasks : [tasks];
    if (list.length === 0) return resolve([]);
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
    let done = false;
    list.forEach(t => t.fork(e => { if (!done) { done = true; reject(e); } }, v => { if (!done) { done = true; resolve(v); } }));
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
class TaskFunctor extends Functor {
    constructor() {
        super((f, task) => new Task((reject, resolve) => {
            settledFork(task, reject, x => resolve(f(x)));
        }), 'Task', Functor.types, 'task');
    }
}
modules.push(TaskFunctor);
class TaskApply extends Apply {
    constructor() {
        super(Functor.types.TaskFunctor, (taskFn, taskVal) => new Task((reject, resolve) => {
            const g = createSettledGuard();
            let fn, val, fnDone = false, valDone = false;
            const tryResolve = () => {
                if (fnDone && valDone) g.guard(resolve)(fn(val));
            };
            taskFn.fork(g.guard(reject), g.check(f => { fn = f; fnDone = true; tryResolve(); }));
            taskVal.fork(g.guard(reject), g.check(v => { val = v; valDone = true; tryResolve(); }));
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
                    g.check(x => f(x).fork(g.guard(reject), g.guard(resolve)))
                );
            }),
            'Task', Chain.types, 'task');
    }
}
modules.push(TaskChain);
class TaskChainRec extends ChainRec {
    constructor() {
        super(Chain.types.TaskChain,
            (f, i) => new Task((reject, resolve) => {
                const loop = val => {
                    f(ChainRec.next, ChainRec.done, val).fork(reject, step => step.tag === 'next' ? loop(step.value) : resolve(step.value));
                };
                loop(i);
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
load(...modules);
/* Utilities */
const lift = applicative => {
    if (!(applicative && applicative[Symbols.Applicative] === true)) {
        raise(new TypeError('lift: first argument must be an Applicative'));
    }
    return f => {
        types.checkFunction(f, 'lift');
        return (...args) => {
            if (args.length === 0) return applicative.of(f());
            return args.slice(1).reduce((acc, arg) => applicative.ap(acc, arg), applicative.map(curry(f, args.length), args[0]));
        };
    };
};
Maybe.toEither = (defaultLeft, m) => m.isJust() ? Either.Right(m.value) : Either.Left(defaultLeft);
Maybe.pipe = (m, ...fns) => {
    if (!Maybe.isMaybe(m)) raise(new TypeError('Maybe.pipe: first argument must be a Maybe'));
    return fns.reduce((acc, fn) => {
        if (!Maybe.isMaybe(acc)) return acc;
        return acc.isJust() ? fn(acc) : acc;
    }, m);
};
Maybe.pipeK = (...fns) => x => fns.reduce((acc, fn) => acc.isJust() ? fn(acc.value) : acc, Maybe.of(x));
Maybe.lift = f => runCatch(lift(Applicative.types.MaybeApplicative)(f), Maybe.Nothing);
Either.toMaybe = e => e.isRight() ? Maybe.Just(e.value) : Maybe.Nothing();
Either.pipe = (e, ...fns) => {
    if (!Either.isEither(e)) raise(new TypeError('Either.pipe: first argument must be an Either'));
    return fns.reduce((acc, fn) => {
        if (!Either.isEither(acc)) return acc;
        return acc.isRight() ? fn(acc) : acc;
    }, e);
};
Either.pipeK = (...fns) => x => fns.reduce(
    (acc, fn) => acc.isRight() ? fn(acc.value) : acc,
    Either.Right(x)
);
Either.lift = f => runCatch(lift(Applicative.types.EitherApplicative)(f), Either.Left);
const sequence = (traversable, applicative, u) => {
    if (!traversable || typeof traversable.traverse !== 'function') {
        raise(new TypeError('sequence: first argument must be a Traversable with traverse method'));
    }
    if (!types.check(u, traversable.type)) {
        raise(new TypeError(`sequence: u must be ${traversable.type}`));
    }
    return traversable.traverse(applicative, identity, u);
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
const pipe2 = (f, g) => x => types.checkFunction(g, 'pipe2')(f(x));
const apply = f => args => {
    types.of(args) !== 'Array' && raise(new TypeError('apply: args must be an array'));
    return types.checkFunction(f, 'apply')(...args);
};
const unapply = f => (...args) => f(args);
const curry = (f, arity = f.length) => {
    return function _curry(...args) {
        return args.length >= arity ? f(...args) : (...next) => _curry(...args, ...next);
    }
};
const uncurry = f => (...args) => args.reduce((acc, arg, i) => types.checkFunction(acc, `uncurry(${i})`)(arg), f);
const predicateN = f => (...args) => runCatch(types.checkFunction(f, 'predicateN'), () => false)(...args);
const negateN = f => (...args) => !predicateN(types.checkFunction(f, 'negateN'))(...args);
const flip = f => (...args) => types.checkFunction(f, 'flip')(...args.slice().reverse());
const flipCurried = f => (...as) => (...bs) => types.checkFunction(f, 'flipCurried')(...bs)(...as);
const pipe = (...fs) => x => fs.reduce((acc, f) => types.checkFunction(f, `pipe(${fs.length})`)(acc), x);
const compose = (...fs) => pipe(...fs.slice().reverse());
const tap = (...fs) => x => (fs.forEach(f => runCatch(f, console.log)(x)), x);
const also = flipCurried(tap);
const into = flipCurried(pipe);
const partial = (f, ...args) => (...next) => types.checkFunction(f, 'partial')(...args, ...next);
const useOrLift = check => lift => x => predicate(check)(x) ? x : lift(x);
const once = (f, option = {}) => {
    types.checkFunction(f, 'once');
    const state = option.state || { called: false };
    const defaultValue = option.defaultValue;
    let result = defaultValue;
    return (...args) => {
        if (!state.called) {
            const val = f(...args);
            result = val;
            state.called = true;
        }
        return result;
    };
};
const converge = (f, ...branches) => (...args) => types.checkFunction(f, 'converge')(...branches.map((branch, i) => types.checkFunction(branch, `converge:${i}`)(...args)));
const range = n => n >= 0 ? Array.from({ length: n }, (_, i) => i) : [];
const rangeBy = (start, end) => start >= end ? [] : range(end - start).map(i => start + i);
const { transducer } = (() => {
    class Reduced {
        constructor(value) { this.value = value; }
        static of(value) { return new Reduced(value); }
        static isReduced(value) { return value instanceof Reduced; }
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
        let taken = 0;
        return reducer => (accumulator, value) => {
            if (taken < count) {
                taken++;
                const result = reducer(accumulator, value);
                return taken === count ? Reduced.of(result) : result;
            }
            return Reduced.of(accumulator);
        };
    };
    return {
        transducer: {
            Reduced, of: Reduced.of, isReduced: Reduced.isReduced, transduce, map, filter, take,
        },
    };
})();
const { Free, trampoline } = (() => {
    const stackSafe = (runner, f, onReentry = f) => {
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
        static isPure(x) { return x instanceof Pure; }
        static isImpure(x) { return x instanceof Impure; }
        static liftF(command) {
            command[Symbols.Functor] || raise(new Error('Free.liftF: expected a functor'));
            return Free.isPure(command) || Free.isImpure(command)
                ? command
                : Free.impure(command.map(Free.pure));
        }
        static runSync(runner) {
            return target => {
                const execute = program => {
                    let step = program;
                    while (Free.isImpure(step)) {
                        step = runner(step.functor);
                        if (Free.isPure(step) && (Free.isPure(step.value) || Free.isImpure(step.value))) {
                            step = step.value;
                        }
                    }
                    return Free.isPure(step) ? step.value : step;
                };
                return typeof target === 'function' ? stackSafe(execute, target) : execute(target);
            };
        }
        static runAsync(runner) {
            return target => {
                const execute = async program => {
                    let step = program;
                    while (Free.isImpure(step)) {
                        step = await runner(step.functor);
                        if (Free.isPure(step) && (Free.isPure(step.value) || Free.isImpure(step.value))) {
                            step = step.value;
                        }
                    }
                    return Free.isPure(step) ? step.value : step;
                };
                return typeof target === 'function' ? stackSafe(execute, target) : execute(target);
            };
        }
    }
    class Pure extends Free {
        constructor(value) {
            super();
            this.value = value;
            this[Symbol.toStringTag] = 'Pure';
            this[Symbols.Functor] = true;
            this[Symbols.Monad] = true;
        }
        map(f) { return new Pure(f(this.value)); }
        flatMap(f) { return f(this.value); }
    }
    class Impure extends Free {
        constructor(functor) {
            super();
            functor[Symbols.Functor] || raise(new Error('Impure: expected a functor'));
            this.functor = functor;
            this[Symbol.toStringTag] = 'Impure';
            this[Symbols.Functor] = true;
            this[Symbols.Monad] = true;
        }
        map(f) { return new Impure(this.functor.map(free => free.map(f))); }
        flatMap(f) { return new Impure(this.functor.map(free => free.flatMap(f))); }
    }
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
    Free.Pure = Pure;
    Free.Impure = Impure;
    Free.Thunk = Thunk;
    Free.trampoline = trampoline;
    return { Free, trampoline };
})();
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
    Extend, Comonad, Traversable, Maybe, Either, Task, Free,
    identity, compose, compose2, sequence, lift, runCatch, toIterator,
    constant, tuple, apply, unapply, unapply2, curry, curry2, uncurry, uncurry2,
    predicate, predicateN, negate, negateN,
    flip, flip2, flipCurried, flipCurried2, pipe, pipe2,
    tap, also, into, useOrLift, partial, once, converge, range, rangeBy, transducer, trampoline,
    extra
};
