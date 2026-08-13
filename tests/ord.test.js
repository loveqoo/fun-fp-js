// Ord Laws Tests
import fp from '../index.js';
import { test, assertEquals, logSection } from './utils.js';

const { Ord, Setoid } = fp;

logSection('Ord Laws');

// === Number Ord ===
const numOrd = Ord.lookup('number');
const numSetoid = Setoid.lookup('number');

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
const strOrd = Ord.lookup('string');

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
const dateOrd = Ord.lookup('date');

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
const defaultOrd = Ord.lookup('default');

test('Default Ord - Uses <= operator', () => {
    assertEquals(defaultOrd.lte(1, 2), true);
    assertEquals(defaultOrd.lte(2, 1), false);
    assertEquals(defaultOrd.lte(5, 5), true);
});


logSection('Ord — 컨테이너 (안쪽 순서를 받아 만든다)');

const { Maybe } = fp;
const Ju = Maybe.Just, No = Maybe.Nothing;

test('팩토리를 부르기 전에도 조립 키로 꺼내진다', () => {
    assertEquals(Ord.lookup('maybe(number)') instanceof Ord, true);
    assertEquals(Ord.lookup('array(number)') instanceof Ord, true);
});

test('Maybe: Nothing 이 가장 작다', () => {
    const O = Ord.lookup('maybe(number)');
    assertEquals(O.lte(No(), No()), true);
    assertEquals(O.lte(No(), Ju(1)), true);
    assertEquals(O.lte(Ju(1), No()), false);
    assertEquals(O.lte(Ju(1), Ju(2)), true);
    assertEquals(O.lte(Ju(2), Ju(1)), false);
});

test('Array: 사전식이다', () => {
    const O = Ord.lookup('array(number)');
    assertEquals(O.lte([], []), true);
    assertEquals(O.lte([], [1]), true);
    assertEquals(O.lte([1], []), false);
    assertEquals(O.lte([1, 2], [1, 3]), true);
    assertEquals(O.lte([1, 3], [1, 2]), false);
    assertEquals(O.lte([1], [1, 2]), true);      // 짧은 쪽이 앞
    assertEquals(O.lte([1, 2], [1]), false);
    assertEquals(O.lte([2], [1, 9]), false);     // 첫 원소가 먼저다
});

test('Either 의 Ord 는 일부러 없다', () => {
    // Left/Right 중 무엇이 먼저인지에 정답이 없어 만들지 않았다. fp-ts 도 코어에서 뺐다.
    let message = '(안 던짐)';
    try { Ord.lookup('either(string,number)'); } catch (e) { message = e.message; }
    assertEquals(message, 'Ord.lookup: unsupported key either(string,number)');
});

test('법칙 — 전순서·반대칭·추이 (Maybe)', () => {
    const O = Ord.lookup('maybe(number)');
    const S = Setoid.lookup('maybe(number)');
    const xs = [No(), Ju(1), Ju(2)];
    for (const a of xs) for (const b of xs) {
        assertEquals(O.lte(a, b) || O.lte(b, a), true, '전순서');
        if (O.lte(a, b) && O.lte(b, a)) assertEquals(S.equals(a, b), true, '반대칭');
    }
    for (const a of xs) for (const b of xs) for (const c of xs) {
        if (O.lte(a, b) && O.lte(b, c)) assertEquals(O.lte(a, c), true, '추이성');
    }
});

test('법칙 — 전순서·반대칭·추이 (Array)', () => {
    const O = Ord.lookup('array(number)');
    const S = Setoid.lookup('array(number)');
    const xs = [[], [1], [1, 2], [1, 3], [2]];
    for (const a of xs) for (const b of xs) {
        assertEquals(O.lte(a, b) || O.lte(b, a), true, '전순서');
        if (O.lte(a, b) && O.lte(b, a)) assertEquals(S.equals(a, b), true, '반대칭');
    }
    for (const a of xs) for (const b of xs) for (const c of xs) {
        if (O.lte(a, b) && O.lte(b, c)) assertEquals(O.lte(a, c), true, '추이성');
    }
});

console.log('\n✅ Ord tests completed');
