const $transducer = (dependencies = {}) => {
    const { core } = dependencies.$core;

    const assertFunctions = {
        'transducer_map': core.assertFunction('Transducer.map', 'a function'),
        'transducer_filter': core.assertFunction('Transducer.filter', 'a function'),
        'transducer_transformer': core.assertFunction('Transducer.transduce', 'transformer (xform) to be a function'),
        'transducer_reducer': core.assertFunction('Transducer.transduce', 'reducer (rf) to be a function'),
    };

    class Transducer {
        constructor(value) {
            this.value = value;
        }
        static reduced(value) {
            return new Transducer(value);
        }
        static isReduced(value) {
            return value instanceof Transducer;
        }
        static map(f) {
            assertFunctions['transducer_map'](f);
            return reducer => (acc, val) => reducer(acc, f(val));
        }
        static filter(p) {
            assertFunctions['transducer_filter'](p);
            return reducer => (acc, val) => p(val) ? reducer(acc, val) : acc;
        }
        static take(n) {
            return reducer => {
                let count = 0;
                return (acc, val) => {
                    if (count < n) {
                        count++;
                        const nextAcc = reducer(acc, val);
                        if (Transducer.isReduced(nextAcc)) {
                            return nextAcc;
                        }
                        if (count === n) {
                            return Transducer.reduced(nextAcc);
                        }
                        return nextAcc;
                    }
                    return Transducer.reduced(acc);
                };
            };
        }
        static transduce(transformer, reducer, init, input) {
            assertFunctions['transducer_transformer'](transformer);
            assertFunctions['transducer_reducer'](reducer);

            const transformation = transformer(reducer);
            let acc = init;

            for (const value of core.toIterator(input)) {
                acc = transformation(acc, value);
                if (Transducer.isReduced(acc)) {
                    acc = acc.value;
                    break;
                }
            }
            return acc;
        }
        static into(monoid, transformer, input) {
            if (!monoid || typeof monoid.concat !== 'function' || !('empty' in monoid)) {
                throw new TypeError('Transducer.into: expected a Monoid as the first argument');
            }
            return Transducer.transduce(transformer, monoid.concat, monoid.empty, input);
        }
    }
    return {
        transducer: {
            Transducer,
            map: Transducer.map,
            filter: Transducer.filter,
            take: Transducer.take,
            transduce: Transducer.transduce,
            into: Transducer.into,
        },
    };
};

if (typeof module !== 'undefined' && module.exports) module.exports = $transducer;
