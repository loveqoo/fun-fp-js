const $monoid = (dependencies = {}) => {
    const { core } = dependencies.$core;
    const { either } = dependencies.$either;
    // @build-start
    class Monoid {
        constructor(check, concatFn, empty) {
            this.check = check;
            this._concat = concatFn;
            this.empty = empty;
        }
        fold(list, f = core.identity) {
            const arr = core.useArrayOrLift(list).map(f);
            if (arr.length === 0) return either.right(this.empty);
            if (!arr.every(this.check)) {
                return either.left(new TypeError('fold: expected an array of values of the same type'));
            }
            return either.catch(() => arr.reduce(this._concat, this.empty))();
        }
        concat(a, b) {
            if (!this.check(a) || !this.check(b)) {
                return either.left(new TypeError('concat: expected values of the same type'));
            }
            return either.catch(() => this._concat(a, b))();
        }
        power(value, nth) {
            if (!this.check(value)) {
                return either.left(new TypeError('power: expected a value of the same type'));
            }
            if (typeof nth !== 'number') {
                return either.left(new TypeError('power: expected a number'));
            }
            if (nth < 0) {
                return either.left(new TypeError('power: expected a non-negative number'));
            }
            if (nth === 0) return either.right(this.empty);
            return either.catch(() => core.range(nth).reduce(acc => this._concat(acc, value), this.empty))();
        }
        static isMonoid(obj) { return obj instanceof Monoid; }
        static fold(M, f = core.identity) {
            if (!Monoid.isMonoid(M)) {
                return () => either.left(new TypeError('fold: expected a monoid'));
            }
            return list => M.fold(list, f);
        }
        static concat(M) {
            if (!Monoid.isMonoid(M)) {
                return () => either.left(new TypeError('concat: expected a monoid'));
            }
            return (a, b) => M.concat(a, b);
        }
        static power(M) {
            if (!Monoid.isMonoid(M)) {
                return () => either.left(new TypeError('power: expected a monoid'));
            }
            return (value, nth) => M.power(value, nth);
        }
    }
    class Group extends Monoid {
        constructor(check, concatFn, empty, invertFn) {
            super(check, concatFn, empty);
            this._invert = invertFn;
        }
        invert(value) {
            if (!this.check(value)) {
                return either.left(new TypeError('invert: expected a value of the same type'));
            }
            return either.catch(() => this._invert(value))();
        }
        static isGroup(obj) { return obj instanceof Group; }
        static invert(M) {
            if (!Monoid.isMonoid(M)) {
                return () => either.left(new TypeError('invert: expected a monoid'));
            }
            if (!Group.isGroup(M)) {
                return () => either.left(new TypeError('invert: expected a monoid with an invert function'));
            }
            return value => M.invert(value);
        }
    }
    const of = {
        number: {
            sum: new Group(a => typeof a === 'number', (a, b) => a + b, 0, a => -a),
            product: new Group(a => typeof a === 'number', (a, b) => a * b, 1, a => 1 / a),
            max: new Monoid(a => typeof a === 'number', (a, b) => Math.max(a, b), -Infinity),
            min: new Monoid(a => typeof a === 'number', (a, b) => Math.min(a, b), Infinity),
        },
        string: {
            concat: new Monoid(a => typeof a === 'string', (a, b) => a + b, ""),
        },
        boolean: {
            any: new Monoid(a => typeof a === 'boolean', (a, b) => a || b, false),
            all: new Monoid(a => typeof a === 'boolean', (a, b) => a && b, true),
            xor: new Group(a => typeof a === 'boolean', (a, b) => a !== b, false, a => a),
        },
        array: {
            concat: new Monoid(a => Array.isArray(a), (a, b) => a.concat(b), []),
        },
        set: {
            union: new Monoid(a => a instanceof Set, (a, b) => new Set([...a, ...b]), new Set()),
        },
        object: {
            merge: new Monoid(core.isPlainObject, (a, b) => ({ ...a, ...b }), {}),
        },
        function: {
            endo: new Monoid(core.isFunction, core.compose2, core.identity),
        },
        any: {
            first: new Monoid(_ => true, (a, b) => a === null ? b : a, null),
            last: new Monoid(_ => true, (_, b) => b, null),
        },
    };

    return {
        monoid: {
            Monoid, Group, ...of, isMonoid: Monoid.isMonoid, isGroup: Group.isGroup,
            fold: Monoid.fold, concat: Monoid.concat, power: Monoid.power, invert: Group.invert,
        },
    };
};
if (typeof module !== 'undefined' && module.exports) module.exports = $monoid;