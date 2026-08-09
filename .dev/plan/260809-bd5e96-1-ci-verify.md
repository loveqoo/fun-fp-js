# CI 첫 실행 검증

## Context

`origin/main` push 가 성공했다 (`fa76f7b..91436e1`). PAT 에 Workflows 권한이 추가되면서
직전 작업에서 막혔던 조건이 풀렸다.

**이번이 GitHub Actions 에서 CI 가 실행되는 첫 순간이다.** 지금까지의 CI 검증은 전부
로컬 docker(`node:20` / `node:22`) 재현이었다. 재현이 아무리 충실해도 실제 러너와 다른
지점이 있을 수 있다 — `actions/setup-node` 의 npm 캐시, 러너 이미지의 기본 도구, 권한.

## 할 일

관찰이 전부다. 새로 만들 것은 없다.

1. `gh run watch` 로 실행을 지켜본다
2. Node 20 / Node 22 두 잡의 결과를 확인한다
3. 로그에서 실제 숫자를 확인한다 — 테스트 파일 38개, 문서 예제 108개, 빌드 성공
4. **실패하면** 로컬 docker 재현과 무엇이 달랐는지 찾아 고친다.
   유력 후보: npm 캐시 키, 러너의 Node 패치 버전, `npm ci` 의 락 해석

## Verification

완료 조건 5개를 `gh` 출력으로 대조한다. 로그의 숫자를 눈으로 훑지 말고
`gh run view --log` 에서 grep 한다.

## 되돌리는 법

CI 가 깨져도 코드는 이미 main 에 있다. 워크플로만 고쳐 추가 커밋하면 된다.
이전 `main` SHA 는 `fa76f7b`.
