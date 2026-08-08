# docs 7종 — 회차 2: Transformer 4종 + README 인덱스

## Context

회차 1에서 예제 실행 검사기(`tests/docs-examples.test.js`)와 3종 문서를 냈다
(Lens 324줄 / Transducer 379줄 / Actor 396줄, 예제 45개 전부 실행 검증).
남은 것은 Monad Transformer 4종과 `docs/README.md` 인덱스 편입이다.

이번 회차의 Context 단계에서 **문서화되지 않은 함정 하나가 드러났다.** 이것이 4종 문서의
서술 방향을 결정한다.

## 이번 회차에서 새로 확인한 사실

### 문자열 M 과 객체 M 은 서로 다른 타입이다

`resolveMonadType` (`index.js:2355`) 이 타입명을 만드는 방식 때문이다.

| 호출 | `_typeName` | 레지스트리 alias |
| --- | --- | --- |
| `StateT('maybe')` | `StateT(Maybe)` | `statet(maybe)` |
| `StateT(Maybe)` | `StateT(M1)` | `statet(m1)` — **실행 순서에 따라 달라진다** |

- 객체를 넘기면 `type` 프로퍼티가 없어 `M1`, `M2` ... 가 순서대로 붙는다
- 두 형태는 **다른 클래스**다. nominal typing 이 강제되므로 섞으면 `TypeError`:
  `StateT('maybe').runState(0, StateT(Maybe).of(1))` → throw (실행으로 확인)
- `Functor.of('statet(maybe)')` 는 **문자열로 만든 것만** 찾는다
- `index.js:2351-2353` 에 주석으로만 있고 사용자 문서에는 없었다

→ **4종 문서 전부 문자열 형태(`StateT('maybe')`)를 기본으로 쓴다.**
→ `CLAUDE.md` 는 이번 Context 단계에서 이미 수정했다 (예제가 객체 형태와 문자열 형태로
   서로 모순돼 있었다). 수정본은 실행으로 재현 확인했다.

### 확인된 API 형태 (전부 실행으로 검증)

```
StateT('maybe').runState(s, p)  → Maybe.Just([a, s])   p.run(s) / p.eval(s) / p.exec(s) 도 동일
ReaderT('maybe').runReaderT(env, p) → Maybe.Just(a)
WriterT('maybe').runWriterT(p)      → Maybe.Just([a, log])
EitherT('maybe').runEitherT(p)      → Maybe.Just(Either.Right(a))
```

- **`catchError` 는 정적 메서드이고 인자 순서는 `(program, handler)` 다** —
  `ET.catchError(prog, e => ET.of(0))`. 인스턴스 메서드가 아니다 (`index.js:2429`)
- `WriterT(M, monoid)` — 기본은 Array Monoid, `Monoid.of('string')` 등으로 교체 가능
- `ST.lift(Maybe.Nothing())` 은 전체를 Nothing 으로 단락시킨다

## 변경 사항

### 1. `docs/StateT.md` — 4종의 개념 허브 (가장 길게)

Transformer 4종은 같은 인프라(Free 기반 + `registerTransformerTypeClasses`)를 공유한다.
같은 설명을 네 번 반복하면 문서 자체가 유지보수 대상이 된다.
**StateT 에 공통 개념을 세우고 나머지 3종이 링크로 참조한다.**

StateT 가 담을 공통 절:
- `## 왜 Transformer인가?` — "상태 + 실패" 를 손으로 엮을 때의 문제
- `## M 은 문자열로 넘긴다` — 위 표를 그대로. **이 절만 4종 문서에 모두 넣는다**
  (링크로 미루기엔 너무 자주 밟는 함정이다)
- `## 공통 구조` — `of`/`lift`/`chain`, Free 기반이라 스택 안전, 타입 클래스 레지스트리 편입

그다음 StateT 고유 내용: `get`/`put`/`modify`/`gets`, `runState`/`eval`/`exec`,
`StateT('maybe')` 와 `StateT('task')` 예시.

### 2. `docs/EitherT.md`, `docs/ReaderT.md`, `docs/WriterT.md`

각자 고유 연산에 집중하고 공통 개념은 StateT 로 링크한다.

- **EitherT** — `throwError`/`catchError`(정적, `(program, handler)`)/`fromEither`.
  대표 조합은 `EitherT('task')` (비동기 + 에러)
- **ReaderT** — `ask`/`asks`/`local`. 의존성 주입, `local` 로 환경 교체
- **WriterT** — `tell`, Monoid 교체(Array 기본 / String / Number)

각 200줄 이상, 실용 예시 3개 이상 (조건 2·3).

### 3. `docs/README.md` — 인덱스 편입 (조건 4)

- **학습 순서**: `### 2단계` 의 "고급" 아래에 Lens/Transducer/Actor 를 두고,
  Transformer 4종은 **새 단계 "9단계: Monad Transformer"** 로 묶는다
  (Free 다음에 오는 개념이므로 맨 뒤가 맞다)
- **데이터 타입 요약 표**: 7종 행 추가
- **추상 함수 표**: 해당 없음 (transformer 는 타입이지 추상 함수가 아니다)

## Verification

완료 조건 8개를 **전부** 대조한다 (회차 1에서 2·3·5·6·7·8 을 3종 범위로 확인했고,
이번엔 7종 전체 + 조건 1·4 가 추가된다).

1. **조건 1** — `docs/` 에 7개 파일 존재를 스크립트로 확인
2. **조건 2·3** — 회차 1의 검사 스크립트를 7종으로 돌린다 (섹션 5종 + 200줄 + 예시 3개)
3. **조건 4** — `docs/README.md` 에 7종 링크가 전부 있고 요약 표에도 있는지 grep
4. **조건 6** — `npm test` 의 `총 N개 예제 실행` 이 45 → 크게 증가하고 전부 통과.
   **`아직 없는 문서:` 줄이 사라져야 한다** (7종 전부 존재한다는 뜻)
5. **조건 7** — 새로 쓴 4종 중 하나에 문서 부패를 주입해 non-zero 확인 후 복원
6. **조건 8** — Node 20/22 컨테이너에서 `npm test` 통과
7. **추가** — 문서가 주장하는 `TypeError` 사례(문자열/객체 혼용, `catchError` 인자 순서)가
   실제로 그렇게 동작하는지 예제 안에서 `try/catch` 로 실행 검증한다

## 범위 밖

- 기존 30종 문서를 검사기 대상에 넣는 것 (별도 작업)
- `README.md:7` 의 TypeScript 체크박스 (후보 D)
- `resolveMonadType` 의 `M1` 자동 채번을 고치는 것 — **문서화로 대응한다.**
  동작을 바꾸면 기존 사용자의 `_typeName` 이 달라진다
