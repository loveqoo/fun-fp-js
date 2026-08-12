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
    ['first.concat(1,2)', f => f.Semigroup.of('first').concat(1, 2)],
    ['first.concat(1,"a")', f => f.Semigroup.of('first').concat(1, 'a')],
    ['first.concat(obj)', f => f.Semigroup.of('first').concat({ a: 1 }, { a: 2 })],
    ['last.concat(1,2)', f => f.Semigroup.of('last').concat(1, 2)],
    ['maybe(first) 동종', f => f.Maybe.Monoid('first').concat(f.Maybe.Just(1), f.Maybe.Just(2))],
    ['maybe(first) 이종', f => f.Maybe.Monoid('first').concat(f.Maybe.Just(1), f.Maybe.Just('a'))],
    ['array Monoid', f => f.Monoid.of('array').concat([1], [2])],
    ['array Monoid empty', f => f.Monoid.of('array').empty()],

    // ── 레지스트리 자체 — 키가 사라지거나 늘어난 것을 본다 ────────────────
    ['Functor.types 키', f => Object.keys(f.Functor.types).sort()],
    ['Apply.types 키', f => Object.keys(f.Apply.types).sort()],
    ['Applicative.types 키', f => Object.keys(f.Applicative.types).sort()],
    ['Monoid.types 키', f => Object.keys(f.Monoid.types).sort()],
    ['Semigroup.types 키', f => Object.keys(f.Semigroup.types).sort()],
    ['최상위 export 키', f => Object.keys(f).sort()],

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
];

const { changed } = await diffCases(cases, { ref: process.argv[2] || 'HEAD' });
console.log(changed
    ? '\n판정: 위 차이를 계획서와 하나씩 대조하라. 계획에 없으면 회귀다.'
    : '\n판정: 관측 가능한 동작이 그대로다.');
