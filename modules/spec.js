import { types, register, raise } from './base.js';

class Algebra { constructor(type) { this.type = type; } }

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
class Monoid extends Semigroup {
    constructor(semigroup, empty, type, registry, ...aliases) {
        !(semigroup instanceof Semigroup) && raise(new TypeError('Monoid: argument must be a Semigroup'));
        super(semigroup.concat, type);
        this.empty = empty;
        registry && register(registry, this, ...aliases);
    }
    empty() { raise(new Error('Monoid: empty is not implemented')); }
}
class Group extends Monoid {
    constructor(monoid, invert, type, registry, ...aliases) {
        !(monoid instanceof Monoid) && raise(new TypeError('Group: argument must be a Monoid'));
        super(monoid, monoid.empty, type);
        if (invert) {
            this.invert = a => types.check(a, this.type)
                ? invert(a) : raise(new TypeError(`Group.invert: argument must be ${this.type}`));
        }
        registry && register(registry, this, ...aliases);
    }
    invert() { raise(new Error('Group: invert is not implemented')); }
}
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
class Category extends Semigroupoid {
    constructor(semigroupoid, id, type, registry, ...aliases) {
        !(semigroupoid instanceof Semigroupoid) && raise(new TypeError('Category: argument must be a Semigroupoid'));
        super(semigroupoid.compose, type);
        this.id = id;
        registry && register(registry, this, ...aliases);
    }
    id() { raise(new Error('Category: id is not implemented')); }
}
class Filterable extends Algebra {
    constructor(filter, type, registry, ...aliases) {
        super(type);
        if (filter) {
            this.filter = (pred, a) => (types.of(pred) === 'function' && types.check(a, this.type))
                ? filter(pred, a) : raise(new TypeError(`Filterable.filter: arguments must be (function, ${this.type})`));
        }
        registry && register(registry, this, ...aliases);
    }
    filter() { raise(new Error('Filterable: filter is not implemented')); }
}
class Functor extends Algebra {
    constructor(map, type, registry, ...aliases) {
        super(type);
        if (map) {
            this.map = (f, a) => (types.of(f) === 'function' && types.check(a, this.type))
                ? map(f, a) : raise(new TypeError(`Functor.map: arguments must be (function, ${this.type})`));
        }
        registry && register(registry, this, ...aliases);
    }
    map() { raise(new Error('Functor: map is not implemented')); }
}
class Bifunctor extends Algebra {
    constructor(bimap, type, registry, ...aliases) {
        super(type);
        if (bimap) {
            this.bimap = (f, g, a) => (types.of(f) === 'function' && types.of(g) === 'function' && types.check(a, this.type))
                ? bimap(f, g, a) : raise(new TypeError(`Bifunctor.bimap: arguments must be (function, function, ${this.type})`));
        }
        registry && register(registry, this, ...aliases);
    }
    bimap() { raise(new Error('Bifunctor: bimap is not implemented')); }
}
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
class Profunctor extends Algebra {
    constructor(promap, type, registry, ...aliases) {
        super(type);
        if (promap) {
            this.promap = (f, g, fn) => (types.of(f) === 'function' && types.of(g) === 'function' && types.of(fn) === 'function')
                ? promap(f, g, fn) : raise(new TypeError('Profunctor.promap: all arguments must be functions'));
        }
        registry && register(registry, this, ...aliases);
    }
    promap() { raise(new Error('Profunctor: promap is not implemented')); }
}
class Apply extends Functor {
    constructor(functor, ap, type, registry, ...aliases) {
        !(functor instanceof Functor) && raise(new TypeError('Apply: argument must be a Functor'));
        super(functor.map, type);
        if (ap) {
            this.ap = (fs, values) => (types.equals(fs, values, this.type))
                ? ap(fs, values) : raise(new TypeError(`Apply.ap: both arguments must be ${this.type}`));
        }
        registry && register(registry, this, ...aliases);
    }
    ap() { raise(new Error('Apply: ap is not implemented')); }
}
class Applicative extends Apply {
    constructor(apply, of, type, registry, ...aliases) {
        !(apply instanceof Apply) && raise(new TypeError('Applicative: argument must be an Apply'));
        super(apply, apply.ap, type);
        this.of = of;
        registry && register(registry, this, ...aliases);
    }
    of() { raise(new Error('Applicative: of is not implemented')); }
}
class Alt extends Functor {
    constructor(functor, alt, type, registry, ...aliases) {
        !(functor instanceof Functor) && raise(new TypeError('Alt: argument must be a Functor'));
        super(functor.map, type);
        if (alt) {
            this.alt = (a, b) => (types.equals(a, b, this.type))
                ? alt(a, b) : raise(new TypeError(`Alt.alt: both arguments must be ${this.type}`));
        }
        registry && register(registry, this, ...aliases);
    }
    alt() { raise(new Error('Alt: alt is not implemented')); }
}
class Plus extends Alt {
    constructor(alt, zero, type, registry, ...aliases) {
        !(alt instanceof Alt) && raise(new TypeError('Plus: argument must be an Alt'));
        super(alt, alt.alt, type);
        this.zero = zero;
        registry && register(registry, this, ...aliases);
    }
    zero() { raise(new Error('Plus: zero is not implemented')); }
}
class Alternative extends Applicative {
    constructor(applicative, plus, type, registry, ...aliases) {
        !(applicative instanceof Applicative) && raise(new TypeError('Alternative: first argument must be an Applicative'));
        !(plus instanceof Plus) && raise(new TypeError('Alternative: second argument must be a Plus'));
        super(applicative, applicative.of, type);
        this.ap = applicative.ap;
        this.alt = plus.alt;
        this.zero = plus.zero;
        registry && register(registry, this, ...aliases);
    }
}
class Chain extends Apply {
    constructor(apply, chain, type, registry, ...aliases) {
        !(apply instanceof Apply) && raise(new TypeError('Chain: argument must be an Apply'));
        super(apply, apply.ap, type);
        if (chain) {
            this.chain = (f, a) => (types.of(f) === 'function' && types.check(a, this.type))
                ? chain(f, a) : raise(new TypeError(`Chain.chain: arguments must be (function, ${this.type})`));
        }
        registry && register(registry, this, ...aliases);
    }
    chain() { raise(new Error('Chain: chain is not implemented')); }
}
class ChainRec extends Chain {
    constructor(chain, chainRec, type, registry, ...aliases) {
        !(chain instanceof Chain) && raise(new TypeError('ChainRec: argument must be a Chain'));
        super(chain, chain.chain, type);
        if (chainRec) {
            this.chainRec = (f, i) => (types.of(f) === 'function')
                ? chainRec(f, i) : raise(new TypeError('ChainRec.chainRec: first argument must be a function'));
        }
        registry && register(registry, this, ...aliases);
    }
    chainRec() { raise(new Error('ChainRec: chainRec is not implemented')); }
}
class Monad extends Applicative {
    constructor(applicative, chain, type, registry, ...aliases) {
        !(applicative instanceof Applicative) && raise(new TypeError('Monad: first argument must be an Applicative'));
        !(chain instanceof Chain) && raise(new TypeError('Monad: second argument must be a Chain'));
        super(applicative, applicative.of, type);
        this.ap = applicative.ap;
        this.chain = chain.chain;
        registry && register(registry, this, ...aliases);
    }
}
class Foldable extends Algebra {
    constructor(reduce, type, registry, ...aliases) {
        super(type);
        if (reduce) {
            this.reduce = (f, init, a) => (types.of(f) === 'function' && types.check(a, this.type))
                ? reduce(f, init, a) : raise(new TypeError(`Foldable.reduce: arguments must be (function, initial, ${this.type})`));
        }
        registry && register(registry, this, ...aliases);
    }
    reduce() { raise(new Error('Foldable: reduce is not implemented')); }
}
class Extend extends Functor {
    constructor(functor, extend, type, registry, ...aliases) {
        !(functor instanceof Functor) && raise(new TypeError('Extend: argument must be a Functor'));
        super(functor.map, type);
        if (extend) {
            this.extend = (f, a) => (types.of(f) === 'function' && types.check(a, this.type))
                ? extend(f, a) : raise(new TypeError(`Extend.extend: arguments must be (function, ${this.type})`));
        }
        registry && register(registry, this, ...aliases);
    }
    extend() { raise(new Error('Extend: extend is not implemented')); }
}
class Comonad extends Extend {
    constructor(extend, extract, type, registry, ...aliases) {
        !(extend instanceof Extend) && raise(new TypeError('Comonad: argument must be an Extend'));
        super(extend, extend.extend, type);
        if (extract) {
            this.extract = a => types.check(a, this.type) ? extract(a) : raise(new TypeError(`Comonad.extract: argument must be ${this.type}`));
        }
        registry && register(registry, this, ...aliases);
    }
    extract() { raise(new Error('Comonad: extract is not implemented')); }
}
class Traversable extends Functor {
    constructor(functor, foldable, traverse, type, registry, ...aliases) {
        !(functor instanceof Functor) && raise(new TypeError('Traversable: first argument must be a Functor'));
        !(foldable instanceof Foldable) && raise(new TypeError('Traversable: second argument must be a Foldable'));
        super(functor.map, type);
        this.reduce = foldable.reduce;
        if (traverse) {
            this.traverse = (applicative, f, a) => (types.of(f) === 'function' && types.check(a, this.type))
                ? traverse(applicative, f, a) : raise(new TypeError(`Traversable.traverse: arguments must be (applicative, function, ${this.type})`));
        }
        registry && register(registry, this, ...aliases);
    }
    traverse() { raise(new Error('Traversable: traverse is not implemented')); }
}

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

export default {
    Algebra, Setoid, Ord, Semigroup, Monoid, Group, Semigroupoid, Category,
    Filterable, Functor, Bifunctor, Contravariant, Profunctor,
    Apply, Applicative, Alt, Plus, Alternative, Chain, ChainRec, Monad, Foldable,
    Extend, Comonad, Traversable
};