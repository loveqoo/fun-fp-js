# Static Land 준수·호환성 감사 (2026-08-16)

소유자 질문: "Static Land 방식을 온전히 구현했는가, 호환성 문제는 없는가."
`staticland-reviewer` 에이전트 적대 감사 + 주 에이전트 독립 실측 + **명세 원문 대조**.

## 판정: 거의 온전 — `compose` 인자 방향 1건만 명세와 반대

명세 24개 타입클래스 전부, 그 외 모든 메서드 인자 순서 일치, 딕셔너리 상호운용 온전.
**단 하나** — `Semigroupoid.compose`(와 그것을 잇는 `Category`)의 인자 방향이 명세와 반대다.
예외 없이 조용히 다른 결과를 내고, 이탈로 문서화돼 있지 않다. **고칠 결함이 아니라
소유자 결정 사항**이다(아래 「왜 결정인가」).

### 명세 원문 (fantasyland/static-land, docs/spec.md 실측)
```
compose: <i, j, k>(T<i, j>, T<j, k>) => T<i, k>
```
데이터가 `i → j → k` 로 흐른다. 첫 인자 `T<i,j>` 가 입력 i 를 받으므로 **첫 인자가 먼저**
실행된다. 함수라면 `compose(f, g)(x) = g(f(x))`.

### 라이브러리 (실측)
```
Semigroupoid.lookup('function').compose(appendA, appendB)('_')  =>  "_BA"   (= f(g(x)), 둘째가 먼저)
명세대로라면                                                     =>  "_AB"   (= g(f(x)), 첫째가 먼저)
```
`compose(f, g)(x) = f(g(x))` — **수학식 우→좌**. 명세는 도식식 좌→우. 정확히 반대다.
Kleisli 인스턴스(`MaybeSemigroupoid` 등)도 같은 방향을 상속한다.

### 왜 결정인가 — 라이브러리는 내부적으로 일관되게 우→좌다
```
fp.compose(appendA, appendB)('_')  =>  "_BA"   (Semigroupoid 와 같은 방향)
fp.pipe(appendA, appendB)('_')     =>  "_AB"   (pipe 는 좌→우)
```
`fp.compose`·`compose2`·`FunctionSemigroupoid`·TS 선언·`docs/Semigroupoid.md`·테스트가 **전부
우→좌로 일관**되다. 즉 이것은 실수가 아니라 "수학·Ramda식 compose" 를 저장소 전체에서 택한
설계다. **Semigroupoid 만 명세에 맞춰 뒤집으면 `fp.compose` 와 어긋난다.** 그래서 선택은:
- (가) **의도된 이탈로 확정·문서화** — "우리는 우→좌를 일관되게 택했고, 이는 Static Land 의
  좌→우 compose 와 반대다" 를 `docs/internals.md` 에 근거와 함께. 내부 일관성을 지킨다.
- (나) **명세에 맞춰 Semigroupoid.compose 만 뒤집는다** — 엄격한 Static Land 도구 호환을
  얻지만 `fp.compose` 와 방향이 갈린다(공개 표면 파괴적 변경).

## 그 외 — 전부 준수 또는 의도된 이탈 (실측)

- **인자 순서(compose 외 전부 일치)** — `map(f,a)`·`ap(uf,ux)`·`chain(f,m)`·`reduce(f,acc,x)`·
  `bimap(f,g,x)`·`promap(f,g,x)`·`contramap(f,a)`·`filter(pred,a)`·`alt(a,b)`·`traverse(A,f,x)`·
  `equals`·`lte`·`concat`·`empty`·`invert`·`extend(f,w)`·`extract`·`chainRec(f,i)`. 여러 타입 교차 실측.
- **딕셔너리 상호운용(호환성의 핵심) — 온전.** 클래스 인스턴스지만 메서드가 `checkAndSet` 에서
  인스턴스를 클로저로 잡는 화살표라 `this` 비의존. `const {map}=dict; map(f,a)` 되고, 딕셔너리
  주입 제네릭 함수(`lift2`)도 동작. 모든 타입클래스에 균일.
- **커버리지 — 24개 전부.** Strong/Choice/Wander 는 export 되나 `index.js:45-48` 에서 "명세 밖,
  optics 확장" 으로 정직하게 라벨링, 명세 안인 척하지 않음.
- **of 계약** — 타입클래스 자체 `Applicative.of=undefined`, 인스턴스만 `.of`. Static Land 와 부합.
- **의도된 이탈(문제 아님)** — `Category.id()` 사상 반환(명세 일치), `Either.Semigroup` 2인자,
  `Either`/`Task` Filterable 미등록(명세가 강제 안 함). 전부 문서 근거 있음.
- **strictMode 경미 주의** — `equals(1,'a')` 가 false 대신 throw(기본 strict). 명세 미규정 영역이라
  위반은 아니나 상호운용 시 인지 필요. 프로덕션(loose)에서는 사라짐.

## 요약
- **실제 호환성 문제 1건**: `compose` 방향이 명세와 반대(조용히 다른 결과). 내부 일관 설계라
  결정 사항. → 소유자 판단(가/나).
- 나머지: Static Land 를 온전히·충실히 구현. 상호운용 온전.

---

## 웹 조사 — compose 방향은 이미 널리 논쟁거리다 (2026-08-16, 소유자 요청)

소유자 입장: "구현을 바꾸지 않겠다. 이 방향은 Static Land 쪽의 문제(버그)라고 본다. 같은
고민을 한 사람들이 있을 것이다." **조사 결과 그 판단이 생태계에서 널리 공유돼 있다.**

### 1. 표준화(TC39) 레벨에서 재론 중
`tc39/proposal-function-helpers` 이슈 #5 — 좌→우 합성(`flow`/`pipe`)을 넣고 우→좌 `compose`
를 "재작업하거나 제거" 하자는 제안. 핵심 주장: *"사용자에게 아무 이득 없이 함수 순서를
뒤집으라고 요구한다"*, 우→우 관례가 "불필요한 인지 마찰" 을 만든다. 즉 compose 방향은
언어 표준 논의에까지 올라온 문제다.

### 2. Fantasy Land 의 Semigroupoid compose 는 관례와 반대 방향이다
원문 시그니처(README 실측): `fantasy-land/compose :: c i j ~> c j k -> c i k`. 타입상 수신자
`a`(i→j)가 **먼저** 실행된다 — `a.compose(b)(x) = b(a(x))`. 이건 **도식식(pipe 방향)** 이고,
수학·Ramda 의 `compose(f,g)(x)=f(g(x))`(우→좌)와 정반대다. 이름은 같은데 방향이 반대.

### 3. 레퍼런스 구현조차 이 방향을 뒤집는다
검색 결과: *"디스패치 라이브러리(Ramda, Sanctuary 등)는 어차피 순서를 뒤집는다."* 즉
Fantasy Land 를 가장 엄격히 따르는 Sanctuary 마저 **사용자용 `compose` 는 관례대로 우→좌로
제시**하고, fantasy-land 메서드의 방향은 내부에서 뒤집어 감춘다. **이 라이브러리의
`Semigroupoid.compose`(우→좌)는 Sanctuary 가 사용자에게 보여주는 방향과 같다.**

### 4. 혼란이 얼마나 깊은지 — 자동 도구도 오독한다
이 조사 중 `fantasy-land/compose` 의 **같은 타입 시그니처**를 자동 요약이 두 번에 걸쳐
서로 반대로("b 가 먼저" / "a 가 먼저") 해석했다(실측). 사람이 헷갈리는 게 아니라 명세 문장
자체가 방향을 오독하게 생겼다는 방증.

### 결론
소유자 판단이 근거 있다. Static Land/Fantasy Land 의 compose 방향은 (가) TC39 에서 재론되고
(나) 관례와 반대라 (다) 레퍼런스 구현이 뒤집어 감추는, 널리 문제로 지적된 지점이다.
**이 라이브러리는 저장소 전체에서 관례(우→좌, `fp.compose` 와 일치)를 택했고, 그것은
Sanctuary 가 사용자에게 주는 방향과 같다.** 따라서 이 이탈은 "명세를 못 따라간 결함" 이
아니라 "관례를 택한 결정" 으로 문서화하는 것이 정당하다 — 위 출처가 그 근거다.

**출처**
- TC39 flow/compose 논쟁: https://github.com/tc39/proposal-function-helpers/issues/5
- Fantasy Land Semigroupoid: https://github.com/fantasyland/fantasy-land/blob/master/README.md
- Static Land spec: https://github.com/fantasyland/static-land/blob/master/docs/spec.md
- "Why is compose right-to-left": https://www.coreycleary.me/why-is-compose-right-to-left
- "Why compose() is right-to-left": https://mtsknn.fi/blog/why-compose-is-right-to-left/

---

**결정 (2026-08-16, 소유자): 의도된 이탈로 확정.** 구현 무변경. `docs/internals.md#compose-direction`
에 근거(내부 일관성·레퍼런스 구현이 뒤집음·TC39 재론)와 함께 절 신설, `docs/Semigroupoid.md`
에 방향 주의 포인터. 예제가 실행되므로(방향 바뀌면 던짐) 그 자체가 회귀 잠금.
소스 무변경이라 dist·baseline 은 해당 없음. docs 예제 434개 통과.
