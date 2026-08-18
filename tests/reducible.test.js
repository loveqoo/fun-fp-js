// Reducible — 항등원 없는 접기의 클래스. 법칙은 staticland-laws 가 돌리고,
// 여기는 조회·두 인스턴스의 대칭·거부 문안·위임·새로 합법이 된 문을 고정한다.
import fp from '../index.js';
import { test, assertEquals, assert, assertThrowsWith, logSection } from './utils.js';

const { Reducible, NonEmptyList: NEL, Semigroup, Foldable, Monoid, foldMap, Applicative } = fp;

logSection('Reducible');

test('lookup — nonemptylist·identity 두 인스턴스, 빈 컨테이너는 없다', () => {
    assertEquals(Reducible.lookup('nonemptylist').type, 'NonEmptyList');
    assertEquals(Reducible.lookup('identity').type, 'Identity');
    // Array·Maybe 는 비어질 수 있어 구조적으로 자격이 없다 — 이 부재가 클래스의 뜻이다
    assertThrowsWith(() => Reducible.lookup('array'), 'Reducible.lookup: unsupported key');
    assertThrowsWith(() => Reducible.lookup('maybe'), 'Reducible.lookup: unsupported key');
});

test('같은 조합자가 두 타입을 넘나든다 — 승격의 값어치', () => {
    const firstOf = R => fa => R.reduceMap(Semigroup.lookup('first'), x => x, fa);
    assertEquals(firstOf(Reducible.lookup('nonemptylist'))(NEL.make(3, 9, 4)), 3);
    assertEquals(firstOf(Reducible.lookup('identity'))(Applicative.lookup('identity').of(7)), 7);
});

test('상속 — Reducible 은 Foldable 이다 (reduce 가 그대로 있다)', () => {
    const R = Reducible.lookup('nonemptylist');
    assertEquals(R.reduce((a, b) => a + b, 0, NEL.make(1, 2, 3)), 6);
    assert(R[Symbol.for('fun-fp-js/Foldable')] === true, 'Foldable 심볼을 진다');
    assert(R[Symbol.for('fun-fp-js/Reducible')] === true, 'Reducible 심볼을 진다');
});

test('Identity 의 Foldable 이 함께 섰다 — foldMap 이 즉시 합법이 된다', () => {
    const id7 = Applicative.lookup('identity').of(7);
    assertEquals(Foldable.lookup('identity').reduce((a, b) => a + b, 100, id7), 107);
    assertEquals(foldMap(Foldable.lookup('identity'), Monoid.types.NumberSumMonoid)(x => x * 2)(id7), 14);
});

test('거부 문안 — 클래스 게이트가 지닌다', () => {
    const R = Reducible.lookup('identity');
    assertThrowsWith(() => R.reduceLeft(42, Applicative.lookup('identity').of(1)),
        'Reducible.reduceLeft: arguments must be (function, Identity)');
    assertThrowsWith(() => R.reduceMap({}, x => x, Applicative.lookup('identity').of(1)),
        'Reducible.reduceMap: first argument must be a Semigroup');
    assertThrowsWith(() => R.reduceMap(Semigroup.lookup('first'), x => x, NEL.of(1)),
        'Reducible.reduceMap: arguments must be (Semigroup, function, Identity)');
});

test('NEL 정적 문은 위임이다 — 같은 몸, 같은 문안', () => {
    assertEquals(NEL.reduceLeft((a, b) => a + b, NEL.make(3, 9, 4)),
        Reducible.lookup('nonemptylist').reduceLeft((a, b) => a + b, NEL.make(3, 9, 4)));
    assertThrowsWith(() => NEL.reduceLeft(42, NEL.of(1)),
        'Reducible.reduceLeft: arguments must be (function, NonEmptyList)');
});
