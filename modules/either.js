const $either = (dependencies = {}) => {
    const { core } = dependencies.$core;
    const assertFunctions = {
        'either_fold': core.assertFunction('Either.fold', 'a function'),
        'either_catch': core.assertFunction('either.catch', 'a function'),
        'either_validate_condition': core.assertFunction('either.validate', 'condition to be a function'),
        'either_validate_on_error': core.assertFunction('either.validate', 'onError to be a function'),
        'either_pipe_k': core.assertFunction('either.pipeK', 'all arguments to be functions'),
        'either_traverse': core.assertFunction('either.traverse', 'a function'),
        'either_traverse_all': core.assertFunction('either.traverseAll', 'a function'),
    };
    const hasConcat = core.hasFunctions([obj => obj.concat]);
    const normalizeToError = e => e instanceof Error ? e : new Error(typeof e === 'string' ? e : 'Left Error', { cause: e });
    const toEitherErrorArray = e => core.useArrayOrLift(e).map(normalizeToError);
    class Either {
        static of(x) { return new Right(x); }
        static right(x) { return new Right(x); }
        static left(e) { return new Left(toEitherErrorArray(e)); }
        static from(x) {
            if (x instanceof Left || x instanceof Right) return x;
            return Either.right(x);
        }
        static fromNullable(x) {
            if (x === null || x === undefined) {
                return Either.left(new Error(`fromNullable: expected a value, got ${x}`));
            }
            if (x instanceof Left || x instanceof Right) return x;
            return Either.right(x);
        }
        static catch(f, lift = Either.right) {
            assertFunctions['either_catch'](f);
            return core.catch(core.compose(lift, f), Either.left);
        }
        static validate(condition, onError) {
            assertFunctions['either_validate_condition'](condition);
            assertFunctions['either_validate_on_error'](onError);
            return x => core.predicate(condition)(x)
                ? Either.right(x)
                : core.catch(core.compose(Either.left, onError), Either.left)(x);
        }
        static validateAll(list) {
            return core.useArrayOrLift(list).reduce((acc, x) => {
                Either.checkEither(x);
                return Either.right(a => b => [...a, b]).ap(acc).ap(x);
            }, Either.right([]));
        }
        static sequence(list) {
            let acc = [];
            for (const x of core.useArrayOrLift(list)) {
                Either.checkEither(x);
                if (x instanceof Right) {
                    acc.push(x.value);
                } else {
                    return x;
                }
            }
            return Either.right(acc);
        }
        static pipeK(...fs) {
            if (fs.length === 0) return Either.from;
            assertFunctions['either_pipe_k'](...fs);
            return (x, lift = Either.from) => fs.reduce((acc, f) => acc.flatMap(f), lift(x));
        }
        static traverse(f) {
            assertFunctions['either_traverse'](f);
            return list => Either.sequence(core.useArrayOrLift(list).map(f));
        }
        static traverseAll(f) {
            assertFunctions['either_traverse_all'](f);
            return list => Either.validateAll(core.useArrayOrLift(list).map(f));
        }
        static checkEither(v) {
            return (v instanceof Left || v instanceof Right)
                ? v
                : core.raise(new Error(`checkEither: expected Either, got ${typeof v}`));
        }
    }

    class Left extends Either {
        constructor(value) {
            super();
            this.value = value;
            this[Symbol.toStringTag] = 'Left';
            this[core.Types.Functor] = true;
            this[core.Types.Applicative] = true;
            this[core.Types.Monad] = true;
        }
        map() { return this; }
        mapLeft(f) { return core.compose(Either.left, core.catch(f, core.identity))(this.value); }
        flatMap() { return this; }
        filter() { return this; }
        fold(onLeft, _) { return assertFunctions['either_fold'](onLeft)[0](this.value); }
        ap(v) { return (v instanceof Left && hasConcat(this.value) && hasConcat(v.value)) ? Either.left(this.value.concat(v.value)) : this; }
        getOrElse(v) { return v; }
        isLeft() { return true; }
        isRight() { return false; }
        tapLeft(f) { core.catch(f)(this.value); return this; }
    }

    class Right extends Either {
        constructor(value) {
            super();
            this.value = value;
            this[Symbol.toStringTag] = 'Right';
            this[core.Types.Functor] = true;
            this[core.Types.Applicative] = true;
            this[core.Types.Monad] = true;
        }
        map(f) { return Either.catch(f)(this.value); }
        mapLeft() { return this; }
        flatMap(f) { return core.catch(core.compose(Either.checkEither, f), Either.left)(this.value); }
        filter(f, onError = () => 'filter: core.predicate failed') { return core.predicate(f)(this.value) ? this : core.catch(core.compose(Either.left, onError), Either.left)(this.value); }
        fold(_, onRight) { return assertFunctions['either_fold'](onRight)[0](this.value); }
        /**
         * Apply the function wrapped in Right to another Either.
         * Throws TypeError if this.value is not a function (Developer Error).
         */
        ap(v) {
            if (v instanceof Left) return v;
            if (v instanceof Right) return Either.catch(this.value)(v.value);
            else return Either.catch(this.value)(v);
        }
        getOrElse(_) { return this.value; }
        isLeft() { return false; }
        isRight() { return true; }
        tapLeft(_) { return this; }
    }
    return {
        either: {
            Either, left: Either.left, right: Either.right, of: Either.of,
            catch: Either.catch, from: Either.from, fromNullable: Either.fromNullable,
            validate: Either.validate, validateAll: Either.validateAll, sequence: Either.sequence,
            pipeK: Either.pipeK, traverse: Either.traverse, traverseAll: Either.traverseAll,
            checkEither: Either.checkEither,
        },
    };
};
if (typeof module !== 'undefined' && module.exports) module.exports = $either;