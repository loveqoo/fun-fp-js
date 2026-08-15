# 코덱스 적대적 리뷰 3차 — index.js 포괄 (2026-08-16)

소유자 지시: 영역 특정 없이 파일 전체. 코덱스가 7건 보고(Critical 0 · Major 5 · Minor 2),
전부 CONFIRMED. **주 에이전트가 일곱 재현을 독립으로 다시 돌려 확인했다.**

**그러나 이번은 「모두 수리」가 자명하지 않다.** 지난 두 회차(11건)는 전부 "조용히 틀리거나
멈추는" 명백한 버그였다. 이번 일곱은 **셋으로 갈린다** — 깨끗한 버그 2, 퇴화값 한계 3(0에서의
곱셈군과 같은 「문서화」 부류), 설계 결정 2. 아래는 주 에이전트의 판정이다.

## A. 깨끗한 버그 — 고치는 게 맞다 (2건)

### 6. `Setoid.Struct` 가 상속 필드를 own 으로 인정 (Minor)
- `index.js:1786` 이 필드 존재를 `n in a` 로 본다 — 프로토타입 사슬까지 본다.
- 실측: `Object.create({a:1})` 를 `Struct({a:'number'})` 로 비교하면 own 이 아닌데 `true`.
- **바로 앞 회차에서 고친 `extra.path` ④와 같은 병.** `hasOwnProperty` 로 좁히면 된다. 저위험.

### 7. `once` 가 재진입 시 두 번 실행 (Minor)
- `index.js:147` 이 `called = true` 를 f 반환 **뒤에** 세운다. f 안에서 자기를 다시 부르면
  또 실행된다(실측 calls=2). "최대 한 번" 계약 위반.
- `called = true` 를 호출 **전에** 세우면 된다(재진입은 아직 안 정해진 result=undefined 반환).

## B. 퇴화값의 한계 — 0에서의 곱셈군과 같은 부류 (3건, 소유자 판정 필요)

선례: `NumberProductGroup` 이 0·부동소수점에서 군 법칙을 깨는 것을 **고치지 않고 문서화**했다
(소유자, 2026-08-13). 아래 셋은 같은 성격 — 값이 퇴화라 고칠 수 있는 결함이 아니라 알릴 사실.

### 3. Number Setoid/Ord 가 `NaN` 에서 반사성 위반
- `equals(NaN,NaN)=false`(`Setoid.op` 이 `a===b`). Setoid 법칙은 `equals(a,a)=true` 를 요구.
- **`Object.is` 로 바꾸면 반사성은 사나, `-0===0` 이 `Object.is(-0,0)=false` 로 갈려 다른
  동작이 바뀐다** — 깨끗한 수리가 아니다. 그리고 `Ord.lte(NaN,·)` 는 NaN 이 순서 밖이라
  애초에 못 고친다. → 문서화가 맞다.

### 4. `NumberSumGroup` 이 `Infinity` 에서 역원 위반
- `Inf + (-Inf) = NaN ≠ 0`(empty). 곱셈군 0과 정확히 같은 부류. 코덱스도 "문서 미기재"로만 지적.

### 5. `Array` Comonad 가 빈 배열에서 extract 불가
- `extract([]) = undefined`. **Array 는 법칙상 Comonad 가 아니다 — NonEmptyArray 만 그렇다.**
  법칙 게이트도 이미 빈 배열을 표본에서 걸러낸다(`staticland-laws.test.js:724`). 알려진 한계.
  선택: 문서화 / `extract([])` 를 던지게(더 정직하지만 표면 변화).

## C. 설계 결정 — 소유자만 정할 수 있다 (2건)

### 1. custom Monoid `Writer` 가 등록 Monad/Applicative 법칙을 못 지킨다 (Major)
- `Monad.lookup('writer').of` 는 **항상 array monoid** 다(`Writer.of` 의 기본값). 그래서 number
  monoid Writer 에 `chain(of, w)`·`ap(of(id), w)` 를 걸면 — **직전 회차에서 내가 넣은 "다른
  모노이드 거부"(③)에 걸려** throw 한다.
- 즉 등록된 Writer 인스턴스는 **array monoid 전용**이고, custom monoid Writer 는 사실상 다른
  모나드다(Const 가 monoid 마다 다른 Applicative 인 것과 같다).
- **내 수리 ③이 이 사실을 드러냈다** — 전에는 조용히 array 로 섞였고, 지금은 throw 로 보인다.
  선택: (가) 등록 Writer 를 "array monoid 전용"으로 문서화 (나) Writer 를 Const 처럼 monoid
  받는 팩토리로 (다) `of` 가 값의 monoid 를 잇도록 재설계. (나)/(다)는 공개 표면 변화.

### 2. 등록 안 된 custom Monoid 의 `Const` 가 tag 를 공유해 섞인다 (Major)
- 키 없는 custom monoid 로 만든 Const 는 전부 `_typeName='Const'`(`index.js:1222`). 그래서 합
  monoid Const 가 곱 monoid Const 의 캐리어를 받아들여 조용히 섞인다(실측 A=5, B=6).
- **좁은 경로** — 손으로 만든 미등록 monoid 에 한정(등록 키가 있으면 `Const(<키>)` 로 갈린다).
  Forget 의 익명 tag 와 같은 모양. `_typeName` 문자열 위조가 "의도된 한계"로 판정된 것
  ([[algebra-type 범위]])과 같은 결. 선택: 문서화 / 익명 monoid 에 인스턴스별 고유 id
  (트랜스포머 M1/M2 방식) 부여.

## 깨끗 확인 (코덱스가 훑고 무결)
Maybe/Either/Task 정상 법칙, Validation 동일-monoid 누적, Reader/State, 4종 트랜스포머
정상·단락, Free 후속 runner(직전 수리됨), Optics 표준 합성, Actor 비동기 격리(직전 수리됨),
transducer 선검증(직전 수리됨), 컨테이너 팩토리 키 이스케이프(직전 수리됨), 별칭 겹침 가드.

원문: 코덱스 세션(3차). 재현은 전부 `.dev/review` 이 아니라 실행으로 받았다.

---

**적용 (2026-08-16, 소유자 결정)** — 권고대로 A 수리, B 문서화, C1 팩토리, C2 카운터.
- **A** — #6 Struct `n in a`→`hasOwnProperty`, #7 once `called=true` 를 f 실행 앞으로.
  뮤테이션 2종 잡힘.
- **B** — #3 NaN·#4 Infinity·#5 빈 배열 Comonad 를 `docs/internals.md` 에 실행되는 예제로
  (`#number-nan`·product-group 절 확장·`#array-comonad`). 틀리면 던진다.
- **C1** — `Applicative.Writer(m)`·`Monad.Writer(m)` 팩토리 신설(Const 구조). monoid 에
  의존하는 건 of 뿐이라 map/ap/chain 은 등록 인스턴스를 빌린다. 등록 array writer 불변.
  number monoid 세 모나드 법칙 성립(전엔 throw). 키면 `writer(<키>)` 5층 등록·캐시.
  타입 선언·`docs/Writer.md`·뮤테이션(of 를 array 로 되돌림 → 잡힘).
- **C2** — `Const`·`Forget` 의 키 없는 monoid 에 카운터 고유 태그(`Const(#N)`·`Forget(#N)`).
  트랜스포머 `_transformerAutoId` 와 같은 수법. WeakMap 캐시라 monoid 당 한 번 생성 → 안정.
  Forget 이 같은 병을 가졌음을 실측 확인해 함께 고쳤다. 뮤테이션 2종(둘 다 벌거벗은 태그로
  되돌림) 잡힘.
- **검증** — `npm test` 45/45 + 타입체크 + docs 예제 433개. `baseline` 차이 1건 = 정적 표면에
  `Applicative.Writer`·`Monad.Writer` **추가**뿐, 없어진 것 0. dist 재빌드. 유효 경로 실측:
  Const 자기 캐리어=5, Writer 누적=8, 등록 writer=[1,[]] 불변.
