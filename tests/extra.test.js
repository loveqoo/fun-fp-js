// Extra utilities tests (path, template)
import fp from '../index.js';
import { test, assertEquals, assert, logSection, assertThrows } from './utils.js';

const { extra, Either } = fp;
const { path, template } = extra;

logSection('path - Safe Object Access');

test('path - accesses nested property', () => {
    const data = { user: { name: 'Alice', age: 30 } };
    const result = path('user.name')(data);
    assert(Either.isRight(result), 'should be Right');
    assertEquals(result.value, 'Alice');
});

test('path - accesses deeply nested property', () => {
    const data = { a: { b: { c: { d: 42 } } } };
    const result = path('a.b.c.d')(data);
    assert(Either.isRight(result), 'should be Right');
    assertEquals(result.value, 42);
});

test('path - returns Left for missing property', () => {
    const data = { user: { name: 'Alice' } };
    const result = path('user.email')(data);
    assert(Either.isLeft(result), 'should be Left for missing property');
});

test('path - returns Left for null data', () => {
    const result = path('user.name')(null);
    assert(Either.isLeft(result), 'should be Left for null');
});

test('path - returns Left for undefined data', () => {
    const result = path('user.name')(undefined);
    assert(Either.isLeft(result), 'should be Left for undefined');
});

test('path - handles array indices', () => {
    const data = { items: [10, 20, 30] };
    const result = path('items.1')(data);
    assert(Either.isRight(result), 'should be Right');
    assertEquals(result.value, 20);
});

test('path - trims whitespace in keys', () => {
    const data = { user: { name: 'Alice' } };
    const result = path(' user . name ')(data);
    assert(Either.isRight(result), 'should be Right');
    assertEquals(result.value, 'Alice');
});

test('path - single key access', () => {
    const data = { name: 'Bob' };
    const result = path('name')(data);
    assert(Either.isRight(result), 'should be Right');
    assertEquals(result.value, 'Bob');
});

logSection('template - String Interpolation');

test('template - replaces single placeholder', () => {
    const result = template('Hello, {{name}}!', { name: 'World' });
    assertEquals(result, 'Hello, World!');
});

test('template - replaces multiple placeholders', () => {
    const result = template('{{greeting}}, {{name}}!', { greeting: 'Hi', name: 'Alice' });
    assertEquals(result, 'Hi, Alice!');
});

test('template - replaces nested path placeholders', () => {
    const data = { user: { firstName: 'John', lastName: 'Doe' } };
    const result = template('Name: {{user.firstName}} {{user.lastName}}', data);
    assertEquals(result, 'Name: John Doe');
});

test('template - keeps placeholder for missing data', () => {
    const result = template('Email: {{user.email}}', { user: { name: 'Alice' } });
    assertEquals(result, 'Email: {{user.email}}');
});

test('template - handles mixed found and missing', () => {
    const data = { name: 'Bob' };
    const result = template('Hello {{name}}, your email is {{email}}', data);
    assertEquals(result, 'Hello Bob, your email is {{email}}');
});

test('template - no placeholders returns original', () => {
    const result = template('No placeholders here', { name: 'Alice' });
    assertEquals(result, 'No placeholders here');
});

test('template - empty data object', () => {
    const result = template('Hello {{name}}', {});
    assertEquals(result, 'Hello {{name}}');
});

test('template - deeply nested path', () => {
    const data = { a: { b: { c: 'deep value' } } };
    const result = template('Value: {{a.b.c}}', data);
    assertEquals(result, 'Value: deep value');
});

test('template - handles null/undefined data gracefully', () => {
    const result = template('Hello {{name}}', null);
    assertEquals(result, 'Hello {{name}}');
});

logSection('Either.fromNullable');

test('Either.fromNullable - returns Right for value', () => {
    const result = Either.fromNullable(42);
    assert(Either.isRight(result), 'should be Right');
    assertEquals(result.value, 42);
});

test('Either.fromNullable - returns Left for null', () => {
    const result = Either.fromNullable(null);
    assert(Either.isLeft(result), 'should be Left');
});

test('Either.fromNullable - returns Left for undefined', () => {
    const result = Either.fromNullable(undefined);
    assert(Either.isLeft(result), 'should be Left');
});

test('Either.fromNullable - returns Right for 0', () => {
    const result = Either.fromNullable(0);
    assert(Either.isRight(result), 'should be Right for 0');
    assertEquals(result.value, 0);
});

test('Either.fromNullable - returns Right for empty string', () => {
    const result = Either.fromNullable('');
    assert(Either.isRight(result), 'should be Right for empty string');
    assertEquals(result.value, '');
});

test('Either.fromNullable - returns Right for false', () => {
    const result = Either.fromNullable(false);
    assert(Either.isRight(result), 'should be Right for false');
    assertEquals(result.value, false);
});

// 상속 프로퍼티(toString·constructor)는 "찾음" 이 아니다(코덱스 2차 ④).
test('path - 상속 프로퍼티는 Left 로 처리한다', () => {
    assertEquals(fp.Either.isRight(fp.extra.path('x')({ x: 1 })), true);        // own 은 찾음
    assertEquals(fp.Either.isRight(fp.extra.path('toString')({})), false);      // 상속은 못 찾음
    assertEquals(fp.Either.fold(() => 'L', v => v, fp.extra.path('a.b')({ a: { b: 7 } })), 7);  // 중첩 own 은 그대로
});

console.log('\n✅ Extra utilities tests completed\n');
