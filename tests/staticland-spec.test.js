// Static Land 명세와 이 라이브러리를 대조하는 게이트.
//
// 왜 있는가: `Ord` 가 `equals` 없이 살아 있었고 아무도 못 잡았다. 법칙 테스트는 있었지만
// (`tests/ord.test.js`) 반대칭을 `O.lte` + **다른 인스턴스의** `S.equals` 로 썼다 — 명세가
// "같은 인스턴스" 라 말하는 자리에 구현이 줄 수 있는 모양을 대입한 것이다. 대입이 들통날
// 유일한 인스턴스(StringLengthOrd/StringLocaleOrd)에는 테스트가 0건이었다.
//
// 그리고 `Setoid ─> Ord` 라는 같은 사실이 세 곳(런타임 클래스, types/*.d.ts, docs/README.md)
// 에 적혀 있었는데 셋을 비교하는 것이 없었다. 이 파일이 그 비교다.
//
// 못 잡는 것을 먼저 적는다 (규칙 31-1):
//   - ①은 "메서드가 있는가" 만 본다. `equals` 를 아무 함수로 채워도 통과한다 —
//     그것이 자기 `lte` 와 맞는지는 법칙 테스트만 안다.
//   - ①~③은 **등록된** 인스턴스만 본다. 팩토리로만 생기는 것(`Maybe.Ord('number')`)은
//     ④에서 명시적으로 부른다. 명단을 안 늘리면 새 팩토리는 감시 밖이다.
//   - ③은 `.type` **문자열**만 본다. 같은 태그의 Functor 가 있으면 통과하지, 그것이 명세가
//     말하는 Functor 인지는 안 본다. 실측: `TupleBifunctor`(.type='Array')는 `ArrayFunctor`
//     로 만족되는데, `bimap(f,g,[1,2])` 가 `[10,3]` 인 자리에서 `map(f,[1,2])` 는 `[10,20]` 이다
//     — 튜플의 둘째 자리만 매핑해야 하는데 배열 전체를 매핑한다. 이 검사는 **짝이 존재하는지**
//     만 보증하고 **짝이 옳은지**는 보증하지 않는다.
//   - ⑤는 문서 그래프의 **이름 집합**만 본다. 화살표 방향은 안 본다.
//   - 이 표 자체가 명세를 잘못 옮기면 잘못된 표대로 초록이 난다. 표는 사람이 원문과 대조한다.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import fp from '../index.js';
import { test, assertEquals, assert, logSection, allMatches } from './utils.js';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));

// ─── Static Land 명세 원문에서 옮긴 표 ───────────────────────────────
// 출처: https://github.com/fantasyland/static-land/blob/master/docs/spec.md
// `sameT` 는 "support X algebra for the **same** T" 요구다 — 그 인스턴스 자신이 X 의
// 메서드를 지고 있어야 한다. `partial` 은 Bifunctor/Profunctor 의 다른 요구다:
// "support Functor algebra for all types U created by setting the first parameter" —
// 인스턴스 자신이 아니라 **같은 타입의 Functor 가 레지스트리에 있어야** 한다.
const SPEC = {
    Setoid: { method: 'equals', sameT: [] },
    Ord: { method: 'lte', sameT: ['Setoid'] },
    Semigroup: { method: 'concat', sameT: [] },
    Monoid: { method: 'empty', sameT: ['Semigroup'] },
    Group: { method: 'invert', sameT: ['Monoid'] },
    Semigroupoid: { method: 'compose', sameT: [] },
    Category: { method: 'id', sameT: ['Semigroupoid'] },
    Filterable: { method: 'filter', sameT: [] },
    Functor: { method: 'map', sameT: [] },
    Bifunctor: { method: 'bimap', sameT: [], partial: 'Functor' },
    Contravariant: { method: 'contramap', sameT: [] },
    Profunctor: { method: 'promap', sameT: [], partial: 'Functor' },
    Apply: { method: 'ap', sameT: ['Functor'] },
    Applicative: { method: 'of', sameT: ['Apply'] },
    Alt: { method: 'alt', sameT: ['Functor'] },
    Plus: { method: 'zero', sameT: ['Alt'] },
    Alternative: { method: null, sameT: ['Applicative', 'Plus'] },
    Chain: { method: 'chain', sameT: ['Apply'] },
    ChainRec: { method: 'chainRec', sameT: ['Chain'] },
    Monad: { method: null, sameT: ['Applicative', 'Chain'] },
    Foldable: { method: 'reduce', sameT: [] },
    Extend: { method: 'extend', sameT: ['Functor'] },
    Comonad: { method: 'extract', sameT: ['Extend'] },
    Traversable: { method: 'traverse', sameT: ['Functor', 'Foldable'] },
};

// 조상까지 훑어 이 클래스의 인스턴스가 반드시 지고 있어야 하는 메서드를 모은다.
const requiredMethods = name => {
    const out = new Set();
    const walk = n => {
        SPEC[n].method && out.add(SPEC[n].method);
        SPEC[n].sameT.forEach(walk);
    };
    walk(name);
    return [...out];
};

// 등록된 인스턴스를 (클래스, 표시키, 인스턴스)로 훑는다. 같은 인스턴스가 별칭으로 여러 번
// 나오므로 클래스별로 한 번만 본다.
const registeredInstances = name => {
    const seen = new Set();
    const out = [];
    for (const [key, instance] of Object.entries(fp[name].types)) {
        if (seen.has(instance)) continue;
        seen.add(instance);
        out.push([key, instance]);
    }
    return out;
};

logSection('Static Land 명세 적합성');

test('① 등록된 인스턴스는 명세가 요구하는 조상의 메서드를 전부 진다', () => {
    // 이 검사는 고치기 전 코드에 돌려 실제로 잡히는 것을 확인했다:
    // Ord.{NumberOrd,StringOrd,StringLengthOrd,StringLocaleOrd,DateOrd} 에 equals 없음.
    const bad = [];
    for (const name of Object.keys(SPEC)) {
        for (const [key, instance] of registeredInstances(name)) {
            for (const m of requiredMethods(name)) {
                typeof instance[m] === 'function'
                    || bad.push(`${name}.${key}(${instance.constructor.name}): ${m} 없음`);
            }
        }
    }
    assertEquals(bad.join(' | '), '', '명세가 요구하는 메서드가 빠진 인스턴스');
});

test('② 런타임 클래스의 상속이 명세의 부모 사슬 안에 있다', () => {
    // JS 는 부모가 하나뿐이라 명세 부모가 둘인 셋(Alternative/Monad/Traversable)은
    // 하나만 extends 로 비추고 나머지는 메서드 복사로 진다 — 그 복사는 ①이 검사한다.
    const bad = [];
    for (const [name, { sameT }] of Object.entries(SPEC)) {
        const proto = Object.getPrototypeOf(fp[name]);
        const jsParent = proto === null || proto === undefined ? undefined : proto.name;
        if (sameT.length === 0) {
            jsParent === 'Algebra'
                || bad.push(`${name}: 명세에 부모가 없는데 ${jsParent} 를 상속한다`);
        } else {
            sameT.includes(jsParent)
                || bad.push(`${name}: 명세 부모는 [${sameT}] 인데 ${jsParent} 를 상속한다`);
        }
    }
    assertEquals(bad.join(' | '), '', '명세와 어긋난 상속');
});

test('② -1 명세 부모가 둘인 클래스는 셋뿐이다 — 늘면 여기서 멈춘다', () => {
    const multi = Object.entries(SPEC).filter(([, s]) => s.sameT.length > 1).map(([n]) => n).sort();
    assertEquals(multi.join(','), 'Alternative,Monad,Traversable',
        '명세 부모가 둘인 클래스 목록이 달라졌다 — ②의 예외 처리를 다시 보라');
});

test('③ Bifunctor / Profunctor 는 같은 타입의 Functor 가 레지스트리에 있어야 한다', () => {
    // 이 요구는 "same T" 가 아니다. 첫 매개변수를 고정한 타입이 Functor 여야 한다는 뜻이라
    // 인스턴스 자신이 map 을 지는 게 아니라, 같은 .type 의 Functor 가 따로 있어야 한다.
    const functorTypes = new Set(Object.values(fp.Functor.types).map(f => f.type));
    const bad = [];
    for (const [name, { partial }] of Object.entries(SPEC)) {
        if (!partial) continue;
        for (const [key, instance] of registeredInstances(name)) {
            functorTypes.has(instance.type)
                || bad.push(`${name}.${key}: .type='${instance.type}' 인 ${partial} 가 레지스트리에 없다`);
        }
    }
    assertEquals(bad.join(' | '), '', `"first parameter 를 고정하면 Functor" 요구를 못 지키는 인스턴스`);
});

test('④ 팩토리로만 생기는 인스턴스도 조상의 메서드를 진다', () => {
    // 레지스트리 순회로는 안 닿는다 — 호출해야 생긴다. 새 팩토리를 만들면 여기 추가하라.
    const cases = [
        ['Maybe.Ord("number")', 'Ord', fp.Maybe.Ord('number')],
        ['Ord.Array("number")', 'Ord', fp.Ord.Array('number')],
        ['Maybe.Setoid("number")', 'Setoid', fp.Maybe.Setoid('number')],
        ['Setoid.Array("number")', 'Setoid', fp.Setoid.Array('number')],
        ['Either.Setoid("string","number")', 'Setoid', fp.Either.Setoid('string', 'number')],
        ['Setoid.Struct({a:"number"})', 'Setoid', fp.Setoid.Struct({ a: 'number' })],
        ['Maybe.Semigroup("array")', 'Semigroup', fp.Maybe.Semigroup('array')],
        ['Maybe.Monoid("array")', 'Monoid', fp.Maybe.Monoid('array')],
        ['Either.Semigroup("array","array")', 'Semigroup', fp.Either.Semigroup('array', 'array')],
        ['Applicative.Const("array")', 'Applicative', fp.Applicative.Const('array')],
        // StateT('maybe') 를 부르는 순간 Functor~Monad 다섯 곳에 statet(maybe) 키가 생긴다.
        ['statet(maybe)', 'Monad', (fp.StateT('maybe'), fp.Monad.lookup('statet(maybe)'))],
        ['writert(maybe,array)', 'Monad',
            (fp.WriterT('maybe', fp.Monoid.lookup('array')), fp.Monad.lookup('writert(maybe,array)'))],
    ];
    const bad = [];
    for (const [label, name, instance] of cases) {
        for (const m of requiredMethods(name)) {
            typeof instance[m] === 'function' || bad.push(`${label}: ${m} 없음`);
        }
    }
    assertEquals(bad.join(' | '), '', '파생 인스턴스에서 빠진 메서드');
});

test('⑤ 표·타입 선언·문서가 같은 타입 클래스 집합을 말한다', () => {
    // 같은 사실이 세 곳에 적혀 있고, 셋이 갈라진 채로 지나간 적이 있다.
    // 여기서 보는 것은 **이름 집합**이다. 문서 그래프의 화살표 방향은 안 본다.
    const expected = Object.keys(SPEC).sort();

    // (a) 런타임이 실제로 내보내는 것
    const runtime = expected.filter(n => typeof fp[n] === 'function');
    assertEquals(runtime.join(','), expected.join(','), '표에 있는데 런타임에 없는 클래스');

    // (b) types/TypeClasses.d.ts 가 선언하는 것
    const dts = readFileSync(join(rootDir, 'types', 'TypeClasses.d.ts'), 'utf8');
    const declared = allMatches(/^export interface ([A-Z][A-Za-z]*)[<\s]/gm, dts)
        .map(m => m[1]).filter(n => SPEC[n]);
    assertEquals([...new Set(declared)].sort().join(','), expected.join(','),
        '타입 선언에서 빠졌거나 더 있는 타입 클래스');

    // (c) docs/README.md 의 의존성 그래프
    const readme = readFileSync(join(rootDir, 'docs', 'README.md'), 'utf8');
    const graph = /## 타입 클래스 의존성 그래프[\s\S]*?```([\s\S]*?)```/.exec(readme);
    assert(graph, 'docs/README.md 에서 의존성 그래프 블록을 못 찾았다');
    const names = graph[1].match(/[A-Z][A-Za-z]+/g);
    const drawn = [...new Set(names === null ? [] : names)].sort();
    assertEquals(drawn.join(','), expected.join(','),
        '문서 그래프가 코드에 없는 이름을 그렸거나 있는 이름을 빠뜨렸다');
});

test('⑥ 타입 선언의 extends 가 명세의 "same T" 부모와 일치한다', () => {
    // types/*.d.ts 는 TypeScript 사용자가 보는 계약이다. 여기가 런타임과 갈라지면
    // tsc 는 통과하고 런타임이 죽는다 — Ord 가 정확히 그랬다.
    const dts = readFileSync(join(rootDir, 'types', 'TypeClasses.d.ts'), 'utf8');
    for (const [name, { sameT }] of Object.entries(SPEC)) {
        // 선언은 여러 줄에 걸칠 수 있다: `interface X<F> \n extends A<F>, B<F> {`
        const m = new RegExp(`^export interface ${name}[<\\s][\\s\\S]*?\\{`, 'm').exec(dts);
        assert(m, `${name}: 타입 선언을 못 찾았다`);
        const parents = allMatches(/(?:extends|,)\s*([A-Z][A-Za-z]*)/g, m[0])
            .map(x => x[1]).filter(n => SPEC[n]).sort();
        assertEquals(parents.join(','), [...sameT].sort().join(','),
            `${name} 의 타입 선언 extends 가 명세 부모와 다르다`);
    }
});

console.log('\n✅ Static Land 명세 적합성 tests completed');
