검색 키: `Optics 모듈` `bare export 제거` `foldMapOf` `네이밍 관례` `optics 소문자` `거짓 회귀` `baseline shim` `백그라운드 리뷰어` `scratchpad` `loop_prefix` `docs_readonly` `ls` `protected_bash`

# optics 모듈화 회고 — 네이밍은 세 번 걸렸고 셋 다 내가 못 잡았다

작업 `260812-d36358`. 최상위 bare export 11개를 `Optics` 모듈 하나로 묶고 `foldMapOf` 를 냈다.

## 무엇이 통했나

### 파급이 200곳이 아니라 39줄이었다 — 먼저 세어봐서 알았다

Context 에서 사용 패턴을 세었다:

```
구조분해로 가져오는 블록: 38   ← const { Lens, view } = FunFP;  를 = FunFP.Optics; 로
프리앰블에 의존하는 블록 :  1
```

호출 200여 곳이 아니라 **구조분해 39줄**이었다. 세지 않았으면 "너무 크다" 고 판단해
또 미뤘을 것이다 — **여섯 회차 동안 미뤄온 항목이다.**

### 백그라운드 리뷰어 (규칙 21 의 첫 적용)

앞 작업에서 리뷰어를 블로킹으로 불러 세 회차 121분을 대화 없이 흘렸고, 사용자가 48분째에
강제 종료했다. 이번엔 `run_in_background: true` 로 돌리고 그동안 완료 조건 대조와
`CLAUDE.md` 정리를 했다. **대화가 막히지 않았다.**

### 청구서를 다 갚았다

`CLAUDE.md` 「폐기된 판단」이 YAGNI 의 대가로 적어둔 것:

| 청구서 | 상태 |
| --- | --- |
| 사설 Monoid 3개 | ✅ 레지스트리로 (앞 작업 회차 1~3) |
| 사설 Applicative 2개 | ✅ `Applicative.of('identity')` / `Applicative.Const(monoid)` (회차 6) |
| 최상위 bare export 11개 | ✅ **이번 작업** |
| Strong/Choice/Wander | ❌ 남음 |

## 무엇을 잘못 가정했나

### 1. 네이밍 — 세 번 걸렸고 **셋 다 사용자가 잡았다**

| 사건 | 무엇이 어긋났나 |
| --- | --- |
| `_PFn`/`_PForget`/`_runOptic` … 10개 | optics 에만 언더스코어 + 약자. 나머지 2900줄엔 없다 |
| `maybe-first` | 기존 키는 `maybe(first)`·`statet(maybe)` 로 **괄호 형식** — 하이픈은 조립 불가 |
| **`optics` (소문자)** | 안에 `Lens`/`Prism`/`Iso` 생성자가 주인공이라 `Optics` 가 맞았다 |

세 번째는 이렇게 결정했다 — `transducer`·`extra` 가 소문자니 그걸 따랐다. **그런데
`transducer` 의 `Reduced` 는 내부 표식이고 `Optics` 의 `Lens`/`Prism`/`Iso` 는 주인공이다.**
같은 형태(모듈 객체)라도 성격이 다른데 형태만 보고 골랐다.

**한 번도 관례를 실행으로 조회하지 않았다.** 사용자가 물은 뒤에야
`Object.keys(fp).filter(k => k[0] === k[0].toUpperCase())` 를 돌렸고, 그때 대문자 38개가
전부 타입이라는 것을 처음 봤다.

### 2. 내가 만든 검증 도구가 **없는 차이를 만들어냈다**

격자를 이름 변경에 맞추며 정규화 shim 을 넣었다:

```javascript
const compose = o.compose ?? o.composeOptic;   // HEAD 에는 f.compose(범용 합성)가 있다
```

`??` 가 optic 합성 대신 **범용 함수 합성**을 골라 거짓 회귀 3건이 떴다
(`P.first is not a function` 등). 잠깐 회귀인 줄 알았다.

**회차 3의 교훈("차이를 숨기는 도구는 없는 것보다 나쁘다")의 반대 방향이다.**
도구가 틀리는 방향은 두 가지인데 한쪽만 규칙으로 갖고 있었다.

### 3. 타입 테스트가 어디까지 퍼져 있는지 안 봤다

`types/Lens.d.ts` 만 고치면 될 줄 알았는데 `types/index.d.ts`,
`DefaultExport.test-d.ts`, `NegativeTests.test-d.ts` 가 줄줄이 깨졌다. **`tsc` 가 잡아줘서
드러났다** — 이건 게이트가 제대로 작동한 경우다.

## 이 회차를 싸게 만들었을 것

### ① 이름을 정하는 순간 관례를 조회했어야 했다

명령 네 줄이면 됐다. 세 번 다 안 했다.

```
Object.keys(fp).filter(k => k[0] === k[0].toUpperCase())
Object.keys(fp).filter(k => typeof fp[k] === 'object')
Object.keys(Monoid.types)
grep -n "^const _" index.js
```

### ② 격자가 빨개졌을 때 코드가 아니라 격자를 먼저 의심했어야 했다

shim 을 넣은 **직후**에 3건이 새로 떴다. 코드는 안 건드렸는데 차이가 늘었으면
도구가 바뀐 것이다.

## 승격 결정

`harness promote` → 0개.

**이번엔 산문으로 끝내지 않았다** — 사용자가 "재발 방지대책도 수립하십시오" 라고 했다.

| 층 | 무엇 |
| --- | --- |
| **`staticland-reviewer` 판정 기준** | **유형 6(네이밍 관례) · 유형 7(주석이 이름의 짐을 진다) 추가.** 새 이름이 하나라도 있으면 리뷰어가 위 네 명령으로 관례를 조회해 대조한다 |
| `.dev/learning/INDEX.md` | 규칙 22(관례를 실행으로 조회) · 23(도구는 없는 차이도 만든다) |

**리뷰어에 넣은 것이 핵심이다.** 산문 규칙은 세 번 다 못 막았다 — 규칙 2·18·19가 이미
있었는데도 걸렸다. 리뷰어는 매번 실제로 조회한다.

## 완료 조건

| # | 판정 |
| --- | --- |
| 1~5, 7 | ✅ bare export 0 · `Optics` 12키 · `foldMapOf` 테스트 6건 · `foldMap` 충돌 없음 · `tsc` · baseline 11↓1↑ |
| 6 | ✅ `docs/` 3파일 + `CLAUDE.md` 6곳. 문서 예제 **371개 전부 통과** |
| 8 | ⏳ 리뷰어 백그라운드 실행 중 — 결과는 `.dev/review/` 에 남긴다 |

**커밋은 하지 않았다.**
