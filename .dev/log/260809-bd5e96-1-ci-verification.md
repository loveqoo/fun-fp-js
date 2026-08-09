# 검증 기록 — CI 첫 실행 (260809-bd5e96 · 회차 1)

대상: GitHub Actions run [31298800217](https://github.com/loveqoo/fun-fp-js/actions/runs/31298800217)
커밋: `fa76f7b..91436e1` (main)

## 완료 조건 대조 — 5개 전부 충족

| # | 조건 | 확인 방법 | 결과 |
| --- | --- | --- | --- |
| 1 | `origin/main` push 완료 | `git rev-list --count origin/main..main` | `0` ✅ |
| 2 | CI 워크플로 실행됨 | `gh run list --json` | run 31298800217, event=push, status=completed, conclusion=success ✅ |
| 3 | Node 20/22 두 잡 success | `gh run view --json jobs` | `verify (20): success` / `verify (22): success` ✅ |
| 4 | 테스트 38개 + 문서 예제 108개 | `gh run view --log` grep | 아래 ✅ |
| 5 | 빌드 스텝 성공 | 같은 로그 grep | `Build complete` 2회 (양쪽 잡) ✅ |

## CI 로그의 실제 출력 (grep 결과, 두 잡 동일)

```
test files : 38 passed, 0 failed
총 108개 예제 실행, 7개 스킵
typecheck  : passed
✅ Built: /home/runner/work/fun-fp-js/fun-fp-js/dist/fun-fp.d.ts
```

`verify (22)` 38초 / `verify (20)` 1분 0초.

## 로컬 재현과의 대조

이번 작업의 핵심 질문은 **"로컬 docker 재현이 실제 러너를 대변했는가"** 였다.

| | 로컬 docker | GitHub 러너 |
| --- | --- | --- |
| 테스트 파일 | 38 passed, 0 failed | 38 passed, 0 failed |
| 문서 예제 | 108 실행, 7 스킵 | 108 실행, 7 스킵 |
| typecheck | passed | passed |
| 빌드 | 성공 | 성공 |

**숫자가 정확히 일치했다.** `node:20`/`node:22` 컨테이너 재현은 이 프로젝트 범위에서
실제 러너를 신뢰할 만하게 대변한다. `act` 없이도 CI 를 사전 검증할 수 있다는 근거가 된다.

## 미해결 — 즉시 조치 권고

CI 는 성공했지만 양쪽 잡에 deprecation 주석이 붙었다.

```
Node.js 20 is deprecated. The following actions target Node.js 20 but are being
forced to run on Node.js 24: actions/checkout@v4, actions/setup-node@v4
```

- 어제 작성한 워크플로가 **이미 deprecated 된 액션 버전**을 쓰고 있다
- 현재 최신: `actions/checkout` **v7.0.1**, `actions/setup-node` **v7.0.0**
- 지금은 러너가 강제로 Node 24 에서 돌려주지만, 호환 계층이 걷히면 CI 가 깨진다

**완료 조건에 없던 항목이라 이번 작업에서는 고치지 않았다.** v4 → v7 은 메이저를 셋
건너뛰므로 breaking change 확인이 먼저다. 별도 작업으로 다룬다.

**교훈**: 워크플로를 새로 쓸 때 액션 버전을 관성으로 고르지 마라(`@v4` 는 오래 관례였다).
`gh api repos/actions/<name>/releases/latest --jq .tag_name` 로 확인하는 데 1초 걸린다.
