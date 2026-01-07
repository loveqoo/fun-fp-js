// Applicative Laws Tests
import fp from '../index.js';
import { test, assertEquals, logSection } from './utils.js';

const { Applicative, Maybe, Either, Task } = fp;

logSection('Applicative Laws');

// Helper functions
const id = x => x;
const f = x => x + 1;

// === Array Applicative ===
const arrApplicative = Applicative.of('array');

test('Array Applicative - Identity: ap(of(x => x), v) === v', () => {
    const v = [1, 2, 3];
    assertEquals(arrApplicative.ap(arrApplicative.of(id), v), v);
});

test('Array Applicative - Homomorphism: ap(of(f), of(x)) === of(f(x))', () => {
    const x = 5;
    assertEquals(
        arrApplicative.ap(arrApplicative.of(f), arrApplicative.of(x)),
        arrApplicative.of(f(x))
    );
});

test('Array Applicative - Interchange: ap(u, of(y)) === ap(of(f => f(y)), u)', () => {
    const u = [x => x + 1, x => x * 2];
    const y = 5;
    assertEquals(
        arrApplicative.ap(u, arrApplicative.of(y)),
        arrApplicative.ap(arrApplicative.of(fn => fn(y)), u)
    );
});

// === Maybe Applicative ===
const maybeApplicative = Applicative.of('maybe');

test('Maybe Applicative - Identity (Just)', () => {
    const v = Maybe.Just(5);
    const result = maybeApplicative.ap(maybeApplicative.of(id), v);
    assertEquals(result.isJust(), true);
    assertEquals(result.value, v.value);
});

test('Maybe Applicative - Identity (Nothing)', () => {
    const v = Maybe.Nothing();
    const result = maybeApplicative.ap(maybeApplicative.of(id), v);
    assertEquals(result.isNothing(), true);
});

test('Maybe Applicative - Homomorphism', () => {
    const x = 5;
    const left = maybeApplicative.ap(maybeApplicative.of(f), maybeApplicative.of(x));
    const right = maybeApplicative.of(f(x));
    assertEquals(left.value, right.value);
});

test('Maybe Applicative - Interchange', () => {
    const u = Maybe.Just(x => x * 2);
    const y = 5;
    const left = maybeApplicative.ap(u, maybeApplicative.of(y));
    const right = maybeApplicative.ap(maybeApplicative.of(fn => fn(y)), u);
    assertEquals(left.value, right.value);
});

// === Either Applicative ===
const eitherApplicative = Applicative.of('either');

test('Either Applicative - Identity (Right)', () => {
    const v = Either.Right(5);
    const result = eitherApplicative.ap(eitherApplicative.of(id), v);
    assertEquals(result.isRight(), true);
    assertEquals(result.value, v.value);
});

test('Either Applicative - Identity (Left)', () => {
    const v = Either.Left('error');
    const result = eitherApplicative.ap(eitherApplicative.of(id), v);
    assertEquals(result.isLeft(), true);
    assertEquals(result.value, v.value);
});

test('Either Applicative - Homomorphism', () => {
    const x = 5;
    const left = eitherApplicative.ap(eitherApplicative.of(f), eitherApplicative.of(x));
    const right = eitherApplicative.of(f(x));
    assertEquals(left.value, right.value);
});

// === Task Applicative ===
const taskApplicative = Applicative.of('task');

test('Task Applicative - Identity', () => {
    const v = Task.of(5);
    const result = taskApplicative.ap(taskApplicative.of(id), v);
    result.fork(
        e => { throw new Error(`Unexpected rejection: ${e}`); },
        val => assertEquals(val, 5)
    );
});

test('Task Applicative - Homomorphism', () => {
    const x = 5;
    const left = taskApplicative.ap(taskApplicative.of(f), taskApplicative.of(x));
    const right = taskApplicative.of(f(x));

    let leftVal, rightVal;
    left.fork(_ => { }, v => { leftVal = v; });
    right.fork(_ => { }, v => { rightVal = v; });

    assertEquals(leftVal, rightVal);
});

console.log('\n✅ Applicative tests completed');
