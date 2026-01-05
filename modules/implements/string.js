import { Setoid, Ord, Semigroup, Monoid } from '../spec.js';

class StringSetoid extends Setoid {
    constructor() {
        super(Setoid.op, 'string', Setoid.types, 'string');
    }
}
class StringOrd extends Ord {
    constructor() {
        super(Ord.op, 'string', Ord.types, 'string');
    }
}
class StringLengthOrd extends Ord {
    constructor() {
        super((x, y) => x.length <= y.length, 'string', Ord.types);
    }
}
class StringLocaleOrd extends Ord {
    constructor() {
        super((x, y) => x.localeCompare(y) <= 0, 'string', Ord.types);
    }
}
class StringSemigroup extends Semigroup {
    constructor() {
        super((x, y) => x + y, 'string', Semigroup.types, 'string');
    }
}
class StringMonoid extends Monoid {
    constructor() {
        super(Semigroup.types.StringSemigroup, () => '', 'string', Monoid.types, 'string');
    }
}

(new StringSetoid(), new StringOrd(), new StringLengthOrd(), new StringLocaleOrd(), new StringSemigroup(), new StringMonoid());