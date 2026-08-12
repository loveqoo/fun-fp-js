# Context — 리뷰어 2차를 기다리며 자체 감사

리뷰어 2차가 백그라운드 실행 중이다. **결과가 오기 전에 내가 먼저 12건을 감사해두면
대조가 된다** — 리뷰어와 내 판정이 갈리는 지점이 곧 배울 곳이다.

## 회차 1 리뷰 12건 — 내 판정

| # | 지적 | 내 판정 | 근거 |
| --- | --- | --- | --- |
| 1 | `Applicative.Const` 가 키를 못 받고 미등록 | ✅ 해결 | `Applicative.of('const(array)')` OK (회차 3~4) |
| 2 | `identity` 의 Functor/Apply 층 미등록 | ✅ 해결 | `Functor.of('identity')`·`Apply.of('identity')` OK |
| 3 | `ApplicativeInstances` 에 `identity` 없음 | ✅ 해결 | `builtins.d.ts` 3단 선언 + `NonHKTClasses.test-d.ts` 고정. 뮤테이션 검거 |
| 4 | `Optics` d.ts 12키 중 6개 미검거 | ✅ 해결 | 뮤테이션 재측정 **12/12** |
| 5 | `preview`/`toList` 가 `foldMapOf:` 로 던짐 | ✅ 해결 | 각자 이름으로. 격자에 「에러 귀속」 5줄 |
| 6 | `foldMapOf` 무검사 | ✅ 해결 | monoid·f 둘 다. 6가지 optic 종류 균일 |
| 7 | 격자 42케이스 사망 | ✅ 해결 | 리뷰어가 읽기 전에 이미 고침 |
| 8 | `foldMapOf` 문서 0건 | ✅ 해결 | `docs/Optics.md` 4블록 + 표 행. `foldMapOf` 14건 |
| 9 | `CLAUDE.md` 유령 이름 | ✅ 해결 | `identityApplicative`/`constApplicative` 0건 |
| 10 | `unwrapIfSameType` 주석의 거짓 근거 | ⚠ **부분** | 주석은 고쳤으나 **`deriveFromPlus` 의 재래핑은 그대로** |
| 11 | 네이밍 근거가 거짓 | ✅ 해결 | `CLAUDE.md` 「이름 규칙」 절 + 리뷰어 판정 기준 6·7 |
| 12 | `foldMapOf` 부정 테스트 0건 | ✅ 해결 | 3건 추가. 뮤테이션 검거 |

**해결 11 / 부분 1.**

## 리뷰어가 새로 잡을 만한 곳 — 내가 아는 것

| 후보 | 왜 |
| --- | --- |
| `deriveFromPlus` 의 `new Semigroup(plus.alt, type)` | `unwrapIfSameType` 이 없애려던 패턴을 같은 파일에서 재도입 (#10 잔여). **계획서가 「범위 밖」으로 명시했다** |
| `docs/` 의 `plus(` 0건 | 앞 작업 리뷰 #8. 여전히 0건 |
| `Optics.compose` 0/1 인자 테스트 | 회차 1 리뷰 #12 가 "HEAD 와 동일함을 확인했으나 테스트는 없다" |
| `normalizeTypeClassKey` 매개변수화 | 회차 3에서 새로 만든 것 — 테스트가 간접적이다(`Maybe.Monoid`·`Applicative.Const` 경유) |
| `IdentityFunctor` 의 `'Object'` 대문자 | 주석은 달았으나 **테스트가 없다** — 소문자로 바꾸면 optics 가 죽는데 그것을 고정한 테스트가 없다 |

마지막 것이 특히 신경 쓰인다 — **주석으로만 막아둔 것**이고, 규칙 20("관측 동등한 변경은
게이트가 없다")의 반대로 **관측 가능하게 죽는데도 그 자리를 지키는 테스트가 없다.**

## 대조할 것

리뷰어 결과가 오면:

1. 내가 ✅ 로 판정한 11건 중 리뷰어가 **미해결로 보는 것**이 있는가 → 있으면 내 판정 기준이 얕다
2. 리뷰어가 새로 잡은 것 중 **내 후보 목록에 없는 것**이 있는가 → 있으면 내 감사 범위가 좁다
3. 내 후보 목록에 있는데 리뷰어가 **안 잡은 것**이 있는가 → 있으면 내가 과민하거나 리뷰어가 놓쳤다

**이 대조 자체가 이번 작업의 산출물이다.**
