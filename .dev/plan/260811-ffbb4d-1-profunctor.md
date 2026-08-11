# Optics — profunctor 인코딩으로 전환

## Context

직전 작업에서 Prism/Traversal 을 van Laarhoven 인코딩으로 추가했다. 그런데 `review` 가
그 표현에서 나오지 않아 `Prism` 이 `build` 를 심볼 프로퍼티로 이고 다니게 했고,
**합성이 그것을 잃어 `review(composeOptic(p1, p2), a)` 가 깨졌다** — 실측으로 확인함.

나는 "profunctor 전환은 Traversal 의 Wander 때문에 난이도가 높다" 고 했는데 **틀렸다.**
Haskell 에서 Wander 가 어려운 것은 rank-2 타입(`forall f. Applicative f => ...`)을 타입
시스템이 강제하기 때문이고, **JS 는 딕셔너리를 값으로 넘기므로 그 제약이 없다.**
프로토타입 30줄로 전부 동작함을 확인했다 — 합성 review, Iso, Lens 에 review 시 올바른 거부까지.

## 왜 이 인코딩인가

```
Optic s a = P => P a a -> P s s
```

**어떤 P 를 주입하느냐가 연산을 정한다.** 하나의 정의에서 읽기·쓰기·역생성이 전부 나온다.

| P | 연산 | 필요한 메서드 |
| --- | --- | --- |
| 함수 | `over`, `set` | dimap, first, left, wander |
| `Forget<r>` | `view`, `preview`, `toListOf` | 같음 (monoid 누적) |
| `Tagged` (`Tagged a b = b`) | `review` | **dimap, left 만** |

`Tagged` 에 `first`/`wander` 가 없다는 사실이 **타입 안전성을 대신한다** — Lens/Traversal 에
`review` 를 쓰면 그 자리에서 TypeError. 심볼 표식 같은 수동 검사가 사라진다.

`wander` 는 기존 `Traversable.of(key).traverse` 에 위임한다:

```js
wander: (traverse, p) => s => traverse(_Identity, a => _Identity.of(p(a)), s).value
```

내부 `_Identity`/`_Const` 는 **이 호출에만** 남는다 — optic 표현에서는 빠진다.

## 변경 사항

### `index.js` — Optics 섹션 전면 교체

```js
const _PFn      = { dimap, first, left, wander }   // over/set
const _PForget  = monoid => ({ dimap, first, left, wander })  // view/preview/toListOf
const _PTagged  = { dimap, left }                  // review — first/wander 없음이 곧 제약

const Lens  = (get, set) => P => pab => P.dimap(s => [get(s), s], ([b,s]) => set(b,s), P.first(pab));
const Prism = (match, build) => P => pab => P.dimap(
    s => Maybe.fold(() => Either.Right(s), a => Either.Left(a), match(s)),
    e => e.isLeft() ? build(e.value) : e.value,
    P.left(pab));
const traversed = key => { const i = Traversable.of(key); return P => pab => P.wander((F,f,s) => i.traverse(F,f,s), pab); };
```

합타입 표현은 **라이브러리의 `Either`** 를 쓴다(임시 태그 객체가 아니라). `Maybe` 를 이미
쓰고 있으므로 일관된다.

`composeOptic` 은 지금과 형태가 같다 — optic 합성이 곧 함수 합성이다.
**`composeLens` 는 제거한다**(사용자 확인: 하위 호환 불필요). `Symbols.PrismReview` 도 제거.

### 나머지

| 파일 | 내용 |
| --- | --- |
| `tests/optics.test.js` | `composeLens` 호출부 교체, **합성 review 테스트 추가**, Lens 에 review 시 거부 확인 |
| `types/Lens.d.ts` | profunctor 인코딩에 맞게. `Optic<S,A>` 를 P 기반으로 |
| `docs/Optics.md` | review 한계 서술 삭제, 새 인코딩 설명(P 선택 표) |
| `docs/Lens.md` | `composeLens` 언급 교체 |
| `docs/README.md` | 표의 `composeOptic` 표기 확인 |
| `CLAUDE.md` | (Context 단계에서 완료) |

## Verification

1. **동작 보존이 최우선** — 기존 optics 테스트 43개가 (composeLens 호출부만 바꿔) 그대로 통과
2. **조건 2** — `review(composeOptic(p1,p2), a) === review(p1, review(p2, a))` 테스트
3. **조건 3** — `review(lens, x)` 와 `review(traversal, x)` 가 던지는지 테스트
4. **조건 4** — `Symbols.PrismReview` 가 코드에서 사라졌는지 grep, optic 함수에 프로퍼티가
   붙지 않는지 확인 (`Object.keys(prism).length === 0`)
5. `npm test` + `tsc --noEmit` + 문서 예제 + CI
6. **구현 깨뜨리기** — `_PTagged.left` 를 잘못 만들거나 `wander` 위임을 끊었을 때 테스트가
   잡는지

## 되돌리는 법

Optics 섹션만 교체하므로 그 커밋 하나를 revert. 직전 커밋(van Laarhoven 판)이 안전망이다.

## 범위 밖

- `Iso` — `dimap` 2줄로 나오지만 사용자가 요청한 범위(Prism + Traversal)를 넘는다.
  전환이 끝난 뒤 별도로 물어본다
- `Optional`, `Fold`, `Getter`/`Setter`
- 타입 변경(type-changing) optics
