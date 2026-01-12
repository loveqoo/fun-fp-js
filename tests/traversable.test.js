// Traversable tests
import fp from '../index.js';
import { test, testAsync, assertEquals, assert, logSection } from './utils.js';

const { Traversable, Maybe, Either, Task, Applicative } = fp;

logSection('Traversable');

test('Traversable.types has ArrayTraversable', () => {
    assert(Traversable.types.ArrayTraversable, 'should have ArrayTraversable');
});

test('ArrayTraversable.traverse with Maybe - all Just', () => {
    const arr = [1, 2, 3];
    const result = Traversable.types.ArrayTraversable.traverse(
        Applicative.types.MaybeApplicative,
        x => Maybe.of(x * 2),
        arr
    );

    assert(Maybe.isJust(result), 'should be Just');
    assertEquals(result.value, [2, 4, 6]);
});

test('ArrayTraversable.traverse with Maybe - has Nothing', () => {
    const arr = [1, 2, 3];
    const result = Traversable.types.ArrayTraversable.traverse(
        Applicative.types.MaybeApplicative,
        x => x === 2 ? Maybe.Nothing() : Maybe.of(x * 2),
        arr
    );

    assert(Maybe.isNothing(result), 'should be Nothing when any element fails');
});

test('ArrayTraversable.traverse with Either - all Right', () => {
    const arr = [1, 2, 3];
    const result = Traversable.types.ArrayTraversable.traverse(
        Applicative.types.EitherApplicative,
        x => Either.Right(x * 2),
        arr
    );

    assert(Either.isRight(result), 'should be Right');
    assertEquals(result.value, [2, 4, 6]);
});

test('ArrayTraversable.traverse with Either - has Left', () => {
    const arr = [1, 2, 3];
    const result = Traversable.types.ArrayTraversable.traverse(
        Applicative.types.EitherApplicative,
        x => x === 2 ? Either.Left('error at 2') : Either.Right(x * 2),
        arr
    );

    assert(Either.isLeft(result), 'should be Left when any element fails');
    assertEquals(result.value, 'error at 2');
});

testAsync('ArrayTraversable.traverse with Task', async () => {
    const arr = [1, 2, 3];
    const result = Traversable.types.ArrayTraversable.traverse(
        Applicative.types.TaskApplicative,
        x => Task.of(x * 2),
        arr
    );

    // Task uses fork instead of run
    const resolved = await new Promise((resolve, reject) => {
        result.fork(reject, resolve);
    });
    assertEquals(resolved, [2, 4, 6]);
});

logSection('Traversable Laws');

test('Identity: traverse(F, F.of, a) === F.of(a)', () => {
    const arr = [1, 2, 3];
    const { of } = Applicative.types.MaybeApplicative;

    const result = Traversable.types.ArrayTraversable.traverse(
        Applicative.types.MaybeApplicative,
        of,
        arr
    );

    assert(Maybe.isJust(result), 'should be Just');
    assertEquals(result.value, arr);
});

console.log('\n✅ Traversable tests completed\n');
