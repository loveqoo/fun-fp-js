# 합성 감사 — 개별 구현했지만 합성으로 되는 자리 (2026-08-15)

소유자 요청: *"우리가 만든 함수들 중에 합성으로 해결이 가능한데, 개별구현한 부분이 있는지
검사해주십시오."* 전체 3,337줄을 훑었고, 동등성 주장은 전부 실측했다(대조 22건, 불일치 0건
— 스크립트는 세션 스크래치의 `compose-audit.mjs`). **아무것도 고치지 않았다** — 적용 여부와
범위는 소유자 결정.

## A. 있는 조각을 안 쓴 자리 — 과거 판정과 같은 유형, 동작 동일 실측

과거 선례: 1차 optics(항등을 손으로 끼움 → `Contravariant`), 2차-6(`FunctionFunctor` 람다
→ `compose2`), Lens(튜플 리터럴 → `tuple`).

| # | 자리 | 지금 | 합성으로 |
| --- | --- | --- | --- |
| A1 | 트랜스포머 `lift` 4곳 ([`index.js:2987`](../../index.js#L2987) `3038` `3095` `3147`) | `new LiftF(ma, a => a)` | `identity` |
| A2 | `ST.get`([`2983`](../../index.js#L2983)) · `RT.ask`(`3088`) · `Reader.ask`(`2119`) | `s => s` / `env => env` | `identity` |
| A3 | `PredicateContravariant`([`913`](../../index.js#L913)) | `(f, pred) => a => pred(f(a))` | `(f, pred) => compose2(pred, f)` (= `flip2(compose2)`) |
| A4 | `FunctionProfunctor`([`926`](../../index.js#L926)) | `(f, g, fn) => x => g(fn(f(x)))` | `(f, g, fn) => compose(g, fn, f)` |
| A5 | Prism 의 from 자리([`2803`](../../index.js#L2803)) | `e => (e.isLeft() ? build(e.value) : e.value)` | `e => Either.fold(build, identity, e)` — 같은 파일의 Forget Choice 가 이미 이렇게 쓴다 |
| A6 | Prism 의 to 자리([`2801`](../../index.js#L2801)) | `a => Either.Left(a)` | `Either.Left` (에타 축약) |
| A7 | 교차 타입 변환 6곳: `Task.fromEither`(`1854`) · `Either.toMaybe`(`2340`) · `Maybe.toEither`(`2332`) · `Validation.fromEither`(`2030`) · `Validation.prototype.toEither`(`2033`) · `ET.fromEither`(`3039`) | `isRight() ?` 삼항으로 **남의 내부를 직접** 읽음 | 각 타입의 `fold` 로 — 예: `Either.fold(Task.rejected, Task.of, e)` |
| A8 | `Reader.asks`([`2120`](../../index.js#L2120)) | `f => new Reader(env => f(env))` | `f => new Reader(f)` (에타 축약 — 함수 검사는 생성자가 이미 한다) |
| A9 | `ArrayComonad.extract`([`1356`](../../index.js#L1356)) | `arr => arr[0]` | `fst` |
| A10 | `State.eval/exec`([`2225`](../../index.js#L2225)) · `ST.eval/exec`(`2973`·`2977`) | `run(s)[0]` / `[1]`, `([a]) => a` | `fst` / `snd` |
| A11 | `FirstSemigroup`([`1107`](../../index.js#L1107)) · `BooleanXorGroup.invert`(`975`) | `x => x` | `identity` (first 의 concat 은 첫 인자 반환 = identity 의 이항 사용, 실측 동일) |
| A12 | `Validation.collect` 끝부분([`2051`](../../index.js#L2051)) | `reduce((acc, v) => ap(acc, v), Valid(curriedF))` — **`lift` 의 몸을 재구현** | `lift(Applicative.lookup('validation'))(f)(...)` (성공·누적 실측 동일) |

주의 하나: `compose2` 는 인자 함수 검사를 지나므로 A3·A4 는 호출마다 검사 비용이 붙는다.
`FunctionFunctor` 가 이미 `compose2` 를 쓰므로 선례는 그 비용을 용인한 쪽이다.

## B. 패밀리 — 한 곳이 아니라 스타일 결정이 필요한 것

| # | 무엇 | 규모 |
| --- | --- | --- |
| B1 | 튜플 리터럴 `[a, b]` — `State.of/get/put/modify/gets`, `StateFunctor/Apply/Chain`, `Writer.run/listen/listens`, `TupleBifunctor` | 약 12곳. Lens 는 `tuple()` 로 고쳤는데(1차 판정) 이쪽은 리터럴이다. 전부 맞출지, Lens 만 특수(합성 경로라서)로 볼지 |
| B2 | Kleisli `Semigroupoid` 3형제(maybe `1433` · either · task `1891`) | 몸이 전부 `(f, g) => x => chain(f, g(x))` — 공용 헬퍼 하나로 접힌다 |
| B3 | `Maybe.pipe`(`2333`) / `Either.pipe`(`2341`) | 성공 판정자만 다른 같은 몸 — 공용 뼈대 후보 |

## C. 그대로가 맞아 보이는 자리 — 이유와 함께

- **인스턴스 본체의 자기 타입 삼항** (`MaybeFunctor` 의 `m.isJust() ? …` 등 15곳 안팎):
  `fold` 로 쓸 수는 있으나, 자기 내부 표현을 읽는 것은 그 타입의 소관이다. Optics 판정
  (2026-08-14)의 과녁은 **남의 내부**를 읽는 것이었다. fold 경유는 호출마다 클로저를 만들어
  성능·가독 양쪽에서 손해다.
- **`ObjectFoldable`** 의 `Object.values(obj).reduce` — `ArrayFoldable` 위임도 가능하나
  네이티브 직행이 더 명료하다.
- **`FreeApply`** — `ap` 을 `chain`+`map` 합성으로 유도한 모범 사례(이미 합성).

## 적용하면 무엇이 좋아지나 / 안 하면 무엇이 아픈가

좋아지는 것: 같은 개념이 한 이름으로 모인다 — `identity` 를 고치면 7곳이 같이 고쳐지고,
`fold` 를 지나면 내부 표현이 바뀌어도 변환 함수 6곳이 안 깨진다. 안 하면: 당장 깨지는 것은
없다(전부 동작 동일). 아픈 것은 다음 변경 때다 — 예컨대 `Either` 내부 표현을 손대면 fold 를
안 지나는 6곳이 각각 터진다.

---

**적용 (2026-08-15)** — 소유자 결정 *"일단 A"* 로 A 전부 적용(23개 치환). B 는 보류.
검증은 `.dev/TODO.md` 「합성 감사, A 목록 적용」 항목에: 전후 한 프로세스 대조 33건 중
32건 동일, 차이 1건은 `Reader.asks` 의 fail-fast 개선(위 A8 에 예고된 그것).

**B 목록 종결 (2026-08-15)** — B2(Kleisli 3형제 → `kleisliCompose`)·B3(pipe 쌍둥이 →
소유자 설계의 `pipeWhile`, `fp.pipeWhile` 로 공개) 적용. **B1(튜플 리터럴)은 기각** —
소유자: "Tuple 의 정의가 배열과 같다면 굳이 재정의할 필요는 없다." `tuple` 은 검사도
태그도 없는 이름이라 리터럴을 바꿔도 울타리가 0이다. Lens 가 특수했던 이유(optics 합성
경로)는 `.dev/TODO.md` 에 기록. 이로써 이 감사의 항목은 전부 종결됐다.
