// Bifunctor tests
import fp from '../index.js';
import { test, assertEquals, assert, logSection } from './utils.js';

const { Bifunctor, Either } = fp;

logSection('Bifunctor');

test('Bifunctor.types has EitherBifunctor', () => {
    assert(Bifunctor.types.EitherBifunctor, 'should have EitherBifunctor');
});

test('EitherBifunctor.bimap on Right', () => {
    const right = Either.Right(5);
    const result = Bifunctor.types.EitherBifunctor.bimap(
        x => x.toUpperCase(),  // for Left
        x => x * 2,            // for Right
        right
    );
    assertEquals(result.value, 10);
    assert(Either.isRight(result), 'should still be Right');
});

test('EitherBifunctor.bimap on Left', () => {
    const left = Either.Left('error');
    const result = Bifunctor.types.EitherBifunctor.bimap(
        x => x.toUpperCase(),  // for Left
        x => x * 2,            // for Right
        left
    );
    assertEquals(result.value, 'ERROR');
    assert(Either.isLeft(result), 'should still be Left');
});

logSection('Bifunctor Laws');

test('Identity: bimap(id, id, a) === a', () => {
    const id = x => x;
    const right = Either.Right(42);
    const result = Bifunctor.types.EitherBifunctor.bimap(id, id, right);
    assertEquals(result.value, right.value);
});

test('Composition: bimap(f . g, h . i, a) === bimap(f, h, bimap(g, i, a))', () => {
    const f = x => x + '!';
    const g = x => x.toUpperCase();
    const h = x => x * 2;
    const i = x => x + 1;

    const left = Either.Left('err');
    const { bimap } = Bifunctor.types.EitherBifunctor;

    // bimap(f . g, h . i, a)
    const leftResult = bimap(x => f(g(x)), x => h(i(x)), left);
    // bimap(f, h, bimap(g, i, a))
    const rightResult = bimap(f, h, bimap(g, i, left));

    assertEquals(leftResult.value, rightResult.value);
});

console.log('\n✅ Bifunctor tests completed\n');
