// Static Land 법칙을 **등록된 전 인스턴스 + 팩토리 산물**에 돌린다.
//
// 왜 있는가: `tests/ord.test.js` 에 반대칭 법칙 테스트가 있었는데도 `Ord` 가 `equals` 없이
// 살아 있었다. 두 가지가 겹쳤다.
//
//   1. 법칙을 손으로 고른 인스턴스 둘(maybe(number), array(number))에만 돌렸다.
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
//   - Functor 는 등록된 11개 전부에 돈다(아래 OBSERVE). 그러나 Apply·Applicative·Alt·
//     Chain·ChainRec·Extend·Comonad·Traversable 의 법칙은 여전히 각 tests/*.test.js 가
//     손으로 고른 인스턴스만 본다 — Ord 를 놓쳤던 것과 같은 모양의 구멍이 그만큼 남아 있다.
//   - 컨테이너는 값이 아니라 **관측**으로 비교한다(OBSERVE). Reader/State 는 표본 환경·
//     상태에서만, Task 는 fork 결과로만 본다 — 그 표본이 못 가르는 차이는 못 잡는다.
//   - 'function' 의 동등은 관측 동등이다 — 표본 입력에서만 같음을 본다.
//   - FACTORY_CASES 는 손으로 쓴 명단이다. 새 팩토리를 만들고 여기 안 넣으면 감시 밖이다.
import fp from '../index.js';
import { test, assertEquals, logSection } from './utils.js';

const { Just, Nothing } = fp.Maybe;
const { Left, Right } = fp.Either;

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
const REGISTERED = Object.fromEntries(
    ['Setoid', 'Ord', 'Semigroup', 'Monoid', 'Group'].map(n => [n, instancesOf(n)]));

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
    function: f => FN_INPUTS_F.map(f),
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
    : v && typeof v.toString === 'function' && !Array.isArray(v) && typeof v === 'object' && v.constructor?.name !== 'Object'
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

const samplesFor = (label, type) => SAMPLE_OVERRIDES[label]?.[0] ?? SAMPLES[type];

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

for (const [name, count] of [['Setoid', 7], ['Ord', 6], ['Semigroup', 14], ['Monoid', 12], ['Group', 3]]) {
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
            LAWS[law](instance, xs, eq ?? EQ[instance.type], msg => broken.push(`${label}: ${msg}`));
        }
    }
    assertEquals(report(broken), '', '팩토리 산물의 법칙');
    assertEquals(FACTORY_CASES.length, 11, '팩토리 명단이 달라졌다 — 새 팩토리를 넣었으면 표본도 넣어라');
});

test('Functor — 등록된 11개 전부에 항등·합성이 돈다', () => {
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
    assertEquals(checked, 11, '법칙을 돌린 Functor 인스턴스 수가 달라졌다');
});

test('Functor — 표본이 공허하지 않다 (map 이 인자를 무시하면 잡힌다)', () => {
    // 표본이 갈림길을 안 담으면 법칙은 자동으로 참이 된다. 각 타입마다 "합성을 안 하는 map"
    // 을 만들어, 그 차이가 실제로 관측되는지 본다 — 안 잡히면 그 표본은 감시하지 않는 것이다.
    const f = x => (typeof x === 'number' ? x + 1 : x);
    const blind = [];
    for (const [label, F] of REGISTERED_FUNCTORS) {
        const obs = OBSERVE[F.type], xs = FUNCTOR_SAMPLES[F.type];
        if (!obs || !xs) continue;
        const caught = xs.some(a => {
            try { return JSON.stringify(obs(F.map(x => x, a))) !== JSON.stringify(obs(F.map(f, a))); }
            catch { return true; }
        });
        caught || blind.push(label);
    }
    assertEquals(blind.join(','), '', '표본이 map 의 차이를 못 가르는 인스턴스');
});

test('표본 예외에는 전부 이유가 붙어 있다', () => {
    for (const [name, entry] of Object.entries(SAMPLE_OVERRIDES)) {
        assertEquals(Array.isArray(entry) && entry.length === 2 && entry[1].length > 0, true,
            `${name}: 표본 예외에 이유가 없다`);
    }
});

console.log('\n✅ Static Land 법칙 tests completed');
