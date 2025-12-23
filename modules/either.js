const $either = (dependencies = {}) => {
    const { assertFunction, hasFunctions, raise, runCatch, compose,
        predicate, identity, useArrayOrLift, Types,
    } = dependencies.$func;
    class Left {
        [Symbol.toStringTag] = 'Left';
        [Types.Functor] = true;
        [Types.Applicative] = true;
        [Types.Monad] = true;
        constructor(value) {
            this.value = value;
        }
        map() { return this; }
        mapLeft(f) { return compose(left, runCatch(f, identity))(this.value); }
        flatMap() { return this; }
        filter() { return this; }
        fold(onLeft, _) {
            assertFunction('fold', 'a function', onLeft);
            return onLeft(this.value);
        }
        ap(v) {
            return (v instanceof Left && hasConcat(this.value) && hasConcat(v.value)) ? left(this.value.concat(v.value)) : this;
        }
        getOrElse(v) { return v; }
        isLeft() { return true; }
        isRight() { return false; }
        tapLeft(f) {
            runCatch(f)(this.value);
            return this;
        }
    }
    class Right {
        [Symbol.toStringTag] = 'Right';
        [Types.Functor] = true;
        [Types.Applicative] = true;
        [Types.Monad] = true;
        constructor(value) {
            this.value = value;
        }
        map(f) { return attempt(f)(this.value); }
        mapLeft() { return this; }
        flatMap(f) { return runCatch(compose(checkEither, f), left)(this.value); }
        filter(f, onError = () => 'filter: predicate failed') { return predicate(f)(this.value) ? this : runCatch(compose(left, onError), left)(this.value); }
        fold(_, onRight) {
            assertFunction('fold', 'a function', onRight);
            return onRight(this.value);
        }
        /**
         * Apply the function wrapped in Right to another Either.
         * Throws TypeError if this.value is not a function (Developer Error).
         */
        ap(v) {
            if (v instanceof Left) return v;
            if (v instanceof Right) return attempt(this.value)(v.value);
            else return attempt(this.value)(v);
        }
        getOrElse(_) { return this.value; }
        isLeft() { return false; }
        isRight() { return true; }
        tapLeft(_) { return this; }
    }
    const hasConcat = hasFunctions([obj => obj.concat]);
    const checkEither = v => (v instanceof Left || v instanceof Right)
        ? v : raise(new Error(`checkEither: expected Either, got ${typeof v}`));
    const left = e => new Left(useArrayOrLift(e).map(v =>
        v instanceof Error ? v : new Error(typeof v === 'string' ? v : 'Left Error', { cause: v })
    ));
    const right = x => new Right(x);
    const attempt = f => {
        assertFunction('attempt', 'a function', f);
        const tryRight = compose(right, f);
        return runCatch(tryRight, left);
    };
    const _from = (checkNull, name = 'from') => x => {
        if (checkNull && (x === null || x === undefined)) return left(new Error(`${name}: expected a value, got ${x}`));
        if (x instanceof Left || x instanceof Right) return x;
        return right(x);
    };
    const from = _from(false);
    const fromNullable = _from(true, 'fromNullable');
    const validate = (condition, onError) => {
        assertFunction('validate', 'condition to be a function', condition);
        assertFunction('validate', 'onError to be a function', onError);
        return x => predicate(condition)(x) ? right(x) : runCatch(compose(left, onError), left)(x);
    };
    const validateAll = list => useArrayOrLift(list).reduce((acc, x) => {
        if (x instanceof Left || x instanceof Right) {
            return right(a => b => [...a, b]).ap(acc).ap(x);
        }
        return raise(new Error(`validateAll: expected Either, got ${typeof x}`));
    }, right([]));
    const sequence = list => {
        let acc = [];
        for (const x of useArrayOrLift(list)) {
            if (x instanceof Right) {
                acc.push(x.value);
            } else if (x instanceof Left) {
                return x;
            } else {
                return raise(new Error(`sequence: expected Either, got ${typeof x}`));
            }
        }
        return right(acc);
    };
    const pipeK = (...fs) => {
        if (fs.length === 0) return from;
        assertFunction('pipeK', 'all arguments to be functions', ...fs);
        return x => fs.reduce((acc, f) => acc.flatMap(f), from(x));
    };
    const traverse = f => {
        assertFunction('traverse', 'a function', f);
        return list => sequence(useArrayOrLift(list).map(f));
    };
    const traverseAll = f => {
        assertFunction('traverseAll', 'a function', f);
        return list => validateAll(useArrayOrLift(list).map(f));
    };
    return {
        left,
        right,
        attempt,
        from,
        fromNullable,
        validate,
        validateAll,
        sequence,
        pipeK,
        traverse,
        traverseAll,
    };
};
if (typeof module !== 'undefined' && module.exports) module.exports = $either;