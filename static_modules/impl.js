const {
    typeOf, raise, isSameType, register, compose, identity, es6,
    Algebra, Setoid, Ord, Semigroup, Monoid, Group, Semigroupoid, Category,
    Filterable, Functor, Bifunctor, Contravariant, Profunctor,
    Apply, Applicative, Alt, Plus, Alternative, Chain, ChainRec, Monad, Foldable,
    Extend, Comonad, Traversable
} = require('./spec.js');
const { Either, Left, Right, Maybe, Just, Nothing, Task } = require('./data.js');

Algebra.typeOf = typeOf, Algebra.raise = raise, Algebra.isSameType = isSameType, Algebra.register = register;
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

// Setoid
class NumberSetoid extends Setoid { constructor() { super(Setoid.op, 'number', Setoid.types, 'number'); } }
class StringSetoid extends Setoid { constructor() { super(Setoid.op, 'string', Setoid.types, 'string'); } }
class BooleanSetoid extends Setoid { constructor() { super(Setoid.op, 'boolean', Setoid.types, 'boolean'); } }
class DateSetoid extends Setoid { constructor() { super((x, y) => x.getTime() === y.getTime(), 'date', Setoid.types, 'date'); } }
(new NumberSetoid(), new StringSetoid(), new BooleanSetoid(), new DateSetoid());
// Ord
class NumberOrd extends Ord { constructor() { super(Ord.op, 'number', Ord.types, 'number'); } }
class StringOrd extends Ord { constructor() { super(Ord.op, 'string', Ord.types, 'string'); } }
class StringLengthOrd extends Ord { constructor() { super((x, y) => x.length <= y.length, 'string', Ord.types); } }
class StringLocaleOrd extends Ord { constructor() { super((x, y) => x.localeCompare(y) <= 0, 'string', Ord.types); } }
(new NumberOrd(), new StringOrd(), new StringLengthOrd(), new StringLocaleOrd());
// Semigroup
class NumberSumSemigroup extends Semigroup { constructor() { super((x, y) => x + y, 'number', Semigroup.types, 'number'); } }
class NumberProductSemigroup extends Semigroup { constructor() { super((x, y) => x * y, 'number', Semigroup.types); } }
class NumberMaxSemigroup extends Semigroup { constructor() { super(Math.max, 'number', Semigroup.types); } }
class NumberMinSemigroup extends Semigroup { constructor() { super(Math.min, 'number', Semigroup.types); } }
class StringSemigroup extends Semigroup { constructor() { super((x, y) => x + y, 'string', Semigroup.types, 'string'); } }
class BooleanAllSemigroup extends Semigroup { constructor() { super((x, y) => x && y, 'boolean', Semigroup.types, 'boolean'); } }
class BooleanAnySemigroup extends Semigroup { constructor() { super((x, y) => x || y, 'boolean', Semigroup.types); } }
class BooleanXorSemigroup extends Semigroup { constructor() { super((x, y) => x !== y, 'boolean', Semigroup.types); } }
class ArraySemigroup extends Semigroup { constructor() { super((x, y) => x.concat(y), 'Array', Semigroup.types, 'array'); } }
class FirstSemigroup extends Semigroup { constructor() { super(x => x, 'any', Semigroup.types, 'first'); } }
class LastSemigroup extends Semigroup { constructor() { super((x, y) => y, 'any', Semigroup.types, 'last'); } }
class FunctionSemigroup extends Semigroup { constructor() { super(compose, 'function', Semigroup.types, 'function'); } }
(new NumberSumSemigroup(), new NumberProductSemigroup(), new NumberMaxSemigroup(), new NumberMinSemigroup(), new StringSemigroup(),
    new BooleanAllSemigroup(), new BooleanAnySemigroup(), new BooleanXorSemigroup(), new FirstSemigroup(), new LastSemigroup(),
    new ArraySemigroup(), new FunctionSemigroup());
// Monoid
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
(new NumberSumMonoid(), new NumberProductMonoid(), new NumberMaxMonoid(), new NumberMinMonoid(), new StringMonoid(), new BooleanAllMonoid(),
    new BooleanAnyMonoid(), new BooleanXorMonoid(), new FirstMonoid(), new LastMonoid(), new ArrayMonoid(), new FunctionMonoid());
// Group
class NumberSumGroup extends Group { constructor() { super(Monoid.types.NumberSumMonoid, x => -x, 'number', Group.types, 'number'); } }
class NumberProductGroup extends Group { constructor() { super(Monoid.types.NumberProductMonoid, x => 1 / x, 'number', Group.types); } }
class BooleanXorGroup extends Group { constructor() { super(Monoid.types.BooleanXorMonoid, x => x, 'boolean', Group.types); } }
(new NumberSumGroup(), new NumberProductGroup(), new BooleanXorGroup());
// Semigroupoid
class FunctionSemigroupoid extends Semigroupoid { constructor() { super(compose, 'function', Semigroupoid.types, 'function'); } }
// Kleisli Semigroupoid: compose `a -> M b` functions using chain
class EitherSemigroupoid extends Semigroupoid {
    constructor() { super((f, g) => x => Chain.types.EitherChain.chain(f, g(x)), 'function', Semigroupoid.types, 'either'); }
}
class MaybeSemigroupoid extends Semigroupoid {
    constructor() { super((f, g) => x => Chain.types.MaybeChain.chain(f, g(x)), 'function', Semigroupoid.types, 'maybe'); }
}
class TaskSemigroupoid extends Semigroupoid {
    constructor() { super((f, g) => x => Chain.types.TaskChain.chain(f, g(x)), 'function', Semigroupoid.types, 'task'); }
}
(new FunctionSemigroupoid(), new EitherSemigroupoid(), new MaybeSemigroupoid(), new TaskSemigroupoid());
// Category
class FunctionCategory extends Category { constructor() { super(Semigroupoid.types.FunctionSemigroupoid, identity, 'function', Category.types, 'function'); } }
// Kleisli Category: identity is `x => M.of(x)`
class EitherCategory extends Category {
    constructor() { super(Semigroupoid.types.EitherSemigroupoid, Either.Right, 'function', Category.types, 'either'); }
}
class MaybeCategory extends Category {
    constructor() { super(Semigroupoid.types.MaybeSemigroupoid, Maybe.Just, 'function', Category.types, 'maybe'); }
}
class TaskCategory extends Category {
    constructor() { super(Semigroupoid.types.TaskSemigroupoid, Task.of, 'function', Category.types, 'task'); }
}
(new FunctionCategory(), new EitherCategory(), new MaybeCategory(), new TaskCategory());
// Filterable
class ArrayFilterable extends Filterable { constructor() { super((pred, arr) => arr.filter(pred), 'Array', Filterable.types, 'array'); } }
class ObjectFilterable extends Filterable { constructor() { super((pred, obj) => es6.object.filter(pred, obj), 'object', Filterable.types, 'object'); } }
(new ArrayFilterable(), new ObjectFilterable());
// Functor
class ArrayFunctor extends Functor { constructor() { super((f, arr) => arr.map(f), 'Array', Functor.types, 'array'); } }
class EitherFunctor extends Functor { constructor() { super((f, e) => e.isRight() ? Either.Right(f(e.value)) : e, 'Either', Functor.types, 'either'); } }
class MaybeFunctor extends Functor { constructor() { super((f, m) => m.isJust() ? Maybe.Just(f(m.value)) : m, 'Maybe', Functor.types, 'maybe'); } }
class TaskFunctor extends Functor {
    constructor() {
        super((f, task) => new Task((reject, resolve) => task.fork(reject, x => resolve(f(x)))), 'Task', Functor.types, 'task');
    }
}
(new ArrayFunctor(), new EitherFunctor(), new MaybeFunctor(), new TaskFunctor());
// Bifunctor
class TupleBifunctor extends Bifunctor { constructor() { super((f, g, [a, b]) => [f(a), g(b)], 'Array', Bifunctor.types, 'tuple'); } }
class EitherBifunctor extends Bifunctor {
    constructor() {
        super((f, g, e) => e.isLeft() ? Either.Left(f(e.value)) : Either.Right(g(e.value)), 'Either', Bifunctor.types, 'either');
    }
}
(new TupleBifunctor(), new EitherBifunctor());
// Contravariant
class PredicateContravariant extends Contravariant { constructor() { super((f, pred) => a => pred(f(a)), 'function', Contravariant.types, 'predicate'); } }
(new PredicateContravariant());
// Profunctor
class FunctionProfunctor extends Profunctor { constructor() { super((f, g, fn) => x => g(fn(f(x))), 'function', Profunctor.types, 'function'); } }
(new FunctionProfunctor());
// Apply
class ArrayApply extends Apply { constructor() { super(Functor.types.ArrayFunctor, (fs, values) => es6.array.flatMap(f => Functor.types.ArrayFunctor.map(f, values), fs), 'Array', Apply.types, 'array'); } }
class EitherApply extends Apply { constructor() { super(Functor.types.EitherFunctor, (ef, ex) => ef.isLeft() ? ef : ex.isLeft() ? ex : Either.Right(ef.value(ex.value)), 'Either', Apply.types, 'either'); } }
class MaybeApply extends Apply { constructor() { super(Functor.types.MaybeFunctor, (mf, mx) => mf.isNothing() ? mf : mx.isNothing() ? mx : Maybe.Just(mf.value(mx.value)), 'Maybe', Apply.types, 'maybe'); } }
class TaskApply extends Apply {
    constructor() {
        super(Functor.types.TaskFunctor, (taskFn, taskVal) => new Task((reject, resolve) => {
            let fn, val, fnDone = false, valDone = false, rejected = false;
            taskFn.fork(e => { rejected || (rejected = true, reject(e)); }, f => { fn = f; fnDone = true; fnDone && valDone && resolve(fn(val)); });
            taskVal.fork(e => { rejected || (rejected = true, reject(e)); }, v => { val = v; valDone = true; fnDone && valDone && resolve(fn(val)); });
        }), 'Task', Apply.types, 'task');
    }
}
(new ArrayApply(), new EitherApply(), new MaybeApply(), new TaskApply());
// Applicative
class ArrayApplicative extends Applicative { constructor() { super(Apply.types.ArrayApply, x => [x], 'Array', Applicative.types, 'array'); } }
class EitherApplicative extends Applicative { constructor() { super(Apply.types.EitherApply, Either.Right, 'Either', Applicative.types, 'either'); } }
class MaybeApplicative extends Applicative { constructor() { super(Apply.types.MaybeApply, Maybe.Just, 'Maybe', Applicative.types, 'maybe'); } }
class TaskApplicative extends Applicative { constructor() { super(Apply.types.TaskApply, Task.of, 'Task', Applicative.types, 'task'); } }
(new ArrayApplicative(), new EitherApplicative(), new MaybeApplicative(), new TaskApplicative());
// Alt
class ArrayAlt extends Alt { constructor() { super(Functor.types.ArrayFunctor, (a, b) => a.concat(b), 'Array', Alt.types, 'array'); } }
class EitherAlt extends Alt {
    constructor() { super(Functor.types.EitherFunctor, (a, b) => a.isLeft() ? b : a, 'Either', Alt.types, 'either'); }
}
class MaybeAlt extends Alt {
    constructor() { super(Functor.types.MaybeFunctor, (a, b) => a.isNothing() ? b : a, 'Maybe', Alt.types, 'maybe'); }
}
class TaskAlt extends Alt {
    constructor() {
        super(Functor.types.TaskFunctor, (a, b) => new Task((reject, resolve) => {
            a.fork(_ => b.fork(reject, resolve), resolve);
        }), 'Task', Alt.types, 'task');
    }
}
(new ArrayAlt(), new EitherAlt(), new MaybeAlt(), new TaskAlt());
// Plus
class ArrayPlus extends Plus { constructor() { super(Alt.types.ArrayAlt, () => [], 'Array', Plus.types, 'array'); } }
class MaybePlus extends Plus { constructor() { super(Alt.types.MaybeAlt, Maybe.Nothing, 'Maybe', Plus.types, 'maybe'); } }
(new ArrayPlus(), new MaybePlus());
// Alternative
class ArrayAlternative extends Alternative { constructor() { super(Applicative.types.ArrayApplicative, Plus.types.ArrayPlus, 'Array', Alternative.types, 'array'); } }
class MaybeAlternative extends Alternative { constructor() { super(Applicative.types.MaybeApplicative, Plus.types.MaybePlus, 'Maybe', Alternative.types, 'maybe'); } }
(new ArrayAlternative(), new MaybeAlternative());
// Chain
class ArrayChain extends Chain { constructor() { super(Apply.types.ArrayApply, es6.array.flatMap, 'Array', Chain.types, 'array'); } }
class EitherChain extends Chain { constructor() { super(Apply.types.EitherApply, (f, e) => e.isRight() ? f(e.value) : e, 'Either', Chain.types, 'either'); } }
class MaybeChain extends Chain { constructor() { super(Apply.types.MaybeApply, (f, m) => m.isJust() ? f(m.value) : m, 'Maybe', Chain.types, 'maybe'); } }
class TaskChain extends Chain {
    constructor() {
        super(Apply.types.TaskApply, (f, task) => new Task((reject, resolve) => task.fork(reject, x => f(x).fork(reject, resolve))), 'Task', Chain.types, 'task');
    }
}
(new ArrayChain(), new EitherChain(), new MaybeChain(), new TaskChain());
// ChainRec
class ArrayChainRec extends ChainRec {
    constructor() {
        super(Chain.types.ArrayChain, (f, i) => {
            const res = [];
            const queue = f(ChainRec.next, ChainRec.done, i);
            while (queue.length > 0) {
                const step = queue.shift();
                step.tag === 'next' ? queue.unshift(...f(ChainRec.next, ChainRec.done, step.value)) : res.push(step.value);
            }
            return res;
        }, 'Array', ChainRec.types, 'array');
    }
}
class EitherChainRec extends ChainRec {
    constructor() {
        super(Chain.types.EitherChain, (f, i) => {
            let result = f(ChainRec.next, ChainRec.done, i);
            while (result.isRight() && result.value.tag === 'next') {
                result = f(ChainRec.next, ChainRec.done, result.value.value);
            }
            return result.isLeft() ? result : Either.Right(result.value.value);
        }, 'Either', ChainRec.types, 'either');
    }
}
class MaybeChainRec extends ChainRec {
    constructor() {
        super(Chain.types.MaybeChain, (f, i) => {
            let result = f(ChainRec.next, ChainRec.done, i);
            while (result.isJust() && result.value.tag === 'next') {
                result = f(ChainRec.next, ChainRec.done, result.value.value);
            }
            return result.isNothing() ? result : Maybe.Just(result.value.value);
        }, 'Maybe', ChainRec.types, 'maybe');
    }
}
class TaskChainRec extends ChainRec {
    constructor() {
        super(Chain.types.TaskChain, (f, i) => new Task((reject, resolve) => {
            const loop = val => {
                f(ChainRec.next, ChainRec.done, val).fork(reject, step => {
                    step.tag === 'next' ? loop(step.value) : resolve(step.value);
                });
            };
            loop(i);
        }), 'Task', ChainRec.types, 'task');
    }
}
(new ArrayChainRec(), new EitherChainRec(), new MaybeChainRec(), new TaskChainRec());
// Monad
class ArrayMonad extends Monad { constructor() { super(Applicative.types.ArrayApplicative, Chain.types.ArrayChain, 'Array', Monad.types, 'array'); } }
class EitherMonad extends Monad { constructor() { super(Applicative.types.EitherApplicative, Chain.types.EitherChain, 'Either', Monad.types, 'either'); } }
class MaybeMonad extends Monad { constructor() { super(Applicative.types.MaybeApplicative, Chain.types.MaybeChain, 'Maybe', Monad.types, 'maybe'); } }
class TaskMonad extends Monad { constructor() { super(Applicative.types.TaskApplicative, Chain.types.TaskChain, 'Task', Monad.types, 'task'); } }
(new ArrayMonad(), new EitherMonad(), new MaybeMonad(), new TaskMonad());
// Foldable
class ArrayFoldable extends Foldable { constructor() { super((f, init, arr) => arr.reduce(f, init), 'Array', Foldable.types, 'array'); } }
class EitherFoldable extends Foldable {
    constructor() { super((f, init, e) => e.isRight() ? f(init, e.value) : init, 'Either', Foldable.types, 'either'); }
}
class MaybeFoldable extends Foldable {
    constructor() { super((f, init, m) => m.isJust() ? f(init, m.value) : init, 'Maybe', Foldable.types, 'maybe'); }
}
(new ArrayFoldable(), new EitherFoldable(), new MaybeFoldable());
// Extend
class ArrayExtend extends Extend { constructor() { super(Functor.types.ArrayFunctor, (f, arr) => arr.map((_, i) => f(arr.slice(i))), 'Array', Extend.types, 'array'); } }
(new ArrayExtend());
// Comonad
class ArrayComonad extends Comonad { constructor() { super(Extend.types.ArrayExtend, arr => arr[0], 'Array', Comonad.types, 'array'); } }
(new ArrayComonad());
// Traversable
class ArrayTraversable extends Traversable {
    constructor() {
        super(Functor.types.ArrayFunctor, Foldable.types.ArrayFoldable, (applicative, f, arr) => arr.reduce(
            (acc, x) => applicative.ap(applicative.map(a => b => [...a, b], acc), f(x)),
            applicative.of([])
        ), 'Array', Traversable.types, 'array');
    }
}
class EitherTraversable extends Traversable {
    constructor() {
        super(Functor.types.EitherFunctor, Foldable.types.EitherFoldable, (applicative, f, e) =>
            e.isRight() ? applicative.map(Either.Right, f(e.value)) : applicative.of(e)
            , 'Either', Traversable.types, 'either');
    }
}
class MaybeTraversable extends Traversable {
    constructor() {
        super(Functor.types.MaybeFunctor, Foldable.types.MaybeFoldable, (applicative, f, m) =>
            m.isJust() ? applicative.map(Maybe.Just, f(m.value)) : applicative.of(m)
            , 'Maybe', Traversable.types, 'maybe');
    }
}
(new ArrayTraversable(), new EitherTraversable(), new MaybeTraversable());

const $exports = {
    Algebra, Setoid, Ord, Semigroup, Monoid, Group, Semigroupoid, Category,
    FunctionCategory, Filterable, Functor, Bifunctor, Contravariant, Profunctor,
    Apply, Applicative, Alt, Plus, Alternative, Chain, ChainRec, Monad, Foldable,
    Extend, Comonad, Traversable, Either, Left, Right, Maybe, Just, Nothing, Task
};

const isPascalCase = ([k]) => k[0] === k[0].toUpperCase();
const mergeTo = (cls, target) => {
    es6.object.entries(cls.types || {}).filter(isPascalCase).forEach(([k, v]) => {
        target[k] = v;
    });
};

[Setoid, Ord, Semigroup, Monoid, Group, Semigroupoid, Category, Filterable, Functor, Bifunctor, Contravariant, Profunctor, Apply, Applicative, Alt, Plus, Alternative, Chain, ChainRec, Monad, Foldable, Extend, Comonad, Traversable].forEach(cls => mergeTo(cls, $exports));

module.exports = $exports;
