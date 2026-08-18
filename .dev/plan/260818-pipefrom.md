# 계획 — 동명 `into` 정리: 최상위를 `pipeFrom` 으로

## Context

`fp.into`(뒤집힌 pipe, 문서 0건·자기 테스트 1건)와 `fp.transducer.into`(Clojure 정전
이름·의미, 소유자 결정 2026-08-17)가 이름만 같고 하는 일이 다르다. 이름으로 찾는
사용자가 절반은 엉뚱한 것을 잡는다. 소유자 결정(2026-08-18): **A안 — 최상위를
`pipeFrom` 으로 개명**(pipe 가족 합류: `pipe(f,g)(5)` ↔ `pipeFrom(5)(f,g)`).
transducer 쪽은 계보 이름이므로 불변. 짝 `also` 는 충돌 없음 — 불변. 삭제는 안
한다(YAGNI 로 지운 11개를 되살린 저장소 이력).

## 바꾸는 자리 (전수 수색 완료)

- `index.js:146` `const into` → `const pipeFrom`, `:3685` export 목록.
  (`:2609` 의 into 는 transducer 내부 — 불변.)
- `tests/func.test.js` 단위 테스트 1블록.
- `types/utilities.d.ts` 선언·주석 2곳, `types/index.d.ts` 2곳.
- `CHANGELOG.md` 파괴적 변경 절 — 개명 사유(동명 해소)와 마이그레이션 한 줄.
- baseline 기대: 최상위 export 키 **into 제거 + pipeFrom 추가** — 이 세션 첫 의도적
  제거. 그 외 차이 0.
- dist 재빌드. TODO 기록.

## 검증

이름 검증은 게이트가 이미 한다 — d.ts 는 타입체크가, export 는 baseline 이, 동작은
기존 단위 테스트(개명만)가 잡는다. 뮤테이션 불요(동작 무변경·기계적 치환, count==1
단언으로 심는다). 전체 npm test + baseline + dist-sync.
