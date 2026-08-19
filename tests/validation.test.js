// Validation Tests
import fp from '../index.js';
import { test, assertEquals, logSection, assertThrows } from './utils.js';

const { Validation, Either } = fp;

logSection('Validation Operations');

// === Constructors ===
test('Validation.of creates Valid', () => {
    const v = Validation.of(5);
    assertEquals(v.isValid(), true);
    assertEquals(v.value, 5);
});

test('Validation.Valid creates Valid', () => {
    const v = Validation.Valid(5);
    assertEquals(v.isValid(), true);
    assertEquals(v.value, 5);
});

test('Validation.Invalid creates Invalid with array', () => {
    const v = Validation.Invalid(['error']);
    assertEquals(v.isInvalid(), true);
    assertEquals(v.errors.length, 1);
    assertEquals(v.errors[0], 'error');
});

test('Validation.Invalid stores errors as-is (no normalization)', () => {
    const v = Validation.Invalid('single error');
    assertEquals(v.errors, 'single error'); // string, not array
});

test('Validation.Invalid keeps array as-is', () => {
    const v = Validation.Invalid(['error1', 'error2']);
    assertEquals(v.errors, ['error1', 'error2']);
});

// === Type checks ===
test('Validation.isValidation - Valid is Validation', () => {
    assertEquals(Validation.isValidation(Validation.Valid(5)), true);
});

test('Validation.isValidation - Invalid is Validation', () => {
    assertEquals(Validation.isValidation(Validation.Invalid(['error'])), true);
});

test('Validation.isValidation - Plain value is not Validation', () => {
    assertEquals(Validation.isValidation(5), false);
    assertEquals(Validation.isValidation(null), false);
});

test('Validation.isValid', () => {
    assertEquals(Validation.isValid(Validation.Valid(5)), true);
    assertEquals(Validation.isValid(Validation.Invalid(['error'])), false);
});

test('Validation.isInvalid', () => {
    assertEquals(Validation.isInvalid(Validation.Invalid(['error'])), true);
    assertEquals(Validation.isInvalid(Validation.Valid(5)), false);
});

// === Functor (map) ===
test('Validation.map - Valid applies function', () => {
    const result = Validation.map(x => x * 2, Validation.Valid(5));
    assertEquals(result.isValid(), true);
    assertEquals(result.value, 10);
});

test('Validation.map - Invalid ignores function', () => {
    const result = Validation.map(x => x * 2, Validation.Invalid(['error']));
    assertEquals(result.isInvalid(), true);
    assertEquals(result.errors, ['error']);
});

test('Valid instance method map', () => {
    const result = Validation.Valid(5).map(x => x * 2);
    assertEquals(result.value, 10);
});

// === Apply (ap) - Error Accumulation ===
test('Validation.ap - Both Valid', () => {
    const vf = Validation.Valid(x => x * 2);
    const va = Validation.Valid(5);
    const result = Validation.ap(vf, va);
    assertEquals(result.isValid(), true);
    assertEquals(result.value, 10);
});

test('Validation.ap - First Invalid', () => {
    const vf = Validation.Invalid(['error1']);
    const va = Validation.Valid(5);
    const result = Validation.ap(vf, va);
    assertEquals(result.isInvalid(), true);
    assertEquals(result.errors, ['error1']);
});

test('Validation.ap - Second Invalid', () => {
    const vf = Validation.Valid(x => x * 2);
    const va = Validation.Invalid(['error2']);
    const result = Validation.ap(vf, va);
    assertEquals(result.isInvalid(), true);
    assertEquals(result.errors, ['error2']);
});

test('Validation.ap - Both Invalid accumulates errors', () => {
    const vf = Validation.Invalid(['error1']);
    const va = Validation.Invalid(['error2']);
    const result = Validation.ap(vf, va);
    assertEquals(result.isInvalid(), true);
    assertEquals(result.errors, ['error1', 'error2']);
});

test('Validation.ap - Multiple error accumulation', () => {
    const vf = Validation.Invalid(['error1', 'error2']);
    const va = Validation.Invalid(['error3']);
    const result = Validation.ap(vf, va);
    assertEquals(result.errors, ['error1', 'error2', 'error3']);
});

// === fold ===
test('Validation.fold - Valid applies onValid', () => {
    const result = Validation.fold(
        errs => `errors: ${errs.join(', ')}`,
        v => `success: ${v}`,
        Validation.Valid(42)
    );
    assertEquals(result, 'success: 42');
});

test('Validation.fold - Invalid applies onInvalid', () => {
    const result = Validation.fold(
        errs => `errors: ${errs.join(', ')}`,
        v => `success: ${v}`,
        Validation.Invalid(['oops', 'fail'])
    );
    assertEquals(result, 'errors: oops, fail');
});

// === Either Conversion ===
test('Validation.fromEither - Right becomes Valid', () => {
    const result = Validation.fromEither(Either.Right(42));
    assertEquals(result.isValid(), true);
    assertEquals(result.value, 42);
});

test('Validation.fromEither - Left becomes Invalid', () => {
    const result = Validation.fromEither(Either.Left(['error']));
    assertEquals(result.isInvalid(), true);
    assertEquals(result.errors, ['error']);
});

test('Valid.toEither returns Right', () => {
    const result = Validation.Valid(42).toEither();
    assertEquals(Either.isRight(result), true);
    assertEquals(result.value, 42);
});

test('Invalid.toEither returns Left with error array', () => {
    const result = Validation.Invalid(['err1', 'err2']).toEither();
    assertEquals(Either.isLeft(result), true);
    assertEquals(result.value, ['err1', 'err2']);
});

// === Validation.collect ===
test('Validation.collect - All pass returns Valid', () => {
    const validateName = name => name.length >= 2
        ? Either.Right(name)
        : Either.Left('Name too short');

    const validateAge = age => age >= 18
        ? Either.Right(age)
        : Either.Left('Must be 18+');

    const validateUser = Validation.collect(
        validateName,
        validateAge
    )((name, age) => ({ name, age }));

    const result = validateUser('Kim', 20);
    assertEquals(result.isValid(), true);
    assertEquals(result.value.name, 'Kim');
    assertEquals(result.value.age, 20);
});

test('Validation.collect - All fail accumulates errors', () => {
    const validateName = name => name.length >= 2
        ? Either.Right(name)
        : Either.Left('Name too short');

    const validateAge = age => age >= 18
        ? Either.Right(age)
        : Either.Left('Must be 18+');

    const validateUser = Validation.collect(
        validateName,
        validateAge
    )((name, age) => ({ name, age }));

    const result = validateUser('K', 15);
    assertEquals(result.isInvalid(), true);
    assertEquals(result.errors.length, 2);
    assertEquals(result.errors[0], 'Name too short');
    assertEquals(result.errors[1], 'Must be 18+');
});

test('Validation.collect - Partial fail', () => {
    const validateName = name => name.length >= 2
        ? Either.Right(name)
        : Either.Left('Name too short');

    const validateAge = age => age >= 18
        ? Either.Right(age)
        : Either.Left('Must be 18+');

    const validateUser = Validation.collect(
        validateName,
        validateAge
    )((name, age) => ({ name, age }));

    const result = validateUser('Kim', 15);
    assertEquals(result.isInvalid(), true);
    assertEquals(result.errors, ['Must be 18+']); // single element array from Either.Left
});

test('Validation.collect - Empty validators', () => {
    const result = Validation.collect()(() => 'done')();
    assertEquals(result.isValid(), true);
    assertEquals(result.value, 'done');
});

// === Bifunctor ===
test('Validation.bimap - Valid applies right function', () => {
    const result = Validation.bimap(
        errs => errs.map(e => e.toUpperCase()),
        v => v * 2,
        Validation.Valid(5)
    );
    assertEquals(result.isValid(), true);
    assertEquals(result.value, 10);
});

test('Validation.bimap - Invalid applies left function', () => {
    const result = Validation.bimap(
        errs => errs.map(e => e.toUpperCase()),
        v => v * 2,
        Validation.Invalid(['error'])
    );
    assertEquals(result.isInvalid(), true);
    assertEquals(result.errors, ['ERROR']);
});

// === Foldable ===
test('Validation.reduce - Valid folds value', () => {
    const result = Validation.reduce((acc, x) => acc + x, 10, Validation.Valid(5));
    assertEquals(result, 15);
});

test('Validation.reduce - Invalid returns initial', () => {
    const result = Validation.reduce((acc, x) => acc + x, 10, Validation.Invalid(['error']));
    assertEquals(result, 10);
});

console.log('\n✅ Validation tests completed');

// Invalid 둘이 다른 모노이드를 들고 있으면 왼쪽을 조용히 채택했다(코덱스 리뷰 ③) — 거부한다.
test('Validation.ap - 다른 모노이드의 Invalid 둘은 거부된다', () => {
    const sum = fp.Monoid.lookup('number');
    const product = fp.Monoid.types.NumberProductMonoid;
    assertThrows(() => fp.Validation.ap(fp.Validation.Invalid(2, sum), fp.Validation.Invalid(3, product)), '모노이드를 섞었다');
    assertEquals(fp.Validation.ap(fp.Validation.Invalid(['a']), fp.Validation.Invalid(['b'])).errors.join(','), 'a,b');
});

// 6차 감사 [5] — Maybe 와 같은 자리. 심볼을 Valid/Invalid 로 내렸다.
test('6차-5: 기반 클래스를 직접 만든 값은 Validation 이 아니다', () => {
    const impossible = new fp.Validation();
    assertEquals(fp.Validation.isValidation(impossible), false);
    assertEquals(fp.Validation.isValidation(fp.Validation.Valid(1)), true);
    assertEquals(fp.Validation.isValidation(fp.Validation.Invalid(['e'])), true);
});
