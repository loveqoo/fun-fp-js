// Filterable tests
import fp from '../index.js';
import { test, assertEquals, assert, logSection } from './utils.js';

const { Filterable } = fp;

logSection('Filterable');

test('Filterable.types has ArrayFilterable', () => {
    assert(Filterable.types.ArrayFilterable, 'should have ArrayFilterable');
});

test('Filterable.types has ObjectFilterable', () => {
    assert(Filterable.types.ObjectFilterable, 'should have ObjectFilterable');
});

test('ArrayFilterable.filter filters array', () => {
    const arr = [1, 2, 3, 4, 5];
    const result = Filterable.types.ArrayFilterable.filter(x => x > 2, arr);
    assertEquals(result, [3, 4, 5]);
});

test('ArrayFilterable.filter - empty result', () => {
    const arr = [1, 2, 3];
    const result = Filterable.types.ArrayFilterable.filter(x => x > 10, arr);
    assertEquals(result, []);
});

test('ObjectFilterable.filter filters object values', () => {
    const obj = { a: 1, b: 2, c: 3 };
    const result = Filterable.types.ObjectFilterable.filter(x => x > 1, obj);
    assertEquals(result, { b: 2, c: 3 });
});

test('Filterable.of resolves to ArrayFilterable', () => {
    const instance = Filterable.of('array');
    assert(instance === Filterable.types.ArrayFilterable, 'should resolve to ArrayFilterable');
});

logSection('Filterable Laws');

test('Distributivity: filter(x => p(x) && q(x), a) === filter(q, filter(p, a))', () => {
    const arr = [1, 2, 3, 4, 5, 6];
    const p = x => x > 2;
    const q = x => x < 5;
    const { filter } = Filterable.types.ArrayFilterable;

    const left = filter(x => p(x) && q(x), arr);
    const right = filter(q, filter(p, arr));
    assertEquals(left, right);
});

test('Identity: filter(x => true, a) === a', () => {
    const arr = [1, 2, 3];
    const result = Filterable.types.ArrayFilterable.filter(() => true, arr);
    assertEquals(result, arr);
});

test('Annihilation: filter(x => false, a) === empty', () => {
    const arr = [1, 2, 3];
    const result = Filterable.types.ArrayFilterable.filter(() => false, arr);
    assertEquals(result, []);
});

console.log('\n✅ Filterable tests completed\n');
