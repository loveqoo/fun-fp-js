검색 키: `identity 3단 등록` `Applicative.Const` `addResolver` `선례를 절반만` `normalizeTypeClassKey` `지연 해석기` `scratchpad` `loop_prefix` `docs_readonly` `ls` `protected_bash`

# 회차 3 회고 — "선례를 따랐다" 고 하면서 어느 부분을 따랐는지 안 셌다

작업 `260812-d36358` 회차 3. 회차 1 리뷰의 남은 등록 계층 3건(#1·#2·#3).

## 무엇이 통했나

### 3단 등록 — 다른 인스턴스와 같은 모양이 됐다

```
Functor.of('identity')      OK
Apply.of('identity')        OK
Applicative.of('identity')  OK
```

등록된 다른 모든 Applicative 가 `XxxFunctor → XxxApply → XxxApplicative` 인데
`IdentityApplicative` 만 익명 생성이었다. 이제 같다.

`type` 이 `'Object'`(대문자)여야 하는 이유를 주석으로 박았다 — `types.equals(a,b,'Object')` 는
`types.check` 와 달리 대소문자 폴백이 없고, 같은 파일의 `ObjectFilterable` 은 소문자를 쓴다.
**누가 "일관성" 으로 정리하면 optics 가 전부 죽는다.**

### 중복을 매개변수화했다 (규칙 18)

`normalizeSemigroupKey` 와 `Applicative.Const` 가 필요로 한 monoid 해석기가 레지스트리만
다르고 로직이 같았다. `normalizeTypeClassKey(TypeClass, symbol, label)` 하나로 합쳤다.

**손으로 복사하기 전에 물었더니 합칠 수 있었다** — 회차 4(앞 작업)에서 `Plus` 유도를
손복사 2개로 만들었다가 지적받은 것의 반대다.

### 뮤테이션 3건 전부 검거

d.ts 키 삭제 → tsc 1건 / `modules.push` 제거 → 1건 / 레지스트리 등록 제거 → 2건.

## 무엇을 잘못 가정했나

### **"선례를 따랐다" 고 하면서 선례의 어느 부분을 따랐는지 안 셌다**

`Maybe.Monoid(innerSG)` 선례를 따라 `Applicative.Const` 를 만들었다. 따라한 것:

| 선례의 구성 | 따라했나 |
| --- | --- |
| `_keyCache` / `_instanceCache` 쌍 | ✅ |
| 키 해석기 (`normalizeSemigroupKey` 상당) | ✅ |
| `const(<키>)` 로 레지스트리 등록 | ✅ |
| **`addResolver` — 지연 해석기** | ❌ **빼먹었다** |

결과:

```
Monoid.of('maybe(first)')      — Maybe.Monoid('first') 호출 전에도  OK
Applicative.of('const(array)') — Applicative.Const('array') 호출 전  THROW
```

`index.js:1498` 에 `addResolver(Monoid, key => /^maybe\((.+)\)$/ ...)` 가 있다.
`Applicative` 에는 없다. **한 줄인데 못 봤다.**

**원인**: 선례를 "읽고 비슷하게 만들었다" 지 **구성 요소를 목록으로 뽑아 대조하지 않았다.**
`Maybe.Monoid` 본체(1403~1437줄)만 보고 60줄 아래의 `addResolver` 는 안 봤다.

이것은 규칙 11("리뷰 항목을 닫을 때는 처방을 받아들였나로 물어라")의 사촌이다 —
**선례를 따를 때도 "무엇을 따랐나" 를 목록으로 대조해야 한다.**

## 이 회차를 싸게 만들었을 것

### ① 선례의 구성 요소를 먼저 목록으로 뽑았어야 했다

`grep -n "Maybe.Monoid\|maybe(" index.js` 한 줄이면 `addResolver` 가 같이 나왔다.
**선례를 따를 때는 그 이름으로 파일 전체를 grep 하라** — 정의부 옆에만 있는 게 아니다.

### ② 완료 조건에 "선례와 동일하게 동작한다" 를 넣었어야 했다

조건 1을 `Applicative.of('const(array)')` 로만 썼는데, **선례가 호출 전에도 되는지**를
안 물었다. 그래서 Verification 에서야 드러났다.

## 승격 결정

`harness promote` → 0개.

`.dev/learning/INDEX.md` 에 **규칙 25 추가**:

- **25. 선례를 따를 때는 그 이름으로 파일 전체를 grep 해 구성 요소를 목록으로 대조하라.**
  `Maybe.Monoid` 를 선례로 삼아 `Applicative.Const` 를 만들면서 `_keyCache`·해석기·등록은
  따라했는데 **60줄 아래의 `addResolver`(지연 해석기)를 빼먹었다.** 정의부만 읽었기 때문이다.
  선례는 여러 곳에 흩어져 있다.

## 다음 회차

| 항목 |
| --- |
| **`addResolver(Applicative, ...)` — 한 줄** (이번 회차의 미완) |
| 리뷰어 2차 결과 반영 |
| `deriveFromPlus` 의 재래핑 (앞 작업 #10 잔여) |
| `docs/` 의 `plus(` 0건 |
| `Strong`/`Choice`/`Wander` |

**커밋은 하지 않았다.**
