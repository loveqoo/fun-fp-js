// Semigroupoid and Category tests
import fp from '../index.js';
import { test, assertEquals, assert, assertThrows, logSection } from './utils.js';

const { Semigroupoid, Category, identity } = fp;

logSection('Semigroupoid');

test('Semigroupoid.types has FunctionSemigroupoid', () => {
    assert(Semigroupoid.types.FunctionSemigroupoid, 'should have FunctionSemigroupoid');
});

test('FunctionSemigroupoid.compose composes two functions', () => {
    const double = x => x * 2;
    const addOne = x => x + 1;
    const composed = Semigroupoid.types.FunctionSemigroupoid.compose(double, addOne);
    // compose(double, addOne)(5) = double(addOne(5)) = double(6) = 12
    assertEquals(composed(5), 12);
});

test('FunctionSemigroupoid.compose - associativity', () => {
    const f = x => x + 1;
    const g = x => x * 2;
    const h = x => x - 3;
    const { compose } = Semigroupoid.types.FunctionSemigroupoid;

    // compose(f, compose(g, h)) === compose(compose(f, g), h)
    const left = compose(f, compose(g, h));
    const right = compose(compose(f, g), h);
    assertEquals(left(10), right(10));
});

test('FunctionSemigroupoid.compose - throws for non-function', () => {
    const { compose } = Semigroupoid.types.FunctionSemigroupoid;
    assertThrows(() => compose(5, x => x), 'compose with non-function first arg');
    assertThrows(() => compose(x => x, 5), 'compose with non-function second arg');
});

logSection('Category');

test('Category.types has FunctionCategory', () => {
    assert(Category.types.FunctionCategory, 'should have FunctionCategory');
});

test('FunctionCategory has id (identity)', () => {
    const { id } = Category.types.FunctionCategory;
    assertEquals(id(5), 5);
    assertEquals(id('hello'), 'hello');
    const obj = { a: 1 };
    assert(id(obj) === obj, 'id should return same reference');
});

test('FunctionCategory.compose inherits from Semigroupoid', () => {
    const double = x => x * 2;
    const addOne = x => x + 1;
    const composed = Category.types.FunctionCategory.compose(double, addOne);
    assertEquals(composed(5), 12);
});

test('Category laws - left identity: compose(id, f) === f', () => {
    const f = x => x * 2;
    const { compose, id } = Category.types.FunctionCategory;
    assertEquals(compose(id, f)(5), f(5));
});

test('Category laws - right identity: compose(f, id) === f', () => {
    const f = x => x * 2;
    const { compose, id } = Category.types.FunctionCategory;
    assertEquals(compose(f, id)(5), f(5));
});

console.log('\n✅ Semigroupoid and Category tests completed\n');
