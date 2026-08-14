// Static Land 법칙을 **등록된 전 인스턴스 + 팩토리 산물**에 돌린다.
//
// 왜 있는가: `tests/ord.test.js` 에 반대칭 법칙 테스트가 있었는데도 `Ord` 가 `equals` 없이
// 살아 있었다. 두 가지가 겹쳤다.
//
//   1. 검사할 인스턴스를 파일에 이름으로 적어 두는 방식이라, 적힌 둘(maybe(number),
//      array(number))에만 법칙이 돌았다. StringLengthOrd 는 등록돼 있어도 아무도 안 봤다.
//   2. 그 법칙이 `O.lte` 와 **다른 인스턴스의** `S.equals` 를 섞어 썼다.
//
// 명세는 반대칭을 이렇게 쓴다 — "if `S.lte(a, b)` and `S.lte(b, a)`, then `S.equals(a, b)`".
// **글자가 하나다.** 한 인스턴스가 두 연산을 다 져야 한다는 뜻이고, 그 사실이 대입으로
// 지워졌다. 그래서 이 파일의 규칙은 하나다:
//
//   Setoid·Ord 법칙은 **인스턴스 자신의 메서드만** 쓴다. 두 번째 lookup 이 나오면 대입이다.
//
// (Semigroup·Monoid·Group 의 `≡` 는 명세가 어느 Setoid 인지 말하지 않는다. 그쪽은 타입에
//  맞는 Setoid 를 쓴다 — 아래 EQ.)
//
// 이 파일이 한 번 뚫린 이력 — 같은 실수를 반복하지 않으려고 적어 둔다:
//   · 참조 타입 표본에 "서로 다른 객체인데 동치인 쌍" 이 없어서, 짝 Setoid 를 엉뚱한 것으로
//     바꿔도 42/42 초록이었다. 반대칭 분기가 a === b 일 때만 탔기 때문이다.
//   · 레지스트리 순회만 해서 `Ord.Array('number')` 같은 팩토리 산물을 아예 안 봤다.
//   둘 다 아래에서 막는다. 새 표본·새 팩토리를 넣을 때 이 두 가지를 먼저 확인하라.
//
// 못 잡는 것 (규칙 31-1):
//   - 표본이 못 가르는 위반은 못 잡는다. 새 인스턴스를 넣을 때 **그 인스턴스가 유도하는
//     동치를 가르는 쌍**이 표본에 있는지 확인하라. 없으면 검사는 공허하게 통과한다.
//   - Functor 는 등록된 12개 전부에 돈다(아래 OBSERVE). 그러나 Apply·Applicative·Alt·
//     Chain·ChainRec·Extend·Comonad·Traversable 의 법칙은 여전히 각 tests/*.test.js 가
//     이름을 적어 둔 인스턴스만 본다(레지스트리를 순회하지 않는다) — Ord 를 놓쳤던 것과
//     같은 모양의 구멍이 그만큼 남아 있다.
//   - 컨테이너는 값이 아니라 **관측**으로 비교한다(OBSERVE). Reader/State 는 표본 환경·
//     상태에서만, Task 는 fork 결과로만 본다 — 그 표본이 못 가르는 차이는 못 잡는다.
//   - 'function' 의 동등은 관측 동등이다 — 표본 입력에서만 같음을 본다.
//   - FACTORY_CASES 는 이름을 적어 두는 명단이다. 팩토리 산물은 레지스트리 순회로 안 닿기
//     때문인데, 그래서 새 팩토리를 만들고 여기 안 넣으면 감시 밖이다.
//   - **Foldable 법칙은 reduce 를 reduce 로 정의하는 자기참조라, reduce 전체가 뒤집혀도
//     양쪽이 같이 뒤집혀 통과한다.** 실측: ArrayFoldable.reduce 를 arr.reverse().reduce 로
//     바꿔도 이 파일은 초록이다(전체 스위트는 tests/foldable.test.js 의 순서 고정이 잡는다).
//     비가환 연산을 쓰는 것은 두 경로가 서로 어긋나는 구현을 잡기 위한 것이지 순서를
//     고정하지는 못한다 — 컨테이너의 순서는 각 타입의 테스트가 져야 한다.
//   - KNOWN_DEVIATIONS 에 있는 것은 검사에서 빠진다. 조용히 빠지지 않도록 목록과 이유를
//     별도 검사가 고정한다.
//   - **Strong/Choice 는 표준 법칙 넷 중 둘만 돈다.** 쌍대(first ≡ swap∘second∘swap)와
//     사영(lmap(fst) ≡ rmap(fst)∘first)은 돌지만, 결합(first∘first ≡ dimap assoc unassoc ∘ first)
//     과 자연성은 튜플·Either 재결합 함수가 더 필요해 넣지 않았다.
//   - **Wander 는 법칙이 0개다.** wander 는 순회 자연변환과 Applicative 합성을 요구해
//     등가식만으로 부족하다 — Traversable 을 뺀 것과 같은 이유이고 KNOWN_DEVIATIONS 에 있다.
//     부모인 Strong/Choice 법칙은 그 인스턴스에도 돈다.
import fp from '../index.js';
import { test, assertEquals, logSection } from './utils.js';

const { Just, Nothing } = fp.Maybe;
const { Left, Right } = fp.Either;

// Const 는 **불러야 생긴다** — 모노이드마다 하나씩이고 조립 키로 무한히 만들 수 있어
// 미리 다 만들 수 없다. 그래서 로드 직후 레지스트리에 const(...) 키가 0개이고, 아무도
// 안 부르면 이 파일의 순회가 볼 것이 없다(실측: of 를 망가뜨려도 이 게이트가 초록이었다).
//
// 라이브러리가 미리 만들 일은 아니다 — 요구하면 만들어 주면 된다. 다만 **검사를 위해
// 기본 하나는 여기서 부른다**(소유자 판단 2026-08-14). 숫자 모노이드를 고른 이유는
// 아래 Object 표본(`{ value: 1 }`)이 그대로 유효한 상자가 되기 때문이다 — 배열 모노이드면
// 상자 안이 배열이어야 해서 표본 장치를 통째로 고쳐야 한다.
fp.Applicative.Const(fp.Monoid.lookup('number'));
// Forget 도 같다 — monoid 마다 하나씩이라 불러야 생긴다. **숫자 모노이드를 쓴다**:
// Forget 은 안에서 Applicative.Const 를 만드는데, 배열이면 상자 안이 배열이어야 해서
// 위와 같은 이유로 Object 표본과 어긋난다.
fp.Wander.Forget(fp.Monoid.lookup('number'));

// 등록된 인스턴스를 (표시키, 인스턴스)로. 별칭으로 여러 번 나오므로 한 번만 본다.
const instancesOf = name => {
    const seen = new Set();
    const out = [];
    for (const [key, instance] of Object.entries(fp[name].types)) {
        if (seen.has(instance)) continue;
        seen.add(instance);
        out.push([key, instance]);
    }
    return out;
};

// **팩토리를 부르기 전에 뜬다.** 레지스트리는 조회로 늘어나므로, 아래 FACTORY_CASES 가
// maybe(array) 같은 키를 만들어 넣으면 순회가 그것까지 훑는다. 그런데 컨테이너 인스턴스는
// .type('Maybe')만으로 표본을 정할 수 없다 — 안쪽 타입이 다르면 concat 이 던진다.
const REGISTERED = ['Setoid', 'Ord', 'Semigroup', 'Monoid', 'Group']
    .reduce((acc, n) => { acc[n] = instancesOf(n); return acc; }, {});

// ─── 표본 ────────────────────────────────────────────────────────────
const SAMPLES = {
    number: [0, 1, 2, -3, 0.5],
    // 'ab'/'cd' 는 길이가 같고 내용이 다르다 — StringLengthOrd 의 반대칭을 가른다.
    // 'é'(NFC) 와 'é'(NFD) 는 글자로는 다르고 로케일로는 같다 — StringLocaleSetoid 를 가른다.
    string: ['', 'a', 'ab', 'cd', 'ba', '\u00e9', 'e\u0301'],
    boolean: [true, false],
    // 참조 타입은 **서로 다른 객체인데 동치인 쌍**이 반드시 있어야 한다. 없으면 반대칭
    // 검사가 a === b 일 때만 타서, equals 를 === 로 바꿔놔도 통과한다(실측으로 확인했다).
    Date: [new Date(0), new Date(0), new Date(1), new Date(2)],
    // 'any' 는 값 타입을 안 보지만 인자끼리는 같은 타입이어야 한다 — 한 타입으로 채운다.
    any: [1, 2, 3],
    Array: [[], [], [1], [1], [2, 3], [1, 2]],
    Maybe: [Nothing(), Nothing(), Just(1), Just(1), Just(2)],
    function: [x => x + 1, x => x * 2, x => x - 3],
};

// 기본 표본으로는 법칙이 성립할 수 없는 인스턴스. **이유가 곧 판정 근거다.**
const SAMPLE_OVERRIDES = {
    NumberProductGroup: [
        [1, 2, 0.5, 4, 0.25],
        '0 은 곱셈 역원이 아예 없다(1/0 = Infinity, 0*Infinity = NaN). 그 밖의 값도 a*(1/a) 가 1이 되려면 '
        + '반올림이 상쇄돼야 해서 49 나 9.571… 같은 평범한 값에서 깨진다 — 2의 거듭제곱은 안전한 선택이지 유일한 조건이 아니다',
    ],
};

// 'function' 의 관측 동등에 쓰는 입력.
const FN_INPUTS = [0, 1, -2, 7];

// Semigroup/Monoid/Group 의 `≡` — 명세가 어느 Setoid 인지 말하지 않으므로 타입으로 고른다.
const EQ = {
    number: (a, b) => Object.is(a, b),
    string: (a, b) => a === b,
    boolean: (a, b) => a === b,
    any: (a, b) => fp.Setoid.lookup('default').equals(a, b),
    Date: (a, b) => fp.Setoid.lookup('date').equals(a, b),
    Array: (a, b) => fp.Setoid.Array('number').equals(a, b),
    Maybe: (a, b) => fp.Maybe.Setoid('number').equals(a, b),
    // 관측 동등 — 함수의 동등은 결정 불가라 표본 입력에서만 본다.
    function: (f, g) => FN_INPUTS.every(x => Object.is(f(x), g(x))),
};

// ─── 팩토리로만 생기는 인스턴스 ──────────────────────────────────────
// 레지스트리 순회로는 안 닿는다. 표본이 인스턴스마다 다르므로 함께 적는다.
const maybeArrayEq = fp.Maybe.Setoid(fp.Setoid.Array('number'));
const eitherArrayArrayEq = fp.Either.Setoid(fp.Setoid.Array('string'), fp.Setoid.Array('number'));
// 안쪽이 StringLengthOrd 인 경우가 중요하다. 이 순서는 'ab' 와 'cd' 를 같은 자리에 놓으므로
// 반대칭이 equals(['ab'],['cd']) === true 를 요구한다. 짝 Setoid 를 안쪽 Ord 가 아니라
// **키로** 조회하면(Setoid.Array('string')) false 가 나와 법칙이 깨진다 — 그 지름길을 막는다.
const lengthOrd = fp.Ord.lookup('StringLengthOrd');
const FACTORY_CASES = [
    ['Maybe.Ord("number")', 'Ord', fp.Maybe.Ord('number'), SAMPLES.Maybe],
    ['Ord.Array("number")', 'Ord', fp.Ord.Array('number'), SAMPLES.Array],
    ['Ord.Array(StringLengthOrd)', 'Ord', fp.Ord.Array(lengthOrd),
        [[], [], ['ab'], ['cd'], ['xyz'], ['ab', 'q']]],
    ['Maybe.Ord(StringLengthOrd)', 'Ord', fp.Maybe.Ord(lengthOrd),
        [Nothing(), Nothing(), Just('ab'), Just('cd'), Just('xyz')]],
    ['Maybe.Setoid("number")', 'Setoid', fp.Maybe.Setoid('number'), SAMPLES.Maybe],
    ['Setoid.Array("number")', 'Setoid', fp.Setoid.Array('number'), SAMPLES.Array],
    ['Either.Setoid("string","number")', 'Setoid', fp.Either.Setoid('string', 'number'),
        [Left('a'), Left('a'), Left('b'), Right(1), Right(1), Right(2)]],
    ['Setoid.Struct({a:"number"})', 'Setoid', fp.Setoid.Struct({ a: 'number' }),
        [{ a: 1 }, { a: 1 }, { a: 2 }]],
    ['Maybe.Semigroup("array")', 'Semigroup', fp.Maybe.Semigroup('array'),
        [Nothing(), Just([1]), Just([1]), Just([2, 3])], (a, b) => maybeArrayEq.equals(a, b)],
    ['Maybe.Monoid("array")', 'Monoid', fp.Maybe.Monoid('array'),
        [Nothing(), Just([1]), Just([1]), Just([2, 3])], (a, b) => maybeArrayEq.equals(a, b)],
    ['Either.Semigroup("array","array")', 'Semigroup', fp.Either.Semigroup('array', 'array'),
        [Left(['e']), Left(['e']), Right([1]), Right([1]), Right([2, 3])],
        (a, b) => eitherArrayArrayEq.equals(a, b)],
];

// ─── Functor — 컨테이너는 값이 아니라 관측으로 비교한다 ──────────────
// Task·Reader·State 는 안에 함수가 있어 구조 비교가 안 된다. 그래서 타입마다 "여는 법" 을
// 정하고 그 결과를 비교한다. 여는 법이 없는 타입이 생기면 아래 검사가 멈추고 요구한다.
const FN_INPUTS_F = [0, 1, -2, 7];
const ENVS = [{ n: 1 }, { n: 5 }];
const STATES = [0, 3];
const forkSync = t => {
    let out = ['(안 열림)'];
    t.fork(e => { out = ['err', String(e)]; }, v => { out = ['ok', v]; });
    return out;
};
const OBSERVE = {
    // 'any' 는 "값 타입을 보지 않는다" 는 뜻이라 열 것이 없다 — 값 자체가 관측이다.
    any: v => v,
    function: f => FN_INPUTS_F.map(f),
    // Identity·Const 는 자기 타입이다. 한때 셋이 'Object' 를 공유해 서로 섞여 들어갔다.
    Identity: v => v.value,
    'Const(number)': v => v.value,
    Object: v => v.value,
    Array: v => v,
    Maybe: v => (v.isNothing() ? ['Nothing'] : ['Just', v.value]),
    Either: v => (v.isLeft() ? ['Left', v.value] : ['Right', v.value]),
    Task: forkSync,
    Validation: v => (v.isValid() ? ['Valid', v.value] : ['Invalid', v.errors]),
    Reader: v => ENVS.map(e => v.run(e)),
    Writer: v => v.run(),
    State: v => STATES.map(st => v.run(st)),
    Free: v => v.value,
};
// 표본은 **그 타입의 갈림길을 담아야** 한다 — Nothing/Just, Left/Right, 성공/실패처럼.
const FUNCTOR_SAMPLES = {
    function: [x => x + 1, x => x * 3],
    // 캐리어는 반드시 그 타입의 생성자로 만든다 — { value } 리터럴은 평범한 객체다.
    Identity: [fp.Applicative.lookup('identity').of(1), fp.Applicative.lookup('identity').of(7)],
    'Const(number)': [fp.Applicative.Const('number').wrap(1), fp.Applicative.Const('number').wrap(7)],
    Object: [{ value: 1 }, { value: 7 }],
    Array: [[], [1], [2, 3]],
    Maybe: [Nothing(), Just(1)],
    Either: [Left('e'), Right(1)],
    Task: [fp.Task.of(1), fp.Task.rejected('boom')],
    Validation: [fp.Validation.Valid(1), fp.Validation.Invalid(['e'], fp.Monoid.lookup('array'))],
    Reader: [fp.Reader.of(1), fp.Reader.asks(e => e.n)],
    Writer: [fp.Writer.of(1), fp.Writer.tell(['w'])],
    State: [fp.State.of(1), fp.State.get, fp.State.modify(n => n + 1)],
    Free: [fp.Free.of(1), fp.Free.of(7)],
};
const REGISTERED_FUNCTORS = instancesOf('Functor');

// ─── 법칙 ────────────────────────────────────────────────────────────
const show = v => v instanceof Date ? `Date(${v.getTime()})`
    : typeof v === 'function' ? '<function>'
    : v && typeof v.toString === 'function' && !Array.isArray(v) && typeof v === 'object' && (v.constructor && v.constructor.name) !== 'Object'
        ? String(v) : JSON.stringify(v);

const LAWS = {
    Setoid: (S, xs, _eq, fail) => {
        for (const a of xs) {
            S.equals(a, a) === true || fail(`반사성 깨짐: equals(${show(a)}, 같은 값) !== true`);
            for (const b of xs) {
                S.equals(a, b) === S.equals(b, a)
                    || fail(`대칭성 깨짐: equals(${show(a)}, ${show(b)}) !== equals(${show(b)}, ${show(a)})`);
                for (const c of xs) {
                    (S.equals(a, b) && S.equals(b, c)) && !S.equals(a, c)
                        && fail(`추이성 깨짐: ${show(a)} ~ ${show(b)} ~ ${show(c)} 인데 ${show(a)} !~ ${show(c)}`);
                }
            }
        }
    },
    // 반대칭이 이 파일의 존재 이유다 — lte 와 equals 를 **같은 인스턴스**에서 꺼낸다.
    Ord: (O, xs, _eq, fail) => {
        for (const a of xs) {
            for (const b of xs) {
                (O.lte(a, b) || O.lte(b, a))
                    || fail(`전순서 깨짐: ${show(a)} 와 ${show(b)} 가 서로 비교 불가`);
                (O.lte(a, b) && O.lte(b, a)) && !O.equals(a, b)
                    && fail(`반대칭 깨짐: ${show(a)} 와 ${show(b)} 가 같은 자리인데 equals 가 false`);
                for (const c of xs) {
                    (O.lte(a, b) && O.lte(b, c)) && !O.lte(a, c)
                        && fail(`추이성 깨짐: ${show(a)} ≤ ${show(b)} ≤ ${show(c)} 인데 ${show(a)} ≰ ${show(c)}`);
                }
            }
        }
    },
    Semigroup: (S, xs, eq, fail) => {
        for (const a of xs) for (const b of xs) for (const c of xs) {
            eq(S.concat(S.concat(a, b), c), S.concat(a, S.concat(b, c)))
                || fail(`결합법칙 깨짐: (${show(a)} · ${show(b)}) · ${show(c)} ≠ ${show(a)} · (${show(b)} · ${show(c)})`);
        }
    },
    Monoid: (M, xs, eq, fail) => {
        for (const a of xs) {
            eq(M.concat(a, M.empty()), a) || fail(`우항등 깨짐: ${show(a)} · empty ≠ ${show(a)}`);
            eq(M.concat(M.empty(), a), a) || fail(`좌항등 깨짐: empty · ${show(a)} ≠ ${show(a)}`);
        }
    },
    Group: (G, xs, eq, fail) => {
        for (const a of xs) {
            eq(G.concat(a, G.invert(a)), G.empty()) || fail(`우역원 깨짐: ${show(a)} · inv ≠ empty`);
            eq(G.concat(G.invert(a), a), G.empty()) || fail(`좌역원 깨짐: inv · ${show(a)} ≠ empty`);
        }
    },
};
// Monoid·Group 은 상위의 법칙도 함께 져야 한다 — 명세의 "same T" 사슬 그대로다.
const LAW_CHAIN = { Setoid: ['Setoid'], Ord: ['Ord'], Semigroup: ['Semigroup'], Monoid: ['Semigroup', 'Monoid'], Group: ['Semigroup', 'Monoid', 'Group'] };

const samplesFor = (label, type) => {
    const override = SAMPLE_OVERRIDES[label];
    const picked = override === undefined || override === null ? undefined : override[0];
    return picked === undefined || picked === null ? SAMPLES[type] : picked;
};

const runAll = name => {
    const broken = [];
    let checked = 0;
    for (const [label, instance] of REGISTERED[name]) {
        const xs = samplesFor(label, instance.type);
        if (xs === undefined) {
            broken.push(`${label}: .type='${instance.type}' 의 표본이 없다 — SAMPLES 에 넣어라`);
            continue;
        }
        checked++;
        for (const law of LAW_CHAIN[name]) {
            LAWS[law](instance, xs, EQ[instance.type], msg => broken.push(`${label}: ${msg}`));
        }
    }
    return { broken, checked };
};

// 법칙 하나가 깨지면 표본 조합만큼 쏟아진다. 읽을 수 있게 앞 몇 건만 보이고 나머지는 접는다.
const CAP = 5;
const report = broken => broken.length <= CAP
    ? broken.join(' | ')
    : `${broken.slice(0, CAP).join(' | ')} | …외 ${broken.length - CAP}건`;

logSection('Static Land 법칙 — 등록된 전 인스턴스');

for (const [name, count] of [['Setoid', 7], ['Ord', 6], ['Semigroup', 13], ['Monoid', 11], ['Group', 3]]) {
    test(`${name} — 등록된 ${count}개 전부`, () => {
        const { broken, checked } = runAll(name);
        assertEquals(report(broken), '', `${name} 법칙`);
        assertEquals(checked, count, `법칙을 돌린 ${name} 인스턴스 수가 달라졌다`);
    });
}

test('팩토리로만 생기는 인스턴스도 법칙을 지킨다', () => {
    // 레지스트리 순회로는 안 닿는다 — 이것이 없으면 Ord.Array/Maybe.Ord 의 짝 Setoid 가
    // 엉뚱해도 초록이 난다(실측으로 확인했다).
    const broken = [];
    for (const [label, name, instance, xs, eq] of FACTORY_CASES) {
        for (const law of LAW_CHAIN[name]) {
            LAWS[law](instance, xs, (eq === undefined || eq === null) ? EQ[instance.type] : eq, msg => broken.push(`${label}: ${msg}`));
        }
    }
    assertEquals(report(broken), '', '팩토리 산물의 법칙');
    assertEquals(FACTORY_CASES.length, 11, '팩토리 명단이 달라졌다 — 새 팩토리를 넣었으면 표본도 넣어라');
});

test('Functor — 등록된 12개 전부에 항등·합성이 돈다', () => {
    // 명세: map(id, a) ≡ a · map(compose(f,g), a) ≡ map(f, map(g, a))
    const idf = x => x;
    const f = x => (typeof x === 'number' ? x + 1 : x);
    const g = x => (typeof x === 'number' ? x * 2 : x);
    const snap = (obs, v) => JSON.stringify(obs(v));
    const broken = [];
    let checked = 0;
    for (const [label, F] of REGISTERED_FUNCTORS) {
        const obs = OBSERVE[F.type], xs = FUNCTOR_SAMPLES[F.type];
        if (!obs || !xs) {
            broken.push(`${label}: .type='${F.type}' 의 여는 법 또는 표본이 없다 — OBSERVE/FUNCTOR_SAMPLES 에 넣어라`);
            continue;
        }
        checked++;
        for (const a of xs) {
            snap(obs, F.map(idf, a)) === snap(obs, a)
                || broken.push(`${label}: 항등 깨짐 — map(id, ${snap(obs, a)})`);
            snap(obs, F.map(x => f(g(x)), a)) === snap(obs, F.map(f, F.map(g, a)))
                || broken.push(`${label}: 합성 깨짐 — ${snap(obs, a)}`);
        }
    }
    assertEquals(report(broken), '', 'Functor 법칙');
    assertEquals(checked, 12, '법칙을 돌린 Functor 인스턴스 수가 달라졌다');
});

test('Functor — 표본이 공허하지 않다 (map 이 인자를 무시하면 잡힌다)', () => {
    // 표본이 갈림길을 안 담으면 법칙은 자동으로 참이 된다. 각 타입마다 "합성을 안 하는 map"
    // 을 만들어, 그 차이가 실제로 관측되는지 본다 — 안 잡히면 그 표본은 감시하지 않는 것이다.
    const f = x => (typeof x === 'number' ? x + 1 : x);
    // map 이 인자를 무시하는 것이 **정의인** 인스턴스. 이유 없이 여기 추가하지 마라.
    const MAP_IS_BLIND = {
        'const(number)': 'Const 의 map 은 정의상 아무것도 안 한다 — 값을 버리고 모노이드만 나른다. 그것이 traverse 를 fold 로 바꾸는 장치다',
    };
    const blind = [];
    for (const [label, F] of REGISTERED_FUNCTORS) {
        const obs = OBSERVE[F.type], xs = FUNCTOR_SAMPLES[F.type];
        if (!obs || !xs) continue;
        const caught = xs.some(a => {
            try { return JSON.stringify(obs(F.map(x => x, a))) !== JSON.stringify(obs(F.map(f, a))); }
            catch (e) { return true; }
        });
        caught || MAP_IS_BLIND[label] || blind.push(label);
    }
    assertEquals(blind.join(','), '', '표본이 map 의 차이를 못 가르는 인스턴스');
    for (const [k, why] of Object.entries(MAP_IS_BLIND)) {
        assertEquals(typeof why === 'string' && why.length > 20, true, `${k}: 이유가 없거나 너무 짧다`);
    }
});

// ─── 나머지 타입 클래스 ──────────────────────────────────────────────
// 값을 담는 법과 "실패/빈 상자". 컨테이너 법칙의 표본을 이 둘로 만든다.
// Const 의 상자에는 **모노이드 값만** 들어간다. OF.Object 는 아무 값이나 담는 Identity 용이라
// Apply 법칙이 함수를 넣어 concat 에서 죽는다 — Const 는 자기 wrap 이 그 자리다.
// 라벨로 거는 이유: .type 이 'Object' 로 Identity 와 같아서 타입으로는 못 가른다.
const OF_BY_LABEL = {
    'const(number)': f => fp.Applicative.Const(fp.Monoid.lookup('number')).wrap(f === fnA ? 1 : 2),
};

const OF = {
    Identity: x => fp.Applicative.lookup('identity').of(x),
    Object: x => ({ value: x }), Array: x => [x], Maybe: x => Just(x), Either: x => Right(x),
    Task: x => fp.Task.of(x), Validation: x => fp.Validation.Valid(x), Reader: x => fp.Reader.of(x),
    Writer: x => fp.Writer.of(x), State: x => fp.State.of(x), Free: x => fp.Free.of(x),
};
const DEGENERATE = {
    Array: [], Maybe: Nothing(), Either: Left('e'), Task: fp.Task.rejected('boom'),
    Validation: fp.Validation.Invalid(['e'], fp.Monoid.lookup('array')),
};
const fnA = x => (typeof x === 'number' ? x + 1 : x);
const fnB = x => (typeof x === 'number' ? x * 2 : x);
const same = (obs, a, b) => { try { return JSON.stringify(obs(a)) === JSON.stringify(obs(b)); } catch (e) { return false; } };

// Kleisli 클래스는 .type 이 전부 'function' 이라 레지스트리 키로 갈라야 한다.
const KLEISLI = {
    function: { fns: [x => x + 1, x => x * 2, x => x - 3], obs: v => v },
    maybe: { fns: [x => Just(x + 1), x => Just(x * 2), () => Nothing()], obs: OBSERVE.Maybe },
    either: { fns: [x => Right(x + 1), x => Right(x * 2), () => Left('e')], obs: OBSERVE.Either },
    task: { fns: [x => fp.Task.of(x + 1), x => fp.Task.of(x * 2), () => fp.Task.rejected('b')], obs: OBSERVE.Task },
};
const BIFUNCTOR = {
    TupleBifunctor: { xs: [[1, 'a'], [2, 'b']], obs: v => v },
    EitherBifunctor: { xs: [Left('e'), Right(1)], obs: OBSERVE.Either },
    ValidationBifunctor: { xs: [fp.Validation.Valid(1), fp.Validation.Invalid(['e'], fp.Monoid.lookup('array'))], obs: OBSERVE.Validation },
};

// ─── Strong / Choice — profunctor 값에는 공통 모양이 없어 라벨별로 도구를 준다 ──────
// function·Forget 의 값은 함수라 표본 입력에 태워야 관측되고, Tagged 의 값은 그 자체가 관측이다.
const swapT = ([a, b]) => [b, a];
const swapE = e => (e.isLeft() ? Right(e.value) : Left(e.value));
const lmap = (P, f, p) => P.promap(f, x => x, p);
const rmap = (P, g, p) => P.promap(x => x, g, p);
const snapOne = v => JSON.stringify(
    v && v._typeName === 'Either' ? [v.isLeft() ? 'L' : 'R', v.value] : v);
const applyTo = xs => p => JSON.stringify(xs.map(x => { try { return snapOne(p(x)); } catch (e) { return 'THROW'; } }));
const PROFUNCTOR_KIT = {
    FunctionStrong: { p: x => x * 10, tuples: [[1, 'c'], [5, 'd']], eithers: [Left(1), Right(2)], seeds: [1, 5], obs: applyTo },
    // 숫자 합 모노이드라 p 가 숫자를 낸다. left 가 못 모으는 자리는 empty()=0 이 된다.
    FunctionChoice: { p: x => x * 10, tuples: [[1, 'c'], [5, 'd']], eithers: [Left(1), Right(2)], seeds: [1, 5], obs: applyTo },
    'forget(number)': { p: a => a, tuples: [[1, 'c'], [5, 'd']], eithers: [Left(1), Right(2)], seeds: [1, 5], obs: applyTo },
    // Tagged 의 값은 함수가 아니다 — 태울 것이 없으니 값 자체를 본다.
    TaggedChoice: { p: 7, tuples: null, eithers: null, seeds: null, obs: () => snapOne },
};

// 명세를 지키지 못하는 자리. **이유가 곧 판정 근거다** — 이유 없이 여기 추가하지 마라.
// 소유자 결정이 필요한 것은 .dev/TODO.md 에 항목으로 올린다.
// 2026-08-13 현재 비어 있다. Either/Task 의 Filterable 은 등록을 뗐다(docs/internals.md#filterable).
const KNOWN_DEVIATIONS = {
    'Wander.*': 'wander 의 법칙은 순회 자연변환과 Applicative 합성을 요구해 등가식만으로는 불충분하다 — Traversable 을 이 게이트에서 뺀 것과 같은 이유다. 부모인 Strong/Choice 법칙은 돌고 있다',
};

const CLASS_LAWS = {
    Semigroupoid: (S, _obs, key) => {
        const kit = KLEISLI[key]; if (!kit) return null;
        const bad = [];
        const eqf = (a, b) => FN_INPUTS_F.every(x => same(kit.obs, a(x), b(x)));
        for (const a of kit.fns) for (const b of kit.fns) for (const c of kit.fns)
            eqf(S.compose(S.compose(a, b), c), S.compose(a, S.compose(b, c))) || bad.push('결합 깨짐');
        return bad;
    },
    Category: (C, _obs, key) => {
        const kit = KLEISLI[key]; if (!kit) return null;
        const bad = [];
        const eqf = (a, b) => FN_INPUTS_F.every(x => same(kit.obs, a(x), b(x)));
        for (const a of kit.fns) {
            eqf(C.compose(a, C.id()), a) || bad.push('우항등 깨짐');
            eqf(C.compose(C.id(), a), a) || bad.push('좌항등 깨짐');
        }
        return bad;
    },
    Filterable: (F, obs) => {
        const xs = FUNCTOR_SAMPLES[F.type]; if (!xs) return null;
        const p = x => typeof x !== 'number' || x > 0;
        const q = x => typeof x !== 'number' || x < 10;
        const bad = [];
        for (const a of xs) {
            same(obs, F.filter(x => p(x) && q(x), a), F.filter(q, F.filter(p, a))) || bad.push('분배 깨짐');
            same(obs, F.filter(() => true, a), a) || bad.push('항등 깨짐');
            for (const b of xs) same(obs, F.filter(() => false, a), F.filter(() => false, b)) || bad.push('소멸 깨짐');
        }
        return bad;
    },
    Bifunctor: (B, _obs, _key, label) => {
        const kit = BIFUNCTOR[label]; if (!kit) return null;
        const h = x => (typeof x === 'number' ? x + 1 : x + '!');
        const i = x => (typeof x === 'number' ? x * 2 : x + '?');
        const bad = [];
        for (const a of kit.xs) {
            same(kit.obs, B.bimap(x => x, x => x, a), a) || bad.push('항등 깨짐');
            same(kit.obs, B.bimap(x => h(i(x)), x => h(i(x)), a), B.bimap(h, h, B.bimap(i, i, a))) || bad.push('합성 깨짐');
        }
        return bad;
    },
    Contravariant: C => {
        const pred = x => x > 0;
        const bad = [];
        FN_INPUTS_F.every(x => C.contramap(y => y, pred)(x) === pred(x)) || bad.push('항등 깨짐');
        FN_INPUTS_F.every(x => C.contramap(y => fnA(fnB(y)), pred)(x) === C.contramap(fnB, C.contramap(fnA, pred))(x))
            || bad.push('합성 깨짐');
        return bad;
    },
    Profunctor: P => {
        const fn = x => x * 10;
        const bad = [];
        FN_INPUTS_F.every(x => P.promap(y => y, y => y, fn)(x) === fn(x)) || bad.push('항등 깨짐');
        FN_INPUTS_F.every(x => P.promap(y => fnA(fnB(y)), y => fnA(fnB(y)), fn)(x)
            === P.promap(fnB, fnA, P.promap(fnA, fnB, fn))(x)) || bad.push('합성 깨짐');
        return bad;
    },
    // Static Land 밖. 표준 Strong 법칙 넷 중 둘을 넣는다 — 결합(assoc)과 second 자연성은
    // 튜플 재결합 함수가 더 필요해 넣지 않았다(아래 「못 잡는 것」).
    Strong: (S, _obs, _key, label) => {
        const kit = PROFUNCTOR_KIT[label]; if (!kit || !kit.tuples) return null;
        const see = kit.obs(kit.tuples);
        const bad = [];
        see(S.first(kit.p)) === see(S.promap(swapT, swapT, S.second(kit.p)))
            || bad.push('first ≡ promap(swap, swap, second) 깨짐');
        see(lmap(S, fp.fst, kit.p)) === see(rmap(S, fp.fst, S.first(kit.p)))
            || bad.push('lmap(fst) ≡ rmap(fst) ∘ first 깨짐');
        return bad;
    },
    Choice: (C, _obs, _key, label) => {
        const kit = PROFUNCTOR_KIT[label]; if (!kit) return null;
        const bad = [];
        if (kit.eithers) {
            const seeE = kit.obs(kit.eithers), seeS = kit.obs(kit.seeds);
            seeE(C.left(kit.p)) === seeE(C.promap(swapE, swapE, C.right(kit.p)))
                || bad.push('left ≡ promap(swapE, swapE, right) 깨짐');
            seeS(rmap(C, Left, kit.p)) === seeS(lmap(C, Left, C.left(kit.p)))
                || bad.push('rmap(Left) ≡ lmap(Left) ∘ left 깨짐');
        } else {
            // Tagged — 값 자체가 관측이다.
            const see = kit.obs();
            see(C.left(kit.p)) === see(C.promap(swapE, swapE, C.right(kit.p)))
                || bad.push('left ≡ promap(swapE, swapE, right) 깨짐');
            see(rmap(C, Left, kit.p)) === see(lmap(C, Left, C.left(kit.p)))
                || bad.push('rmap(Left) ≡ lmap(Left) ∘ left 깨짐');
        }
        return bad;
    },
    // 위 KNOWN_DEVIATIONS 가 전부 건너뛴다. 그래도 목록에 두는 이유는, 빼 버리면 "Wander 는
    // 왜 법칙이 없나" 가 아무 데도 안 남기 때문이다.
    Wander: () => [],
    Apply: (A, obs, _key, label) => {
        const xs = FUNCTOR_SAMPLES[A.type], of = OF_BY_LABEL[label] || OF[A.type]; if (!xs || !of) return null;
        const fns = [of(fnA), of(fnB), ...(DEGENERATE[A.type] ? [DEGENERATE[A.type]] : [])];
        const comp = A.map(ff => gg => x => ff(gg(x)), fns[0]);
        const bad = [];
        for (const u of fns) for (const v of xs)
            same(obs, A.ap(A.ap(comp, u), v), A.ap(fns[0], A.ap(u, v))) || bad.push('합성 깨짐');
        return bad;
    },
    Applicative: (A, obs) => {
        const xs = FUNCTOR_SAMPLES[A.type]; if (!xs) return null;
        const bad = [];
        for (const v of xs) same(obs, A.ap(A.of(x => x), v), v) || bad.push('항등 깨짐');
        same(obs, A.ap(A.of(fnA), A.of(1)), A.of(fnA(1))) || bad.push('준동형 깨짐');
        for (const u of [A.of(fnA), ...(DEGENERATE[A.type] ? [DEGENERATE[A.type]] : [])])
            same(obs, A.ap(u, A.of(2)), A.ap(A.of(ff => ff(2)), u)) || bad.push('교환 깨짐');
        return bad;
    },
    Alt: (A, obs) => {
        const xs = FUNCTOR_SAMPLES[A.type]; if (!xs) return null;
        const bad = [];
        for (const a of xs) for (const b of xs) {
            for (const c of xs) same(obs, A.alt(A.alt(a, b), c), A.alt(a, A.alt(b, c))) || bad.push('결합 깨짐');
            same(obs, A.map(fnA, A.alt(a, b)), A.alt(A.map(fnA, a), A.map(fnA, b))) || bad.push('분배 깨짐');
        }
        return bad;
    },
    Plus: (P, obs) => {
        const xs = FUNCTOR_SAMPLES[P.type]; if (!xs) return null;
        const bad = [];
        for (const a of xs) {
            same(obs, P.alt(a, P.zero()), a) || bad.push('우항등 깨짐');
            same(obs, P.alt(P.zero(), a), a) || bad.push('좌항등 깨짐');
        }
        same(obs, P.map(fnA, P.zero()), P.zero()) || bad.push('소멸 깨짐');
        return bad;
    },
    Alternative: (A, obs) => {
        const xs = FUNCTOR_SAMPLES[A.type]; if (!xs) return null;
        const fns = [A.of(fnA), A.of(fnB)];
        const bad = [];
        for (const a of fns) for (const b of fns) for (const c of xs)
            same(obs, A.ap(A.alt(a, b), c), A.alt(A.ap(a, c), A.ap(b, c))) || bad.push('분배 깨짐');
        for (const a of xs) same(obs, A.ap(A.zero(), a), A.zero()) || bad.push('소멸 깨짐');
        return bad;
    },
    Chain: (M, obs) => {
        const xs = FUNCTOR_SAMPLES[M.type], of = OF[M.type]; if (!xs || !of) return null;
        const fs = [x => of(fnA(x)), x => of(fnB(x)), ...(DEGENERATE[M.type] ? [() => DEGENERATE[M.type]] : [])];
        const bad = [];
        for (const u of xs) for (const ff of fs) for (const gg of fs)
            same(obs, M.chain(gg, M.chain(ff, u)), M.chain(x => M.chain(gg, ff(x)), u)) || bad.push('결합 깨짐');
        return bad;
    },
    Monad: (M, obs) => {
        const xs = FUNCTOR_SAMPLES[M.type]; if (!xs) return null;
        const ff = x => M.of(fnA(x));
        const bad = [];
        same(obs, M.chain(ff, M.of(1)), ff(1)) || bad.push('좌항등 깨짐');
        for (const u of xs) same(obs, M.chain(M.of, u), u) || bad.push('우항등 깨짐');
        return bad;
    },
    Foldable: F => {
        const xs = F.type === 'Object' ? [{ a: 1, b: 2 }, {}] : FUNCTOR_SAMPLES[F.type];
        if (!xs) return null;
        // 비가환 연산을 쓴다 — 덧셈이면 순서가 뒤집혀도 결과가 같아 검사가 공허해진다.
        const app = (acc, y) => `${acc}|${y}`;
        const bad = [];
        for (const u of xs) {
            const direct = F.reduce(app, '', u);
            const viaList = F.reduce((acc, y) => acc.concat([y]), [], u).reduce(app, '');
            direct === viaList || bad.push(`reduce 가 목록 경유와 다르다: ${direct} vs ${viaList}`);
        }
        return bad;
    },
    Extend: (E, obs) => {
        const xs = FUNCTOR_SAMPLES[E.type]; if (!xs) return null;
        const ff = w => (Array.isArray(w) ? w.length : 0);
        const gg = w => (Array.isArray(w) ? (w[0] === undefined || w[0] === null ? 0 : w[0]) : 0);
        const bad = [];
        for (const w of xs)
            same(obs, E.extend(ff, E.extend(gg, w)), E.extend(_w => ff(E.extend(gg, _w)), w)) || bad.push('결합 깨짐');
        return bad;
    },
    Comonad: (C, obs) => {
        // extract 는 빈 상자에서 꺼낼 것이 없다 — 비어 있지 않은 표본만 쓴다.
        const raw = FUNCTOR_SAMPLES[C.type];
        const xs = (raw === undefined || raw === null ? [] : raw).filter(v => !Array.isArray(v) || v.length > 0);
        if (!xs.length) return null;
        const ff = w => (Array.isArray(w) ? w.length : 0);
        const bad = [];
        for (const w of xs) {
            same(obs, C.extend(C.extract, w), w) || bad.push('좌항등 깨짐');
            JSON.stringify(C.extract(C.extend(ff, w))) === JSON.stringify(ff(w)) || bad.push('우항등 깨짐');
        }
        return bad;
    },
};

// 레지스트리 키(소문자)를 인스턴스에 되돌려 붙인다 — Kleisli 는 .type 이 전부 'function' 이라
// 클래스 이름만으로는 어떤 상자를 다루는지 알 수 없다.
const lowerKeyOf = name => {
    const m = new Map();
    for (const [k, i] of Object.entries(fp[name].types)) if (k[0] === k[0].toLowerCase()) m.set(i, k);
    return m;
};

test('나머지 타입 클래스 — 등록된 인스턴스 전부에 명세 법칙이 돈다', () => {
    const broken = [];
    const uncovered = [];
    let checked = 0;
    for (const [name, law] of Object.entries(CLASS_LAWS)) {
        const keys = lowerKeyOf(name);
        for (const [label, I] of instancesOf(name)) {
            if (KNOWN_DEVIATIONS[`${name}.${label}`] || KNOWN_DEVIATIONS[`${name}.*`]) continue;
            const obs = OBSERVE[I.type];
            if (!obs) { uncovered.push(`${name}.${label}(${I.type}) — 여는 법 없음`); continue; }
            const bad = law(I, obs, keys.get(I), label);
            if (bad === null) { uncovered.push(`${name}.${label}(${I.type}) — 표본 없음`); continue; }
            checked++;
            for (const m of new Set(bad)) broken.push(`${name}.${label}: ${m}`);
        }
    }
    assertEquals(uncovered.join(' | '), '', '표본이나 여는 법이 없어 검사하지 못한 인스턴스');
    assertEquals(report(broken), '', '명세 법칙을 어긴 인스턴스');
    assertEquals(checked, 76, '법칙을 돌린 인스턴스 수가 달라졌다');
});

test('명세를 못 지키는 자리는 이유와 함께 명단에 있다', () => {
    // 조용히 건너뛰지 않는다. 새 위반이 생기면 위 검사가 빨개지고, 여기에 이유를 적어야만
    // 통과한다 — 그리고 그 이유가 곧 소유자에게 올릴 결정 항목이 된다.
    for (const [k, why] of Object.entries(KNOWN_DEVIATIONS)) {
        assertEquals(typeof why === 'string' && why.length > 20, true, `${k}: 이유가 없거나 너무 짧다`);
    }
    assertEquals(Object.keys(KNOWN_DEVIATIONS).sort().join(','), 'Wander.*',
        '명세 미준수 목록이 달라졌다 — .dev/TODO.md 에 항목으로 올려라');
});

test('표본 예외에는 전부 이유가 붙어 있다', () => {
    for (const [name, entry] of Object.entries(SAMPLE_OVERRIDES)) {
        assertEquals(Array.isArray(entry) && entry.length === 2 && entry[1].length > 0, true,
            `${name}: 표본 예외에 이유가 없다`);
    }
});

console.log('\n✅ Static Land 법칙 tests completed');
