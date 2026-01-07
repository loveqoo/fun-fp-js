// Maybe Operations Tests
import fp from '../index.js';
import { test, assertEquals, assertThrows, logSection } from './utils.js';

const { Maybe, Either } = fp;

logSection('Maybe Operations');

// === Constructors ===
test('Maybe.of creates Just', () => {
    const m = Maybe.of(5);
    assertEquals(m.isJust(), true);
    assertEquals(m.value, 5);
});

test('Maybe.Just creates Just', () => {
    const m = Maybe.Just(5);
    assertEquals(m.isJust(), true);
    assertEquals(m.value, 5);
});

test('Maybe.Nothing creates Nothing', () => {
    const m = Maybe.Nothing();
    assertEquals(m.isNothing(), true);
});

// === fromNullable ===
test('Maybe.fromNullable - null returns Nothing', () => {
    assertEquals(Maybe.fromNullable(null).isNothing(), true);
});

test('Maybe.fromNullable - undefined returns Nothing', () => {
    assertEquals(Maybe.fromNullable(undefined).isNothing(), true);
});

test('Maybe.fromNullable - value returns Just', () => {
    const m = Maybe.fromNullable(5);
    assertEquals(m.isJust(), true);
    assertEquals(m.value, 5);
});

test('Maybe.fromNullable - 0 returns Just', () => {
    const m = Maybe.fromNullable(0);
    assertEquals(m.isJust(), true);
    assertEquals(m.value, 0);
});

test('Maybe.fromNullable - empty string returns Just', () => {
    const m = Maybe.fromNullable('');
    assertEquals(m.isJust(), true);
    assertEquals(m.value, '');
});

test('Maybe.fromNullable - false returns Just', () => {
    const m = Maybe.fromNullable(false);
    assertEquals(m.isJust(), true);
    assertEquals(m.value, false);
});

// === Type checks ===
test('Maybe.isMaybe - Just is Maybe', () => {
    assertEquals(Maybe.isMaybe(Maybe.Just(5)), true);
});

test('Maybe.isMaybe - Nothing is Maybe', () => {
    assertEquals(Maybe.isMaybe(Maybe.Nothing()), true);
});

test('Maybe.isMaybe - Plain value is not Maybe', () => {
    assertEquals(Maybe.isMaybe(5), false);
    assertEquals(Maybe.isMaybe(null), false);
});

test('Maybe.isJust', () => {
    assertEquals(Maybe.isJust(Maybe.Just(5)), true);
    assertEquals(Maybe.isJust(Maybe.Nothing()), false);
});

test('Maybe.isNothing', () => {
    assertEquals(Maybe.isNothing(Maybe.Nothing()), true);
    assertEquals(Maybe.isNothing(Maybe.Just(5)), false);
});

// === fold ===
test('Maybe.fold - Just applies onJust', () => {
    const result = Maybe.fold(
        () => 'nothing',
        x => `got ${x}`,
        Maybe.Just(42)
    );
    assertEquals(result, 'got 42');
});

test('Maybe.fold - Nothing applies onNothing', () => {
    const result = Maybe.fold(
        () => 'nothing',
        x => `got ${x}`,
        Maybe.Nothing()
    );
    assertEquals(result, 'nothing');
});

test('Maybe.fold - Works with no value in onNothing', () => {
    const result = Maybe.fold(
        () => 0,
        x => x * 2,
        Maybe.Nothing()
    );
    assertEquals(result, 0);
});

// === toEither ===
test('Maybe.toEither - Just becomes Right', () => {
    const result = Maybe.toEither('no value', Maybe.Just(42));
    assertEquals(result.isRight(), true);
    assertEquals(result.value, 42);
});

test('Maybe.toEither - Nothing becomes Left with default', () => {
    const result = Maybe.toEither('no value', Maybe.Nothing());
    assertEquals(result.isLeft(), true);
    assertEquals(result.value, 'no value');
});

test('Maybe.toEither - Nothing with custom error', () => {
    const result = Maybe.toEither(new Error('missing'), Maybe.Nothing());
    assertEquals(result.isLeft(), true);
    assertEquals(result.value.message, 'missing');
});

// === Edge cases ===
test('Maybe.Just with undefined value', () => {
    const m = Maybe.Just(undefined);
    assertEquals(m.isJust(), true);
    assertEquals(m.value, undefined);
});

test('Maybe.Just with null value', () => {
    const m = Maybe.Just(null);
    assertEquals(m.isJust(), true);
    assertEquals(m.value, null);
});

console.log('\n✅ Maybe tests completed');
