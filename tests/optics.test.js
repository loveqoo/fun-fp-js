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

/* ═══════════════════════════════════════════════════
   Prism
   ═══════════════════════════════════════════════════ */
logSection('Prism');

const { Prism, traversed, composeOptic, preview, toListOf, review, Either } = fp;

// Either의 Right 갈래에 초점을 맞추는 Prism
const rightPrism = Prism(
    e => (e.isRight() ? Maybe.Just(e.value) : Maybe.Nothing()),
    v => Either.Right(v)
);
// 짝수만 통과시키는 Prism (숫자 → 숫자)
const evenPrism = Prism(
    n => (n % 2 === 0 ? Maybe.Just(n) : Maybe.Nothing()),
    n => n
);

test('Prism — preview on match returns Just', () => {
    assertEquals(preview(rightPrism, Either.Right(5)).value, 5);
});

test('Prism — preview on miss returns Nothing', () => {
    assertEquals(preview(rightPrism, Either.Left('e')).isNothing(), true);
});

test('Prism — over transforms the match', () => {
    assertEquals(over(rightPrism, x => x * 2, Either.Right(5)).value, 10);
});

test('Prism — over leaves a miss untouched', () => {
    const original = Either.Left('boom');
    const result = over(rightPrism, x => x * 2, original);
    assertEquals(result.isLeft(), true);
    assertEquals(result.value, 'boom');
});

test('Prism — set on a miss does nothing', () => {
    assertEquals(set(evenPrism, 100, 3), 3);
    assertEquals(set(evenPrism, 100, 4), 100);
});

test('Prism — review builds from the focus', () => {
    assertEquals(review(rightPrism, 9).isRight(), true);
    assertEquals(review(rightPrism, 9).value, 9);
});

test('Prism law: preview(p, review(p, a)) === Just(a)', () => {
    assertEquals(preview(rightPrism, review(rightPrism, 42)).value, 42);
});

test('Prism law: match 성공 시 review(p, focus) 가 원본과 같다', () => {
    const s = Either.Right(7);
    const focus = preview(rightPrism, s).value;
    assertEquals(review(rightPrism, focus).value, s.value);
});

test('Prism — toListOf gives 0 or 1 element', () => {
    assertDeepEquals(toListOf(rightPrism, Either.Right(1)), [1]);
    assertDeepEquals(toListOf(rightPrism, Either.Left('e')), []);
});

test('Prism — match must return a Maybe', () => {
    const bad = Prism(() => 42, v => v);
    assertThrowsWith(() => preview(bad, 1), 'Prism: match must return a Maybe');
});

test('Prism — non-function arguments throw', () => {
    assertThrowsWith(() => Prism(null, v => v), 'Prism: match must be a function');
    assertThrowsWith(() => Prism(s => Maybe.Just(s), null), 'Prism: build must be a function');
});

test('review — argument must be a Prism', () => {
    assertThrowsWith(() => review(nameLens, 'x'), 'review: argument must be a Prism');
});

/* ═══════════════════════════════════════════════════
   Traversal
   ═══════════════════════════════════════════════════ */
logSection('Traversal');

const each = traversed('array');

test('Traversal — toListOf collects every target', () => {
    assertDeepEquals(toListOf(each, [1, 2, 3]), [1, 2, 3]);
});

test('Traversal — over maps every target', () => {
    assertDeepEquals(over(each, x => x * 10, [1, 2, 3]), [10, 20, 30]);
});

test('Traversal — preview returns the first target', () => {
    assertEquals(preview(each, [7, 8]).value, 7);
});

test('Traversal — empty source: preview is Nothing, over is unchanged', () => {
    assertEquals(preview(each, []).isNothing(), true);
    assertDeepEquals(over(each, x => x * 10, []), []);
});

test('Traversal — does not mutate the source', () => {
    const original = [1, 2, 3];
    over(each, x => x + 1, original);
    assertDeepEquals(original, [1, 2, 3]);
});

test('Traversal law: over(t, x => x, s) deep-equals s', () => {
    const s = [1, 2, 3];
    assertDeepEquals(over(each, x => x, s), s);
});

test('Traversal — works on Maybe via the registry', () => {
    const inMaybe = traversed('maybe');
    assertDeepEquals(toListOf(inMaybe, Maybe.Just(5)), [5]);
    assertDeepEquals(toListOf(inMaybe, Maybe.Nothing()), []);
    assertEquals(over(inMaybe, x => x * 2, Maybe.Just(5)).value, 10);
});

/* ═══════════════════════════════════════════════════
   혼합 합성 — 세 optic 이 같은 메커니즘으로 합성된다
   ═══════════════════════════════════════════════════ */
logSection('Optic composition');

const usersLens = Lens(o => o.users, (v, o) => ({ ...o, users: v }));

test('composeOptic — Lens + Traversal + Lens', () => {
    const allNames = composeOptic(usersLens, each, nameLens);
    const db = { users: [{ name: 'a' }, { name: 'b' }, { name: 'c' }] };

    assertDeepEquals(toListOf(allNames, db), ['a', 'b', 'c']);
    assertDeepEquals(over(allNames, s => s.toUpperCase(), db), {
        users: [{ name: 'A' }, { name: 'B' }, { name: 'C' }]
    });
    // 원본 불변
    assertDeepEquals(db, { users: [{ name: 'a' }, { name: 'b' }, { name: 'c' }] });
});

test('composeOptic — Lens + Prism, 매칭 실패 시 원본 보존', () => {
    const boxLens = Lens(o => o.box, (v, o) => ({ ...o, box: v }));
    const inBox = composeOptic(boxLens, rightPrism);

    assertEquals(preview(inBox, { box: Either.Right(1) }).value, 1);
    assertEquals(preview(inBox, { box: Either.Left('e') }).isNothing(), true);

    const missed = over(inBox, x => x + 1, { box: Either.Left('e') });
    assertEquals(missed.box.isLeft(), true);
    assertEquals(missed.box.value, 'e');
});

test('composeOptic — Traversal + Prism 은 통과한 것만 바꾼다', () => {
    const evens = composeOptic(each, evenPrism);
    assertDeepEquals(toListOf(evens, [1, 2, 3, 4]), [2, 4]);
    assertDeepEquals(over(evens, x => x * 100, [1, 2, 3, 4]), [1, 200, 3, 400]);
});

test('composeOptic — 인자가 함수가 아니면 throws', () => {
    assertThrowsWith(() => composeOptic(nameLens, null), 'composeOptic: argument 1 must be an optic');
});

test('composeLens 는 여전히 Lens 합성으로 동작한다 (하위 호환)', () => {
    const composed = composeLens(addressLens, cityLens);
    assertEquals(view(composed, { address: { city: 'Seoul' } }), 'Seoul');
});

console.log('\n✅ Optics tests completed');
