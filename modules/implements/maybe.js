import { Semigroupoid, Category, Functor, Apply, Applicative, Alt, Plus, Alternative, Chain, ChainRec, Monad, Traversable } from '../spec.js';

class Maybe {
    isJust() {
        return false;
    }
    isNothing() {
        return false;
    }
}
class Just extends Maybe {
    constructor(value) {
        super(); this.value = value; this._typeName = 'Maybe';
    }
    isJust() {
        return true;
    }
}
class Nothing extends Maybe {
    constructor() {
        super(); this._typeName = 'Maybe';
    }
    isNothing() {
        return true;
    }
}
Maybe.Just = x => new Just(x);
Maybe.Nothing = () => new Nothing();
Maybe.of = x => new Just(x);
Maybe.isMaybe = x => x instanceof Maybe;
Maybe.isJust = x => x instanceof Just;
Maybe.isNothing = x => x instanceof Nothing;
Maybe.fromNullable = x => x == null ? new Nothing() : new Just(x);
Maybe.fold = (onNothing, onJust, m) => m.isJust() ? onJust(m.value) : onNothing();

class MaybeSemigroupoid extends Semigroupoid {
    constructor() {
        super((f, g) => x => Chain.types.MaybeChain.chain(f, g(x)), 'function', Semigroupoid.types, 'maybe');
    }
}
class MaybeCategory extends Category {
    constructor() {
        super(Semigroupoid.types.MaybeSemigroupoid, Maybe.Just, 'function', Category.types, 'maybe');
    }
}
class MaybeFunctor extends Functor {
    constructor() {
        super((f, m) => m.isJust() ? Maybe.Just(f(m.value)) : m, 'Maybe', Functor.types, 'maybe');
    }
}
class MaybeApply extends Apply {
    constructor() {
        super(Functor.types.MaybeFunctor, (mf, mx) => mf.isNothing() ? mf : mx.isNothing() ? mx : Maybe.Just(mf.value(mx.value)), 'Maybe', Apply.types, 'maybe');
    }
}
class MaybeApplicative extends Applicative {
    constructor() {
        super(Apply.types.MaybeApply, Maybe.Just, 'Maybe', Applicative.types, 'maybe');
    }
}
class MaybeAlt extends Alt {
    constructor() {
        super(Functor.types.MaybeFunctor, (a, b) => a.isNothing() ? b : a, 'Maybe', Alt.types, 'maybe');
    }
}
class MaybePlus extends Plus {
    constructor() {
        super(Alt.types.MaybeAlt, Maybe.Nothing, 'Maybe', Plus.types, 'maybe');
    }
}
class MaybeAlternative extends Alternative {
    constructor() {
        super(Applicative.types.MaybeApplicative, Plus.types.MaybePlus, 'Maybe', Alternative.types, 'maybe');
    }
}
class MaybeChain extends Chain {
    constructor() {
        super(Apply.types.MaybeApply, (f, m) => m.isJust() ? f(m.value) : m, 'Maybe', Chain.types, 'maybe');
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
class MaybeMonad extends Monad {
    constructor() {
        super(Applicative.types.MaybeApplicative, Chain.types.MaybeChain, 'Maybe', Monad.types, 'maybe');
    }
}
class MaybeFoldable extends Foldable {
    constructor() {
        super((f, init, m) => m.isJust() ? f(init, m.value) : init, 'Maybe', Foldable.types, 'maybe');
    }
}
class MaybeTraversable extends Traversable {
    constructor() {
        super(Functor.types.MaybeFunctor, Foldable.types.MaybeFoldable, (applicative, f, m) =>
            m.isJust() ? applicative.map(Maybe.Just, f(m.value)) : applicative.of(m)
            , 'Maybe', Traversable.types, 'maybe');
    }
}

(new MaybeSemigroupoid(), new MaybeCategory(), new MaybeFunctor(), new MaybeApply(), new MaybeApplicative(), new MaybeAlt(), new MaybePlus(), new MaybeAlternative(),
    new MaybeChain(), new MaybeChainRec(), new MaybeMonad(), new MaybeFoldable(), new MaybeTraversable());
