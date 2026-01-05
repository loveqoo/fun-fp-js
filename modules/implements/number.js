import { Setoid, Ord, Semigroup, Monoid, Group } from '../spec.js';

class NumberSetoid extends Setoid {
    constructor() {
        super(Setoid.op, 'number', Setoid.types, 'number');
    }
}
class NumberOrd extends Ord {
    constructor() {
        super(Ord.op, 'number', Ord.types, 'number');
    }
}
class NumberSumSemigroup extends Semigroup {
    constructor() {
        super((x, y) => x + y, 'number', Semigroup.types, 'number');
    }
}
class NumberProductSemigroup extends Semigroup {
    constructor() {
        super((x, y) => x * y, 'number', Semigroup.types);
    }
}
class NumberMaxSemigroup extends Semigroup {
    constructor() {
        super(Math.max, 'number', Semigroup.types);
    }
}
class NumberMinSemigroup extends Semigroup {
    constructor() {
        super(Math.min, 'number', Semigroup.types);
    }
}
class NumberSumMonoid extends Monoid {
    constructor() {
        super(Semigroup.types.NumberSumSemigroup, () => 0, 'number', Monoid.types, 'number');
    }
}
class NumberProductMonoid extends Monoid {
    constructor() {
        super(Semigroup.types.NumberProductSemigroup, () => 1, 'number', Monoid.types);
    }
}
class NumberMaxMonoid extends Monoid {
    constructor() {
        super(Semigroup.types.NumberMaxSemigroup, () => -Infinity, 'number', Monoid.types);
    }
}
class NumberMinMonoid extends Monoid {
    constructor() {
        super(Semigroup.types.NumberMinSemigroup, () => Infinity, 'number', Monoid.types);
    }
}
class NumberSumGroup extends Group {
    constructor() {
        super(Monoid.types.NumberSumMonoid, x => -x, 'number', Group.types, 'number');
    }
}
class NumberProductGroup extends Group {
    constructor() {
        super(Monoid.types.NumberProductMonoid, x => 1 / x, 'number', Group.types);
    }
}

(new NumberSetoid(), new NumberOrd(), new NumberSumSemigroup(), new NumberProductSemigroup(), new NumberMaxSemigroup(), new NumberMinSemigroup(),
    new NumberSumMonoid(), new NumberProductMonoid(), new NumberMaxMonoid(), new NumberMinMonoid(), new NumberSumGroup(), new NumberProductGroup());