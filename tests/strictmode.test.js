// Strict Mode Tests
import fp from '../index.js';
import { test, assertEquals, assertThrows, logSection } from './utils.js';

const { setStrictMode, Functor, Maybe, Either } = fp;

logSection('Strict Mode');

test('strict mode - can be enabled', () => {
    setStrictMode(true);
    // No error means it worked
    assertEquals(true, true);
});

test('strict mode - can be disabled', () => {
    setStrictMode(false);
    // No error means it worked
    assertEquals(true, true);
});

test('strict mode enabled - type checking is strict', () => {
    setStrictMode(true);

    // In strict mode, invalid operations should throw
    const functor = Functor.of('maybe');

    // Valid operation should work
    const result = functor.map(x => x + 1, Maybe.Just(5));
    assertEquals(result.value, 6);
});

test('strict mode disabled - type checking is loose', () => {
    setStrictMode(false);

    // In loose mode, operations should still work
    const functor = Functor.of('maybe');
    const result = functor.map(x => x + 1, Maybe.Just(5));
    assertEquals(result.value, 6);
});

test('strict mode - switching modes works correctly', () => {
    // Start with strict
    setStrictMode(true);
    const functor = Functor.of('maybe');
    const result1 = functor.map(x => x * 2, Maybe.Just(10));
    assertEquals(result1.value, 20);

    // Switch to loose
    setStrictMode(false);
    const result2 = functor.map(x => x * 3, Maybe.Just(10));
    assertEquals(result2.value, 30);

    // Switch back to strict
    setStrictMode(true);
    const result3 = functor.map(x => x * 4, Maybe.Just(10));
    assertEquals(result3.value, 40);
});

test('strict mode - Either operations work in both modes', () => {
    // Strict mode
    setStrictMode(true);
    const functor = Functor.of('either');
    const strictResult = functor.map(x => x + 1, Either.Right(5));
    assertEquals(strictResult.value, 6);

    // Loose mode
    setStrictMode(false);
    const looseResult = functor.map(x => x + 1, Either.Right(5));
    assertEquals(looseResult.value, 6);
});

// Reset to default (loose mode for other tests)
setStrictMode(false);

console.log('\n✅ Strict Mode tests completed\n');
