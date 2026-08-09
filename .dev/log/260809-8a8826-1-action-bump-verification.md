# 검증 기록 — 액션 버전 v4 → v7 (260809-8a8826 · 회차 1)

| | 실행 | 커밋 |
| --- | --- | --- |
| 이전 (v4) | [31298800217](https://github.com/loveqoo/fun-fp-js/actions/runs/31298800217) | `54c2ea7` |
| 이번 (v7) | [31299246643](https://github.com/loveqoo/fun-fp-js/actions/runs/31299246643) | `a6cf629` |

## 완료 조건 대조 — 6개 전부 충족

| # | 조건 | 확인 방법 | 결과 |
| --- | --- | --- | --- |
| 1 | breaking change 조사·기록 | 릴리스 노트 v5/v6/v7 직접 조회 | `.dev/plan/260809-8a8826-1-action-bump.md` ✅ |
| 2 | 최신 메이저 사용 | `grep uses: .github/workflows/ci.yml` | `checkout@v7`, `setup-node@v7` ✅ |
| 3 | actionlint 통과 | docker `rhysd/actionlint` | exit 0, 출력 없음 ✅ |
| 4 | Node 20/22 두 잡 success | `gh run view --json jobs` | `verify (20)` `verify (22)` 둘 다 success ✅ |
| 5 | deprecated 주석 소멸 | 아래 | **6건 → 0건** ✅ |
| 6 | 테스트 38 + 예제 108 + 빌드 | `gh run view --log` grep | 동일 ✅ |

## 조건 5 — 이 작업의 존재 이유

**로그 전체의 `is deprecated` 문자열 개수**

```
직전 실행 (v4): 6건
이번 실행 (v7): 0건
```

**GitHub annotations API**

```
check-run 93209247918 (verify 22): 0
check-run 93209247954 (verify 20): 0
```

`gh run view` 출력에서도 ANNOTATIONS 섹션 자체가 사라졌다.

## 조건 6 — 동작 회귀 없음

```
test files : 38 passed, 0 failed
총 108개 예제 실행, 7개 스킵
typecheck  : passed
Build complete: 2회 (양쪽 잡)
```

v4 실행과 **숫자가 완전히 동일하다.** 액션 메이저를 셋 건너뛰었지만 워크플로 동작에
회귀가 없다. 소요 시간도 비슷하다 (`verify (22)` 38초→41초, `verify (20)` 1분0초→1분4초).

## 조사한 breaking change 와 실제 영향

| 액션 | 버전 | 변경 | 실제 영향 |
| --- | --- | --- | --- |
| checkout | v5 | Node 24 런타임, 러너 ≥ v2.327.1 | 없음 (호스티드 러너 충족 — 실행으로 확인) |
| checkout | v6 | 자격증명 별도 파일 | 없음 |
| checkout | v7 | `pull_request_target`/`workflow_run` 포크 PR 차단 | 없음 (우리는 `push`/`pull_request`) |
| setup-node | v5 | **BREAKING** `packageManager` 필드 있으면 자동 캐싱 | 없음 (필드 없음 + `cache: npm` 명시) |
| setup-node | v6 | **BREAKING** 자동 캐싱 npm 한정 | 없음 (npm 사용) |
| setup-node | v7 | ESM 전환, 캐시 키 출력 추가 | 없음 |

조사에서 "영향 없음" 으로 판단한 것이 **실행에서도 그대로였다.** 특히 setup-node v5 의
자동 캐싱은 `package.json` 에 `packageManager` 가 없다는 사실에 의존한 판단이었는데,
캐시 관련 실패 없이 통과했다.

## 로컬 사전 검증의 한계

액션은 러너에서만 돌기 때문에 **docker 로 재현할 수 없다.** 직전 작업에서 로컬 docker
재현이 실제 러너와 숫자까지 일치했지만, 그것은 `npm ci`/`npm test`/빌드 같은 **스텝 내용**에
대한 것이지 액션 자체는 아니다. 액션 버전 변경은 actionlint(스키마)로 걸러내고 실제 CI 로
확인하는 수밖에 없다 — 이번에도 그렇게 했다.
