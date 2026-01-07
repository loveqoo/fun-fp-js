// Setoid Laws Tests
import fp from '../index.js';
import { test, assertEquals, logSection } from './utils.js';

const { Setoid } = fp;

logSection('Setoid Laws');

// === Number Setoid ===
const numSetoid = Setoid.of('number');

test('Number Setoid - Reflexivity: equals(a, a) === true', () => {
    assertEquals(numSetoid.equals(5, 5), true);
    assertEquals(numSetoid.equals(0, 0), true);
    assertEquals(numSetoid.equals(-3.14, -3.14), true);
});

test('Number Setoid - Symmetry: equals(a, b) === equals(b, a)', () => {
    assertEquals(numSetoid.equals(1, 2), numSetoid.equals(2, 1));
    assertEquals(numSetoid.equals(5, 5), numSetoid.equals(5, 5));
});

test('Number Setoid - Transitivity: equals(a, b) && equals(b, c) => equals(a, c)', () => {
    const a = 42, b = 42, c = 42;
    if (numSetoid.equals(a, b) && numSetoid.equals(b, c)) {
        assertEquals(numSetoid.equals(a, c), true);
    }
});

// === String Setoid ===
const strSetoid = Setoid.of('string');

test('String Setoid - Reflexivity', () => {
    assertEquals(strSetoid.equals('hello', 'hello'), true);
    assertEquals(strSetoid.equals('', ''), true);
});

test('String Setoid - Symmetry', () => {
    assertEquals(strSetoid.equals('a', 'b'), strSetoid.equals('b', 'a'));
});

test('String Setoid - Transitivity', () => {
    const a = 'x', b = 'x', c = 'x';
    if (strSetoid.equals(a, b) && strSetoid.equals(b, c)) {
        assertEquals(strSetoid.equals(a, c), true);
    }
});

// === Boolean Setoid ===
const boolSetoid = Setoid.of('boolean');

test('Boolean Setoid - Reflexivity', () => {
    assertEquals(boolSetoid.equals(true, true), true);
    assertEquals(boolSetoid.equals(false, false), true);
});

test('Boolean Setoid - Symmetry', () => {
    assertEquals(boolSetoid.equals(true, false), boolSetoid.equals(false, true));
});

// === Date Setoid ===
const dateSetoid = Setoid.of('date');

test('Date Setoid - Reflexivity', () => {
    const d = new Date('2024-01-01');
    assertEquals(dateSetoid.equals(d, d), true);
});

test('Date Setoid - Symmetry', () => {
    const d1 = new Date('2024-01-01');
    const d2 = new Date('2024-01-02');
    assertEquals(dateSetoid.equals(d1, d2), dateSetoid.equals(d2, d1));
});

test('Date Setoid - Equal dates by value', () => {
    const d1 = new Date('2024-01-01');
    const d2 = new Date('2024-01-01');
    assertEquals(dateSetoid.equals(d1, d2), true);
});

// === Default Setoid (reference equality) ===
const defaultSetoid = Setoid.of('default');

test('Default Setoid - Reference equality', () => {
    assertEquals(defaultSetoid.equals(1, 1), true);
    assertEquals(defaultSetoid.equals(1, 2), false);
    const obj = { a: 1 };
    assertEquals(defaultSetoid.equals(obj, obj), true);
});

console.log('\n✅ Setoid tests completed');
