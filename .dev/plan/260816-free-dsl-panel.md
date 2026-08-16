# Free DSL 설계 패널 — 수렴안 (2026-08-16)

소유자 지시: "Free 모나드를 유저 사용성에 맞춰서 DSL 을 고민하라. Free 를 몰라도 쓸 수
있으면 된다. 여러 에이전트에 문의하고 수렴하는 방식도 가능." → 관점 다른 설계자 4 +
심사 2 워크플로(wf_c2cabe7d-1dd, 전원 실제 Free 위 스파이크 완료).

## 시안 4개 (전부 실측 스파이크 있음)

| 시안 | 관점 | 핵심 | 운명 |
| --- | --- | --- | --- |
| 1. `fp.plan` | 초보 JS | `steps('이름'…)` 선언 → `andThen` 단일 조합자 → `tree`/`dryRun`/`run` | **기본 골격 채택** |
| 2. Effects 유리상자 | 프로그램=데이터 | `{이름:['매개변수']}` 선언, 스파인 AST + `expands:'at-run'` 표식, `record`/`replay`, `all` 병렬 | **AST·record·all 접붙임** |
| 3. `fp.dsl`/`effects` | 안전성 | 클로저 브랜드(위조 불가), 핸들러 사전 대조 5겹, thenable 함정 검출 | **방어 장치 접붙임** |
| 4. 심볼릭 리파이 | 미니멀 | 심볼릭 토큰으로 의존 간선 전개 | **기각** — truthy 토큰이 분기에서 **거짓 트리**를 옳은 얼굴로 그림. 두 심사 모두 "검증 규율과 양립 불가" |

## 심사 둘의 수렴 (독립 채점인데 같은 곳에 도착)

- 사용성 심사: 기본 시안1 + 시안2 의 스파인 AST·record·all + 시안3 방어.
- 정합성 심사: 기본 시안2 + 시안1 의 andThen 은닉 + 시안3 방어. fromAST 는 뺌.
- **불일치가 남은 곳**: 선언형(이름만 vs 매개변수 이름), record/replay 범위, 모듈 이름.

## 수렴안 — 최종 사용자 코드 모양

```javascript
// 1. 선언 한 번 — 노드 생성 함수 묶음이 나온다 (클래스·심볼·functor·Free 전무)
const { getUser, sendEmail, log } = fp.plan.steps({
    getUser: ['id'], sendEmail: ['to', 'body'], log: ['message'],   // 매개변수 이름 → AST 인자에 이름 + 개수 검사
});

// 2. 프로그램 = 함수 호출 + andThen (map/chain 구분 소멸 — 자동 리프트)
const greet = getUser(42)
    .andThen(u => sendEmail(u.email, '환영, ' + u.name))
    .andThen(log('발송 완료'));

// 3. AST — 정적 간선은 데이터로, 의존 간선은 정직한 표식으로
greet.tree();
// { steps: [ {step:'getUser', args:{id:42}},
//            {andThen:'(익명)', expands:'at-run'},     ← 거짓말 안 함
//            {step:'log', args:{message:'발송 완료'}} ] }

// 4. 독립 효과는 all — 진짜 트리 가지 + 비동기에서 공짜 병렬(Task.all)
const load = u => fp.plan.all({ posts: getPosts(u.id), greeting: log('안녕') });

// 5. 실행 — 핸들러 집합을 실행 전에 대조(누락·오타 즉시, 이름 지목)
fp.plan.run(greet, { getUser: id => db[id], sendEmail: (to) => '보냄', log: m => m });
await fp.plan.runAsync(greet, { getUser: async id => db[id], ... });   // Promise, 내부 Task
greet.dryRun({ getUser: {…가짜}, ... });   // 가짜값 → 한 경로가 데이터로
fp.plan.record(handlers)(greet);           // 실행 한 경로를 {step,args,result} JSON 궤적으로
```

## 구현 전 의무 (정합성 심사가 못박음 — 어느 시안도 안 했던 것)

1. 내부 Command 함자의 **map 법칙 게이트 + 뮤테이션**(기존 Free 게이트는 이걸 안 봄 —
   "기존 게이트가 감당" 은 과대 주장으로 판정됨).
2. **스파인-Free 이중 표현 동기화 게이트** — spine 이 실행 순서와 어긋나는 뮤테이션을 잡아야
   `tree()` 가 조용히 거짓말하는 회귀를 막는다.
3. `andThen`(제3의 연산)의 결합성 검증. 게이트가 서기 전 "법칙 증명됨" 표기 금지.

## 소유자 결정 대기

① 모듈 이름: `fp.plan`(계획/단계/처리기 — 소유자의 "프로그램과 실행의 분리" 언어와 일치) vs
`fp.effects` vs 다른 이름 ② 선언형: 매개변수 이름 필수 vs 이름만도 허용(둘 다 가능) ③
`record` 포함 여부, `replay` 는 후속으로 미룰지 ④ 진행 승인.
