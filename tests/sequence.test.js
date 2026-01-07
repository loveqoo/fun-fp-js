// Sequence Tests
import fp from '../index.js';
import { test, assertEquals, assertThrows, deepEquals, logSection } from './utils.js';

const { sequence, Traversable, Applicative, Maybe, Either, Task } = fp;

logSection('Sequence Function');

// === Array<Maybe> -> Maybe<Array> ===
const arrTraversable = Traversable.of('array');
const maybeApplicative = Applicative.of('maybe');

test('sequence Array<Maybe.Just> -> Maybe.Just<Array>', () => {
    const input = [Maybe.Just(1), Maybe.Just(2), Maybe.Just(3)];
    const result = sequence(arrTraversable, maybeApplicative, input);

    assertEquals(result.isJust(), true);
    assertEquals(result.value, [1, 2, 3]);
});

test('sequence Array with Nothing -> Nothing', () => {
    const input = [Maybe.Just(1), Maybe.Nothing(), Maybe.Just(3)];
    const result = sequence(arrTraversable, maybeApplicative, input);

    assertEquals(result.isNothing(), true);
});

test('sequence Empty Array -> Just([])', () => {
    const input = [];
    const result = sequence(arrTraversable, maybeApplicative, input);

    assertEquals(result.isJust(), true);
    assertEquals(result.value, []);
});

// === Array<Either> -> Either<Array> ===
const eitherApplicative = Applicative.of('either');

test('sequence Array<Either.Right> -> Either.Right<Array>', () => {
    const input = [Either.Right(1), Either.Right(2), Either.Right(3)];
    const result = sequence(arrTraversable, eitherApplicative, input);

    assertEquals(result.isRight(), true);
    assertEquals(result.value, [1, 2, 3]);
});

test('sequence Array with Left -> Left', () => {
    const input = [Either.Right(1), Either.Left('error'), Either.Right(3)];
    const result = sequence(arrTraversable, eitherApplicative, input);

    assertEquals(result.isLeft(), true);
    assertEquals(result.value, 'error');
});

// === Maybe<Array> -> Array<Maybe> ===
const maybeTraversable = Traversable.of('maybe');
const arrApplicative = Applicative.of('array');

test('sequence Maybe.Just<Array> -> Array<Maybe.Just>', () => {
    const input = Maybe.Just([1, 2, 3]);
    const result = sequence(maybeTraversable, arrApplicative, input);

    assertEquals(result.length, 3);
    assertEquals(result[0].isJust(), true);
    assertEquals(result[0].value, 1);
    assertEquals(result[1].value, 2);
    assertEquals(result[2].value, 3);
});

test('sequence Maybe.Nothing -> [Nothing]', () => {
    const input = Maybe.Nothing();
    const result = sequence(maybeTraversable, arrApplicative, input);

    assertEquals(result.length, 1);
    assertEquals(result[0].isNothing(), true);
});

// === Either<E, Array> -> Array<Either<E, A>> ===
const eitherTraversable = Traversable.of('either');

test('sequence Either.Right<Array> -> Array<Either.Right>', () => {
    const input = Either.Right([1, 2, 3]);
    const result = sequence(eitherTraversable, arrApplicative, input);

    assertEquals(result.length, 3);
    assertEquals(result[0].isRight(), true);
    assertEquals(result[0].value, 1);
});

test('sequence Either.Left -> [Left]', () => {
    const input = Either.Left('error');
    const result = sequence(eitherTraversable, arrApplicative, input);

    assertEquals(result.length, 1);
    assertEquals(result[0].isLeft(), true);
    assertEquals(result[0].value, 'error');
});

// === Array<Task> -> Task<Array> ===
const taskApplicative = Applicative.of('task');

test('sequence Array<Task.of> -> Task.of<Array>', () => {
    const input = [Task.of(1), Task.of(2), Task.of(3)];
    const result = sequence(arrTraversable, taskApplicative, input);

    result.fork(
        e => { throw new Error(`Unexpected rejection: ${e}`); },
        v => assertEquals(v, [1, 2, 3])
    );
});

test('sequence Array with rejected Task -> Rejected Task', () => {
    const input = [Task.of(1), Task.rejected('error'), Task.of(3)];
    const result = sequence(arrTraversable, taskApplicative, input);

    result.fork(
        e => assertEquals(e, 'error'),
        v => { throw new Error(`Unexpected resolve: ${JSON.stringify(v)}`); }
    );
});

// === Type mismatch error ===
test('sequence throws for type mismatch', () => {
    assertThrows(
        () => sequence(arrTraversable, maybeApplicative, Maybe.Just(1)),
        'Type mismatch'
    );
});

test('sequence throws for wrong outer type', () => {
    assertThrows(
        () => sequence(maybeTraversable, arrApplicative, [1, 2, 3]),
        'Wrong outer type'
    );
});

// === Complex nested structures ===
test('sequence with single element array', () => {
    const input = [Maybe.Just(42)];
    const result = sequence(arrTraversable, maybeApplicative, input);

    assertEquals(result.isJust(), true);
    assertEquals(result.value, [42]);
});

test('sequence preserves order', () => {
    const input = [Maybe.Just('a'), Maybe.Just('b'), Maybe.Just('c')];
    const result = sequence(arrTraversable, maybeApplicative, input);

    assertEquals(result.isJust(), true);
    assertEquals(result.value, ['a', 'b', 'c']);
});

console.log('\n✅ Sequence tests completed');
