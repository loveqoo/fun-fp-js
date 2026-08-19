# 코덱스 6차 — `index.js` 무조건 적대 감사 (2026-08-19)

**지시** — 소유자: "index.js 만 아무런 조건 없이 코덱스 리뷰 받읍시다." 범위 제한 없음.
기준 커밋 `c20371a` + 이 세션의 미커밋 변경(주석 B안). 코덱스는 파일을 수정하지 않았다.

**번호는 코덱스 것 그대로다.** 아래 「주 에이전트 재현」은 전부 이 세션에서 직접 돌린 것이고,
재현 못 한 것은 그렇게 적었다.

## 판정 요약

| # | 코덱스 판정 | 주 에이전트 재현 | 성격 |
| --- | --- | --- | --- |
| 1 | correctness 높음 | **재현됨** | 새 결함 — `Optics.prop('__proto__')` 가 프로토타입을 바꾼다 |
| 2 | correctness 높음 | **재현됨**(코덱스 재현으로만) | 새 결함 — Actor 통지 순서 역전 |
| 11 | correctness 중간 | **재현됨** | 새 결함 — 통지 중 자기 해지하면 다음 구독자 유실 |
| 5 | correctness 중간이상 | **재현됨** | 새 결함 — `new fp.Maybe()` 가 Just 도 Nothing 도 아니다 |
| 4 | spec 높음 | **재현됨** | 새 결함 — `default` Ord 와 Setoid 가 어긋난다 |
| 8 | performance 높음 | **재현됨**(16000에서 37.8배) | 성능 — Array `chainRec` 큐가 제곱 |
| 9 | performance 높음 | **재현됨**(16000에서 120ms, 6.6배) | 성능 — Array `traverse` 가 제곱 |
| 10 | contract 중간 | **재현됨** | 계약 불일치 — 러너 셋의 비-Free 입력 처우가 다르다 |
| 12 | robustness 중간 | **재현됨** | 견고성 — `range` 가 정수·유한을 안 본다 |
| 3 | spec 높음 | **재현됨** | 사실이나 고칠 수 없다 — #7 과 같은 성격, **다만 문서에 없다** |
| 6 | spec 중간이상 | 문서 확인 | **이미 결정** — `internals.md#number-nan` |
| 7 | spec 중간이상 | 문서 확인 | **이미 결정** — `internals.md#product-group`(소유자 2026-08-13) |
| 13 | spec 중간 | 문서 확인 | **이미 결정** — `internals.md#array-comonad` |

무조건 감사라 이미 결정된 한계 셋(6·7·13)이 다시 올라왔다. 오탐이 아니라 지시대로다.

## 재현 기록

**[1] `Optics.prop('__proto__')`** — `Optics.set(prop('__proto__'), { hacked: 1 }, { a: 1 })`
의 own 키는 `["a"]` 인데 `Object.getPrototypeOf(결과) !== Object.prototype` 이 `true` 이고
`결과.hacked` 가 `1` 이다. **데이터가 아니라 프로토타입이 바뀐다.**
4차-1(객체 그릇 `into` 의 `__proto__` 쌍)과 **같은 병이고 같은 수법(`defineProperty`)으로
고칠 수 있다.** `prop` 은 그 수리 뒤에 들어온 문(사용-1)이라 같은 가드를 못 받았다.

**[2] Actor 통지 순서 역전** — 첫 메시지를 미정착 Promise 로 붙잡고 둘째를 동기로 처리하면
`{"events":[["two",2],["one",1]],"state":2}`. 상태는 FIFO 로 이어지는데(1→2) **관찰자가 받는
순서만 뒤집힌다.** 주 에이전트의 자체 재현 둘(비동기 지연 차이, 구독자 재진입)로는 **안 걸렸다**
— 첫 메시지를 미정착으로 붙잡는 것이 조건이다.

**[11] 통지 중 자기 해지** — 구독자 A 가 콜백 안에서 자기 `off()` 를 부르면 구독자 B 가
그 이벤트를 못 받는다(`["A:x"]`). 순회 중 배열을 직접 줄여 다음 자리를 건너뛴다.

**[5] 공개 클래스 직접 생성** — `new fp.Maybe()` 가 `Maybe.isMaybe` 를 **통과**하는데
`isJust()` 도 `isNothing()` 도 `false` 다. 합 타입의 폐쇄성이 깨진다.
2026-08-15 의 "`_typeName` 베낀 객체는 의도된 한계" 판정과는 **다른 자리다** — 그쪽은 외부
위조이고 이쪽은 **라이브러리가 내보낸 이름**이 만들어 낸다.

**[4] `default` Ord 대 Setoid** — `x={p:1}`, `y={p:1}` 에 대해 `Ord.lookup('default').lte`
가 양방향 `true`(둘 다 `"[object Object]"` 로 강제 변환), `Setoid.lookup('default').equals`
는 `false`. 정렬상 동등과 Setoid 동등이 어긋난다.

**[8] Array `chainRec`** — 매 단계 `[next(i+1), done(i)]` 를 내는 모양(계속 하나 + 결과 하나)
에서 큐가 자라고 `unshift` 가 그 길이만큼 옮긴다. n=2000→4000→8000→16000 에서
0.9ms → 1.9ms(2.1배) → 3.1ms(1.6배) → **116.0ms(37.8배)**.

**[9] Array `traverse`** — n=2000→4000→8000→16000 에서 2.8ms → 5.9ms(2.1배) →
18.2ms(3.1배) → **120.4ms(6.6배)**. n 이 2배일 때 시간이 2배를 넘어간다.

**[10] 러너 셋의 비-Free 입력** — `Free.runSync(runner)(123)` → `123`,
`Free.runAsync(runner)(123)` → `123`, `Free.runWithTask(runner)(123)` → 거부
(`runWithTask: unknown Free type`). 셋 중 하나만 설정 오류를 드러낸다.

**[12] `range`** — `range(NaN)` → `[]`, `range(1.5)` → `[0]`, `range('3')` → `[0,1,2]`,
`range(Infinity)` → `RangeError`. 같은 계열의 잘못된 입력이 네 가지로 갈린다.

**[3] number 합 결합법칙** — `Semigroup.lookup('number')` 에서
`concat(concat(0.1,0.2),0.3)` = `0.6000000000000001`, `concat(0.1,concat(0.2,0.3))` = `0.6`.
**고칠 수 없는 사실**이고 성격은 #7(곱셈군)과 같다. 차이는 하나 — #7 은 문서(`#product-group`)와
법칙 게이트의 `SAMPLE_OVERRIDES` 에 근거가 적혀 있는데 **합 쪽은 둘 다 없다.** 게이트가 초록인
것은 표본이 우연히 안전해서다(`SAMPLE_OVERRIDES` 에 `NumberProductGroup` 하나뿐 — 실측).

## 소유자 결정이 필요한 것

`index.js` 수정은 소유자 동의 후에만 한다(규율). 아래는 선택지이지 계획이 아니다.

- **국소 수리 후보 4건** — [1] `defineProperty` 로(4차-1 선례 그대로) · [11] 구독자 배열
  복사 후 순회 · [10] 러너 셋의 입력 검증 통일 · [12] `range` 입력 검증.
- **설계 판단이 필요한 것 3건** — [2] 통지 순서를 계약으로 정할 것인가 · [5] 공개 클래스의
  직접 생성을 막을 것인가(표면 변경) · [4] `default` Ord 의 범위를 좁힐 것인가.
- **성능 2건** — [8] 큐를 인덱스 커서로 · [9] 누적을 매 단계 펼치지 않기. 둘 다 내부 교체라
  전후 대조가 필요하다.
- **문서만** — [3] 합 Semigroup 의 부동소수 경고를 `#product-group` 옆에 두고,
  `SAMPLE_OVERRIDES` 에 근거를 남길지.
