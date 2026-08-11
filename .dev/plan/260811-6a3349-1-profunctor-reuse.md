# optics 의 dimap 중복 제거 + 근거 기록

## Context

사용자 지적: "내부에 Profunctor가 있는데 왜 활용을 하지 않았어?"

확인 결과 **재사용할 수 있었는데 확인조차 하지 않았다.** `Traversable` 은 재사용해놓고
(`traversed`) `Profunctor` 는 존재 여부도 안 봤고, 계획서에 "왜 안 쓰는가" 가 한 줄도 없다.

## 사실관계 (실측)

| | 기존 `Profunctor` | |
| --- | --- | --- |
| `dimap` (함수) | `promap(f, g, fn)` — **시그니처 동일** | ✅ 위임 가능 |
| `dimap` (Forget) | Forget 은 함수 `a -> r` 이라 통과 | ✅ 위임 가능 |
| `dimap` (Tagged) | Tagged 는 **값** → strict 검사 실패 | ❌ `all arguments must be functions` |
| `first`/`left`/`wander` | `Strong`/`Choice`/`Wander` 가 **라이브러리에 없음**(각 0건) | ❌ |

## 결정 — 부분 재사용

`dimap` 중복만 제거하고 `Strong`/`Choice`/`Wander` 는 타입 클래스로 올리지 않는다.
**근거는 검색으로 확인한 데이터다**(2026-08-11):

- **JS/TS 선례 만장일치 내부화** — `optika` 는 "Internals ... probably never need to use
  directly", `monocle-ts` 는 "only used internally"
- **노출해도 실제 확장 용도가 안 열린다** — indexed optics 는 `Indexed`/`StarI`/`ForgetI`
  같은 별도 계열 + `itraversed` 가 필요하다. 이 셋만으로는 불가능
- Haskell `well-typed/optics` 의 내부화 이유(**에러 메시지 품질**)는 타입 추론 문제라
  JS 에 해당 없음 — 우리 근거가 아니다

**중요**: 앞서 "실사용 시나리오가 없다" 고 한 판단은 **틀렸다.** indexed optics 와
"실패 이유를 돌려주는 Prism" 은 실재하는 용도다. 결론이 같아도 근거가 달라졌다.

## 변경 사항

### `index.js`

```js
const _promap = Profunctor.of('function').promap;
const _PFn = { dimap: _promap, ... };
const _PForget = monoid => ({ dimap: (f, _g, p) => _promap(f, x => x, p), ... });
const _PTagged = { dimap: (_f, g, p) => g(p), ... };   // 위임 불가 — 이유를 주석으로
```

`_PForget` 은 출력 변환을 버리므로 `g` 자리에 항등을 넣는다.

### `CLAUDE.md` — (Context 단계에서 완료)

"왜 Strong/Choice/Wander 를 타입 클래스로 올리지 않았는가" 절 추가. 위 근거와
**바꿔야 할 상황**(사용자가 커스텀 profunctor 등록을 실제로 요구할 때)까지 적었다.

## Verification

1. **조건 4 가 핵심** — 기존 optics 테스트 59개가 하나도 안 바뀌고 통과해야 한다.
   내부 리팩터링이므로 동작이 달라지면 안 된다
2. `npm test` + `tsc --noEmit` + 문서 예제
3. **구현 깨뜨리기** — `_PForget.dimap` 의 항등 자리에 다른 함수를 넣으면 잡히는가
4. CI Node 20/22

## 되돌리는 법

`index.js` 의 딕셔너리 3개만 건드린다. 커밋 하나를 revert 하면 끝.

## 범위 밖

- `Strong`/`Choice`/`Wander` 타입 클래스 추가 — 위 근거로 하지 않는다
- indexed optics
