# 변경 기록

배포된 버전의 변경과, 아직 버전이 안 붙은 `main` 의 변경(「미발행」)을 적습니다.
상세한 경위는 `git log` 와 `.dev/` 에 있습니다.

## 미발행 — `main` 에 있고 다음 버전을 기다리는 변경

dist 파일만 받아 쓰는 경우: 헤더의 `Commit:` 줄이 그 파일이 이 절의 어느 지점까지
담고 있는지를 가리킵니다.

### 파괴적 변경

- `Writer.exec()` 는 이제 값이 아니라 **출력(로그)** 을 돌려줍니다 — 같은 라이브러리의
  `State.exec`, 그리고 Haskell `execWriter` 관례와 정렬. 값이 필요하면 신설
  `Writer.eval()` 을 쓰십시오.
- `transducer.transduce` 가 4단 커링에서 **4인자 단일 호출**로 바뀌었습니다:
  `transduce(변환기, 리듀서, 초기값, 컬렉션)` — 라이브러리의 다른 문과 같은 비커리드.

- **객체 복제가 동결 객체를 갱신 못 하던 것을 고쳤습니다.** 서술자를 통째로 옮기면서
  `configurable: false` 까지 옮겨져, `Object.freeze` 한 객체를 `Optics.prop` 이나
  `transducer.into` 로 갱신하면 `Cannot redefine property` 로 죽었습니다. 복제는 데이터를
  옮기는 일이지 원본의 자물쇠를 물려주는 일이 아닙니다 — 열거 여부와 접근자 여부는 그대로,
  쓰기·재정의 제한은 안 옮깁니다.
- **`Free` 재진입 가드가 thenable 을 Promise 로 동화해서 돌려줍니다.** 전에는 thenable 을
  그대로 돌려줘서, 호출자가 다시 기다릴 때 `then` 이 **한 번 더 불렸습니다** — 부수 효과가
  두 번 실행됐습니다.
- **객체 복제가 심볼·숨은 속성을 잃던 것을 고쳤습니다.** `Optics.prop` 의 `set` 과
  `transducer.into` 의 그릇 복제가 열거 가능한 문자열 키만 옮겨, 심볼 속성과
  non-enumerable 속성이 조용히 사라졌습니다. `prop` 은 읽은 값을 그대로 다시 넣어도
  원본이 안 나왔습니다(렌즈 Get-Put 위반). 이제 속성 서술자를 통째로 옮깁니다 —
  접근자도 접근자로 남고, own `__proto__` 가 프로토타입으로 둔갑하지도 않습니다.
- **`Task.filter` 의 술어가 던지면 거부로 도착합니다.** 원본 Task 가 비동기로 정착하면
  술어는 `Task` 생성자의 `try` 밖에서 돌아, 예외가 `uncaughtException` 으로 새고 그
  Task 는 **영영 안 열렸습니다**(무음 정지).
- `Optics.prop` 이 TypeScript 선언에 없어 타입으로는 못 쓰던 것을 고쳤습니다.
- **`ChainRec` 이 규격 밖 걸음을 거부합니다.** 걸음은 주어진 `next`/`done` 으로 만들어야
  하고, 그 밖의 값은 `ChainRec.chainRec: step must be next(...) or done(...)` 로 거부합니다.
  전에는 **종료로 읽었고**, 그래서 콜백의 오타가 조용히 성공이 됐습니다 — `done` 을 깜빡한
  맨 값 `42` 는 결과가 `null` 이 됐고, `{ tag: 'nxt' }` 오타는 계속해야 할 것이 끝났습니다.
  `Task` 는 던지지 않고 **거부로 도착합니다**(비동기 걸음에서 던지면 아무도 못 받습니다).
- **`Actor` 에 기본 타임아웃 1초가 생겼습니다.** 핸들러 하나가 1초를 넘기면 그 메시지는
  `timedOut === true` 표식을 지닌 거부로 끝나고 큐가 다음으로 넘어갑니다. 전에는 정착하지
  않는 핸들러가 큐를 **영구히** 막았고 뒤이은 메시지의 Task 도 오지 않았습니다(무음 정지).
  오래 걸리는 핸들러가 정상이라면 `timeout: Infinity` 로 끄십시오.
- **`Actor` 구독자가 이제 메시지 순서대로 알림을 받습니다.** 전에는 큐 진행을 먼저 확정하고
  통지해서, 앞 메시지가 늦으면 구독자가 **역순**으로 받았습니다(상태는 순서대로였습니다).
  옛 동작이 필요하면 `notifyInOrder: false` 입니다.
- 최상위 `into` 가 **`pipeFrom`** 으로 바뀌었습니다 — `transducer.into`(Clojure 의미의
  그릇 붓기)와 동명이라 이름으로 찾으면 엉뚱한 쪽이 잡혔습니다. 뒤집힌 pipe 라는 뜻
  그대로 pipe 가족에 합류합니다: `into(5)(f, g)` → `pipeFrom(5)(f, g)`.

### 새 기능

- **`Store` 코모나드** — State 의 쌍대. `(조회: S -> A, 초점: S)` 둘로 이뤄지고,
  `extract`/`peek`/`seek`/`experiment`/`map`/`extend` 여섯 문을 둡니다. `extend` 는
  한 위치만 보는 국소 규칙을 판 전체의 갱신으로 넓힙니다(라이프 게임이 대표 사례 —
  [`docs/Store.md`](./docs/Store.md)). 반복 `extend` 의 지수 폭발은 옵트인 `Store.memo(store, keyOf)` 로
  잡습니다 — `keyOf` 는 필수이며(옳은 기본 키가 없음을 코덱스 리뷰가 실측), 캐시를 본체에 숨기지 않은 이유와 함께
  [`docs/internals.md#store-perf`](./docs/internals.md#store-perf).
  `Functor`/`Extend`/`Comonad` 레지스트리에 `store` 키로 등록됩니다.

- **함수 타입이 모나드가 됐습니다** — `'function'` 키에 `Apply`·`Applicative`·`Chain`·`Monad`
  넷이 등록됩니다. 맨 함수를 감싸지 않고 `Monad.lookup('function').chain(...)` 으로 씁니다.
  문헌이 **Reader 모나드**라 부르는 그것이며, `Reader` 로 감싼 것과 값이 같습니다.
  감싼 `Reader` 는 그대로 남습니다 — `ReaderT` 는 표식을 지고 있는 쪽에만 붙습니다.
  Static Land 가 "modules that work with built-in types as values" 를 자기 장점으로 적어 둔
  자리이고, Haskell·cats 도 함수의 모나드 인스턴스를 갖고 있습니다.
  [`docs/internals.md#function-monad`](./docs/internals.md#function-monad)

- **`Free.api(...이름)`** — 어휘만 선언하면 명령 함수와 해석기 문이 나옵니다. Free 를
  몰라도 프로그램/실행 분리를 씁니다. (처음 `Free.dsl` 로 나왔다가 곧바로 개명 —
  에러 문안 접두도 `Free.api:` 입니다.)
- **`Free.interpreters(...해석기)`** — 여러 api 의 해석기를 하나로. 명령의 출처
  표식으로 라우팅하므로 이름이 겹쳐도 조율이 필요 없고, 부분 교체(한 모듈만 mock)가
  합성 한 줄로 됩니다.
- **`해석기.start(program)`** — `{ promise, cancel }` 손잡이. `cancel()` 은 다음 명령
  경계에서 발효하는 협조적 취소이고, 취소된 실행은 `cancelled === true` 표식의 거부로
  도착합니다. `run` 은 그대로입니다.
- **`Reducible`** — 빈 경우가 없는 접기의 타입 클래스(명세 밖, Foldable 상속).
  전용 문서는 [`docs/Reducible.md`](./docs/Reducible.md) 입니다.
  `reduceLeft`/`reduceMap` 이 NonEmptyList 의 정적 문에서 계약으로 승격했고,
  Identity 가 두 번째 인스턴스로 섭니다(같은 이유로 `IdentityFoldable` 도 신설 —
  `foldMap` 에 Identity 를 넘길 수 있게 됩니다). 거부 문안의 주인이
  `NonEmptyList.…` 에서 `Reducible.…` 로 바뀝니다(정적 문은 위임으로 존속).
- **`NonEmptyList`** — 비어 있을 수 없는 목록. 비지 않음을 구조(head 자리)가 보증해,
  `extract` 가 항상 값을 주고(배열 Comonad 의 빈 배열 구멍이 없는 자리) `reduceLeft`/
  `reduceMap` 이 Monoid 없이 Semigroup 만으로 접습니다 — `first`/`last` 가 처음으로
  접기에 들어옵니다. 인스턴스 13개 등록(ChainRec·Reducible 포함), Monoid·Plus·Alternative·Filterable 은 의도된
  부재(항등원·zero·거르기가 전부 "빈 목록"을 뜻하므로). 빈 배열의 입구는 `fromArray`
  → `Maybe` 하나뿐입니다.
- **`MonadError`** — 실패를 일급으로 다루는 타입 클래스(명세 밖). `raiseError` 로
  만들고 `handleError` 로 잡습니다. Task·Either 등록, 법칙 4개가 게이트에서 돕니다 —
  실패를 만들고 잡는 연산 자체를 전용 법칙으로 고정한 첫 클래스입니다.
- **Task 비동기 법칙 게이트** — 기존 법칙 게이트가 비동기 Task 를 관측하지 못하던
  사각을 새 게이트(등식+생존성+일회 정착)가 덮습니다.
- **`Actor` 의 `handle` 이 Promise 도 받습니다** — `Free.api` 해석기 핸들러와 같은
  관용도(값·Promise·Task). `it.run(program).then(v => [v, 새상태])` 를 그대로 넘길 수
  있습니다.
- **`transducer.into(그릇, 변환기, 입력)`** — 그릇(배열·문자열·Set·Map·객체) 타입에서
  리듀서를 유도합니다. Clojure 의미: 그릇 내용 보존, 원본 불변.
- **`fp.pipeWhile(판별자)`** — 판별자가 참인 동안만 잇는 pipe.
- **`Applicative.Writer(모노이드)` / `Monad.Writer(모노이드)`** — Array 전용이던 Writer
  를 임의 모노이드로.
- dist 헤더에 `Version:`·`Changelog:`·`Commit:` 줄 — 벤더링 사용자가 파일 안에서
  버전·변경 이력 위치·정확한 내용 시점을 얻습니다.

### 고침 (요약)

- 적대 감사 4회(코덱스)로 정확성 결함 24건+ 수리 — 무음 정지 계열(Task·Actor·
  Free 러너), 레지스트리 캐시·별칭 충돌, 모노이드 혼합 거부, own-property 가드,
  Actor 통지 정합성, 객체 `into` 의 `__proto__` 쌍, `Free.api` 깊은 map 구성 O(n²)
  → O(n) 등. 각 수리는 되돌리면 빨개지는 게이트와 함께 들어갔습니다.
- `Free.api.run` 거부 문안이 동명 명령 상황에서 원인을 지목합니다.
- **`NonEmptyList` 의 `chainRec` 과 `traverse` 도 같이 고쳤습니다.** `chainRec` 은 느린 데
  그치지 않고 **갈래가 넓으면 스택을 터뜨렸습니다** — 20만 갈래에서
  `RangeError: Maximum call stack size exceeded`(스택 안전이 존재 이유인 타입 클래스가
  그 자리에서 터졌습니다). 지금은 완주합니다. `traverse` 의 누적 복사는 원소 1,000개에서
  499,500회였고 지금은 0회입니다.
- **`Array` 의 `chainRec` 과 `traverse` 가 제곱에서 선형으로.** 둘 다 큰 입력에서 급격히
  느려졌습니다 — `chainRec` 은 큐를 `shift`/`unshift` 로 돌려 갈래가 쌓일수록 원소를 통째로
  옮겼고, `traverse` 는 누적을 걸음마다 `[...누적, 값]` 으로 펼쳤습니다. 실측(같은 프로세스
  전후 대조): 32,000 단계에서 `chainRec` 730.9ms → 0.9ms, `traverse` 814.1ms → 2.4ms.
  **결과는 그대로입니다** — 깊이 우선 순서도, 비결정 applicative(Array)의 곱집합도
  21건 대조에서 불일치 0건.
- **수 덧셈이 결합법칙을 정확히 지키지 않는다는 사실을 문서에 적었습니다**
  ([`internals.md#number-sum`](./docs/internals.md#number-sum)). `(0.1+0.2)+0.3` 은
  `0.6000000000000001`, `0.1+(0.2+0.3)` 은 `0.6` 입니다. 고칠 수 있는 결함이 아니라
  IEEE 754 의 성질이라 **알려야 할 사실**로 다룹니다(곱셈 군과 같은 처우). 곱셈과 깨지는
  자리가 다릅니다 — 덧셈의 역원은 유한한 수에서 정확하고, 무한대에서만 `NaN` 입니다.
- **적대 감사 6차(코덱스)의 국소 수리 4건.**
  - `Optics.prop('__proto__')` 로 값을 넣으면 데이터가 아니라 **결과 객체의 프로토타입**이
    바뀌던 것을 고쳤습니다. 4차 감사가 객체 `into` 에서 고친 것과 같은 병이고, `prop` 은
    그 수리 뒤에 들어와 같은 가드를 못 받았습니다. 복제·대입 둘 다 `defineProperty` 로.
  - `Actor` 구독자가 통지 도중 **자기 자신을 해지하면 그 뒤 구독자가 그 이벤트를 못 받던**
    것을 고쳤습니다. 통지는 이제 사본을 돌되, 그 사이 해지된 구독자는 부르지 않습니다.
  - `Free.runSync`/`runAsync` 가 **Free 가 아닌 프로그램을 성공값으로 돌려주던** 것을
    거부로 바꿨습니다. 셋 다 `Free.<러너>: program must be a Free value` 로 통일했고,
    `runWithTask` 의 입구 문안도 여기에 맞췄습니다. 러너가 마지막에 평범한 값을 내는
    것은 문서화된 정상 계약이므로 그대로입니다.
  - `range`/`rangeBy` 가 **정수·유한을 검사**합니다. 전에는 같은 계열의 잘못된 입력이
    `NaN`→`[]`, `1.5`→`[0]`, `'3'`→`[0,1,2]`, `Infinity`→`RangeError` 넷으로 갈렸습니다.

  **뒤의 둘은 동작이 바뀝니다.** `range('3')` 처럼 문자열을 넘기던 코드와, Free 가 아닌
  값을 러너에 넘기던 코드는 이제 던집니다. 둘 다 타입 선언에는 원래 없던 사용법입니다.
  - `Optics.prop` 과 같은 회차에, **기반 클래스를 직접 만든 값**(`new Maybe()` 등)이 타입
    가드를 통과하던 것도 막았습니다. 심볼이 기반 클래스에 있어 상속으로 새던 것을 변형
    (`Just`/`Nothing`·`Left`/`Right`·`Valid`/`Invalid`) 쪽으로 내렸습니다. 공개 표면은
    그대로이고, 정상적으로 만든 값은 아무 영향이 없습니다.
  - `Ord.lookup('default')` 이 **원시값만** 비교합니다(number·string·boolean·bigint).
    객체끼리 `<=` 는 둘 다 `"[object Object]"` 로 강제 변환돼 서로 다른 값이 양방향으로
    참이 됐고, 짝 Setoid(`===`)와 어긋났습니다. 짝 Setoid 는 참조 동등이라 그대로입니다.
- **문서 예제 게이트가 이제 값도 봅니다.** 지금까지는 예제를 실행만 해서 **던지는
  어긋남만** 잡았고, 예제에 적힌 `// 기대값` 이 실제 출력과 달라도 초록이었습니다.
  출력 대조를 넣자 **실제로 낡아 있던 문서 둘**이 잡혔습니다 — `internals.md` 의 곱셈군
  예제(`1.0000000000000002` 로 적혀 있었지만 실제 출력은 `0.9999999999999999`)와
  `WriterT.md` 의 `tell` 만 한 계산의 값(`null` 로 적혀 있었지만 실제로는 `undefined`).
  같은 회차에 기대값 주석 24곳을 실제 출력에 맞춰 정리했습니다.

## 0.1.0 — 2026-08-14

**첫 배포입니다.** `0.x` 는 "쓸 만하지만 아직 굳지 않았다" 는 뜻입니다 — 파괴적 변경이
`0.2.0` 으로 나갈 수 있습니다. API 를 굳히는 시점과 그 조건은 아래 「1.0.0 까지」에 있습니다.

### 무엇이 들어 있나

Static Land 명세의 타입 클래스 24종과, 그 위에 선 데이터 타입·optics·트랜스포머입니다.

| | |
| --- | --- |
| 등록된 인스턴스 | 133개 |
| 법칙이 도는 인스턴스 | 88개 |
| 실행되는 문서 예제 | 417개 |
| 테스트 파일 | 44개 |

**문서 예제는 테스트가 실행합니다.** 예제가 던지면 빌드가 멈춥니다. 다만 `0.1.0` 시점의
게이트는 **실행만** 했고 예제에 적힌 `// 기대값` 과 실제 출력을 대조하지는 않았습니다 —
값이 조용히 틀리는 것은 그때 통과했습니다(뒤늦게 실측: 「미발행」의 고침 항목 참조).

### 배포 형태

- ESM(`import`)과 CommonJS(`require`) 둘 다. `exports` 필드로 해석됩니다.
- TypeScript 선언 포함(`dist/fun-fp.d.ts`).
- 배포물은 `dist/` 와 `README.md` 뿐입니다(6개 파일, 507KB).
- 실행 의존성 **0개**.
- 문법 상한은 **ES2018** 입니다 — `tests/es-ceiling.test.js` 가 지킵니다.

### 0.1.0 이전에 무엇이 바뀌었나

버전이 `0.0.0` 이던 동안 공개 표면이 여러 번 바뀌었습니다. **아무도 고정할 수 없던
상태이므로 마이그레이션 안내는 두지 않습니다.** 다만 무엇이 왜 바뀌었는지는 기록에
남아 있습니다 — 대부분 **새로 세운 게이트가 찾아낸 명세 위반**입니다.

| 무엇 | 왜 |
| --- | --- |
| `Ord` 가 `Setoid` 를 상속 | 명세가 "same T 에 대해 Setoid 를 지원하라" 고 요구하는데 `equals` 가 없었다 |
| `Category.id` 를 `id()` 로 | 명세도 타입 선언도 "불러서 얻는" 모양인데 런타임만 달랐다 |
| `Filterable` 에서 `Either`/`Task` 제외 | 소멸 법칙을 지킬 수 없다 — 정규 빈 상자가 없다 |
| 정적 조회를 `of` 에서 `lookup` 으로 | 값을 들어올리는 `of` 와 인스턴스를 꺼내는 조회는 다른 일이다 |
| `Semigroup.Either` 이 인자 둘 | 조립 키 문법을 레지스트리 사이에서 통일했다 |
| optic 이 `promap` 을 부른다 | 사설 딕셔너리가 등록 인스턴스가 되면서 이 라이브러리의 이름을 따랐다 |
| `plus(maybe)` 키 폐기 | `f(x)` 는 `F<X>` 를 뜻하는데 `Plus` 가 아니라 `Monoid` 를 돌려줬다 |
| `Identity`·`Const` 가 자기 타입 | 둘과 평범한 객체가 `.type` 을 공유해 서로 섞여 들어갔다 |
| **팩토리가 타입 클래스로** | `Maybe.Semigroup(k)` → `Semigroup.Maybe(k)`. 관례가 5:6 으로 갈려 있었다 |
| `Forget` 캐리어를 감쌈 | `.type` 이 `'function'` 이라 `FunctionWander` 와 캐리어가 섞였다 |
| 튜플 `bimap` 이 길이를 본다 | 긴 배열의 뒤를 버리고 짧은 배열에서 `NaN` 을 만들었다 |
| **`Identity` 가 클래스** | `{ value }` 객체 리터럴이라 평범한 객체와 구분되지 않았다 |

## 1.0.0 까지

`1.0.0` 은 "이 API 를 이제 안 바꾼다" 는 약속입니다. 지금은 그 약속을 할 수 없습니다 —
**나흘 동안 파괴적 변경이 열두 번 났고 그 대부분이 새 게이트가 찾은 것**이라, 아직 감시가
없는 곳에서 더 나올 것으로 봅니다.

굳히기 전에 참이어야 하는 것:

1. **법칙 게이트에 구멍이 없다.** `ChainRec`·`Traversable`·`Wander` 가 법칙을 받거나,
   못 받는 것이 원리적으로 불가능하다고 확정되고 **그 대신 무엇이 지키는지**가 적혀 있다.
2. **마지막 파괴적 변경 이후 전면 감사가 무소득이다.**
3. **실제로 써 본 기록이 있다.** 지금 이 API 는 아무도 오래 써보지 않았다.
4. `lookup`/`of` 구분이 문서 첫 화면에 있고, `Maybe`/`Either` 의 출력이 읽힌다.

진행 상황은 [`.dev/TODO.md`](./.dev/TODO.md) 에 있습니다.
