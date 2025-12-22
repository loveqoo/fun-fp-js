const $monoid = (dependencies = {}) => {
    const { isFunction, isPlainObject, compose, identity, useArrayOrLift, range } = dependencies.$func;
    const { left, right, attempt } = dependencies.$either;
    const monoid = (check, concat, empty) => ({ check, concat, empty });
    const group = (check, concat, empty, invert) => ({ check, concat, empty, invert });
    const of = {
        number: {
            sum: group(a => typeof a === 'number', (a, b) => a + b, 0, a => -a),
            product: group(a => typeof a === 'number', (a, b) => a * b, 1, a => 1 / a),
            max: monoid(a => typeof a === 'number', (a, b) => Math.max(a, b), -Infinity),
            min: monoid(a => typeof a === 'number', (a, b) => Math.min(a, b), Infinity),
        },
        string: {
            concat: monoid(a => typeof a === 'string', (a, b) => a + b, ""),
        },
        boolean: {
            any: monoid(a => typeof a === 'boolean', (a, b) => a || b, false),
            all: monoid(a => typeof a === 'boolean', (a, b) => a && b, true),
            xor: group(a => typeof a === 'boolean', (a, b) => a !== b, false, a => a),
        },
        array: {
            concat: monoid(a => Array.isArray(a), (a, b) => a.concat(b), []),
        },
        object: {
            merge: monoid(isPlainObject, (a, b) => ({ ...a, ...b }), {}),
        },
        function: {
            endo: monoid(isFunction, compose, identity),
        },
        any: {
            first: monoid(_ => true, (a, _) => a, null),
            last: monoid(_ => true, (_, b) => b, null),
        },
    };
    const isMonoid = obj => obj && isFunction(obj.check) && isFunction(obj.concat) && 'empty' in obj;
    const fold = (M, f = identity) => {
        if (!isMonoid(M)) {
            return () => left(new TypeError('fold: expected a monoid'));
        }
        return list => {
            const arr = useArrayOrLift(list).map(f);
            if (arr.length === 0) return right(M.empty);
            if (!arr.every(M.check)) return left(new TypeError('fold: expected an array of values of the same type'));
            return attempt(() => arr.reduce(M.concat, M.empty))();
        };
    };
    const concat = M => {
        if (!isMonoid(M)) {
            return () => left(new TypeError('concat: expected a monoid'));
        }
        return (a, b) => {
            if (!M.check(a) || !M.check(b)) {
                return left(new TypeError('concat: expected values of the same type'));
            }
            return attempt(() => M.concat(a, b))();
        };
    };
    const invert = M => {
        if (!isMonoid(M)) {
            return () => left(new TypeError('invert: expected a monoid'));
        }
        if (!('invert' in M)) {
            return () => left(new TypeError('invert: expected a monoid with an invert function'));
        }
        return value => {
            if (!M.check(value)) return left(new TypeError('invert: expected a value of the same type'));
            return attempt(() => M.invert(value))();
        };
    };
    const power = M => {
        if (!isMonoid(M)) {
            return () => left(new TypeError('power: expected a monoid'));
        }
        return (value, nth) => {
            if (!M.check(value)) return left(new TypeError('power: expected a value of the same type'));
            if (typeof nth !== 'number') return left(new TypeError('power: expected a number'));
            if (nth < 0) return left(new TypeError('power: expected a non-negative number'));
            if (nth === 0) return right(M.empty);
            return attempt(() => range(nth).reduce(acc => M.concat(acc, value), M.empty))();
        };
    };
    return {
        ...of,
        isMonoid,
        fold,
        concat,
        invert,
        power,
    };
};
if (typeof module !== 'undefined' && module.exports) module.exports = $monoid;