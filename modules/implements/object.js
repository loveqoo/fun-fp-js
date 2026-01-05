import { Semigroup, Monoid, Filterable } from '../spec.js';

class FirstSemigroup extends Semigroup {
    constructor() {
        super(x => x, 'any', Semigroup.types, 'first');
    }
}
class LastSemigroup extends Semigroup {
    constructor() {
        super((x, y) => y, 'any', Semigroup.types, 'last');
    }
}
class FirstMonoid extends Monoid {
    constructor() {
        super(Semigroup.types.FirstSemigroup, () => null, 'any', Monoid.types, 'first');
    }
}
class LastMonoid extends Monoid {
    constructor() {
        super(Semigroup.types.LastSemigroup, () => null, 'any', Monoid.types, 'last');
    }
}
class ObjectFilterable extends Filterable {
    constructor() {
        super((pred, obj) => es6.object.filter(pred, obj), 'object', Filterable.types, 'object');
    }
}

(new FirstSemigroup(), new LastSemigroup(), new FirstMonoid(), new LastMonoid(), new ObjectFilterable());