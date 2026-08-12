# 적대적 리뷰 — optics 를 Optics 모듈로 (회차 1)

리뷰어: `staticland-reviewer` (백그라운드, 도구 호출 39회, 15분)
**규칙 21 의 첫 적용** — 블로킹이 아니라 백그라운드로 돌려 그동안 다른 일을 했다.

## 판정: 위반 12건

> `npm test` 38/38 초록 + `tsc` 통과였다. 그 초록이 아래를 하나도 못 잡았다.

## 가장 무거운 것 — #11 내가 사용자에게 준 근거가 거짓이었다

이름을 정할 때 이렇게 보고했다: **"대문자 38개는 전부 `.of()` 를 가진 타입이고
소문자 3개는 함수 묶음"**. 실측하면 틀렸다:

```
대문자 export 39개 중 .of 가 없는 것 6개(Optics 제외):
  Algebra, StateT, EitherT, ReaderT, WriterT, Actor
IIFE 로 묶은 함수 묶음 모듈: transducer(소문자), extra(소문자)  → 2/2 소문자
```

**실재하는 관례는 "IIFE 함수 묶음은 소문자" 이고 `Optics` 가 그것을 깬다.**

결정 자체는 방어 가능하다 — `Actor`/`StateT` 처럼 `.of` 없는 대문자 네임스페이스 부류다.
**문제는 근거를 지어냈다는 것**이고, 하필 **네이밍 재발 방지책을 만들면서** 그랬다.

→ 회차 2 일순위: `CLAUDE.md` 에 실제 관례를 표로 명문화한다.

## 회귀 1건 — #5 에러 라벨

```
preview(null, [])  HEAD: 'preview: optic must be a function'   현재: 'foldMapOf: ...'
toList(null, [])   HEAD: 'toListOf: ...'                       현재: 'foldMapOf: ...'
view(null, [])     'view: ...'  ← 자기 검사가 있어 살아남음
```

`runOptic(name, ...)` 이 `name` 을 받는 유일한 이유가 호출자 귀속인데 재정의로 잃었다.
`tests/optics.test.js` 에 `preview:`/`toList:` 메시지 단언이 0건이라 영구 잠복이었다.

## #6 `foldMapOf` 무검사 — 검사 여부가 optic 종류에 따라 갈린다

```
foldMapOf({hello:'world'}, Lens,  x=>x, {a:1})  => 1    조용히 성공
foldMapOf({hello:'world'}, Iso,   x=>x, 3)      => 6    조용히 성공
foldMapOf({hello:'world'}, Prism, x=>x, 5)      => THROW 'monoid.empty is not a function'  라벨 없음
foldMapOf(Monoid.of('array'), Lens, 42, {a:1})  => THROW 'p is not a function'             라벨 없음
```

`forgetProfunctor(monoid)` 가 `first` 경로에서 monoid 를 안 만지기 때문이다.

**리뷰어 단서**: `Symbols.Monoid` 를 요구하면 Static Land 이점 ③(등록 안 된 사용자
인스턴스 수용)이 죽는다 — 지금 `{empty, concat}` 리터럴이 실제로 동작한다. **duck-typing 으로.**

## #4 d.ts 12키 중 6개는 지워도 tsc 가 못 잡는다

뮤테이션 실측:

```
NOT CAUGHT: Iso, Prism, traversed, compose, preview, review
caught    : Lens, view, toList, foldMapOf, over, set
```

## 나머지

| # | 내용 |
| --- | --- |
| 1 | `Applicative.Const` 가 키를 못 받고 레지스트리에 안 들어간다. `Maybe.Monoid` 선례는 `_keyCache`/`_instanceCache` 쌍 |
| 2 | `IdentityApplicative` 가 Functor/Apply 를 익명 생성 — 등록된 다른 7개 Applicative 는 전부 등록된 Apply 로부터 만든다. `Functor.of('identity')` → THROW |
| 3 | `ApplicativeInstances` 에 `identity` 없음 — TS 에서 `Applicative.of('identity')` 가 컴파일 에러 |
| 8 | `foldMapOf` 가 `docs/README.md` 에 이름만 있고 `docs/Optics.md` 에 설명·예제 **0건** |
| 9 | `CLAUDE.md` 7곳. 특히 **L204 가 `identityApplicative`/`constApplicative` — 코드에 존재한 적 없는 이름** |
| 10 | `unwrapIfSameType` 주석의 성능 근거가 사실과 반대 — 같은 diff 가 `bimap` 으로 원소마다 레지스트리 조회를 넣어 1.37~1.60배 느려졌다 |
| 12 | `foldMapOf` 테스트 6건이 **전부 양성 경로**. `assertThrowsWith` 0건 |
| 7 | 격자 42케이스 사망 — **리뷰어가 읽기 전에 이미 고쳤다**(`is not a function` 0건 확인) |

## 리뷰어가 확인하고 문제없다고 한 것

- **① No name clashes 달성** — 제거 11개 / 추가 1개, `'view' in fp` → false
- **유형 1(레지스트리 중복) 0건** — `Profunctor`/`Bifunctor`/`Comonad`/`Monoid`/`Traversable`
  위임을 전부 대조. `Either.fold` 인자 순서, `constant(b)` 동치까지 확인
- **IIFE 안전** — `load()` 뒤에 놓였고 즉시 평가는 `Profunctor.of('function').promap` 하나뿐
  (HEAD 도 같은 위치에서 같은 조회). 나머지는 호출 시점 조회
- **`foldMapOf` 인자 순서 일관적** — 저장소 관례는 "딕셔너리 → f → 컨테이너"
  (`foldMap(foldable, monoid)(f)(fa)`, `sequence(applicative, ta)`, `over(optic, f, s)`).
  **Haskell 인용은 하지 않는 게 맞다** — 거긴 Monoid 가 타입 클래스 제약이라 비교가 성립 안 함
- **`toList`/`preview` 의 `foldMapOf` 재정의는 동작 동일** — 59케이스 값 차이 0건
- **`Optics.compose` 는 0/1 인자 포함 HEAD 와 동치**
- **`Optics` 내부 이름은 일관적** — 대문자 = 생성자, 소문자 = 연산
- 유형 4(YAGNI) 0건 — `foldMapOf` 신설이 회차 1 리뷰 #4 의 실제 해결이다
- `docs/` 38블록 전부 실행, 산문에 옛 이름 0건

## 처리

회차 2 계획서(`.dev/plan/260812-d36358-2-review-fixes.md`)로. 일순위는 **#11 관례 명문화**다 —
근거를 지어내지 않으려면 조회할 곳이 있어야 한다.
