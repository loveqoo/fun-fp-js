import { Semigroup, Monoid, Semigroupoid, Category, Contravariant, Profunctor } from '../spec.js';
import { compose, identity } from '../../modules/base.js';

class FunctionSemigroup extends Semigroup {
    constructor() {
        super(compose, 'function', Semigroup.types, 'function');
    }
}
class FunctionMonoid extends Monoid {
    constructor() {
        super(Semigroup.types.FunctionSemigroup, identity, 'function', Monoid.types, 'function');
    }
}
class FunctionSemigroupoid extends Semigroupoid {
    constructor() {
        super(compose, 'function', Semigroupoid.types, 'function');
    }
}
class FunctionCategory extends Category {
    constructor() {
        super(Semigroupoid.types.FunctionSemigroupoid, identity, 'function', Category.types, 'function');
    }
}
class PredicateContravariant extends Contravariant {
    constructor() {
        super((f, pred) => a => pred(f(a)), 'function', Contravariant.types, 'predicate');
    }
}
class FunctionProfunctor extends Profunctor {
    constructor() {
        super((f, g, fn) => x => g(fn(f(x))), 'function', Profunctor.types, 'function');
    }
}

(new FunctionSemigroup(), new FunctionMonoid(), new FunctionSemigroupoid(), new FunctionCategory(), new PredicateContravariant(), new FunctionProfunctor());