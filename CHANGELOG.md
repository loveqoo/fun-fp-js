# 변경 기록

> English: [./CHANGELOG.en.md](./CHANGELOG.en.md)

배포된 버전의 변경과, 아직 버전이 안 붙은 `main` 의 변경(「미발행」)을 적습니다.
상세한 경위는 `git log` 와 `.dev/` 에 있습니다.

## 미발행

dist 파일만 받아 쓰는 경우: 헤더의 `Commit:` 줄이 그 파일의 시점을 가리킵니다.

지금은 비어 있습니다.

## 0.2.2 — 2026-08-28

- **CHANGELOG 에 영어판이 생깁니다** — `CHANGELOG.en.md`. 영어 문서와 README(영어)의
  변경 기록 링크가 영어판을 가리킵니다. 정본은 이 파일(한국어)입니다.
- **README 가 영어 우선이 됩니다.** `README.md` 가 영어판, 한국어판은 `README.ko.md` 로
  한 클릭입니다 — npm 첫 화면의 진입 장벽을 낮춥니다. 정본이 한국어라는 사실은 그대로이고
  (docs/ 의 짝 규약·게이트 불변), 자리만 바뀝니다.
- **해석기 문이 api 밖으로 나갑니다: `api.interpreter(h)` → `Free.interpreter(api, h)`.**
  api 객체는 사용자 어휘만 싣습니다 — `'interpreter'` 예약어가 사라지고, 어떤 도메인
  단어든 명령 이름이 됩니다(외부 리뷰 문답에서 소유자가 짚은 설계 결함: 사용자 어휘와
  라이브러리 문이 한 이름 공간을 나눠 쓰고 있었습니다). `Free.interpreters`(합치기)와
  같은 자리입니다.
- **`import { Maybe } from 'fun-fp-js'` 가 됩니다.** 지금까지 런타임은 default export
  하나였는데 타입 선언은 named export 를 약속해서, TypeScript 는 통과시키고 런타임이
  `SyntaxError` 로 죽었습니다(외부 리뷰 지적, 실측 재현). 런타임에 같은 명단의 named
  export 를 더했습니다. default 는 그대로라 기존 코드는 영향이 없습니다.
- **타입 선언과 런타임 레지스트리의 어긋남을 한 번 더 걷어냈습니다**(외부 재리뷰 3차,
  전건 실측 확인). 런타임엔 있는데 TS 등록이 빠져 `lookup` 이 거부되던 키 26개를
  등록했습니다(함수 모나드 셋, identity 의 Chain·Monad·Extend·Comonad, Store, tuple
  Bifunctor, object Filterable·Foldable, tagged Choice, date·default Setoid·Ord,
  Kleisli 합성 셋). 반대로 TS 에만 있던 유령 키 하나(Contravariant 의 `function` —
  런타임 키는 `predicate`)를 고쳤습니다. identity 인스턴스의 반환 타입이 `{ value }`
  로 축소되어 `map` 표면을 잃던 것을 진짜 `Identity` 로 되돌렸고, `raiseError` 의
  에러 채널이 인자 타입을 따르게 해 틀린 채널 대입이 컴파일에서 거부됩니다.
  `new Semigroup(...)` 등 문서가 가르치는 직접 생성 8곳도 선언에 열렸습니다. 런타임
  lookup 키 전원을 컴파일하는 레지스트리 대조 게이트가 추가됐습니다.
- **타입 선언 다섯 곳을 런타임 사실에 맞췄습니다**(외부 재리뷰 지적, 전건 실측 확인).
  `fst`/`snd` 선언 신설과 `Strong`/`Choice`/`Wander` 값 선언(전에는 타입으로만 존재),
  default 타입에 `Identity` 포함 여섯 이름 추가; `Traversable.traverse` 를 런타임과 같은
  3인자로(커링 선언은 런타임에서 TypeError 였습니다); optics 의 `dimap` 오기를 `promap`
  으로; `Choice.left` 방향을 Left 쪽 변환으로(right 복붙 오류); `MonadError` 의 `never`
  오염 제거 — `handleError` 가 실제 값을 거부하던 것이 풀립니다. 공개 이름 92개 전원을
  값으로 import 해 컴파일하는 표면 전수 게이트가 `tests/consumer.test.js` 에 추가됐습니다.
- **배포 타입 선언이 `skipLibCheck` 없는 소비자 설정에서도 컴파일됩니다.** 우리 검사가
  d.ts 자체를 본 적이 없어 번들에 잠복 오류가 쌓여 있었습니다(TS2395 ×138 등 넷 계열).
  선언 병합의 export 불일치, 인터페이스 닫는 `};`, 객체 리터럴 타입 안의 `this`, 중복
  재수출을 고쳤습니다. 소비자 관점 게이트(`tests/consumer.test.js`)가 named import 실행과
  nodenext 컴파일을 지킵니다.
- 영어 문서 전체(48개)를 윤문했습니다. 코드 블록·수치·의미는 그대로이고 문장만
  다듬었습니다.
- README 첫 화면 예제를 갈아엎었습니다. 커링·삼중 ap 의 Validation 과 Optics 절을 걷어내고,
  세 걸음(compose → Maybe → Free.api)으로 바꿨습니다 — 타입 클래스를 몰라도 읽히는 순서입니다.
- README 첫 문단의 법칙 문구를 정확하게 좁혔습니다: 캐리어가 법칙을 허용하는 범위에서
  검증하며, 못 지키는 자리는 문서에 적혀 있습니다.

## 0.2.1 — 2026-08-28

README 갱신 패치입니다. 코드 변경은 없습니다.

- 설치 안내를 `npm install fun-fp-js` 로 바꿨습니다. 0.2.0 의 README 는 발행 전
  문구(GitHub 설치 안내)를 그대로 담고 있었습니다.
- 수치를 실측으로 갱신했습니다: 꾸러미 8파일 0.65MB, 예제 990개(대조 964줄),
  링크 592개, 테스트 55파일, 인스턴스 157개. 데이터 타입 목록에 `Store` 를 더했습니다.
- 문서를 보완했습니다: `Apply`·`Chain`·`Identity` 전용 페이지(한·영), 가이드에 최상위
  조합자 명부(전 이름 수록). 공개 이름 전부가 한·영 문서에 언급되는지 지키는 게이트를
  새로 두었습니다.
- README 하단·본문의 `docs/`·`CHANGELOG` 링크를 GitHub 절대 주소로 바꿨습니다 —
  npm 꾸러미에는 그 파일들이 없어 설치물에서 깨졌습니다.

## 0.2.0 — 2026-08-28, 첫 npm 발행

`npm install fun-fp-js` 로 설치됩니다. 설치 최소 버전은 Node 14(dist 는 ES2018),
개발·테스트는 Node 20 이 필요합니다.

### 파괴적 변경

- `Writer.exec()` 가 값 대신 출력(로그)을 돌려줍니다. 값은 신설 `Writer.eval()` 로.
  (`State.exec`·Haskell `execWriter` 와 같은 관례)
- `transducer.transduce` 가 4단 커링에서 4인자 단일 호출로:
  `transduce(변환기, 리듀서, 초기값, 컬렉션)`.
- 최상위 `into` 의 이름이 `pipeFrom` 으로 바뀌었습니다. `transducer.into` 와 동명이라
  이름 검색에서 엉뚱한 쪽이 잡혔습니다. `into(5)(f, g)` → `pipeFrom(5)(f, g)`.
- `ChainRec` 이 규격 밖 걸음을 거부합니다. 걸음은 `next`/`done` 으로 만들어야 하고,
  그 밖의 값은 `ChainRec.chainRec: step must be next(...) or done(...)` 입니다.
  전에는 규격 밖 값을 종료로 읽어 콜백 오타가 조용히 성공했습니다. `Task` 는 거부로
  도착합니다.
- `Actor` 에 기본 타임아웃 1초가 생겼습니다. 핸들러가 1초를 넘기면 그 메시지는
  `timedOut === true` 의 거부로 끝나고 큐가 다음으로 넘어갑니다. 전에는 정착하지 않는
  핸들러가 큐를 영구히 막았습니다. 오래 걸리는 핸들러가 정상이면 `timeout: Infinity`.
- `Actor` 구독자가 메시지 순서대로 알림을 받습니다. 옛 동작(진행 확정 우선)이 필요하면
  `notifyInOrder: false`.
- `range`/`rangeBy` 가 정수·유한을 검사합니다. `range('3')` 처럼 문자열을 넘기던 코드는
  던집니다(타입 선언에는 원래 없던 사용법).
- `Free` 러너가 Free 가 아닌 프로그램을 거부합니다(전에는 성공값으로 돌려줬습니다).
  문안은 셋 다 `Free.<러너>: program must be a Free value`.

### 새 기능

- `Store` 코모나드 — State 의 쌍대. `(조회, 초점)` 쌍에
  `extract`/`peek`/`seek`/`experiment`/`map`/`extend`, 반복 `extend` 용 캐시는
  `Store.memo(store, keyOf)`(keyOf 필수). [`docs/Store.md`](./docs/Store.md)
- 함수 타입이 모나드입니다 — `'function'` 키에 `Apply`·`Applicative`·`Chain`·`Monad`.
  맨 함수를 감싸지 않고 씁니다(Reader 모나드와 같은 값).
  [`docs/internals.md#function-monad`](./docs/internals.md#function-monad)
- `identity` 가 `Chain`·`Monad` 까지 올라갑니다 — 트랜스포머의 안쪽 모나드로 쓸 수
  있습니다. `ReaderT('identity')` 는 맨 `Reader` 와 같은 값을 냅니다.
- `chain` 이 strict 모드에서 콜백의 반환까지 검사합니다 — `map` 쓸 자리에 `chain` 을
  쓰면 실수한 자리에서 `callback must return <타입>, got <실제>` 로 던집니다. 게으른
  타입(Task 등)의 콜백은 경계 밖입니다.
  [`docs/internals.md#chain-return`](./docs/internals.md#chain-return)
- `Free.api(...이름)` — 어휘 선언만으로 명령 함수와 해석기 문이 나옵니다.
- `Free.interpreters(...해석기)` — 여러 api 의 해석기를 하나로 합칩니다. 이름이 겹쳐도
  출처 표식으로 라우팅합니다.
- `해석기.start(program)` — `{ promise, cancel }`. `cancel()` 은 명령 경계에서 발효하는
  협조적 취소이고, 취소된 실행은 `cancelled === true` 의 거부로 도착합니다.
- `NonEmptyList` — 비어 있을 수 없는 목록. `extract` 가 항상 값을 주고,
  `reduceLeft`/`reduceMap` 이 Semigroup 만으로 접습니다. 인스턴스 13개.
  Monoid·Plus·Alternative·Filterable 은 의도된 부재입니다(전부 "빈 목록"을 뜻하므로).
- `Reducible` — 빈 경우가 없는 접기(명세 밖, Foldable 상속). NonEmptyList·Identity 가
  인스턴스입니다. [`docs/Reducible.md`](./docs/Reducible.md)
- `MonadError` — 실패를 일급으로(명세 밖). `raiseError`/`handleError`, Task·Either 등록.
- `Actor` 의 `handle` 이 Promise 도 받습니다(값·Promise·Task).
- `transducer.into(그릇, 변환기, 입력)` — 그릇(배열·문자열·Set·Map·객체)에서 리듀서를
  유도합니다. 그릇 내용 보존, 원본 불변.
- `fp.pipeWhile(판별자)` — 판별자가 참인 동안만 잇는 pipe.
- `Applicative.Writer(모노이드)` / `Monad.Writer(모노이드)` — Writer 를 임의 모노이드로.
- dist 헤더에 `Version:`·`Changelog:`·`Commit:` 줄이 붙습니다.

### 고침

- 무음 정지 계열: `Task.filter` 의 술어가 던지면 거부로 도착합니다(전에는 영영 안
  열렸습니다). `Actor`·`Free` 러너의 같은 계열도 함께.
- 객체 복제(`Optics.prop`·`transducer.into`): 심볼·숨은 속성이 사라지던 것, own
  `__proto__` 가 프로토타입으로 둔갑하던 것, 동결 객체를 갱신 못 하던 것을 고쳤습니다.
  [`docs/internals.md#copy-own`](./docs/internals.md#copy-own)
- `Free` 재진입 가드가 thenable 을 Promise 로 동화해 돌려줍니다(전에는 다시 기다릴 때
  `then` 이 한 번 더 불렸습니다).
- `Array`·`NonEmptyList` 의 `chainRec`·`traverse` 가 제곱에서 선형으로. 32,000 단계
  실측: `chainRec` 730.9ms → 0.9ms, `traverse` 814.1ms → 2.4ms. 결과는 동일합니다.
  NonEmptyList 의 `chainRec` 은 20만 갈래에서 스택이 터지던 것도 함께 고쳤습니다.
- `Actor` 구독자가 통지 도중 자기를 해지해도 뒤 구독자가 이벤트를 받습니다.
- 기반 클래스를 직접 만든 값(`new Maybe()` 등)이 타입 가드를 통과하던 것을 막았습니다.
  정상적으로 만든 값은 영향이 없습니다.
- `Ord.lookup('default')` 가 원시값만 비교합니다(number·string·boolean·bigint).
  객체끼리는 강제 변환 탓에 서로 다른 값이 양방향으로 참이 됐습니다.
- `Optics.prop` 을 TypeScript 선언에 추가했습니다.
- 문서 예제 게이트가 값도 대조합니다. 이 대조가 낡은 문서 둘을 잡았고(internals 곱셈군
  예제, WriterT 의 `tell` 값) 기대값 주석 24곳을 실제 출력에 맞췄습니다.
- 수 덧셈이 결합법칙을 정확히 지키지 않는다는 사실(IEEE 754)을 문서에 적었습니다.
  [`internals.md#number-sum`](./docs/internals.md#number-sum)

## 0.1.0 — 2026-08-14

첫 배포입니다. `0.x` 는 "쓸 만하지만 아직 굳지 않았다" 는 뜻입니다.

### 무엇이 들어 있나

Static Land 명세의 타입 클래스 24종과, 그 위에 선 데이터 타입·optics·트랜스포머입니다.

| | |
| --- | --- |
| 등록된 인스턴스 | 133개 |
| 법칙이 도는 인스턴스 | 88개 |
| 실행되는 문서 예제 | 417개 |
| 테스트 파일 | 44개 |

문서 예제는 테스트가 실행합니다. 다만 `0.1.0` 시점에는 실행만 하고 `// 기대값` 을
대조하지 않았습니다 — 값 대조는 `0.2.0` 에서 들어왔습니다.

### 배포 형태

- ESM 과 CommonJS 둘 다(`exports` 필드), TypeScript 선언 포함.
- 배포물은 `dist/` 와 README 뿐, 실행 의존성 0개, 문법 상한 ES2018.

### 0.1.0 이전에 무엇이 바뀌었나

버전이 `0.0.0` 이던 동안 공개 표면이 여러 번 바뀌었습니다. 아무도 고정할 수 없던
상태이므로 마이그레이션 안내는 두지 않습니다. 대부분 새로 세운 게이트가 찾아낸 명세
위반입니다.

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
| 팩토리가 타입 클래스로 | `Maybe.Semigroup(k)` → `Semigroup.Maybe(k)`. 관례가 5:6 으로 갈려 있었다 |
| `Forget` 캐리어를 감쌈 | `.type` 이 `'function'` 이라 `FunctionWander` 와 캐리어가 섞였다 |
| 튜플 `bimap` 이 길이를 본다 | 긴 배열의 뒤를 버리고 짧은 배열에서 `NaN` 을 만들었다 |
| `Identity` 가 클래스 | `{ value }` 객체 리터럴이라 평범한 객체와 구분되지 않았다 |

## 1.0.0 까지

`1.0.0` 은 "이 API 를 이제 안 바꾼다" 는 약속입니다. 굳히기 전에 참이어야 하는 것:

1. 법칙 게이트에 구멍이 없다. `ChainRec`·`Traversable`·`Wander` 가 법칙을 받거나,
   못 받는 것이 원리적으로 불가능하다고 확정되고 그 대신 무엇이 지키는지가 적혀 있다.
2. 마지막 파괴적 변경 이후 전면 감사가 무소득이다.
3. 실제로 써 본 기록이 있다.
4. `lookup`/`of` 구분이 문서 첫 화면에 있고, `Maybe`/`Either` 의 출력이 읽힌다.

진행 상황은 [`.dev/TODO.md`](./.dev/TODO.md) 에 있습니다.
