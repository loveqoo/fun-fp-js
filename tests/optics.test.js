// Lens (Optics) Tests
import fp from '../index.js';
import { test, assertEquals, assertEqualsBy, assertThrowsWith, logSection } from './utils.js';

// 비교는 라이브러리의 Setoid 로 한다 — 사설 deepEquals 를 대체했다.
// 레코드는 struct(필드:키) 로 필드마다 비교법을 밝힌다.
const eqPerson = fp.Setoid.Struct({ name: 'string', age: 'number' });
const eqAN = fp.Setoid.lookup('array(number)');
const eqAS = fp.Setoid.lookup('array(string)');

const { Functor, Maybe, Either, Monoid } = fp;
// optics 는 모듈 객체 하나로 나온다 — 최상위에 view/set/over 같은 흔한 이름을 두지 않는다.
const {
    Iso, Lens, Prism, traversed, compose,
    view, preview, toList, foldMapOf, review, set, over,
} = fp.Optics;

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
    assertEqualsBy(eqPerson, set(nameLens, view(nameLens, s), s), s);
});

test('Lens law: set-get — view(lens, set(lens, b, s)) === b', () => {
    const s = { name: 'A', age: 30 };
    assertEquals(view(nameLens, set(nameLens, 'B', s)), 'B');
});

test('Lens law: set-set — set(lens, b2, set(lens, b1, s)) === set(lens, b2, s)', () => {
    const s = { name: 'A', age: 30 };
    assertEqualsBy(eqPerson,
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
    assertEqualsBy(eqPerson, updated, { name: 'B', age: 30 });
    assertEqualsBy(eqPerson, original, { name: 'A', age: 30 });
});

test('over — applies function to focused value', () => {
    assertEqualsBy(eqPerson,
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
    assertEqualsBy(eqPerson, over(ageLens, x => x, s), s);
});

// === 합성 ===
// optic은 P-explicit profunctor 인코딩(P => pab => ...)이므로
// 일반 compose(outer, inner)로는 합성 불가 — composeOptic을 쓴다.
// composeOptic은 P를 모든 optic에 주입한 후 그 층에서 함수 합성한다.
test('compose — view on composed lens', () => {
    const userCity = compose(addressLens, cityLens);
    assertEquals(view(userCity, { address: { city: 'Seoul' } }), 'Seoul');
});

test('compose — set on composed lens (deep immutable update)', () => {
    const userCity = compose(addressLens, cityLens);
    const original = { name: 'A', address: { city: 'Seoul', country: 'KR' } };
    const updated = set(userCity, 'Busan', original);
    assertEqualsBy(fp.Setoid.Struct({ name: 'string', address: fp.Setoid.Struct({ city: 'string', country: 'string' }) }), updated, { name: 'A', address: { city: 'Busan', country: 'KR' } });
    assertEqualsBy(fp.Setoid.Struct({ name: 'string', address: fp.Setoid.Struct({ city: 'string', country: 'string' }) }), original, { name: 'A', address: { city: 'Seoul', country: 'KR' } });
});

test('compose — over on composed lens', () => {
    const userCity = compose(addressLens, cityLens);
    const original = { address: { city: 'seoul' } };
    assertEqualsBy(fp.Setoid.Struct({ address: fp.Setoid.Struct({ city: 'string' }) }),
        over(userCity, s => s.toUpperCase(), original),
        { address: { city: 'SEOUL' } }
    );
});

test('compose — 3-level nesting (variadic)', () => {
    const deep = compose(addressLens, cityLens, zipLens);
    const original = { address: { city: { zip: '00000', name: 'Seoul' } } };
    assertEquals(view(deep, original), '00000');
    assertEqualsBy(fp.Setoid.Struct({ address: fp.Setoid.Struct({ city: fp.Setoid.Struct({ zip: 'string', name: 'string' }) }) }),
        set(deep, '12345', original),
        { address: { city: { zip: '12345', name: 'Seoul' } } }
    );
});

// === Profunctor 인코딩 검증 ===
// optic은 P를 받는 함수다. 임의의 Profunctor 딕셔너리로 동작해야 한다.
test('Lens — 임의의 Profunctor 딕셔너리로 동작한다', () => {
    const calls = [];
    // 사용자가 자기 profunctor 를 들고 와도 돈다 — 이름은 이 라이브러리의 promap 이다.
    const spy = {
        promap: (f, g, p) => { calls.push('promap'); return s => g(p(f(s))); },
        first: p => { calls.push('first'); return ([a, c]) => [p(a), c]; },
    };
    const run = nameLens(spy)(a => a.toUpperCase());
    assertEqualsBy(eqPerson, run({ name: 'a', age: 1 }), { name: 'A', age: 1 });
    assertEqualsBy(eqAS, calls, ['first', 'promap']);
});

test('optic은 순수 함수다 — 프로퍼티를 이고 다니지 않는다', () => {
    assertEquals(Object.keys(nameLens).length, 0);
    assertEquals(Object.getOwnPropertySymbols(nameLens).length, 0);
});

// === 인자 검증 ===
test('Lens — getter must be a function', () => {
    assertThrowsWith(() => Lens(null, (v, s) => s), 'Lens: getter must be a function');
});

test('Lens — setter must be a function', () => {
    assertThrowsWith(() => Lens(s => s, null), 'Lens: setter must be a function');
});

test('view — optic must be a function', () => {
    assertThrowsWith(() => view(null, {}), 'view: optic must be a function');
});

// view 는 Lens 전용이고 전역(total) 함수다 — types/Lens.d.ts:78-79 가 반환을 A 로 선언한다.
// 대상이 없을 수 있으면 preview 를 쓰라는 뜻이므로, 없을 때 undefined 를 흘리지 않고 던진다.
test('view — Prism 이 매치하지 않으면 throws (undefined 를 흘리지 않는다)', () => {
    const bigP = Prism(x => (x > 10 ? Maybe.Just(x) : Maybe.Nothing()), x => x);
    assertThrowsWith(() => view(bigP, 5), 'view: expected exactly one target, got 0');
});

test('view — 대상이 0개인 Traversal 이면 throws', () => {
    assertThrowsWith(() => view(traversed('array'), []), 'view: expected exactly one target, got 0');
});

// "정확히 1대상" 을 문서가 아니라 코드가 강제한다. 미보증 동작으로 남겨두면 다음 사람이
// 의존하게 되고, 회차 1·2의 회귀가 둘 다 그 자리에서 나왔다.
test('view — 대상이 여럿이면 throws (첫 값을 조용히 주지 않는다)', () => {
    assertThrowsWith(
        () => view(traversed('array'), [1, 2, 3]),
        'view: expected exactly one target, got 3'
    );
});

test('view — 대상이 정확히 1개인 Traversal 은 그 값을 준다', () => {
    assertEquals(view(traversed('array'), [7]), 7);
});

// preview 는 대상을 고르는 것이지 합치는 것이 아니다 — 안을 열면 안 된다.
// (회귀 방지: maybe(first) 로 모으면 타입이 섞인 대상에서 던졌다)
test('preview — 대상들의 타입이 섞여도 첫 대상을 준다', () => {
    assertEquals(preview(traversed('array'), [1, 'a']).value, 1);
    assertEquals(preview(traversed('array'), [null, 1]).value, null);
    assertEqualsBy(fp.Setoid.Struct({ a: 'number' }), preview(traversed('array'), [{ a: 1 }, [2]]).value, { a: 1 });
});

test('set — optic must be a function', () => {
    assertThrowsWith(() => set(null, 'x', {}), 'set: optic must be a function');
});

test('over — f must be a function', () => {
    assertThrowsWith(() => over(nameLens, null, {}), 'over: f must be a function');
});

test('compose — non-function argument throws', () => {
    assertThrowsWith(() => compose(nameLens, null), 'Optics.compose: argument 1 must be an optic');
});

/* ═══════════════════════════════════════════════════
   Iso — dimap만 쓰므로 모든 P에서 동작한다 (Lens이자 Prism)
   ═══════════════════════════════════════════════════ */
logSection('Iso');

// 섭씨 ↔ 화씨. 무손실이므로 Iso가 맞다.
const fahrenheit = Iso(c => c * 9 / 5 + 32, f => (f - 32) * 5 / 9);

test('Iso — view 는 정방향 변환이다', () => {
    assertEquals(view(fahrenheit, 100), 212);
});

test('Iso — review 는 역방향 변환이다 (Prism 이기도 하다)', () => {
    assertEquals(review(fahrenheit, 212), 100);
});

test('Iso — over 는 변환한 값에 적용하고 되돌린다', () => {
    assertEquals(over(fahrenheit, f => f + 18, 100), 110);
});

test('Iso — set 은 초점을 교체한다', () => {
    assertEquals(set(fahrenheit, 32, 100), 0);
});

test('Iso — preview 는 항상 Just, toList 는 항상 1개', () => {
    assertEquals(preview(fahrenheit, 0).value, 32);
    assertEqualsBy(eqAN, toList(fahrenheit, 0), [32]);
});

test('Iso law: review(iso, view(iso, s)) === s', () => {
    assertEquals(review(fahrenheit, view(fahrenheit, 37)), 37);
});

test('Iso law: view(iso, review(iso, a)) === a', () => {
    assertEquals(Number(view(fahrenheit, review(fahrenheit, 98.6)).toFixed(1)), 98.6);
});

test('Iso — 인자가 함수가 아니면 throws', () => {
    assertThrowsWith(() => Iso(null, x => x), 'Iso: to must be a function');
    assertThrowsWith(() => Iso(x => x, null), 'Iso: from must be a function');
});

/* ═══════════════════════════════════════════════════
   Prism
   ═══════════════════════════════════════════════════ */
logSection('Prism');

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

test('Prism — toList gives 0 or 1 element', () => {
    assertEqualsBy(eqAN, toList(rightPrism, Either.Right(1)), [1]);
    assertEqualsBy(eqAN, toList(rightPrism, Either.Left('e')), []);
});

test('Prism — match must return a Maybe', () => {
    const bad = Prism(() => 42, v => v);
    assertThrowsWith(() => preview(bad, 1), 'Prism: match must return a Maybe');
});

test('Prism — non-function arguments throw', () => {
    assertThrowsWith(() => Prism(null, v => v), 'Prism: match must be a function');
    assertThrowsWith(() => Prism(s => Maybe.Just(s), null), 'Prism: build must be a function');
});

test('review — Lens 에는 쓸 수 없다 (Tagged 에 first 가 없다)', () => {
    assertThrowsWith(() => review(nameLens, 'x'), 'review: argument must be a Prism');
});

test('review — Traversal 에도 쓸 수 없다 (Tagged 에 wander 가 없다)', () => {
    assertThrowsWith(() => review(traversed('array'), 'x'), 'review: argument must be a Prism');
});

// profunctor 인코딩으로 옮긴 이유. van Laarhoven + 심볼 표식 방식에서는
// 합성이 build 를 잃어 이것이 깨졌다.
test('review — 합성된 Prism 에서도 동작한다', () => {
    const composed = compose(rightPrism, evenPrism);
    const built = review(composed, 4);
    assertEquals(built.isRight(), true);
    assertEquals(built.value, 4);
});

test('review 합성 = 바깥 review ∘ 안쪽 review', () => {
    const composed = compose(rightPrism, evenPrism);
    assertEqualsBy(fp.Setoid.lookup('either(string,number)'),
        review(composed, 6),
        review(rightPrism, review(evenPrism, 6))
    );
});

test('합성된 Prism 도 Prism 법칙을 만족한다', () => {
    const composed = compose(rightPrism, evenPrism);
    assertEquals(preview(composed, review(composed, 8)).value, 8);
    // 홀수는 안쪽 Prism 을 통과하지 못한다
    assertEquals(preview(composed, Either.Right(7)).isNothing(), true);
});

/* ═══════════════════════════════════════════════════
   Traversal
   ═══════════════════════════════════════════════════ */
logSection('Traversal');

const each = traversed('array');

test('Traversal — toList collects every target', () => {
    assertEqualsBy(eqAN, toList(each, [1, 2, 3]), [1, 2, 3]);
});

test('Traversal — over maps every target', () => {
    assertEqualsBy(eqAN, over(each, x => x * 10, [1, 2, 3]), [10, 20, 30]);
});

test('Traversal — preview returns the first target', () => {
    assertEquals(preview(each, [7, 8]).value, 7);
});

test('Traversal — empty source: preview is Nothing, over is unchanged', () => {
    assertEquals(preview(each, []).isNothing(), true);
    assertEqualsBy(eqAN, over(each, x => x * 10, []), []);
});

test('Traversal — does not mutate the source', () => {
    const original = [1, 2, 3];
    over(each, x => x + 1, original);
    assertEqualsBy(eqAN, original, [1, 2, 3]);
});

test('Traversal law: over(t, x => x, s) deep-equals s', () => {
    const s = [1, 2, 3];
    assertEqualsBy(eqAN, over(each, x => x, s), s);
});

test('Traversal — works on Maybe via the registry', () => {
    const inMaybe = traversed('maybe');
    assertEqualsBy(eqAN, toList(inMaybe, Maybe.Just(5)), [5]);
    assertEqualsBy(eqAN, toList(inMaybe, Maybe.Nothing()), []);
    assertEquals(over(inMaybe, x => x * 2, Maybe.Just(5)).value, 10);
});

/* ═══════════════════════════════════════════════════
   혼합 합성 — 세 optic 이 같은 메커니즘으로 합성된다
   ═══════════════════════════════════════════════════ */
logSection('Optic composition');

const usersLens = Lens(o => o.users, (v, o) => ({ ...o, users: v }));

test('compose — Lens + Traversal + Lens', () => {
    const allNames = compose(usersLens, each, nameLens);
    const db = { users: [{ name: 'a' }, { name: 'b' }, { name: 'c' }] };

    assertEqualsBy(eqAS, toList(allNames, db), ['a', 'b', 'c']);
    assertEqualsBy(fp.Setoid.Struct({ users: fp.Setoid.Array(fp.Setoid.Struct({ name: 'string' })) }), over(allNames, s => s.toUpperCase(), db), {
        users: [{ name: 'A' }, { name: 'B' }, { name: 'C' }]
    });
    // 원본 불변
    assertEqualsBy(fp.Setoid.Struct({ users: fp.Setoid.Array(fp.Setoid.Struct({ name: 'string' })) }), db, { users: [{ name: 'a' }, { name: 'b' }, { name: 'c' }] });
});

test('compose — Lens + Prism, 매칭 실패 시 원본 보존', () => {
    const boxLens = Lens(o => o.box, (v, o) => ({ ...o, box: v }));
    const inBox = compose(boxLens, rightPrism);

    assertEquals(preview(inBox, { box: Either.Right(1) }).value, 1);
    assertEquals(preview(inBox, { box: Either.Left('e') }).isNothing(), true);

    const missed = over(inBox, x => x + 1, { box: Either.Left('e') });
    assertEquals(missed.box.isLeft(), true);
    assertEquals(missed.box.value, 'e');
});

test('compose — Traversal + Prism 은 통과한 것만 바꾼다', () => {
    const evens = compose(each, evenPrism);
    assertEqualsBy(eqAN, toList(evens, [1, 2, 3, 4]), [2, 4]);
    assertEqualsBy(eqAN, over(evens, x => x * 100, [1, 2, 3, 4]), [1, 200, 3, 400]);
});

test('compose — Lens + Iso', () => {
    const tempLens = Lens(o => o.temp, (v, o) => ({ ...o, temp: v }));
    const inF = compose(tempLens, fahrenheit);

    assertEquals(view(inF, { temp: 100, city: 'Seoul' }), 212);
    assertEqualsBy(fp.Setoid.Struct({ temp: 'number', city: 'string' }), over(inF, f => f - 32, { temp: 100, city: 'Seoul' }), {
        temp: 100 - 32 * 5 / 9, city: 'Seoul'
    });
});

test('compose — Traversal + Iso 는 모든 원소를 변환한다', () => {
    const inF = compose(each, fahrenheit);
    assertEqualsBy(eqAN, toList(inF, [0, 100]), [32, 212]);
    assertEqualsBy(eqAN, over(inF, f => f + 0, [0, 100]), [0, 100]);
});

test('compose — Prism + Iso 는 review 가 이어진다', () => {
    const composed = compose(rightPrism, fahrenheit);
    assertEquals(preview(composed, Either.Right(100)).value, 212);
    assertEquals(review(composed, 212).value, 100);
});

test('compose — 인자가 함수가 아니면 throws', () => {
    assertThrowsWith(() => compose(nameLens, null), 'Optics.compose: argument 1 must be an optic');
});

test('compose 은 Lens 끼리도 합성한다', () => {
    const composed = compose(addressLens, cityLens);
    assertEquals(view(composed, { address: { city: 'Seoul' } }), 'Seoul');
});

/* ═══════════════════════════════════════════════════
   foldMapOf — 사용자가 Monoid 를 골라 모은다
   ═══════════════════════════════════════════════════ */
logSection('foldMapOf');

// 읽기 셋(preview·toList·view)은 Monoid 가 함수 안에 박혀 있어 배열/첫대상밖에 못 모은다.
// foldMapOf 는 그 Monoid 를 사용자가 고르게 하는 입구다.
test('foldMapOf — Monoid.lookup(number) 로 합계를 낸다', () => {
    assertEquals(foldMapOf(Monoid.lookup('number'), traversed('array'), x => x, [1, 2, 3]), 6);
});

test('foldMapOf — Monoid 를 바꾸면 모으는 방식이 바뀐다', () => {
    const t = traversed('array');
    assertEquals(foldMapOf(Monoid.lookup('NumberProductMonoid'), t, x => x, [2, 3, 4]), 24);
    assertEquals(foldMapOf(Monoid.lookup('NumberMaxMonoid'), t, x => x, [2, 9, 4]), 9);
    assertEquals(foldMapOf(Monoid.lookup('string'), t, String, [1, 2, 3]), '123');
});

test('foldMapOf — 대상이 없으면 Monoid 의 항등원', () => {
    assertEquals(foldMapOf(Monoid.lookup('number'), traversed('array'), x => x, []), 0);
    assertEqualsBy(eqAN, foldMapOf(Monoid.lookup('array'), traversed('array'), a => [a], []), []);
});

// toList 와 preview 가 foldMapOf 의 특수 경우라는 것을 고정한다.
test('foldMapOf — toList 와 preview 가 그 특수 경우다', () => {
    const t = traversed('array');
    assertEqualsBy(eqAN, foldMapOf(Monoid.lookup('array'), t, a => [a], [1, 2, 3]), toList(t, [1, 2, 3]));
    assertEquals(
        foldMapOf(Monoid.lookup('plus(maybe)'), t, Maybe.Just, [1, 2, 3]).value,
        preview(t, [1, 2, 3]).value
    );
});

test('foldMapOf — Lens 와 Prism 에서도 동작한다', () => {
    assertEquals(foldMapOf(Monoid.lookup('number'), nameLens, s => s.length, { name: 'abcd' }), 4);
    const bigP = Prism(x => (x > 10 ? Maybe.Just(x) : Maybe.Nothing()), x => x);
    assertEquals(foldMapOf(Monoid.lookup('number'), bigP, x => x, 20), 20);
    assertEquals(foldMapOf(Monoid.lookup('number'), bigP, x => x, 5), 0);   // 매치 실패 → 항등원
});

// 에러가 호출한 연산에 귀속돼야 한다 — foldMapOf 로 재정의하면서 preview/toList 가
// 'foldMapOf:' 로 던지는 회귀가 있었다. 메시지 단언이 0건이라 잠복했었다.
test('읽기 셋의 에러는 각자의 이름으로 던진다', () => {
    assertThrowsWith(() => preview(null, []), 'preview: optic must be a function');
    assertThrowsWith(() => toList(null, []), 'toList: optic must be a function');
    assertThrowsWith(() => view(null, []), 'view: optic must be a function');
});

// foldMapOf 는 monoid 를 first 경로에서 안 만지므로 Lens/Iso 는 무검사 통과했다.
// 검사 여부가 optic 종류에 따라 갈리면 안 된다.
test('foldMapOf — Monoid 가 아니면 optic 종류와 무관하게 거부한다', () => {
    const bigP = Prism(x => (x > 10 ? Maybe.Just(x) : Maybe.Nothing()), x => x);
    const msg = 'foldMapOf: argument must be a string or Monoid instance';
    assertThrowsWith(() => foldMapOf({ hello: 'world' }, nameLens, x => x, { name: 'a' }), msg);
    assertThrowsWith(() => foldMapOf({ hello: 'world' }, bigP, x => x, 20), msg);
    assertThrowsWith(() => foldMapOf(null, traversed('array'), x => x, [1]), msg);
});

test('foldMapOf — f 가 함수가 아니면 거부한다', () => {
    assertThrowsWith(() => foldMapOf(Monoid.lookup('array'), nameLens, 42, { name: 'a' }), 'foldMapOf: f must be a function');
});

// 사용자가 만든 Monoid 는 등록하지 않아도 받는다 — 다만 리터럴이 아니라 Monoid 여야 한다.
// 기존 foldMap(foldable, monoid) 도 같은 규칙이다(Symbols.Monoid 요구).
// 리터럴이 Lens 에서만 통과했던 것은 우연이었다 — first 경로가 monoid 를 안 만져서다.
test('foldMapOf — 등록 안 된 사용자 Monoid 를 받는다', () => {
    const { Semigroup } = fp;
    const mine = new Monoid(new Semigroup((a, b) => a + b, 'number'), () => 0, 'number');
    assertEquals(foldMapOf(mine, traversed('array'), x => x, [1, 2, 3]), 6);
    assertEquals(foldMapOf(mine, nameLens, s => s.length, { name: 'abcd' }), 4);
});

// foldMapOf 가 부르는 Applicative.Const 는 키를 받는데 foldMapOf 만 안 받았다 —
// 호출 체인의 아래쪽은 되는데 사용자가 만지는 입구가 안 되는 상태였다.
test('foldMapOf — Monoid 키도 받는다', () => {
    assertEquals(foldMapOf('number', traversed('array'), x => x, [1, 2, 3]), 6);
    assertEqualsBy(eqAN, foldMapOf('array', traversed('array'), a => [a], [1, 2]), [1, 2]);
});

// runOptic 이 name 을 받는 유일한 이유가 호출자 귀속인데, preview/toList/view 가 자기 검사를
// 갖게 되면서 runOptic 의 에러 가지에 도달하는 경로가 over/foldMapOf 만 남았다.
// 그 둘에 단언이 없어 name 인자가 뮤테이션을 생존했다.
test('runOptic 의 라벨이 호출자에 귀속된다', () => {
    assertThrowsWith(() => over(null, x => x, {}), 'over: optic must be a function');
    assertThrowsWith(() => foldMapOf(Monoid.lookup('array'), null, a => [a], {}), 'foldMapOf: optic must be a function');
});

console.log('\n✅ Optics tests completed');
