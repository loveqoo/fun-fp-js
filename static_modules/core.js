const $core = (() => {
    const typeOf = a => {
        switch (typeof a) {
            case 'undefined': return 'undefined';
            case 'boolean': return 'boolean';
            case 'number': return 'number';
            case 'string': return 'string';
            case 'symbol': return 'symbol';
            case 'function': return 'function';
            case 'object': return a === null ? 'null' : ((a.constructor && a.constructor.name) || 'object')
            default: return 'unknown';
        }
    };
    const raise = e => { throw e; };
    const isSameType = (a, b) => typeOf(a) === typeOf(b);
    class Algebra { }
    Algebra.typeOf = typeOf;
    Algebra.raise = raise;
    Algebra.isSameType = isSameType;
    class Setoid extends Algebra { constructor(equals, type) { super(), this.equals = equals, this.type = type; } }
    Setoid.op = (a, b) => a === b;
    class NumberSetoid extends Setoid { constructor() { super((x, y) => Setoid.op(x, y), 'number'); } }
    class StringSetoid extends Setoid { constructor() { super((x, y) => Setoid.op(x, y), 'string'); } }
    class BooleanSetoid extends Setoid { constructor() { super((x, y) => Setoid.op(x, y), 'boolean'); } }
    class DateSetoid extends Setoid { constructor() { super((x, y) => Setoid.op(x.getTime(), y.getTime()), 'Date'); } }
    Setoid.types = {
        number: new NumberSetoid(),
        string: new StringSetoid(),
        boolean: new BooleanSetoid(),
        date: new DateSetoid(),
    };
    Setoid.equals = (a, b, typeName = typeOf(a)) => {
        return isSameType(a, b) ? (Setoid.types[typeName] ? Setoid.types[typeName].equals(a, b) : Setoid.op(a, b)) : false;
    };
    class Ord extends Algebra { constructor(lte, type) { super(), this.lte = lte, this.type = type; } }
    Ord.op = (a, b) => a <= b;
    class NumberOrd extends Ord { constructor() { super((x, y) => Ord.op(x, y), 'number'); } }
    class StringOrd extends Ord { constructor() { super((x, y) => Ord.op(x, y), 'string'); } }
    class StringLengthOrd extends Ord { constructor() { super((x, y) => Ord.op(x.length, y.length), 'string'); } }
    class StringLocaleOrd extends Ord { constructor() { super((x, y) => Ord.op(x.localeCompare(y), 0), 'string'); } }
    Ord.types = {
        number: new NumberOrd(),
        string: new StringOrd(),
        stringLength: new StringLengthOrd(),
        stringLocale: new StringLocaleOrd(),
    };
    Ord.lte = (a, b, typeName = typeOf(a)) => {
        return isSameType(a, b) ? (Ord.types[typeName] ? Ord.types[typeName].lte(a, b) : Ord.op(a, b)) : false;
    };
    class Semigroup extends Algebra { constructor(concat, type) { super(), this.concat = concat, this.type = type; } }
    class NumberSumSemigroup extends Semigroup { constructor() { super((x, y) => x + y, 'number'); } }
    class NumberProductSemigroup extends Semigroup { constructor() { super((x, y) => x * y, 'number'); } }
    class NumberMaxSemigroup extends Semigroup { constructor() { super((x, y) => Math.max(x, y), 'number'); } }
    class NumberMinSemigroup extends Semigroup { constructor() { super((x, y) => Math.min(x, y), 'number'); } }
    class StringSemigroup extends Semigroup { constructor() { super((x, y) => x + y, 'string'); } }
    class BooleanAllSemigroup extends Semigroup { constructor() { super((x, y) => x && y, 'boolean'); } }
    class BooleanAnySemigroup extends Semigroup { constructor() { super((x, y) => x || y, 'boolean'); } }
    Semigroup.types = {
        number: new NumberSumSemigroup(),
        string: new StringSemigroup(),
        boolean: new BooleanAllSemigroup(),
        numberProduct: new NumberProductSemigroup(),
        numberMax: new NumberMaxSemigroup(),
        numberMin: new NumberMinSemigroup(),
        booleanAny: new BooleanAnySemigroup(),
    };
    Semigroup.types.numberSum = Semigroup.types.number;
    Semigroup.types.booleanAll = Semigroup.types.boolean;
    Semigroup.concat = (a, b, typeName = typeOf(a)) => {
        if (!isSameType(a, b) || !Semigroup.types[typeName]) {
            raise(new TypeError(`Semigroup.concat: unsupported type ${typeName}`));
        }
        return Semigroup.types[typeName].concat(a, b);
    };
    return {
        Algebra,
        Setoid,
        NumberSetoid: Setoid.types.number,
        StringSetoid: Setoid.types.string,
        BooleanSetoid: Setoid.types.boolean,
        Ord,
        NumberOrd: Ord.types.number,
        StringOrd: Ord.types.string,
        StringLengthOrd: Ord.types.stringLength,
        StringLocaleOrd: Ord.types.stringLocale,
        Semigroup,
        NumberSumSemigroup: Semigroup.types.numberSum,
        NumberProductSemigroup: Semigroup.types.numberProduct,
        NumberMaxSemigroup: Semigroup.types.numberMax,
        NumberMinSemigroup: Semigroup.types.numberMin,
        StringSemigroup: Semigroup.types.string,
        BooleanAllSemigroup: Semigroup.types.booleanAll,
        BooleanAnySemigroup: Semigroup.types.booleanAny,
    };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = $core;