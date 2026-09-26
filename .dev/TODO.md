# `.dev/TODO.md` — 지금 어디인가

이 폴더의 다른 파일은 **끝난 일의 기록**입니다. 이 파일만 **지금의 상태**입니다.
`INDEX.md` 처럼 계속 고칩니다.

## 왜 있나

작업이 목록이 아니라 **그래프**로 엮입니다. 리뷰 판정 하나를 고치다 새 판정이 나오고,
그것을 고치려면 앞의 결정을 다시 봐야 합니다. 그때 "여기가 어디고 무엇이 남았는지" 를
대화 안에만 두면 사람도 에이전트도 길을 잃습니다. 실제로 잃었습니다 — 에이전트가
리뷰어의 번호를 자기 번호로 다시 매겨 말하는 바람에 소유자가 어느 항목인지 못 찾았습니다.

## 규약

1. **번호는 출처의 번호를 그대로 쓴다.** 리뷰어가 7번이라 하면 끝까지 7번이다.
   에이전트가 다시 매기지 않는다.
2. **닫힌 노드는 지우지 말고 접는다.** 왜 그 길로 갔는지가 다음 회차의 입력이다.
3. **작업을 시작할 때 읽고, 상태가 바뀔 때마다 고친다.** 커밋 직전에 한꺼번에 쓰면
   이 파일은 일기가 되고, 일기는 아무도 안 본다.

### 항목 하나의 포맷 — 권장이지 강제는 아니다

한 줄로 충분한 것은 한 줄로 씁니다. 다만 **완료조건은 반드시**, 그리고 **닫을 때는 검증이
반드시** 있어야 합니다.

```markdown
### [출처-번호] 한 줄 제목

- **원인** — 왜 이렇게 됐나. 증상이 아니라 경위다. 이게 없으면 다음 사람이 같은 실수를 한다.
- **해결책** — 무엇을 하면 되나. 아직 모르면 "미정" 이라고 쓴다.
- **완료조건** — 무엇이 **참이어야** 닫히나. 검증 가능한 형태로.
- **검증** — 닫을 때 채운다. **돌린 명령과 그 출력.** 이것 없이는 ✅ 로 못 바꾼다.
- **참고** — 링크. 소스 위치·판정 기록·규칙 번호. 긴 내용은 여기로 빼고 본문은 짧게 둔다.
```

**「검증」이 이 파일의 핵심입니다.** 이유는 이렇습니다 — 2026-08-13 에 `1차-9` 를 두고
에이전트가 "게이트 둘을 신설해 상당 부분 해소됐다" 고 말했는데, 뒤늦게 뮤테이션을 심어보니
42/42 초록으로 그대로 통과했습니다. **「초록 테스트」는 영수증이 아닙니다** — 아무것도 안
보는 게이트도 초록이기 때문입니다. 게이트에 대한 주장의 영수증은 **그 게이트가 잡는 뮤테이션**
하나입니다.

영수증이 없으면 **「확인 안 함」이라고 쓰십시오.** 그것은 완결된 답이지 실패가 아닙니다.
문장을 낮추는 비용은 항상 나중에 철회하는 비용보다 쌉니다.

상태: `♾` 상시 · `⬜` 안 함 · `🟡` 진행 중 · `✅` 닫힘 · `⏸` 소유자 결정 대기 · `🔒` 병합 전 필수

---

**닫힌 노드는 [`log/260926-todo-archive.md`](./log/260926-todo-archive.md) 에 있다.**
2026-09-26 에 이 파일이 2,554행까지 불어 「지금 어디인가」 가 안 보이게 되어, 그날까지의
본문을 통째로(무수정) 옮겼다. 옛 문서가 가리키는 `1차-8`·「닫힘 항목」 은 그쪽에서 찾는다.
**앞으로도 닫힌 노드가 쌓여 이 파일이 길어지면 같은 방식으로 날짜 붙은 보관본을 새로 떠라.**

---

## ♾ 상시 — Node 버전 지원 (2026-09-26 등록)

- **소유자 결정 (2026-09-26)** — CI 는 **모든 메이저**(14~26)를 돈다 · Node 14 는 **계속 지원** ·
  새 메이저 추가는 **자동화 없이 규칙으로만**. 규칙 본문은 `CLAUDE.md`(항상 로드).
- **불변식** — `ci.yml` 매트릭스가 `engines` 하한부터 nodejs.org 최신 메이저까지 전부 담고 초록이다.
  닫힘이 없는 항목이다. 새 메이저를 더할 때마다 아래 표에 한 줄 더한다.
- **왜 하한까지 돌리나 (영수증)** — `Setoid.Struct` 의 `names.every(...)` 를 같은 뜻의
  `names.findLast(...) === undefined` 로 바꾸는 뮤테이션(ES2023 API, ES2018 게이트 목록에 없음):
  Node 22 → `55 passed, 1 failed`(dist-sync 뿐 — dist 를 안 다시 지어서지 동작이 아니다),
  Node 14 → `50 passed, 6 failed`(setoid·monoid·optics·staticland-laws·docs-examples + dist-sync).
  복원 후 `git status` 에 index.js 변경 없음.
- **설치 단계의 함정** — Node 14 의 npm 6.14.18 은 lockfileVersion 3 을 못 읽는다(`npm ci` →
  `Cannot read property 'typescript' of undefined`, 실측). 그래서 CI 는 Node 22 로 `npm ci` 한 뒤
  매트릭스 버전으로 갈아타 테스트한다. 이 순서를 깨끗한 사본에서 재현: npm 10 으로 설치 →
  Node 14·npm 6 으로 `npm test` exit 0(`56 passed, 0 failed`, typecheck passed) → 빌드 exit 0.
  라이브러리 사용자에게는 무관 — 의존성 0개라 우리 lock 을 안 읽는다.
- **다음에 올 벽(추측)** — `typescript` 를 올리다 새 버전이 Node 14 를 버리면 typecheck 가
  14 에서 깨진다. 그때는 소유자에게 묻는다(규칙).
- **검증 — 로컬 전체 실행 (2026-09-26, `PATH=<버전>/bin:$PATH node tests/run.js`)** — 경고 0줄.

  | Node | 바이너리 | 결과 |
  | --- | --- | --- |
  | 14 | v14.21.3 | 56 passed, 0 failed · typecheck passed |
  | 16 | v16.20.2 | 56 passed, 0 failed · typecheck passed |
  | 18 | v18.20.8 | 56 passed, 0 failed · typecheck passed |
  | 20 | v20.20.2 | 56 passed, 0 failed · typecheck passed |
  | 22 | v22.22.2 | 56 passed, 0 failed · typecheck passed |
  | 24 | v24.21.0 (현 LTS) | 56 passed, 0 failed · typecheck passed |
  | 26 | v26.10.0 (최신) | 56 passed, 0 failed · typecheck passed |

  **CI 에서의 첫 실행은 확인 안 함** — 이 브랜치는 `main` 푸시도 PR 도 아니라 CI 가 안 돈다.
  PR 을 열거나 `main` 에 합칠 때 7줄 전부 초록인지 본다.

## ⏸ 보류 — provenance 발행 체계 (2026-08-28 등록, 2026-09-26 보류)

- **소유자 판정 (2026-09-26)** — "추후에 고려. 아직은 개인이 사용하는 정도." 착수는 소유자의
  명시 지시가 있을 때만. 원래 기록(원인·해결책안·완료조건)은 보관본 첫 항목.

## ⬜ 후보 — Free 동시성: fan-out/fan-in·race(k)·fiber (2026-08-29 등록, 착수 미정)

소유자 판정: 가능성만 기록, 형태는 **본체가 아니라 fun-fp-js 에 의존하는 별도 라이브러리**.
설계는 [`plan/260829-free-concurrency-candidates.md`](./plan/260829-free-concurrency-candidates.md).

- **완료조건** — 없음(후보). 착수는 소유자의 명시 지시가 있을 때만, 그때 완료조건을 세운다.

---

## 지금 유효한 소유자 결정 — 작업 전에 읽는다

한 줄씩만 둔다. 경위는 보관본에 있다.

| 날짜 | 결정 | 무엇을 뜻하나 |
| --- | --- | --- |
| 2026-09-26 | **`index.js` 를 동결하지 않는다** | 6차 점검의 freeze 권고(수정 조건 6개 제한) 기각. "JS 로 FP 를 하는 데 부족한 것이 있으면 계속 고친다." 기능 추가·개선은 열려 있다 |
| 2026-09-26 | **1.0 은 아직 멀었다** | "더 많이 테스트하고 사용해야 한다." CHANGELOG 「1.0.0 까지」 조건이 채워져 보여도 1.0 을 권하지 않는다 |
| 2026-08-30 | TS 수리는 5차에서 멈춘다 | 공식 지원은 JS 뿐. TS 리뷰 후보는 기본 보류, 착수는 명시 지시로만 |
| 2026-08-15 | `Algebra`·`.type` 은 타입 체계가 아니다 | 한 겹 확인까지. `_typeName` 위조 통과·`Set`/`Map` 원소 타입 부재는 의도된 한계 |
| 2026-08-13 | `NumberProductGroup` 은 고치지 않고 알린다 | `docs/internals.md#product-group` |
| 2026-08-17 | 빌드 순서: **기능 커밋 → 빌드 → dist 커밋** | 헤더의 `Commit:` 해시가 내용 시점을 가리키려면 이 순서여야 한다(`build.js` 주석이 여기를 가리킨다) |

## 닫힘 — 이번 회차 (2026-09-26)

- ✅ **Static Land 「Compatible libraries」 위키 등재** — 소유자가 직접 등재. **검증**:
  `curl -sSL https://raw.githubusercontent.com/wiki/rpominov/static-land/Compatible-libraries.md | grep fun-fp`
  → 19행 `- [fun-fp-js](https://github.com/loveqoo/fun-fp-js) — Zero-dependency Static Land
  implementation in a single file: …`.
- ✅ **런타임 점검 6차의 freeze 권고** — 소유자 기각(위 결정표 첫 줄). 부수 수리(dimap 주석 2줄)는
  그때 이미 끝났다.
- ✅ **클라우드 세션 시작 훅** — 새 컨테이너는 `node_modules` 가 없어 `npm test` 가 2파일 +
  typecheck 거짓 빨강을 낸다(실측: `54 passed, 2 failed`, consumer·es-ceiling·typecheck).
  `.claude/hooks/session-start.sh` 가 `npm ci` 를 돈다(`npm install` 은 lock 을 고쳐 작업
  트리를 더럽혀서 `ci` 로 — 실측). **검증**: `node_modules` 삭제 →
  `CLAUDE_CODE_REMOTE=true` 로 훅 실행 → `added 1 package`, exit 0, `git status` 에 lock 변경
  추가 없음 → `npm test` `56 passed, 0 failed` + typecheck passed.
- ✅ **`TODO.md` 다이어트** — 2,554행 → 이 파일. 보관본이 원본 49~2554행과 같다는 것:
  `diff <(git show HEAD:.dev/TODO.md | sed -n '49,$p') <(tail -n +10 .dev/log/260926-todo-archive.md)` → 차이 없음.
