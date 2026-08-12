// 레지스트리 API 의 표면 — `lookup` 과 `of` 가 갈려 있는지.
//
// 두 이름이 하는 일이 다르다:
//
//   lookup(키)   레지스트리에서 인스턴스를 꺼낸다   — 타입클래스 24개
//   of(값)       값을 컨테이너에 넣는다            — 데이터 타입 8개, Applicative 인스턴스
//
// **왜 테스트가 필요한가**: 이 구분은 어겨도 조용하다. `Functor.of = Functor.lookup` 을
// 되살리면 아무것도 안 깨진다 — 실측으로 `npm test` 39/39 초록이었고, `npm run baseline` 도
// 표면 격자를 24개로 넓히기 전에는 「차이 없음」이었다. 편의를 이유로 별칭이 돌아오는 것을
// 막는 것은 이 파일뿐이다.
//
// **왜 CLAUDE.md 에도 남기는가**: 테스트는 "무엇이 깨졌나" 만 말한다. 왜 갈랐는지
// (한 이름이 조회와 주입을 겸하면 `Maybe.of('array')` 가 조회로 읽힌다)는 실패 메시지에
// 담기지 않는다. 의도는 `CLAUDE.md` 「Traps」에, 부활 차단은 여기에 있다.
import fp from '../index.js';
import { test, assertEquals, assert, logSection } from './utils.js';

const TYPE_CLASSES = [
    'Setoid', 'Ord', 'Semigroup', 'Monoid', 'Group', 'Semigroupoid', 'Category',
    'Filterable', 'Functor', 'Bifunctor', 'Contravariant', 'Profunctor', 'Apply',
    'Applicative', 'Alt', 'Plus', 'Alternative', 'Chain', 'ChainRec', 'Monad',
    'Foldable', 'Extend', 'Comonad', 'Traversable'
];

const DATA_TYPES = ['Maybe', 'Either', 'Task', 'Validation', 'Reader', 'Writer', 'State', 'Free'];

logSection('레지스트리 API — lookup / of 분리');

test('타입클래스 24개에는 of 가 없다 — 되살아나면 여기서 걸린다', () => {
    const revived = TYPE_CLASSES.filter(name => fp[name].of !== undefined);
    assertEquals(revived.join(','), '',
        '타입클래스에 of 가 되살아났다 — 조회는 lookup 이고 of 는 값 주입 전용이다');
});

test('타입클래스 24개 전부 lookup 을 가진다', () => {
    const missing = TYPE_CLASSES.filter(name => typeof fp[name].lookup !== 'function');
    assertEquals(missing.join(','), '', 'lookup 이 없는 타입클래스');
});

test('데이터 타입 8개의 of 는 살아 있다 — 값 주입이다', () => {
    const missing = DATA_TYPES.filter(name => typeof fp[name].of !== 'function');
    assertEquals(missing.join(','), '', 'of 가 사라진 데이터 타입');
});

test('Maybe.of 는 조회가 아니라 주입이다', () => {
    // 이 한 줄이 이름을 가른 이유다. of 가 조회를 겸하면 아래가 MaybeFunctor 로 읽힌다.
    const just = fp.Maybe.of('array');
    assert(fp.Maybe.isJust(just), "Maybe.of('array') 는 Just('array') 다");
    assertEquals(just.value, 'array');
});

test('Applicative 인스턴스의 of 는 그대로다 — 클래스의 of 와 다른 것이다', () => {
    const maybeA = fp.Applicative.lookup('maybe');
    assert(fp.Maybe.isJust(maybeA.of(1)), "Applicative.lookup('maybe').of(1) 은 Just(1)");
    assertEquals(maybeA.of(1).value, 1);
    assertEquals(fp.Applicative.of, undefined, '클래스 쪽에는 of 가 없다');
});

test('lookup 이 못 찾으면 자기 이름으로 던진다', () => {
    let message = '(안 던짐)';
    try { fp.Functor.lookup('없는키'); } catch (e) { message = e.message; }
    // 전문으로 대조한다 — 부분 문자열은 대부분 통과해서 아무것도 고정하지 못한다(규칙 15).
    assertEquals(message, 'Functor.lookup: unsupported key 없는키');
});

test('types 레지스트리는 lookup 과 같은 인스턴스를 준다', () => {
    assert(fp.Functor.lookup('maybe') === fp.Functor.types.MaybeFunctor, '별칭과 클래스 이름이 같은 인스턴스');
    assert(fp.Functor.lookup('maybe') === fp.Functor.types.maybe, '소문자 키도 같은 인스턴스');
});

console.log('\n✅ 레지스트리 API tests completed\n');
