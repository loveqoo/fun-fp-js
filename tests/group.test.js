// Group tests
import fp from '../index.js';
import { test, assertEquals, assert, logSection } from './utils.js';

const { Group } = fp;

logSection('Group');

test('Group.types exists', () => {
    assert(typeof Group.types === 'object', 'Group.types should exist');
});

// Note: Currently no Group instances are registered in the library
// Group extends Monoid with an invert operation: a.concat(a.invert()) === empty

console.log('\n✅ Group tests completed\n');
