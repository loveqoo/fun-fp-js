# 계획 — 컨테이너 `Setoid`/`Ord` 신설

## 무엇을 / 왜

지금 **컨테이너의 동등성을 물을 방법이 없다.**

```
Setoid.lookup('maybe')   TypeError: unsupported key maybe
Setoid.types              BooleanSetoid, NumberSetoid, StringSetoid, DateSetoid  — 원시 4종뿐
```

Static Land 를 표방하는 라이브러리에 컨테이너 `Setoid` 가 없다. `Algebra.all('maybe')` 를
만들고 나니 `setoid` 칸이 빈 것으로 눈에 보인다.

**한 번도 존재한 적이 없다** — `git log -S 'MaybeSetoid' -- index.js` → 0건. 지운 것을
되살리는 것이 아니다(규칙 1).

**대신 테스트가 사설 구현을 갖고 있다.** `tests/utils.js` 의 `deepEquals` 가 `Maybe`/`Either`
를 손으로 분해한다. 2025-12-25 에 생겼고 지금 형태의 `Setoid` 는 2026-01-08 이다 — 필요가
먼저 왔고 라이브러리에 없어서 옆에 만들었으며, 나중에도 아무도 안 돌아갔다.
**그 사설 구현을 검증하는 테스트는 0건이고, 58곳이 그것을 쓴다.**

## 따를 선례 — `Maybe.Semigroup(innerSG)` 의 구성 요소 다섯

`grep -n "Maybe.Semigroup" index.js` 로 전부 세었다(규칙 25 — 선례는 한 곳에 모여 있지 않다).

| | 무엇 |
| --- | --- |
| 1 | `normalizeTypeClassKey(TypeClass, Symbol, label)` — 키 또는 인스턴스를 받는다 |
| 2 | `resolveInnerX(label, inner)` — 문자열/인스턴스 양쪽 + 실패 메시지 |
| 3 | 팩토리 + `_keyCache`(Map) + `_instanceCache`(WeakMap) |
| 4 | `registerAs(X.types, '<컨테이너>(<키>)', 인스턴스)` — 유일한 문으로 등록 |
| 5 | **`addResolver`** — 팩토리를 부르기 전에도 `lookup('maybe(number)')` 이 되게 |

## 무엇을 만드나

`Maybe.Setoid(inner)` · `Either.Setoid(inner)` · `Array.Setoid(inner)` 와 `Ord` 짝.
키는 `maybe(number)` · `either(number)` · `array(number)`.

## 결정 (2026-08-13, 소유자 승인)

| | 정한 것 | 근거 |
| --- | --- | --- |
| ① `Either` | **안쪽 둘** — `Either.Setoid(왼쪽, 오른쪽)`, 키 `either(string,number)` | 남이 아니라 **우리 것**이 근거다 — `writert(maybe,array)` 가 이미 쉼표로 둘을 담는다. Haskell·fp-ts 도 둘이지만 그쪽은 타입 검사기가 찾아주는 전제라 우리와 다르다 |
| ② 매개변수 없는 키 | **불허** — 안쪽을 항상 밝힌다 | 타입 언어 어디에도 없다. 그리고 근거로 삼으려던 `Setoid.lookup('default')` 가 `Algebra` 도 아니고 `.type` 이 `undefined` 인 맨 딕셔너리다 — 성한 것을 흠 있는 것에 얹지 않는다 |
| ③ `Ord` | `Maybe`·배열은 **만든다**(`Nothing < Just`, 사전식). **`Either` 는 안 만든다** | `Left`/`Right` 중 무엇이 먼저인지에 정답이 없다. fp-ts 도 코어에서 뺐다. 넣으려면 이유를 대야 하는데 댈 수 없다 |

## 결정 2 (2026-08-13 추가, 소유자: "우회하지 않고 정면승부")

58곳 분류 결과 42곳은 컨테이너 `Setoid` 로 되고 **16곳은 레코드**(`{ name, age }` — 필드마다
타입이 다름)였다. A(16곳 남김)/B(안 갈아끼움)/C(레코드용까지 만들어 전부) 중 **C**.

- **`Setoid.Struct({ 필드: 키 })`** 를 만든다 — fp-ts 의 `Eq.struct` 에 해당.
  키는 `struct(age:number,name:string)` (필드 이름 정렬로 정규화).
- **엄격 비교**: 선언된 필드 집합과 실제 키 집합이 정확히 같아야 한다. fp-ts 는 초과
  필드를 무시하지만, 사설 deepEquals 가 키 개수까지 봤으므로 약해지면 이행이 아니라
  퇴행이다.
- **`Ord.Struct` 는 만들지 않는다** — 레코드의 순서는 `Either` 의 순서처럼 정답이 없고,
  58곳에 필요한 곳도 없다.
- 58곳 전부 갈아끼우고 **사설 `deepEquals`/`assertDeepEquals` 를 지운다.**

## 남은 설계 — 코드에서 답이 안 나온다

### ① `Either` 는 안쪽이 둘이다

`Setoid<Either<e, a>>` 는 `Left` 끼리 비교할 때 `Setoid<e>`, `Right` 끼리 비교할 때
`Setoid<a>` 가 필요하다. 그런데 선례인 `Either.Semigroup(innerSG)` 는 **안쪽을 하나만**
받는다 — `Left` 는 짧게 끊고 `Right` 에만 `inner` 를 쓰기 때문이다. 동등성에는 그 수가 안 통한다.

| 안 | 모양 | 대가 |
| --- | --- | --- |
| A | `Either.Setoid(inner)` — **양쪽에 같은 `inner`** | 선례와 모양이 같다. `Either<string, number>` 는 못 다룬다 |
| B | `Either.Setoid(leftS, rightS)` — 둘 다 받는다 | 정확하다. 키가 `either(string,number)` 로 길어지고 선례와 모양이 다르다 |
| C | `Either.Setoid(inner)` — **`Left` 는 `===`**, `Right` 만 `inner` | 선례와 모양이 같고 실용적. `Left` 가 객체면 참조 비교라 조용히 틀린다 |

### ② 매개변수 없는 `Setoid.lookup('maybe')` 를 허용하나

`Setoid` 에는 `default` 해석기가 있다 — `Setoid.lookup('default')` 는 `===` 비교다.
그러면 `maybe` 를 "안쪽이 `===`" 로 정의할 수 있다.

| 안 | 결과 |
| --- | --- |
| 허용 | `Algebra.all('maybe').maybeSetoid` 가 채워진다. `Just([1])` vs `Just([1])` 는 **false**(참조가 다르다) — 옳지만 놀랄 수 있다 |
| 불허 | `maybe(number)` 처럼 안쪽을 항상 밝혀야 한다. 묶음의 `setoid` 칸은 계속 빈다 |

### ③ `Ord` 의 순서 규약

`Nothing < Just`, `Left < Right`, 배열은 **사전식**. 관례를 따르는 것이지 유일한 답은 아니다.

## 완료 조건

1. `Setoid.lookup('maybe(number)')` 등이 **팩토리를 부르기 전에도** 동작한다(선례 5번).
   지난번에 이걸 빼먹었다.
2. `Algebra.all('array')` 에 `arraySetoid` 계열이 나타난다 — 새 문(`registerAs`)을 지난다.
   지금 `tests/registry-api.test.js` 의 대조가 자동으로 걸린다.
3. `tests/algebra-type.test.js` 의 인스턴스 수 고정과 예외표를 갱신한다. **새 인스턴스가
   `.type` 규칙을 지키는지 그 게이트가 판정한다.**
4. **사설 구현 58곳을 훑어 몇 곳이 `Setoid` 로 되는지 센다.** 되는 곳은 갈아끼우고,
   **남는 것에는 왜 안 되는지 이유를 적는다.** 이유 없이 남으면 우회다.
   - 미리 보이는 것: `assertDeepEquals(updated, { name: 'B', age: 30 })` — 필드마다 타입이
     달라 안쪽 `Setoid` 가 하나로 안 정해진다
5. `npm test` + `tsc`, `npm run baseline` 의 차이가 **전부 이 계획에 적힌 것**이어야 한다.
   새 표면이므로 레지스트리 키·`Algebra.all` 묶음 줄에서 차이가 나는 것이 정상이다.
6. 법칙을 테스트로 박는다 — 반사성/대칭성/추이성, `Ord` 는 전순서.

## 이 계획이 놓칠 수 있는 것

- **`Setoid` 가 틀려도 그것으로 비교하는 58곳은 안 잡는다.** 다만 `tests/setoid.test.js` 는
  헬퍼를 안 쓰고 불리언을 직접 단언하므로(실측 0건) 거기서 잡힌다. 새 인스턴스도 같은
  방식으로 테스트한다 — **`assertDeepEquals` 를 쓰지 않는다.**
- 법칙 테스트는 **내가 고른 표본**에서만 성립을 보인다. 표본 밖은 못 본다(규칙 31-1).
