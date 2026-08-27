# Store 코모나드 — State 의 쌍대를 들여온다

- **날짜** 2026-08-27
- **상태** ✅ 구현 완료. 검증은 [`../TODO.md`](../TODO.md) 닫힘 항목에.
- **발단** 소유자 관찰 「우리 프로젝트에 Store가 없더라?」(2026-08-25). 조사 결과 모나드
  셋(Reader·Writer·State)의 쌍대 코모나드가 전무했고, Life Is A Comonad 글의 글라이더를
  스크래치패드에서 재현(5세대 동작)한 뒤 소유자가 구현을 결정했다(2026-08-27).

## 범위 결정

**Store 하나만.** Env·Traced 제외 — fp-ts 도 161개 모듈 중 Env 는 싣지 않았고, Traced 는
독립 사용 사례를 찾지 못했다. Store 는 선례 셋(Haskell `Control.Comonad.Store`,
cats `RepresentableStore`, fp-ts `Store.ts`)과 대표 사례(셀룰러 오토마타·렌즈 인코딩)가 있다.

## 소유자 설계 결정 (2026-08-27, AskUserQuestion 3건)

| 갈림 | 결정 | 기각한 대안 |
| --- | --- | --- |
| API 범위 | **핵심 + experiment** — extract/extend/map + peek/seek/experiment | Haskell 전체(peeks/seeks 는 seek+함수로 합성 가능, YAGNI 경계) / 최소만(experiment 없으면 실용 예제를 못 보여줌) |
| 지수 폭발 대응 | **옵트인 `Store.memo(store, keyOf)`** | extend 내장(숨은 상태 + 키 직렬화 강제) / 안 넣음(사용자가 매번 직접) |
| 문서 | **전용 docs/Store.md + 영어판 + internals 성능 절** | internals 절만(데이터 타입 관례 이탈) |

## 무엇을 만들었나

- `index.js` `/* Store */` 구역(State 구역 뒤): 캐리어 `Store(lookup, index)` + 문 여섯 +
  `isStore`/`memo`, 인스턴스 셋 `StoreFunctor`/`StoreExtend`/`StoreComonad`(`store` 키).
  `Symbols.Store` 신설, export 목록에 `Store`.
- 게이트: `staticland-laws` 에 `FUNCTOR_SAMPLES.Store`(**index 가 서로 다른** 표본)·
  `OBSERVE.Store`(**index 포함** + 위치 4곳 조회)·Extend/Comonad 법칙의 여는 함수에 Store 분기.
  잠금 13→14, 105→107, `algebra-type` 152→155 + `BY_PREFIX`/`SAMPLE` 에 Store.
- 신설 `tests/store.test.js`: 문 여섯 + memo 관측 동등/호출 감소 + 글라이더 1세대 고정.
- `types/data/Store.d.ts` 신설 + `types/index.d.ts` 3곳 + `build-types.js` 명단.
- `docs/Store.md`·`docs/en/Store.md`(예제 5+1 실행·값 대조), `docs/internals.md#store-perf`
  한·영, `docs/README.md` 색인 2곳, `CHANGELOG.md`.

## 예측이 맞았던 것 / 어긋난 것

- **맞음** — 뮤테이션 ①(extend 초점 고정)은 Extend 결합법칙이 원리상 못 잡는다(실측: 결합
  초록, 좌항등만 빨강). 함수 모나드의 chain 환경 뒤바꾸기와 동형. OBSERVE 가 여러 위치를
  봐서 좌항등이 잡았다.
- **어긋남(무해)** — ②(extract 가 위치 0 고정)는 우항등이 잡을 것으로 예측했는데 실측은
  좌항등이 잡았다. 잡히는 것이 완료조건이므로 항목은 닫힌다.
- **계획에 없던 걸림 둘** — `algebra-type` 의 ①②(정규 태그·접두사 표)와 `build-types.js`
  명단. 함수 모나드 때는 새 최상위 이름이 없어서 안 걸렸던 게이트들이다. 다음에 데이터
  타입을 추가하면 이 두 곳도 명단에 넣어라.

## 코덱스 적대 리뷰가 잡은 것 (2026-08-27, 구현 직후)

`Store.memo` 의 기본 키(`JSON.stringify`)가 `NaN`/`null` 을 합쳐 조회 순서 의존 결과를
냈다 — 문서의 "관측은 그대로" 보증이 일반 `S` 에 대해 거짓이었고, 게이트(숫자 위치만)는
블라인드였다. 소유자 결정으로 **기본값을 없애고 키 생성을 위임**했다(`keyOf` 필수).
근거: 어떤 기본 키도 어딘가에서 틀린다 — stringify 는 원시값에서 합치고, 항등은 객체
위치에서 캐시를 무력화한다. 교훈: **"관측은 그대로" 같은 보증은 위임 경계까지 함께
적어야 한다** — 경계 없는 보증이 코덱스가 무너뜨린 그 문장이다.
