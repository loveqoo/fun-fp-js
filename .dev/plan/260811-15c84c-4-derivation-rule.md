# 회차 4 — 유도를 규칙으로, `view` 계약을 코드로

회차 3 리뷰 9건 중 소스·타입 층 5건(#1·#2·#3·#4·#7)을 처리한다.

## A. `Plus` → `Monoid` 유도를 **규칙**으로 올린다 (리뷰 #2 → #1·#3 동시 해소)

회차 3은 `plus(array)` 를 **"`Plus` 가 있는 타입은 전부 Monoid 를 얻는다는 규칙이 낫다"**
로 정당화해놓고 **그 규칙을 안 만들고 손으로 쓴 클래스 2개만 놓았다.** 리뷰어가
프로토타입으로 **38 파일 통과 + 12줄 감소**를 보였다.

`Plus` 생성자에서 유도한다:

```javascript no-run 변경안
class Plus extends Alt {
    constructor(alt, zero, type, registry, ...aliases) {
        checkAndSet('Plus.super')(alt);
        super(alt, alt.alt, type);
        checkAndSet('Plus')(this, alt, zero);
        registry && register(registry, this, ...aliases);
        // Plus 는 alt(결합)와 zero(항등원)를 둘 다 가지므로 구조적으로 Monoid 다.
        // 등록된 Plus 는 자동으로 짝 Monoid/Semigroup 을 plus(<alias>) 키로 얻는다.
        registry && deriveMonoidFromPlus(this, type, aliases);
    }
}
```

**`register()` 를 쓰면 안 된다** — `target[instance.constructor.name]` 때문에
`Monoid.types['Monoid']` 가 생기고 두 Plus 가 서로 덮는다(Context 에서 소스로 확인).
**`Maybe.Monoid` 의 선례대로 키를 직접 넣는다**(`index.js:1374` — `Monoid.types[\`maybe(${key})\`] = result`).

그리고 **짝 Semigroup 도 함께 등록한다** (리뷰 #3) — 현재 `plus(*)` 는 등록된 Monoid 중
유일하게 `Semigroup.types` 에 짝이 없다.

```javascript no-run 변경안
const deriveMonoidFromPlus = (plus, type, aliases) => {
    const sg = new Semigroup(plus.alt, type);
    sg.concat = plus.alt;   // Alt 가 이미 검사를 씌웠다 — 두 번 씌우지 않는다 (리뷰 #3)
    const m = new Monoid(sg, plus.zero, type);
    for (const alias of aliases) {
        const key = `plus(${alias.toLowerCase()})`;
        Semigroup.types[key] = sg;
        Monoid.types[key] = m;
    }
};
```

`ArrayPlusMonoid`/`MaybePlusMonoid`/`plusMonoidArgs` **삭제**. 리뷰 #1(`plus(array)` 가
`Monoid.of('array')` 와 관측 차이 0인 순수 중복)은 이것으로 **성격이 바뀐다** — 손으로
쓴 특례가 아니라 규칙의 산물이 되므로 대칭이 실제 이득이 된다.

`Monoid` 는 `index.js:459`, `Plus` 는 `:573` 이라 정의 순서가 막지 않는다(확인함).

## B. `view` 를 `toListOf` 기반으로 — 대상 수 ≠ 1 이면 던진다 (리뷰 #7)

명세 세 곳이 전부 "정확히 1대상" 이라 말하는데 **코드가 강제하지 않아** `view(traversed, [1,2,3])`
가 조용히 `1` 을 준다. 회차 1·2 회귀가 둘 다 "명세 없는 동작 + 테스트 없음" 에서 나왔고
이 자리가 정확히 그 상태다.

**깨질 위험 조사 (Planning 에서 실측):**

| | `view` + `traversed` 조합 |
| --- | --- |
| `docs/*.md` | **0건** — `view` 예제 7곳 전부 Lens·Iso |
| `tests/` | **0건** — 대상 0개 throw 테스트만 있음 |

게다가 **이미 HEAD 와 다르다** — 회차 2의 `'any'` 부수 효과로 "마지막 대상" → "첫 대상" 이
됐다. 지금 값을 보존해도 HEAD 호환이 아니다.

```javascript no-run 변경안
const view = (lens, s) => {
    const targets = toListOf(lens, s);   // toListOf 가 optic 함수 검사도 한다
    targets.length !== 1 && raise(new TypeError(
        `view: expected exactly one target, got ${targets.length} — use preview or toListOf`));
    return targets[0];
};
```

| 대상 수 | 지금 | 바꾼 뒤 |
| --- | --- | --- |
| 0 | TypeError | TypeError (메시지만 바뀐다) |
| 1 | 그 값 | 그 값 — **동일** |
| 2+ | 첫 값 (미보증) | **TypeError** |

**주의**: `toListOf` 의 에러 메시지가 `toListOf: optic must be a function` 이 되므로
기존 테스트 `view: optic must be a function` 이 깨진다. `view` 에서 함수 검사를 먼저 한다.

## C. TypeScript 선언 (리뷰 #4)

`types/data/builtins.d.ts` 의 `MonoidInstances`/`SemigroupInstances` 에 추가:

```typescript no-run 변경안
readonly 'plus(array)': ReadonlyArray<unknown>;
readonly 'plus(maybe)': Maybe<unknown>;
```

`types/Lens.d.ts:78` 의 `view` 주석을 `review` 선언의 선례(`// Prism and Iso only —
Lens/Traversal throw at runtime.`)와 같은 형식으로 바꾼다 — "no target or multiple targets
⇒ throws at runtime".

## D. 부수 — Haskell 대응 서술 정정

리뷰어 실측: `maybe(first)` 와 `plus(maybe)` 는 **동종 payload 25쌍 중 15/15 값 일치**이고
차이 10건은 전부 앞엣것의 THROW 다. **값이 다른 경우가 하나도 없다.**

`index.js:915-919` 와 `CLAUDE.md` 가 둘을 "`Monoid (Maybe a)` vs `Data.Monoid.First`" 로
대응시켰는데, 정확히는 **`Data.Monoid.First a ≅ Maybe (Data.Semigroup.First a)`** 라 같은
모노이드이고 차이는 우리 strict 검사가 payload 에 붙느냐뿐이다. 일반 `Monoid (Maybe a)` 의
다른 멤버는 `Maybe.Monoid('number')`(`Just 1 <> Just 2 = Just 3`) 쪽이다.

## 테스트 (먼저 쓴다)

| 테스트 | 기대 |
| --- | --- |
| `view(traversed('array'), [1,2,3])` | **throws** `expected exactly one target, got 3` |
| `view(traversed('array'), [7])` | `7` |
| `view(traversed('array'), [])` | throws `got 0` |
| `view(lens, s)` 기존 | 그대로 |
| `Semigroup.of('plus(maybe)')` | 존재하고 `concat` 이 첫 Just |
| `Monoid.of('plus(maybe)') === Monoid.of('plus(maybe)')` | 같은 인스턴스 |
| `Monoid.types['Monoid']` | **undefined** — 생성자 이름 키 오염 없음 |
| 래핑 겹수 | `plus(maybe).concat === Alt.of('maybe').alt` (재래핑 안 함) |

**어서션은 전문 대조로** (규칙 15) — 부분 문자열은 변경 전에도 통과한다.

## Verification

1. `npm run baseline` — **`view 다중` 3줄이 THROW 로 바뀌고 나머지는 회차 3과 같아야 한다.**
   `Semigroup.types 키` 줄에 `plus(array)`/`plus(maybe)` 가 새로 나타나야 한다
2. `npm test` + `tsc`
3. **뮤테이션** (규칙 15): B의 `targets.length !== 1` 을 지우고 테스트가 빨간불이 되는지
4. `grep "plusMonoidArgs\|ArrayPlusMonoid\|MaybePlusMonoid" index.js` → 0건
5. `staticland-reviewer` → `.dev/review/260811-15c84c-4-*.md`. **회차 3의 9건 대조를 요구한다**

## 되돌리는 법

A(유도 규칙) · B(`view` 계약) · C(타입) 를 **별도 커밋**으로. B 가 사용자에게 보이는
동작을 바꾸는 유일한 것이다.

## 범위 밖 — 다음 회차

| 회차 | 범위 |
| --- | --- |
| 5 | `_Identity`/`_Const` Applicative 등록 |
| 6 | optics 모듈 객체 + bare export 11개 제거 + `foldMap(monoid, optic, s)` 신설 |
