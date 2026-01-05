import { Setoid, Semigroup, Monoid, Group } from '../spec.js';

class BooleanSetoid extends Setoid {
    constructor() {
        super(Setoid.op, 'boolean', Setoid.types, 'boolean');
    }
}
class BooleanAllSemigroup extends Semigroup {
    constructor() {
        super((x, y) => x && y, 'boolean', Semigroup.types, 'boolean');
    }
}
class BooleanAnySemigroup extends Semigroup {
    constructor() {
        super((x, y) => x || y, 'boolean', Semigroup.types);
    }
}
class BooleanXorSemigroup extends Semigroup {
    constructor() {
        super((x, y) => x !== y, 'boolean', Semigroup.types);
    }
}
class BooleanAllMonoid extends Monoid {
    constructor() {
        super(Semigroup.types.BooleanAllSemigroup, () => true, 'boolean', Monoid.types, 'boolean');
    }
}
class BooleanAnyMonoid extends Monoid {
    constructor() {
        super(Semigroup.types.BooleanAnySemigroup, () => false, 'boolean', Monoid.types);
    }
}
class BooleanXorMonoid extends Monoid {
    constructor() {
        super(Semigroup.types.BooleanXorSemigroup, () => false, 'boolean', Monoid.types);
    }
}
class BooleanXorGroup extends Group {
    constructor() {
        super(Monoid.types.BooleanXorMonoid, x => x, 'boolean', Group.types);
    }
}

(new BooleanSetoid(), new BooleanAllSemigroup(), new BooleanAnySemigroup(), new BooleanXorSemigroup(),
    new BooleanAllMonoid(), new BooleanAnyMonoid(), new BooleanXorMonoid(), new BooleanXorGroup());