// Extend and Comonad tests
import fp from '../index.js';
import { test, assertEquals, assert, logSection } from './utils.js';

const { Extend, Comonad } = fp;

logSection('Extend');

test('Extend.types exists', () => {
    assert(typeof Extend.types === 'object', 'Extend.types should exist');
});

test('Extend.types has ArrayExtend', () => {
    assert(Extend.types.ArrayExtend, 'should have ArrayExtend');
});

test('ArrayExtend.extend - sum of rest', () => {
    // extend gives you access to the whole structure at each position
    const arr = [1, 2, 3, 4];
    const result = Extend.types.ArrayExtend.extend(
        xs => xs.reduce((a, b) => a + b, 0),  // sum from current position
        arr
    );
    // At each position, sum the rest: [10, 9, 7, 4]
    assertEquals(result, [10, 9, 7, 4]);
});

logSection('Comonad');

test('Comonad.types exists', () => {
    assert(typeof Comonad.types === 'object', 'Comonad.types should exist');
});

test('Comonad.types has ArrayComonad', () => {
    assert(Comonad.types.ArrayComonad, 'should have ArrayComonad');
});

test('ArrayComonad.extract - gets first element', () => {
    const arr = [1, 2, 3];
    const result = Comonad.types.ArrayComonad.extract(arr);
    assertEquals(result, 1);
});

logSection('Comonad Laws');

test('Left identity: extend(extract, w) === w', () => {
    const arr = [1, 2, 3];
    const { extend } = Extend.types.ArrayExtend;
    const { extract } = Comonad.types.ArrayComonad;

    const result = extend(extract, arr);
    assertEquals(result, arr);
});

console.log('\n✅ Extend and Comonad tests completed\n');
