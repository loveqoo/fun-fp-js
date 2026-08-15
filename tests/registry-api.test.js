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
import { test, assertEquals, assert, assertThrows, logSection } from './utils.js';

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

logSection('제약이 붙은 인스턴스 팩토리는 어디 사는가');

// 한때 규칙이 **두 개**였다 — Maybe.Semigroup(k) 와 Setoid.Array(k) 가 나란히 있었고
// 어느 쪽도 예외라 부를 수 없는 5:6 이었다. 아무 게이트도 그것을 안 봤다.
//
// 규칙은 하나다: **인스턴스를 돌려주는 것은 전부 타입 클래스에 산다.**
//
//   Semigroup.lookup('maybe')     제약이 없으면 그냥 꺼낸다
//   Semigroup.Maybe('array')      제약이 있으면 인자로 풀고 꺼낸다
//
// 근거 둘. (1) 위의 lookup/of 분리와 같은 선이다 — 데이터 타입은 값만 내고
// 타입 클래스는 인스턴스만 낸다. (2) 글자 순서가 타입 순서와 같다:
// Semigroup.Maybe('array') 는 Semigroup<Maybe<Array>> 다. 뒤집으면
// Maybe<Semigroup<Array>> 로 읽히는데 그런 값은 없다.

test('데이터 타입에는 타입클래스 이름의 멤버가 없다', () => {
    const found = [];
    for (const d of DATA_TYPES) {
        for (const k of Object.keys(fp[d])) {
            if (TYPE_CLASSES.includes(k)) found.push(`${d}.${k}`);
        }
    }
    assertEquals(found.join(', '), '',
        '데이터 타입에 타입클래스 이름이 붙었다 — 인스턴스 팩토리는 타입 클래스 쪽이다');
});

test('옮겨온 팩토리 여섯이 타입 클래스에 있고 인스턴스를 돌려준다', () => {
    const cases = [
        ['Semigroup', 'Maybe', ['array'], 'Maybe'],
        ['Monoid', 'Maybe', ['array'], 'Maybe'],
        ['Setoid', 'Maybe', ['number'], 'Maybe'],
        ['Ord', 'Maybe', ['number'], 'Maybe'],
        ['Semigroup', 'Either', ['array', 'array'], 'Either'],
        ['Setoid', 'Either', ['number', 'number'], 'Either']
    ];
    for (const [cls, type, args, expected] of cases) {
        const factory = fp[cls][type];
        assert(typeof factory === 'function', `${cls}.${type} 가 없다`);
        assertEquals(factory.apply(null, args).type, expected, `${cls}.${type} 가 돌려준 .type`);
    }
});

test('이름이 타입을 순서대로 읽는다 — Semigroup.Maybe 는 Semigroup<Maybe<_>> 다', () => {
    // 바깥이 Semigroup 이므로 concat 은 Maybe 를 받아 Maybe 를 돌려준다.
    // 뒤집힌 읽기(Maybe<Semigroup<_>>)라면 concat 이 Semigroup 인스턴스를 받았을 것이다.
    const sg = fp.Semigroup.Maybe('array');
    const joined = sg.concat(fp.Maybe.Just([1]), fp.Maybe.Just([2]));
    assert(fp.Maybe.isJust(joined), 'concat 결과가 Maybe 다');
    assertEquals(JSON.stringify(joined.value), '[1,2]', '안쪽은 Array 의 concat 이다');
});

logSection('Algebra.all — 한 타입의 인스턴스를 한 번에');

test('구조분해로 원하는 구현체만 받는다', () => {
    const { arraySemigroup, arrayFoldable, arrayMonoid } = fp.Algebra.all('array');
    assertEquals(JSON.stringify(arraySemigroup.concat([1], [2])), '[1,2]');
    assertEquals(arrayFoldable.reduce((a, b) => a + b, 0, [1, 2, 3]), 6);
    assertEquals(JSON.stringify(arrayMonoid.empty()), '[]');
});

test('lookup 이 주는 것과 같은 인스턴스다 — 사본이 아니다', () => {
    const all = fp.Algebra.all('array');
    assert(all.arraySemigroup === fp.Semigroup.lookup('array'), 'arraySemigroup');
    assert(all.arrayFoldable === fp.Foldable.lookup('array'), 'arrayFoldable');
    assert(all.arrayMonoid === fp.Monoid.lookup('array'), 'arrayMonoid');
});

test('묶는 기준은 .type 이지 레지스트리 키가 아니다', () => {
    // Semigroupoid 의 'maybe' 키가 가리키는 인스턴스는 Kleisli 합성이라 .type 이
    // 'function' 이다. 키로 묶었다면 all('maybe') 에 있었을 것이다.
    assert('maybeSemigroupoid' in fp.Algebra.all('function'), "all('function') 에 있다");
    assert(!('maybeSemigroupoid' in fp.Algebra.all('maybe')), "all('maybe') 에는 없다");
    assert(fp.Algebra.all('function').maybeSemigroupoid === fp.Semigroupoid.lookup('maybe'),
        '같은 인스턴스다');
});

test('조립 키로 만들어진 것은 키 조각을 이름 앞에 붙인다', () => {
    // plus(array) 로 이것을 보던 때가 있었는데 그 키는 버그였다 — f(x) 는 F<X> 를 뜻하는데
    // Plus 가 아니라 Monoid 를 돌려줬다. 진짜 조립 키로 같은 규칙을 확인한다.
    fp.Semigroup.Maybe('array');
    const mb = fp.Algebra.all('maybe');
    assert('maybeFunctor' in mb, '이름 있는 것은 클래스 이름 그대로');
    assert('maybeArraySemigroup' in mb, '조립 키는 maybe + Array + Semigroup');
    assert(mb.maybeArraySemigroup === fp.Semigroup.lookup('maybe(array)'), '같은 인스턴스다');
});

// Plus 유도본은 이제 그 타입의 이름을 그대로 쓴다. Array 는 이미 Monoid 가 있어 유도가
// 등록되지 않고, Maybe 는 비어 있어 유도본이 그 자리를 갖는다.
test('Plus 유도본은 타입 이름을 그대로 쓴다 — plus(...) 키는 없다', () => {
    const mb = fp.Algebra.all('maybe');
    assert('maybeMonoid' in mb, 'Maybe 의 Monoid 는 유도본이고 이름이 maybeMonoid 다');
    assert(mb.maybeMonoid === fp.Monoid.lookup('maybe'), '같은 인스턴스다');
    assert(!('plusMaybeMonoid' in mb), '옛 이름이 남아 있다');
    assert(!('plusArrayMonoid' in fp.Algebra.all('array')), '옛 이름이 남아 있다');
});

test('조회 시점의 레지스트리를 반영한다 — 열거가 아니다', () => {
    // 매개변수화 인스턴스는 팩토리를 불러야 생긴다. 안쪽 타입 공간은 무한하므로
    // (maybe(maybe(maybe(array))) 도 된다) 미리 열거할 수 없다.
    const before = Object.keys(fp.Algebra.all('maybe'));
    assert(!before.includes('maybeStringSemigroup'), '아직 없다');
    fp.Semigroup.Maybe('string');
    const after = Object.keys(fp.Algebra.all('maybe'));
    assert(after.includes('maybeStringSemigroup'), '팩토리를 부른 뒤에는 있다');
    assertEquals(after.length, before.length + 1, '하나만 늘었다');
});

test('키는 소문자만 받는다', () => {
    let message = '(안 던짐)';
    try { fp.Algebra.all('Array'); } catch (e) { message = e.message; }
    assertEquals(message, 'Algebra.all: key must be lowercase, got Array');
});

test('없는 타입과 문자열 아닌 인자는 던진다', () => {
    const messageOf = fn => { try { fn(); return '(안 던짐)'; } catch (e) { return e.message; } };
    assertEquals(messageOf(() => fp.Algebra.all('없는타입')), 'Algebra.all: unsupported type 없는타입');
    assertEquals(messageOf(() => fp.Algebra.all(123)), 'Algebra.all: key must be a string');
});

test('이름이 겹치지 않는다 — 인스턴스 수와 키 수가 같다', () => {
    for (const key of ['array', 'maybe', 'either', 'number', 'string', 'boolean', 'function', 'object']) {
        const bundle = fp.Algebra.all(key);
        const instances = new Set(Object.values(bundle));
        assertEquals(Object.keys(bundle).length, instances.size, `all('${key}') 에서 이름이 겹친다`);
    }
});

test('역인덱스와 실제 레지스트리가 일치한다 — 문을 우회하면 여기서 걸린다', () => {
    // Algebra.all 은 등록 시점에 만들어진 역인덱스를 꺼낸다. 누가 X.types[키] = 인스턴스 로
    // 직접 쓰면 lookup 은 되는데 인덱스에는 없어 all 에서 조용히 사라진다.
    // 문법으로 막을 방법이 없으므로 이 대조가 유일한 게이트다.
    const inRegistry = new Map();          // .type(소문자) -> Set<인스턴스>
    for (const name of TYPE_CLASSES) {
        for (const instance of Object.values(fp[name].types)) {
            if (!instance || typeof instance.type !== 'string') continue;
            const t = instance.type.toLowerCase();
            if (!inRegistry.has(t)) inRegistry.set(t, new Set());
            inRegistry.get(t).add(instance);
        }
    }
    const missing = [];
    for (const [type, instances] of inRegistry) {
        const bundle = new Set(Object.values(fp.Algebra.all(type)));
        for (const instance of instances) {
            if (!bundle.has(instance)) missing.push(`${type}: ${instance.constructor.name}`);
        }
    }
    assertEquals(missing.join(' | '), '', '레지스트리에 있는데 Algebra.all 에 없는 인스턴스');
});

test('지연 등록도 같은 문을 지난다', () => {
    // 팩토리·트랜스포머가 만드는 인스턴스는 나중에 생긴다. 그것들이 문을 안 지나면
    // 위 대조가 그 시점 이후에만 깨지므로, 여기서 직접 만들어 확인한다.
    fp.Semigroup.Maybe('boolean');
    assert('maybeBooleanSemigroup' in fp.Algebra.all('maybe'), 'Semigroup.Maybe 파생');
    fp.Applicative.Const('boolean');
    // Const 는 이제 자기 타입이다 — Object 묶음이 아니라 const(boolean) 묶음에 있다.
    assert('constBooleanApplicative' in fp.Algebra.all('const(boolean)'), 'Applicative.Const 파생');
    fp.StateT('either');
    assert('statetEitherFunctor' in fp.Algebra.all('statet(either)'), 'StateT 등록');
});

console.log('\n✅ 레지스트리 API tests completed\n');

// Object.prototype 구성원이 조회에 걸리면 안 된다(코덱스 리뷰 ④) — 등록된 것만 인스턴스다.
test('lookup - 프로토타입 구성원은 등록 인스턴스가 아니다', () => {
    for (const key of ['constructor', '__proto__', 'toString', 'hasOwnProperty']) {
        assertThrows(() => fp.Setoid.lookup(key), 'lookup 이 프로토타입 구성원을 돌려줬다: ' + key);
        assertThrows(() => fp.Functor.lookup(key), 'lookup 이 프로토타입 구성원을 돌려줬다: ' + key);
    }
    assertThrows(() => fp.Setoid.Maybe('__proto__'), '팩토리가 프로토타입 키로 인스턴스를 만들었다');
});
