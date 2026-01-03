const $core = (() => {
    const typeOf = a => {
        if (a === null) { return 'null'; }
        const typeName = typeof a;
        if (typeName !== 'object') { return typeName; }
        if (Array.isArray(a)) { return 'Array'; }
        return a.constructor && a.constructor.name || 'object';
    };
    const raise = e => { throw e; };
    const isSameType = (a, b) => typeOf(a) === typeOf(b);
    const register = (target, instance, ...aliases) => {
        target[instance.constructor.name] = instance;
        for (const alias of aliases) { target[alias.toLowerCase()] = instance; }
    };
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
    class ArraySemigroup extends Semigroup { constructor() { super((x, y) => x.concat(y), 'Array', Semigroup.types, 'array'); } }
    class FirstSemigroup extends Semigroup { constructor() { super((x, y) => x, 'any', Semigroup.types, 'first'); } }
    class LastSemigroup extends Semigroup { constructor() { super((x, y) => y, 'any', Semigroup.types, 'last'); } }
    (new NumberSumSemigroup(), new NumberProductSemigroup(), new NumberMaxSemigroup(), new NumberMinSemigroup(), new StringSemigroup(),
        new BooleanAllSemigroup(), new BooleanAnySemigroup(), new FirstSemigroup(), new LastSemigroup(), new ArraySemigroup());
    Semigroup.resolver = key => Semigroup.types[key];
    Semigroup.of = key => {
        const semigroup = Semigroup.resolver(key);
        !semigroup && raise(new TypeError(`Semigroup.of: unsupported key ${key}`));
        return { concat: (a, b) => isSameType(a, b) ? semigroup.concat(a, b) : raise(new TypeError(`Semigroup.concat: types of a and b must be the same`)) };
    };
    class Monoid extends Semigroup {
        constructor(concat, empty, type, registry, ...aliases) {
            super(concat, type), this.empty = empty, registry && register(registry, this, ...aliases);
        }
    }
    Monoid.types = {};
    class NumberSumMonoid extends Monoid { constructor() { super(Semigroup.types.NumberSumSemigroup.concat, () => 0, 'number', Monoid.types, 'number'); } }
    class NumberProductMonoid extends Monoid { constructor() { super(Semigroup.types.NumberProductSemigroup.concat, () => 1, 'number', Monoid.types); } }
    class NumberMaxMonoid extends Monoid { constructor() { super(Semigroup.types.NumberMaxSemigroup.concat, () => -Infinity, 'number', Monoid.types); } }
    class NumberMinMonoid extends Monoid { constructor() { super(Semigroup.types.NumberMinSemigroup.concat, () => Infinity, 'number', Monoid.types); } }
    class StringMonoid extends Monoid { constructor() { super(Semigroup.types.StringSemigroup.concat, () => '', 'string', Monoid.types, 'string'); } }
    class BooleanAllMonoid extends Monoid { constructor() { super(Semigroup.types.BooleanAllSemigroup.concat, () => true, 'boolean', Monoid.types, 'boolean'); } }
    class BooleanAnyMonoid extends Monoid { constructor() { super(Semigroup.types.BooleanAnySemigroup.concat, () => false, 'boolean', Monoid.types); } }
    class FirstMonoid extends Monoid { constructor() { super(Semigroup.types.FirstSemigroup.concat, () => null, 'any', Monoid.types, 'first'); } }
    class LastMonoid extends Monoid { constructor() { super(Semigroup.types.LastSemigroup.concat, () => null, 'any', Monoid.types, 'last'); } }
    class ArrayMonoid extends Monoid { constructor() { super(Semigroup.types.ArraySemigroup.concat, () => [], 'Array', Monoid.types, 'array'); } }
    (new NumberSumMonoid(), new NumberProductMonoid(), new NumberMaxMonoid(), new NumberMinMonoid(), new StringMonoid(), new BooleanAllMonoid(), new BooleanAnyMonoid(), new FirstMonoid(), new LastMonoid(), new ArrayMonoid());
    Monoid.resolver = key => Monoid.types[key];
    Monoid.of = key => {
        const monoid = Monoid.resolver(key);
        !monoid && raise(new TypeError(`Monoid.of: unsupported key ${key}`));
        return {
            concat: (a, b) => isSameType(a, b) ? monoid.concat(a, b) : raise(new TypeError(`Monoid.concat: types of a and b must be the same`)),
            empty: monoid.empty
        };
    };
    const isPascalCase = ([k]) => k[0] === k[0].toUpperCase();
    return {
        Algebra,
        Setoid,
        ...Object.fromEntries(Object.entries(Setoid.types).filter(isPascalCase)),
        Ord,
        ...Object.fromEntries(Object.entries(Ord.types).filter(isPascalCase)),
        Semigroup,
        ...Object.fromEntries(Object.entries(Semigroup.types).filter(isPascalCase)),
        Monoid,
        ...Object.fromEntries(Object.entries(Monoid.types).filter(isPascalCase)),
    };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = $core;