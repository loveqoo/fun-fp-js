// Foldable tests
import fp from '../index.js';
import { test, assertEquals, assert, logSection } from './utils.js';

const { Foldable } = fp;

logSection('Foldable');

test('Foldable.types has ArrayFoldable', () => {
    assert(Foldable.types.ArrayFoldable, 'should have ArrayFoldable');
});

test('ArrayFoldable.reduce - sum', () => {
    const arr = [1, 2, 3, 4, 5];
    const result = Foldable.types.ArrayFoldable.reduce((acc, x) => acc + x, 0, arr);
    assertEquals(result, 15);
});

test('ArrayFoldable.reduce - product', () => {
    const arr = [1, 2, 3, 4];
    const result = Foldable.types.ArrayFoldable.reduce((acc, x) => acc * x, 1, arr);
    assertEquals(result, 24);
});

test('ArrayFoldable.reduce - collect to array', () => {
    const arr = [1, 2, 3];
    const result = Foldable.types.ArrayFoldable.reduce((acc, x) => [...acc, x * 2], [], arr);
    assertEquals(result, [2, 4, 6]);
});

test('ArrayFoldable.reduce - empty array', () => {
    const result = Foldable.types.ArrayFoldable.reduce((acc, x) => acc + x, 0, []);
    assertEquals(result, 0);
});

test('Foldable.of resolves to ArrayFoldable', () => {
    const instance = Foldable.of('array');
    assert(instance === Foldable.types.ArrayFoldable, 'should resolve to ArrayFoldable');
});

logSection('Foldable - Object');

test('Foldable.types has ObjectFoldable', () => {
    assert(Foldable.types.ObjectFoldable, 'should have ObjectFoldable');
});

test('ObjectFoldable.reduce - sum values', () => {
    const obj = { a: 1, b: 2, c: 3 };
    const result = Foldable.types.ObjectFoldable.reduce((acc, x) => acc + x, 0, obj);
    assertEquals(result, 6);
});

console.log('\n✅ Foldable tests completed\n');
