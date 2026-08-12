# 회차 5 — optics 를 레지스트리 조합으로

## 지시

> **"함수합성이 가능한데 합성하지 않고 직접 구현하는 것은 지울 겁니다.
> 합성에 필요한 타입이 있다면, 기존 타입 등록 및 구현 방법을 보고 구현하면 됩니다."**
>
> **"네이밍에 신중하십시오. 저는 wander 타입을 모릅니다."**
> **"제가 이해하지 못하면 지워지는 거에요."**

## A. `_asApplicative` 제거 — 생성자 체인으로 (가장 나쁜 것)

`index.js:2315-2331` 이 심볼 3개를 손으로 찍어 **`checkAndSet` 검증을 통째로 건너뛴다.**

```javascript no-run 지금 — 검증 우회
const _asApplicative = dict => {
    dict[Symbols.Functor] = true;
    dict[Symbols.Apply] = true;
    dict[Symbols.Applicative] = true;   // 심볼만 위조해 traverse 의 strict 검사를 통과
    return dict;
};
```

**등록하지 않고 인스턴스를 만드는 정식 경로가 이미 있다** — 생성자의 `registry` 를 생략한다.
리뷰어가 실행으로 확인했다:

```javascript no-run 변경안
const identityApplicative = new Applicative(
    new Apply(new Functor((f, x) => ({ value: f(x.value) }), 'Object'),
              (ff, fa) => ({ value: ff.value(fa.value) }), 'Object'),
    v => ({ value: v }), 'Object');

const constApplicative = monoid => new Applicative(
    new Apply(new Functor((_, x) => x, 'Object'),
              (a, b) => ({ value: monoid.concat(a.value, b.value) }), 'Object'),
    () => ({ value: monoid.empty() }), 'Object');
```

`_asApplicative` 삭제.

## B. 조합으로 대체 가능한 3건 (리뷰어가 실행 확인)

| 지금 | 조합 |
| --- | --- |
| `_PFn.first = p => ([a,c]) => [p(a), c]` | `Bifunctor.of('tuple').bimap(p, identity, t)` — **완전 일치** |
| `_PFn.left = p => e => e.isLeft() ? Left(p(e.value)) : e` | `Bifunctor.of('either').bimap(p, identity, e)` |
| `_PForget.left = p => e => e.isLeft() ? p(e.value) : m.empty()` | `Either.fold(p, () => m.empty(), e)` |

`Bifunctor.types` = `tuple, either, validation` — **이미 등록돼 있다.**

**`_PForget.first`(`([a,_c]) => p(a)`) 는 손으로 쓰는 게 맞다** — 대응하는 `fst` 가 없다
(`fp.fst === undefined` 확인). 그 사실을 주석에 적는다.

**주의**: `bimap(p, identity, e)` 는 Right 를 **새 객체로 만든다**(현재는 `e` 를 그대로
반환). 값은 같지만 참조가 다르므로 `npm run baseline` 으로 확인한다.

## C. 이름 — 약자를 없앤다

| 지금 | 바꿀 것 |
| --- | --- |
| `_firstM` / `_arrayM` | **없앤다** — `preview`/`toListOf` 본문에서 `Monoid.of(...)` 를 직접 부른다. 약자 2개와 주석 2줄이 함께 사라지고, "로드 시점에 붙잡는다" 는 사과도 없어진다 |
| `_PFn` / `_PForget` / `_PTagged` | `functionProfunctor` / `forgetProfunctor` / `taggedProfunctor` |
| `_runOptic` | `runOptic` |
| `_Identity` / `_Const` | `identityApplicative` / `constApplicative` (A 에서 함께) |
| `_promap` | **없앤다** — `Profunctor.of('function').promap` 를 직접 |
| `_asApplicative` | **없앤다** (A) |

**언더스코어 접두사를 optics 에서 전부 없앤다.** 파일의 다른 곳은 `emptyFunc`, `identity`,
`compose2`, `raise`, `runCatch` 처럼 접두사가 없다.

**`wander` 는 이름을 그대로 둔다** — 세 profunctor 딕셔너리가 공유하는 **메서드 이름**이라
바꾸면 세 곳이 함께 바뀌고, `first`/`left` 와 짝이다. 대신 **주석에 한 줄로 설명한다**:
"`first`=곱(짝의 한쪽), `left`=합(Either 한쪽), `wander`=순회(컨테이너 전부)".

## D. 문서·타입 정합 (회차 4 리뷰 잔여)

| # | 할 것 |
| --- | --- |
| 11 | `docs/Optics.md:196` — "`view`는 항상 값을 돌려주거나 던집니다" 가 **거짓**이다. 대상 1개의 값이 `undefined` 면 그대로 흘린다. `harness allow` 필요 |
| 3 | `types/Lens.d.ts:78` — **3회차 연속 미해결**. `review` 선언의 선례 형식으로 |
| 4 | `docs/Monoid.md`·`docs/Plus.md` 에 `plus(<alias>)` 키 관례. `harness allow` 필요 |
| 5 | `types/__tests__/NonHKTClasses.test-d.ts` 에 새 키 고정 (지금은 d.ts 를 지워도 tsc 초록) |
| 6 | `index.js` 주석의 `foldMap(monoid, optic, s)` → **이미 있는 export 와 충돌**한다. `optics.foldMapOf` 로 이름 변경 |

## Verification

1. **`npm run baseline`** — B 의 `bimap` 전환이 관측 동작을 바꾸지 않아야 한다.
   격자에 **Prism 경로 케이스를 추가한다**(현재 `review Prism` 하나뿐이라 `left` 를 얇게 덮는다)
2. `npm test` + `tsc`
3. **뮤테이션 3건** — ① `identityApplicative` 를 `_asApplicative` 방식으로 되돌리기
   ② `bimap` 조합을 손으로 쓴 것으로 되돌리기 ③ d.ts 키 삭제.
   **세 번째는 지금 안 잡히는 것이 확인됐다** — D5 로 잡히게 만든다
4. `grep -n "^const _" index.js` → **optics 구간에 0건**
5. `staticland-reviewer` → **회차 4의 12건 대조를 요구한다**

## 범위 밖 — 다음 회차

| 회차 | 범위 |
| --- | --- |
| 6 | `identityApplicative`/`constApplicative` 를 **레지스트리에 등록** (`Applicative.types` 에 `identity`/`const`). 이번엔 클래스 우회만 없앤다 |
| 7 | optics 모듈 객체 + bare export 11개 제거 + `optics.foldMapOf` 신설 |
| 8 | `plus(maybe)` 키 이름 재검토(#10) · `plus(array)` 중복(#12) · 재래핑 −39%(#1) |

## 되돌리는 법

A · B · C 를 별도 커밋으로. **B 만 관측 동작을 바꿀 수 있다**(Right 참조).
