# 리뷰 2회차 — 1회차 수정본 + 신설 게이트 둘

대상: `index.js` (작업 트리, **커밋 전**). 1회차 판정을 고친 결과와 그 과정에서 새로 만든 것.
리뷰어: [`staticland-reviewer`](../../.claude/agents/staticland-reviewer.md) · 실측 소요 **20분 26초**
판정: **위반 12건** — 그중 **6건이 신설 게이트를 통과하는 뮤테이션**

1회차보다 오래 걸린 이유는 프롬프트가 달랐기 때문이다. 1회차는 "이 목록을 확인해라" 였고
2회차는 **"내가 만든 게이트를 통과하면서 코드를 망가뜨리는 뮤테이션을 직접 찾아라"** 라는
열린 탐색이었다. 후보를 만들고·심고·42개 테스트를 돌리고·되돌리기를 반복해야 한다.

> 아래 「확인」은 **주 에이전트가 별도로 직접 재현한 것**이다. 특히 게이트 통과 뮤테이션은
> 전부 직접 심어 재현했다.

---

## 판정과 처리

| # | 무엇 | 확인 | 처리 |
| --- | --- | --- | --- |
| 1 | 가변 인자화가 **인자 개수 검증을 잃었다** — 팩토리가 인자 0개로 성공 | 실행 | ✅ 닫힘 |
| 2 | `Maybe.Ord()` 의 실패가 `Maybe.Setoid:` 라고 말함 | 실행 | ✅ 닫힘 (1번과 함께) |
| 3 | `default` 의 동종 제약이 격자·문서에 없음 | 실행 | ⬜ 열림 |
| 4 | **게이트 통과 뮤테이션 3건** — 참조 타입 짝 Setoid | 뮤테이션 | ✅ 닫힘 |
| 5 | **게이트 통과 뮤테이션 3건** — 새 코드에 테스트 0건 | 뮤테이션 | ✅ 닫힘 |
| 6 | `FunctionFunctor.map` 이 `compose2` 를 손으로 다시 씀 | 실행 | ⬜ 열림 |
| 7 | `Ord.Array`/`Maybe.Ord` 가 미등록 Setoid 사본을 만듦 | 실행 | ✅ **처방 기각**하고 닫음 |
| 8 | 부모 인스턴스 조회가 관례 68곳과 다름 | 집계 | ⬜ 열림 |
| 9 | 거짓 주석 — "뼈대가 **이미** 정해 두고 있다" | 소스 대조 | ⬜ 열림 |
| 10 | 죽은 앵커 `docs/internals.md#ord-setoid` | 실행 | ⬜ 열림 |
| 11 | 게이트 ③의 한계를 소스 주석이 과장 | 실행 | ⬜ 열림 |
| 12 | 새 `Setoid` 둘을 어떤 표본도 못 가름 | 실행 | ✅ 닫힘 |

---

## 1·2. 인자 개수 검증 상실 — 실제 회귀

1회차 2번을 고치며 뼈대를 `inner =>` 에서 `(...inners) =>` 로 넓혔는데, **빈 배열에
`.every()` 가 공허하게 참**이라는 것을 놓쳤다. `keyOf()` 가 인자 없이 불려 `undefined` 가
키에 박히고 `registerAs` 로 전역 레지스트리에 들어간다.

```
                        HEAD          변경 후
Maybe.Semigroup()    →  던짐          성공
Either.Semigroup()   →  던짐          성공
Maybe.Setoid()       →  던짐          성공
Setoid.Array()       →  던짐          성공
Either.Setoid()      →  던짐          성공
Either.Setoid('number')  →  던짐      성공   ← 둘 필요한데 하나만 줘도

오염된 키:
  Semigroup: maybe(undefined), either(undefined)
  Setoid   : maybe(undefined), array(undefined), either(undefined,undefined), either(number,undefined)
```

`registerAs` 는 주석이 "레지스트리에 쓰는 **유일한 문**" 이라고 선언한 자리인데 그 문으로
쓰레기가 들어갔다. `Either.Setoid('number')` 로 만든 것은 나중에 라이브러리 에러가 아니라
날것의 `Cannot read properties of undefined` 를 던진다.

**왜 세 번의 `baseline` 대조가 못 잡았나** — 격자에 **정상 호출만** 넣었다. "의도 밖 차이
0건" 이라는 보고는 스스로 고른 항목 안에서만 참이었다.
→ `learning/INDEX.md` 후보: **격자는 실패 경로도 담아야 한다.**

**처리**: 받을 개수를 **키를 만드는 함수의 인자 수**(`keyOf.length`)에서 끌어온다 — 따로
적으면 키 모양과 갈라지므로. 2번(엉뚱한 팩토리 이름)도 함께 해소됐다.

```
Maybe.Setoid()          -> "Maybe.Setoid: expects 1 inner argument, got 0"
Either.Setoid('number') -> "Either.Setoid: expects 2 inner arguments, got 1"
```

---

## 4·5. 게이트 통과 뮤테이션 6건 — 이 회차의 본체

**신설한 법칙 게이트가 정작 이 회차의 본체(짝 Setoid)를 못 지켰다.**

### 4 — 참조 타입 표본에 "다른 객체인데 동치인 쌍" 이 없었다

| 심은 것 | 결과 | 실제 파손 |
| --- | --- | --- |
| `DateOrd` 짝을 `default` 로 | 42/42 초록 | `Ord.lookup('date').equals(new Date(0), new Date(0))` → `false` |
| `Ord.Array` 짝을 `default` 로 | 42/42 초록 | `Ord.Array('number').equals([1,2],[1,2])` → `false` |
| `Maybe.Ord` 짝을 `default` 로 | 42/42 초록 | `Maybe.Ord('number').equals(Just(1),Just(1))` → `false` |

반대칭은 `lte(a,b) && lte(b,a)` 일 때만 `equals` 를 본다. `Date`·`Array`·`Maybe` 표본이 전부
서로 다른 값이라 그 분기가 **`a`와 `b`가 같은 객체일 때만** 탔고, 그때는 `equals` 를 `===`
로 바꿔놔도 통과한다.

**게이트 파일 자신이 머리에 "표본에 길이가 같은 문자열이 없으면 통과한다 — 그래서 `'ab'`/
`'cd'` 를 넣어 뒀다" 고 적어놓고, 그 처방을 `string` 에만 적용했다.** 위험을 알아채고
적어놓고도 한 타입만 대응한 것이다.

### 5 — 새로 만든 세 자리에 테스트가 0건

| 심은 것 | 결과 | 의미 |
| --- | --- | --- |
| 인스턴스 캐시의 arity 분기 제거 | 42/42 초록 | 실제 파손: 왼쪽이 같고 오른쪽이 다른 `Either.Setoid` 둘이 한 인스턴스로 합쳐짐 |
| `checkAndSet('Ord.super')` 를 `emptyFunc` 로 | 42/42 초록 | **이 회차에 신설한 검증 규칙**에 테스트가 없다 |
| `FunctionFunctor` 의 합성 방향 뒤집기 | 42/42 초록 | 이 회차에 등록한 인스턴스에 테스트가 0건 |

**처리** — 표본과 명단을 고치고 어서션을 넣었다.

- 참조 타입 표본에 중복 값을 넣었다(`Date: [new Date(0), new Date(0), …]`).
- 문자열 표본에 NFC/NFD 유니코드 쌍을 넣어 `StringLocaleSetoid` 를 가르게 했다(→ 12번).
- **팩토리 산물 11개를 법칙 명단에 추가했다.** 게이트가 로드 시점 레지스트리만 순회해
  `Ord.Array('number')` 같은 것을 아예 안 보고 있었다.
- `Ord.super` 검증·`FunctionFunctor` 합성 방향·`Either.Setoid` 캐시 키에 어서션을 넣었다.

**부수 발견** — `Ord.super` 테스트를 넣었는데도 뮤테이션이 통과했다. `tests/utils.js` 의
**`assertThrows` 는 "던지는가" 만 보고 두 번째 인자는 설명으로만 쓴다.** 그 파일의 기존
검증 테스트들이 넘기는 `/Monoid: argument must be a Semigroup/` 같은 정규식은 **전부 장식**이다.
검증을 꺼도 뒤에서 다른 이유로 던지니 통과한다. `assertThrowsWith` 로 바꾸니 잡혔다.

**재검증** — 일곱 뮤테이션(위 6건 + 인자 검증 제거) 전부 `41 passed, 1 failed`.

---

## 7. 처방을 기각하고 닫았다

리뷰어: "`Ord.Array`/`Maybe.Ord` 가 안쪽 키를 알 때는 그 키로 `Setoid.Array(key)` 를 불러라
— 그러면 등록되고 하나로 공유된다."

**그대로 하면 법칙이 깨진다.** 실측:

```
Ord.Array(StringLengthOrd).lte(['ab'],['cd'])  -> true   (양방향)
  → 반대칭이 요구하는 equals(['ab'],['cd'])     -> true
Setoid.Array('string').equals(['ab'],['cd'])   -> false  ← 키로 조회했을 때
Setoid.lookup('StringLengthOrd')               -> THROW  (키 이름 공간이 다르다)
```

`Ord` 키(`StringLengthOrd`)와 `Setoid` 키(`StringLengthSetoid`)는 같은 이름이 아니고,
길이 순서가 유도하는 동치는 글자 동등이 아니다. 지금 코드(`Setoid.Array(inner)`)가 짝을
**안쪽 Ord 자신에게서** 뽑는 것이 옳다.

진단의 사실 부분(객체가 둘이고 하나는 미등록)은 맞지만 그것은 **의도된 설계**다 — 키가
아니라 인스턴스를 넘기면 등록하지 않는다. `Setoid.Array(사용자정의Setoid)` 도 같다.

**처리**: 코드 대신 게이트를 늘렸다. `Ord.Array(StringLengthOrd)`·`Maybe.Ord(StringLengthOrd)`
를 법칙 명단에 넣었고, **리뷰어 처방을 뮤테이션으로 심으니 41/1 로 잡힌다.** 앞으로 누가
같은 "최적화" 를 시도하면 멈춘다.

---

## 열려 있는 것

3·6·8·9·10·11 은 [`TODO.md`](../TODO.md) 에 원인·해결책·완료조건과 함께 있다. 요약:

- **3** `default` 의 동종 제약(승인된 변경)을 지키는 장치가 없다 — 격자 0건, `#any` 절이 모름
- **6** `FunctionFunctor.map` 이 같은 파일 `compose2` 와 글자 그대로 같다. 형제 둘은 이미 넘긴다
- **8** 짝 Setoid 를 `Setoid.lookup(...)` 으로 꺼냈다 — 파일 선례 68곳은 `Parent.types.X`
- **9** `Either.Setoid` 주석이 두 겹으로 거짓(그 분기는 같은 변경에서 만들었고, 미등록이면 캐시가 안 걸린다)
- **10** 주석이 가리키는 `#ord-setoid` 앵커가 0개
- **11** "명세가 요구하는 그것이다" 는 과장 — 게이트 ③은 `.type` 문자열만 본다.
  `TupleBifunctor`(`.type='Array'`)가 `ArrayFunctor` 로 만족되는데 그것은 명세가 말하는
  Functor 가 아니다(튜플의 둘째 자리만 매핑해야 한다)

**9·10·11 과 1차-7 은 전부 「에이전트가 쓴 거짓 문장」** 이다.

---

## 절차 사고 하나

리뷰가 도는 중에 주 에이전트가 `CLAUDE.md` 를 고쳤다(소유자 요청, `mutation` →
`mutation testing`). 검토 대상(`index.js`)은 아니었지만 **리뷰어가 읽는 문서**다.
리뷰어가 이를 규칙 28 위반으로 지적했다. 다음부터 리뷰 중에는 대상 밖 문서도 건드리지 않는다.

커밋되지 않은 작업 트리를 리뷰시킬 때는 `git stash`·`git checkout -- <file>` 금지를
프롬프트에 명시해야 한다 — 이번에는 명시했고, 리뷰어가 백업 파일로 복원한 뒤 42/42 를
확인해 보고했다. 주 에이전트도 바이트 단위로 재확인했다.
