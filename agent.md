# Fun-FP-JS Project Overview & Context

This document serves as a context provider for AI agents to quickly understand the project structure and technical philosophy.

## 🚀 Project Nature
**Fun-FP-JS** is a robust, production-grade JavaScript functional programming library. It focuses on providing core FP utilities, algebraic data types (Monads, Monoids), and safe execution patterns (Trampolining, Error handling) with a strong preference for **point-free style** and **lazy evaluation**.

**Key Philosophy**: TypeScript를 사용하지 않는 이유는 빌드 없이 바로 사용할 수 있는 접근성을 중시하기 때문. 런타임 타입 안전성은 `assertFunction`과 Symbol 기반 타입 태깅으로 확보.

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
- `all_in_one.js`: A consolidated, single-file UMD build of the entire library.
- `index.js`: Entry point that initializes the library (uses `/modules` directly).
- `build.js`: Build script that consolidates modules into `all_in_one.js`.
- `test.sh`: Bash script runner that auto-detects and executes all `*.test.js` files.

## 🛠 Technical Principles
1. **Safety First**: Extensive use of `assertFunction` and `runCatch` to ensure runtime safety.
2. **Algebraic Laws**: `Either.ap` follows Applicative laws with error accumulation (concatenating `Left` values if they support it).
3. **Point-free Style**: Functions are designed to be composed without explicit arguments where possible.
4. **Stack Safety**: Recursive operations are handled via `trampoline` and `Free` monad to prevent `RangeError`.
5. **YAGNI (You Aren't Gonna Need It)**: State, Reader 등 추가 모나드는 실제로 필요할 때만 추가. 현재 `pipe`, `compose`, `converge` 등이 Reader의 역할을 충분히 수행.
6. **Left는 항상 Error 배열**: Validation 패턴과 통합을 위해 모든 Left 값은 Error 배열로 정규화.
7. **assertFunctions 키는 snake_case**: 빌드 시 네임스페이스 치환 충돌 방지. 예) `'either_fold'`, `'task_map'`, `'task_flat_map'`.

## 🔧 Build System
- **빌드 명령**: `node build.js`
- **빌드 과정**:
  1. `/modules/*.js` 파싱 및 병합
  2. `assertFunctions` 통합
  3. 네임스페이스 치환 (`core.xxx` → `xxx`)
  4. UMD 래핑 + 빌드 타임스탬프
  5. **자동 테스트 실행** (`test.sh` 호출)
  6. 테스트 성공 시 `all_in_one.js`로 복사, 실패 시 빌드 중단

- **중요**: `build.js`의 `UMD_HEADER` 템플릿과 `modules/core.js`의 초기화 코드가 동기화 필요.
  예) `enableLog` 옵션은 `UMD_HEADER`에도 반영해야 함.

- **테스트만 실행**: `./test.sh` (빌드 없이 `/modules` 기반 테스트)
- **`test.sh`는 `all_in_one.js`를 절대 경로로 변환**하여 테스트 하위 디렉토리에서도 올바르게 참조.

## 🔄 Current State (as of 2025-12-29)
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
- **assertFunctions 키 snake_case 통일**: `'either_fold'`, `'task_map'`, `'task_flat_map'` 등 소문자와 밑줄만 사용.
- **core.once 개선**: `option.state` 공유로 여러 함수 간 상태 공유 가능 (Task.race에서 활용).
- **`enableLog` 옵션 추가**: `funFpJs({ enableLog: false })`로 내부 경고 로그 비활성화 가능.
- **`path` 함수 추가 (extra 모듈)**: 문자열 경로로 객체에 안전하게 접근 (`path('user.name')(data)` → `Either`).
- **Template Engine**: `path`를 내부적으로 사용하여 중첩 경로 지원.
- **Unified Testing**: 모든 테스트는 `/tests/*.test.js`로 통합.
- **Retry Mechanism**: `once` utility correctly handles failures, allowing retry on exception while caching only successful results.
- **Strict Validation**: `apply2` and similar utilities enforce strict argument counting.

## 📝 Guidelines for Future Tasks
- **빌드 전 테스트**: `./test.sh`로 먼저 확인 후 `node build.js` 실행.
- **모듈 수정 시**: 해당 모듈과 `build.js`의 `UMD_HEADER` 템플릿이 동기화되어야 하는지 확인.
- **"Return-Either" 패턴**: 실패 가능한 함수는 throw 대신 `Either`를 반환.
- **중복 피하기**: `prop` vs `path` 같은 중복은 하나로 통합 (`path`만 유지).
- Use `tests/utils.js` for any new test files to maintain consistency.

