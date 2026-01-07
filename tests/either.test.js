// Either Operations Tests
import fp from '../index.js';
import { test, assertEquals, assertThrows, logSection } from './utils.js';

const { Either, Maybe } = fp;

logSection('Either Operations');

// === Constructors ===
test('Either.of creates Right', () => {
    const e = Either.of(5);
    assertEquals(e.isRight(), true);
    assertEquals(e.value, 5);
});

test('Either.Right creates Right', () => {
    const e = Either.Right(5);
    assertEquals(e.isRight(), true);
    assertEquals(e.value, 5);
});

test('Either.Left creates Left', () => {
    const e = Either.Left('error');
    assertEquals(e.isLeft(), true);
    assertEquals(e.value, 'error');
});

// === Type checks ===
test('Either.isEither - Right is Either', () => {
    assertEquals(Either.isEither(Either.Right(5)), true);
});

test('Either.isEither - Left is Either', () => {
    assertEquals(Either.isEither(Either.Left('error')), true);
});

test('Either.isEither - Plain value is not Either', () => {
    assertEquals(Either.isEither(5), false);
    assertEquals(Either.isEither(null), false);
});

test('Either.isRight', () => {
    assertEquals(Either.isRight(Either.Right(5)), true);
    assertEquals(Either.isRight(Either.Left('error')), false);
});

test('Either.isLeft', () => {
    assertEquals(Either.isLeft(Either.Left('error')), true);
    assertEquals(Either.isLeft(Either.Right(5)), false);
});

// === fold ===
test('Either.fold - Right applies onRight', () => {
    const result = Either.fold(
        e => `error: ${e}`,
        v => `success: ${v}`,
        Either.Right(42)
    );
    assertEquals(result, 'success: 42');
});

test('Either.fold - Left applies onLeft', () => {
    const result = Either.fold(
        e => `error: ${e}`,
        v => `success: ${v}`,
        Either.Left('oops')
    );
    assertEquals(result, 'error: oops');
});

test('Either.fold - Left with Error object', () => {
    const result = Either.fold(
        e => e.message,
        v => v,
        Either.Left(new Error('something went wrong'))
    );
    assertEquals(result, 'something went wrong');
});

// === catch ===
test('Either.catch - Success returns Right', () => {
    const result = Either.catch(() => 42);
    assertEquals(result.isRight(), true);
    assertEquals(result.value, 42);
});

test('Either.catch - Thrown error returns Left', () => {
    const result = Either.catch(() => {
        throw new Error('boom');
    });
    assertEquals(result.isLeft(), true);
    assertEquals(result.value.message, 'boom');
});

test('Either.catch - JSON parse success', () => {
    const result = Either.catch(() => JSON.parse('{"a": 1}'));
    assertEquals(result.isRight(), true);
    assertEquals(result.value.a, 1);
});

test('Either.catch - JSON parse failure', () => {
    const result = Either.catch(() => JSON.parse('invalid json'));
    assertEquals(result.isLeft(), true);
    assertEquals(result.value instanceof SyntaxError, true);
});

test('Either.catch - Can throw non-Error values', () => {
    const result = Either.catch(() => {
        throw 'string error';
    });
    assertEquals(result.isLeft(), true);
    assertEquals(result.value, 'string error');
});

// === toMaybe ===
test('Either.toMaybe - Right becomes Just', () => {
    const result = Either.toMaybe(Either.Right(42));
    assertEquals(result.isJust(), true);
    assertEquals(result.value, 42);
});

test('Either.toMaybe - Left becomes Nothing', () => {
    const result = Either.toMaybe(Either.Left('error'));
    assertEquals(result.isNothing(), true);
});

test('Either.toMaybe - Left value is lost', () => {
    const result = Either.toMaybe(Either.Left('important error'));
    assertEquals(result.isNothing(), true);
    // Note: 'important error' is lost
});

// === Edge cases ===
test('Either.Right with undefined value', () => {
    const e = Either.Right(undefined);
    assertEquals(e.isRight(), true);
    assertEquals(e.value, undefined);
});

test('Either.Left with undefined value', () => {
    const e = Either.Left(undefined);
    assertEquals(e.isLeft(), true);
    assertEquals(e.value, undefined);
});

test('Either.Right with null value', () => {
    const e = Either.Right(null);
    assertEquals(e.isRight(), true);
    assertEquals(e.value, null);
});

// === Conversion roundtrip ===
test('Right -> Just -> Right roundtrip preserves value', () => {
    const original = Either.Right(42);
    const maybe = Either.toMaybe(original);
    const back = Maybe.toEither('default', maybe);
    assertEquals(back.isRight(), true);
    assertEquals(back.value, 42);
});

test('Left -> Nothing -> Left uses default', () => {
    const original = Either.Left('original error');
    const maybe = Either.toMaybe(original);
    const back = Maybe.toEither('new error', maybe);
    assertEquals(back.isLeft(), true);
    assertEquals(back.value, 'new error'); // original error lost
});

console.log('\n✅ Either tests completed');
