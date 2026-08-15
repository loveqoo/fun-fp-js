// Applicative Laws Tests
import fp from '../index.js';
import { test, assertEquals, logSection } from './utils.js';

const { Applicative, Maybe, Either, Task } = fp;

logSection('Applicative Laws');

// Helper functions
const id = x => x;
const f = x => x + 1;

// === Array Applicative ===
const arrApplicative = Applicative.lookup('array');

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
const maybeApplicative = Applicative.lookup('maybe');

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
const eitherApplicative = Applicative.lookup('either');

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
const taskApplicative = Applicative.lookup('task');

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

logSection('Const — 캐리어의 모양');

// 담는 모양이 있으면 클래스로 선언한다 — 객체 리터럴은 모양을 말하지 않는다(소유자, 2026-08-15).
test('Const - 캐리어는 클래스다', () => {
    const C = fp.Applicative.Const('array');
    const c = C.wrap([1]);
    assertEquals(c.constructor.name, 'Const', '객체 리터럴이면 Object 가 나온다');
    assertEquals(JSON.stringify(c.value), '[1]');
    // 태그는 모노이드마다 다르지만 클래스는 하나다 — Just/Nothing 의 반대 모양이다.
    assertEquals(c._typeName, 'Const(array)');
    assertEquals(fp.Applicative.Const('number').wrap(1)._typeName, 'Const(number)');
});

test('Const - 모노이드가 다르면 섞이지 않는다', () => {
    const C = fp.Applicative.Const('array');
    let message = '(안 던짐)';
    try { C.ap(C.wrap([1]), fp.Applicative.Const('number').wrap(2)); } catch (e) { message = e.message; }
    assertEquals(message, 'Apply.ap: both arguments must be Const(array)');
});

console.log('\n✅ Applicative tests completed');
