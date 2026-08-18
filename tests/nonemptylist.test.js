// NonEmptyList — 법칙은 staticland-laws 가 돌리고, 여기는 경계(fromArray)·
// Semigroup 만으로 접는 문(reduceLeft/reduceMap)·거부 문안·방향을 고정한다.
import fp from '../index.js';
import { test, assertEquals, assert, assertThrowsWith, logSection } from './utils.js';

const { NonEmptyList: NEL, Semigroup, Maybe } = fp;

logSection('NonEmptyList');

test('생성 — of·make·fromArray, 빈 것은 문에서 Nothing', () => {
    assertEquals(NEL.of(7).toArray(), [7]);
    assertEquals(NEL.make(1, 2, 3).toArray(), [1, 2, 3]);
    const some = NEL.fromArray([4, 5]);
    assert(some.isJust(), 'fromArray([4,5]) 는 Just');
    assertEquals(some.value.toArray(), [4, 5]);
    assert(NEL.fromArray([]).isNothing(), 'fromArray([]) 는 Nothing — 빈 목록은 이 타입에 못 들어온다');
    assert(NEL.fromArray('not array').isNothing(), '배열 아닌 것도 Nothing');
    assertThrowsWith(() => new NEL(1, 'x'), 'NonEmptyList: tail must be an array');
});

test('head·last·toArray — 원소 하나일 때 head 와 last 는 같다', () => {
    const one = NEL.of(9);
    assertEquals(one.head, 9);
    assertEquals(one.last(), 9);
    const many = NEL.make(3, 9, 4);
    assertEquals(many.head, 3);
    assertEquals(many.last(), 4);
});

test('reduceLeft — 초기값 없이 head 부터 접는다', () => {
    assertEquals(NEL.reduceLeft((a, b) => a + b, NEL.make(3, 9, 4)), 16);
    assertEquals(NEL.reduceLeft((a, b) => a + b, NEL.of(7)), 7, '원소 하나면 그 값');
    // 방향 고정 — 왼쪽부터. 뒤집힌 구현은 문자열 연결이 가른다.
    assertEquals(NEL.reduceLeft((a, b) => a + b, NEL.make('a', 'b', 'c')), 'abc');
});

test('reduceMap — first·last Semigroup 이 처음으로 접기에 들어온다', () => {
    const nel = NEL.make(3, 9, 4);
    assertEquals(NEL.reduceMap(Semigroup.lookup('first'), x => x, nel), 3);
    assertEquals(NEL.reduceMap(Semigroup.lookup('last'), x => x, nel), 4);
    assertEquals(NEL.reduceMap(Semigroup.lookup('string'), String, nel), '394', 'map 하고 결합');
    // 같은 규칙을 foldMap 에 넣으면 여전히 거부된다 — Monoid 가 아니라서. 이 대비가 이 문의 존재 이유다.
    assertThrowsWith(() => fp.foldMap(fp.Foldable.lookup('array'), Semigroup.lookup('first')),
        'foldMap: second argument must be a Monoid');
});

test('거부 문안 — reduceLeft·reduceMap 인자 검증 전건', () => {
    assertThrowsWith(() => NEL.reduceLeft(42, NEL.of(1)),
        'NonEmptyList.reduceLeft: first argument must be a function');
    assertThrowsWith(() => NEL.reduceLeft((a, b) => a, [1, 2]),
        'NonEmptyList.reduceLeft: second argument must be a NonEmptyList');
    assertThrowsWith(() => NEL.reduceMap({}, x => x, NEL.of(1)),
        'NonEmptyList.reduceMap: first argument must be a Semigroup');
    assertThrowsWith(() => NEL.reduceMap(Semigroup.lookup('first'), 42, NEL.of(1)),
        'NonEmptyList.reduceMap: second argument must be a function');
    assertThrowsWith(() => NEL.reduceMap(Semigroup.lookup('first'), x => x, [1]),
        'NonEmptyList.reduceMap: third argument must be a NonEmptyList');
});

test('concat·alt — 방향이 a 뒤에 b 다 (결합법칙만으로는 못 가르는 자리)', () => {
    assertEquals(Semigroup.lookup('nonemptylist').concat(NEL.make(1, 2), NEL.make(3, 4)).toArray(),
        [1, 2, 3, 4]);
    assertEquals(fp.Alt.lookup('nonemptylist').alt(NEL.make(1, 2), NEL.make(3, 4)).toArray(),
        [1, 2, 3, 4], 'alt 는 concat 과 같은 몸');
});

test('불변 — 호출자 배열 별칭도 직접 push 도 값을 못 바꾼다 (구현 리뷰 Major 1)', () => {
    const src = [2, 3];
    const n = new NEL(1, src);
    src.push(9);
    assertEquals(n.toArray(), [1, 2, 3], '원본 배열을 바꿔도 NEL 은 그대로');
    let threw = false;
    try { n.tail.push(9); } catch (e) { threw = true; }
    assert(threw, 'tail 은 동결 — 직접 변이는 던진다');
    assertEquals(n.toArray(), [1, 2, 3]);
});

test('의도된 부재 — Monoid·Plus·Alternative·Filterable 에 이 타입이 없다', () => {
    for (const name of ['Monoid', 'Plus', 'Alternative', 'Filterable']) {
        assertThrowsWith(() => fp[name].lookup('nonemptylist'), `${name}.lookup: unsupported key`);
    }
});

test('extract — 빈 경우가 없어 항상 값을 준다 (배열 Comonad 의 구멍이 없는 자리)', () => {
    const C = fp.Comonad.lookup('nonemptylist');
    assertEquals(C.extract(NEL.make(3, 9, 4)), 3);
    assertEquals(C.extract(NEL.of(1)), 1);
    // 배열 쪽 구멍의 실측 대비 — extract([]) 는 undefined 다.
    assertEquals(fp.Comonad.lookup('array').extract([]), undefined);
});

test('레지스트리 — Algebra.all 에 12개 클래스가 선다', () => {
    const keys = Object.keys(fp.Algebra.all('nonemptylist')).sort();
    assertEquals(keys.length, 12, '인스턴스 수');
    assertEquals(keys, ['nonEmptyListAlt', 'nonEmptyListApplicative', 'nonEmptyListApply',
        'nonEmptyListChain', 'nonEmptyListChainRec', 'nonEmptyListComonad', 'nonEmptyListExtend',
        'nonEmptyListFoldable', 'nonEmptyListFunctor', 'nonEmptyListMonad', 'nonEmptyListSemigroup',
        'nonEmptyListTraversable']);
});
