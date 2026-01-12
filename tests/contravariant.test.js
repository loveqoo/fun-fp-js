// Contravariant tests
import fp from '../index.js';
import { test, assertEquals, assert, logSection } from './utils.js';

const { Contravariant } = fp;

logSection('Contravariant');

test('Contravariant.types exists', () => {
    assert(typeof Contravariant.types === 'object', 'Contravariant.types should exist');
});

// Note: Contravariant is the opposite of Functor
// contramap :: (b -> a) -> f a -> f b
// Example: Predicates are contravariant

// Currently no Contravariant instances are registered
// A typical example would be:
// const Predicate = {
//   contramap: (f, pred) => x => pred(f(x))
// }

console.log('\n✅ Contravariant tests completed\n');
