// Lens (Optics) Tests
import fp from '../index.js';
import { test, assertEquals, assertDeepEquals, assertThrowsWith, logSection } from './utils.js';

const { Lens, composeLens, view, set, over, Functor, Maybe } = fp;

logSection('Lens');

// 공통 fixture
const nameLens = Lens(p => p.name, (v, p) => ({ ...p, name: v }));
const ageLens = Lens(p => p.age, (v, p) => ({ ...p, age: v }));
const addressLens = Lens(u => u.address, (a, u) => ({ ...u, address: a }));
const cityLens = Lens(a => a.city, (c, a) => ({ ...a, city: c }));
const zipLens = Lens(c => c.zip, (z, c) => ({ ...c, zip: z }));

// === Lens laws ===
test('Lens law: get-set — set(lens, view(lens, s), s) === s', () => {
    const s = { name: 'A', age: 30 };
    assertDeepEquals(set(nameLens, view(nameLens, s), s), s);
});

test('Lens law: set-get — view(lens, set(lens, b, s)) === b', () => {
    const s = { name: 'A', age: 30 };
    assertEquals(view(nameLens, set(nameLens, 'B', s)), 'B');
});

test('Lens law: set-set — set(lens, b2, set(lens, b1, s)) === set(lens, b2, s)', () => {
    const s = { name: 'A', age: 30 };
    assertDeepEquals(
        set(nameLens, 'C', set(nameLens, 'B', s)),
        set(nameLens, 'C', s)
    );
});

// === 기본 연산 ===
test('view — extracts value', () => {
    assertEquals(view(nameLens, { name: 'Anthony', age: 30 }), 'Anthony');
});

test('set — replaces value without mutating source', () => {
    const original = { name: 'A', age: 30 };
    const updated = set(nameLens, 'B', original);
    assertDeepEquals(updated, { name: 'B', age: 30 });
    assertDeepEquals(original, { name: 'A', age: 30 });
});

test('over — applies function to focused value', () => {
    assertDeepEquals(
        over(nameLens, s => s.toUpperCase(), { name: 'anthony', age: 30 }),
        { name: 'ANTHONY', age: 30 }
    );
});

test('nested object access via separate lenses', () => {
    const user = { address: { city: 'Seoul' } };
    assertEquals(view(addressLens, user).city, 'Seoul');
});

test('over identity sanity — over(lens, x => x, s) deep-equals s', () => {
    const s = { name: 'A', age: 30 };
    assertDeepEquals(over(ageLens, x => x, s), s);
});

// === 합성 ===
// Lens는 F-explicit Van Laarhoven 인코딩(F => f => s => ...)이므로
// 일반 compose(outer, inner)로는 합성 불가 — 반드시 composeLens를 사용해야 한다.
// composeLens는 F를 양쪽 Lens에 주입한 후 concrete-F 레벨에서 함수 합성한다.
test('composeLens — view on composed lens', () => {
    const userCity = composeLens(addressLens, cityLens);
    assertEquals(view(userCity, { address: { city: 'Seoul' } }), 'Seoul');
});

test('composeLens — set on composed lens (deep immutable update)', () => {
    const userCity = composeLens(addressLens, cityLens);
    const original = { name: 'A', address: { city: 'Seoul', country: 'KR' } };
    const updated = set(userCity, 'Busan', original);
    assertDeepEquals(updated, { name: 'A', address: { city: 'Busan', country: 'KR' } });
    assertDeepEquals(original, { name: 'A', address: { city: 'Seoul', country: 'KR' } });
});

test('composeLens — over on composed lens', () => {
    const userCity = composeLens(addressLens, cityLens);
    const original = { address: { city: 'seoul' } };
    assertDeepEquals(
        over(userCity, s => s.toUpperCase(), original),
        { address: { city: 'SEOUL' } }
    );
});

test('composeLens — 3-level nesting (variadic)', () => {
    const deep = composeLens(addressLens, cityLens, zipLens);
    const original = { address: { city: { zip: '00000', name: 'Seoul' } } };
    assertEquals(view(deep, original), '00000');
    assertDeepEquals(
        set(deep, '12345', original),
        { address: { city: { zip: '12345', name: 'Seoul' } } }
    );
});

// === Generic Functor 호환성 (Static Land registry 재사용 검증) ===
test('Lens — works with Maybe Functor from registry', () => {
    const FMaybe = Functor.of('maybe');
    // f: a -> Maybe a 로 주입
    const result = nameLens(FMaybe)(a => Maybe.Just(a.toUpperCase()))({ name: 'a', age: 1 });
    assertEquals(Maybe.isJust(result), true);
    assertDeepEquals(result.value, { name: 'A', age: 1 });
});

// === 인자 검증 ===
test('Lens — getter must be a function', () => {
    assertThrowsWith(() => Lens(null, (v, s) => s), 'Lens: getter must be a function');
});

test('Lens — setter must be a function', () => {
    assertThrowsWith(() => Lens(s => s, null), 'Lens: setter must be a function');
});

test('view — lens must be a function', () => {
    assertThrowsWith(() => view(null, {}), 'view: lens must be a function');
});

test('set — lens must be a function', () => {
    assertThrowsWith(() => set(null, 'x', {}), 'set: lens must be a function');
});

test('over — f must be a function', () => {
    assertThrowsWith(() => over(nameLens, null, {}), 'over: f must be a function');
});

test('composeLens — non-function argument throws', () => {
    assertThrowsWith(() => composeLens(nameLens, null), 'composeLens: argument 1 must be a Lens');
});

console.log('\n✅ Lens tests completed');
