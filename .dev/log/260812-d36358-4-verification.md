# Verification — 회차 4 (`addResolver` 한 줄)

## 계획서 조건 대조

| # | 조건 | 판정 | 근거 |
| --- | --- | --- | --- |
| 1 | **별도 프로세스**에서 팩토리 미호출 상태 해석 | ✅ | `Applicative.of('const(array)')`·`const(number)` 둘 다 OK |
| 2 | **선례와 동일하게 동작하는가** (규칙 25 로 추가한 조건) | ✅ | 아래 표 |
| 3 | 격자의 `Applicative.types` 줄 | ✅ | 지연 해석이라 키를 미리 만들지 않음 — 변화는 회차 3의 `identity` 등록분뿐 |
| 4 | `npm test` + `tsc` | ✅ | 38 files, typecheck passed |
| 5 | 뮤테이션 | ✅ | resolver 제거 → **2건 빨간불** |

## 선례 대조 — 세 항목 전부 같다

```
Monoid.of("maybe(first)")       => OK, 캐시 동일: true
Applicative.of("const(array)")  => OK, 캐시 동일: true
Semigroup.of("maybe(first)")    => OK, 캐시 동일: true

키를 미리 만들지 않는다: true       ← 지연 해석이지 사전 등록이 아니다
해석 후에는 등록된다  : true
```

## 테스트 오염을 피했다

같은 파일 앞쪽 테스트가 `Applicative.Const('array')` 를 부르면 키가 이미 등록돼
**resolver 없이도 통과한다.** 그래서 아무도 안 쓰는 `'string'` 키로 썼다.

```
grep -c "Applicative.Const('string')" tests/*.js  →  전부 0
```

뮤테이션으로 확인: resolver 를 지우면 2건 빨간불. **키를 잘못 골랐으면 0건이었다.**

## 이번 작업(`260812-d36358`) 전체 상태

| 회차 | 한 일 | 리뷰 |
| --- | --- | --- |
| 1 | `Optics` 모듈화 + bare export 11개 제거 + `foldMapOf` 신설 | 12건 |
| 2 | 리뷰 6건 처리 + **네이밍 관례 `CLAUDE.md` 명문화** | 백그라운드 2차 실행 중 |
| 3 | `identity` 3단 등록 + `Applicative.Const` 키 수용 | — |
| 4 | `addResolver(Applicative, ...)` — 회차 3의 미완 | — |

**회차 1 리뷰 12건 전부 처리됐다** (#1·#2·#3 이 회차 3~4에서 마무리).

```
npm test          38 files passed  (문서 예제 379개)
tsc --noEmit      통과
npm run baseline  61케이스, 차이 17건 (전부 계획된 변경)
커밋              0건
```

## 남은 것

| 항목 | 출처 |
| --- | --- |
| 리뷰어 2차 결과 | 백그라운드 실행 중 |
| `deriveFromPlus` 재래핑 | 앞 작업 리뷰 #10 잔여 |
| `docs/` 의 `plus(` 0건 | 앞 작업 리뷰 #8 |
| `Strong`/`Choice`/`Wander` | `CLAUDE.md` 「폐기된 판단」의 마지막 잔액 |
