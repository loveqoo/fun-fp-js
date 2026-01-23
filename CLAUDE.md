# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소에서 작업할 때 참고하는 가이드입니다.

## 프로젝트 개요

**fun-fp-js**는 Static Land 및 Fantasy Land 명세를 구현한 JavaScript 함수형 프로그래밍 라이브러리입니다. 대수적 데이터 타입(Maybe, Either, Task, Free Monad), 타입 클래스(Functor, Monad, Applicative, Traversable 등), 핵심 FP 유틸리티(compose, pipe, curry)를 제공합니다.

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
# 전체 테스트
node tests/*.test.js

# 개별 테스트 파일
node tests/maybe.test.js
node tests/either.test.js
node tests/task.test.js
node tests/free.test.js
node tests/func.test.js
```

### 브라우저 테스트
`test.html`을 브라우저에서 열어 UMD 번들의 브라우저 호환성 테스트를 실행합니다.

## 아키텍처

### 단일 파일 구조 (의도적 설계)

전체 라이브러리가 `index.js` (~1835줄)에 있습니다. 모듈 분리보다 단일 파일 구조를 선택한 이유:
- 모듈을 나눠서 관리하는 비용보다 나눠진 모듈을 모아서 빌드하는 비용이 더 큼
- 최종 배포물이 하나의 파일이므로 개발 시점 분리의 이점이 적음

파일 구성:

1. **Polyfills & Symbols** (1-70줄) - ES6 호환성, 타입 식별 심볼
2. **타입 시스템** (70-140줄) - 타입 체킹을 위한 `types` 객체
3. **핵심 유틸리티** (140-370줄) - `compose`, `pipe`, `curry`, `tap`, `partial` 등
4. **타입 클래스** (370-610줄) - Algebra, Setoid, Ord, Semigroup, Monoid, Functor, Monad 등
5. **Function/Array 인스턴스** (710-1100줄) - 내장 타입에 대한 타입 클래스 구현
6. **핵심 데이터 타입** (1100-1500줄) - Maybe, Either, Task, Free
7. **순회 & 유틸리티** (1500-1700줄) - `sequence()`, `lift()`, `pipeK()`
8. **설정** (1700-1800줄) - `setStrictMode()`, `setTapErrorHandler()`

### 검증 로직 분리 (checkAndSet)

타입 클래스의 검증 로직은 `checkAndSet` 함수에 집중되어 있습니다. 이는 의도적인 설계입니다:
- 검증 로직이 타입 정의보다 크면 타입의 본질이 가려짐
- 타입 클래스는 핵심 동작만 표현하도록 유지
- 검증 로직은 한 곳에서 일관되게 관리

### 핵심 데이터 타입

- **Maybe** - nullable 값을 위한 `Just`/`Nothing`. Functor, Monad, Foldable, Traversable, Filterable 구현.
- **Either** - 에러 처리를 위한 `Right`/`Left`. Left가 Semigroup일 때 `ap()`가 Left 값을 누적.
- **Task** - 지연 실행되는 Promise 유사 비동기 모나드. `fork(onError, onSuccess)`로 실행.
- **Free** - 트램폴린을 통한 스택 안전 재귀. `liftF()`로 펑터를 리프트하고, `runSync`/`runAsync`/`runWithTask`로 실행.

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
