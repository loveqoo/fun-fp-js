# 리뷰 1회차 — `index.js` 전체 감사

대상: 현재 HEAD 의 `index.js` 전체(3081줄). 소유자가 파일 하나로 범위를 좁혔다.
리뷰어: [`staticland-reviewer`](../../.claude/agents/staticland-reviewer.md) · 실측 소요 **12분 32초**
판정: **위반 9건**

이 회차는 원래 대화로만 하기로 했다가, `.dev/TODO.md` 를 만들며 **항목들이 가리킬 근거가
없다는 것**이 드러나 뒤늦게 남긴다. `review/INDEX.md` 의 규약("판정은 반드시 파일로 남긴다 —
남기지 않으면 휘발된다")을 어기고 있었다.

> 아래 「확인」은 **주 에이전트가 리뷰어와 별도로 직접 실행해 재확인한 것**이다.
> 리뷰어의 주장을 그대로 옮기지 않았다.

---

## 판정과 처리

| # | 무엇 | 확인 | 처리 |
| --- | --- | --- | --- |
| 1 | `Ord` 에 `equals` 가 없다 — 명세·타입 선언·문서 세 곳이 있다고 약속 | 실행 | ✅ 닫힘 |
| 2 | `cachedInnerFactory` 를 만들고 원본 3개를 손코드로 남김 | 소스 대조 | ✅ 닫힘 |
| 3 | 안쪽 해석기가 둘이라 같은 오타가 두 메시지를 냄 | 실행 | ✅ 닫힘 |
| 4 | `lookup('default')` 가 정식 인스턴스가 아닌 맨 객체 | 실행 | ✅ 닫힘 |
| 5 | `Setoid.Array._ordLte` — Ord 헬퍼가 Setoid 이름 아래 | 실행 | ⬜ 열림 |
| 6 | 같은 것을 `_cache` / `_keyCache` 두 이름으로 부름 | 소스 대조 | ✅ 닫힘 |
| 7 | 없어진 `struct(...)` 키를 광고하는 주석 | 실행 | ⬜ 열림 |
| 8 | `either(...)` 항수가 레지스트리마다 다름 | 실행 | ⏸ 결정 대기 |
| 9 | 새 인스턴스 5개의 `.type` 이 어떤 게이트에도 안 걸림 | **뮤테이션** | ⬜ 열림 |

---

## 1. `Ord` 에 `equals` 가 없다 — 이 회차의 본체가 됐다

Static Land 는 `Ord` 에 "support `Setoid` algebra for the same `T`" 를 건다. 코드는
`class Ord extends Algebra` 였다. 파일에서 상위 클래스 관계를 `extends` 로 안 비추는
**유일한 자리**였다(`Monoid`·`Group`·`Category`·`Applicative`·`Plus`·`ChainRec`·`Comonad`
일곱은 전부 부모 인스턴스를 받아 확장한다).

**저장소 자신이 세 곳에서 있다고 약속하고 있었다.**

| 어디 | 무엇이라 말했나 |
| --- | --- |
| `types/TypeClasses.d.ts:227` | `interface Ord<A> extends Setoid<A>` |
| `docs/README.md` | 의존성 그래프 `Setoid ─────> Ord` |
| `docs/Ord.md` | "Setoid: Ord의 기반 (equals 제공)" |

실측:

```
Ord.lookup('number').equals        -> undefined
Ord.lookup('number').equals(1, 1)  -> TypeError: not a function
```

**TypeScript 사용자는 `tsc` 통과 후 런타임에 죽는다.** 타입 검사기가 보증한 코드가 터지는,
가장 나쁜 종류의 실패다.

그리고 단순 누락이 아니라 **기능 손실**이었다. `StringLengthOrd` 는 `'ab'` 와 `'cd'` 를 같은
자리에 놓는데(길이가 같으니까), 그 동치를 꺼낼 방법이 없었다.

```
StringLengthOrd.lte('ab','cd')  -> true      둘 다 참 = 같은 자리
StringLengthOrd.lte('cd','ab')  -> true
StringLengthOrd.equals          -> undefined  ← 그 동치에 닿을 길이 없다
```

증상은 저장소 테스트에도 이미 있었다 — `tests/ord.test.js` 의 반대칭 법칙이 `Ord` 옆에
`Setoid` 를 **따로** 꺼내 쓴다. 명세대로였다면 `O.equals` 하나로 끝난다.

**처리**: `class Ord extends Setoid` + 생성자 `(setoid, lte, type, registry, ...aliases)`
(`Monoid` 선례). `checkAndSet('Ord.super')` 신설. `Ord` 생성 8자리 수정. 길이·로케일 순서가
유도하는 동치가 글자 동등과 달라 `StringLengthSetoid`·`StringLocaleSetoid` 를 신설했다.

`baseline` 대조 35항목 — 차이 12건 전부 의도한 것이고 **`lte` 동작 11건은 그대로**.

---

## 2·3·6. 추상화를 만들고 원본을 안 지웠다

`cachedInnerFactory` 를 새로 만들면서 **그 뼈대를 뽑아온 `Maybe.Semigroup` 을 손코드로
남겼다.** 주석이 스스로 "선례의 캐시 두 개를 뼈대로 뽑았다" 고 적어놓고 원본을 안 고쳤다.
같은 60줄 안에 추상화 하나와 복사본 셋이 공존했다.

파생 문제 둘:

- **안쪽 해석기가 둘**이고 한 줄이 달랐다(문자열 우회로). 그래서 같은 종류의 오타가 두
  메시지를 냈고, 하나는 컨텍스트를 잃었다.
  ```
  Semigroup.lookup('maybe(bogus)')  -> "unsupported key bogus"   ← maybe(...) 가 사라진다
  Setoid.lookup('array(bogus)')     -> "Setoid.Array: inner must be a supported Setoid key…"
  ```
- 같은 성격의 캐시를 `_cache` 와 `_keyCache` 두 이름으로 불렀다.

**처리**: 뼈대를 두 구역이 함께 쓰도록 올리고 **가변 인자로 넓혀** 넷을 그 위에 올렸다
(`Maybe.Semigroup`·`Maybe.Monoid`·`Either.Semigroup`·`Either.Setoid`). 해석기를 하나로
통합해 모든 실패가 자기 팩토리 이름을 대게 했다. `_keyCache` 로 이름을 통일했다. `-46줄`.

이력 확인: 문자열 우회로는 4월 최초 기능 커밋에 그대로 들어왔고 **이유가 적힌 적이 없다**
(`git log -S`). 균일한 형태는 8월에 새로 만든 Setoid/Ord 쪽이 택한 것이라 그쪽으로 맞췄다.

> **이 처리가 회귀를 냈다.** 가변 인자화가 인자 개수 검증을 통째로 잃었다 — 2회차 판정 1번.

---

## 4. `lookup('default')` 가 맨 객체였다

```javascript
withTypeRegistry(Setoid, key => key === 'default' ? { equals: Setoid.op } : null);
```

실측하면 네 가지가 한꺼번에 무너진다.

| | 전 |
| --- | --- |
| 꺼낼 때마다 같은 물건인가 | ❌ 매번 새 것 |
| 정식 인스턴스인가 | ❌ `instanceof Setoid` 가 false |
| 레지스트리·`Algebra.all`·`.type` 게이트에 보이나 | ❌ 전부 안 보임 |
| 타입 검사 | ❌ `equals(1,'a')` 가 조용히 `false` (정식 인스턴스는 던진다) |
| **컨테이너 캐시** | ❌ 매번 새 물건이라 WeakMap 이 절대 안 맞음 |

마지막이 특히 아팠다 — **그 회차가 만든 캐시를 그 회차가 조용히 깎고 있었다.**

**처리**: `type:'any'` 선례(`FirstSemigroup`/`LastSemigroup`)를 따라 `DefaultSetoid`/
`DefaultOrd` 클래스로 만들어 등록. `withTypeRegistry` 의 `defaultResolver` 매개변수가
유일한 사용자를 잃어 함께 사라졌다 — **이제 `lookup` 이 돌려주는 것은 예외 없이 등록된
정식 인스턴스다.**

동작 변경 4건(이종 인자에 `false` → 던짐)은 소유자 승인을 받았다. → 2회차 판정 3번으로 이어짐.

---

## 5. `Setoid.Array._ordLte` — 열림

Ord 의 `lte` 를 만드는 함수가 **Setoid** 팩토리의 속성으로 붙어 있다. 이 파일에서 공개
팩토리에 붙은 밑줄 속성은 **전부 캐시**인데 이것만 로직이다. 밖에서
`fp.Setoid.Array._ordLte` 로 닿는다 — 공개 표면 오염.

사용처는 정의 아홉 줄 아래 한 곳뿐. → [`TODO.md`](../TODO.md) `1차-5`

---

## 7. 없어진 `struct(...)` 키를 광고하는 주석 — 열림

같은 커밋이 `struct(...)` 키를 없애놓고 그 문법을 설명하는 주석을 안 고쳤다. 한 화면에서
주석 셋이 서로 모순된다. 실측: `Setoid.lookup('struct(a:number)')` → 던짐.
→ [`TODO.md`](../TODO.md) `1차-7`

---

## 8. `either(...)` 항수가 레지스트리마다 다름 — 결정 대기

```
Setoid.lookup('either(string,number)')    -> Either    OK
Semigroup.lookup('either(string,number)') -> THROW     (either 도 쉼표도 메시지에 없다)
Semigroup.lookup('either(number)')        -> Either    OK
Setoid.lookup('either(number)')           -> THROW
```

조립 키는 이 라이브러리의 **공용 타입 문법**이다. 사용자가 배운 문법이 옆 레지스트리에서
안 통하고, 실패가 조용하지도 친절하지도 않다. 한쪽으로 통일하는 것은 설계 결정이라
소유자에게 넘긴다. → [`TODO.md`](../TODO.md) `1차-8`

---

## 9. 새 인스턴스의 `.type` 이 게이트 밖 — **열림** (주 에이전트가 한 번 틀리게 말했다)

`.type` 게이트의 "팩토리로만 생기는 파생 인스턴스" 명단은 다섯 개짜리 고정 목록인데,
컨테이너 `Setoid`/`Ord` 여섯은 거기 없다.

리뷰어가 그 자리들의 `.type` 을 비정규 소문자로 바꿔 **40/40 초록 + `baseline` 차이 0건**을
보였다. `types.check` 의 대소문자 폴백이 삼키고, `Algebra.all` 은 `.type.toLowerCase()` 로
묶으므로 격자도 못 본다.

**주 에이전트가 이후 회차에서 "게이트 둘을 신설해 상당 부분 해소됐다" 고 말했는데 틀렸다.**
새 게이트 둘은 *메서드가 있는가*(`staticland-spec`)와 *메서드끼리 맞는가*(`staticland-laws`)를
보지 `.type` **값**을 보지 않는다. 판정 파일을 쓰며 직접 심어 확인했다:

```
$ (Maybe.Setoid 의 .type 을 'Maybe' -> 'maybe' 로 뮤테이션)
$ npm test
test files : 42 passed, 0 failed
$ node -e "... fp.Maybe.Setoid('number').type"
maybe
```

**게이트를 만들었다고 앞의 구멍이 자동으로 닫히지 않는다.** 규칙 31-1 이 요구하는 것을
그 순간 안 했고, 뒤늦게 하니 뒤집혔다. → [`TODO.md`](../TODO.md) `1차-9`

---

## 리뷰어가 검증 없이 통과시킨 것

기준 1(이름 충돌 없음 / 타입당 인스턴스 여럿 / 미등록 사용자 인스턴스 수용)과 유형 3·4·5 에
대해 "문제없음" 을 냈고 근거를 붙였다. 주 에이전트는 그중 **최상위 이름 증가 0건**만
재확인했다(`Object.keys(fp).length` 81 → 81). 나머지는 재확인하지 않았다.
