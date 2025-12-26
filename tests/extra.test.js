const lib = require('../index.js')();
const { extra } = lib;

const { test, assert, assertEquals } = require('./utils.js');
console.log('🚀 Starting modules/extra.js tests...\n');

// === Basic template ===
test('template - simple key', () => {
    const result = extra.template('Hello, {{name}}!', { name: 'World' });
    assertEquals(result, 'Hello, World!');
});

test('template - multiple keys', () => {
    const result = extra.template('{{greeting}}, {{name}}!', { greeting: 'Hi', name: 'Alice' });
    assertEquals(result, 'Hi, Alice!');
});

test('template - nested key', () => {
    const data = { user: { name: 'Bob' } };
    const result = extra.template('Hello, {{user.name}}!', data);
    assertEquals(result, 'Hello, Bob!');
});

test('template - deeply nested key', () => {
    const data = { a: { b: { c: { d: 'deep' } } } };
    const result = extra.template('Value: {{a.b.c.d}}', data);
    assertEquals(result, 'Value: deep');
});

// === Whitespace handling ===
test('template - leading/trailing spaces in key', () => {
    const data = { name: 'Alice' };
    const result = extra.template('Hello, {{  name  }}!', data);
    assertEquals(result, 'Hello, Alice!');
});

test('template - spaces around dots', () => {
    const data = { user: { name: 'Bob' } };
    const result = extra.template('Hello, {{ user . name }}!', data);
    assertEquals(result, 'Hello, Bob!');
});

// === Missing keys ===
test('template - missing key keeps placeholder', () => {
    const result = extra.template('Hello, {{missing}}!', { name: 'World' });
    assertEquals(result, 'Hello, {{missing}}!');
});

test('template - missing nested key keeps placeholder', () => {
    const data = { user: {} };
    const result = extra.template('Hello, {{user.name}}!', data);
    assertEquals(result, 'Hello, {{user.name}}!');
});

test('template - missing intermediate key keeps placeholder', () => {
    const data = { user: null };
    const result = extra.template('Hello, {{user.name}}!', data);
    assertEquals(result, 'Hello, {{user.name}}!');
});

// === Falsy values ===
test('template - falsy value: false', () => {
    const result = extra.template('Value: {{flag}}', { flag: false });
    assertEquals(result, 'Value: false');
});

test('template - falsy value: 0', () => {
    const result = extra.template('Value: {{count}}', { count: 0 });
    assertEquals(result, 'Value: 0');
});

test('template - falsy value: empty string', () => {
    const result = extra.template('Value: [{{name}}]', { name: '' });
    assertEquals(result, 'Value: []');
});

// === Edge cases ===
test('template - no placeholders', () => {
    const result = extra.template('No placeholders here', { name: 'test' });
    assertEquals(result, 'No placeholders here');
});

test('template - empty data object', () => {
    const result = extra.template('Hello, {{name}}!', {});
    assertEquals(result, 'Hello, {{name}}!');
});

test('template - null data', () => {
    const result = extra.template('Hello, {{name}}!', null);
    assertEquals(result, 'Hello, {{name}}!');
});

test('template - undefined data', () => {
    const result = extra.template('Hello, {{name}}!', undefined);
    assertEquals(result, 'Hello, {{name}}!');
});

test('template - array value', () => {
    const result = extra.template('Items: {{items}}', { items: [1, 2, 3] });
    assertEquals(result, 'Items: 1,2,3');
});

test('template - object value (toString)', () => {
    const result = extra.template('Obj: {{obj}}', { obj: { a: 1 } });
    assertEquals(result, 'Obj: [object Object]');
});

// === Complex scenarios ===
test('template - mixed valid and invalid keys', () => {
    const data = { name: 'Alice', age: 30 };
    const result = extra.template('{{name}} is {{age}} years old, works at {{company}}', data);
    assertEquals(result, 'Alice is 30 years old, works at {{company}}');
});

test('template - repeated keys', () => {
    const result = extra.template('{{x}} + {{x}} = {{x}}{{x}}', { x: 2 });
    assertEquals(result, '2 + 2 = 22');
});

test('template - special characters in value', () => {
    const result = extra.template('Code: {{code}}', { code: '<script>alert("xss")</script>' });
    assertEquals(result, 'Code: <script>alert("xss")</script>');
});

console.log('\n🛡️ Starting Boundary and Error tests...');

test('template - empty string template', () => {
    const result = extra.template('', { name: 'test' });
    assertEquals(result, '');
});

test('template - unclosed braces', () => {
    const result = extra.template('Hello, {{name', { name: 'World' });
    assertEquals(result, 'Hello, {{name'); // Not a valid placeholder
});

test('template - triple braces not matched', () => {
    const result = extra.template('Hello, {{{name}}}', { name: 'World' });
    // Triple braces don't match the {{...}} pattern
    assertEquals(result, 'Hello, {{{name}}}');
});
