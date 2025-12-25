const $either = (dependencies = {}) => {
    const { core } = dependencies.$core;
    const assertFunctions = {
        'fold': core.assertFunction('fold', 'a function'),
        'eitherCatch': core.assertFunction('eitherCatch', 'a function'),
        'validate0': core.assertFunction('validate', 'condition to be a function'),
        'validate1': core.assertFunction('onError to be a function'),
        'pipeK': core.assertFunction('pipeK', 'all arguments to be functions'),
        'traverse': core.assertFunction('traverse', 'a function'),
        'traverseAll': core.assertFunction('traverseAll', 'a function'),
    };
    class Left {
        constructor(value) {
            this.value = value;
            this[Symbol.toStringTag] = 'Left';
            this[core.Types.Functor] = true;
            this[core.Types.Applicative] = true;
            this[core.Types.Monad] = true;
        }
        map() { return this; }
        mapLeft(f) { return core.compose(left, core.catch(f, core.identity))(this.value); }
        flatMap() { return this; }
        filter() { return this; }
        fold(onLeft, _) { return assertFunctions['fold'](onLeft)[0](this.value); }
        ap(v) { return (v instanceof Left && hasConcat(this.value) && hasConcat(v.value)) ? left(this.value.concat(v.value)) : this; }
        getOrElse(v) { return v; }
        isLeft() { return true; }
        isRight() { return false; }
        tapLeft(f) { core.catch(f)(this.value); return this; }
    }
    class Right {
        constructor(value) {
            this.value = value;
            this[Symbol.toStringTag] = 'Right';
            this[core.Types.Functor] = true;
            this[core.Types.Applicative] = true;
            this[core.Types.Monad] = true;
        }
        map(f) { return eitherCatch(f)(this.value); }
        mapLeft() { return this; }
        flatMap(f) { return core.catch(core.compose(checkEither, f), left)(this.value); }
        filter(f, onError = () => 'filter: core.predicate failed') { return core.predicate(f)(this.value) ? this : core.catch(core.compose(left, onError), left)(this.value); }
        fold(_, onRight) { return assertFunctions['fold'](onRight)[0](this.value); }
        /**
         * Apply the function wrapped in Right to another Either.
         * Throws TypeError if this.value is not a function (Developer Error).
         */
        ap(v) {
            if (v instanceof Left) return v;
            if (v instanceof Right) return eitherCatch(this.value)(v.value);
            else return eitherCatch(this.value)(v);
        }
        getOrElse(_) { return this.value; }
        isLeft() { return false; }
        isRight() { return true; }
        tapLeft(_) { return this; }
    }
    const hasConcat = core.hasFunctions([obj => obj.concat]);
    const checkEither = v => (v instanceof Left || v instanceof Right)
        ? v : core.raise(new Error(`checkEither: expected Either, got ${typeof v}`));
    const left = e => new Left(core.useArrayOrLift(e).map(v =>
        v instanceof Error ? v : new Error(typeof v === 'string' ? v : 'Left Error', { cause: v })
    ));
    const right = x => new Right(x);
    const eitherCatch = (f, lift = right) => core.catch(core.compose(lift, assertFunctions['eitherCatch'](f)[0]), left);
    const _from = (checkNull, name = 'from') => x => {
        if (checkNull && (x === null || x === undefined)) return left(new Error(`${name}: expected a value, got ${x}`));
        if (x instanceof Left || x instanceof Right) return x;
        return right(x);
    };
    const from = _from(false);
    const fromNullable = _from(true, 'fromNullable');
    const validate = (condition, onError) => {
        assertFunctions['validate0'](condition);
        assertFunctions['validate1'](onError);
        return x => core.predicate(condition)(x) ? right(x) : core.catch(core.compose(left, onError), left)(x);
    };
    const validateAll = list => core.useArrayOrLift(list).reduce((acc, x) => {
        if (x instanceof Left || x instanceof Right) {
            return right(a => b => [...a, b]).ap(acc).ap(x);
        }
        return core.raise(new Error(`validateAll: expected Either, got ${typeof x}`));
    }, right([]));
    const sequence = list => {
        let acc = [];
        for (const x of core.useArrayOrLift(list)) {
            if (x instanceof Right) {
                acc.push(x.value);
            } else if (x instanceof Left) {
                return x;
            } else {
                return core.raise(new Error(`sequence: expected Either, got ${typeof x}`));
            }
        }
        return right(acc);
    };
    const pipeK = (...fs) => {
        if (fs.length === 0) return from;
        assertFunctions['pipeK'](...fs);
        return (x, lift = from) => fs.reduce((acc, f) => acc.flatMap(f), lift(x));
    };
    const traverse = f => {
        assertFunctions['traverse'](f);
        return list => sequence(core.useArrayOrLift(list).map(f));
    };
    const traverseAll = f => {
        assertFunctions['traverseAll'](f);
        return list => validateAll(core.useArrayOrLift(list).map(f));
    };
    return {
        either: {
            left, right, catch: eitherCatch, from, fromNullable,
            validate, validateAll, sequence, pipeK, traverse, traverseAll,
        },
    };
};
if (typeof module !== 'undefined' && module.exports) module.exports = $either;