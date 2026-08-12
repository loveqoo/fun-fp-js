# 리뷰어 2차 대기 + 자체 감사에서 찾은 것

## 상황

회차 2에서 백그라운드로 띄운 `staticland-reviewer` 2차가 아직 안 왔다.
사용자가 "기다린다" 를 선택했다. **기다리는 동안 자체 감사를 했고 하나를 찾았다.**

자체 감사 결과: `.dev/log/260812-fa055f-1-self-audit.md` (회차 1 리뷰 12건 중 해결 11 / 부분 1)

## A. `'Object'` 대문자를 테스트로 고정한다 — 자체 감사에서 찾은 것

`IdentityFunctor`/`IdentityApply`/`IdentityApplicative` 와 `Applicative.Const` 가 전부
`type: 'Object'`(대문자)를 쓴다. 이유:

- `types.equals(a, b, 'Object')` 는 **대소문자 폴백이 없다** (`types.check` 와 다르다)
- 같은 파일의 `ObjectFilterable`/`ObjectFoldable` 은 `'object'`(소문자)를 쓴다
- **누가 "일관성" 으로 정리하면 optics 의 traversal 이 전부 죽는다**

지금은 **주석으로만 막아뒀다.** 앞 회차 리뷰가 "위태로운 결합" 이라 지적했고 나도 주석만
달았다. 규칙 20 의 반대 경우다 — **관측 가능하게 죽는데 그 자리를 지키는 테스트가 없다.**

```javascript no-run 변경안
test("Identity/Const 의 type 은 'Object' 대문자여야 한다", () => {
    // types.equals(a, b, 'Object') 는 대소문자 폴백이 없다. 소문자로 바꾸면
    // Apply.ap 이 전부 던져 optics 의 traversal 이 죽는다.
    assertEquals(Functor.of('identity').type, 'Object');
    assertEquals(Applicative.of('identity').type, 'Object');
    assertEquals(Applicative.Const(Monoid.of('array')).type, 'Object');
});
```

그리고 **그 결합이 실제로 무엇을 지키는지**도 고정한다 — traversal optic 이 도는지:

```javascript no-run
test('Identity 가 traverse 를 통과한다 (Object 결합의 실질)', () => {
    assertDeepEquals(over(traversed('array'), x => x * 2, [1, 2, 3]), [2, 4, 6]);
    assertDeepEquals(toList(traversed('array'), [1, 2]), [1, 2]);
});
```

두 번째는 이미 있는 테스트와 겹치지만, **첫 번째가 깨질 때 왜 깨지는지**를 알려주는 짝이다.

## B. 리뷰어 결과가 오면

`.dev/review/260812-d36358-2-*.md` 에 기록하고, **자체 감사와 대조한다**:

1. 내가 ✅ 로 본 11건 중 리뷰어가 미해결로 보는 것 → 내 판정 기준이 얕다
2. 리뷰어가 새로 잡은 것 중 내 후보 목록에 없는 것 → 내 감사 범위가 좁다
3. 내 후보에 있는데 리뷰어가 안 잡은 것 → 내가 과민하거나 리뷰어가 놓쳤다

## Verification

1. **뮤테이션**: `'Object'` → `'object'` 로 바꾸면 A 의 테스트가 잡는가 (그리고 몇 건이
   추가로 깨지는가 — 그 숫자가 이 결합의 크기다)
2. `npm test` + `tsc`
3. 리뷰어 결과 대조표

## 범위 밖

`deriveFromPlus` 재래핑 · `docs/` 의 `plus(` · Strong/Choice/Wander
