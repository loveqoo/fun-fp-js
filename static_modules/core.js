const $core = (() => {
    const typeOf = a => {
        if (a === null) { return 'null'; }
        const typeName = typeof a;
        if (typeName !== 'object') { return typeName; }
        if (Array.isArray(a)) { return 'Array'; }
        return a.constructor && a.constructor.name || 'object';
    };
    const raise = e => { throw e; };
    const isSameType = (a, b, typeName = '') => typeName ? typeOf(a) === typeName && typeOf(b) === typeName : typeOf(a) === typeOf(b);
    const register = (target, instance, ...aliases) => {
        target[instance.constructor.name] = instance;
        for (const alias of aliases) { target[alias.toLowerCase()] = instance; }
    };
    const compose = (f, g) => x => f(g(x));
    const identity = x => x;
    class Algebra { constructor(type) { this.type = type; } }
    Algebra.typeOf = typeOf, Algebra.raise = raise, Algebra.isSameType = isSameType, Algebra.register = register;
    class Setoid extends Algebra {
        constructor(equals, type, registry, ...registryKeys) {
            super(type), this.equals = equals, registry && register(registry, this, ...registryKeys);
        }
    }
    Setoid.op = (a, b) => a === b;
    Setoid.types = {};
    class NumberSetoid extends Setoid { constructor() { super((x, y) => Setoid.op(x, y), 'number', Setoid.types, 'number'); } }
    class StringSetoid extends Setoid { constructor() { super((x, y) => Setoid.op(x, y), 'string', Setoid.types, 'string'); } }
    class BooleanSetoid extends Setoid { constructor() { super((x, y) => Setoid.op(x, y), 'boolean', Setoid.types, 'boolean'); } }
    class DateSetoid extends Setoid { constructor() { super((x, y) => Setoid.op(x.getTime(), y.getTime()), 'date', Setoid.types, 'date'); } }
    (new NumberSetoid(), new StringSetoid(), new BooleanSetoid(), new DateSetoid());
    Setoid.resolver = key => Setoid.types[key] || { equals: Setoid.op };
    Setoid.of = key => {
        const setoid = Setoid.resolver(key);
        !setoid && raise(new TypeError(`Setoid.of: unsupported key ${key}`));
        return { equals: (a, b) => isSameType(a, b) ? setoid.equals(a, b) : raise(new TypeError(`Setoid.equals: types of a and b must be the same`)) };
    };
    class Ord extends Algebra {
        constructor(lte, type, registry, ...aliases) {
            super(type), this.lte = lte, registry && register(registry, this, ...aliases);
        }
    }
    Ord.op = (a, b) => a <= b;
    Ord.types = {};
    class NumberOrd extends Ord { constructor() { super((x, y) => Ord.op(x, y), 'number', Ord.types, 'number'); } }
    class StringOrd extends Ord { constructor() { super((x, y) => Ord.op(x, y), 'string', Ord.types, 'string'); } }
    class StringLengthOrd extends Ord { constructor() { super((x, y) => Ord.op(x.length, y.length), 'string', Ord.types); } }
    class StringLocaleOrd extends Ord { constructor() { super((x, y) => Ord.op(x.localeCompare(y), 0), 'string', Ord.types); } }
    (new NumberOrd(), new StringOrd(), new StringLengthOrd(), new StringLocaleOrd());
    Ord.resolver = key => Ord.types[key] || { lte: Ord.op };
    Ord.of = key => ({ lte: (a, b) => isSameType(a, b) ? Ord.resolver(key).lte(a, b) : raise(new TypeError(`Ord.lte: types of a and b must be the same`)) });
    class Semigroup extends Algebra {
        constructor(concat, type, registry, ...aliases) {
            super(type), this.concat = concat, registry && register(registry, this, ...aliases);
        }
    }
    Semigroup.types = {};
    class NumberSumSemigroup extends Semigroup { constructor() { super((x, y) => x + y, 'number', Semigroup.types, 'number'); } }
    class NumberProductSemigroup extends Semigroup { constructor() { super((x, y) => x * y, 'number', Semigroup.types); } }
    class NumberMaxSemigroup extends Semigroup { constructor() { super((x, y) => Math.max(x, y), 'number', Semigroup.types); } }
    class NumberMinSemigroup extends Semigroup { constructor() { super((x, y) => Math.min(x, y), 'number', Semigroup.types); } }
    class StringSemigroup extends Semigroup { constructor() { super((x, y) => x + y, 'string', Semigroup.types, 'string'); } }
    class BooleanAllSemigroup extends Semigroup { constructor() { super((x, y) => x && y, 'boolean', Semigroup.types, 'boolean'); } }
    class BooleanAnySemigroup extends Semigroup { constructor() { super((x, y) => x || y, 'boolean', Semigroup.types); } }
    class BooleanXorSemigroup extends Semigroup { constructor() { super((x, y) => x !== y, 'boolean', Semigroup.types); } }
    class ArraySemigroup extends Semigroup { constructor() { super((x, y) => x.concat(y), 'Array', Semigroup.types, 'array'); } }
    class FirstSemigroup extends Semigroup { constructor() { super((x, y) => x, 'any', Semigroup.types, 'first'); } }
    class LastSemigroup extends Semigroup { constructor() { super((x, y) => y, 'any', Semigroup.types, 'last'); } }
    class FunctionSemigroup extends Semigroup { constructor() { super(compose, 'function', Semigroup.types, 'function'); } }
    (new NumberSumSemigroup(), new NumberProductSemigroup(), new NumberMaxSemigroup(), new NumberMinSemigroup(), new StringSemigroup(),
        new BooleanAllSemigroup(), new BooleanAnySemigroup(), new BooleanXorSemigroup(), new FirstSemigroup(), new LastSemigroup(), new ArraySemigroup(), new FunctionSemigroup());
    Semigroup.resolver = key => Semigroup.types[key];
    Semigroup.of = key => {
        const semigroup = Semigroup.resolver(key);
        !semigroup && raise(new TypeError(`Semigroup.of: unsupported key ${key}`));
        return { concat: (a, b) => isSameType(a, b) ? semigroup.concat(a, b) : raise(new TypeError(`Semigroup.concat: types of a and b must be the same`)) };
    };
    class Monoid extends Semigroup {
        constructor(semigroup, empty, type, registry, ...aliases) {
            super(semigroup.concat, type), this.empty = empty, registry && register(registry, this, ...aliases);
        }
    }
    Monoid.types = {};
    class NumberSumMonoid extends Monoid { constructor() { super(Semigroup.types.NumberSumSemigroup, () => 0, 'number', Monoid.types, 'number'); } }
    class NumberProductMonoid extends Monoid { constructor() { super(Semigroup.types.NumberProductSemigroup, () => 1, 'number', Monoid.types); } }
    class NumberMaxMonoid extends Monoid { constructor() { super(Semigroup.types.NumberMaxSemigroup, () => -Infinity, 'number', Monoid.types); } }
    class NumberMinMonoid extends Monoid { constructor() { super(Semigroup.types.NumberMinSemigroup, () => Infinity, 'number', Monoid.types); } }
    class StringMonoid extends Monoid { constructor() { super(Semigroup.types.StringSemigroup, () => '', 'string', Monoid.types, 'string'); } }
    class BooleanAllMonoid extends Monoid { constructor() { super(Semigroup.types.BooleanAllSemigroup, () => true, 'boolean', Monoid.types, 'boolean'); } }
    class BooleanAnyMonoid extends Monoid { constructor() { super(Semigroup.types.BooleanAnySemigroup, () => false, 'boolean', Monoid.types); } }
    class BooleanXorMonoid extends Monoid { constructor() { super(Semigroup.types.BooleanXorSemigroup, () => false, 'boolean', Monoid.types); } }
    class FirstMonoid extends Monoid { constructor() { super(Semigroup.types.FirstSemigroup, () => null, 'any', Monoid.types, 'first'); } }
    class LastMonoid extends Monoid { constructor() { super(Semigroup.types.LastSemigroup, () => null, 'any', Monoid.types, 'last'); } }
    class ArrayMonoid extends Monoid { constructor() { super(Semigroup.types.ArraySemigroup, () => [], 'Array', Monoid.types, 'array'); } }
    class FunctionMonoid extends Monoid { constructor() { super(Semigroup.types.FunctionSemigroup, identity, 'function', Monoid.types, 'function'); } }
    (new NumberSumMonoid(), new NumberProductMonoid(), new NumberMaxMonoid(), new NumberMinMonoid(), new StringMonoid(), new BooleanAllMonoid(), new BooleanAnyMonoid(), new BooleanXorMonoid(), new FirstMonoid(), new LastMonoid(), new ArrayMonoid(), new FunctionMonoid());
    Monoid.resolver = key => Monoid.types[key];
    Monoid.of = key => {
        const monoid = Monoid.resolver(key);
        !monoid && raise(new TypeError(`Monoid.of: unsupported key ${key}`));
        return {
            concat: (a, b) => isSameType(a, b) ? monoid.concat(a, b) : raise(new TypeError(`Monoid.concat: types of a and b must be the same`)),
            empty: monoid.empty
        };
    };
    class Group extends Monoid {
        constructor(monoid, invert, type, registry, ...aliases) {
            super(monoid, monoid.empty, type), this.invert = invert, registry && register(registry, this, ...aliases);
        }
    }
    Group.types = {};
    class NumberSumGroup extends Group { constructor() { super(Monoid.types.NumberSumMonoid, x => -x, 'number', Group.types, 'number'); } }
    class NumberProductGroup extends Group { constructor() { super(Monoid.types.NumberProductMonoid, x => 1 / x, 'number', Group.types); } }
    class BooleanXorGroup extends Group { constructor() { super(Monoid.types.BooleanXorMonoid, x => x, 'boolean', Group.types); } }
    (new NumberSumGroup(), new NumberProductGroup(), new BooleanXorGroup());
    Group.resolver = key => Group.types[key];
    Group.of = key => {
        const group = Group.resolver(key);
        !group && raise(new TypeError(`Group.of: unsupported key ${key}`));
        return {
            concat: (a, b) => isSameType(a, b) ? group.concat(a, b) : raise(new TypeError(`Group.concat: types of a and b must be the same`)),
            empty: group.empty,
            invert: group.invert
        };
    };
    class Semigroupoid extends Algebra {
        constructor(compose, type, registry, ...registryKeys) {
            super(type), this.compose = compose, registry && register(registry, this, ...registryKeys);
        }
    }
    Semigroupoid.types = {};
    class FunctionSemigroupoid extends Semigroupoid { constructor() { super(compose, 'function', Semigroupoid.types, 'function'); } }
    (new FunctionSemigroupoid());
    Semigroupoid.resolver = key => Semigroupoid.types[key];
    Semigroupoid.of = key => {
        const semigroupoid = Semigroupoid.resolver(key);
        !semigroupoid && raise(new TypeError(`Semigroupoid.of: unsupported key ${key}`));
        return { compose: (a, b) => isSameType(a, b, 'function') ? semigroupoid.compose(a, b) : raise(new TypeError(`Semigroupoid.compose: types of a and b must be the same`)) };
    };
    class Category extends Semigroupoid {
        constructor(semigroupoid, id, type, registry, ...aliases) {
            super(semigroupoid.compose, type), this.id = id, registry && register(registry, this, ...aliases);
        }
    }
    Category.types = {};
    class FunctionCategory extends Category { constructor() { super(Semigroupoid.types.FunctionSemigroupoid, identity, 'function', Category.types, 'function'); } }
    (new FunctionCategory());
    Category.resolver = key => Category.types[key];
    Category.of = key => {
        const category = Category.resolver(key);
        !category && raise(new TypeError(`Category.of: unsupported key ${key}`));
        return {
            compose: (a, b) => isSameType(a, b, 'function') ? category.compose(a, b) : raise(new TypeError(`Category.compose: types of a and b must be the same`)),
            id: category.id
        };
    };
    class Filterable extends Algebra {
        constructor(filter, type, registry, ...aliases) {
            super(type), this.filter = filter, registry && register(registry, this, ...aliases);
        }
    }
    Filterable.types = {};
    class ArrayFilterable extends Filterable { constructor() { super((pred, arr) => arr.filter(pred), 'Array', Filterable.types, 'array'); } }
    class ObjectFilterable extends Filterable { constructor() { super((pred, obj) => Object.fromEntries(Object.entries(obj).filter(([k, v]) => pred(v))), 'object', Filterable.types, 'object'); } }
    (new ArrayFilterable(), new ObjectFilterable());
    Filterable.resolver = key => Filterable.types[key];
    Filterable.of = key => {
        const filterable = Filterable.resolver(key);
        !filterable && raise(new TypeError(`Filterable.of: unsupported key ${key}`));
        return {
            filter: (pred, a) => typeOf(pred) === 'function' ? filterable.filter(pred, a) : raise(new TypeError(`Filterable.filter: predicate must be a function`))
        };
    };
    class Functor extends Algebra {
        constructor(map, type, registry, ...aliases) {
            super(type), this.map = map, registry && register(registry, this, ...aliases);
        }
    }
    Functor.types = {};
    class ArrayFunctor extends Functor { constructor() { super((f, arr) => arr.map(f), 'Array', Functor.types, 'array'); } }
    (new ArrayFunctor());
    Functor.resolver = key => Functor.types[key];
    Functor.of = key => {
        const functor = Functor.resolver(key);
        !functor && raise(new TypeError(`Functor.of: unsupported key ${key}`));
        return {
            map: (f, a) => typeOf(f) === 'function' ? functor.map(f, a) : raise(new TypeError(`Functor.map: first argument must be a function`))
        };
    };
    class Bifunctor extends Algebra {
        constructor(bimap, type, registry, ...aliases) {
            super(type), this.bimap = bimap, registry && register(registry, this, ...aliases);
        }
    }
    Bifunctor.types = {};
    class TupleBifunctor extends Bifunctor { constructor() { super((f, g, [a, b]) => [f(a), g(b)], 'Array', Bifunctor.types, 'tuple'); } }
    (new TupleBifunctor());
    Bifunctor.resolver = key => Bifunctor.types[key];
    Bifunctor.of = key => {
        const bifunctor = Bifunctor.resolver(key);
        !bifunctor && raise(new TypeError(`Bifunctor.of: unsupported key ${key}`));
        return {
            bimap: (f, g, a) => {
                !isSameType(f, g, 'function') && raise(new TypeError(`Bifunctor.bimap: first two arguments must be functions`));
                typeOf(a) !== 'Array' && raise(new TypeError(`Bifunctor.bimap: third argument must be an array`));
                a.length !== 2 && raise(new TypeError(`Bifunctor.bimap: third argument must be an array of length 2`));
                return bifunctor.bimap(f, g, a);
            }
        };
    };
    class Contravariant extends Algebra {
        constructor(contramap, type, registry, ...aliases) {
            super(type), this.contramap = contramap, registry && register(registry, this, ...aliases);
        }
    }
    Contravariant.types = {};
    class PredicateContravariant extends Contravariant { constructor() { super((f, pred) => a => pred(f(a)), 'function', Contravariant.types, 'predicate'); } }
    (new PredicateContravariant());
    Contravariant.resolver = key => Contravariant.types[key];
    Contravariant.of = key => {
        const contravariant = Contravariant.resolver(key);
        !contravariant && raise(new TypeError(`Contravariant.of: unsupported key ${key}`));
        return {
            contramap: (f, g) => isSameType(f, g, 'function')
                ? contravariant.contramap(f, g)
                : raise(new TypeError(`Contravariant.contramap: both arguments must be functions`))
        };
    };
    const isPascalCase = ([k]) => k[0] === k[0].toUpperCase();
    return {
        Algebra,
        Setoid, ...Object.fromEntries(Object.entries(Setoid.types).filter(isPascalCase)),
        Ord, ...Object.fromEntries(Object.entries(Ord.types).filter(isPascalCase)),
        Semigroup, ...Object.fromEntries(Object.entries(Semigroup.types).filter(isPascalCase)),
        Monoid, ...Object.fromEntries(Object.entries(Monoid.types).filter(isPascalCase)),
        Group, ...Object.fromEntries(Object.entries(Group.types).filter(isPascalCase)),
        Semigroupoid, ...Object.fromEntries(Object.entries(Semigroupoid.types).filter(isPascalCase)),
        Category, ...Object.fromEntries(Object.entries(Category.types).filter(isPascalCase)),
        Filterable, ...Object.fromEntries(Object.entries(Filterable.types).filter(isPascalCase)),
        Functor, ...Object.fromEntries(Object.entries(Functor.types).filter(isPascalCase)),
        Bifunctor, ...Object.fromEntries(Object.entries(Bifunctor.types).filter(isPascalCase)),
        Contravariant, ...Object.fromEntries(Object.entries(Contravariant.types).filter(isPascalCase)),
    };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = $core;