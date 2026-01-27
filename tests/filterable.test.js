// Filterable tests
import fp from '../index.js';
import { test, assertEquals, assert, logSection } from './utils.js';

const { Filterable, Either, Maybe, Task } = fp;

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

logSection('Either Filterable');

test('Either.filter - Right passes predicate stays Right', () => {
    const result = Either.filter(x => x > 0, Either.Right(5));
    assert(result.isRight(), 'should remain Right');
    assertEquals(result.value, 5);
});

test('Either.filter - Right fails predicate becomes Left(identity)', () => {
    const result = Either.filter(x => x > 10, Either.Right(5));
    assert(result.isLeft(), 'should become Left');
    assertEquals(result.value, 5);
});

test('Either.filter - Left is unchanged', () => {
    const result = Either.filter(x => x > 0, Either.Left('err'));
    assert(result.isLeft(), 'should remain Left');
    assertEquals(result.value, 'err');
});

test('Either.filter - onFalse transforms the Left value', () => {
    const onFalse = x => `${x} is not positive`;
    const result = Either.filter(x => x > 0, Either.Right(-3), onFalse);
    assert(result.isLeft(), 'should become Left');
    assertEquals(result.value, '-3 is not positive');
});

test('Either.filter - onFalse is not called when predicate passes', () => {
    let called = false;
    const onFalse = x => { called = true; return `fail: ${x}`; };
    const result = Either.filter(x => x > 0, Either.Right(5), onFalse);
    assert(result.isRight(), 'should remain Right');
    assert(!called, 'onFalse should not be called');
});

test('Either.filter - onFalse is not called for Left', () => {
    let called = false;
    const onFalse = x => { called = true; return `fail: ${x}`; };
    const result = Either.filter(x => x > 0, Either.Left('err'), onFalse);
    assert(result.isLeft(), 'should remain Left');
    assert(!called, 'onFalse should not be called for Left');
    assertEquals(result.value, 'err');
});

logSection('Maybe Filterable');

test('Maybe.filter - Just passes predicate stays Just', () => {
    const result = Maybe.filter(x => x > 0, Maybe.Just(5));
    assert(result.isJust(), 'should remain Just');
    assertEquals(result.value, 5);
});

test('Maybe.filter - Just fails predicate becomes Nothing', () => {
    const result = Maybe.filter(x => x > 10, Maybe.Just(5));
    assert(result.isNothing(), 'should become Nothing');
});

test('Maybe.filter - Nothing is unchanged', () => {
    const result = Maybe.filter(x => x > 0, Maybe.Nothing());
    assert(result.isNothing(), 'should remain Nothing');
});

console.log('\n✅ Filterable tests completed\n');
