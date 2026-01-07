// Ord Laws Tests
import fp from '../index.js';
import { test, assertEquals, logSection } from './utils.js';

const { Ord, Setoid } = fp;

logSection('Ord Laws');

// === Number Ord ===
const numOrd = Ord.of('number');
const numSetoid = Setoid.of('number');

test('Number Ord - Totality: lte(a, b) || lte(b, a)', () => {
    assertEquals(numOrd.lte(1, 2) || numOrd.lte(2, 1), true);
    assertEquals(numOrd.lte(5, 5) || numOrd.lte(5, 5), true);
    assertEquals(numOrd.lte(-1, 1) || numOrd.lte(1, -1), true);
});

test('Number Ord - Antisymmetry: lte(a, b) && lte(b, a) => equals(a, b)', () => {
    const a = 5, b = 5;
    if (numOrd.lte(a, b) && numOrd.lte(b, a)) {
        assertEquals(numSetoid.equals(a, b), true);
    }
});

test('Number Ord - Transitivity: lte(a, b) && lte(b, c) => lte(a, c)', () => {
    const a = 1, b = 2, c = 3;
    if (numOrd.lte(a, b) && numOrd.lte(b, c)) {
        assertEquals(numOrd.lte(a, c), true);
    }
});

// === String Ord ===
const strOrd = Ord.of('string');

test('String Ord - Totality', () => {
    assertEquals(strOrd.lte('a', 'b') || strOrd.lte('b', 'a'), true);
    assertEquals(strOrd.lte('abc', 'abc'), true);
});

test('String Ord - Transitivity', () => {
    const a = 'a', b = 'b', c = 'c';
    if (strOrd.lte(a, b) && strOrd.lte(b, c)) {
        assertEquals(strOrd.lte(a, c), true);
    }
});

// === Date Ord ===
const dateOrd = Ord.of('date');

test('Date Ord - Totality', () => {
    const d1 = new Date('2024-01-01');
    const d2 = new Date('2024-01-02');
    assertEquals(dateOrd.lte(d1, d2) || dateOrd.lte(d2, d1), true);
});

test('Date Ord - Transitivity', () => {
    const d1 = new Date('2024-01-01');
    const d2 = new Date('2024-06-01');
    const d3 = new Date('2024-12-31');
    if (dateOrd.lte(d1, d2) && dateOrd.lte(d2, d3)) {
        assertEquals(dateOrd.lte(d1, d3), true);
    }
});

test('Date Ord - Equal dates', () => {
    const d1 = new Date('2024-01-01');
    const d2 = new Date('2024-01-01');
    assertEquals(dateOrd.lte(d1, d2), true);
    assertEquals(dateOrd.lte(d2, d1), true);
});

// === Default Ord ===
const defaultOrd = Ord.of('default');

test('Default Ord - Uses <= operator', () => {
    assertEquals(defaultOrd.lte(1, 2), true);
    assertEquals(defaultOrd.lte(2, 1), false);
    assertEquals(defaultOrd.lte(5, 5), true);
});

console.log('\n✅ Ord tests completed');
