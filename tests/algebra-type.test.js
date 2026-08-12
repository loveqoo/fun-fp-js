// Algebra.type 불변식 — 등록된 모든 인스턴스에 대해 한 번에 검사한다.
//
// `.type` 은 "이 인스턴스가 다루는 첫 번째(대표하는) 타입" 이고, 런타임 검사에 쓰인다.
// 그런데 검사 경로가 두 갈래라 **대소문자가 조건부로만 안전하다**:
//
//   types.check(val, type)              대소문자 폴백 있음 → 'date' 도 통과한다
//   types.equals(a, b, instance.type)   폴백 없음 → 'Date' 여야 한다
//
// 후자는 Apply.ap 와 Alt.alt 두 곳뿐이므로, Apply/Alt 인스턴스가 없는 타입은 소문자로
// 적어도 오늘은 통과한다. **그 타입에 Apply 나 Alt 가 생기는 순간 조용히 깨진다.**
//
// 그래서 좌표(그 네 곳)가 아니라 유형으로 막는다 — `.type` 은 반드시 types.of() 가
// 돌려주는 정규 태그여야 한다. 새 인스턴스가 'date' 같은 비정규 태그를 쓰면 여기서 걸린다.
import fp from '../index.js';
import { test, assertEquals, assert, logSection } from './utils.js';

const TYPE_CLASSES = [
    'Setoid', 'Ord', 'Semigroup', 'Monoid', 'Group', 'Semigroupoid', 'Category',
    'Filterable', 'Functor', 'Bifunctor', 'Contravariant', 'Profunctor', 'Apply',
    'Applicative', 'Alt', 'Plus', 'Alternative', 'Chain', 'ChainRec', 'Monad',
    'Foldable', 'Extend', 'Comonad', 'Traversable'
];

// index.js 의 types.of 와 같은 규칙. 라이브러리가 export 하지 않으므로 여기 옮겨 적는다.
const typeOf = a => {
    if (a == null) return a === null ? 'null' : 'undefined';
    if (a._typeName !== undefined) return a._typeName;
    const t = typeof a;
    if (t !== 'object') return t;
    if (Array.isArray(a)) return 'Array';
    return a.constructor?.name || 'object';
};

// 정규 태그 -> 그 태그를 내는 대표값. `.type` 은 이 표의 키 중 하나여야 한다.
const REPRESENTATIVE = {
    Array: [1],
    Object: { value: 1 },
    Date: new Date(0),
    Maybe: fp.Maybe.Just(1),
    Either: fp.Either.Right(1),
    Task: fp.Task.of(1),
    Validation: fp.Validation.Valid(1),
    Reader: fp.Reader.of(1),
    Writer: fp.Writer.of(1),
    State: fp.State.of(1),
    Free: fp.Free.of(1),
    number: 1,
    string: 'a',
    boolean: true,
    function: x => x,
};

// 'any' 는 "값 타입을 보지 않는다" 는 뜻이라 대표값이 없다 — CLAUDE.md 「Traps」에 명시.
const EXEMPT = new Set(['any']);

const everyInstance = () => {
    const seen = new Map();   // 클래스 이름 -> 인스턴스 (동일 인스턴스가 여러 키에 걸린다)
    for (const name of TYPE_CLASSES) {
        for (const [key, instance] of Object.entries(fp[name].types)) {
            if (key[0] === key[0].toUpperCase()) seen.set(key, instance);
        }
    }
    return [...seen.entries()];
};

logSection('Algebra.type 불변식');

test('등록된 인스턴스를 하나도 빠뜨리지 않고 훑는다', () => {
    const all = everyInstance();
    assert(all.length >= 120, `인스턴스가 ${all.length}개뿐이다 — 레지스트리 순회가 깨졌다`);
});

test('모든 인스턴스의 .type 은 types.of() 가 내는 정규 태그다', () => {
    const bad = [];
    for (const [name, instance] of everyInstance()) {
        if (EXEMPT.has(instance.type)) continue;
        const sample = REPRESENTATIVE[instance.type];
        if (sample === undefined) {
            bad.push(`${name}: .type='${instance.type}' 은 정규 태그가 아니다`);
            continue;
        }
        const canonical = typeOf(sample);
        if (canonical !== instance.type) {
            bad.push(`${name}: .type='${instance.type}' 인데 정규 태그는 '${canonical}'`);
        }
    }
    assertEquals(bad.join(' | '), '', '비정규 .type');
});

test('대소문자 폴백이 없는 검사(Apply.ap)가 정규 태그를 요구한다', () => {
    // 'Object' 를 'object' 로 적으면 여기서 깨진다 — Identity 가 그 자리다.
    const { ap } = fp.Apply.of('identity');
    assertEquals(ap({ value: x => x + 1 }, { value: 1 }).value, 2);
});

test('앞서 드리프트했던 자리를 값으로 고정한다', () => {
    assertEquals(fp.Setoid.of('date').type, 'Date');
    assertEquals(fp.Ord.of('date').type, 'Date');
    assertEquals(fp.Filterable.of('object').type, 'Object');
    assertEquals(fp.Foldable.of('object').type, 'Object');
});

test('레지스트리 키는 소문자 그대로다 — .type 과 별개다', () => {
    assert(fp.Setoid.types.date === fp.Setoid.types.DateSetoid, "키 'date' 가 살아 있다");
    assert(fp.Filterable.types.object === fp.Filterable.types.ObjectFilterable, "키 'object' 가 살아 있다");
});

test('Date / Object 인스턴스가 정규 태그로도 그대로 동작한다', () => {
    const d1 = new Date(1), d2 = new Date(1), d3 = new Date(2);
    assertEquals(fp.Setoid.of('date').equals(d1, d2), true);
    assertEquals(fp.Setoid.of('date').equals(d1, d3), false);
    assertEquals(fp.Ord.of('date').lte(d1, d3), true);
    assertEquals(JSON.stringify(fp.Filterable.of('object').filter(v => v > 1, { a: 1, b: 2 })), '{"b":2}');
    assertEquals(fp.Foldable.of('object').reduce((a, b) => a + b, 0, { a: 1, b: 2 }), 3);
});

console.log('\n✅ Algebra.type 불변식 tests completed\n');
