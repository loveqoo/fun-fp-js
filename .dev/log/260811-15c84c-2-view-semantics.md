# Context — `view` 의 계약은 이미 세 곳에 적혀 있었다

회차 2 Context. 리뷰 #6(`view` 동작 3건 변경)의 처리 방향을 정하기 위해 **기존 명세**를 찾았다.

## 찾은 것

세 곳이 **독립적으로 같은 말**을 하고 있다 — `view` 는 **Lens 전용이고 전역 함수(total)** 다.

| 출처 | 내용 |
| --- | --- |
| `types/Lens.d.ts:79` | `export declare function view<S, A>(lens: Lens<S, A>, s: S): A;` — 인자가 `Lens`, 반환이 `A` (**`A \| undefined` 가 아니다**) |
| `types/Lens.d.ts:78` (주석) | `// Only meaningful for optics with exactly one target.` |
| `CLAUDE.md:210` | `읽기: view(Lens 전용) / preview(첫 대상, Maybe) / toListOf(전부).` |

대비되게, 같은 파일이 나머지 둘은 **명시적으로 전체 optic 용**이라고 적는다:

```
// First target, if any. Works for every optic.
export declare function preview<S, A>(optic: Optic<S, A>, s: S): Maybe<A>;
// Every target, in order. Works for every optic.
export declare function toListOf<S, A>(optic: Optic<S, A>, s: S): A[];
```

## 그래서 판정이 뒤집힌다

회차 1 Verification 은 이렇게 적었다 — "바뀐 동작이 더 나은가는 **별개 문제**다".
**별개가 아니었다. 이미 결정돼 있었고 런타임이 그걸 안 지키고 있었다.**

| 호출 | 변경 전 | 변경 후 | 명세 대비 |
| --- | --- | --- | --- |
| `view(prism, 매치실패)` | `undefined` | TypeError | **전이 위반** — 선언은 `: A` 인데 `undefined` 를 줬다 |
| `view(traversed('array'), [1,2,3])` | `3` | `1` | **둘 다 명세 밖** — Traversal 은 Lens 가 아니다 |
| `view(traversed('array'), [])` | `undefined` | TypeError | **전이 위반** — 위와 같음 |

**옛 동작이 버그였고, 이번 변경이 런타임을 명세에 맞췄다.** 우연히 그렇게 됐다는 점이
문제일 뿐 방향은 옳다.

→ 리뷰 #6 의 처리는 **회차 1 Verification 이 제시한 세 선택지 중 1번(새 동작을 의도로 채택)**
이다. 2번(되돌림)은 명세를 어기는 쪽으로 되돌리는 것이라 배제된다.

## 남는 결정 — 3번 선택지의 일부는 살아 있다

`view(traversed(...), ...)` 는 **두 동작 다 명세 밖**이었다. 지금은 "대상 없음" 메시지가
나가는데, 진짜 원인은 **Traversal 을 `view` 에 넘긴 것**이다. 에러가 원인을 가리킨다:

| 안 | 메시지 |
| --- | --- |
| 현재 | `view: optic has no target — 대상이 없을 수 있으면 preview 를 쓰라` |
| 개선 | 대상이 0개인 것과 **애초에 Lens 가 아닌 것**을 구분 |

다만 profunctor 인코딩에서 **optic 은 그냥 함수**라 "이건 Lens 인가" 를 값으로 물을 수 없다.
`_PForget` 이 몇 개를 모았는지로 사후 구분하는 것이 최선이고, 그건 `[]` 인 Traversal 과
매치 실패한 Prism 을 여전히 구분 못 한다. **구분 불가를 받아들이고 메시지 하나로 간다** —
`Tagged` 에 `first`/`wander` 가 없는 것으로 `review` 오용을 잡는 것과 같은 급의 정밀도는
`view` 쪽에 없다.

## 부수 — 에러 메시지 언어

새 메시지가 `index.js` 전체에서 **유일한 한글 에러 메시지**다(리뷰 #6 부수 지적).
나머지는 전부 영어다. 라이브러리 사용자가 한국어 화자라는 보장이 없으므로 **영어로 맞춘다.**

## 회차 2 에서 참고할 기존 기록

- `.dev/learning/INDEX.md` 규칙 2(연산으로 조회), 6(입구 없는 내부 교체), 7(동작 변경은 먼저 테스트)
- `.dev/review/260811-15c84c-1-monoid-registration.md` 우선순위표
- `docs/Optics.md:75-133` — `view` 예제는 전부 `Iso`/`Lens` 다. **문서는 이미 옳았다**
