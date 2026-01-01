# Fun-FP-JS Project Overview & Context

This document serves as a context provider for AI agents to quickly understand the project structure and technical philosophy.

## 🚀 Project Nature
**Fun-FP-JS** is a robust, production-grade JavaScript functional programming library. It focuses on providing core FP utilities, algebraic data types (Monads, Monoids), and safe execution patterns (Trampolining, Error handling) with a strong preference for **point-free style** and **lazy evaluation**.

**Key Philosophy**: TypeScript를 사용하지 않는 이유는 빌드 없이 바로 사용할 수 있는 접근성을 중시하기 때문. 런타임 타입 안전성은 `expectedFunction`/`expectedFunctions`와 Symbol 기반 타입 태깅으로 확보.
**Language Preference**: 모든 계획(Plan)과 문서는 **한국어**로 작성한다.


## 📂 Folder Structure
- `/modules`: Core logic separated by domain.
    - `core.js`: Basic utilities (`pipe`, `compose`, `curry`, `tap`, etc.).
    - `either.js`: `Either` (Left/Right) Monad for error handling and validation.
    - `monoid.js`: Monoid and Group implementations (Sum, Product, Any, All, etc.).
    - `free.js`: Free Monad and Trampoline for stack-safe recursion.
    - `task.js`: `Task` Monad for lazy asynchronous operations (like async Either).
    - `extra.js`: High-level utilities like `path` and `template` engine.
- `/tests`: Unified test suite.
    - `*.test.js`: Functional tests divided by feature.
    - `utils.js`: Shared test utilities (`test`, `assert`, `assertEquals`, `logAssert`).
- `all_in_one.cjs`: A consolidated, single-file UMD build of the entire library.
- `index.js`: Entry point that initializes the library (uses `/modules` directly).
- `build.js`: Build script that consolidates modules into `all_in_one.cjs`.
- `test.sh`: Bash script runner that auto-detects and executes all `*.test.js` files.

## 🛠 Technical Principles
1. **Safety First**: Extensive use of `expectedFunctions` and `runCatch` to ensure runtime safety.
2. **Algebraic Laws**: `Either.ap` follows Applicative laws with error accumulation (concatenating `Left` values if they support it).
3. **Point-free Style**: Functions are designed to be composed without explicit arguments where possible.
4. **Stack Safety**: Recursive operations are handled via `trampoline` and `Free` monad to prevent `RangeError`.
5. **YAGNI (You Aren't Gonna Need It)**: State, Reader 등 추가 모나드는 실제로 필요할 때만 추가. 현재 `pipe`, `compose`, `converge` 등이 Reader의 역할을 충분히 수행.
6. **Left는 항상 Error 배열**: Validation 패턴과 통합을 위해 모든 Left 값은 Error 배열로 정규화.
7. **expectedFunctions 키는 colon 구분 네임스페이스**: 모듈별로 구분. 예) `'core:a-function'`, `'either:condition-to-be-a-function'`, `'task:computation-to-be-a-function'`.

## 🔧 Build System
- **빌드 명령**: `node build.js`
- **빌드 과정**:
  1. `/modules/*.js` 파싱 (body 추출)
  2. 네임스페이스 치환 (`core.xxx` → `xxx`)
  3. UMD 래핑 + 빌드 타임스탬프
  4. **자동 테스트 실행** (`test.sh` 호출)
  5. 테스트 성공 시 `all_in_one.cjs`로 복사, 실패 시 빌드 중단

- **expectedFunctions 동적 등록**: 런타임에 각 모듈이 `core.expectedFunctions`에 직접 추가 (빌드 시 병합 불필요).

- **중요**: `build.js`의 `UMD_HEADER` 템플릿과 `modules/core.js`의 초기화 코드가 동기화 필요.
  예) `enableLog` 옵션은 `UMD_HEADER`에도 반영해야 함.

- **테스트만 실행**: `./test.sh` (빌드 없이 `/modules` 기반 테스트)
- **`test.sh`는 `all_in_one.cjs`를 절대 경로로 변환**하여 테스트 하위 디렉토리에서도 올바르게 참조.

## 🔄 Current State (as of 2025-12-31)
- **`flipCV` 추가**: variadic curried 함수의 인자 순서를 뒤집는 함수. `pipe`, `compose` 같은 가변인자 커링 함수에 유용.
- **Class-based Static Methods**: `Either`, `Free`, `Task` 클래스에 static 메소드 추가 (Promise 패턴과 유사).
  - `Either.of()`, `Either.left()`, `Either.right()`, `Either.from()`, `Either.fromNullable()`, `Either.catch()` 등
  - `Free.of()`, `Free.pure()`, `Free.impure()`, `Free.isPure()`, `Free.isImpure()`, `Free.liftF()`, `Free.runSync()`, `Free.runAsync()`
  - `Task.of()`, `Task.resolved()`, `Task.rejected()`, `Task.create()`, `Task.fromPromise()`, `Task.fromEither()`, `Task.all()`, `Task.race()`, `Task.sequence()`, `Task.traverse()`, `Task.pipeK()`
  - `Thunk.of()`, `Thunk.done()`, `Thunk.suspend()`
- **Backward Compatibility**: 기존 함수형 API (`either.left`, `either.right` 등)는 static 메소드의 alias로 유지.
- **빌드 시 네임스페이스 치환 규칙 변경**: `either.xxx` → `Either.xxx` (클래스 static 메소드로 변환).
- **모듈 내부 헬퍼 함수 이름 충돌 방지**: 각 모듈별 고유 접두사 사용.
  - `either.js`: `normalizeToError`, `toEitherErrorArray`
  - `task.js`: `normalizeTaskError`, `toTaskErrorArray`
- **Task 모듈 추가**: `task.resolved`, `task.rejected`, `task.fromPromise` 등 lazy 비동기 작업 지원.
- **Task.run**: `fork` 대신 `run`으로 명명. `task.resolved(42).run(onError, onSuccess)`.
- **Task computation 검증**: `computation.length !== 2`이면 TypeError 발생.
- **expectedFunctions 네임스페이스 방식으로 전환**: `'core:a-function'`, `'either:condition-to-be-a-function'` 등 colon 구분 사용.
  - `expectedFunction(expected)(name)(..fs)` 커링 순서로 DRY 원칙 준수.
  - 각 모듈이 런타임에 `core.expectedFunctions`에 직접 추가.
- **core.once 개선**: `option.state` 공유로 여러 함수 간 상태 공유 가능 (Task.race에서 활용).
- **`enableLog` 옵션 추가**: `funFpJs({ enableLog: false })`로 내부 경고 로그 비활성화 가능.
- **`path` 함수 추가 (extra 모듈)**: 문자열 경로로 객체에 안전하게 접근 (`path('user.name')(data)` → `Either`).
- **Template Engine**: `path`를 내부적으로 사용하여 중첩 경로 지원.
- **Unified Testing**: 모든 테스트는 `/tests/*.test.js`로 통합.
- **Retry Mechanism**: `once` utility correctly handles failures, allowing retry on exception while caching only successful results.
- **Point-free Transducers**: Implemented in `core.js` (`core.transducer`).
  - No separate module or class needed.
  - Functions: `map`, `filter`, `take`, `transduce`.
  - **Composition**: Use `compose(map(f), filter(p))` for Left-to-Right data flow.
  - Pure function composition style.
- **Monoid 클래스 리팩터링**: `Monoid`/`Group` 클래스 기반으로 전환.
  - `Group extends Monoid`
  - 인스턴스 메서드: `M.fold(list)`, `M.concat(a, b)`, `M.power(value, n)`, `M.invert(value)` (Group만)
  - Static 메서드: `Monoid.isMonoid`, `Monoid.fold`, `Monoid.concat`, `Monoid.power`, `Group.isGroup`, `Group.invert`
  - 기존 함수형 API (`monoid.fold(M)(list)`)는 static 메서드 alias로 유지

## 📝 Guidelines for Future Tasks
- **빌드 전 테스트**: `./test.sh`로 먼저 확인 후 `node build.js` 실행.
- **모듈 수정 시**: 해당 모듈과 `build.js`의 `UMD_HEADER` 템플릿이 동기화되어야 하는지 확인.
- **"Return-Either" 패턴**: 실패 가능한 함수는 throw 대신 `Either`를 반환.
- **중복 피하기**: `prop` vs `path` 같은 중복은 하나로 통합 (`path`만 유지).
- **build.js 주석은 한국어로**: 빌드 스크립트의 주석과 로그 메시지는 한국어로 작성.
- **@build-start 마커**: 각 모듈에서 빌드에 포함될 코드 시작점을 표시.
- Use `tests/utils.js` for any new test files to maintain consistency.

