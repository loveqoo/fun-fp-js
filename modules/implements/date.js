import { Setoid } from '../spec.js';

class DateSetoid extends Setoid {
    constructor() {
        super((x, y) => x.getTime() === y.getTime(), 'date', Setoid.types, 'date');
    }
}

(new DateSetoid());