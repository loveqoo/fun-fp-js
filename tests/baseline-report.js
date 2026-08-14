// `npm run baseline` — 커밋된 버전(HEAD) 대비 관측 가능한 동작 차이를 표로 낸다.
//
// **게이트가 아니라 보고서다.** 차이가 곧 실패는 아니다 — 의도한 변경일 수 있다.
// 판정은 사람이 한다: 나온 차이가 계획서에 적혀 있는가? 없으면 회귀다.
// 그래서 `npm test` 에 넣지 않는다. Verification 단계에서 돌려 계획서와 대조하라.
//
// 왜 있는가: 세 회차 연속으로 "내부 교체라 동작이 같다" 를 검증 기준으로 삼았고 두 번
// 틀렸다. 세 번 다 `npm test` 는 초록이었다 — 바뀐 경로에 테스트가 없으면 초록이
// 아무것도 증명하지 않는다.
//
//   회차 1: view(prism, 매치실패)        undefined -> TypeError
//   회차 2: preview(traversed, [1,'a'])  Just(1)   -> TypeError   (회귀)
//
// 아래 격자는 **표본이 아니라 상시 감시면**이다. 새 표면을 건드렸으면 여기에 줄을 더하라 —
// 넓히는 비용은 거의 0이고, 좁은 격자가 "차이 3건" 같은 잘못된 보고를 만든다.
import { diffCases } from './baseline.js';

// HEAD 는 optics 를 최상위에 두고 현재는 Optics 모듈에 둔다. 이 격자는 **동작**을 보는
// 것이므로 양쪽에서 같은 자리를 가리키도록 정규화한다 — 이름 변경 자체는 아래
// 「최상위 export 키」 줄이 잡는다.
// 주의: HEAD 쪽에서 f.compose 는 **범용 함수 합성**이지 optic 합성이 아니다.
// o.compose ?? o.composeOptic 으로 쓰면 HEAD 에서 엉뚱한 함수가 잡혀 거짓 회귀가 뜬다.
// 그래서 Optics 모듈의 유무로 갈라서 고른다.
const O = f => f.Optics
    ? { ...f.Optics, composeOptic: f.Optics.compose, toListOf: f.Optics.toList }
    : { ...f, compose: f.composeOptic, toList: f.toListOf };

// 타입클래스의 정적 조회는 HEAD 에서 `of`, 현재는 `lookup` 이다. 격자는 **동작**을 보므로
// 양쪽에서 같은 인스턴스를 집도록 갈라준다 — 이름 변경 자체는 「최상위 export 키」와
// 아래 `.type` 줄들이 잡는다. (`??` 를 쓰면 안 된다 — 규칙 23 의 그 자리다.)
const L = (f, name) => (f[name].lookup ? f[name].lookup : f[name].of);

const TYPE_CLASSES = ['Setoid', 'Ord', 'Semigroup', 'Monoid', 'Group', 'Semigroupoid', 'Category',
    'Filterable', 'Functor', 'Bifunctor', 'Contravariant', 'Profunctor', 'Apply', 'Applicative',
    'Alt', 'Plus', 'Alternative', 'Chain', 'ChainRec', 'Monad', 'Foldable', 'Extend', 'Comonad',
    'Traversable'];
const allRegistryKeys = f => TYPE_CLASSES.map(c => `${c}: ${Object.keys(f[c].types).sort().join(',')}`);
// **정렬해서 본다.** 묶음의 키 순서는 계약이 아니다 — 쓰는 쪽은 이름으로 구조분해하므로
// 순서에 의존하는 곳이 0건이다. 정렬 안 한 줄을 두면 등록 순서를 건드릴 때마다 의미 없는
// 차이를 보고하고, 누군가 그것을 초록으로 만들려다 우연한 순서를 계약으로 굳힌다.
const allBundles = f => {
    const types = new Set();
    for (const c of TYPE_CLASSES) for (const v of Object.values(f[c].types)) if (v && v.type) types.add(v.type.toLowerCase());
    return [...types].sort().map(t => `${t}: ${Object.keys(f.Algebra.all(t)).sort().join(',')}`);
};

const T = f => O(f).traversed('array');
const bigP = f => O(f).Prism(x => (x > 10 ? f.Maybe.Just(x) : f.Maybe.Nothing()), x => x);
const aLens = f => O(f).Lens(o => o.a, (b, o) => ({ ...o, a: b }));

const cases = [
    // ── optics 읽기 — 대상 수·타입을 넓게 ──────────────────────────────
    ['view Lens', f => O(f).view(aLens(f), { a: 1 })],
    ['view Lens 중첩', f => O(f).view(O(f).composeOptic(aLens(f), aLens(f)), { a: { a: 5 } })],
    ['view 1대상 Traversal', f => O(f).view(T(f), [7])],
    ['view 다중 [1,2,3]', f => O(f).view(T(f), [1, 2, 3])],
    ['view 다중 [1,"a"]', f => O(f).view(T(f), [1, 'a'])],
    ['view 다중 [null,1]', f => O(f).view(T(f), [null, 1])],
    ['view 빈 배열', f => O(f).view(T(f), [])],
    ['view Prism 매치', f => O(f).view(bigP(f), 20)],
    ['view Prism 실패', f => O(f).view(bigP(f), 5)],

    ['preview 동종', f => O(f).preview(T(f), [1, 2, 3])],
    ['preview 이종', f => O(f).preview(T(f), [1, 'a'])],
    ['preview null 선두', f => O(f).preview(T(f), [null, 1])],
    ['preview undefined 선두', f => O(f).preview(T(f), [undefined, 1])],
    ['preview NaN 선두', f => O(f).preview(T(f), [NaN, 1])],
    ['preview 객체/배열', f => O(f).preview(T(f), [{ a: 1 }, [2]])],
    ['preview Maybe 중첩', f => O(f).preview(T(f), [f.Maybe.Nothing(), f.Maybe.Just(1)])],
    ['preview 빈 배열', f => O(f).preview(T(f), [])],
    ['preview Prism 실패', f => O(f).preview(bigP(f), 5)],
    ['preview 합성', f => O(f).preview(O(f).composeOptic(T(f), aLens(f)), [{ a: null }, { a: 2 }])],

    ['toListOf 동종', f => O(f).toListOf(T(f), [1, 2, 3])],
    ['toListOf 이종', f => O(f).toListOf(T(f), [1, 'a'])],
    ['toListOf Maybe 중첩', f => O(f).toListOf(T(f), [f.Maybe.Just(1), f.Maybe.Nothing()])],
    ['toListOf 빈 배열', f => O(f).toListOf(T(f), [])],

    // ── optics 쓰기 ─────────────────────────────────────────────────
    ['over Traversal', f => O(f).over(T(f), x => x * 2, [1, 2, 3])],
    ['over 대상 없음', f => O(f).over(bigP(f), x => x * 2, 5)],
    ['set Traversal', f => O(f).set(T(f), 9, [1, 2, 3])],
    ['set Lens', f => O(f).set(aLens(f), 9, { a: 1, b: 2 })],
    ['review Prism', f => O(f).review(bigP(f), 42)],
    ['review Lens (거부돼야)', f => O(f).review(aLens(f), 1)],

    // ── Prism / Either 경로 — functionProfunctor.left 와 forgetProfunctor.left ──
    ['over Prism 매치', f => O(f).over(bigP(f), x => x * 2, 20)],
    ['over Prism 실패', f => O(f).over(bigP(f), x => x * 2, 5)],
    ['set Prism 매치', f => O(f).set(bigP(f), 99, 20)],
    ['toListOf Prism 매치', f => O(f).toListOf(bigP(f), 20)],
    ['toListOf Prism 실패', f => O(f).toListOf(bigP(f), 5)],
    ['traversed(either) Right', f => O(f).toListOf(O(f).traversed('either'), f.Either.Right(3))],
    ['traversed(either) Left', f => O(f).toListOf(O(f).traversed('either'), f.Either.Left('e'))],
    ['over traversed(either)', f => O(f).over(O(f).traversed('either'), x => x * 2, f.Either.Right(3))],
    ['over traversed(either) Left', f => O(f).over(O(f).traversed('either'), x => x * 2, f.Either.Left('e'))],
    ['traversed(maybe) Just', f => O(f).toListOf(O(f).traversed('maybe'), f.Maybe.Just(3))],
    ['traversed(maybe) Nothing', f => O(f).toListOf(O(f).traversed('maybe'), f.Maybe.Nothing())],
    ['합성 Prism∘Lens', f => O(f).preview(O(f).composeOptic(bigP(f), aLens(f)), { a: 1 })],
    ['Iso view/review 왕복', f => O(f).review(O(f).Iso(c => c * 2, x => x / 2), O(f).view(O(f).Iso(c => c * 2, x => x / 2), 21))],

    // ── 에러가 호출한 연산에 귀속되는가 ────────────────────────────────
    // foldMapOf 로 재정의하면서 preview/toList 가 'foldMapOf:' 로 던지는 회귀가 있었다.
    ['preview 비함수 메시지', f => O(f).preview(null, [])],
    ['toList 비함수 메시지', f => O(f).toList(null, [])],
    ['view 비함수 메시지', f => O(f).view(null, [])],
    ['over 비함수 f 메시지', f => O(f).over(T(f), null, [1])],
    ['review 비함수 메시지', f => O(f).review(null, 1)],

    // ── 모으기에 쓰는 Monoid ──────────────────────────────────────────
    ['first.concat(1,2)', f => L(f, 'Semigroup')('first').concat(1, 2)],
    ['first.concat(1,"a")', f => L(f, 'Semigroup')('first').concat(1, 'a')],
    ['first.concat(obj)', f => L(f, 'Semigroup')('first').concat({ a: 1 }, { a: 2 })],
    ['last.concat(1,2)', f => L(f, 'Semigroup')('last').concat(1, 2)],
    ['maybe(first) 동종', f => f.Monoid.Maybe('first').concat(f.Maybe.Just(1), f.Maybe.Just(2))],
    ['maybe(first) 이종', f => f.Monoid.Maybe('first').concat(f.Maybe.Just(1), f.Maybe.Just('a'))],
    ['array Monoid', f => L(f, 'Monoid')('array').concat([1], [2])],
    ['array Monoid empty', f => L(f, 'Monoid')('array').empty()],

    // ── Algebra.all — 한 타입의 인스턴스 묶음. 이름이 바뀌면 여기서 보인다 ──
    // HEAD 에 Algebra.all 이 없으면 THROW 로 잡히는 것이 맞다 — 새 표면이다.
    ['Algebra.all(array) 이름', f => Object.keys(f.Algebra.all('array')).sort()],
    ['Algebra.all(function) 이름', f => Object.keys(f.Algebra.all('function')).sort()],
    ['Algebra.all(number) 이름', f => Object.keys(f.Algebra.all('number')).sort()],
    ['Algebra.all 소문자 강제', f => f.Algebra.all('Array')],
    ['Algebra.all 없는 타입', f => f.Algebra.all('nope')],

    // ── .type 이 새어 나가는 곳 — 사용자가 보는 에러 문자열 ─────────────────
    // `.type` 을 고치면 여기가 따라 바뀐다. 격자에 없으면 "관측 가능한 동작이 그대로다" 가
    // 거짓이 된다 — 실제로 `match date` -> `match Date` 변경을 격자가 못 봤다.
    ['Setoid.equals 타입 불일치 메시지', f => L(f, 'Setoid')('date').equals(1, 2)],
    ['Ord.lte 타입 불일치 메시지', f => L(f, 'Ord')('date').lte(1, 2)],
    // lookup('default') 는 한때 레지스트리 밖 맨 객체라 이종 인자에 조용히 false 를 줬다.
    // 정식 인스턴스가 되며 던지게 됐다 — 그 제약이 되돌아가면 이 네 줄이 차이로 나온다.
    ['default equals 동종', f => L(f, 'Setoid')('default').equals(1, 1)],
    ['default equals 이종', f => L(f, 'Setoid')('default').equals(1, 'a')],
    ['default lte 이종', f => L(f, 'Ord')('default').lte(1, 'a')],
    ['default 동일성', f => L(f, 'Setoid')('default') === L(f, 'Setoid')('default')],
    ['Filterable.filter 타입 불일치 메시지', f => L(f, 'Filterable')('object').filter(x => x, [1])],
    ['Foldable.reduce 타입 불일치 메시지', f => L(f, 'Foldable')('object').reduce((a) => a, 0, [1])],

    // ── 레지스트리 자체 — 키가 사라지거나 늘어난 것을 본다 ────────────────
    ['Functor.types 키', f => Object.keys(f.Functor.types).sort()],
    ['Apply.types 키', f => Object.keys(f.Apply.types).sort()],
    ['Applicative.types 키', f => Object.keys(f.Applicative.types).sort()],
    ['Monoid.types 키', f => Object.keys(f.Monoid.types).sort()],
    ['Semigroup.types 키', f => Object.keys(f.Semigroup.types).sort()],
    ['최상위 export 키', f => Object.keys(f).sort()],

    // 타입클래스의 **정적 표면** — `of` -> `lookup` 같은 이름 변경은 여기서만 보인다.
    // 「최상위 export 키」는 타입클래스 이름만 보므로 그 안쪽이 바뀐 것을 못 잡는다.
    //
    // **24개 전부를 본다.** 처음에 6개만 표본으로 뒀다가, 표본 안의 `Setoid.of` 를
    // 되살려 보고 "격자가 잡는다" 고 판정했다. 표본 밖의 `Comonad.of` 를 되살리면
    // 「차이 없음」이 나온다(실측) — 규칙 31-1.
    ['타입클래스 정적 표면', f => ['Setoid', 'Ord', 'Semigroup', 'Monoid', 'Group', 'Semigroupoid',
        'Category', 'Filterable', 'Functor', 'Bifunctor', 'Contravariant', 'Profunctor', 'Apply',
        'Applicative', 'Alt', 'Plus', 'Alternative', 'Chain', 'ChainRec', 'Monad', 'Foldable',
        'Extend', 'Comonad', 'Traversable']
        .map(name => `${name}: ${Object.keys(f[name]).sort().join(',')}`)],

    // 데이터 타입의 정적 표면. 위 행은 타입클래스만 보므로 **이름이 데이터 타입에서
    // 빠져나간 것**을 못 잡는다 — 팩토리 6개를 타입클래스로 옮길 때(2026-08-14) 이 행이
    // 없어서 없어진 쪽이 baseline 에 안 보였다.
    ['데이터타입 정적 표면', f => ['Maybe', 'Either', 'Task', 'Validation', 'Reader', 'Writer',
        'State', 'Free']
        .map(name => `${name}: ${Object.keys(f[name]).sort().join(',')}`)],

    // ── 인스턴스의 .type — 값으로는 관측되지 않는 자리다 ──────────────────
    // 검사에 쓰이지 않는 타입클래스(Semigroupoid/Category 등)에서는 .type 이 틀려도
    // 동작이 같으므로 위 격자가 전부 통과한다. 필드를 직접 읽어야 드리프트가 보인다.
    // 타입클래스별로 나눈다 — 한 줄에 몰면 바뀐 자리를 눈으로 못 찾는다(규칙 14).
    ...['Setoid', 'Ord', 'Semigroup', 'Monoid', 'Group', 'Semigroupoid', 'Category',
        'Filterable', 'Functor', 'Bifunctor', 'Contravariant', 'Profunctor', 'Apply',
        'Applicative', 'Alt', 'Plus', 'Alternative', 'Chain', 'ChainRec', 'Monad',
        'Foldable', 'Extend', 'Comonad', 'Traversable'
    ].map(name => [`${name} .type`, f => Object.entries(f[name].types)
        .filter(([k]) => k[0] === k[0].toUpperCase())
        .map(([k, v]) => `${k}=${v.type}`)
        .sort()]),

    // ── 등록 표면 전체 — 레지스트리 쓰기 경로를 건드리는 변경의 감시면 ──────
    // 여기 아래는 지연 등록을 **일으키므로** 반드시 격자의 끝에 둔다.
    ['모든 레지스트리 키', allRegistryKeys],
    ['모든 타입의 Algebra.all 키', allBundles],

    // 지연 등록(팩토리·트랜스포머)이 같은 문을 지나는지. 문을 하나 빠뜨리면 그 인스턴스만
    // 인덱스에 없고 Algebra.all 에서 조용히 사라진다 — 그것을 여기서 잡는다.
    ['지연 등록을 일으킨다', f => {
        f.Semigroup.Maybe('number'); f.Monoid.Maybe('array'); f.Semigroup.Either('string', 'string');
        f.Applicative.Const('array'); f.Semigroup.lookup('maybe(maybe(array))');
        // 컨테이너 Setoid/Ord — 불러야 생긴다. HEAD 에 없으면 THROW 로 잡히는 것이 맞다.
        try { f.Setoid.lookup('maybe(number)'); f.Setoid.lookup('array(number)');
              f.Setoid.lookup('either(string,number)'); f.Ord.lookup('maybe(number)');
              f.Ord.lookup('array(number)'); } catch (e) { /* HEAD 에는 없다 */ }
        f.StateT('maybe'); f.EitherT('task'); f.ReaderT('maybe');
        f.WriterT('maybe', f.Monoid.lookup('array'));
        return 'done';
    }],
    ['지연 등록 후 레지스트리 키', allRegistryKeys],
    ['지연 등록 후 Algebra.all 키', allBundles],
];

// 최상위 await 는 ES2022 라 상한 위다 — async 함수로 감싼다. 덤으로 거부를 잡게 됐다:
// 최상위 await 가 거부되면 처리되지 않은 거부로 새어 나간다.
const main = async () => {
    const { changed } = await diffCases(cases, { ref: process.argv[2] || 'HEAD' });
    console.log(changed
        ? '\n판정: 위 차이를 계획서와 하나씩 대조하라. 계획에 없으면 회귀다.'
        : '\n판정: 관측 가능한 동작이 그대로다.');
};

main().catch(e => { console.error(e); process.exitCode = 1; });
