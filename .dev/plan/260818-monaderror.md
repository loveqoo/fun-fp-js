# 계획 — `MonadError`: 실패를 일급으로 다루는 타입 클래스

## Context — 왜 하는가

실패를 만들고 잡는 일이 타입마다 다른 이름으로 흩어져 있다(실측): `Task` 는
`rejected`/`catchError`, `Either` 는 `Left` 와 `fold`(그리고 `Either.catch` 는 전혀
다른 뜻 — 던지는 함수 감싸기), `Maybe`·`Validation` 은 복구 문이 아예 없다. 소유자
판단: **구조가 없어서 불편한 상태**다.

세우면 얻는 것 둘 — ① **명부가 빈칸을 드러낸다**: "실패를 만들고 잡는다"가 계약이
되어 지금의 비대칭이 결함으로 보인다(Wander·Foldable 때와 같은 효과) ② **법칙 게이트에
실패 경로가 처음 들어온다**: 현재 149개 인스턴스의 법칙은 전부 성공 경로만 본다.
무음 정지 계열을 네 번 잡은 저장소에서 이건 작지 않다.

소유자 확정: 이름 `MonadError` / `raiseError`·`handleError`(계보 정식 이름, 기존
`catch` 와 확실히 구별), 등록 대상은 **Task·Either 둘**.

## 설계

### 타입 클래스 (index.js, Monad 정의 뒤)

```javascript
class MonadError extends Monad {
    constructor(monad, raiseError, handleError, type, registry, ...aliases) {
        checkAndSet('MonadError.super')(monad);
        super(monad.of, monad.chain, type);          // 관례: 상위의 몸을 그대로 물려받는다
        unwrapIfSameType(this, monad, 'of', 'ap', 'chain');
        checkAndSet('MonadError')(this, monad, raiseError, handleError);
        registry && register(registry, this, ...aliases);
    }
    raiseError() { raise(new Error('MonadError: raiseError is not implemented')); }
    handleError() { raise(new Error('MonadError: handleError is not implemented')); }
}
MonadError.prototype[Symbols.MonadError] = true;
```

정확한 인자 구성·`checkAndSet` 사용법은 이웃 클래스(`Alt`/`Plus`/`Monad`)의 실물을
그대로 따른다 — 새 관례를 만들지 않는다.

### 인스턴스 둘

| 타입 | `raiseError(e)` | `handleError(f, fa)` |
| --- | --- | --- |
| Task | `Task.rejected(e)` | `fa.catchError(f)` — 이미 있는 몸 |
| Either | `Either.Left(e)` | `isLeft(fa) ? f(fa.value) : fa` (fold 로 유도) |

`f` 는 **에러를 받아 같은 타입의 값을 돌려주는 함수**다(복구도 재실패도 가능).
`f` 가 그 타입이 아닌 것을 돌려주면 라벨 있는 TypeError 로 거부한다.

### 공개 표면

`fp.MonadError`(lookup·types), 인스턴스 이름은 관례대로 `TaskMonadError`·
`EitherMonadError` + 별칭 `task`·`either`. 데이터 타입의 기존 문(`Task.catchError`
등)은 **그대로 둔다** — 이 회차는 추상을 얹는 것이지 문을 옮기는 것이 아니다.

## 법칙 (게이트 편입)

`tests/staticland-laws.test.js` 의 `CLASS_LAWS` 에 추가. 명세 밖 클래스이므로
`Strong`/`Choice`/`Wander` 와 같은 취급(문서에 명시).

1. `handleError(f, raiseError(e))` ≡ `f(e)` — 잡으면 핸들러가 이긴다
2. `handleError(f, of(a))` ≡ `of(a)` — 성공은 안 건드린다
3. `handleError(raiseError, fa)` ≡ `fa` — 항등 복구
4. `chain(f, raiseError(e))` ≡ `raiseError(e)` — 실패는 사슬을 단락시킨다
   (Monad 와의 정합 — 이것이 "실패가 일급"의 뜻)

## 함께 바꾸는 파일

- `index.js` — 클래스 + 인스턴스 2 + `Symbols.MonadError` + export.
- `tests/staticland-laws.test.js` — CLASS_LAWS 4법칙, 순회 개수 잠금 갱신.
- `tests/monaderror.test.js`(신설) — 동작·거부 문안·유도 검사.
- `types/` — `MonadError.d.ts` + `index.d.ts` 편입 + `TypeClasses` 인스턴스 선언.
- `docs/MonadError.md`(신설, 실행 예제) + `docs/README.md` 학습 순서·표 편입 +
  `docs/internals.md` 에 "명세 밖" 근거 한 줄.
- `CHANGELOG.md` 미발행 절. `dist/` 재빌드(기능 커밋 → 빌드 → dist 커밋).
- `.dev/TODO.md`.

## 검증

1. **동작** — 두 인스턴스가 raise/handle 을 실제로 하고, 기존 문(`Task.catchError`·
   `Either.fold`)과 결과가 같다(전후가 아니라 **동치 대조**).
2. **법칙 게이트** — 4법칙이 두 인스턴스에서 돌고, 순회 개수가 늘어난 것을 잠금.
3. **뮤테이션 4종** — ㉮ `handleError` 가 성공도 잡게 → 법칙 2 빨강 ㉯ `raiseError` 가
   성공값을 만들게 → 법칙 1·4 빨강 ㉰ Either 의 handle 이 Right 를 f 에 넘김 → 법칙 2
   빨강 ㉱ 잘못된 반환 타입 거부 제거 → 문안 검사 빨강. 각각 복원 확인.
4. **전체 게이트** — `npm test` 46 + 타입체크, 문서 예제, baseline(기대 차이:
   `MonadError` 명부 신설 + 인스턴스 2 추가, 없어진 것 0), dist 재빌드.

## 절차 (관례)

코덱스 계획 리뷰 → 반영(v2) 보고 → 구현(테스트 선행) → 검증 전부 → 코덱스 구현
리뷰 → TODO 기록. 커밋·푸시는 소유자 지시.

## 하지 않는 것

- Maybe·Validation 인스턴스 — Maybe 는 에러 정보가 없는 특수 경우(E=void), Validation
  은 Monad 가 아니고 실패를 누적하는 타입이라 의미론이 어긋난다(cats 도 안 준다).
- `ApplicativeError`(상위 분리) — 대상이 둘뿐이라 계단을 하나 더 두는 값이 없다.
- 기존 문 이동·개명 — `Task.catchError` 등은 그대로. 추상만 얹는다.

---

## v2 — 코덱스 계획 리뷰 반영 (Blocker 2 · Major 5 · Minor 4, 2026-08-18)

**[Blocker 1] 생성자 초안이 실제 관례와 어긋났다.** `Monad` 는 함수가 아니라
**인스턴스 둘**(`applicative`, `chain`)을 받는다(`index.js:777`). 초안대로면 첫
`new` 에서 `Monad: first argument must be an Applicative` 로 터진다. v2 의 형태 —
이웃(`EitherMonad`)과 같은 모양:

```javascript
class MonadError extends Monad {
    constructor(applicative, chain, raiseError, handleError, type, registry, ...aliases) {
        super(applicative, chain, type);              // 상위가 of/ap/chain 을 세운다
        checkAndSet('MonadError')(this, raiseError, handleError);
        registry && register(registry, this, ...aliases);
    }
    raiseError() { raise(new Error('MonadError: raiseError is not implemented')); }
    handleError() { raise(new Error('MonadError: handleError is not implemented')); }
}
class TaskMonadError extends MonadError {
    constructor() {
        super(Applicative.types.TaskApplicative, Chain.types.TaskChain,
              e => Task.rejected(e), (f, fa) => fa.catchError(f), 'Task', MonadError.types, 'task');
    }
}
```

**[Blocker 2] `checkAndSet` 규칙을 표에 신설한다** — `ChainRec` 항목과 같은 모양의
`MonadError: { strict, loose }`. strict 에서 두 인자가 함수인지 보고 인스턴스에 붙이며,
`handleError` 의 첫 인자가 함수가 아니면 라벨 거부(`MonadError.handleError: first
argument must be a function`). 계획의 "함께 바꾸는 파일"에 이 항목을 명시한다.

**[Major 3] Task 등식 관측을 고친다 — 이번 회차의 핵심 부수 소득.** 현재 `forkSync`
는 동기 정착만 보고 비동기는 `['(안 열림)']` 로 뭉개서, **양쪽이 비동기면 무엇이든
같다고 판정한다**(기존 Monad·Applicative 법칙에도 있던 사각). MonadError 법칙은
비동기 정착까지 봐야 의미가 있으므로, 법칙 게이트에 **비동기 관측 경로**를 추가한다:
정착까지 기다리는 관측기 + 타임아웃으로 미정착 구분 + 일회 정착 확인. Task 표본에
비동기 성공·거부 표본을 넣는다. (이 개선은 MonadError 뿐 아니라 기존 Task 법칙에도
적용되므로 별도 소득으로 기록한다.)

**[Major 4] 법칙을 다시 정한다** — 법칙 3(항등 복구)은 Task·Either 에서 1·2 로
유도되어 중복이므로 뺀다. 대신 **중첩/재실패 법칙**을 넣는다:
`handleError(g, handleError(f, raiseError(e))) ≡ handleError(g, f(e))`
(첫 핸들러가 재실패하면 바깥이 잡는다 — `Task.catchError` 의 재거부 동작을 추상 층에서
고정). 최종 4법칙: ① 잡으면 핸들러 ② 성공은 불변 ③ 중첩/재실패 ④ 실패는 사슬 단락.

**[Major 5·6] 잘못된 반환 타입의 계약을 확정한다.** 검증은 **인스턴스가 하지 않고
기존 문에 맡긴다** — Task 는 `catchError` 가 실행 시점에 `Task.catchError: handler
must return a Task` 로 거부(기존 테스트가 문안을 고정), Either 는 fold 유도가 검사를
안 하므로 **인스턴스에서 `Either.isEither` 확인 후** `MonadError.handleError: handler
must return an Either` 로 던진다(생성 시점 = 동기). **두 타입의 시점·라벨이 다르다는
사실을 문서와 테스트로 명시**한다 — 통일하려면 Task 의 기존 문안을 깨야 하므로 안 한다.

**[Major 7] 뮤테이션을 6종으로** — ㉮ 성공도 잡음 → 법칙 ② ㉯ raiseError 가 성공 생성
→ 법칙 ①④ ㉰ 핸들러를 아예 안 부름 → 법칙 ① ㉱ 원래 에러 대신 다른 값을 넘김 →
법칙 ①(에러 보존) ㉲ 핸들러 재실패를 삼킴 → 법칙 ③ ㉳ Either 반환 타입 거부 제거 →
문안 검사. 비동기 미정착 변이(catchError 가 정착 안 함)는 Major 3 의 새 관측기가 잡는다.

**[Minor 8] 순회 개수 잠금** — 합계 하나만 올리지 않고 `Setoid` 처럼 **MonadError
클래스별 개수(2)를 독립으로 잠근다**.

**[Minor 9] baseline 기대 정정** — "인스턴스 2 추가"가 아니라: 최상위 export 1
(`MonadError`), 타입클래스 정적 표면 명단 1행, 레지스트리 키 4개(`TaskMonadError`·
`task`·`EitherMonadError`·`either`), `Algebra.all` 역인덱스 변화. 없어진 것 0.

**[Minor 10] Maybe 제외 사유 정정** — "E=void 라 구조적으로 불가능"은 부정확하다.
정확한 사유: **오류 값을 보존하는 것이 이 클래스의 계약**인데 `Nothing` 은 값을 안
지녀 법칙 ①(에러 보존)이 공허해진다. 또한 Maybe 의 `Plus.zero`·`Alt.alt` 가 이미 그
자리를 차지해 두 문의 의미가 겹친다. Either/Task 는 Plus 가 없어 겹침이 없다 —
이 관계를 `docs/internals.md` 에 한 줄로 남긴다.

**[Minor 11]** 문서에서 `Either.catch`(던지는 함수 감싸기)와 `handleError`(실패 복구)를
**나란히 놓고** 다른 연산임을 명시, 실행 예제로 각각 고정.
