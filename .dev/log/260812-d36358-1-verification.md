# Verification — optics 모듈화

## 완료 조건 8개 대조

| # | 조건 | 판정 | 근거 |
| --- | --- | --- | --- |
| 1 | 최상위 bare export 11개 제거, `Optics` 하나만 | ✅ | 잔존 0개. `baseline` 「최상위 export 키」가 **11 감소 + 1 증가** |
| 2 | `Optics` 가 12개 키를 갖는다 | ✅ | `Iso Lens Prism traversed compose view preview toList foldMapOf over set review` |
| 3 | `foldMapOf` 가 사용자 Monoid 로 모은다 | ✅ | 테스트 6건. `Monoid.of('number')` 합계 6, `NumberProductMonoid` 24, `NumberMaxMonoid` 9, `string` `'123'` |
| 4 | 기존 `foldMap` 과 충돌 없음 | ✅ | 최상위 `foldMap` 그대로 동작(`6`), 모듈 안은 `foldMapOf` |
| 5 | 타입 선언 + `tsc` | ✅ | `Lens.d.ts` 를 `export declare const Optics` 로. `index.d.ts`·`DefaultExport.test-d.ts`·`NegativeTests.test-d.ts` 갱신. exit 0 |
| 6 | 문서 갱신 + 예제 검사기 | ⚠ **부분** | `docs/` 3파일 갱신, **371개 예제 전부 통과**. `CLAUDE.md` 는 7곳 미갱신 — Execution 이 context 를 못 써서 Compounding 으로 |
| 7 | `baseline` 이 11 감소 + 1 증가 | ✅ | 확인 |
| 8 | `staticland-reviewer` 백그라운드 검토 | ⏳ **실행 중** | 규칙 21 적용 — 대화가 막히지 않는다 |

## 동작 차이 13건 — 전부 앞 작업의 계획된 변경

```
≠ view 다중 3건 · view 빈배열 · view Prism 실패     ← 앞 작업 회차 4 (view 계약 강제)
≠ first/last/maybe(first) 5건                     ← 앞 작업 회차 2 ('any' 도입)
≠ Monoid.types · Semigroup.types 키              ← 앞 작업 회차 3~4 (plus(*) 등록)
≠ 최상위 export 키                                 ← 이번 작업 (11 감소 + Optics 1 증가)
```

**optics 모듈화가 만든 새 동작 차이는 0건이다** — 순수 이름 이동임이 확인됐다.

## 뮤테이션 2건

| 뮤테이션 | 결과 |
| --- | --- |
| `Optics` 객체에서 `foldMapOf` 키 제거 | **10건 빨간불** |
| `types/Lens.d.ts` 에서 `foldMapOf` 선언 제거 | **tsc 에러 2건** |

## 검증 도구 자체의 버그를 잡았다 — 기록해둘 것

`npm run baseline` 격자를 이름 변경에 맞춰 고치면서 **거짓 회귀 3건을 만들었다.**

```
≠ view Lens 중첩    THROW TypeError: P.first is not a function  ->  5
≠ preview 합성      THROW TypeError: P.wander is not a function ->  Just(null)
≠ 합성 Prism∘Lens   THROW TypeError: P.left is not a function   ->  Nothing
```

원인은 내가 쓴 정규화 shim 이었다:

```javascript
const compose = o.compose ?? o.composeOptic;   // ← HEAD 에서 f.compose 는 범용 함수 합성이다
```

HEAD 쪽에는 `f.compose`(일반 함수 합성)가 **존재하므로** `??` 가 그것을 골라버렸고,
optic 합성 자리에 엉뚱한 함수가 들어가 세 케이스가 터졌다. `f.Optics` 유무로 갈라
고쳤더니 16건 → 13건이 됐다.

**회차 3에서 배운 것("차이를 숨기는 도구는 없는 것보다 나쁘다")의 반대 방향이다** —
이번엔 도구가 **없는 차이를 만들어냈다.** 도구가 틀리는 방향은 두 가지다.

## 남은 것

- `CLAUDE.md` 7곳 (Compounding)
- 리뷰어 결과 반영 (실행 중)
