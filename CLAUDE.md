# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소에서 작업할 때 참고하는 가이드입니다.

## 프로젝트 개요

**fun-fp-js**는 Static Land 및 Fantasy Land 명세를 구현한 JavaScript 함수형 프로그래밍 라이브러리입니다. 대수적 데이터 타입(Maybe, Either, Task, Free Monad), 타입 클래스(Functor, Monad, Applicative, Traversable 등), 핵심 FP 유틸리티(compose, pipe, curry), 그리고 Free Monad 기반 Monad Transformer(StateT, EitherT, ReaderT, WriterT)를 제공합니다.

**참고:** ES6 환경 호환성을 위해 polyfill이 포함되어 있습니다.

## 명령어

### 빌드
```bash
node build.js
```
`/dist/` 디렉토리에 세 가지 포맷으로 생성:
- `fun-fp.js` - ESM (소스맵 포함)
- `fun-fp.cjs` - CommonJS/UMD (브라우저 호환)
- `fun-fp.min.cjs` - 압축된 CommonJS

### 테스트 실행
```bash
# 전체 검증 — tests/*.test.js 전부 + tsc --noEmit
npm test

# 개별 테스트 파일 (디버깅용)
node tests/maybe.test.js
node tests/either.test.js
node tests/statet.test.js

# 타입 선언만 검사
npm run typecheck
```

`npm test`는 `tests/run.js` 러너를 실행합니다. 각 테스트 파일을 **별도 자식 프로세스**로
돌리는데, 일부 파일이 `setStrictMode()`로 전역 상태를 토글하기 때문에 프로세스 격리가
필요합니다. 하나라도 실패하면 요약에 파일명과 종료 사유가 나오고 non-zero로 종료합니다.

전체 실행을 셸 루프(`for f in tests/*.test.js; do node "$f"; done`)로 대체하지 마십시오 —
실패를 집계하지 않아 exit code가 항상 0입니다. `node tests/*.test.js`도 안 됩니다 —
node가 첫 인자만 실행하므로 1개 파일만 돌아갑니다.

### 브라우저 테스트
`test.html`을 브라우저에서 열어 UMD 번들의 브라우저 호환성 테스트를 실행합니다.

### CI

`.github/workflows/ci.yml` 이 `main` 으로의 push 와 모든 pull request 에서 돌아갑니다.
**Node 20 / 22 매트릭스**로 각각 `npm ci` → `npm test` → `node build.js && node build-types.js`
를 실행합니다. 즉 CI가 검증하는 것은 세 가지입니다 — 전체 테스트, 타입 선언(`tsc --noEmit`,
`npm test` 안에 포함), 그리고 **빌드 스크립트가 에러 없이 끝나는지**입니다.

**CI는 `dist/` 를 커밋하거나 업로드하지 않습니다.** 빌드가 성공하는지만 확인하고 산출물은
버립니다. `dist/` 를 갱신해 배포하는 것은 사람의 결정이며, 빌드 헤더의 `Built:` 타임스탬프가
그 시점을 기록합니다. 이 타임스탬프는 의도된 설계이므로 재빌드 후 `git diff dist` 가
타임스탬프 줄만 보여주는 것은 정상입니다 — 드리프트가 아닙니다.

지원 런타임은 `package.json` 의 `engines` (`node >=20`) 가 기준입니다. Node 15 미만에서는
unhandled rejection 이 프로세스를 죽이지 않아 테스트 게이트에 구멍이 생깁니다.

## 문서 예제 규약

`tests/docs-examples.test.js` 가 `docs/` 문서의 코드 예제를 **추출해 실제로 실행합니다.**
`npm test` 와 CI 에 함께 돌아가므로, 예제가 코드와 어긋나면 빌드가 빨간색이 됩니다.

**검사 대상은 `docs/*.md` 전부입니다.** 새 문서를 추가하면 자동으로 포함됩니다 — 등록
목록을 따로 관리하지 않습니다.

- **기본값은 "실행 가능"입니다.** ` ```javascript ` 블록은 실행 대상입니다.
- 실행할 수 없는 블록은 **` ```javascript no-run <이유> `** 로 표시합니다.
  **이유는 필수입니다** — 없으면 검사기가 실패합니다. 아무 블록에나 `no-run` 을 붙여
  통과시키는 것을 막기 위해서입니다.

  ```
  ```javascript no-run 문제 상황 — 일부러 틀린 코드
  ```javascript no-run 의사코드
  ```javascript no-run 출력 예시
  ```
- 각 블록은 **독립 프로세스**에서 실행됩니다. 앞 블록에서 선언한 변수나 헬퍼를 뒤 블록이
  쓸 수 없습니다. 예제는 자기완결적으로 쓰십시오 — 페이지 중간부터 읽는 사람에게도
  그편이 낫습니다.
- 검사기가 프리앰블을 주입합니다. **모든 export 가 이미 스코프에 있으므로** `Maybe`,
  `Either`, `Functor` 같은 이름을 바로 쓸 수 있고, `FunFP` 도 그대로 있습니다.
  `const { Maybe } = FunFP;` 로 시작하는 기존 관례도 그대로 동작합니다
  (전역 할당이지 `const` 선언이 아니라 충돌하지 않습니다). **import 문은 쓰지 마십시오.**
- 비동기 예제(`Task`, `Actor`)는 `fork` 안에서 끝내지 말고 **최상위에서 await 가능한 형태**로
  쓰거나 `no-run` 으로 표시합니다 — 블록이 예외 없이 끝나야 통과입니다.

**보증 범위**: 검사기는 예제가 **예외 없이 실행되는지**만 봅니다. 주석의 `// Just(43)` 같은
기대값까지 대조하지는 않습니다. API 이름이 바뀌거나 인자 순서가 틀려 예외가 나는 종류의
문서 부패를 막는 것이 목적입니다.

**예외는 없습니다.** `docs/` 의 모든 문서가 같은 규칙을 받습니다 — 실행 가능한 블록이
하나라도 실패하면 `npm test` 와 CI 가 빨간색이 됩니다. 통과 목록이나 유예 목록을 만들지
마십시오. 실행할 수 없는 블록은 `no-run <이유>` 로 표시하는 것이 유일한 길입니다.

## 아키텍처

### 단일 파일 구조 (의도적 설계)

전체 라이브러리가 `index.js` (~2545줄)에 있습니다. 모듈 분리보다 단일 파일 구조를 선택한 이유:
- 모듈을 나눠서 관리하는 비용보다 나눠진 모듈을 모아서 빌드하는 비용이 더 큼
- 최종 배포물이 하나의 파일이므로 개발 시점 분리의 이점이 적음

파일 구성:

1. **Polyfills & Symbols** (1-70줄) - ES6 호환성, 타입 식별 심볼
2. **타입 시스템** (70-140줄) - 타입 체킹을 위한 `types` 객체
3. **핵심 유틸리티** (140-370줄) - `compose`, `pipe`, `curry`, `tap`, `partial` 등
4. **타입 클래스** (370-610줄) - Algebra, Setoid, Ord, Semigroup, Monoid, Functor, Monad 등
5. **Function/Array 인스턴스** (710-1100줄) - 내장 타입에 대한 타입 클래스 구현
6. **핵심 데이터 타입** (1100-1800줄) - Maybe, Either, Task, Free (StateF/EitherF/ReaderF/WriterF Functor 포함)
7. **순회 & 유틸리티** (1800-1870줄) - `sequence()`, `lift()`, `pipeK()`
8. **Free Static Land** (1870-2000줄) - FreeFunctor, FreeApply, FreeChain, FreeMonad
9. **Optics** (2255줄~) - Profunctor 딕셔너리 3종(함수/Forget/Tagged), Lens/Prism/Traversal, `composeOptic`
10. **Monad Transformer** (~2290-2620줄) - 공통 인프라 + StateT, EitherT, ReaderT, WriterT
11. **Actor** - 메시지 큐 + 순차 처리
12. **Static Methods & 설정** - Static Land 메서드 wiring, `setStrictMode()`

줄 번호는 대략치입니다 — 코드가 늘면 어긋나므로 섹션 주석(`/* Optics */` 등)으로 찾으십시오.

### 검증 로직 분리 (checkAndSet)

타입 클래스의 검증 로직은 `checkAndSet` 함수에 집중되어 있습니다. 이는 의도적인 설계입니다:
- 검증 로직이 타입 정의보다 크면 타입의 본질이 가려짐
- 타입 클래스는 핵심 동작만 표현하도록 유지
- 검증 로직은 한 곳에서 일관되게 관리

### 핵심 데이터 타입

- **Maybe** - nullable 값을 위한 `Just`/`Nothing`. Functor, Monad, Foldable, Traversable, Filterable 구현.
- **Either** - 에러 처리를 위한 `Right`/`Left`. Left가 Semigroup일 때 `ap()`가 Left 값을 누적.
- **Task** - 지연 실행되는 Promise 유사 비동기 모나드. `fork(onError, onSuccess)`로 실행.
- **Free** - 트램폴린을 통한 스택 안전 재귀. `liftF()`로 펑터를 리프트하고, `runSync`/`runAsync`/`runWithTask`로 실행. Monad Transformer의 내부 표현으로도 사용.

### Optics

**Profunctor 인코딩**: `Optic s a = P => P a a -> P s s`. P가 첫 인자이므로 일반 `compose`로는
합성되지 않고 `composeOptic`을 씁니다.

**어떤 P를 주입하느냐가 연산을 정합니다.** 하나의 optic 정의에서 읽기·쓰기·역생성이 전부
나오는 이유입니다.

| 주입하는 P | 얻는 연산 | 필요한 메서드 |
| --- | --- | --- |
| 함수 (`_PFn`) | `over`, `set` | `dimap`, `first`, `left`, `wander` |
| `Forget<r>` (`_PForget(monoid)`) | `view`, `preview`, `toListOf` | 같음 (monoid로 누적) |
| `Tagged` (`_PTagged`) | `review` | `dimap`, `left` **만** |

| optic | 대상 수 | 생성 | P 요구 |
| --- | --- | --- | --- |
| `Iso` | 정확히 1 (무손실) | `Iso(to, from)` | `dimap`만 |
| `Lens` | 정확히 1 | `Lens(getter, setter)` | `first` (곱) |
| `Prism` | 0 또는 1 | `Prism(match, build)` — `match`는 Maybe 반환 | `left` (합) |
| `Traversal` | 0..n | `traversed(key)` — 기존 Traversable 재사용 | `wander` |

`Iso`는 `dimap`만 쓰므로 **모든 P에서 동작합니다** — Lens이자 Prism이라 `view`도 `review`도
됩니다. 세 P가 전부 `dimap`을 갖기 때문이며, 이것이 optic 계층의 최상단인 이유입니다.

**`Tagged`에 `first`와 `wander`가 없다는 것이 타입 안전성을 대신합니다** — Lens나 Traversal에
`review`를 쓰면 그 자리에서 TypeError가 납니다. 심볼 표식 같은 수동 검사가 필요 없습니다.

`wander`는 기존 `Traversable.of(key).traverse`에 위임합니다. 내부 Applicative(`_Identity`,
`_Const(monoid)`)는 그 호출에만 쓰입니다.

읽기: `view`(Lens 전용) / `preview`(첫 대상, Maybe) / `toListOf`(전부).
쓰기: `over`, `set` — 세 optic 모두 동작하며, 대상이 없으면 원본을 그대로 돌려줍니다.
`review(prism, a)` — **합성된 Prism에서도 동작합니다.** optic 합성이 곧 함수 합성이기 때문입니다.

### Monad Transformer

Free Monad 기반으로 구현. 각 transformer는 XxxF Functor(명령) + XT 컨테이너(Free 프로그램 래퍼) + 동적 타입 클래스 등록으로 구성.

- **StateT(M)** - `State + M` 합성. `of`/`get`/`put`/`modify`/`gets`/`lift`. `runState(s, st) → M([a, s])`. 예: `StateT(Maybe)`, `StateT(Task)`
- **EitherT(M)** - `Either + M` 합성. `of`/`throwError`/`catchError`/`lift`/`fromEither`. `runEitherT(et) → M(Either(a, e))`. 예: `EitherT(Task)`
- **ReaderT(M)** - `Reader + M` 합성. `of`/`ask`/`asks`/`local`/`lift`. `runReaderT(env, rt) → M(a)`. 예: `ReaderT(Maybe)`
- **WriterT(M, monoid)** - `Writer + M` 합성. `of`/`tell`/`lift`. `runWriterT(wt) → M([a, log])`. 예: `WriterT(Task)`
- M은 데이터 타입 객체(`Maybe`, `Either`, `Task`)나 문자열(`'maybe'`, `'task'`)을 모두 지원.

공통 인프라:
- `normalizeMonad(M)` - 문자열 또는 `{ of, map, chain }` 객체를 정규화
- `registerTransformerTypeClasses(XT, typeName, alias)` - Functor→Monad 5개 동적 등록 (nominal typing 강제)
- `liftCont(f)` - `_mapChain` + `cont` 해석 공통 헬퍼
- 각 transformer는 `Functor.of('statet(maybe)')` 같은 방식으로 타입 클래스 레지스트리의 1급 시민

### 타입 클래스 계층 구조

```
Functor ──> Apply ──> Applicative ──> Monad
             │           │
             └──> Alt ────┴──> Alternative

Chain ──> ChainRec ──> Monad

Foldable ──> Traversable <── Functor
```

## 테스트 프레임워크

`/tests/utils.js`에 있는 경량 테스트 러너:
- `test(name, fn)` - 동기 테스트
- `testAsync(name, fn)` - 비동기 테스트
- `assertEquals(actual, expected)` - 단언
- `assertThrows(fn)` - 예외 체크

## 핵심 설계 원칙

`.agent/workflows/agent.md`에서:

1. **Safety First** - `setStrictMode(true)`를 통한 런타임 타입 체킹
2. **대수적 법칙** - Static Land/Fantasy Land 법칙 준수
3. **Point-free 스타일** - 명시적 파라미터 없이 함수 합성
4. **스택 안전성** - 깊은 재귀를 위해 트램폴린과 Free 모나드 사용
5. **YAGNI** - 불필요한 기능 추가 금지

## 일반적인 패턴

### 합성
```javascript
const { compose, pipe } = fp;
// compose: 오른쪽에서 왼쪽, pipe: 왼쪽에서 오른쪽
```

### 모나딕 체인
```javascript
Either.pipeK(parseJson, validate, transform)(data);
// 첫 번째 Left에서 중단
```

### 이펙트 순회
```javascript
sequence(Applicative.of('maybe'), maybeArray);
// [Maybe a] -> Maybe [a]
```

### Monad Transformer 사용

**M은 문자열로 넘기십시오** (`StateT('maybe')`). 이유는 아래 주의 항목을 보십시오.

```javascript
const { StateT, Maybe } = fp;
const ST = StateT('maybe');

const program = ST.get
    .chain(s => ST.put(s + 1))
    .chain(_ => ST.lift(Maybe.Just(42)))
    .chain(x => ST.of(x));

program.run(0);  // Maybe.Just([42, 1])
```

#### 주의: 문자열 M과 객체 M은 서로 다른 타입이다

`resolveMonadType` (`index.js:2355`)이 타입명을 만드는 방식 때문입니다.

| 호출 | `_typeName` | 레지스트리 alias |
| --- | --- | --- |
| `StateT('maybe')` | `StateT(Maybe)` | `statet(maybe)` |
| `StateT(Maybe)` | `StateT(M1)` | `statet(m1)` — **실행 순서에 따라 달라진다** |

객체를 넘기면 `type` 프로퍼티가 없어 `M1`, `M2`... 가 순서대로 붙습니다. 그래서:

- `Functor.of('statet(maybe)')` 같은 레지스트리 조회는 **문자열 형태로 만든 것만** 찾힙니다
- 두 형태는 **다른 클래스**이고 nominal typing 이 강제되므로 섞으면 `TypeError` 입니다:
  `StateT('maybe').runState(0, StateT(Maybe).of(1))` → throw
- 캐시는 인자별입니다 — `StateT('maybe')` 를 두 번 부르면 같은 인스턴스가 나옵니다

### Transformer 타입 클래스 접근

`StateT('maybe')` / `EitherT('task')` 처럼 **문자열로 만든 transformer 만** 조회됩니다.

```javascript
Functor.of('statet(maybe)').map(f, st);
Monad.of('eithert(task)');
```


@.claude/harness/POLICY.md
@.claude/harness/LEARNED.md
