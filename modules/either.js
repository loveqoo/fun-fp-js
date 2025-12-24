const $either = (dependencies = {}) => {
    const { fp } = dependencies.$func;
    class Left {
        constructor(value) {
            this.value = value;
            this[Symbol.toStringTag] = 'Left';
            this[fp.Types.Functor] = true;
            this[fp.Types.Applicative] = true;
            this[fp.Types.Monad] = true;
        }
        map() { return this; }
        mapLeft(f) { return fp.compose(left, fp.catch(f, fp.identity))(this.value); }
        flatMap() { return this; }
        filter() { return this; }
        fold(onLeft, _) {
            fp.assertFunction('fold', 'a function', onLeft);
            return onLeft(this.value);
        }
        ap(v) {
            return (v instanceof Left && hasConcat(this.value) && hasConcat(v.value)) ? left(this.value.concat(v.value)) : this;
        }
        getOrElse(v) { return v; }
        isLeft() { return true; }
        isRight() { return false; }
        tapLeft(f) {
            fp.catch(f)(this.value);
            return this;
        }
    }
    class Right {
        constructor(value) {
            this.value = value;
            this[Symbol.toStringTag] = 'Right';
            this[fp.Types.Functor] = true;
            this[fp.Types.Applicative] = true;
            this[fp.Types.Monad] = true;
        }
        map(f) { return eitherCatch(f)(this.value); }
        mapLeft() { return this; }
        flatMap(f) { return fp.catch(fp.compose(checkEither, f), left)(this.value); }
        filter(f, onError = () => 'filter: fp.predicate failed') { return fp.predicate(f)(this.value) ? this : fp.catch(fp.compose(left, onError), left)(this.value); }
        fold(_, onRight) {
            fp.assertFunction('fold', 'a function', onRight);
            return onRight(this.value);
        }
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
    const hasConcat = fp.hasFunctions([obj => obj.concat]);
    const checkEither = v => (v instanceof Left || v instanceof Right)
        ? v : fp.raise(new Error(`checkEither: expected Either, got ${typeof v}`));
    const left = e => new Left(fp.useArrayOrLift(e).map(v =>
        v instanceof Error ? v : new Error(typeof v === 'string' ? v : 'Left Error', { cause: v })
    ));
    const right = x => new Right(x);
    const eitherCatch = (f, lift = right) => {
        fp.assertFunction('eitherCatch', 'a function', f);
        const tryRight = fp.compose(lift, f);
        return fp.catch(tryRight, left);
    };
    const _from = (checkNull, name = 'from') => x => {
        if (checkNull && (x === null || x === undefined)) return left(new Error(`${name}: expected a value, got ${x}`));
        if (x instanceof Left || x instanceof Right) return x;
        return right(x);
    };
    const from = _from(false);
    const fromNullable = _from(true, 'fromNullable');
    const validate = (condition, onError) => {
        fp.assertFunction('validate', 'condition to be a function', condition);
        fp.assertFunction('validate', 'onError to be a function', onError);
        return x => fp.predicate(condition)(x) ? right(x) : fp.catch(fp.compose(left, onError), left)(x);
    };
    const validateAll = list => fp.useArrayOrLift(list).reduce((acc, x) => {
        if (x instanceof Left || x instanceof Right) {
            return right(a => b => [...a, b]).ap(acc).ap(x);
        }
        return fp.raise(new Error(`validateAll: expected Either, got ${typeof x}`));
    }, right([]));
    const sequence = list => {
        let acc = [];
        for (const x of fp.useArrayOrLift(list)) {
            if (x instanceof Right) {
                acc.push(x.value);
            } else if (x instanceof Left) {
                return x;
            } else {
                return fp.raise(new Error(`sequence: expected Either, got ${typeof x}`));
            }
        }
        return right(acc);
    };
    const pipeK = (...fs) => {
        if (fs.length === 0) return from;
        fp.assertFunction('pipeK', 'all arguments to be functions', ...fs);
        return x => fs.reduce((acc, f) => acc.flatMap(f), from(x));
    };
    const traverse = f => {
        fp.assertFunction('traverse', 'a function', f);
        return list => sequence(fp.useArrayOrLift(list).map(f));
    };
    const traverseAll = f => {
        fp.assertFunction('traverseAll', 'a function', f);
        return list => validateAll(fp.useArrayOrLift(list).map(f));
    };
    return {
        either: {
            left, right, catch: eitherCatch, from, fromNullable,
            validate, validateAll, sequence, pipeK, traverse, traverseAll,
        },
    };
};
if (typeof module !== 'undefined' && module.exports) module.exports = $either;