import { Semigroup, Monoid, Filterable, Functor, Bifunctor, Apply, Applicative, Alt, Plus, Alternative, Chain, ChainRec, Monad, Foldable, Extend, Comonad, Traversable } from '../spec.js';
import { es6 } from '../base.js';

class ArraySemigroup extends Semigroup {
    constructor() {
        super((x, y) => x.concat(y), 'Array', Semigroup.types, 'array');
    }
}
class ArrayMonoid extends Monoid {
    constructor() {
        super(Semigroup.types.ArraySemigroup, () => [], 'Array', Monoid.types, 'array');
    }
}
class ArrayFilterable extends Filterable {
    constructor() {
        super((pred, arr) => arr.filter(pred), 'Array', Filterable.types, 'array');
    }
}
class ArrayFunctor extends Functor {
    constructor() {
        super((f, arr) => arr.map(f), 'Array', Functor.types, 'array');
    }
}
class TupleBifunctor extends Bifunctor {
    constructor() {
        super((f, g, [a, b]) => [f(a), g(b)], 'Array', Bifunctor.types, 'tuple');
    }
}
class ArrayApply extends Apply {
    constructor() {
        super(Functor.types.ArrayFunctor, (fs, values) => es6.array.flatMap(f => Functor.types.ArrayFunctor.map(f, values), fs), 'Array', Apply.types, 'array');
    }
}
class ArrayApplicative extends Applicative {
    constructor() {
        super(Apply.types.ArrayApply, x => [x], 'Array', Applicative.types, 'array');
    }
}
class ArrayAlt extends Alt {
    constructor() {
        super(Functor.types.ArrayFunctor, (a, b) => a.concat(b), 'Array', Alt.types, 'array');
    }
}
class ArrayPlus extends Plus {
    constructor() {
        super(Alt.types.ArrayAlt, () => [], 'Array', Plus.types, 'array');
    }
}
class ArrayAlternative extends Alternative {
    constructor() {
        super(Applicative.types.ArrayApplicative, Plus.types.ArrayPlus, 'Array', Alternative.types, 'array');
    }
}
class ArrayChain extends Chain {
    constructor() {
        super(Apply.types.ArrayApply, es6.array.flatMap, 'Array', Chain.types, 'array');
    }
}
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
class ArrayMonad extends Monad {
    constructor() {
        super(Applicative.types.ArrayApplicative, Chain.types.ArrayChain, 'Array', Monad.types, 'array');
    }
}
class ArrayFoldable extends Foldable {
    constructor() {
        super((f, init, arr) => arr.reduce(f, init), 'Array', Foldable.types, 'array');
    }
}
class ArrayExtend extends Extend {
    constructor() {
        super(Functor.types.ArrayFunctor, (f, arr) => arr.map((_, i) => f(arr.slice(i))), 'Array', Extend.types, 'array');
    }
}
class ArrayComonad extends Comonad {
    constructor() {
        super(Extend.types.ArrayExtend, arr => arr[0], 'Array', Comonad.types, 'array');
    }
}
class ArrayTraversable extends Traversable {
    constructor() {
        super(Functor.types.ArrayFunctor, Foldable.types.ArrayFoldable, (applicative, f, arr) => arr.reduce(
            (acc, x) => applicative.ap(applicative.map(a => b => [...a, b], acc), f(x)),
            applicative.of([])
        ), 'Array', Traversable.types, 'array');
    }
}

(new ArraySemigroup(), new ArrayMonoid(), new ArrayFilterable(), new ArrayFunctor(), new TupleBifunctor(), new ArrayApply(),
    new ArrayApplicative(), new ArrayAlt(), new ArrayPlus(), new ArrayAlternative(), new ArrayChain(), new ArrayChainRec(),
    new ArrayMonad(), new ArrayFoldable(), new ArrayExtend(), new ArrayComonad(), new ArrayTraversable());
