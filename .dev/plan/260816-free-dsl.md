# 계획 — `Free.dsl` (2026-08-16, 최종형 · 코덱스 리뷰 반영 v2)

## 출처와 수렴 과정

에이전트 설계 7회 실패([`retrospect/260816-free-dsl-design-failure.md`](../retrospect/260816-free-dsl-design-failure.md))
후 **소유자가 설계를 가져왔고**, 소유자의 질문 셋이 최종형까지 깎았다: 병렬 `{commands,
interpret}` → 어휘·해석기 분리 → payload 빌더 제거(역할 없음). 스파이크 실측
(`scratchpad/free-dsl-v3.mjs`). 소유자 확인: *"제가 원하는 그림과 가장 비슷합니다."*
**코덱스 계획 리뷰(Blocker 1·Major 5·Minor 5) 전부 반영** — 주 에이전트가 Blocker(교차 dsl
벌거벗은 에러)와 Major 5(깊은 map 스택 RangeError) 를 독립 재현으로 확인했고, 스택 수선안
(함수 목록 연속)도 사전 검증했다(2만 단계 통과·법칙 유지·Free 정합).

## 목표

사용자가 Free·liftF·함자·심볼을 모르고 프로그램을 쓰고 실행한다. 3층 학습 곡선:
Beginner(`api.x().chain().map()`) / Intermediate(`Free.dsl`·해석기) / Advanced(`liftF`·함자·법칙).

## API 계약 (최종형)

```javascript
const api = Free.dsl('getUser', 'getPosts', 'saveUser');    // 어휘 — 이름이 전부

const program = api.getUser(1)                               // 평범한 Free 값
    .chain(user => api.getPosts(user.id)
        .chain(posts => api.saveUser({ ...user, posts })))
    .map(() => 'done');

const real = api.interpreter({                               // 해석기 — 몇 벌이든
    getUser: id => db.users[id],                             // 값 | thenable | Task 반환
    getPosts: userId => Task.of(db.posts[userId]),
    saveUser: user => Promise.resolve(user),
});
await real.run(program);                                     // Promise
```

### 내부 구조 (코덱스 Major 2·5 반영)

- 노드: `{ name, args, fns }` + `Symbols.Functor`. **연속은 클로저 중첩이 아니라 함수 목록** —
  `map(f)` 는 `fns.concat([f])` 로 새 노드, 실행 시 반복문 적용. 깊은 map 사슬에 스택이 안
  자란다(사전 검증: 2만 단계 → 값 20000, 항등·합성 법칙 유지). `TaskChainRec` 수리와 같은 결.
- **api 와 핸들러 조회 테이블은 `Object.create(null)`** — 명령 이름 `toString`·`constructor` 가
  안전하고, `__proto__` 로 프로토타입이 오염되지 않는다(1차 리뷰 ④ 리졸버 수리와 같은 규율).
  핸들러 대조·조회는 전부 own-property 로.
- run 은 **명령마다 own-property 가드**를 지나 디스패치한다(교차 dsl 방어 — 아래 Blocker 반영).

### 에러 문안 (전부 이 표기 그대로 — 시점 명시)

| 상황 | 시점·방식 | 문안 |
| --- | --- | --- |
| 이름이 비었거나 문자열 아님 | dsl 호출 · throw | `Free.dsl: command name must be a non-empty string` |
| 이름이 `interpreter` | dsl 호출 · throw | `Free.dsl: command name 'interpreter' is reserved` |
| 이름 중복 | dsl 호출 · throw | `Free.dsl: duplicate command name '<이름>'` |
| handlers 가 평범한 객체 아님 (null·배열·함수 포함) | interpreter 호출 · throw | `Free.dsl.interpreter: handlers must be a plain object` |
| 어휘에 없는 핸들러 (own key 만 봄) | interpreter 호출 · throw | `Free.dsl.interpreter: unknown command '<이름>'` |
| 핸들러 누락/함수 아님 (상속 핸들러는 인정 안 함) | interpreter 호출 · throw | `Free.dsl.interpreter: missing handler '<이름>'` |
| run 인자가 Free 값 아님 | run · **Promise reject** | `Free.dsl.run: program must be a Free value` |
| 실행 중 미지의 명령 (교차 dsl) | run · **Promise reject** | `Free.dsl.run: no handler for '<이름>'` |

**[코덱스 Blocker 반영]** 마지막 줄은 "스파이크 그대로" 로는 도달하지 않는다(벌거벗은
`handlers[cmd.name] is not a function` 이 남 — 실측). 구현은 반드시 run 의 디스패치에 명시적
own-property 가드를 넣고, 교차 dsl reject 문안을 **비동기 테스트로** 고정한다.

### 엣지 케이스 (명세)

- `Free.dsl()`(어휘 0개) — **허용**. `api.interpreter({})` 는 순수 프로그램만 실행 가능한
  해석기가 된다. 테스트로 고정. [코덱스 Minor 7]
- 같은 프로그램을 `run` 여러 번 → 안전. / 핸들러 throw → reject. / thenable 거부 → reject. /
  `then` getter 가 던지는 객체 → reject. / 연속(fns) 적용 중 예외 → reject. 전부 완료조건에
  열거하고 테스트로 고정. [코덱스 Minor 9]
- `api.getUser` 구조분해 안전(this 비의존). 테스트로 고정.
- 다른 dsl 명령 섞기 → 막지 않되 run 의 가드 문안으로 reject(위 표). 문서에 명시.
- 노드 인자는 위치 배열(`args`) — 이름 붙은 payload 없음(빌더 제거의 대가, 명세).

## 타입 선언 (구현 전 확정 — 코덱스 Major 6 반영)

`types/data/Free.d.ts` 에:

```typescript
type DslApi<N extends string> = { [K in N]: (...args: unknown[]) => Free<unknown> } & {
    interpreter(handlers: { [K in N]: (...args: never[]) => unknown }): {
        run(program: Free<unknown>): Promise<unknown>;
    };
};
export declare function dsl<Names extends readonly string[]>(...names: Names): DslApi<Names[number]>;
```

- 명령 이름은 리터럴로 보존된다(`dsl('a','b')` → `'a'|'b'` 키) — 핸들러 누락·오타를 TS 가 잡는다.
- 인자·결과는 `unknown` 수준 — 이름 문자열만으로 인자 타입을 알 수 없다는 한계를 **주석으로
  정직하게** 적는다(더 좁히려면 스펙이 필요하고 그건 이 설계가 버린 payload 빌더다).
- `Free<unknown>` 표기는 기존 `Free.d.ts` 의 실제 타입 이름에 맞춘다(구현 시 파일 관례 확인).

## 구현

`index.js` Free 구역 끝(`Free.pipeK` 부근), 약 50줄. 내부 이름 `makeDslCommand`(함수 목록
연속)·`liftInterpreterResult`(Task 그대로 / thenable 은 `Promise.resolve` 동화 — null·undefined
가드 포함 / 값은 `Task.of`). ES2018: 스프레드·rest 만, `?.`/`??` 없음 — 게이트가 재검.

## 검증 (완료조건)

1. **함자 법칙** — `makeDslCommand` 항등·합성(fns 실행 결과 관측 대조) + **스택**: map 2만
   단계 후 실행이 옳은 값(RangeError 없음). `tests/free.test.js`. 레지스트리 밖 산물이라 법칙
   게이트 순회에 안 잡힘을 파일 머리에 명시. 뮤테이션: ① map 이 fns 에 안 더함 ② 연속을
   클로저 중첩으로 회귀(스택 검사가 잡음) → 잡힘.
2. **동작** — 어휘→프로그램→실전/mock 두 해석기 / **thenable 승격: Promise 의 resolved 값이
   후속 로직에 실제로 쓰이는 시나리오**(마지막 명령이 아니라 중간 명령이 Promise 반환 —
   코덱스 Major 4: 끝에서만 쓰면 승격 제거 뮤테이션이 안 잡힌다) / 재실행 / 구조분해 / 핸들러
   throw·thenable 거부·then getter 예외 → reject / 어휘 0개 / **교차 dsl → reject 문안**.
   뮤테이션: ③ run 의 own-property 가드 제거(교차 dsl 이 벌거벗은 TypeError 로 회귀 → 잡힘)
   ④ thenable 승격 제거(위 시나리오가 잡음) ⑤ interpreter 양방향 대조 각각 제거 ⑥ 상속
   핸들러 인정(hasOwnProperty 제거) ⑦ 예약 이름 검사 제거 → 전부 잡힘.
3. **검증 방식 구분** [코덱스 Minor 10] — dsl·interpreter 시점 6종은 `assertThrowsWith`(동기),
   run 시점 2종은 **reject 메시지 대조**(async, `testAsync`).
4. **기존 불변** — **전체 테스트 파일 + 타입체크 통과**(파일 수 표기 안 함 — 코덱스 Minor 13).
   `npm run baseline` (구현 직전 HEAD 기준): 차이 = 정적 표면 `Free.dsl` 추가 1건뿐.
5. **문서** — `docs/Free.md` 「Free.dsl — 3층의 1층」: 비디오 다운로더 축약판을 실행되는
   예제로. 기존 liftF·내부 심볼 예제는 Advanced 절로 옮기고 "dsl 이 이걸 대신 해 준다" 로
   잇는다. `docs/README.md` Free 행 한 줄. `prototype 이름 명령(toString 등) 동작` 도 예제로.
6. **dist 재빌드**. 커밋·푸시는 소유자 지시 시.

### 순서

① `index.js` → ② 테스트(법칙·스택·동작·뮤테이션 7종) → ③ 타입 → ④ 문서 → ⑤ 전체 게이트 +
baseline → ⑥ 보고 후 지시 대기.

## 범위 밖 (명시)

`Free.do`(기각 이력) · AST 노출 일급 문(보류 — 노드 name·args 준비됨) · 이전 에이전트 제안
`effects`/`interpret`/`interpretTask`/`all`(대체·폐기, `all` 은 필요 재증명 시 별도) · 문서
학습 순서 재구성(방향 작업).
