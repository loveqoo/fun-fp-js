// Functor Laws Tests
import fp from '../index.js';
import { test, assertEquals, assertDeepEquals, deepEquals, logSection } from './utils.js';

const { Functor, Maybe, Either, Task } = fp;

logSection('Functor Laws');

// Helper functions
const id = x => x;
const f = x => x + 1;
const g = x => x * 2;

// === Array Functor ===
const arrFunctor = Functor.of('array');

test('Array Functor - Identity: map(x => x, u) === u', () => {
    const u = [1, 2, 3];
    assertEquals(arrFunctor.map(id, u), u);
});

test('Array Functor - Composition: map(x => f(g(x)), u) === map(f, map(g, u))', () => {
    const u = [1, 2, 3];
    assertEquals(
        arrFunctor.map(x => f(g(x)), u),
        arrFunctor.map(f, arrFunctor.map(g, u))
    );
});

// === Maybe Functor ===
const maybeFunctor = Functor.of('maybe');

test('Maybe Functor - Identity (Just)', () => {
    const u = Maybe.Just(5);
    const result = maybeFunctor.map(id, u);
    assertEquals(result.isJust(), true);
    assertEquals(result.value, u.value);
});

test('Maybe Functor - Identity (Nothing)', () => {
    const u = Maybe.Nothing();
    const result = maybeFunctor.map(id, u);
    assertEquals(result.isNothing(), true);
});

test('Maybe Functor - Composition (Just)', () => {
    const u = Maybe.Just(5);
    const left = maybeFunctor.map(x => f(g(x)), u);
    const right = maybeFunctor.map(f, maybeFunctor.map(g, u));
    assertEquals(left.value, right.value);
});

test('Maybe Functor - Composition (Nothing)', () => {
    const u = Maybe.Nothing();
    const left = maybeFunctor.map(x => f(g(x)), u);
    const right = maybeFunctor.map(f, maybeFunctor.map(g, u));
    assertEquals(left.isNothing(), true);
    assertEquals(right.isNothing(), true);
});

// === Either Functor ===
const eitherFunctor = Functor.of('either');

test('Either Functor - Identity (Right)', () => {
    const u = Either.Right(5);
    const result = eitherFunctor.map(id, u);
    assertEquals(result.isRight(), true);
    assertEquals(result.value, u.value);
});

test('Either Functor - Identity (Left)', () => {
    const u = Either.Left('error');
    const result = eitherFunctor.map(id, u);
    assertEquals(result.isLeft(), true);
    assertEquals(result.value, u.value);
});

test('Either Functor - Composition (Right)', () => {
    const u = Either.Right(5);
    const left = eitherFunctor.map(x => f(g(x)), u);
    const right = eitherFunctor.map(f, eitherFunctor.map(g, u));
    assertEquals(left.value, right.value);
});

test('Either Functor - Composition (Left)', () => {
    const u = Either.Left('error');
    const left = eitherFunctor.map(x => f(g(x)), u);
    const right = eitherFunctor.map(f, eitherFunctor.map(g, u));
    assertEquals(left.isLeft(), true);
    assertEquals(right.isLeft(), true);
});

// === Task Functor (async) ===
const taskFunctor = Functor.of('task');

test('Task Functor - Identity', () => {
    const u = Task.of(5);
    const result = taskFunctor.map(id, u);
    result.fork(
        e => { throw new Error(`Unexpected rejection: ${e}`); },
        v => assertEquals(v, 5)
    );
});

test('Task Functor - Composition', () => {
    const u = Task.of(5);
    const left = taskFunctor.map(x => f(g(x)), u);
    const right = taskFunctor.map(f, taskFunctor.map(g, u));

    let leftVal, rightVal;
    left.fork(_ => { }, v => { leftVal = v; });
    right.fork(_ => { }, v => { rightVal = v; });

    assertEquals(leftVal, rightVal);
});

console.log('\n✅ Functor tests completed');
