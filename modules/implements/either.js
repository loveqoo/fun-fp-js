import {
    Semigroupoid, Category, Functor, Bifunctor, Apply, Applicative, Alt, Chain,
    ChainRec, Monad, Foldable, Traversable
} from '../spec.js';

class Either {
    isLeft() { return false; }
    isRight() { return false; }
}
class Left extends Either {
    constructor(value) {
        super(); this.value = value; this._typeName = 'Either';
    }
    isLeft() {
        return true;
    }
}
class Right extends Either {
    constructor(value) {
        super(); this.value = value; this._typeName = 'Either';
    }
    isRight() {
        return true;
    }
}
Either.Left = x => new Left(x);
Either.Right = x => new Right(x);
Either.of = x => new Right(x);
Either.isEither = x => x instanceof Either;
Either.isLeft = x => x instanceof Left;
Either.isRight = x => x instanceof Right;
Either.fold = (onLeft, onRight, e) => e.isLeft() ? onLeft(e.value) : onRight(e.value);
Either.catch = f => {
    try {
        return Either.Right(f());
    }
    catch (e) {
        return Either.Left(e);
    }
};
Either.validate = (condition, onError) => x => condition(x) ? Either.Right(x) : Either.Left(onError(x));
Either.validateAll = list => list.reduce(
    (acc, e) => acc.isLeft() && e.isLeft()
        ? Either.Left([].concat(acc.value, e.value))
        : acc.isLeft() ? acc : e.isLeft() ? e : Either.Right([].concat(acc.value || [], e.value)),
    Either.Right([])
);
Either.sequence = list => {
    const results = [];
    for (const e of list) {
        if (e.isLeft()) return e;
        results.push(e.value);
    }
    return Either.Right(results);
};

class EitherSemigroupoid extends Semigroupoid {
    constructor() {
        super((f, g) => x => Chain.types.EitherChain.chain(f, g(x)), 'function', Semigroupoid.types, 'either');
    }
}
class EitherCategory extends Category {
    constructor() {
        super(Semigroupoid.types.EitherSemigroupoid, Either.Right, 'function', Category.types, 'either');
    }
}
class EitherFunctor extends Functor {
    constructor() {
        super((f, e) => e.isRight() ? Either.Right(f(e.value)) : e, 'Either', Functor.types, 'either');
    }
}
class EitherBifunctor extends Bifunctor {
    constructor() {
        super((f, g, e) => e.isLeft() ? Either.Left(f(e.value)) : Either.Right(g(e.value)),
            'Either', Bifunctor.types, 'either');
    }
}
class EitherApply extends Apply {
    constructor() {
        super(Functor.types.EitherFunctor,
            (ef, ex) => ef.isLeft() ? ef : ex.isLeft() ? ex : Either.Right(ef.value(ex.value)),
            'Either', Apply.types, 'either');
    }
}
class EitherApplicative extends Applicative {
    constructor() {
        super(Apply.types.EitherApply, Either.Right, 'Either', Applicative.types, 'either');
    }
}
class EitherAlt extends Alt {
    constructor() {
        super(Functor.types.EitherFunctor, (a, b) => a.isLeft() ? b : a, 'Either', Alt.types, 'either');
    }
}
class EitherChain extends Chain {
    constructor() {
        super(Apply.types.EitherApply, (f, e) => e.isRight() ? f(e.value) : e, 'Either', Chain.types, 'either');
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
class EitherMonad extends Monad {
    constructor() {
        super(Applicative.types.EitherApplicative, Chain.types.EitherChain, 'Either', Monad.types, 'either');
    }
}
class EitherFoldable extends Foldable {
    constructor() {
        super((f, init, e) => e.isRight() ? f(init, e.value) : init, 'Either', Foldable.types, 'either');
    }
}
class EitherTraversable extends Traversable {
    constructor() {
        super(Functor.types.EitherFunctor, Foldable.types.EitherFoldable, (applicative, f, e) =>
            e.isRight() ? applicative.map(Either.Right, f(e.value)) : applicative.of(e)
            , 'Either', Traversable.types, 'either');
    }
}
(new EitherSemigroupoid(), new EitherCategory(), new EitherFunctor(), new EitherBifunctor(), new EitherApply(), new EitherApplicative(),
    new EitherAlt(), new EitherChain(), new EitherChainRec(), new EitherMonad(), new EitherFoldable(), new EitherTraversable());
