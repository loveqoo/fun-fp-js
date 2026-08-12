# Verification — 자체 감사 산출물

## A. `'Object'` 결합 고정

**자체 감사에서 내가 찾았다** — 리뷰어 지적이 아니다. 주석으로만 막아둔 자리였다.

뮤테이션 (`'Object'` → `'object'`):

| | 전 | 후 |
| --- | --- | --- |
| 깨지는 테스트 파일 | 2개 (`optics`, `docs-examples`) | **3개** |
| **왜 깨지는지 알려주나** | ❌ `Apply.ap: both arguments must be object` 만 | ✅ `Identity/Const 의 type 은 'Object' 대문자여야 한다` |

전에도 깨지긴 했다. **그런데 원인을 못 알려줬다** — 다음 사람이 optics 가 죽은 이유를
찾느라 헤맸을 것이다. 이제 테스트 이름이 답을 준다.

## B. 회차 1 리뷰 12건 자체 감사

`.dev/log/260812-fa055f-1-self-audit.md` — **해결 11 / 부분 1**.

부분: #10 — 주석은 고쳤으나 `deriveFromPlus` 의 재래핑은 그대로(계획서가 「범위 밖」 명시).

## C. 리뷰어가 새로 잡을 만한 곳 — 내 후보 목록

| 후보 | 상태 |
| --- | --- |
| `deriveFromPlus` 재래핑 | 범위 밖 (다음 작업) |
| `docs/` 의 `plus(` 0건 | 범위 밖 |
| `Optics.compose` 0/1 인자 테스트 | 없음 |
| `normalizeTypeClassKey` 직접 테스트 | 간접만 (`Maybe.Monoid`·`Applicative.Const` 경유) |
| **`'Object'` 대문자 결합** | ✅ **이번에 고정** |

## 현재

```
npm test          38 files passed
tsc --noEmit      통과
npm run baseline  61케이스
커밋              0건
```

리뷰어 2차는 아직이다. 오면 위 자체 감사와 대조한다.
