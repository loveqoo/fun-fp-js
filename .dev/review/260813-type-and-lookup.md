# 리뷰 — `Algebra.type` 드리프트(09f661d) · `of` → `lookup`(a6c06d9)

대상: `b970b96..HEAD` (커밋 2개). 검토 방식: 소스 직독 + 레지스트리 실행 조회 + 뮤테이션.
호출자 주장은 근거로 취급하지 않고 전부 재확인했다.

## 판정: 위반 7건

---

### 1. [유형 7 — 스테일 주석] 커밋 1이 코드를 바꾸고 그 코드를 설명하는 주석을 안 고쳤다

- **위치**: `index.js:1004–1009` (특히 1008줄)
- **무엇**: 주석이 코드와 정면으로 모순된다.

```javascript
// index.js:1008-1009  (현재 HEAD)
// 같은 파일의 ObjectFilterable/ObjectFoldable 은 'object'(소문자)를 쓰지만 그쪽은
// types.check 만 쓴다 — "일관성" 을 이유로 여기를 소문자로 바꾸면 optics 가 전부 죽는다.
```

커밋 1이 바로 그 `ObjectFilterable`/`ObjectFoldable` 을 `'Object'` 로 바꿨다
(`index.js:970`, `976`). 주석이 근거로 삼은 **대비 자체가 사라졌다.** 지금 이 주석을
읽는 사람은 "소문자를 쓰는 자리가 아직 있다" 고 믿게 된다.

- **왜 위반인가**: 같은 커밋이 `CLAUDE.md` 의 `type:'Object'` Trap 을 지우면서 근거로
  "테스트 실패 메시지가 원인과 이유를 말하므로 중복이다" 를 댔다. 실측한 메시지는 이렇다.

```
$ (IdentityApply 의 'Object' -> 'object' 로 뮤테이션 후)
$ node tests/algebra-type.test.js
❌ IdentityApply: .type='object' 은 정규 태그가 아니다
❌ Apply.ap: both arguments must be object
```

  **위반 사실은 말하지만 결과(optics 가 죽는다)는 말하지 않는다.** 그 이유를 담고 있던
  유일한 산문이 지금 틀린 주석 1004–1009 다. Trap 을 지우려면 이 주석부터 옳게 만들어야
  했다.

- **재현**:
  ```
  grep -n "ObjectFilterable/ObjectFoldable" index.js     # -> 1008
  grep -n "'Object', Filterable.types" index.js          # -> 970
  ```
- **고치는 법**: 1004–1009 를 다시 쓴다. 대비를 지우고 **불변식 한 줄**로 바꾼다 —
  "모든 `.type` 은 `types.of()` 정규 태그다. `Apply.ap`/`Alt.alt` 는 대소문자 폴백이
  없으므로 여기서는 반드시 `'Object'`." Trap 을 지운 판단은 이 주석이 옳아진 뒤에 유효하다.

---

### 2. [유형 4 — 게이트 과대주장] `algebra-type.test.js` 는 "대표 타입" 룰을 강제하지 않는다

- **위치**: `tests/algebra-type.test.js:79–93`, `.dev/learning/INDEX.md` 규칙 31
- **무엇**: 게이트가 검사하는 것은 **"정규 태그인가"** 뿐이고, **"이 인스턴스의 타입인가"**
  는 검사하지 않는다. 즉 커밋 1이 선언한 룰(`.type` = 그 인스턴스가 다루는 첫 번째 타입)은
  게이트에 들어 있지 않다.

- **왜 위반인가 — 뮤테이션 3종 실측**:

  | 심은 것 | `algebra-type` | `npm test` 전체 |
  | --- | --- | --- |
  | `MaybeSemigroupoid.type 'function' → 'Maybe'` (커밋 1이 고친 바로 그 자리) | **exit 0 (통과)** | 39 → 38 (semigroupoid.test.js 만) |
  | `PredicateContravariant.type 'function' → 'Maybe'` | **exit 0** | **39 passed, 0 failed** |
  | `FunctionProfunctor.type 'function' → 'Array'` | **exit 0** | **39 passed, 0 failed** |

  뒤 두 건은 **전 스위트가 초록**이다. `.dev/learning/INDEX.md` 규칙 31 의
  *"두 번째가 핵심이다 — **내가 고치지 않은 자리도 막힌다**"* 는 **거짓**이다.
  막히는 것은 비정규 태그(`'array'`, `'date'`) 뿐이고, 정규 태그를 **엉뚱하게** 적은 경우는
  통과한다. 그리고 커밋 1이 고친 6건 중 Kleisli 2건이 정확히 그 통과하는 유형이다.

- **범위**: `checkAndSet` 에서 `instance.type` 을 아예 안 읽는 타입클래스 —
  `Semigroupoid`(231) `Category` `Contravariant`(270) `Profunctor`(277)
  `Applicative`(300) `Monoid` `Plus` `Alternative` `ChainRec` `Monad`.
  커밋 1은 이 중 **2개(Semigroupoid/Category)** 만 `tests/semigroupoid.test.js` 의
  **좌표 어서션**으로 막았다. 나머지는 그대로다 — 규칙 31 이 스스로 금지한 "좌표로 끝내기"
  를 나머지 8개에 대해 한 셈이다.

- **재현**:
  ```
  # index.js:780 의 'function' 을 'Maybe' 로 바꾼 뒤
  node tests/algebra-type.test.js ; echo $?     # -> 0
  node tests/run.js | grep "test files"          # -> 39 passed, 0 failed
  ```
- **고치는 법**: 게이트를 캐리어 인지형으로 올린다. `baseline-report.js` 가 이미
  `<인스턴스명>=<type>` 격자를 만들고 있으므로, 그 격자를 **기대표로 테스트에 박으면**
  120개 전부가 좌표 없이 고정된다. 최소한이라도 `Contravariant`/`Profunctor` 에
  `semigroupoid.test.js` 와 같은 좌표 어서션을 추가하라.

---

### 3. [게이트 구멍] "124개 전수조사" 와 실제 감시 범위 120개가 다르다. 밖에 남은 것들이 있다

- **위치**: `tests/algebra-type.test.js:66–75`(`everyInstance`), `:78`(`>= 120`),
  `.dev/log/260813-type-field-audit.md`, `.dev/learning/INDEX.md` 규칙 31
- **무엇**: 감사 기록과 규칙 31 은 "등록된 **124개** 전부를 훑는다" 고 적었다.
  실제로 게이트가 훑는 것은 **120개**다.

  ```
  $ node --input-type=module -e "...동일성 기준 중복제거..."
  unique instances (identity): 124   total keys: 230
  $ node --input-type=module -e "...대문자 키 필터(게이트와 동일)..."
  gate sweeps 120
  ```

- **밖에 남은 것 4종**:
  1. **대문자 키가 없는 매개변수화 인스턴스 4개** — `Semigroup.plus(array)`,
     `Semigroup.plus(maybe)`, `Monoid.plus(array)`, `Monoid.plus(maybe)`.
     `key[0] === key[0].toUpperCase()` 필터에 걸려 통째로 빠진다.
     하필 `CLAUDE.md` 「Traps」가 지목한 그 키들이다("Keys nest: `plus(maybe)`").
  2. **호출 시점 생성 인스턴스** — `Applicative.Const(m)`(`.type='Object'`),
     `Maybe.Monoid(inner)`(`.type='Maybe'`). import 시점에 없으므로 영원히 안 훑는다.
     `Const` 의 `'Object'` 는 CLAUDE.md 에서 지운 Trap 이 경고하던 바로 그 자리인데,
     지금 그것을 잡는 것은 게이트가 아니라 동작 테스트 3개다(뮤테이션 확인: 36 passed, 3 failed).
  3. **트랜스포머 인스턴스** — `StateT('maybe')` 이후 `.type === 'StateT(Maybe)'`.
     `REPRESENTATIVE` 표에 항목이 없다. 즉 **훑게 되면 오히려 게이트가 깨진다** —
     지금 통과하는 이유는 테스트 파일이 트랜스포머를 안 만들기 때문일 뿐이다(우연).
  4. **`.type` 이 아예 없는 조회 결과** — `Setoid.lookup('default')` /
     `Ord.lookup('default')` 는 `{ equals }` / `{ lte }` 맨 딕셔너리를 준다.
     ```
     Setoid.lookup('default'): { equals: [Function] }  type= undefined
       isSetoid= false   instanceof Algebra= false   in Setoid.types? false
     ```
     커밋 2가 승격한 공개 API(`lookup`)로 도달 가능한데 `Algebra` 도 아니고 브랜드도 없다.
     감사의 "124 전수조사" 에도 안 들어 있다. (선행 결함이지 이번 커밋이 만든 것은 아니다.
     다만 "전수" 라는 단어를 쓴 이상 목록에 있어야 한다.)

- **고치는 법**: `everyInstance()` 를 대문자 키 필터가 아니라 **인스턴스 동일성**으로
  중복 제거하도록 바꾸고(그러면 124), `>= 120` 을 `=== 124` 같은 정확한 수로 바꿔라.
  트랜스포머·`Const`·`Maybe.Monoid` 를 테스트 안에서 먼저 만들어 훑도록 하고,
  `REPRESENTATIVE` 에 `StateT(...)` 류를 어떻게 다룰지 정하라(정규식 예외든 표 항목이든).
  `lookup('default')` 는 별건으로 올려라 — 레지스트리에 없는 인스턴스가 `lookup` 으로
  나오는 것 자체가 Static Land 이점 ②(인스턴스는 값이고 레지스트리에서 꺼내 쓴다)에서
  벗어나 있다.

---

### 4. [유형 4 — YAGNI로 구조 교정 기각] `of` 제거를 테스트로 안 박은 근거가 성립하지 않는다

- **위치**: `CLAUDE.md:32–34`(새 Trap), 커밋 a6c06d9 메시지
- **무엇**: 근거가 이렇게 적혀 있다.

  > 타입클래스에 `of` 가 없다고 어서션하는 테스트는 0건이고, `tests/` 에 널린
  > `instance.of(x)` 가 오히려 반대로 읽는다 → 그래서 문서로 남긴다

  "테스트가 0건이다" 는 **테스트를 안 쓸 근거가 아니라 쓸 근거**다. 그리고 "가르치기"와
  "박기" 는 다른 일이다 — 문서는 가르치고 테스트는 되돌아오는 것을 막는다.

- **왜 위반인가 — 현재 실제 커버리지**:
  - `docs/README.md` 예제 → `Functor.lookup` 이 **있다**는 것만 증명한다.
    `Functor.of === undefined` 는 증명하지 않는다.
  - `tests/baseline-report.js` 「타입클래스 정적 표면」 → **24개 중 6개**만 본다
    (`Setoid, Semigroup, Functor, Applicative, Monad, Traversable`).
  - 결과: 오늘 `Comonad.of = Comonad.lookup` 을 되살려도 `npm test` 39/39 초록,
    `npm run baseline` "차이 없음" 이다.

  같은 브랜치가 레지스트리를 훑는 불변식 테스트(`algebra-type.test.js`)를 쓸 줄 안다.
  그리고 규칙 31 이 **스스로** "좌표를 고쳤으면 불변식으로 다시 막아라" 라고 적었다.
  `POLICY` 6 · `CLAUDE.md` "YAGNI is banned" 와 충돌한다.

- **고치는 법**: 3줄이면 된다.
  ```javascript
  test('타입클래스 24개에는 lookup 이 있고 of 는 없다', () => {
      for (const n of TYPE_CLASSES) {
          assertEquals(typeof fp[n].lookup, 'function', `${n}.lookup`);
          assertEquals(fp[n].of, undefined, `${n}.of 가 되살아났다`);
      }
  });
  ```
  덤으로 `baseline-report.js` 의 「타입클래스 정적 표면」을 6개 → 24개로 넓혀라
  (그 파일 머리말이 직접 "넓히는 비용은 거의 0" 이라고 적었다).

---

### 5. [검증 구멍] 커밋 1이 인정한 유일한 사용자 가시 변화(에러 메시지 4종)가 어디에도 안 박혔다

- **위치**: `index.js:176–180`(`binaryTypeError`), `tests/baseline-report.js`
- **무엇**: 실측 확인 — 문자열 4개가 바뀌었다.
  ```
  Setoid.equals: arguments must be the same type and match Date       (← match date)
  Ord.lte:       arguments must be the same type and match Date       (← match date)
  Filterable.filter: arguments must be (function, Object)             (← function, object)
  Foldable.reduce:   arguments must be (function, initial, Object)    (← ..., object)
  ```
- **왜 위반인가**: 이 문자열을 어서션하는 테스트·문서가 **0건**이고
  (`grep -rn "match date\|function, object" tests docs types` → 0),
  `baseline` 격자에도 해당 케이스가 없다. 그래서 커밋 메시지의
  *"npm run baseline 차이 6건은 전부 위 변경이다"* 는 **격자가 그 변화를 볼 수 없기 때문에**
  참인 것이다. `baseline-report.js` 머리말이 존재 이유로 든 바로 그 실패 유형
  ("내부 교체라 동작이 같다" 를 검증 기준으로 삼았다)에 해당한다.
- **고치는 법**: baseline 에 4줄 추가.
  ```javascript
  ['date Setoid 타입에러', f => L(f,'Setoid')('date').equals(1, 2)],
  ['date Ord 타입에러',    f => L(f,'Ord')('date').lte(1, 2)],
  ['object Filterable 타입에러', f => L(f,'Filterable')('object').filter(x => x, 5)],
  ['object Foldable 타입에러',   f => L(f,'Foldable')('object').reduce((a) => a, 0, 5)],
  ```

---

### 6. [파괴적 변경 처리] `dist/` 가 배포면인데 소스와 모순된 채 남아 있다

- **위치**: `package.json`(`main`/`module`/`types` → `dist/*`), `dist/fun-fp.js:1047`,
  `dist/fun-fp.d.ts`, `tsconfig.json`
- **무엇**: `dist/` 는 **git 추적 대상**이고 패키지 진입점이다. 지금 상태:
  ```
  dist/fun-fp.js       TypeClass.of = key => ...        (아직 존재)
  dist/fun-fp.js:1047  ... 'date', Setoid.types, 'date' (아직 소문자)
  dist/fun-fp.d.ts     readonly of: ...                 (아직 존재)
  tsconfig.json        include: ["types/**/*.d.ts", ...]  ← dist 는 tsc 대상이 아니다
  ```
- **왜 위반인가**: 커밋 2가 `refactor!` + BREAKING 을 선언했지만 **깨진 것은 `index.js`
  뿐이고 배포되는 것은 안 깨졌다.** 그리고 "npm test 39 files + tsc 통과" 는 `dist` 를
  한 번도 지나지 않으므로 파괴적 변경의 검증 근거가 될 수 없다.
- **완화**: `package.json` 이 `"private": true, "version": "0.0.0"` 이므로 **semver /
  마이그레이션 가이드 의무는 없다**. 소유자 방침상 빌드는 요청 시에만 한다. 따라서
  요구는 "지금 빌드하라" 가 아니라 **"커밋 본문에 dist 는 아직 옛 API 다 라고 적어라"** 다.
  지금은 그 말이 없어서 BREAKING 의 범위가 실제보다 넓게 읽힌다.

---

### 7. [스테일 문서] 118곳 치환이 산문 하나를 놓쳤다 — 이전에 잡힌 것과 같은 유형

- **위치**: `types/TypeClasses.d.ts:274`
  ```typescript
  // Signature mirrors the runtime: `TypeClass.of('name')` returns the
  // instance for that name. The TS side resolves via the *Instances maps.
  ```
- **왜 위반인가**: 바로 아래 25개 선언이 전부 `readonly lookup:` 이다. 주석만 옛 이름이다.
  커밋 메시지가 자랑한 `normalizeTypeClassKey` 누락과 **정확히 같은 유형**(이름 패턴에
  안 걸리는 자리)인데, 이쪽은 문서 예제 검사기도 tsc 도 못 잡는다 — 주석이기 때문이다.
- **고치는 법**: `TypeClass.lookup('name')` 으로 고친다. 그리고 "치환이 놓치는 자리" 목록에
  **주석·산문**을 명시적으로 넣어라 (`grep -rn "\.of(" --include=*.md --include=*.ts` 를
  치환 후 확인 절차에 추가).

---

## 질문별 답

**① `.type` 6건 판정이 옳은가 / 안 고친 것들이 맞는가** — 6건 판정은 **옳다.**
그리고 "의도된 예외" 4종도 룰대로 **옳다**. 실행으로 확인했다.

| 안 고친 것 | 대표 인자 | 판정 |
| --- | --- | --- |
| `TupleBifunctor='Array'` | `bimap(f,g,[a,b])` — 런타임 튜플은 Array | 옳다 |
| `Identity*`/`Const='Object'` | 캐리어가 `{value}`, `types.of({})==='Object'` | 옳다. 게다가 `Apply.ap` 를 지나므로 대문자가 **필수** |
| `PredicateContravariant='function'` | `contramap(f, pred)` — pred 는 함수 | 옳다 |
| `First/LastSemigroup='any'` | 값 타입을 안 본다 (`CLAUDE.md` Trap) | 옳다 |

**남은 것을 더 찾았다.** 룰 자체를 어긴 인스턴스는 더 없다. 다만 룰의 **적용 범위 밖**에
있는 것이 위 3번의 4종이다 — 특히 `Setoid/Ord.lookup('default')` 는 `.type` 이
`undefined` 다. 룰을 "등록된 모든 인스턴스" 로 선언한 이상 이건 목록에 있어야 한다.

**② `Apply.ap`/`Alt.alt` 가 3인자형의 유일한 두 곳인가** — **사실이다. 세었다.**
```
$ grep -nE "types\.equals\([^)]*,[^)]*,[^)]*\)" index.js
231  types.equals(f, g, 'function')          ← 리터럴
263  types.equals(f, g, 'function')          ← 리터럴
270  types.equals(f, g, 'function')          ← 리터럴
277  types.equals(f, g, 'function')          ← 리터럴
289  types.equals(fs, values, instance.type) ← Apply.ap      ✔
313  types.equals(a, b, instance.type)       ← Alt.alt       ✔
```
`instance.type` 을 3인자로 넘기는 곳은 정확히 289·313 두 곳이다. **커밋 1의 안전성 논거는
성립한다.**

다만 **주장에 없던 세 번째 엄격 비교**를 찾았으니 기록해 둔다 —
`index.js:441 unwrapIfSameType` 의 `if (instance.type !== source.type) return;` 는
`===` 비교라 폴백이 없다. 이번 6건 중 이 경로를 지나는 것은 없다
(`unwrapIfSameType` 사용처는 476/561/572/583/615 = Monoid·Apply·Applicative·Alt·Alternative
이고 Filterable/Foldable/Setoid/Ord/Semigroupoid/Category 는 안 지난다). 그래서 결론은
안 바뀌지만, "폴백 없는 곳은 두 곳" 이라는 문장은 **`types.equals` 3인자형에 한해서만**
참이다. 감사 기록과 규칙 31 의 문장을 그렇게 한정하는 편이 안전하다.

**③ `lookup` 치환이 놓친 자리** — **런타임 코드에는 없다.** 확인 방법:
```
$ node -e "24개 타입클래스의 typeof T.of / typeof T.lookup 출력"
  전부 of=undefined, lookup=function
$ grep -nE "(Functor|Monoid|…24개).of\b" index.js tests docs types
  index.js:300 만 남음 → Applicative **인스턴스**의 of 검증 메시지, 의도된 것
```
"타입클래스를 값으로 받아 `.of` 를 부르는" 유형도 다시 훑었다 — `TypeClass` 를 인자로 받는
함수는 `withTypeRegistry`(711) `addResolver`(717) `normalizeTypeClassKey`(987) 셋뿐이고,
`normalizeSemigroupKey`(1432) · `normalizeConstMonoid`(1031) · `resolveFoldMonoid`(2478) 은
전부 `normalizeTypeClassKey` 를 거친다. `normalizeMonad`(2553) 의 `M.of` 는 **인스턴스**의
of 라 무관하다. **놓친 런타임 자리는 없다.**
놓친 것은 **산문 하나** — 위 7번(`types/TypeClasses.d.ts:274`).

**④ `algebra-type.test.js` 가 못 잡는 것** — 위 2·3 번이 본체다. 요약하면:
- 정규 태그를 **엉뚱하게** 적은 드리프트를 못 잡는다 (뮤테이션 3종 실측, 위 2번)
- 124개 중 120개만 훑는다 (위 3번)
- `typeOf` 복사(`tests/algebra-type.test.js:26–33`)는 지적대로 결함이다. **두 겹이다** —
  (a) `types.of` 가 바뀌면 게이트가 옛 규칙으로 조용히 통과시킨다,
  (b) 검사 대상 로직을 복제했으므로 `types.of` **자신의** 드리프트는 원리적으로 못 잡는다.
  **관측으로 바꿀 수 있다 — 복사할 필요가 없다.** `Apply` 는 공개 클래스이고
  `types.equals` 3인자형(폴백 없음)을 그대로 지난다:
  ```javascript
  const probe = t => new fp.Apply(new fp.Functor((f, x) => x, t), (a, b) => a, t, null);
  probe('Date').ap(new Date(0), new Date(0));   // 통과
  probe('date').ap(new Date(0), new Date(0));   // THROW: Apply.ap: both arguments must be date
  ```
  이러면 `REPRESENTATIVE` 만 남고 `typeOf` 사본은 사라진다. **라이브러리 로직으로
  라이브러리를 검사**하게 되므로 (a)(b) 가 동시에 닫힌다.
- 그 밖: `assert(all.length >= 120)` 의 `>=` 는 인스턴스가 **늘어나는** 것을 못 본다.
  정확한 수로 박아라(위 3번과 함께).
- 그 밖: `EXEMPT = new Set(['any'])` 는 새 인스턴스가 `'any'` 를 남용해도 통과시킨다.
  `'any'` 는 `First/Last` 둘뿐이므로 명단으로 고정하는 편이 낫다.

**⑤ `L(f, name)` 정규화** — **옳다. 이번엔 `??` 사건과 다르다.**
```javascript
const L = (f, name) => (f[name].lookup ? f[name].lookup : f[name].of);
```
`??` 가 거짓 회귀를 만든 이유는 `f.compose` 가 **양쪽 버전에 다 존재하면서 뜻이 달랐기**
때문이다(범용 합성 vs optic 합성). 여기는 그 조건이 성립하지 않는다 — 24개 타입클래스
어디에도 **정적** `of` 와 **정적** `lookup` 이 공존한 적이 없고(HEAD: `of` 만, 현재:
`lookup` 만), 타입클래스 **클래스 객체**에는 인스턴스의 `of` 가 붙지 않는다(실행 확인:
`Object.keys(Applicative)` → `Const,lookup,resolver,types`). 그리고 `L` 이 실제로 쓰인 곳은
`Semigroup`·`Monoid` 둘뿐이다. `npm run baseline b970b96` 로 확인한 차이는 **정확히 7건**
(정적 표면 1 + `.type` 6)이고 전부 의도된 변경이다. **거짓 회귀 0건.**
단, 위 4번에 적은 대로 「타입클래스 정적 표면」이 6/24 만 본다 — 넓혀라.

**⑥ 네이밍 (유형 6·7)** — **위반 없다. 조회해서 대조했다.**
```
$ node -e "24개 타입클래스의 정적 own 프로퍼티 나열"
  types, resolver, lookup  (+ Setoid/Ord 의 op, Applicative 의 Const, ChainRec 의 next/done)
$ grep -n "^const _" index.js       → 0건 (언더스코어 접두사 관례 없음. lookup 도 안 씀)
$ Object.keys(fp) 최상위 export      → baseline 상 차이 0건 (새 이름을 최상위에 안 뿌렸다)
```
- `lookup` — 소문자, 약어 아님, 언더스코어 없음. 이미 있던 `resolver`(undefined 반환)와
  **짝을 이루는** 이름이다(`lookup` = throw). 같은 범주(`types`/`resolver`/`op`)의 기존
  이름들과 형태가 같다. 그리고 이 변경은 최상위에 이름을 **하나도** 추가하지 않았다 —
  Static Land 이점 ①(no name clashes)에 부합한다.
- `tests/algebra-type.test.js` — 선례가 있다. `unit-validation.test.js`,
  `docs-examples.test.js`(하이픈), `strictmode.test.js`(횡단 관심사를 파일명으로).
  `Algebra` 는 실제 최상위 export 이름이다. **관례 부합.**
- 유형 7(주석 분량) — 새 이름 `lookup` 에 붙은 산문은 `index.js` 4줄 + `CLAUDE.md` 3줄 +
  `docs/README.md` 절 1개다. 5줄 임계를 넘지만 **공개 API 변경이므로 문서 절은 정당**하다.
  문제는 분량이 아니라 위 4번(그 산문을 테스트로 안 바꾼 것)이다.

**⑦ 파괴적 변경 처리** — 위 6번. **마이그레이션 가이드·버전 표기는 요구하지 않는다**
(`private: true`, `version: 0.0.0`). 요구하는 것은 **BREAKING 의 범위를 정확히 적는 것**이다
— 지금 깨진 것은 `index.js` 이고 `dist/` 는 안 깨졌다. 그리고 에러 메시지 4종 변경(위 5번)이
커밋 메시지에는 있는데 격자에는 없다.

---

## 확인했으나 문제없던 항목

**기준 1 — Static Land 이점 3가지**

| | 조회한 것 | 판정 |
| --- | --- | --- |
| ① No name clashes | `npm run baseline b970b96` 의 「최상위 export 키」 → **차이 없음**. `lookup` 은 타입클래스 정적 메서드로만 산다 | ✅ |
| ② Multiple instances per type | `Monoid.types` 키 조회 → `NumberSumMonoid`/`NumberProductMonoid`/`NumberMaxMonoid`/`NumberMinMonoid` 전부 살아 있고 `lookup` 으로 꺼내진다. 인스턴스 총 124개, 키 230개 — 새로 만들고 안 올린 것 0건 | ✅ |
| ③ Built-in type support | `normalizeTypeClassKey`(987)가 **키 또는 인스턴스**를 계속 받는다. `Applicative.Const(사용자Monoid)`·`Maybe.Monoid(사용자SG)` 경로가 `lookup` 치환 후에도 동작(문서 예제 검사기가 잡아서 고친 그 자리) | ✅ |

**기준 3 — 실패 7유형**

| 유형 | 조회한 것 | 판정 |
| --- | --- | --- |
| 1. 레지스트리에 있는 것을 사설로 재구현 | 두 커밋의 `index.js` diff 전체 확인 — 새 `{empty,concat}`/`{of,map,ap}`/`{dimap}` 딕셔너리 **0건**. 커밋 1은 문자열 6개, 커밋 2는 이름 치환뿐 | ✅ 없음 |
| 2. 인스턴스를 만들고 미등록 | 동일. 새 인스턴스 0개. (기존 `Setoid/Ord.lookup('default')` 는 이 유형에 가깝지만 선행 결함이라 3번에 참고로 기록) | ✅ 없음 |
| 3. 최상위 bare export | baseline 「최상위 export 키」 차이 0건 | ✅ 없음 |
| 4. YAGNI 로 구조 교정 기각 | **위반 4번** — `of` 제거를 테스트로 안 박은 근거 | ❌ 위반 |
| 5. 전제가 다른 곳의 결론을 가져옴 | 두 커밋 메시지·감사 기록·`docs/README.md` 신설 절 전부 확인 — 다른 언어/라이브러리 인용 **0건**. 근거는 전부 이 파일의 실측(`types.check` 폴백, `checkAndSet` 규칙, 뮤테이션) | ✅ 없음 |
| 6. 네이밍이 관례 이탈 | 위 ⑥ | ✅ 없음 |
| 7. 이름이 못 지는 짐을 주석이 진다 | `lookup` 산문은 정당(공개 API). 단 **스테일 주석 2건**이 나왔다 → 위반 1번·7번 | ❌ 위반 |

---

## 다시 실행할 명령 모음

```bash
# 게이트가 못 잡는 것 재현 (전 스위트 초록)
sed -i '' "s/super((f, pred) => a => pred(f(a)), 'function'/super((f, pred) => a => pred(f(a)), 'Maybe'/" index.js
node tests/algebra-type.test.js; echo "gate=$?"      # -> 0
node tests/run.js | grep "test files"                 # -> 39 passed, 0 failed
git checkout index.js

# 감시 범위 120 vs 실제 124
node --input-type=module -e "import fp from './index.js';
const TC=['Setoid','Ord','Semigroup','Monoid','Group','Semigroupoid','Category','Filterable','Functor','Bifunctor','Contravariant','Profunctor','Apply','Applicative','Alt','Plus','Alternative','Chain','ChainRec','Monad','Foldable','Extend','Comonad','Traversable'];
const byId=new Map(), cap=new Map();
for(const n of TC) for(const [k,v] of Object.entries(fp[n].types)){ byId.set(v,1); if(k[0]===k[0].toUpperCase()) cap.set(k,v); }
console.log('unique', byId.size, 'gate sweeps', cap.size);"

# .type 이 없는 조회 결과
node --input-type=module -e "import fp from './index.js';
console.log(fp.Setoid.lookup('default'), fp.Setoid.lookup('default').type);"

# 에러 메시지 4종 (테스트·격자에 없는 변화)
node --input-type=module -e "import fp from './index.js';
const t=f=>{try{f()}catch(e){console.log(e.message)}};
t(()=>fp.Setoid.lookup('date').equals(1,2));
t(()=>fp.Filterable.lookup('object').filter(x=>x,5));"

# 3인자 types.equals 전수
grep -nE "types\.equals\([^)]*,[^)]*,[^)]*\)" index.js

# 스테일 산문
grep -n "ObjectFilterable/ObjectFoldable" index.js
grep -n "TypeClass.of" types/TypeClasses.d.ts
```
