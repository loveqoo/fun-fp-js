// Algebra.type 불변식 — 등록된 모든 인스턴스를 한 번에 검사한다.
//
// `.type` 은 "이 인스턴스가 다루는 첫 번째(대표하는) 타입" 이고 런타임 검사에 쓰인다.
// 검사 경로가 두 갈래라 **대소문자가 조건부로만 안전하다**:
//
//   types.check(val, type)              대소문자 폴백 있음 → 'date' 도 통과한다
//   types.equals(a, b, instance.type)   폴백 없음 → 'Date' 여야 한다
//
// 던지는 것은 Apply.ap 와 Alt.alt 둘이지만, .type 을 글자 그대로 비교하는 자리는 셋이다 —
// unwrapIfSameType 은 어긋나면 던지지 않고 조용히 검사 겹을 안 벗긴다(값은 같다).
// 그래서 "Apply/Alt 를 안 지나니 소문자라도 안전" 은 틀린 추론이다 — docs/internals.md#type
//
// ── 이 파일이 잡는 것과 못 잡는 것 ──────────────────────────────────────
//
// 처음 이 파일은 "정규 태그인가" 만 봤고, 그것을 "틀린 .type 을 막는다" 로 과장했다.
// 리뷰어가 뮤테이션으로 뒤집었다 — `PredicateContravariant.type = 'Maybe'` 는 정규
// 태그라서 통과했다. 그래서 검사를 둘로 나눈다:
//
//   ① 태그가 런타임 검사를 통과하는가  — 라이브러리의 Apply.ap 를 **실제로 태워서** 본다
//   ② 그 태그가 옳은 값인가          — 이름 접두사 + 예외표와 대조한다
//
// ②가 없으면 "정규 태그이지만 틀린 값" 이 통과한다. ①이 없으면 예외표만 고쳐도 통과한다.
//
// **여전히 못 잡는 것**: 예외표 자체가 틀리는 것. 예외는 이유를 함께 적어 사람이 읽고
// 판정하게 한다. 그리고 `checkAndSet` 이 `instance.type` 을 아예 안 읽는 타입클래스
// (Semigroupoid·Category 등)에서는 값이 무엇이든 **동작이 같으므로** 이 파일 말고는
// 게이트가 없다.
import fp from '../index.js';
import { test, assertEquals, assert, logSection } from './utils.js';

const TYPE_CLASSES = [
    'Setoid', 'Ord', 'Semigroup', 'Monoid', 'Group', 'Semigroupoid', 'Category',
    'Filterable', 'Functor', 'Bifunctor', 'Contravariant', 'Profunctor', 'Apply',
    'Applicative', 'Alt', 'Plus', 'Alternative', 'Chain', 'ChainRec', 'Monad',
    'Foldable', 'Extend', 'Comonad', 'Traversable',
    'Strong', 'Choice', 'Wander'
];

// 이름 접두사가 곧 "다루는 타입" 이다.
const BY_PREFIX = {
    Function: 'function', Boolean: 'boolean', Number: 'number', String: 'string',
    Date: 'Date', Array: 'Array', Maybe: 'Maybe', Either: 'Either', Task: 'Task',
    Validation: 'Validation', Reader: 'Reader', Writer: 'Writer', State: 'State',
    Free: 'Free', Object: 'Object', Identity: 'Identity',
};

// 접두사 규칙을 벗어나는 것. **이유 없이 여기 추가하지 마라** — 이유가 곧 판정 근거다.
const EXCEPTIONS = {
    MaybeSemigroupoid: ['function', 'Kleisli 합성 — compose 가 받는 것은 a -> Maybe b 꼴의 함수'],
    MaybeCategory: ['function', '같은 이유'],
    EitherSemigroupoid: ['function', '같은 이유'],
    EitherCategory: ['function', '같은 이유'],
    TaskSemigroupoid: ['function', '같은 이유'],
    TaskCategory: ['function', '같은 이유'],
    TupleBifunctor: ['Array', '런타임 튜플은 Array 다'],
    PredicateContravariant: ['function', 'predicate 는 함수다'],
    FirstSemigroup: ['any', '값 타입을 보지 않는다 — CLAUDE.md 「Traps」'],
    LastSemigroup: ['any', '값 타입을 보지 않는다 — CLAUDE.md 「Traps」'],
    DefaultSetoid: ['any', '===  는 값 타입을 보지 않는다 — lookup(\'default\')'],
    DefaultOrd: ['any', '<= 는 값 타입을 보지 않는다 — lookup(\'default\')'],
    TaggedChoice: ['any', 'Tagged a b = b 라 캐리어가 아무 값이다 — 값 타입을 보지 않는다. review 가 쓰는 P'],
};

// 소문자 키로만 닿는 파생 인스턴스 — 대문자 클래스 이름이 없어 접두사 규칙이 안 통한다.
// 키가 곧 다루는 타입이다. 한때 `plus(maybe)` 였는데 그것은 버그였다 — `f(x)` 는 `F<X>`
// 를 뜻하는데 Plus 가 아니라 Monoid 를 돌려줬다(docs/internals.md#plus-monoid).
const BY_COMPOSED_KEY = { maybe: 'Maybe' };

// 정규 태그 -> 그 태그를 내는 실제 값. 아래 ① 검사가 이 값을 라이브러리에 태운다.
const SAMPLE = {
    Array: [1], Object: { value: 1 }, Date: new Date(0), Maybe: fp.Maybe.Just(1),
    Either: fp.Either.Right(1), Task: fp.Task.of(1), Validation: fp.Validation.Valid(1),
    Reader: fp.Reader.of(1), Writer: fp.Writer.of(1), State: fp.State.of(1),
    Free: fp.Free.of(1), number: 1, string: 'a', boolean: true, function: x => x,
    // Identity·Const 는 자기 타입이다 — { value } 만으로는 평범한 객체와 안 갈린다.
    Identity: fp.Applicative.lookup('identity').of(1),
};

// 'any' 는 "값 타입을 보지 않는다" 는 뜻이라 대표값이 없고 엄격 비교를 통과하지 못한다.
const EXEMPT_FROM_STRICT = new Set(['any']);

// 레지스트리 전부를 훑어 인스턴스를 동일성으로 모은다. 표시 이름은 대문자 키를 쓰되,
// 없으면(조립 키로만 닿는 파생) 소문자 키를 쓴다 — 그것들이 감시 밖에 있었다.
const everyInstance = () => {
    const byInstance = new Map();
    for (const name of TYPE_CLASSES) {
        for (const [key, instance] of Object.entries(fp[name].types)) {
            const found = byInstance.get(instance);
            const seen = found === undefined ? { names: [], keys: [] } : found;
            (key[0] === key[0].toUpperCase() ? seen.names : seen.keys).push(key);
            byInstance.set(instance, seen);
        }
    }
    return [...byInstance.entries()].map(([instance, { names, keys }]) => ({
        // 소문자 키로만 닿는 파생은 이름이 없다. 유도된 `maybe` 는 Semigroup·Monoid 두
        // 인스턴스로 존재하므로 소속 클래스를 붙여야 서로 구분된다.
        label: names.length > 0 ? names[0] : `${instance.constructor.name}(${keys[0]})`,
        composedKey: names.length > 0 ? null : keys[0],
        instance, isNamed: names.length > 0,
    }));
};

const expectedTypeOf = ({ label, composedKey, isNamed }) => {
    if (EXCEPTIONS[label]) return EXCEPTIONS[label][0];
    if (!isNamed) {
        const byKey = BY_COMPOSED_KEY[composedKey];
        return byKey === undefined ? null : byKey;
    }
    const prefix = Object.keys(BY_PREFIX).find(p => label.startsWith(p));
    return prefix ? BY_PREFIX[prefix] : null;
};

// **로드 시점에 한 번 뜬다.** 레지스트리는 조회로 늘어난다 — `Maybe.Semigroup('number')`
// 나 `StateT('maybe')` 를 부르면 `types` 에 키가 생긴다. 아래 테스트들이 그것을 부르므로,
// 매번 다시 훑으면 개수 고정이 **테스트 순서에 따라** 깨진다.
const REGISTERED = everyInstance();

// 태그가 라이브러리의 엄격 비교(types.equals 3인자형)를 통과하는지 실제로 태워 본다.
const strictlyAccepts = (tag, sample) => {
    const probe = new fp.Apply(new fp.Functor((_f, x) => x, tag), (a, _b) => a, tag, null);
    try { probe.ap(sample, sample); return null; }
    catch (e) { return e.message; }
};

logSection('Algebra.type 불변식');

test('레지스트리 순회가 인스턴스를 빠뜨리지도 늘리지도 않는다', () => {
    // 개수를 못 박는다. 인스턴스를 더하거나 지우면 여기서 멈춰 "이 게이트를 갱신하라" 고
    // 말한다 — `>= N` 으로 두면 **느는 쪽**을 통째로 못 본다.
    const all = REGISTERED;
    assertEquals(all.length, 131, '인스턴스 수가 달라졌다 — 새 인스턴스의 .type 을 이 게이트에 넣어라');
    const unnamed = all.filter(r => !r.isNamed).map(r => r.label).sort();
    assertEquals(unnamed.join(','),
        'Monoid(maybe),Semigroup(maybe)',
        '대문자 클래스 이름이 없는 파생 인스턴스 목록이 달라졌다');
});

test('① .type 이 라이브러리의 엄격 비교(Apply.ap)를 실제로 통과한다', () => {
    // types.of 를 복사해 적지 않는다 — 복사본은 원본이 바뀌어도 안 따라오고,
    // 검사 대상 로직을 복제하면 그 로직 자신의 드리프트는 원리적으로 못 잡는다.
    // 대신 공개 클래스로 즉석 인스턴스를 만들어 라이브러리의 검사를 그대로 태운다.
    const bad = [];
    for (const { label, instance } of REGISTERED) {
        const t = instance.type;
        if (EXEMPT_FROM_STRICT.has(t)) continue;
        const sample = SAMPLE[t];
        if (sample === undefined) { bad.push(`${label}: .type='${t}' 은 정규 태그가 아니다`); continue; }
        const failure = strictlyAccepts(t, sample);
        if (failure) bad.push(`${label}: .type='${t}' 이 엄격 비교에서 던진다 — ${failure}`);
    }
    assertEquals(bad.join(' | '), '', '엄격 비교를 통과하지 못하는 .type');
});

test('② .type 이 옳은 값이다 — 이름 접두사 또는 예외표와 일치', () => {
    // ①만으로는 "정규 태그이지만 틀린 값" 이 통과한다.
    // 실측: PredicateContravariant.type 을 'Maybe' 로 바꿔도 ①은 통과했다.
    const bad = [];
    for (const row of REGISTERED) {
        const expected = expectedTypeOf(row);
        if (expected === null) {
            bad.push(`${row.label}: 접두사도 예외표도 없다 — BY_PREFIX 나 EXCEPTIONS 에 이유와 함께 넣어라`);
            continue;
        }
        if (row.instance.type !== expected) {
            bad.push(`${row.label}: .type='${row.instance.type}' 인데 '${expected}' 여야 한다`);
        }
    }
    assertEquals(bad.join(' | '), '', '틀린 .type');
});

test('예외표의 항목에는 전부 이유가 붙어 있다', () => {
    for (const [name, entry] of Object.entries(EXCEPTIONS)) {
        assert(Array.isArray(entry) && entry.length === 2 && entry[1].length > 0,
            `${name}: 예외에 이유가 없다`);
    }
});

test('팩토리로만 생기는 파생 인스턴스도 정규 태그다', () => {
    // 레지스트리 순회로는 안 닿는다 — 호출해야 생긴다. 여기서 명시적으로 부른다.
    const cases = [
        ['Maybe.Semigroup("number")', fp.Maybe.Semigroup('number'), 'Maybe'],
        ['Maybe.Monoid("number")', fp.Maybe.Monoid('number'), 'Maybe'],
        ['Either.Semigroup("string","number")', fp.Either.Semigroup('string', 'number'), 'Either'],
        ['Applicative.Const("array")', fp.Applicative.Const('array'), 'Const(array)'],
        ['Semigroup.lookup("maybe(maybe(array))")', fp.Semigroup.lookup('maybe(maybe(array))'), 'Maybe'],
        // 컨테이너 Setoid/Ord. 명세 게이트도 법칙 게이트도 .type **값**은 안 본다 —
        // 여기가 유일한 감시자다. Setoid.Struct 는 레지스트리 밖이라 더욱 그렇다.
        ['Maybe.Setoid("number")', fp.Maybe.Setoid('number'), 'Maybe'],
        ['Maybe.Ord("number")', fp.Maybe.Ord('number'), 'Maybe'],
        ['Setoid.Array("number")', fp.Setoid.Array('number'), 'Array'],
        ['Ord.Array("number")', fp.Ord.Array('number'), 'Array'],
        ['Either.Setoid("string","number")', fp.Either.Setoid('string', 'number'), 'Either'],
        ['Setoid.Struct({a:"number"})', fp.Setoid.Struct({ a: 'number' }), 'Object'],
    ];
    for (const [label, instance, expected] of cases) {
        assertEquals(instance.type, expected, `${label}.type`);
    }
});

test('트랜스포머 인스턴스도 정규 태그다 — 조립 태그 StateT(Maybe) 꼴', () => {
    // 이것들은 레지스트리 순회로 안 닿는다. StateT('maybe') 를 부르는 순간 Functor~Monad
    // 다섯 곳에 statet(maybe) 키가 생긴다. 게이트가 지금까지 통과한 것은 이 파일이
    // 트랜스포머를 안 만들었기 때문이지 검사했기 때문이 아니었다 — 명시적으로 만든다.
    const cases = [
        ['statet(maybe)', fp.StateT('maybe'), 'StateT(Maybe)'],
        ['eithert(task)', fp.EitherT('task'), 'EitherT(Task)'],
        ['readert(maybe)', fp.ReaderT('maybe'), 'ReaderT(Maybe)'],
        // WriterT 만 Monoid 까지 키에 담는다 — writert(<M>,<monoid>)
        ['writert(maybe,array)', fp.WriterT('maybe', fp.Monoid.lookup('array')), 'WriterT(Maybe,Array)'],
    ];
    for (const [key, T, expected] of cases) {
        for (const cls of ['Functor', 'Apply', 'Applicative', 'Chain', 'Monad']) {
            assertEquals(fp[cls].lookup(key).type, expected, `${cls}.lookup('${key}').type`);
        }
        // 태그가 실제 값의 런타임 태그와 같아야 엄격 비교를 지난다.
        const value = T.of(1);
        assertEquals(strictlyAccepts(expected, value), null,
            `${key}: '${expected}' 가 엄격 비교를 통과하지 못한다`);
    }
});

test('앞서 드리프트했던 자리를 값으로 고정한다', () => {
    assertEquals(fp.Setoid.lookup('date').type, 'Date');
    assertEquals(fp.Ord.lookup('date').type, 'Date');
    assertEquals(fp.Filterable.lookup('object').type, 'Object');
    assertEquals(fp.Foldable.lookup('object').type, 'Object');
});

test('레지스트리 키는 소문자 그대로다 — .type 과 별개다', () => {
    assert(fp.Setoid.types.date === fp.Setoid.types.DateSetoid, "키 'date' 가 살아 있다");
    assert(fp.Filterable.types.object === fp.Filterable.types.ObjectFilterable, "키 'object' 가 살아 있다");
});

test('Date / Object 인스턴스가 정규 태그로도 그대로 동작한다', () => {
    const d1 = new Date(1), d2 = new Date(1), d3 = new Date(2);
    assertEquals(fp.Setoid.lookup('date').equals(d1, d2), true);
    assertEquals(fp.Setoid.lookup('date').equals(d1, d3), false);
    assertEquals(fp.Ord.lookup('date').lte(d1, d3), true);
    assertEquals(JSON.stringify(fp.Filterable.lookup('object').filter(v => v > 1, { a: 1, b: 2 })), '{"b":2}');
    assertEquals(fp.Foldable.lookup('object').reduce((a, b) => a + b, 0, { a: 1, b: 2 }), 3);
});

test('.type 이 에러 메시지에 그대로 나간다 — 사용자가 보는 문자열이다', () => {
    // `.type` 을 고치면 메시지가 따라 바뀐다. 이것이 이 변경의 **유일한 관측 가능한
    // 동작 변화**였는데 처음엔 어디에도 안 박혀 있었다. 부분 문자열이 아니라 전문으로
    // 대조한다 — `includes` 는 대부분 통과해서 아무것도 고정하지 못한다(규칙 15).
    const messageOf = fn => { try { fn(); return '(안 던짐)'; } catch (e) { return e.message; } };
    assertEquals(messageOf(() => fp.Setoid.lookup('date').equals(1, 2)),
        'Setoid.equals: arguments must be the same type and match Date');
    assertEquals(messageOf(() => fp.Ord.lookup('date').lte(1, 2)),
        'Ord.lte: arguments must be the same type and match Date');
    assertEquals(messageOf(() => fp.Filterable.lookup('object').filter(x => x, [1])),
        'Filterable.filter: arguments must be (function, Object)');
    assertEquals(messageOf(() => fp.Foldable.lookup('object').reduce((a, _b) => a, 0, [1])),
        'Foldable.reduce: arguments must be (function, initial, Object)');
});

console.log('\n✅ Algebra.type 불변식 tests completed\n');
