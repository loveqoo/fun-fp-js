const $transducer = (dependencies = {}) => {
    const { core } = dependencies.$core;
    const { monoid } = dependencies.$monoid;

    const assertFunctions = {
        'transducer_map': core.assertFunction('Transducer.map', 'a function'),
        'transducer_filter': core.assertFunction('Transducer.filter', 'a function'),
        'transducer_flat_map': core.assertFunction('Transducer.flatMap', 'a function'),
    };

    class Reduced {
        constructor(value) {
            this.value = value;
        }
    }

    class Transducer {
        constructor(source, transformers = []) {
            if (!core.isIterable(source)) {
                core.raise(new TypeError('Transducer: source must be an iterable'));
            }
            this.source = source;
            this.transformers = transformers;
            this[core.Types.Functor] = true;
            this[core.Types.Monad] = true;
        }

        static reduced(value) {
            return new Reduced(value);
        }

        static isReduced(value) {
            return value instanceof Reduced;
        }

        append(transformer) {
            return new Transducer(this.source, [...this.transformers, transformer]);
        }

        map(f) {
            assertFunctions['transducer_map'](f);
            const transformer = step => (acc, val) => step(acc, f(val));
            return this.append(transformer);
        }

        flatMap(f) {
            assertFunctions['transducer_flat_map'](f);
            const transformer = step => (acc, val) => {
                let result = acc;
                for (const inner of core.toIterator(f(val))) {
                    result = step(result, inner);
                    if (Transducer.isReduced(result)) return result;
                }
                return result;
            };
            return this.append(transformer);
        }

        filter(predicate) {
            assertFunctions['transducer_filter'](predicate);
            const transformer = step => (acc, val) => predicate(val) ? step(acc, val) : acc;
            return this.append(transformer);
        }

        take(count) {
            let taken = 0;
            const transformer = step => (acc, val) => {
                if (taken >= count) return Transducer.reduced(acc);
                taken++;
                const next = step(acc, val);
                if (Transducer.isReduced(next)) return next;
                return taken >= count ? Transducer.reduced(next) : next;
            };
            return this.append(transformer);
        }

        drop(count) {
            let dropped = 0;
            const transformer = step => (acc, val) => {
                if (dropped < count) { dropped++; return acc; }
                return step(acc, val);
            };
            return this.append(transformer);
        }

        reduce(reducer, initial) {
            const composed = core.compose(...this.transformers);
            const step = composed(reducer);
            let acc = initial;
            for (const val of core.toIterator(this.source)) {
                acc = step(acc, val);
                if (Transducer.isReduced(acc)) { acc = acc.value; break; }
            }
            return acc;
        }

        collect() {
            return this.reduce((arr, val) => { arr.push(val); return arr; }, []);
        }

        fold(M, f = core.identity) {
            return monoid.fold(M, f)(this.collect());
        }

        sum() {
            return this.reduce((total, val) => total + val, 0);
        }

        join(separator = '') {
            const result = this.reduce(
                (str, val) => str === null ? String(val) : str + separator + val,
                null
            );
            return result ?? '';
        }

        count() {
            return this.reduce(n => n + 1, 0);
        }

        first() {
            return this.take(1).reduce((_, val) => val, undefined);
        }

        forEach(f) {
            this.reduce((_, val) => { f(val); }, undefined);
        }
    }

    const from = source => new Transducer(source);

    return {
        transducer: {
            from,
            Transducer,
        },
    };
};

if (typeof module !== 'undefined' && module.exports) module.exports = $transducer;
