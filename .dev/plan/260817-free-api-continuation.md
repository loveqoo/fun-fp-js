# 계획 v2 — Free.api 연속 적재를 O(n) 으로 (4차-3)

> v2 (2026-08-17): 코덱스 계획 리뷰(Major 3·Minor 2) 전부 반영. 변경점은 각 절의 **[v2]** 표기.

- 출처: 코덱스 4차 감사 [4차-3] (Major, CONFIRMED ×2) —
  [`review/260817-codex-index-audit-4.md`](../review/260817-codex-index-audit-4.md)
- 소유자 결정: 국소 5건과 분리해 계획 회차로 진행 (2026-08-17)

## 문제 (실측)

`makeApiCommand.map` 이 `fns.concat([f])` 로 연속 배열 전체를 매번 복사한다.
map 1만 번의 프로그램 **구성**에 기존 원소 50,005,000개가 복사된다(코덱스·주 에이전트
2회 실측). 실행은 반복문이라 스택 안전하지만 구성 비용이 O(n²)다. 문서와 테스트가
자랑하는 깊은 map 경로(2만·20만)의 이면이다.

## 왜 배열 복사인가 — 그리고 왜 연결 리스트가 맞나

명령은 **공유되는 값**이다. `p1 = cmd.map(f); p2 = cmd.map(g)` 처럼 한 명령에서 두
갈래가 나올 수 있어, 이전 연속을 변이하는 최적화(공유 배열 push)는 갈래를 오염시킨다.
영속(persistent) 구조가 필요하고, 앞에 붙이는 cons 리스트가 그 최소형이다 — 붙이기
O(1), 갈래마다 안전, 기존 노드 불변.

## 설계

`fns: Array` → `fns: { f, prev } | null` (cons 리스트, 머리가 마지막 map).

```javascript
const makeApiCommand = (name, args, fns, api) => {
    const cmd = { name, args, fns, api, map(f) { return makeApiCommand(name, args, { f, prev: fns }, api); } };
    cmd[Symbols.Functor] = true;
    return cmd;
};
const runApiContinuation = (fns, value) => {
    const stack = [];
    for (let node = fns; node !== null; node = node.prev) stack.push(node.f);
    let v = value;
    for (let i = stack.length - 1; i >= 0; i--) v = stack[i](v);
    return v;
};
```

- 생성 초기값: `makeApiCommand(name, args, [], vocabulary)` 의 `[]` → `null`.
- **[v2, 코덱스 Minor 1]** 단 `Free.liftF` 가 즉시 `command.map(Free.pure)` 를 부르므로
  사용자가 받는 명령의 연속은 항상 **사용자 map 수 + 1**(첫 노드 = `Free.pure`)이다.
  `null` 은 liftF 이전의 순간에만 존재한다. 대조 케이스 명칭의 "map 0개"는 "사용자
  map 0개"를 뜻한다.
- 적용 순서 보존: `map(f).map(g)` 의 리스트는 `{g}→{f}` 이고, 역순 배열로 펴서
  f→g 로 적용한다 — 지금과 같은 순서.
- 실행 비용: 명령당 O(연속 길이) 한 번 — 지금의 실행 루프와 같다. 구성이 O(n²)→O(n).
- 두 루프뿐이라 스택 안전 불변(기존 2만 map 검사가 그대로 지킨다).

## 변경 지점 — 셋뿐

| 자리 | 전 | 후 |
| --- | --- | --- |
| `makeApiCommand` | `fns.concat([f])` | `{ f, prev: fns }` |
| `runApiContinuation` | 배열 순회 | 리스트 펴기 + 역순 적용 |
| 생성 초기값 | `[]` | `null` |

**[v2, 코덱스 Major 1 정정]** `cmd.fns` 는 문서화되지 않았지만 **관측 불가능하지는
않다** — `Free.api` 프로그램도 Free 값이라 공개 러너(`Free.runSync` 등)에 사용자
러너를 꽂으면 명령 객체가 통째로 넘어간다. 따라서 주장을 낮춘다: 이 변경이 지키는
공개 계약은 ① 해석기 핸들러의 인자(`...cmd.args`) ② 명령의 Functor 계약(`cmd.map`)
③ `cmd.name`·`cmd.args` 필드다. `fns` 의 **형태**는 미문서 내부이며 형태 의존은
지원하지 않는다 — 이 선언을 커밋 메시지에 남긴다. **[v2, 코덱스 Minor 2 정정]**
4차-2 의 정체성 표식은 공개 api 객체가 아니라 `Free.api` 호출에 폐쇄된 `vocabulary`
객체다 — 그대로 승계한다.

## 검증 계획

1. **전후 한 프로세스 대조** — `git show HEAD:index.js` 를 나란히 로드해 관측 동작
   대조: 결과값(0/1/2/다수 map, chain 혼합), thenable 이 중간에 쓰이는 프로그램,
   에러 경로(핸들러 던짐·거부), 교차 api 거부(4차-2), map 적용 순서 기록 비교.
2. **기존 게이트** — free.test.js 전부(함자 법칙 관측 검사·2만 map 스택·에러 문안
   8종·4차-2 회귀), `npm test` 45 + 타입체크, baseline, 문서 예제.
2-1. **[v2, 코덱스 Major 2] 갈래 공유 검사 신설** — 설계의 핵심 근거(영속성)를 직접
   검증한다: 같은 선행 프로그램에서 `p1 = base.map(f); p2 = base.map(g)` 로 갈라
   각각 실행·재실행해도 결과가 독립적으로 옳다. 여기에 구조 불변도 단언한다 —
   `base.map(f)` 뒤에도 `base` 의 연속 머리가 참조 동일(`===`)로 그대로다.
3. **새 회귀 검사** — **[v2, 코덱스 Major 3 보강]** concat 계측은 특정 구현 회귀만
   잡는다(spread·slice 복사는 통과). 구현 무관 게이트를 주 검사로 둔다: **구조 공유
   단언** — `p.map(f).fns.prev === p.fns` (참조 동일). 어떤 방식으로든 복사가 돌아오면
   참조가 갈라져 빨개진다. concat 0회 계측은 보조로 유지한다.
4. **뮤테이션 3종 [v2]** — ① concat 방식으로 되돌림 → 구조 공유 단언·concat 계측
   둘 다 빨강 ② 적용 순서 뒤집기(역순 루프를 정순으로) → 기존 함자 합성 관측 검사가
   빨강 ③ map 이 새 노드 대신 자기 fns 를 변이(가짜 최적화) → 갈래 공유 검사(2-1)가
   빨강. 각각 복원 확인.
5. **O(n) 실측** — 1만/10만 map 구성 시간이 대략 선형임을 기록(참고용, 게이트 아님).

## 완료조건

- 위 대조·게이트·뮤테이션이 전부 통과하고, 구성 concat 0회가 테스트로 고정된다.
- dist 재빌드. 커밋은 수리 1개 + dist 1개.

## 하지 않는 것

- `fns` 를 공개하거나 형태를 문서화하지 않는다(내부 구조 유지).
- 청크 배열 등 더 복잡한 구조는 쓰지 않는다 — cons 가 요구(영속·O(1) 붙이기)를
  정확히 채우는 최소형이다.
