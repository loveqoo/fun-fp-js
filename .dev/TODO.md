# `.dev/TODO.md` — 지금 어디인가

이 폴더의 다른 파일은 **끝난 일의 기록**입니다. 이 파일만 **지금의 상태**입니다.
`INDEX.md` 처럼 계속 고칩니다.

## 왜 있나

작업이 목록이 아니라 **그래프**로 엮입니다. 리뷰 판정 하나를 고치다 새 판정이 나오고,
그것을 고치려면 앞의 결정을 다시 봐야 합니다. 그때 "여기가 어디고 무엇이 남았는지" 를
대화 안에만 두면 사람도 에이전트도 길을 잃습니다. 실제로 잃었습니다 — 에이전트가
리뷰어의 번호를 자기 번호로 다시 매겨 말하는 바람에 소유자가 어느 항목인지 못 찾았습니다.

## 규약

1. **번호는 출처의 번호를 그대로 쓴다.** 리뷰어가 7번이라 하면 끝까지 7번이다.
   에이전트가 다시 매기지 않는다.
2. **닫힌 노드는 지우지 말고 접는다.** 왜 그 길로 갔는지가 다음 회차의 입력이다.
3. **작업을 시작할 때 읽고, 상태가 바뀔 때마다 고친다.** 커밋 직전에 한꺼번에 쓰면
   이 파일은 일기가 되고, 일기는 아무도 안 본다.

### 항목 하나의 포맷 — 권장이지 강제는 아니다

한 줄로 충분한 것은 한 줄로 씁니다. 다만 **완료조건은 반드시**, 그리고 **닫을 때는 검증이
반드시** 있어야 합니다.

```markdown
### [출처-번호] 한 줄 제목

- **원인** — 왜 이렇게 됐나. 증상이 아니라 경위다. 이게 없으면 다음 사람이 같은 실수를 한다.
- **해결책** — 무엇을 하면 되나. 아직 모르면 "미정" 이라고 쓴다.
- **완료조건** — 무엇이 **참이어야** 닫히나. 검증 가능한 형태로.
- **검증** — 닫을 때 채운다. **돌린 명령과 그 출력.** 이것 없이는 ✅ 로 못 바꾼다.
- **참고** — 링크. 소스 위치·판정 기록·규칙 번호. 긴 내용은 여기로 빼고 본문은 짧게 둔다.
```

**「검증」이 이 파일의 핵심입니다.** 이유는 이렇습니다 — 2026-08-13 에 `1차-9` 를 두고
에이전트가 "게이트 둘을 신설해 상당 부분 해소됐다" 고 말했는데, 뒤늦게 뮤테이션을 심어보니
42/42 초록으로 그대로 통과했습니다. **「초록 테스트」는 영수증이 아닙니다** — 아무것도 안
보는 게이트도 초록이기 때문입니다. 게이트에 대한 주장의 영수증은 **그 게이트가 잡는 뮤테이션**
하나입니다.

영수증이 없으면 **「확인 안 함」이라고 쓰십시오.** 그것은 완결된 답이지 실패가 아닙니다.
문장을 낮추는 비용은 항상 나중에 철회하는 비용보다 쌉니다.

상태: `⬜` 안 함 · `🟡` 진행 중 · `✅` 닫힘 · `⏸` 소유자 결정 대기 · `🔒` 병합 전 필수

---

## ⬜ 열림 — provenance 발행 체계 (2026-08-28 등록)

- **원인** — 0.2.x 는 로컬에서 발행했다. npm 의 서명된 출처 증명(provenance)은 CI(OIDC)에서
  `npm publish --provenance` 로 발행해야 붙는다. Socket.dev 실측(0.2.1, 발행 7시간):
  Vulnerability·Quality·License **100**, Maintenance 86, **Supply Chain 78** — 감점 축은
  코드가 아니라 이력·증명. provenance 가 우리 손으로 당길 수 있는 유일한 항목.
- **해결책(안)** — GitHub Actions 워크플로: `v*` 태그 푸시 → 전체 테스트 → `npm publish
  --provenance`. npm 쪽은 Trusted Publisher(OIDC) 등록 또는 granular 토큰. 부수 실익:
  발행 때마다 브라우저 로그인 미로(패스키·사파리 문제, 0.2.0 때 실측)를 안 거친다.
- **완료조건** — 다음 발행 버전의 npm 페이지에 provenance 배지가 보이고, 태그 푸시만으로
  발행이 끝난다.
- **참고** — 로그인 험로 기록은 「0.2.0 첫 npm 발행」 닫힘 항목.

## ⏸ 소유자 결정 대기 — 런타임 점검 6차: 수정 권고 없음, index.js freeze 권고 (2026-08-30)

외부 점검이 **런타임 정확성만** 훑었다(Task 정착·예외 채널·thenable 동화·Free 러너·
취소 경계·트랜스포머·중첩 컨테이너 대수·Validation 모노이드 혼합·NEL 스택 안전·
optics/Forget 팩토리 경로). **재현 가능한 런타임 결함 0** — 수리 대상 없음.

- **권고안** — index.js 를 feature freeze 에 가깝게 두고, 수정 조건을 여섯으로 제한:
  ①반환값이 틀림 ②예외 유실/채널 오류 ③비동기 미정착 ④스택 안전 붕괴 ⑤명시된
  법칙의 런타임 위반 ⑥공개된 정상 사용법의 실행 실패. 이 밖의 정리·리팩터링·추상화
  개선은 보류. **채택 여부는 소유자 결정 대기** — 채택 시 CLAUDE.md 에 실을지도 함께.
- **덤(수리됨)** — 낡은 dimap 주석이 리뷰 지적 1곳이 아니라 **2곳**(swap 유도·Iso —
  grep 실측). 소유자 지시로 즉시 수정: 둘 다 promap 으로, diff 는 주석 2줄뿐(실측).
- **참고** — 이 「전수 감사에서 0건」은 CHANGELOG 「1.0.0 까지」 조건 2(마지막 파괴적
  변경 후 감사가 아무것도 못 찾음)의 부분 증거다. 다만 이번 감사는 런타임 한정이라
  조건 2 를 닫는 영수증으로는 부족하다(전수 아님).

## ⏸ 소유자 선언 — 타입스크립트 수리는 5차에서 멈춘다 (2026-08-30)

공식 지원은 자바스크립트뿐이고 TS 는 부가기능이다(TS 사용자에겐 더 좋은 라이브러리가
많다 — 소유자). 외부 리뷰 1~5차로 「선언의 거짓말」은 걷어냈으니 여기서 멈춘다. 이후
TS 리뷰 후보는 **기본 보류** — 착수는 소유자의 명시 지시가 있을 때만. 이 위치 설정은
README(한·영 「자바스크립트 우선」 절)에 공표했다.

## ✅ 닫힘 — 외부 재리뷰 5차: 5건 + 4차 오판 정정 (2026-08-29)

리뷰어 번호 그대로, 전건 실측 확정 후 소유자 승인 3건(재귀 키는 바깥층 정밀 + 안쪽
unknown / 팩토리 키는 넣되 전제 주석 / 범위 1~5 전부). 픽스처는 스크래치패드
`rev5/`(s1~s5). 전부 `types/` 선언, 런타임 무변경.

- **정정(중요)** — 4차 닫힘 기록의 「Forget 은 팩토리 전용, lookup 키 없음(실측)」은
  **팩토리 호출 전** 프로세스의 실측이었다. 호출 후에는 `forget(array)`·`writer(number)`
  lookup 이 동작하고 팩토리 반환과 동일 인스턴스(`===` 실측). d.ts 주석도 함께 정정.
- **1** — 중첩 합성 키(`maybe(array(number))`·`either(maybe(number),array(string))` 등)
  런타임 동작·TS 거부(s1) → 소유자 결정 「바깥층 정밀 + 안쪽 unknown」: 정밀 1단
  오버로드 뒤에 느슨한 꼬리 오버로드(문자열 전체를 받되 `Maybe<unknown>` 꼴로).
  Semigroup(maybe·either)·Monoid(maybe — 안쪽은 **Semigroup 키**: 'maybe(first)' 성립)·
  Ord(maybe) 합성 키도 신설.
- **2** — 팩토리 생성 키를 lookup 오버로드에 넣음(소유자 결정): writer(K) 는
  Functor·Apply·Applicative·Chain·Monad, forget(K) 는 Profunctor·Strong·Choice·Wander.
  「팩토리 호출 후에만 존재」 전제는 d.ts 주석이 짊어진다(타입은 시간 조건을 못 싣는다).
- **3** — `new Reader/State/Writer` 생성자 선언(Store 선례). 런타임 시그니처 실측:
  Reader(run)·State(run: s → [값, 다음상태])·Writer(value, output, monoid?=Array).
- **4** — 팩토리의 모노이드 캐리어 고정: `ConstApplicative<R>`·`ForgetWander<R>`·
  `WriterWithTypeLambda<W>`(Writer.d.ts 신설). `Const('number').wrap('oops')` 가 컴파일
  거부된다(런타임 실피해 실측: 뒤의 ap 가 Semigroup.concat 에서 던짐). `Writer('number')
  .of(1)` 이 `Writer<number, number>` 로 떨어진다(전에는 W 슬롯 미고정).
- **5** — `.types` 29곳 값 타입에 `| undefined`(부재 키의 런타임 실측값). 직전 회차
  과잉 선언의 보정.
- **검증** — 수리 전 빨강 s1~s5(TS2769·TS2345·TS2351·TS2578 계열) → 수리 후 전부 초록,
  게이트 claims 17줄 편입. 뮤테이션 5건(중첩 오버로드 삭제·writer(K) 삭제·Reader 생성자
  삭제·wrap 임의화·undefined 제거) 전부 빨강 확인 후 복원. 전체 56/56 + typecheck 초록.

## ✅ 닫힘 — 외부 재리뷰 4차: 5건 + README 수치 (2026-08-29)

리뷰어 번호 그대로, 전건 실측 확정 후 소유자 승인(범위 1~5 전부, `.types` 공개,
합성 키 실측 형태 전부). 재현 픽스처는 스크래치패드 `rev4/`(r1~r5).

- **1 (실질 결함 — 문서까지)** — Category 생성자의 `id` 는 항등 사상 자체(런타임이
  `() => id` 로 감싼다, FunctionCategory 도 `identity` 를 직접 전달). 그런데 d.ts 는
  썽크(`() => any`)를 선언해 **올바른 사용을 거부**했고(r1: TS2345), 문서 예제(한·영)는
  썽크를 가르치는데 그 줄의 `// 10` 실제값이 `NaN`/함수였다 — 맨 표현식이라 값 대조
  게이트 밖(「기대값 주석 없는 블록 134개」 문제의 실례). **수리**: 선언을 사상으로,
  예제를 사상 전달 + `console.log` 화(대조 974줄로 편입).
- **2** — 합성 키 5형태(setoid array/maybe/either·ord array·applicative const) 런타임
  동작·TS 거부(r2·r2b: TS2345) → 템플릿 리터럴 오버로드로 안쪽 키까지 정밀 타이핑.
  리뷰의 `forget(...)` lookup 추측은 반증 — 런타임도 거부, Forget 은 팩토리 전용(실측).
- **3** — `Applicative.Const` 반환에 wrap/unwrap 없음, `Wander.Forget` 선언 부재(r3:
  TS2339) → `ConstApplicative`·`Forget<R>`/`ForgetWander`(+ForgetTypeLambda) 신설.
  Forget 런타임 실측: 완전한 Wander 인스턴스 + wrap/unwrap, unwrap(p)=run.
- **4** — Setoid `default` 는 `===` 라 객체도 받는다(equals(obj,obj)=true 실측) — 직전
  회차의 원시값 제한은 과잉 축소(Ord 쪽 사실의 오적용). `unknown` 으로 수리.
- **5** — `.types` 는 공개(소유자 판정): 29개 정적 표면 전부에
  `readonly types: Record<string, X<any>>` 선언. Algebra 는 런타임에 .types 없음(실측)
  이라 제외.
- **README 수치** — 대조 968→974줄, 주석 없는 블록 136→134, 출력 없는 블록 408→406
  (게이트 출력 실측, 한·영).
- **검증** — 수리 전 빨강 6픽스처(r1~r5 + const/default) → 수리 후 전부 초록, 게이트
  claims 편입(Category 사상·합성 키 4·Const/Forget 3·default 객체·types 2). 뮤테이션
  5건(id 썽크 되돌림·maybe() 오버로드 삭제·wrap 개명·default 재축소·types 삭제) 전부
  빨강 확인 후 복원. docs 게이트 992예제·974줄 초록, 전체 56/56 + typecheck 초록.

## ✅ 닫힘 — optic 종류 구분(능력 집합 brand): 재리뷰 3차 5번 (2026-08-29)

- **원인** — Lens/Prism/Iso/Traversal 이 전부 같은 구조 타입(`Optic<S, A>`)이라
  `Optics.review(lens, 1)` 이 TS 를 통과하고 런타임이 던진다(c5 실측, 런타임 문안
  `review: argument must be a Prism (a Lens cannot be reviewed)`).
- **결정(소유자, 2026-08-29)** — 선택지 가(능력 집합)/나(종류 이름표+합성표) 중 **가**.
  종류란 「어느 P 메서드에 손을 대는가」이므로 `OpticCap = 'first'|'left'|'wander'` 를
  공변 팬텀으로 싣고, 합성은 `C1 | C2` 유니온 — 합성표 없이 종류가 자동 전파된다.
  `review` 만 `Optic<S, A, 'left'>` 로 조인다(런타임에서 능력 검사인 유일한 헬퍼).
- **사전 실측** — review: Iso·Prism ✓, Lens·Traversal 즉시 거부, `compose(iso,prism)` ✓
  / `compose(lens,prism)` ✗ (전파 확인). view 는 값 검사(맞은 Prism·원소 1개 Traversal
  통과) — 그래서 view 의 파라미터는 종류 불문으로 열어 두고 선언을 `Lens` 에서
  `Optic` 으로 넓혔다(기존 허용 표면 유지).
- **검증** — 소비자 게이트 claims 확장: 양성 3(review(prism)·review(iso)·
  review(iso∘prism)) + 음성 3(`@ts-expect-error` — lens·traversal·lens∘prism) + 값
  검사 헬퍼 종류 불문 1. 뮤테이션: dist 에서 review 파라미터를 무능력으로 되돌림 →
  TS2578 ×2 빨강, 복원 초록. 전체 56/56 + typecheck 초록(기존 내부 타입 테스트의
  optics 사용 전부 비파괴 — view(lens)·review(prism)·compose(lens,lens) 그대로).
- **참고** — types/Lens.d.ts, CHANGELOG 0.2.2 절 한·영.

## ✅ 닫힘 — 외부 재리뷰 3차: 1~4 + 경미 2 수리 (2026-08-28)

리뷰어 번호 그대로. **전건 실측 확정** — 재현 픽스처는 스크래치패드 `rev3/`(c1~c5).
전부 `types/` 선언 수리, 런타임 무변경. 소유자 승인: 범위 1~4+경미(5는 위로 분리),
생성자는 선언 추가, 게이트는 정방향만.

- **검증(닫으며 기록)** — 수리 전 빨강: 런타임 유효 lookup 6종 TS2345(c1),
  identity `.map` TS2339(c2), 틀린 에러 채널 대입이 통과(c3 — 런타임 값 `Left("boom")`
  대비 unsound), `new Semigroup/Monoid` TS2351(c4). 수리 후: 레지스트리 전수 픽스처
  29클래스·141키 + Kleisli 합성 + 유령 키 `@ts-expect-error` 컴파일 통과, c2·c4 초록,
  c3 는 게이트 형태(양성 + `@ts-expect-error`)로 초록. 게이트 뮤테이션 4건 — ①번들에서
  ChainInstances identity 삭제 → TS2345 빨강 ②IdentityTypeLambda 캐리어 되돌림 →
  TS2526 빨강 ③Monoid 생성자 삭제 → TS2351 빨강 ④raiseError 채널 연결 해제 → TS2578
  빨강 — 전부 잡힘. 전체 56/56 + typecheck 초록(내부 타입 테스트의 유령 키 사용 1곳을
  `predicate` 로 교정).
- **수리 내역** — 신규 등록 26키 + 키 교정 1(Contravariant function→predicate),
  새 람다 5(Object·Tuple·Tagged·Kleisli 3), IdentityTypeLambda → `Identity<Target>`
  (IdentityCarrier 제거 — ObjectTypeLambda 가 같은 TS2526 함정을 밟아 ObjectCarrier
  분리로 재학습), `raiseError<E>(e: E)` 채널 연결, 생성자 선언 8(Setoid·Semigroup·
  Monoid·Group·Semigroupoid·Category·Functor·Apply — 문서 26곳 근거), index.d.ts
  머리말 갱신(경미 A), docs 산문 dimap→promap 14곳(경미 B — 위임 문장은 사실대로
  재서술). CHANGELOG 한·영 0.2.2 절 반영.
- **남긴 것** — 역방향 유령 키 전수 대조(트랜스포머 키가 팩토리 실행 후에만 생기는
  문제)는 게이트 신설 시 설계안 보고 후 진행하기로 함. 키별 MonadError 완전 타이핑은
  기존 별건 후보 유지.

### (원 기록) 실측 판정 5 + 경미 2

- **1 (확정+확대) — 런타임 레지스트리 ↔ TS `*Instances` 불일치.** 전수 대조 실측:
  누락 = Functor·Apply·Applicative `function`(Functor 는 `store` 도), Chain·Monad
  `function`·`identity`, Extend·Comonad `identity`·`store`, Bifunctor `tuple`, Choice
  `tagged`, Filterable·Foldable `object`, Semigroupoid·Category `either`·`maybe`·`task`,
  Setoid·Ord `date`·`default`. **역방향 결함 1**: Contravariant 의 TS 키는 `function`
  인데 런타임 키는 `predicate` — TS 는 통과시키고 런타임이 `unsupported key` 로 던진다
  (c1 실측). 게이트 후보: 런타임 키 전수를 lookup 하는 픽스처 + keyof 상호 대입 대조
  (단, 트랜스포머 키는 팩토리 실행 후에만 런타임에 나타남 — 설계 필요).
- **2 (확정) — IdentityTypeLambda 가 캐리어 모양으로 축소.** `Applicative.lookup('identity')
  .of(1).map(...)` → TS2339 `map does not exist on IdentityCarrier<number>`(c2). 런타임은
  진짜 `Identity` 인스턴스(instanceof 확인, map 동작). 수리안: `type` 을
  `Identity<this["Target"]>` 로 — TS2526 회피는 이름 붙은 제네릭 참조라 유지된다(검증 필요).
- **3 (확정) — raiseError 의 e 와 에러 슬롯 미연결.** `const x: E<number, string> =
  raiseError('boom')` 이 TS 통과(c3), 런타임 값은 `Left("boom")` — 에러 채널이 string 인데
  타입은 number 라 unsound. 수리안: `raiseError<E, ...>(e: E): Kind<F, In, E, Out1, A>`
  (등록 인스턴스 either·task 둘 다 에러 채널이 Out2 슬롯).
- **4 (확정) — 타입 클래스 생성자가 TS 에서 막힘.** `new Semigroup(...)`/`new Monoid(...)`
  → TS2351(c4). 런타임은 동작하고 문서가 사용자 예제로 가르친다(ko·en 합계 26곳 실측).
  의도된 은닉인지 선언 누락인지 소유자 판정 필요 — 문서와 충돌하므로 생성자 선언 추가를
  권고.
- **5 (확정) — review 의 Lens 거부가 타입에서 안 걸림.** `Optics.review(lens, 1)` 이 TS
  통과(c5), 런타임은 `review: argument must be a Prism` 으로 던진다. 네 optic 이 같은
  구조 타입이라 구조적 타이핑이 구분 못 함. 수리안: phantom brand — 생성자·compose 반환
  타입까지 번지는 설계 작업이라 별도 회차 권고.
- **경미 A (확정)** — types/index.d.ts 머리말이 "pure ESM 에서는 named value import 가 안
  될 수 있다" 라고 아직 말함 — 0.2.2 에서 named export 공식 지원으로 낡음.
- **경미 B (기록됨)** — docs 산문의 dimap 오기(Optics.md 5·internals.md 3, 영어판 동수)
  는 직전 회차 덤 발견으로 이미 기록.
- **완료조건** — 승인된 항목별로: 수리 전 빨강 픽스처 → 수리 후 초록, 전체 테스트 +
  typecheck 초록, 게이트 신설 시 뮤테이션 확인.

## ✅ 닫힘 — 타입 선언 5건 수리 + 표면 전수 게이트 (2026-08-28)

외부 재리뷰(ChatGPT) 후보 5 + 경미 1 을 **전부 실측 확정**했다. 소유자 승인(우선순위 1→5),
컴팩션 후 착수. 전부 `types/` 선언 수리 — 런타임 무변경.

- **검증(2026-08-28, 닫으며 기록)** — 수리 전 빨강 영수증: 기본형 6건 TS2339/TS2551,
  named `fst`/`snd` TS2614 ×2 + `Strong`/`Choice`/`Wander` TS2693 ×3, traverse 3인자 호출
  TS2554(Expected 1, got 3), `handleError` 에 `Either<string, number>` 전달 TS2322(never),
  `raiseError` 무문맥 추론 `Either<never, never>`. 수리 후: 네 픽스처 전부 컴파일 통과,
  무문맥 추론은 `Either<unknown, unknown>`(반쪽 수리 목표). 게이트 뮤테이션 2건 —
  dist d.ts 에서 fst 선언 삭제 → 빨강(TS2614), left 방향 되돌리기 → 빨강(TS2322) — 둘 다
  잡힘, 복원 후 재빌드 diff 는 Built 타임스탬프뿐. 전체 56/56 + typecheck 초록.
- **부속 판정 2건(승인 범위 안 해석)** — ① Static 값 선언은 lookup 문이라 키가 필요:
  런타임 실측(`Strong/Choice/Wander.lookup('function')` 실존) 근거로 builtins.d.ts 에
  `function` 키 3건 등록. ② 전수 픽스처는 배열 리터럴 하나에 92개를 넣으면 TS2589
  (재귀 한도) — 이름별 `void` 사용으로 우회.
- **덤 발견(미수리, 소유자 판단 대기)** — `dimap` 오기가 docs 산문에도 있다:
  docs/Optics.md 5곳·internals.md 3곳(영어판 동수). 런타임 profunctor 메서드는 `promap`
  뿐(실측 grep — dimap 은 주석 1곳뿐). Lens.d.ts 만 승인 범위라 docs 는 손대지 않았다.

- **1 (확정+확대)** — default fp 타입에서 6개 누락: `Strong`·`Choice`·`Wander`·`Identity`·
  `fst`·`snd`. `fst`/`snd` 는 utilities.d.ts 에 선언 자체가 없고, Strong/Choice/Wander 는
  타입으로만 존재(값 선언 없음). 소비자 재현: `import { fst }` → TS2614, `Strong` 값 사용 →
  TS2693. **수리**: fst/snd 선언 신설(`<A, B>(pair: readonly [A, B]) => A` 꼴), 셋의 Static
  값 선언(다른 클래스 패턴), index.d.ts default 타입에 6개 추가.
- **2 (확정)** — TypeClasses.d.ts 의 `Traversable.traverse` 가 커링 `(A)(f, fa)`, 런타임은
  3인자(실측: 커링 호출은 TypeError). **수리**: 3인자 언커리드로.
- **3 (확정)** — Lens.d.ts `Profunctor2` 가 `dimap` 요구, 런타임 optics 는 `promap` 호출.
  **수리**: dimap → promap(주석 산문도 정합하게).
- **4 (확정)** — 런타임 `Choice.left` 는 Left 쪽 변환(실측 `Left(3)→Left(6)`), 선언은
  left·right 동일 시그니처(둘 다 Right 방향) — left 복붙 오류. **수리**: left 를
  `Either<In1, C> → Either<T1, C>` 로.
- **5 (확정, 반쪽 수리 승인)** — `MonadError.raiseError('boom')` 추론이 `Either<never, never>`
  (실측). 클래스 수준 제네릭은 인스턴스별 에러 채널 슬롯을 모름 — **never 오염만 제거**
  (`never` → 슬롯 제네릭/unknown)하고 한계를 d.ts 주석 + internals 에 기록. 키별 완전
  타이핑은 별건 후보로 남김.
- **경미 (확정)** — README 상태표 「Test files 55」 → 실제 56(consumer 테스트 추가분).
  한·영 갱신.
- **게이트 신설** — consumer.test.js 확장: 테스트가 `Object.keys(fp)` 전원(92개)을 **값으로
  import 하는 픽스처를 생성**해 nodenext 컴파일 — 런타임↔선언 표면 전수 대조. 1번 계열의
  재발 방지. 뮤테이션(선언 하나 지우면 빨강)으로 게이트 확인.
- **완료조건** — 소비자 픽스처(named 92 + traverse 3인자 + left 방향 + raiseError 비-never)
  컴파일 통과, 전체 테스트 + typecheck 초록, 수리 전에는 각 픽스처가 빨강이었음을 확인.
- **참고** — 재현 픽스처는 스크래치패드 `rev/`(t1: 표면, t5b: never 추론). 0.2.2 발행은
  이 수리까지 실어서 하기로 함(아직 미발행).

## ✅ 닫힘 — Free.api 이름 공간 분리 (2026-08-28)

README 새 맛보기의 Free 예제를 보던 소유자 문답에서 나온 설계 판정. `api.interpreter` 가
맞는 문인지 → 맞음(소스·문서·게이트 확인). 그럼 `Free.api('interpreter')` 는? → 예약어로
거부됨(실측). **소유자: "우회다. 사용자 어휘와 중복될 수 있으니 설계 문제다."** — 동의.
예약어는 증상 봉합이고, 원인은 사용자 어휘와 라이브러리 문이 한 객체를 나눠 쓰는 것.

- **결정** — 선택지 셋(문 이동/어휘 안쪽으로/현상 유지) 중 「가」: `Free.interpreter(api,
  handlers)` 로 문을 밖으로. api 는 순수 어휘만(예약어 0), `Free.interpreters` 와 나란한
  자리. 소유자 판정 "파괴적 아님"(외부 사용자 0) — 별칭 없이 옛 문 제거, 0.2.2 에 실림.
- **구현** — index.js: apiVocabulary WeakMap(api↔어휘), 예약어 검사 삭제, 문 이동(가짜
  api 는 `first argument must be an api from Free.api(...)` 로 거부). 치환 71곳(테스트
  47·문서 24), d.ts(FreeApi 에서 interpreter 제거 + Free.interpreter 정적), CHANGELOG.
- **검증** — `Free.api('interpreter', 'run')` 이 명령으로 동작(예약어 테스트를 반전한 새
  게이트: api 객체는 어휘만 싣는다), 실행 실측 `ok KIM`. 56/56 + typecheck + 소비자
  컴파일(nodenext) 초록.

## ✅ 닫힘 — 영어 문서 전면 윤문 + 소비자 표면 수리, 0.2.2 준비 (2026-08-28)

**윤문(소유자 지시: humanizer 스킬 + 병렬 서브에이전트)** — 영어 문서 48개를 7개 Sonnet
에이전트가 humanizer 스킬(위키백과 「Signs of AI writing」 기반)로 처리. 35개 수정, 13개는
이미 깨끗. 지배적 티는 대시(—) 남용 약 300곳(internals 190). 덤: Lens.md 중복 문장 조각
수리. 에이전트 자기 보고를 믿지 않고 전역 재검증 — 35개 파일의 코드 블록·제목·링크가
HEAD 와 바이트 동일(위반 0), 잔여 대시 전수 조사(정당한 예외 4 + 누락 2 는 직접 수리).

**소비자 표면 수리(ChatGPT 외부 리뷰 → 전건 실측 검증 후 소유자 승인)** —
- 지적 1 확인: `import { Maybe }` 가 TS 통과·런타임 SyntaxError(설치본 재현). **덤 발견**:
  번들 d.ts 가 nodenext 소비자 설정에서 TS2395 ×138 + 3계열 잠복 오류 — 근원은 우리
  tsconfig 의 skipLibCheck(d.ts 자체를 검사한 적 없음) + 번들 컴파일 게이트 부재.
- 수리: ① index.js 에 default 와 같은 명단의 named export(92개, default 유지) + build.js
  가 UMD 경로에서 그 문을 걷어냄 ② build-types 가 declare module 을 풀 때 최상위 선언에
  export 접두(TS2395 소멸) ③ types 소스의 잠복 셋 — 인터페이스 닫는 `};` 4곳,
  객체 리터럴 타입 안의 this(IdentityCarrier 로 분리), 중복 재수출 제거.
- **게이트 신설 `tests/consumer.test.js`**: named/default 명단·동일 몸 대조, named import
  실행, 번들 d.ts 의 nodenext(strict, skipLibCheck 없음) 컴파일. 뮤테이션 둘 다 빨강
  (named 제거 / export 접두 제거). es-ceiling 이 이 테스트의 동적 import() 를 잡아
  자식 프로세스 방식으로 교정(게이트가 게이트를 지킴).
- 지적 2(ArrayComonad)는 기존 결정·문서화 확인(internals#array-comonad, NEL 이 그 보완)
  으로 보류. 지적 3(README lawful)은 한·영 첫 문단을 「캐리어가 허용하는 범위」로 좁힘.

**0.2.2 준비 완료** — 버전·CHANGELOG·재빌드(헤더 0.2.2), 56/56 + typecheck. 발행 대기.

## ✅ 닫힘 — 0.2.1 발행 (2026-08-28)

0.2.0 꾸러미의 README 가 "아직 npm 에 발행하지 않았습니다"라고 말하던 자기모순의 수리.
소유자 결정 「나 — 발행을 미루고 지금 버전을 완벽하게」로 범위가 커졌다: README 전문 통독
갱신 + 표현 수정 + CHANGELOG 재작성(250→157줄) + 코덱스 문서 리뷰 7건 반영 + 커버리지
보완(페이지 셋·조합자 명부·docs-coverage 게이트). 검증: `npm view` 0.2.1, 설치본 README 에
정식 설치 안내 1회·낡은 문구 0회 확인. 태그 v0.2.1.

## ✅ 닫힘 — 0.2.0 첫 npm 발행 (2026-08-28)

- **준비 완료** — `private` 제거 · 0.2.0 · 설명 실측화(min+gzip 26KB) · `engines >=14`
  (소유자 결정 — dist 가 ES2018 인데 >=20 은 취지와 어긋남; 개발은 20 필요) ·
  `files` 에 README.en.md · `prepublishOnly: 테스트` 가드 · CHANGELOG 0.2.0 절 전환 ·
  dist 재빌드(헤더 Version 0.2.0). `npm pack --dry-run`: 8파일 146KB, 이름 npm 에서 비어
  있음(E404 확인).
- **발행 (소유자 직접, 2026-08-28)** — 로그인이 험로였다: 패스키 QR 이 폰에서 실패(등록된
  패스키 없음) → legacy 로그인 시도 → **패스키가 크롬에 있었음을 발견** → npm login 이
  사파리를 강제로 열어 실패 → **터미널의 인증 URL 을 크롬에 수동으로 붙여넣어 해결.**
  다음 발행 때 기억할 것: 패스키는 크롬에 있고, 브라우저가 어긋나면 URL 수동 이동이 확실.
- **완료조건 충족** — `npm view fun-fp-js version` → **0.2.0** (17:25 UTC). 소비자 설치
  검증: 빈 프로젝트에 `npm install fun-fp-js` → chain/Store 동작, dist 헤더 0.2.0.
- **코덱스 문서 리뷰 (`task-mtbt11hj`, 2026-08-28)** — 문서 전체 첫 적대 리뷰. 치명 0,
  중요 6, 경미 1 — 수치는 전부 정확 판정, 걸린 것은 산문. 소유자 승인으로 전부 반영:
  ① README 하단·본문 링크를 GitHub 절대 URL 로(npm 설치물에서 docs/·CHANGELOG 부재 확정
  — 상대 링크 게이트 밖으로 나가는 대가는 문서에 명시) ② Comonad.md 둘→넷 ③ 가이드
  26→29종·identity 일곱→아홉+트랜스포머 역할 ④ 영어 가이드 Store 두 곳 보충 ⑤ Applicative/
  Monad 시그니처의 lookup 오설명 수정 ⑥ "빌드가 멈춘다"→"테스트와 npm 발행이 멈춘다"
  ⑦ "404 없음"에 범위(저장소 안 상대 링크) 명시. 같은 회차에 소유자 지적으로 CHANGELOG
  전면 재작성(250→157줄 — AI 문체·내부 서사 제거, 사실 보존)과 README 제목
  「문서가 낡지 않습니다」→「문서도 테스트가 검증합니다」.
- **커버리지 보완 (2026-08-28, 소유자 「나 — 지금 버전을 완벽하게」)** — 공개 92개 이름을
  문서와 전수 대조하니 24개가 언급 0회(pipeFrom·setStrictMode 포함), 전용 페이지 없는 것
  셋(Apply·Chain·Identity). 처리: 페이지 셋 신설(한·영, 예제 전부 실행·대조), 가이드에
  조합자 명부(전 이름 + 실측 예제 — rangeBy 는 (start, end) 둘뿐임을 실측으로 확인),
  색인 연결. **게이트 신설 `tests/docs-coverage.test.js`**: 공개 이름 전부가 한·영 문서에
  언급 + 한국어 문서마다 영어 짝 존재. 뮤테이션(명부에서 이름 제거) 빨강 확인.
  수치 재측정 반영: 예제 990(대조 964줄)·링크 592·테스트 55파일.

## ✅ 닫힘 — chain 콜백 반환 검사 (2026-08-28)

코덱스 7차가 identity 승격을 보다가 찾은 **라이브러리 전체의 기존 구멍** — strict 래퍼가
인자만 검사하고 반환은 안 봐서, `map` 쓸 자리에 `chain` 을 쓰면 ① 에러가 다음 걸음의 옳은
코드를 탓하고 ② 파이프라인 끝에서는 맨 값이 조용히 샜다(전 타입 실측: maybe·either·reader·
identity 전부 누출). 소유자 제안 「공통 함수 하나로 검사」 → 실측(오탐 0, 비용 측정 한계
아래) 후 승인.

- **해결책** — 공용 `checkReturn`(index.js, 문지기 도우미들 옆) + Chain strict 래퍼에서
  반환 검사. Monad 는 chain 을 물려받아 자동 적용. 느슨한 모드/게으른 타입은 경계
  (모드는 생성 시점에 박힘 — 기존 의미론).
- **검증 (2026-08-28)** — 범인 자리 메시지 `callback must return Maybe, got number` 고정
  (strictmode.test 3건 신설), 검사 제거 뮤테이션 ❌2→복구 0. 전체 게이트 오탐 0
  (52/53+typecheck, 남은 빨강 dist 뿐). 성능: chain 100만 10.3↔10.2ms, chainRec 5만
  1.7↔1.7ms(오차 안). internals #chain-return 한·영 + CHANGELOG.
- **경계(문서화)** — 게으른 타입(Task·Reader·State·Free)의 콜백은 chain 시점에 안 불려
  검사 대상이 없다. 잡는 것은 즉시 계산 타입의 콜백 실수 — 배우는 사람의 자리.
- **코덱스 8차 리뷰 (`task-mtbphdef`): PASS** — 7차 반례 전부 범인 자리 차단 확인, 오탐 0,
  'any'·strict/loose·트랜스포머·d.ts 전부 OK. 부속 지적 둘을 소유자 승인으로 처리:
  ① 성능 영수증에서 chainRec 언급 제거(그 경로는 검사를 안 지나 증거가 아님 — 한·영)
  ③ 트랜스포머 × 실제 identity 회귀 게이트 신설(identity.test.js — RT/ST/ET 실행값 고정,
  기존 트랜스포머 테스트 4종은 파일 내부 가짜 Identity 를 쓰므로 이 통합은 여기서만 지킨다).
- **✅ ChainRec 이중 검사 → 전수 수리로 확장 (2026-08-28 닫힘)** — 재 보니 같은 병이
  **일곱 자리**였다: ChainRec.chain ×2, ChainRec.ap ×3, Chain.ap ×2, Comonad.map ×3,
  Comonad.extend ×2, Extend.map ×2, Traversable.map ×2. 원인은 하나 — 부모의 이미 포장된
  메서드를 생성자가 재포장. 해독제 `unwrapIfSameType` 은 집에 있었고(Apply·Applicative·
  Monad 는 사용 중) 다섯 생성자(Chain·ChainRec·Extend·Comonad·Traversable)만 빠져 있었다.
  소유자 확인("검사 종류는 안 없어지고 횟수만 준다") 후 다섯 곳에 한 줄씩. **검증**: 재측정
  전 경로 2(1회), `tests/wrap-count.test.js` 신설(16경로 고정 — unwrap 제거 뮤테이션 3종
  전부 빨강), 전체 53/54+typecheck(남은 빨강 dist 뿐), baseline 차이 0행.

## ✅ 닫힘 — identity 를 Chain·Monad 로 올린다 (2026-08-28)

Store 회차의 곁가지("ReaderT('identity') 가 막힌다, 결함인지 의도인지 확인 안 함")를 판단.
**발견 → 선택지 셋 → 소유자 「가」(온전히 올림).**

- **원인** — Identity 는 일곱 인스턴스(Applicative 까지 + Extend/Comonad/Foldable/Reducible)
  인데 Chain·Monad 만 없었다. 안 올린 이유 기록 0건 — internals 의 정체성("traverse 에
  넘기는 Applicative")에 Monad 가 필요 없어 안 올라간 것으로 판정. 선례 만장일치
  (Haskell·cats·fp-ts 모두 Identity 는 Monad; cats 는 그 위에 Reader 를 정의).
- **해결책** — `IdentityChain`((f,m) => f(m.value))·`IdentityMonad` + 클래스 `chain` 위임
  메서드. 트랜스포머의 안쪽 모나드 자리가 열린다.
- **검증 (2026-08-28)** — `ReaderT('identity')` 가 맨 Reader 와 같은 값(Identity 한 겹),
  `StateT('identity')` → `[10,11]`, 메서드 chain → 21. 잠금 155→**157**, 107→**109**,
  identity.test 「일곱」→「아홉」+ 두 줄. 뮤테이션 둘 다 잡힘(① f 무시 → Monad 좌항등,
  ② 이중 감쌈 → 법칙+identity.test). baseline 원소 대조 **추가 8, 사라짐 0**.
  52/53 + typecheck(남은 빨강은 dist 동기 — 빌드 대기). internals 한·영 절 보완, CHANGELOG.
- **참고** — [`plan/260827-store-comonad.md`](./plan/260827-store-comonad.md) 곁가지 절 ·
  [`docs/internals.md#identity-const`](./../docs/internals.md#identity-const)

## ✅ 닫힘 — 중복 구현 점검과 공통화 ①③ (2026-08-27)

소유자 요청 「이미 구현된 것을 다시 구현한 부분이 있는지 점검」. 26-08-15 합성 감사 이후
들어온 코드가 대상. **발견 셋, 기각 셋, 공통화 둘 완료. ②는 논의 대기.**

- **발견 ① (완료)** — `isX` 서술어 열 곳(Identity·Maybe·Either·Task·Validation·NEL·Reader·
  Writer·State·Store)이 글자까지 같은 몸. → `hasSymbol`(index.js:104) 하나로 통일,
  `X.isX = hasSymbol(Symbols.X)`. `Free.isFree` 는 다른 몸(Pure/Impure 합성 판별)이라 정당한
  예외로 남김.
- **발견 ③ (완료)** — 트랜스포머 넷의 `lift` 가 클래스명만 다르고 동일. → `liftInto`
  (index.js:3316) 하나로 통일, `XT.lift = liftInto(XT)`.
- **발견 ② (완료, 2026-08-27)** — `Store.extract` 를 Identity 꼴 위임으로 복귀
  (`Comonad.lookup('store').extract(this)`). **실측 후 소유자 「가」 결정**: 맨 호출 1천만 번
  3.8ms → 49ms(약 13배, 호출당 ~5ns)이지만 라이프 게임 20×20 10세대는 4.4 → 4.6ms(**약 5%**)
  — 규칙의 일이 지배해 실사용에선 묻힌다. 얻는 것: 논리 한 몸 + 뮤테이션 감시 강화
  (인스턴스 몸을 망가뜨리면 이제 메서드 경로 테스트까지 빨강 — 실측 ❌ 5, 전에는 반쪽).
  `npm run baseline` 차이 0행. 53/53 + typecheck.
- **코덱스 5차 리뷰 (`task-mtbmop73`): 조건부 → 충족 후 push** — 재귀 없음·정상 경로 동일·
  dist 일치 확인. 지적 하나는 **의도된 강화로 수용**: 위임을 거치며 strict 타입 검사가 붙어,
  위조 입력(빌린 객체·_typeName 변조)이 전에는 값을 받았는데 이제 TypeError 로 거부된다 —
  map·extend 는 이미 그랬으므로 세 메서드의 예외 동작이 이제야 일치한다.
- **소유자 판정 (2026-08-27)** — 위 「수용」은 에이전트가 동의 없이 내린 판단이었다.
  소유자: "이번엔 그냥 넘어갑니다" — **유지 확정, 단 절차 위반은 위반.** 이후 규칙:
  저장소 코드 전부 동의 후에만, 미답변 질문은 동의가 아님, 리뷰가 동작 차이를 찾으면
  (강화라고 판단되더라도) 수용 전에 보고하고 묻는다.
- **기각 셋** — Task 두 람다(앞머리만 같음) · `into` 두 누적자(해체까지만 같음) ·
  `composeK` vs Kleisli Semigroupoid(능력이 다름 — 가변·임의 모나드 vs 등록 셋의 이항).
- **검증 (2026-08-27)** — `node tests/run.js` 51 passed/1 failed(dist 동기뿐)+typecheck.
  뮤테이션 둘 다 잡힘: ① `hasSymbol` 이 심볼 안 봄 → **failed 1→16**, ③ `liftInto` 가 명령
  대신 맨값 → **트랜스포머 4종 테스트 ❌ 0→21**. `npm run baseline` 격자 ≠행이 Store 회차
  저장본과 **완전 일치** — 공통화의 관측 차이 0.
- **경위 메모** — ③ 뮤테이션 검증 중 2분 시간 초과가 뮤테이션 상태를 남겼고, 병렬로 띄운
  기준선 측정과 겹쳐 첫 수치가 엉켰다. 깨끗한 상태를 확정하고 순차 재측정으로 결론.
  뮤테이션 심기와 다른 측정을 한 메시지에 병렬로 띄우지 말 것.
- **코덱스 4차 리뷰 (2026-08-27, `task-mtbm1dju`)** — 두 공통화 **승인**. HEAD 아홉 구현과
  문자 단위 동일 + 열 타입 경계 입력 일치 + 네 lift 의 값·내부 구조 일치를 코덱스가 독립
  확인. `Free.isFree` 예외도 반례(Free 심볼만 단 가짜)로 옳다고 판정. 잔여 지적 하나 —
  「열 서술어의 공통 경계를 고정한 표 테스트가 없다」.
- **표 테스트 (2026-08-27, 소유자 승인)** — `tests/is-predicates.test.js` 신설: 열 타입 ×
  경계 9종(진짜/null/undefined/원시/문자열 위조/심볼값 1/심볼값 false/상속 심볼/외부 객체)
  + 교차 판정 10×9 + Free 예외 고정. 뮤테이션 3계열 전부 잡힘(실측): 심볼값 1 통과 ❌10 ·
  own 만 봄 ❌10 · 심볼 안 봄 ❌11. 코덱스가 손으로 잰 경계가 게이트로 옮겨졌다.
- **코덱스 6차 리뷰 (`task-mtbn87f7`): 마감 재검토** — 1~5차 지적 전건 RESOLVED 를 항목별
  확인, 수리 간 2차 결함 없음, dist 일치. 5차 STILL OPEN(예외 경로)은 소유자가 이미 유지
  확정한 건. **새 결함 1**: 위 표의 머리말이 「던지는 getter 까지 잠근다」고 주장하나 그
  입력이 표에 없었다 — 코덱스가 예외 삼키는 hasSymbol 변이로 표 전체 초록을 실증. 영수증
  없는 보증이 테스트 주석에 있었던 것. → **소유자 「가」 (2026-08-28)**: 표에 던지는 getter
  행 추가(예외가 그대로 전파됨을 고정). 코덱스의 그 변이를 다시 심어 **❌ 10** 확인, 복구 0.
  53/53 + typecheck.

## ✅ 닫힘 — Store 코모나드 (2026-08-27)

계획서: [`plan/260827-store-comonad.md`](./plan/260827-store-comonad.md). 소유자 플랜 승인 후 구현.
**dist 재빌드·커밋·푸시는 안 했다 — 소유자 요청 대기.**

- **원인** — 소유자 관찰(2026-08-25) 「Store가 없더라?」. 모나드 셋(Reader·Writer·State)의
  쌍대 코모나드가 전무했다. 글라이더 실험으로 실물을 확인한 뒤 소유자가 결정.
- **해결책** — 캐리어 `Store(lookup, index)` + 문 여섯(extract/peek/seek/experiment/map/extend)
  + 옵트인 `Store.memo` + 인스턴스 셋(`store` 키). 범위는 Store 하나 — Env·Traced 제외.
- **완료조건** — ① `npm test` 전량(잠금 155/14/107) ② 뮤테이션 넷 전부 잡힘 ③ baseline
  원소 대조 추가만 ④ docs 한·영 짝 + internals 성능 절.
- **검증 (2026-08-27)** — `node tests/run.js` → **51 passed, 1 failed** (실패는 dist 동기뿐,
  빌드 대기라 의도된 상태. store.test.js 포함 52파일). typecheck 통과.
  뮤테이션 4종 전부 잡힘: ① extend 초점 고정 → **좌항등** (결합법칙은 초록 — 원리상 못
  잡음을 실측, 함수 모나드 chain 때와 동형) ② extract 위치 0 고정 → **좌항등** ③ map 조회
  위치 고정 → **Functor 항등** ④ memo 가 값 바꿈 → **store.test.js 3건**.
  `npm run baseline` 원소 대조: **추가 15개(인스턴스 셋·키·최상위 이름), 사라진 것 0.**
  문서 예제 950 → **966개**(Store 한·영 + internals 성능 절 한·영), 대조 줄 868 → **902줄**.
- **계획에 없던 걸림 둘(다음 데이터 타입 추가 시 명단)** — `tests/algebra-type.test.js` 의
  `BY_PREFIX`/`SAMPLE` 표, `build-types.js` 의 d.ts 명단. 함수 모나드 때는 새 최상위 이름이
  없어 안 걸렸던 게이트다.
- **코덱스 적대 리뷰 후속 (2026-08-27)** — 리뷰가 결함 1건을 실측: `Store.memo` 기본 키
  `JSON.stringify` 가 `NaN`/`null` 을 `"null"` 하나로 합쳐 **조회 순서에 따라 값이 달라졌고**,
  순환 객체는 던졌다. 게이트는 숫자 위치만 봐서 블라인드였다. 소유자 결정: **기본값 제거,
  `keyOf` 필수**(위임) — 항등 기본은 원시값에선 옳지만 객체 위치에서 캐시를 조용히 무력화
  (memo 의 대표 사례가 그 경우)하므로 옳은 기본이 없다. 수리 검증: `keyOf` 누락 거부 +
  항등 keyOf 의 NaN/null 구분(코덱스 반례 재현) 테스트 신설, **옛 기본값을 도로 심으면
  거부 테스트가 빨강**(실측), 뮤테이션 ④ 재확인 4건 빨강. 문서 한·영("관측은 그대로" 보증을
  "키가 위치를 가르는 한"으로 강등 + 키 충돌 책임 명시)·d.ts(`keyOf` 필수)·CHANGELOG 갱신.
  `node tests/run.js` → 51 passed / 1 failed(dist 동기뿐), typecheck 통과. store.test.js 15건.
- **코덱스 재리뷰 2·3차 (2026-08-27)** — 2차(`task-mtb11mfe`): PARTIALLY RESOLVED — 잔여
  지적 「항등 키도 +0/-0 을 합친다(Map SameValueZero), 문서가 '숫자는 항등이면 충분' 과장」.
  → 문서 4곳에 경계 명시 + `+0/-0` 표본 테스트(합쳐짐/가름 양쪽 고정, store.test.js 16건).
  3차(`task-mtbdje24`): 코드 무혐의 + +0/-0 해소 판정, **새 지적 셋 전부 문장 과장** —
  ① 「memo 는 관측 불변」에 조회 안정 조건 누락(반례 `() => ++n`: 원본 1 2, memo 1 1)
  ② 「반복 extend 는 지수」에 다중 위치 조회 조건 누락(단일 조회 규칙은 선형 — 20회에 21조회)
  ③ d.ts 주석이 둘을 반복. → 문서 6곳(한·영)과 d.ts 주석에 성립 조건을 넣어 강등.
  세 회차의 공통 교훈: **보증은 성립 조건(위임 경계·조회 안정·조회 분기)까지 함께 적는다.**
- **참고** — Haskell `Control.Comonad.Store` · cats `RepresentableStore` · fp-ts `Store.ts` ·
  [`docs/Store.md`](./../docs/Store.md) · [`docs/internals.md#store-perf`](./../docs/internals.md#store-perf)

## ✅ 닫힘 — 함수 타입에 Apply·Applicative·Chain·Monad 등록 (2026-08-23)

계획서: [`plan/260823-function-monad.md`](./plan/260823-function-monad.md). 소유자 「좋습니다」 승인 후 구현.
**dist 재빌드·커밋·푸시는 안 했다 — 소유자 요청 대기.**

- **원인** — fun-fp-book 세션이 「함수에 `chain` 을 달았으면 그게 Reader 였을 텐데 왜 별도
  타입인가」를 물었고, 저장소 전체(`.dev`·`docs`·`CLAUDE.md`·`CHANGELOG.md`·커밋 309개)에
  **결정 기록이 0건**이었다. 연대기상 갈림길이었던 적도 없다 — `Reader` 2026-01-25,
  `FunctionFunctor` 는 7개월 뒤 명세 게이트 ③의 짝으로 사후 생성.
- **해결책** — `Reader` 는 그대로 두고 `'function'` 키에 네 인스턴스를 더한다(Haskell 방향).
  cats 식 Kleisli 통합은 권하지 않는다 — `Id[A]=A` 는 고차 타입이 있어야 성립한다.
- **완료조건** — 계획서 7절. 요지는 셋: `npm test` 전량 통과(`algebra-type` 148→152,
  `staticland-laws` `checked` 101→105) · **뮤테이션 넷을 전부 잡는다** ·
  `docs/internals.md#function-monad` 와 영어판 짝.
- **⚠️ 선행 발견** — `Chain` 법칙이 함수 타입에서 **눈멀어 있다.** 스크래치패드 복사본 실측:
  환경 뒤바꾸기 뮤테이션(`f(g(x))(x)` → `f(g(x))(g(x))`)이 **안 잡혔다.** 원인은
  `staticland-laws.test.js:662` 의 Kleisli 화살표가 `of` 로 만들어져 전부 환경을 무시하는
  상수 함수라는 것. 등록만 하면 초록이 나지만 **그 초록은 아무것도 안 본다.**
  게이트 보수를 같은 회차에 하기를 권한다.
- **곁가지(별건)** — `ReaderT('identity')` 가 `Monad.lookup: unsupported key identity` 로 막힌다.
  Monad 등록은 아홉이고 `Identity` 는 `Applicative` 까지만 있다. **결함인지 의도인지 확인 안 함.**
- **검증 (2026-08-23)** — `index.js` 에 네 클래스(`FunctionApply`/`FunctionApplicative`/
  `FunctionChain`/`FunctionMonad`), `Monad.lookup('function')` 이 `chain: a:1`, `of: 7`,
  `ap: 8090`, `map: 16160` 을 낸다. `node tests/run.js` → **50 passed, 1 failed** —
  실패 하나는 dist 동기 검사뿐이고 빌드는 승인 대기라 그대로 둔다. typecheck 통과.
  잠금 갱신: `algebra-type` 148 → **152**, `staticland-laws` `checked` 101 → **105**.
  `npm run baseline` 원소 단위 대조: **추가 16개(넷과 그 별칭·역인덱스), 사라진 것 0개.**
  문서 예제 936 → **944개**, 대조 줄 842 → **849줄**.
- **뮤테이션 (2026-08-23)** — 넷을 심어 넷 다 잡혔다(기준선 `staticland-laws` ❌ 0개).
  ① `f(g(x))(x)` → `f(g(x))(g(x))` **좌항등 깨짐** ② `ap` 가 둘째 인자 무시 **합성·준동형 깨짐**
  ③ `of` 가 `constant` → `identity` **잡힘** ④ `chain` 이 둘째 적용 누락 **좌항등 깨짐**.
- **게이트 보수 — ①이 처음엔 안 잡혔다.** 계획서 5절의 초안(`Chain` 법칙만 고치기)으로는
  **부족했다**: `Chain` 결합법칙은 원리상 못 잡는다(뒤바뀐 것도 결합적이다). `Monad` 좌항등이
  잡아야 하는데 그 화살표도 `of` 로 만든 상수였다. **두 법칙 다** 환경을 보는 화살표를 쓰게
  고쳤다 — `staticland-laws.test.js` 의 `KLEISLI_FNS` 표.
- **참고** — Static Land 「Difference from Fantasy Land」 · cats `catsStdMonadForFunction1` ·
  cats `type Reader[A, B] = Kleisli[Id, A, B]` ·
  [`docs/internals.md#function-monad`](./../docs/internals.md#function-monad)

## ✅ 닫힘 — index.js 주석 B안: 앵커 없는 다줄 블록 (2026-08-19)

- **경위** — 소유자가 다음 회차 순서를 정했다(2026-08-19): **B안 → Reducible 문서 →
  코덱스 6차 전면 감사**. B안은 8/18 A안 회차가 남긴 것이다.
- **실측(2026-08-19)** — `//` 블록 141개 중 다줄 **39개**(95줄), 그중 docs 앵커 보유 3개,
  **앵커 없는 것 36개(89줄)**. 8/18 기록의 "~38개" 는 어림이었고 실수는 36이다.
- **핵심 발견** — 36개의 **대부분은 내용이 이미 `docs/internals.md` 에 있다**(앵커 40개).
  따라서 이 회차는 "문서 신설" 이 아니라 대체로 **"한 줄 + 링크로 압축"** 이다.
  실제로 읽어서 확인한 것: `#any`(L77·L207), `#anon-monoid-tag`(L1283·L1292),
  「세 P 는 사설 딕셔너리가 아니다」(L3044), `#registry-writes`, Free.md 취소 절(L3649).
- **소유자 결정(2026-08-19)** — **(가)+(나) 는 docs 위임, (다) 편집자 메모 6개는 docs 로
  안 옮기고 한 줄로 압축**(세부 일부 소실을 감수). 문서를 탁하게 만들지 않는 쪽.
- **완료조건** — ① 앵커 없는 다줄 블록 0 ② 링크한 docs 참조·앵커가 전부 실재
  ③ 48/48 + 타입체크 ④ baseline 차이 0 ⑤ dist 재빌드(소유자 요청 시).
- **처분 실적** — (가) 25곳 한 줄+링크 · (나) 5곳은 문서를 먼저 쓰고 압축 · (다) 6곳 한 줄.
  (나) 의 내역: `Algebra.all` 소문자 규칙(internals#algebra-all 신설 문단) · 튜플 길이
  검사(Bifunctor.md 절 신설) · `preview` 가 `Monoid.lookup('maybe')` 를 쓰는 이유
  (internals#optics) · 러너의 걸음별 try 와 예약된 명령 이름(Free.md — **문장은 이미
  있었고 실행되는 예제가 없었다**, 그것을 붙였다).
- **검증(2026-08-19)** — `//` 줄 197→143(-54), 파일 3746→3692. 앵커 없는 다줄 블록
  36→0(필터를 빠져나간 L211 1곳 추가 처리 — `CLAUDE.md` 를 가리켜 "앵커 보유"로 잡혔다).
  index.js 가 가리키는 docs 참조 27개 전수 검사, 파일·앵커 **깨진 것 0**. 문서 예제
  451→456. `npm test` **48/48 + 타입체크**(dist-sync 만 빨강 — dist 재빌드는 소유자
  요청 대기), `npm run baseline` **차이 없음**.
- **뮤테이션 3종과 그 결말** — ㉰ preview 의 monoid 를 `maybe(first)` 로 → docs 게이트
  빨강 1. ㉮ 튜플 길이 검사 제거 → docs 게이트 **초록**, `bifunctor.test.js` 가 잡음.
  ㉯ `Algebra.all` 소문자 검사 제거 → docs 게이트 **초록**, `registry-api.test.js` 가 잡음.
  전건 복원 확인(복원은 git checkout 이 아니라 스크래치패드 사본에서 — 8/18 사고 승계).

### ✅ 닫힘 — 문서 예제 게이트가 값도 본다 (2026-08-19)

- **소유자 결정** — (다) 둘 다: 게이트 신설 + CHANGELOG 문구 정정.
- **설계** — 주석 붙은 `console.log` 의 기대값들이 **출력 안에 그 순서대로** 나타나야 한다
  (부분 수열). 표기는 정규화한다(따옴표 제거, `[1, 2]`≡`[ 1, 2 ]`≡`[1,2]`).
  기대값은 주석의 앞부분이고 두 칸 이상 공백이나 ` — ` 뒤는 사람 읽을 설명이다.
- **1:1 짝짓기로 짰다가 게이트가 통째로 눈을 감았다** — `try { console.log(x) }
  catch (e) { console.log(e.message) }` 는 **호출 자리 둘이 출력 한 줄**이라, "모든
  console.log 에 주석 + 줄 수 일치" 규칙이 정작 검사하려던 블록을 전부 대조 밖으로
  뺐다. 뮤테이션 셋이 전부 초록인 것을 보고 알았다 — **초록을 의심한 것이 설계를 구했다.**
  부분 수열로 바꾼 뒤 대조가 360→397줄로 늘었다.
- **곁가지 버그** — `// console.log는 부수 효과` 같은 **주석 줄 자체**를 호출로 셌다.
  코드 부분만 보고 세도록 고쳤다(`//` 앞을 자른다).
- **잡힌 낡은 문서 2건(진짜 어긋남)** — `internals.md` 곱셈군: `1.0000000000000002` 로
  적혀 있었으나 실제 출력은 `0.9999999999999999`(TODO 의 옛 기록도 같은 오기).
  `WriterT.md`: `tell` 만 한 계산의 값이 `null` 이라고 적혀 있었으나 실제로는 `undefined`.
- **정리** — 기대값 주석 24곳을 실제 출력에 맞춰 교정(산문 주석·일부만 인용·개념 표기
  `Just(3)` 등). `Task.md` 의 조건부 실행 예제는 진짜 `fetch` 라 실패 콜백으로 떨어져
  출력이 없던 것을 사실대로 적었다.
- **영수증(뮤테이션 4종 전부 빨강, 전건 복원)** — ㉮ 튜플 길이 검사 제거 ㉯ `Algebra.all`
  소문자 검사 제거(**둘 다 옛 게이트는 초록이던 것**) ㉲ `first` Semigroup 이 둘째를
  고르게(❌ 4블록) ㉳ 곱셈군 역원을 `x` 로(❌ 1블록).
- **남은 한계(명시)** — 정규화가 따옴표를 지우므로 `'1'` 과 `1` 을 못 가른다. 대조 밖
  블록 269개 = 출력 없음 204 + 기대값 주석 없음 65. 게이트가 그 수를 매번 찍는다 —
  조용히 빠지면 "전부 본다" 로 읽히기 때문이다.
- **문구 정정** — `CHANGELOG.md` 0.1.0 절의 "설명이 코드와 어긋나면 빌드가 멈추므로
  문서가 조용히 낡을 수 없습니다" 를 실제 보증(그때는 던지는 어긋남만)으로 낮추고,
  「미발행」 고침에 이번 게이트와 잡힌 문서 2건을 적었다. `CLAUDE.md` 에 주석 규약
  (기대값 먼저, 두 칸 뒤 산문)과 게이트의 한계를 적었다.
- **검증** — `npm test` **48/48 + 타입체크**(dist-sync 만 빨강 — dist 재빌드는 소유자
  요청 대기), `npm run baseline` **차이 없음**, 문서 예제 456개 실행 · 397줄 대조 초록.

- **발견의 경위** — B안 회차에서 새로 넣은 예제가 값을 잠그는지 뮤테이션으로 확인하다
  **셋 중 둘이 안 잡히는 것**을 보고 게이트 소스를 읽어 확인했다. 던지면 빨강,
  값이 조용히 틀리면 초록이었다.
### ✅ 닫힘 — `docs/Reducible.md` 신설 (2026-08-19)

- **경위** — 소유자가 정한 순서의 6번. 그 전까지 Reducible 은 전용 페이지 없이
  NonEmptyList.md·README·internals 세 곳에 흩어져 있었다.
- **내용** — 개념(왜 Monoid 가 아니라 Semigroup 인가) · 인터페이스 표 · 인스턴스 둘
  (nonemptylist·identity) · **없는 것이 뜻이다**(Array·Maybe 의 거부 실측) · 법칙 3
  (게이트가 도는 것과 같은 것) · 거부 문안 · 데이터 타입 정적 문이 위임이라는 점.
  실행 예제 8개, 대조되는 줄 18줄.
- **명부 연결** — docs/README.md 「4단계: 고급 패턴」 목록 + 타입 클래스 표를 링크로,
  NonEmptyList.md 의 Reducible 언급을 링크로, CHANGELOG 의 Reducible 항목에 문서 링크.
- **검증** — 뮤테이션 2종 전부 **`docs/Reducible.md` 가 직접 잡았다**: ㉴ reduceLeft 를
  reduceRight 로(방향 뒤집기) → 빨강 1 · ㉵ reduceMap 이 head 대신 tail[0] 을 씨앗으로
  → Reducible.md 2블록 포함 빨강 3. 전건 복원. 문서 예제 456→464개, 대조 397→415줄.
  `npm test` **48/48 + 타입체크**, `npm run baseline` **차이 없음**.
- **명세 밖 처우 유지** — SPEC 표·의존성 그래프에는 넣지 않았다(MonadError 선례).

### ✅ 닫힘 — 깨진 문서 링크 8곳 + 링크 게이트 신설 (2026-08-19)

- **무엇이었나** — 상대 링크를 전수 검사하다 나왔다. `./Apply.md`(4곳: Reader·State·
  Validation·Writer)와 `./Chain.md`(4곳: Free·Reader·State·Writer)를 가리키는데
  **그 두 파일은 존재한 적이 없다.** GitHub 에서 누르면 404 였다.
- **처분(에이전트 판단, 소유자 "링크 먼저 처리")** — (나)+(다). `Apply` 의 `ap` 는
  `Applicative.md` 에, `Chain` 의 `chain` 은 `Monad.md` 에 **이미 있으므로** 그쪽으로
  돌리고 어디 있는지 한 줄로 밝혔다. (가) 새 페이지 둘은 안 만들었다 — 있는 내용을
  복제하게 되고, Apply·Chain 에 전용 페이지가 없는 것은 이 저장소의 기존 관례다.
- **게이트** — `tests/docs-links.test.js` 신설. README·CHANGELOG·CLAUDE·docs/*.md 의
  상대 `.md` 링크와 **앵커까지** 본다(앵커는 파일보다 조용히 깨진다). 앵커는 명시
  `{#이름}` 과 제목에서 만들어지는 slug 둘 다 인정. `run.js` 가 `tests/*.test.js` 를
  자동으로 훑으므로 등록 명단에 넣을 것이 없다. 추출기가 망가지면 0개를 보고 초록이
  되므로 하한(100개) 단언을 함께 뒀다.
- **검증** — 상대 링크 **226개** 전부 초록. 뮤테이션 2종 전부 빨강·복원 확인:
  ㉶ 없는 파일(`./Foldables.md`) ㉷ 없는 앵커(`#reducibles`).
  `npm test` **49/49 + 타입체크**(dist-sync 만 빨강 — 재빌드 대기), baseline 차이 없음.

## ✅ 닫힘 — 코덱스 6차 감사의 처분 (2026-08-19, 13건 전건)

- **감사 완료** — 소유자 지시로 `index.js` 를 **아무 조건 없이** 적대 리뷰. 13건 보고.
  기록: [`review/260819-codex-index-audit-6.md`](./review/260819-codex-index-audit-6.md)
- **주 에이전트 독립 재현 완료** — 10건 재현됨, 3건은 **이미 결정·문서화된 한계**
  (6 NaN·7 곱셈군·13 빈 배열 extract — 앵커 실재 확인). 무조건 감사라 결정된 것도
  다시 올라온 것이고 오탐이 아니다.
- **재현 못 한 것 1건 있음** — [2] Actor 통지 순서는 주 에이전트 자체 재현 둘로는
  안 걸렸고 **코덱스 재현으로만** 걸렸다(첫 메시지를 미정착으로 붙잡는 것이 조건).
- **1.0 조건 2 는 아직 아니다** — "전면 감사가 무소득" 이어야 하는데 소득이 10건이다.
- **완료조건** — 소유자가 13건 각각의 처분(수리/문서/안 함)을 정하고, 택한 수리마다
  뮤테이션 영수증이 나온다. **`index.js` 수정은 소유자 동의 후에만.**

### ✅ 1회차 닫힘 — 국소 수리 4건 (2026-08-19, 소유자 "국소수리부터")

건별로 **회귀 테스트 선행(빨강 실측) → 수리 → 초록**. 테스트 선행이 곧 되돌림 뮤테이션의
영수증이다(수리 전 빨강 = 되돌리면 빨강). 그 위에 되돌림 뮤테이션도 따로 확인했다.

| # | 무엇을 했나 | 되돌림 뮤테이션 |
| --- | --- | --- |
| 1 | `Optics.prop` 의 복제·대입을 `defineProperty` 로(4차-1 선례) | ㉠ 대입으로 복원 → optics **빨강 2** |
| 11 | Actor 통지를 사본으로 순회, 그 사이 해지된 구독자는 건너뜀 | ㉡ 원본 순회로 복원 → actor **빨강 1** |
| 10 | 러너 셋의 **입구**에 Free 검사, 문안 통일 | ㉢ 검사 제거 → free **빨강 1** |
| 12 | `range`/`rangeBy` 가 정수·유한을 봄 | ㉣ 정수 검사 제거 → func **빨강 1** |

- **[10] 의 범위를 좁힌 근거** — `runWithTask` 는 걸음마다 Free 를 요구하지만
  `runSync`/`runAsync` 는 **러너가 평범한 값을 내는 것이 문서화된 계약**이다(docs/Free.md
  「러너 셋」). 그래서 통일한 것은 입구의 프로그램 인자뿐이고, 러너 반환 계약은 안 건드렸다.
  대조군 테스트(커스텀 함자 + trampoline)로 정상 경로가 그대로임을 함께 잠갔다.
- **[11] 의 계약** — 사본을 돌되 해지는 즉시 발효한다. 테스트 둘로 양쪽을 못박았다:
  자기 해지해도 다음 구독자는 받는다 · 남을 해지하면 그 통지부터 빠진다.
- **동작이 바뀌는 것 둘** — `range('3')` 이 던진다, Free 아닌 프로그램이 던진다.
  타입 선언에는 원래 없던 사용법이라 선언과 런타임이 오히려 맞춰졌다. CHANGELOG 기재.
- **검증** — `npm test` **49/49 + 타입체크**(dist-sync 만 빨강 — 재빌드 대기),
  문서 예제 464개·대조 415줄 초록, 링크 226개 초록, `npm run baseline` **차이 없음**.
  **다만 baseline 격자는 `range`·`Optics.prop`·러너 입구를 안 본다** — 이번 영수증은
  뮤테이션 쪽이다.
### ✅ 2회차 닫힘 — 설계 판단 3건 (2026-08-19)

**[5] 는 소유자 질문이 설계를 바꿨다.** 에이전트 제안은 "생성자를 막는다"(공개 표면 변경)
였는데 소유자가 *"심볼로 해결이 가능하지 않나요?"* 라고 물었다. 실측하니 **된다** —
심볼이 기반 클래스 prototype 에 있어 `new Maybe()` 가 상속으로 물려받고 있었다.
`Just`/`Nothing`·`Left`/`Right`·`Valid`/`Invalid` 로 내리니 가드가 걸리고 정상 값은 그대로,
**표면 변경 0**. 뮤테이션 ㉥(기반 클래스로 되돌림) → 세 파일 전부 빨강.

**[4] 소유자 결정: (가) "확실한 계산만 제공합시다."** `DefaultOrd` 를 원시값 넷
(number·string·boolean·bigint)으로 좁혔다. 짝 `DefaultSetoid` 는 `===`(참조 동등)이라
이미 확실한 계산이므로 **안 건드렸다**. 뮤테이션 ㉦ → 빨강 1.
곁가지: 테스트에 쓴 BigInt 리터럴 `1n` 을 **es-ceiling 게이트가 잡았다**(ES2020) —
`BigInt(1)` 호출로 우회. 게이트가 제 일을 했다.

**[2] 소유자 결정: 유저가 고르게 + 순차 진행에 타임아웃.** `notifyInOrder`(기본 `true`)와
`timeout`(기본 **1000ms**, `Infinity` 로 끔)을 추가했다.

- **GAS 충돌을 소유자가 잡았다** — 에이전트가 "GAS 에 setTimeout 이 없다"를 저장소 기록만
  근거로 말하자 소유자가 *"검색해보세요"* 라고 지시했다. 1차 자료 둘로 확인: GAS V8 은
  `setTimeout`·`setInterval`·`clearTimeout`·`queueMicrotask` 가 전부 없고 `Utilities.sleep`
  은 **동기 차단**이라 대체가 안 된다(스레드를 막으면 핸들러가 진행 못 해 타임아웃이 무조건
  발동). 답은 이 저장소가 이미 쓰는 방식이었다 — **타이머가 있으면 타이머, 없으면 경계 검사**
  (`Free.api` 협조적 취소와 같은 의미론).
- **"순수함수와 타입클래스를 잘 활용하라"(소유자)** — 손으로 짠 `settled` 플래그를 걷고
  **`once`**(일회 정착)와 **`Task.race`**(먼저 정착한 쪽이 이김)로 다시 썼다. 자기 라이브러리
  도그푸딩이다.
- **곁가지 성능 결함 하나를 직접 만들었다가 잡았다** — `Task.race([일, 마감])` 순서면 동기
  핸들러가 먼저 정착해 **그 뒤에 생긴 타이머가 회수 목록에 없다.** 프로세스가 메시지마다
  1초씩 더 살았다(실측 1.04s). 마감을 먼저 두어 0.04s.
- **뮤테이션 6종** — ㉧ 기본을 false 로 · ㉨ 순서 분기 제거 · ㉩ once 제거 · ㉪ 마감 race
  제거 · ㉫ 경계 검사 제거 · ㉬ 기본값 1초→5초. **처음에 ㉩ 이 안 잡혔다** — 타이머 경로에서는
  `Task.race` 가 일회 정착을 대신 보장해서다. `once` 가 혼자 지는 자리(타이머 없음 + 늦은
  도착)의 표본을 자식 프로세스로 추가하고서야 빨강이 됐다. **초록을 의심한 것이 또 한 번
  눈감은 게이트를 막았다.**
- **동작이 바뀐다** — 1초 넘는 핸들러가 기본으로 거부된다(네트워크 호출 주의), 알림이
  순서를 따른다. 둘 다 CHANGELOG 파괴적 변경에 기재.

- **검증** — `npm test` **49/49 + 타입체크**(dist-sync 만 빨강 — 재빌드 대기), 문서 예제
  465개·대조 416줄, 링크 226개, baseline **차이 없음**(격자가 Actor 옵션을 안 보므로 영수증은
  뮤테이션 쪽), 타입 선언·`docs/Actor.md`(실행 예제 포함)·CHANGELOG 갱신.

### ✅ 3회차 닫힘 — 성능 2건 (2026-08-19, 소유자 "8,9번 갑시다")

- **[8] `ArrayChainRec`** — `shift`/`unshift` 큐를 **스택**으로. 자식을 거꾸로 쌓아
  **깊이 우선 순서를 그대로** 지켰다(그 순서는 결과 배열에 직접 드러난다).
- **[9] `ArrayTraversable.traverse`** — 누적을 걸음마다 `[...a, b]` 로 펼치던 것을
  **cons 로 O(1) 씩 잇고 끝에서 한 번만** 펴도록. 변이가 없어 **비결정 applicative(Array)**
  에서도 안전하다 — 이것이 "그냥 배열을 밀어 넣기" 를 못 쓰는 이유다.
- **전후 한 프로세스 대조 21건, 불일치 0건** — chainRec 갈래 모양 6종(단순 사슬·계속+결과·
  결과+계속·두 갈래·즉시 종료·빈 반환), traverse applicative 8종(identity·maybe 성공/실패·
  either 성공/실패·array 비결정 2종·빈 배열·validation 누적), optics 5종(Const/Forget 경로),
  sequence 1종.
- **성능 실측(같은 프로세스, 전/후)** — n=32,000 에서 chainRec 730.9ms → 0.9ms(828배),
  traverse 814.1ms → 2.4ms(345배). 전은 n 이 2배마다 4배씩(제곱), 후는 거의 평평(선형).
- **게이트는 시간이 아니라 구조로 잠갔다** — 시간은 기계마다 흔들린다.
  ① chainRec: 실행 중 `shift`/`unshift` **0회**(4차-3 의 slice/concat 게이트와 같은 수법)
  ② chainRec: 깊이 우선 순서를 값으로 단언
  ③ traverse: 관측 Applicative 를 만들어 **누적이 배열로 지나가지 않음**을 단언
  (관측기가 아무것도 못 보면 실패하도록 하한도 뒀다 — 눈감은 게이트 방지).
- **뮤테이션 3종 전부 빨강·복원** — ㉭ 옛 큐 복원 · ㉮ 옛 누적 복원 · ㉯ 자식 쌓는 순서
  뒤집기(깊이 우선 깨짐).
- **검증** — `npm test` **49/49 + 타입체크**(dist-sync 만 빨강 — 재빌드 대기), baseline
  **차이 없음**, 문서 예제 465개·대조 416줄, 링크 226개. CHANGELOG 기재.

### ✅ 4회차 닫힘 — [3] 수 덧셈의 부동소수 (2026-08-19)

- **처우** — 곱셈 군(#7)과 같다: 고칠 수 있는 결함이 아니라 **알려야 할 사실**.
- **실측으로 갈린 것** — 곱셈은 *역원*이 평범한 값에서 깨지는데, 덧셈은 역원이 **유한한
  수에서 정확하다**(`0.1 + -0.1` = 정확히 `0`). 덧셈에서 깨지는 것은 **결합법칙** 쪽이고
  역원은 무한대에서만 `NaN` 이다. 그래서 곱셈 절에 얹지 않고 절을 따로 세웠다.
- **문서** — `docs/internals.md#number-sum` 신설(실행 예제 2개, 값까지 대조됨).
  곱셈 절과 상호 링크.
- **게이트의 초록이 어디서 오는지 밝혔다** — 수 표본 `[0,1,2,-3,0.5]` 는 전부 이진수로
  정확한 값이라 반올림이 없다(125조합 전수 실측: 깨짐 0건). `SAMPLE_OVERRIDES` 에 합 셋
  (Semigroup·Monoid·Group)을 명시하고 이유를 남겼다 — 표본을 못박아 두면 나중에 기본
  표본이 바뀌어도 이 사정이 남는다.
- **영수증** — ㉰ 합 표본을 `[0.1, 0.2, 0.3]` 으로 갈아끼우니 법칙 게이트가
  **결합법칙 깨짐 4건**을 정확히 짚었다(복원 확인). **게이트는 눈이 먼 게 아니라 표본에
  기대고 있었다** — 그 차이를 실증으로 남긴다.

## ✅ 닫힘 — 코덱스 7차 감사 (2026-08-19, 힌트 없이)

소유자 지시: "index.js 만 아무런 힌트 없이." 판정 3건, **전건 주 에이전트 재현**.

| # | 무엇 | 재현 | 처분 |
| --- | --- | --- | --- |
| 1 | `NonEmptyList.chainRec` 이 `shift`/`unshift` 큐 — 제곱이고, spread 가 **스택을 터뜨림** | 재현됨 | 수리 |
| 3 | `NonEmptyList.traverse` 가 `concat([y])` 로 누적 복사 — 제곱 | 재현됨 | 수리 |
| 2 | `dist/` 가 소스와 다름 | 기지(旣知) | 재빌드 대기 |

- **이것은 에이전트의 누락이었다.** 6차 8·9 를 고칠 때 **Array 인스턴스만** 보고 같은 연산의
  NonEmptyList 구현을 안 봤다. 더 나쁜 것은 그때 만든 회귀 게이트 둘이 **Array 만 보도록**
  짜여 있어, 같은 결함이 옆에 그대로인데 49/49 초록이었다. 코덱스가 정확히 그 점을 지적했다.
- **처분(소유자 결정)** — 고치고 **게이트를 등록 인스턴스 전부 도는 모양으로**. 명단이 비면
  아무것도 안 보고 초록이 되므로 `array`·`nonemptylist` 가 명단·레지스트리에 있는지부터
  단언한다.
- **게이트를 먼저 넓혀 빨강을 봤다** — `nonemptylist 가 큐를 옮겼다: 1501`,
  `nonemptylist 가 자라는 배열을 흘렸다: 5`. 그 뒤에 수리했다.
- **[1] 은 성능이 아니라 계약 문제였다** — `ChainRec` 은 스택 안전이 존재 이유인데 20만
  갈래에서 `RangeError` 였다. 수리 후 **완주**(결과 200,000). 시간도 8k/16k/32k 에서
  1.6ms/70.8ms/242.3ms → 0.1ms/0.2ms/0.4ms(선형).
- **[3]** 원소 1,000개에서 누적 복사 499,500회 → **0회**.
- **전후 한 프로세스 대조 17건, 불일치 0건** — chainRec 갈래 6종(깊이 우선 순서 포함),
  traverse applicative 7종(비결정 배열·validation 포함), 이웃 연산 3종(toArray·reduceLeft·extract).
- **뮤테이션 3종 전부 빨강·복원** — ㉱ NEL 옛 큐 · ㉲ Array 쪽 순서 변이 · ㉳ NEL 옛 누적.
- **검증** — `npm test` **49/49 + 타입체크**(dist-sync 만 빨강), baseline **차이 없음**,
  문서 예제 467개·대조 420줄, 링크 226개. CHANGELOG 기재.
- **교훈** — 인스턴스가 여럿인 연산을 고칠 때는 **게이트를 인스턴스 하나에 매지 않는다.**
  하나만 보는 게이트는 "고쳤다"를 "고친 자리만 봤다"로 바꿔 놓는다.

## ✅ 닫힘 — 영어판 코드 블록 안까지 번역 (3단계)

- **소유자 지적** — "영어 문서인데 코드 내 주석이 한글인 경우가 있다." 맞다. 그건 에이전트가
  **의도적으로 그렇게 만든 것**이고(코드 블록 글자 동일 규칙), 그 선택의 대가였다.
- **실측** — 코드 블록 381개, 한글이 있는 줄 **935줄**, 그중 **295줄이 문자열 리터럴**.
  문자열을 바꾸면 출력이 바뀌고 기대값 주석도 따라 바뀐다 — 그래서 단순 치환이 아니었다.
- **소유자 결정: (가) 코드 안까지 영어로.** 보증 하나를 내려놓고 다른 하나를 세웠다.
  - 내려놓음: "영어판 코드가 정본과 글자까지 같다".
  - **세움**: `docs-examples` 게이트가 **영어판도 실행하고 값까지 대조**한다.
    예제 468→**936개**, 대조 421→**842줄**.
  - 남김: 번역 게이트는 **구조**를 본다(블록 수·실행 여부). 번역이 예제를 빠뜨리거나
    실행 대상에서 몰래 빼는 것을 막는다.
  - **손실을 명시한다**: 두 문서의 **논리가 갈라져도 기계가 못 잡는다.** 각자 돌기만 하면
    둘 다 초록이다. 게이트 파일 머리에 그렇게 적었다.
- **게이트가 판단을 강제했다** — 문자열을 바꾼 곳마다 기대값 주석을 함께 고쳐야 초록이 된다.
  에이전트들이 까다로운 자리를 제대로 처리한 근거가 그 초록이다:
  ① `internals` 의 유니코드 예제에서 `'\u00e9'` 이스케이프 표기를 실제 문자로 안 바꿈
  ② `Actor` 의 바이트 수 예제에서 한글 배열(길이 1,2,3,1,4)을 **같은 길이의 영어 배열**로
     바꿔 합계 11을 유지 ③ `WriterT` 의 20자 경계 예제에서 분기 결과를 유지하려 19자 영어
  문자열을 고름(원문의 "안 타는 분기"를 고치지 않고 보존) ④ 라이브러리가 던지는 문안은
  전부 보존(`Actor: handle timed out after 30ms`, `ChainRec.chainRec: step must be …` 등).
- **에이전트 보고 하나가 거짓이었다** — 소형 문서 배치가 "27개 파일 전부 완료, 코드 안 한글
  0건" 이라고 보고했으나 **실측하니 20개 파일에 128줄이 남아 있었다**(162→128, 일부만 함).
  잔여분을 둘로 나눠 다시 돌리되 **정확한 검증 명령을 주고 그 출력을 그대로 붙이라**고
  지시했다. 교훈: **초록이라는 말이 아니라 초록을 보여 주는 명령이 영수증이다.**
- **최종 검증(주 에이전트 직접)** — 코드 안 한글 **0줄**, `npm test` **51/51 + 타입체크**,
  예제 936개·대조 842줄, 링크 538개, **한국어 정본 무변경**(`git diff docs/*.md README.md` 무출력).

## ✅ 닫힘 — 영어 문서 전량 (2026-08-19, 1·2단계)

- **소유자 결정** — 기본은 한국어이되 영어도 제공한다. 배치는 **한국어 제자리 + `docs/en/`
  신설**(정본은 한국어). 범위는 **첫 화면부터 단계적으로**. 작업은 **서브에이전트(소넷) 병렬**.
- **배치를 그렇게 고른 이유** — `docs/ko/` + `docs/en/` 대칭안은 기존 링크 229개와 index.js
  의 docs 참조 27개를 전부 고쳐야 한다. 제자리 유지는 그 diff 가 0이다.
- **게이트를 번역보다 먼저 세웠다** — `tests/docs-translation.test.js`: 짝
  (`docs/X.md` ↔ `docs/en/X.md`, `README.md` ↔ `README.en.md`)마다 **코드 블록을 글자까지**
  대조한다(개수·순서·본문·펜스 정보 문자열). 번역이 코드를 건드리면 즉시 빨강.
  산문이 낡는 것은 이 게이트가 못 잡는다 — 기계가 볼 몫과 사람이 볼 몫을 갈랐다.
  `tests/docs-links.test.js` 도 `docs/en/`·`README.en.md` 를 보도록 넓혔다.
- **1단계 완료 — 12쌍** — README, docs/README, Setoid·Ord·Semigroup·Monoid·Group,
  Maybe·Either·Validation·NonEmptyList·Task. 서브에이전트 넷이 병렬로(3,053줄).
- **번역의 구조적 함정 하나를 게이트가 잡았다** — `docs/en/Either.md` 가 `./Maybe.md` 의
  **한국어 제목에서 생성된 앵커**(`#pipewhile---predicate-가-참인-동안만-잇는-pipe`)를
  가리켰다. 제목을 번역하면 그 앵커가 사라진다. 근본 대책: **정본 제목에 명시 앵커를 박는다**
  (`{#pipewhile}`) — 명시 앵커는 번역해도 살아남는다. 앞으로 번역 대상 문서에서 다른 문서가
  가리키는 제목에는 명시 앵커를 먼저 박을 것.
- **링크 규약** — 이번 배치에 없는 문서로 가는 링크는 `../` 로 한국어 정본을 가리킨다.
  영어 독자가 미번역 문서를 누르면 404 대신 한국어 원문으로 간다. 다음 회차에 번역이
  생기면 `./` 로 당긴다.
- **양방향 지시선** — 정본에 `> English: …`, 번역본에 `> 한국어: …` 를 제목 아래에.
- **검수는 에이전트 보고를 안 믿고 직접 했다** — 코드 동일성 12쌍, 산문 속 한글 잔존
  검사(코드 블록 제외), 지시선 위치, 줄 수 대조, 링크 337개. 지시선 위치가 파일마다
  달라 통일했다(에이전트 보고는 "넣었다"였고 실제로 있었으나 위치가 갈렸다).
- **검증** — `npm test` **51/51 + 타입체크**(테스트 파일 50→51), 문서 예제 468개,
  링크 **337개**(229→337).
- **2단계 완료 — 43쌍 전량.** 서브에이전트 일곱이 병렬로 남은 31개(9,451줄)를 옮겼다.
  영어 문서 43개 + README.en.md, 합 12,944줄.
- **1단계 교훈을 미리 적용했다** — 번역 전에 저장소를 훑어 "다른 문서가 가리키는데 명시
  앵커가 없는 제목"을 찾았고 `docs/StateT.md` 하나가 걸려 `{#m-as-string}` 을 박았다
  (EitherT·ReaderT·WriterT 셋이 그것을 가리킨다). 그 결과 2단계에서 앵커 사고 0건.
- **게이트가 네 번 값을 했다** — 에이전트들이 첫 초안에서 코드 블록 안의 한글을 영어로
  옮긴 것을 잡았다: Writer/State 의 주석, Actor 의 주석, EitherT 의 블록 분할,
  Filterable 의 주석, 그리고 **internals 의 `\u00e9` 를 실제 문자 `é` 로 바꿔 쓴 것**
  (눈으로는 거의 안 보이는 차이다). 번역보다 게이트를 먼저 세운 판단이 여기서 값을 했다.
- **정본의 결함 하나를 번역이 드러냈다** — `docs/Lens.md` 에 같은 문장이 두 번 있었다.
  에이전트가 "정본 충실" 원칙대로 고치지 않고 그대로 옮겨서 알아챘다. 양쪽 다 고쳤다.
- **깊이 함정 하나** — `docs/en/` 은 한 겹 깊어서 저장소 밖(`.dev/`·`tests/`)을 가리키는
  `../` 링크가 어긋났다. internals 4곳을 `../../` 로 보정했다. 링크 게이트가 잡았다.
- **마무리 정리** — 1단계에서 `../` 로 돌려 뒀던 링크 58곳 + README 2곳을 영어 형제로
  당겼고, 양방향 지시선(정본에 `> English:`, 번역본에 `> 한국어:`)을 44쌍 전부에 맞췄다.
- **검증** — `npm test` **51/51 + 타입체크**, 번역 짝 **44쌍** 코드 동일성, 앵커 34개
  집합 일치(불일치 0), 링크 **538개** 전부 실재, 산문 속 한글 잔존 0(코드 안 문자열과
  미번역 CHANGELOG 앵커는 의도된 잔존).
- **번역 대상 밖** — `CHANGELOG.md`(변경 기록은 정본 하나가 낫다), `.dev/`(작업 기록),
  `CLAUDE.md`(에이전트 지시서).

## ✅ 닫힘 — README 첫 화면 정비 (2026-08-19)

- **가장 큰 것: 설치 명령이 안 되는 것이었다.** 첫머리가 `npm install fun-fp-js` 인데
  레지스트리에 없다(실측: E404). 아직 발행 전이다. GitHub 설치로 바꾸고, 발행 후에는
  원래 명령이 된다고 적었다.
- **숫자가 낡았고 서로 모순됐다** — "등록된 인스턴스 131 / 법칙이 도는 인스턴스 149" 는
  성립할 수 없는 조합이었다. 전부 실측으로 교체: 타입 클래스 29종(명세 24 + 명세 밖 5) ·
  등록 인스턴스 **148**(타입 클래스별 고유 인스턴스의 합) · 문서 예제 **468**(그중 421줄
  값 대조) · 테스트 파일 **50** · 배포물 **0.60MB**(`npm pack --dry-run`, 파일 7개,
  압축본 0.13MB) · min+gzip **26KB**(23KB 로 적혀 있었다).
- **비교 표는 우리 줄만 고쳤다** — 다른 줄은 2026-08-14 레지스트리 실측이고 이번에 다시
  재지 않았으므로 건드리지 않고, 각주에 그 사실을 적었다.
- **「문서가 낡지 않습니다」 절을 사실에 맞게 다시 썼다** — 이제 값까지 대조하므로 주장을
  올리되 **한계도 같이 적었다**: 주석 없는 블록 67개는 실행만 되고, 정규화가 따옴표를
  지워 `'1'` 과 `1` 을 못 가린다. 링크·앵커 229개 검사도 적었다.
- **내용 표에 빠진 것 보충** — 명세 밖 5종(MonadError·Reducible·Strong·Choice·Wander),
  데이터 타입에 NonEmptyList·Identity.
- **상태 절** — `0.1.0` 이후 파괴적 변경이 쌓여 있다는 사실과 CHANGELOG 「미발행」 포인터를
  앞에 뒀다. 저장소를 직접 받아 쓰는 사람이 먼저 봐야 할 것이기 때문이다.
- **검증** — README 예제 2개 초록, 문서 예제 468개·대조 421줄, 링크 **229개**(3 증가),
  `npm test` 50/50 + 타입체크.

## ✅ 닫힘 — 코덱스 10차: 마지막 회차 (2026-08-19)

- **방식** — 제외 명단을 **열여섯으로** 늘렸다(문서화된 한계 9 + 오늘 결정한 것 7).
  그리고 "최근 손댄 자리들이 만나는 경로가 가장 덜 검증됐다"를 사실로 알렸다.
- **판정 2건, 둘 다 CONFIRMED, 그리고 둘 다 오늘 에이전트가 쓴 코드였다.**

| # | 무엇 | 언제 생겼나 |
| --- | --- | --- |
| 1 | `copyOwn` 이 `configurable:false` 까지 옮겨 **동결 객체를 갱신 못 함** | **9차 수리** |
| 2 | 재진입 가드가 thenable 을 그대로 돌려줘 소비자가 기다릴 때 `then` 이 **두 번** 불림 | **8차 수리** |

- **[1] 의 아이러니** — 9차에서 심볼 손실을 고치려 서술자를 통째로 옮겼더니 자물쇠까지
  옮겨졌다. 오늘 아침의 `Object.keys` 판은 서술자를 새로 만들어서 이 문제가 없었다.
  **한 수리가 다른 것을 깨는 일이 세 번째다**(6차-1 → 9차-2 → 10차-1).
  지금은 서술자를 옮기되 `writable`/`configurable` 은 안 물려준다. 열거 여부·접근자
  여부는 데이터의 모양이라 그대로 둔다.
- **수리 도중 같은 함정에 또 빠졌다** — 서술자를 **모으는 그릇**에 `to['__proto__'] = d` 를
  했다가 프로토타입이 바뀌었다. 5차 감사가 잡았던 기존 테스트가 즉시 빨개져서 알았다.
  수집 그릇도 `Object.create(null)` 로 바꿨다. `__proto__` 함정은 이 저장소에서 네 번째다.
- **[2]** `Promise.resolve(result).finally(...)` 로 동화해서 돌려준다. 8차의 `finally`
  문제(최소 thenable 에 `finally` 가 없음)는 **동화된 것은 진짜 Promise** 라 안 걸린다.
- **뮤테이션 3종 전부 빨강·복원** — ㋃ 서술자 통째 이관(9차 상태) → optics 빨강 2 ·
  ㋄ 수집 그릇을 평범한 객체로 → func 빨강 1 · ㋅ thenable 그대로 반환(8차 상태) → free 빨강 2.
- **검증** — `npm test` 49/49 + 타입체크(dist-sync 는 재빌드 전), baseline **차이 없음**.

### 이 감사 연쇄에서 배운 것 — 다음 회차가 읽을 것

1. **수리는 새 코드이고, 새 코드가 가장 안 검증된 코드다.** 6차 10건(본체) → 7차 2건
   (내 누락) → 8차 1건 → 9차 4건(1건이 내 회귀) → 10차 2건(**둘 다 내 회귀**).
   본체 결함은 말랐고, 남은 것은 수리가 만든 것이다.
2. **회귀 테스트는 「고친 것」만 보면 안 된다.** `__proto__` 방어를 테스트하면서 "다른
   속성은 그대로 오나"를 안 봐서 9차-2 가 났고, 심볼 보존을 테스트하면서 "동결 객체는
   갱신되나"를 안 봐서 10차-1 이 났다.
3. **제외 명단을 주면 신호가 는다.** 8차 재보고 3/5 → 9차 0건 → 10차 0건.
4. **1.0 조건 2("전면 감사가 무소득")는 판정 가능한 형태로 다시 써야 한다.** 지금 문장은
   끝이 없다 — 감사가 수리를 부르고 수리가 다시 감사 대상이 된다. 제안: 「문서화된 한계와
   소유자 결정을 뺀 새 결함이 0건이고, **그 회차에 새 코드를 안 썼을 때**」.

## ✅ 닫힘 — 코덱스 9차: 제외 명단을 주고 받은 회차 (2026-08-19)

- **방식이 바뀌었다** — 소유자 지시로 **문서화된 한계·소유자 결정 아홉 가지를 미리 알리고**
  나머지만 보게 했다. 8차에서 판정 다섯 중 셋이 재보고였는데, 9차는 **재보고 0건**.
  제외 명단이 실제로 신호를 걸러 냈다.
- **판정 4건, 전건 재현.** 그중 하나는 **에이전트가 오늘 만든 회귀**다.

| # | 무엇 | 뿌리 |
| --- | --- | --- |
| 2 | `Optics.prop` 이 심볼·숨은 속성을 지움 — 렌즈 Get-Put 위반 | **오늘 아침 6차-1 수리의 회귀** |
| 4 | `transducer.into` 도 같은 병(그릇 내용 보존 계약 위반) | 5차 수리 때부터 |
| 1 | `Task.filter` 술어 예외가 비동기에서 uncaught 로 새고 Task 영구 미정착 | 기존 |
| 3 | `Optics.prop` 이 TypeScript 선언에 없음 | 사용-1 회차부터 |

- **[2] 의 경위** — `__proto__` 를 막으려 복제를 `Object.assign` → `Object.keys` 순회로
  바꿨는데, `Object.keys` 는 열거 가능한 문자열 키만 본다. **옛 코드가 보존하던 심볼까지
  잃었다** — 수리가 다른 것을 깬 것이다. 오늘의 회귀 테스트는 `__proto__` 와 `a` 만 봤다.
- **[2]·[4] 는 같은 뿌리** — "객체 복제"를 `Object.keys` 로 구현한 것. 모듈 사설 `copyOwn`
  하나(`getOwnPropertyDescriptors` + `defineProperties`)로 합쳤다. 심볼·숨은 속성·접근자를
  보존하고 own `__proto__` 도 안전하다. **복제의 문이 하나가 됐다.**
- **[1]** `taskFilter` 가 술어를 감싼다 — `TaskFunctor` 는 이미 감싸고 있었고 filter 만
  빠져 있었다. 실측: 고치기 전 `{"events":["uncaught:predicate-boom"],"settled":"PENDING"}`,
  고친 뒤 `{"events":[],"settled":"rejected:predicate-boom"}`.
- **[3]** 선언 추가 + **재발 방지 게이트** — `fp.Optics` 의 런타임 키가 전부
  `types/Lens.d.ts` 에 있는지 본다(선언 파일은 사람이 손으로 유지한다).
- **뮤테이션 4종 전부 빨강·복원** — ㉻ `Object.keys` 순회(오늘 아침 상태) → optics 빨강 2 ·
  ㋀ `Object.assign`(그 이전 상태) → func 빨강 3 · ㋁ taskFilter try 제거 → task 빨강 4 ·
  ㋂ 선언에서 prop 제거 → registry-api 빨강 1.
- **검증** — `npm test` 49/49 + 타입체크(dist-sync 는 재빌드 전), baseline **차이 없음**.
- **교훈** — **수리의 회귀 테스트는 고친 것만 보지 말고 「원래 하던 일」도 봐야 한다.**
  `__proto__` 방어를 테스트하면서 "다른 속성은 그대로 오나"를 안 봤다.

## ✅ 닫힘 — ChainRec 규격 밖 걸음을 거부로 (2026-08-19, 소유자 "나")

- **경위** — 8차 감사가 "next 아니면 전부 완료로 친다"를 결함으로 지목했다. 구현했더니
  문서 예제 게이트가 빨개졌고, 그 동작이 **2026-08-15 소유자 결정**임을 그때 알았다.
  되돌린 뒤 결정 기록을 복원해 다시 올렸다.
- **결정 기록에서 확인된 것** — 그때 고른 것은 「종료 대 거부」가 **아니었다.** TaskChainRec
  수리가 실수로 방향을 뒤집어 「done 아니면 계속」(무한 반복 위험)이 됐고, 그 회귀를 옛
  동작으로 되돌린 결정이었다. **거부는 선택지에 없었다** — 문서의 "무한 반복" 은 거부를
  배제한 이유가 아니다.
- **판단 재료(실측)** — 흔한 실수 셋의 결과: `done` 을 깜빡한 맨 값 `42` → 결과 `null` ·
  `next` 오타 → 계속할 것이 끝남 · `tag` 오타 → `7`(그럴듯해서 안 보임). 그리고 이
  라이브러리는 같은 상황을 **여섯 곳에서 거부**한다(kleisliCompose·MonadError.handleError·
  Task.catchError·Prism.match·EitherT.catchError·Actor.handle). ChainRec 만 예외였다.
- **구현** — 모듈 **사설** 판별 문(`checkStep`/`isNextStep`) 하나로 다섯 인스턴스가 같은
  규칙을 쓴다. ChainRec 의 정적 표면은 안 늘렸다 — 지난 시도에서 공개 statics 로 뒀다가
  baseline 격자에 차이 1건이 잡혔다. Task 는 **던지지 않고 거부**한다(비동기 걸음에서
  던지면 바깥 try 밖이라 아무도 못 받는다 — 무음 정지).
- **뮤테이션 4종 전부 빨강·복원** — ㉷ 판별 통과(옛 동작) · ㉸ Task 만 옛 동작 ·
  **㉹ Task 를 거부 대신 던지게 → 영영 안 정착해 게이트가 잡음**(무음 정지 방지가 잠겼다) ·
  ㉺ 문서 게이트도 같은 변이를 잡음.
- **문서** — `internals.md#chainrec-stack` 의 절을 다시 썼다: 그때와 지금을 표로 대조하고,
  왜 그때 거부가 선택지에 없었는지 적었다. 실행 예제 3개(값까지 대조됨).
- **검증** — `npm test` 49/49 + 타입체크(dist-sync 는 재빌드 전), baseline **차이 없음**,
  문서 예제 468개·대조 421줄. **BREAKING** — 계약 밖 걸음에 기대던 코드는 이제 던진다.

## ✅ 닫힘 — 커밋·빌드·푸시 (2026-08-19, 소유자 "빌드, 푸시합시다")

- 순서 규율대로 **기능 커밋 4 → 빌드 → dist 커밋 1**. `dist/fun-fp.js` 헤더의
  `Commit:` 이 `28a93ef` 를 가리킨다.
- `c20371a..2f645d3` 를 `origin/main` 에 푸시. **`npm test` 50/50 + 타입체크, 빨강 0**
  (하루 종일 유일한 빨강이던 dist-sync 가 닫혔다).
- 산출물 직접 실행 확인 — ESM 에서 `Reducible.reduceLeft`=16, CJS 에서 `range('3')`
  거부 문안과 `Optics.prop('__proto__')` 프로토타입 안전.
- **확인 안 함** — 푸시 후 원격 CI 결과. 초록은 전부 로컬 실행이다.
- **가장 급한 것(에이전트 판단)** — [1] `Optics.prop('__proto__')` 가 프로토타입을 바꾼다.
  4차-1(`into` 의 `__proto__`)과 **같은 병**이고 그때의 수법(`defineProperty`)이 그대로
  듣는다. `prop` 이 그 수리 뒤에 들어와 같은 가드를 못 받았다.

## 닫힘 — Reducible 승격 (2026-08-19)

- **경위** — 소유자 "승격 해봅시다" → 유예 조건("두 번째 비공 컨테이너")의 두 번째가
  **Identity 로 이미 있었음을 발견**(유예 당시 후보 누락 — 시간 논거는 v2 에서 정정).
  소유자 "Identity 포함으로 진행" 확정. [`plan/260819-reducible.md`](./plan/260819-reducible.md)
- **계획 리뷰(코덱스)** — Blocker 2(법칙 비교가 obs 재사용으로 공허해짐·spec 게이트
  누락) + Major 7(잠금 101, identity 낡은 명부, foldMap 합법화 영향 등) → v2 반영.
  spec 게이트는 MonadError 선례(SPEC 표·README 그래프 불포함)로 무변경 정합.
- **구현** — `Reducible extends Foldable`(reduceLeft/reduceMap, checkAndSet 2규칙,
  ChainRec·Comonad 상속 관례), 인스턴스 2(NonEmptyList 몸 이동·Identity) + 전제
  IdentityFoldable 신설(foldMap 에 Identity 합법화), NEL 정적 문은 위임으로 존속
  (문안 주인은 Reducible), export/d.ts/HKT. **동반 수리**: algebra-type TYPE_CLASSES
  의 MonadError 누락(그 회차의 구멍), identity.test 다섯→일곱, README 의 낡은
  "identity 세 곳" 문구.
- **검증** — 법칙 3(원소 보존·reduceLeft 정합·first/last — 종류별 EQ, 분업: 단일
  원소는 보존만·방향은 NEL 몫), 뮤테이션 5종 전부 빨강(누락/Semigroup 무시/f 미호출/
  캐리어 검사 제거/init 무시), 잠금 101·148·26·13·7, 49/49 + 타입체크, baseline 8행
  전부 추가(제거 0), dist 재빌드.
- **구현 리뷰 반영** — Blocker 0. Major 1: 계획 v2 의 B2(SPEC 편입 지시)가 실제
  구현(MonadError 선례로 무변경 정합)과 모순 → 계획에 v3 로 결정 변경을 기록.
  Minor 2: README "타입클래스 25개"→26, CHANGELOG NEL 12→13. 구현 본체는 전건
  실행 검증 통과(비공허성 실증: 옛 obs 비교는 [999]≠[7] 을 통과시켰고 새 비교는
  잡음 · 이중 래핑 없음 · 비가환 방향 · strict/loose 시점 · 잠금 6종 실측 일치).
- **닫힘** — 유예 항목(Reducible 승격) 종결. 커밋·푸시는 소유자 지시 대기.

## 닫힘 — 도그푸딩 3회차: start/cancel 실기 (2026-08-19)

- **준비물** — [`experiment/260819-start-cancel-demo.mjs`](./experiment/260819-start-cancel-demo.mjs):
  파일 3개 내려받기 프로그램(Free.api) + 1.5초/개 해석기 + SIGINT→cancel 배선.
- **사전 검증(에이전트)** — ① 끝까지 두면 완주 ② 2초 시점 실제 SIGINT: a.bin 완료,
  비행 중이던 b.bin 단계는 마저 끝나고 다음 경계에서 멈춤, 거부 사유
  `cancelled === true` 로 취소/실패 구분. 실기의 몫: 소유자 손으로 Ctrl+C 체감 +
  두 번 누르기(중복 취소 무해) 확인.
- **소유자 실기 결과(2026-08-19)** — "실행해봤습니다. 예상대로 동작합니다." 출력:
  a.bin 비행 중 Ctrl+C → 진행 단계 완료 후 경계에서 멈춤, `cancelled === true` 확인.
  협조적 취소 의미론이 실제 터미널에서 소유자 손으로 검증됨. 마찰 보고 0건.
- **닫힘** — 1.0 조건 3("실제로 써 본 기록")의 재료로 기록.

## 닫힘 — 동명 `into` 정리: 최상위를 `pipeFrom` 으로 (2026-08-18)

- **경위** — `fp.into`(뒤집힌 pipe, 문서 0건)와 `fp.transducer.into`(Clojure 정전
  이름)가 동명. 소유자 결정: A안, 이름은 `pipeFrom`(pipe 가족 합류). transducer 쪽·
  `also` 는 불변, 삭제는 안 함(YAGNI 복원 이력). [`plan/260818-pipefrom.md`](./plan/260818-pipefrom.md)
- **실행** — index.js 2곳 + tests/func.test.js 2곳(+import) + types 4곳 개명(전부
  count==1 단언), CHANGELOG 파괴적 변경 절. 48/48 + 타입체크, baseline 차이 정확히
  1행(최상위 export: into 제거·pipeFrom 추가 — 계획된 이 세션 첫 의도적 제거), dist 재빌드.
- **판단 기록** — 기계적 개명이라 코덱스 리뷰·뮤테이션은 생략(동작 무변경은 기존
  단위 테스트가, 이름 정합은 타입체크·baseline·dist-sync 가 잡는다).

## 닫힘 — index.js 주석 소극 정리 (2026-08-18)

- 소유자 지시(A안). 실측: 주석 블록 140개 중 한 줄 규칙 위반 56개(141줄), docs 앵커
  보유 18개. 처분: docs 앵커 보유 블록 17곳을 "한 줄 제약 + 링크"로 압축(앵커 실재
  9종 전수 확인 후), 경위·역사 서술 2곳의 서사 제거. **삭제가 아니라 docs 위임** —
  상세는 이미 문서에 있다. 29줄 감소, 48/48 + 타입체크 + dist 재빌드.
- 남긴 것(B안 대상): 앵커 없는 다줄 블록 ~38개 — 압축하려면 내용을 docs 로 옮기는
  회차가 따로 필요. 소유자 결정 대기.

## 닫힘 — NonEmptyList: 비어 있을 수 없는 목록 (2026-08-18)

- **경위** — 소유자 질문("필요한가?")에 실측 셋으로 답함: ① 배열 Comonad 의
  `extract([]) === undefined` 를 게이트가 표본 필터로 가림(staticland-laws:737)
  ② `first`/`last` Semigroup 이 Monoid 짝이 없어 foldMap 에 못 들어감(12:10)
  ③ 빈 실패 `Invalid([])` 가 타입을 통과. 소유자: 범위 좁게(데이터 타입 +
  인스턴스 + reduce1/foldMap1, Validation 교체 없음) 승인 후 "계획해주세요".
- **계획** — [`plan/260818-nonemptylist.md`](./plan/260818-nonemptylist.md):
  head+tail 표현(구조가 비지 않음을 보증), 인스턴스 11(Comonad 는 필터 없는 온전한
  extract), 의도된 부재 4(Monoid·Plus·Alternative·Filterable — 이 부재가 존재 이유),
  reduce1/foldMap1 은 데이터 타입 정적 문(Foldable1 클래스는 계단 값 없음).
- **계획 리뷰 반영(v2)** — Blocker 2(게이트 표 이름 실물화·Extend/Comonad 검사 함수의
  NEL 사각 — 올바른 구현과 뮤테이션이 둘 다 초록임을 코덱스가 실행 증명) + Major 6
  (concat 방향 테스트로 뮤테이션 교체, 잠금 97/13/14, WANDER_TARGETS·FOLD_ORDER_ANCHOR
  편입, baseline 직접 관측 +8 구분, 생성자 초안 실물 서명화). 소유자 결정(v3):
  reduceLeft/reduceMap/Reducible(숫자 접미사 폐기), Reducible 클래스 유예(승격 조건:
  두 번째 비공 컨테이너), ChainRec 유예(닫는 조건: 소유자 결정 기록).
- **구현** — head+tail 데이터 타입 + 인스턴스 11 + reduceLeft/reduceMap(정적 문) +
  게이트 편입(잠금 97·13·14 실측 = 계획 리뷰 추정 그대로) + algebra-type 정규 태그
  (131→142) + registry-api 9개 + baseline 데이터타입 행 + d.ts/HKT/build-types 명단 +
  docs/NonEmptyList.md(실행 예제) + README·CHANGELOG.
- **검증** — 뮤테이션 6종 전부 빨강(빈검사 제거/extract=last/전체 반복/concat 뒤집기/
  Semigroup 검사 제거/traverse 뒤집기 — 복원 표적 치환), 48/48 + 타입체크, baseline
  차이 21행 전부 추가(제거 0, Monoid 행 없음 = 의도된 부재), dist 재빌드.
- **사고 재발 주의** — 뮤테이션 실행기의 zsh 변수 확장으로 테스트가 실행되지 않은 채
  FAIL 0 으로 위장(명령 미발견이 grep 에 안 잡힘). python subprocess 실행기로 재작성해
  전건 재검증. 교훈: FAIL 0 영수증은 "빨강을 봤다"가 아니라 "실행됐다"부터 의심.
- **구현 리뷰 반영** — Blocker·Minor 0, Major 1: tail 이 호출자 배열의 별칭이라 외부
  변이가 가능(d.ts 의 ReadonlyArray 계약 위반, 코덱스 실행 증명). 생성자에서 복사 후
  동결(Object.freeze(tail.slice()))로 수리 — 별칭·직접 push 둘 다 차단. 전용 테스트 +
  뮤테이션 ㉴(복사·동결 제거 → 빨강 1) + 48/48 재확인. 나머지 체크리스트는 전건
  CONFIRMED(경계 판정 포함: 희소 배열·undefined 원소는 "자리 존재" 보장이라 결함 아님).
- **닫힘** — 커밋·푸시는 소유자 지시 대기.

- **유예 기록** — ① Reducible 클래스: 두 번째 비공 컨테이너 등록 시 승격(계속 유예)
  ② ~~ChainRec~~ → **소유자 결정으로 편입(2026-08-18, 닫힘)**: 깊이 우선 큐(Array 와
  같은 모양 + toArray 경계), 법칙 게이트 자동 편입(갈라지는 경로 표본 추가·순회 98·
  전체 143·Algebra.all 12), 뮤테이션(깊이→너비 순서 변이 → 등가 깨짐 빨강 1) 확인,
  d.ts·docs·CHANGELOG 12개로 갱신. 같은 회차에 docs/NonEmptyList.md 「언제 쓰고,
  언제 안 쓰나」 절 신설(배열+if 와의 선 긋기, 실행 예제 — 소유자 사용성 피드백 반영).
  코덱스 구현 리뷰: Blocker·Major 0, Minor 1(예제 주석이 정적 보장을 런타임 보장처럼
  표현 — JS 는 빈 배열을 막지 못함을 실행 증명) → 계약 주체를 호출자로 명시해 정정.

## 닫힘 — MonadError: 실패를 일급으로 (2026-08-18)

- **경위** — cats 대조에서 소유자가 지목("구조가 없어서 불편한 상태"). 계획 → 코덱스
  계획 리뷰(Blocker 2: 생성자 관례 위반·checkAndSet 규칙 누락 — 그대로면 첫 인스턴스
  에서 터짐, Major 5: 비동기 관측 사각 등) → v2 반영. 비동기 관측은 독립 회차로 선행.
  [`plan/260818-monaderror.md`](./plan/260818-monaderror.md)
- **구현** — `MonadError extends Monad`(raiseError/handleError, checkAndSet 규칙 신설,
  Symbols·레지스트리·export), 인스턴스 둘: Task(rejected/catchError 재사용 — 반환 검증은
  기존 문이 fork 시점에), Either(Left/fold 유도 + 즉시 `handler must return an Either`).
  법칙 4개(잡으면 핸들러·성공 불변·중첩/재실패·실패 단락)를 **동기·비동기 두 게이트에**
  편입 — 실패의 생성·복구를 전용 법칙으로 고정한 첫 클래스. 순회 86→88 + 클래스별 잠금(2).
- **검증** — 뮤테이션 6종 전부 잡힘(성공도 잡음/성공 생성/핸들러 미호출/에러 바꿔치기/
  재실패 삼킴/반환 검증 제거), 전용 테스트 7블록(동치 대조·문안·상속), 문서
  (MonadError.md 실행 예제 3 + README 편입 + internals 근거), 타입 선언(HKT lookup),
  47/47 + 타입체크, baseline 차이 3행 전부 추가(제거 0 — v2 기대 그대로), dist 재빌드.
- **코덱스 구현 리뷰 반영(전건)** — ① handleError 가 캐리어를 검증 안 함(Chain 관례
  위반) → `arguments must be (function, 타입)` 으로 통일, 위조 캐리어 거부 테스트 추가,
  뮤테이션 ㉴ ② 관측기 "일회 정착" 겹이 실제로는 무력(첫 정착이 Promise 를 이미
  닫음) → 위반 목록 + 파일 끝 단언으로 재구현, 가짜 fork 자기검사 + 뮤테이션 ㉵
  ③ baseline·registry-api 감시 명단에 MonadError 편입(HEAD 부재는 '(없음)' 표기,
  25개로 갱신) — baseline 차이 7행 전부 추가·제거 0 ④ "실패 경로가 들어온 첫 클래스"
  문구 과장 → "전용 법칙으로 고정한 첫 클래스"로 정정(docs·CHANGELOG) + internals 의
  선언 파일 수(24, 실측 20) 는 수 자체를 제거. 남긴 것: 200ms 타임아웃의 느린 CI
  오탐 가능성(리뷰도 SPECULATION — 실측 여유 40배), handleError 는 핸들러가 미정착
  Task 를 돌려주는 것까지 막지 않음(게이트 주장은 정상 표본으로 한정, 파일 머리에 명시).
- **사고 1건** — 뮤테이션 복원에 git checkout 을 써 미커밋 구현이 지워졌다가 dist 에서
  재이식으로 복구. [`retrospect/260818-checkout-wipes-uncommitted.md`](./retrospect/260818-checkout-wipes-uncommitted.md)
- **완료조건 충족** — 리뷰 전건 반영, 47/47 + 타입체크 + baseline + dist 재빌드. 커밋 시
  미추적 4파일(tests 2·docs 1·plan 1) 포함할 것(리뷰 Blocker 1).

## 닫힘 — Task 비동기 법칙 게이트 신설 (2026-08-18)

- **경위** — MonadError 계획의 코덱스 리뷰가 부수 발견: 법칙 게이트의 Task 관측기
  (forkSync)가 동기 정착만 봐서 **비동기 Task 는 성공·실패·영구 미정착이 전부
  '(안 열림)' 한 덩어리** — 비동기면 무엇이든 "같다"(실측). 무음 정지 4건이 전부 법칙
  게이트 밖에서 잡힌 구조적 이유. 소유자 결정: MonadError 와 분리해 독립 회차로 먼저.
- **설계 통찰** — 등식만으로는 균일 미정착을 못 잡는다(양변이 같이 미정착이면 "같다").
  그래서 새 게이트(tests/task-async-laws.test.js)는 **세 겹**: 등식 + 생존성(정상
  표본은 반드시 정착) + 일회 정착. 관측기는 정착 대기 + 타임아웃 미정착 구분 + 이중
  정착 탐지.
- **판정** — 비동기 표본으로 Functor·Apply·Applicative·Chain·Monad·Alt 법칙 전부
  초록: **눈을 뜨고 봐도 기존 Task 인스턴스는 옳았다** — 지금까지의 초록이 우연이
  아니었음의 실증.
- **비대칭 영수증** — "동기는 옳고 비동기 도착이면 undefined 정착" 변이를 심으니
  **새 게이트 빨강 · 옛 게이트 초록** — 새 게이트가 옛 사각을 정확히 덮는다. 관측기
  무력화 변이는 자기검사 5건 빨강. 각각 복원 확인.
- **곁가지** — Alt 인자 관례 실측 확정(첫째 우선, 둘째 대안). staticland-laws 머리의
  "못 잡는 것"에 이 파일 포인터 추가.
- **다음** — 이 게이트 위에 MonadError 회차(계획 v2 승인 대기 중이던 것)를 얹는다.

## 닫힘 — 코덱스 5차 재공격, into 그릇 복제 수리 (2026-08-18)

- **경위** — 4차 이후 쌓인 수리·기능(start/cancel·interpreters·cons 연속·dist 계약)을
  **조합 경로로 재공격**하도록 지시. 8경로 실행: CONFIRMED-BUG 1 · SAFE 6 · 계약 밖 1.
  기록: [`review/260818-codex-audit-5.md`](./review/260818-codex-audit-5.md)
- **견딘 것(코덱스 실행 확인)** — 같은 프로그램 동시 다중 start 토큰 격리 · 핸들러의
  해석기 재진입(교착 없음) · 취소 대 라우팅실패 경주(실패 승, 오진 없음) · WriterT/StateT
  ('free')와 라우터 혼용 · 10만 map 중간 취소(50,001번째 연속 차단, 10ms)·20만 실행 8ms ·
  dist 빌더 결정성/민감도.
- **버그 1건 수리** — 4차-1 은 **새로 들어오는** `['__proto__', 값]` 만 막았고, **기존
  그릇 복제**는 여전히 `Object.assign` 이라 그릇의 own `__proto__` 가 결과의 프로토타입
  으로 둔갑했다(문서의 "내용 보존" 위반). 복제도 `defineProperty` 순회로 교체.
  테스트 선행(빨강→초록), 뮤테이션(assign 복원 → 빨강) 확인, 45/45 + baseline 차이 없음.
- ~~**보류** — `Actor.handle` 이 Promise 를 안 받아 `Free.api.run()` 결과를 그대로 못 넘긴다~~
  → **닫힘(2026-08-18, 커밋 `c8ef0e4`)**: 해석기와 같은 관용도로 맞췄다 — Task 는 그대로,
  thenable 은 `Promise.resolve` 동화, 값은 `Task.of`. 복제가 아니라 공유
  (`liftInterpreterResult` → `liftHandlerResult`, Actor 와 Free.api 해석기가 같은 몸).
  **이 줄은 2026-08-19 에 뒤늦게 닫았다** — 회차가 TODO 에 기록되지 않은 채 커밋만 나갔다.

## 닫힘 — start/cancel: Free.api 실행의 협조적 취소 (2026-08-18)

- **경위** — 파이버 논의 → CPS·defunctionalization 학습(연속=데이터, 러너=해석기,
  제어는 러너 정책) → 미니어처(깃발+if+손잡이)로 구현 합의 → 플랜 모드 승인.
  소유자 확정: `start` → `{ promise, cancel }`(단순 손잡이), 취소 식별 = 거부 +
  `cancelled === true`, `run` 유지(별칭). [`plan/260818-free-api-start.md`](./plan/260818-free-api-start.md)
- **계약(협조적)** — 취소는 호출 이후 도달하는 경계부터. 비행 중 핸들러는 마저 완료
  (결과·후속 연속 폐기), 동기 완주 프로그램은 취소할 틈 없음, 취소-실패 경주는 실패
  승(취소는 앞일을 막을 뿐 난 결과를 안 바꿈), 이중·정착 후 취소 무해.
- **리뷰 순환이 두 번 설계를 구했다** — 계획 리뷰(Blocker 2): 첫 명령이 손잡이 전에
  시작(→계약으로), 취소 후 연속 실행("결과 폐기" 거짓 → 구현으로). 구현 중 뮤테이션이
  "디스패치 직전 검사=죽은 코드"를 보였는데, **구현 리뷰(Blocker 1)가 그 판단의
  반례를 실측**: 연속 안에서 동기 cancel 이 발효되는 경로. 최종 설계는 **연속의
  걸음마다 경계 검사**(토큰 인지 runApiContinuation + 내부 표식).
- **검증 (2026-08-18)** — 테스트 선행 12블록(빨강 9+3 → 초록 0): 진행 중/연속 내부/
  chain 콜백 취소·연속 미실행·경주 계약·라우터·표식 배타·Pure 전용·정착 후 무해 등.
  뮤테이션 5종 전부 잡힘(걸음 검사·경계 판정·표식·라우터 미노출·기존 keys). 전후
  대조 불일치 0(run 하위 호환 — 코덱스도 독립 6시나리오 RUN_COMPAT_EQUAL=true).
  4차-2·4차-3 승계, 동시 start 토큰 격리 — 코덱스 CONFIRMED. 45/45 + 타입체크 +
  baseline 0/110(격자 밖 명시), 문서 예제 444(취소 절 실행 예제 포함), dist 재빌드.
- **기존 검사 의도 변경 1건** — 해석기 keys `['run']` → `['run','start']`.

## 닫힘 — GAS 실기 도그푸딩 1회차: "GAS 에서 안전하게" 실측 완료 (2026-08-17)

- **배경** — 소유자 우선순위 선언: TS 아닌 JS 우선, 타깃은 브라우저·GAS. TS 는 도그푸딩
  안 한 선제 투자였음 → 동결. 이 선언으로 기존 결정들(ES2018 상한·단일 파일·의존성 0·
  벤더링 신분증 헤더)이 GAS 원주민 제약으로 소급 정당화됨.
- **사전 실측 (주 에이전트, GAS 동형 샌드박스)** — 소스에 setTimeout/window/globalThis
  의존 0건(grep). 단일 realm·setTimeout 없는 VM 에서 min.cjs 포함 전 경로 통과(전역
  부착·Free.api·interpreters·Task 동기 fork·trampoline). 곁가지 발견: isPlainObject 가
  realm 을 탐(다른 전역에서 만든 핸들러 거부 — 브라우저 iframe 간 실재, GAS 무관, 보류).
- **실기 실측 (소유자 직접, 2026-08-17)** — ① Promise 의미론: 로그 A→D→B→C — **GAS 는
  동기 구간 종료 후 마이크로태스크를 전부 배수하고 종료한다** → Promise 기반 run 안전
  확정(동기 run 문의 필요 범위는 셀 커스텀 함수 하나로 축소, 지금은 안 만듦) ② 모의
  실행: 권한 없이 42 + 기록 순서 재현 — 어휘 경계 = mock 경계가 GAS 에서도 성립 ③ 실전
  실행: 실제 시트 B1=42, C1 시각 — 같은 프로그램이 mock/실전에서 같은 답. 빈 A1 이
  조용히 0 되는 사례로 "검증은 프로그램의 순수 단계 몫" 실전 교훈 확보.
- **완주 (2026-08-17 저녁, 소유자 실기)** — 5실험 전부 통과: ④ 셀 커스텀 함수
  `=FP_GRADE(95)`→A, `-5`→'점수 아님'(동기·권한 제한 샌드박스에서 Maybe 합성과 Nothing
  경로 성립) ⑤ trampoline(100000)=5000050000, 1초 미만. **곁가지 버그** — 샘플이 Maybe
  인스턴스 `.fold` 를 썼는데 fold 는 3인자 정적이다(샘플 중 유일하게 사전 실측을 안 한
  함수에서 정확히 버그가 남 — 영수증 규율의 반례 표본). min.cjs 동형 환경 4케이스
  실측으로 교정. 빈 셀 getValue()→''→Number('')=0 조용한 둔갑 사례도 확보(검증은 순수
  단계 몫의 실전 교재).
- **남은 것** — GAS·브라우저·CDN 사용 안내 문서화(⏸ 소유자 결정), Free 동기 run 문
  (보류 — 필요 범위가 셀 함수 하나로 축소).
- **참고** — 샘플: 스크래치패드 fun-fp-gas-sample.js (영문 식별자 + 한글 주석 관례).

## 닫힘 — 도그푸딩 리포트 2호(Free.interpreters 사용기)의 걸린 점 수리 (2026-08-17)

- **리포트 요지** (아티팩트 b1ae8a0f) — 지난 마찰 3건 반영 확인. 설계 평가: "표식이
  접두사를 이겼다"(리포터가 직접 만든 ns() 접두사 방식과 비교 — 이름 조율 0회, 접두사
  충돌 실패 모드 부재). 어휘 1→3 분할 비용 19줄. **"어휘 경계가 곧 mock 경계"** —
  시계·fs·yt-dlp 무접촉 테스트 9개 50ms. "사용처 아니다" 판단 자기 정정.
- **걸린 점 2건 → 수리 (소유자: 권고안대로)** — ① 동명 명령 상황의 `no handler` 문안이
  오진 유발 → 이름이 다른 명부에 있을 때만 원인 절 부가(`the api owning this command
  has no interpreter here — another api also defines '<name>'`), 테스트 선행(빨강 2→0).
  ② dist 버전이 내용과 함께 안 움직임 → 헤더에 `Commit:` 줄(빌더의 네 번째 순수 입력,
  dist-sync 는 Built 처럼 정규화) + **CHANGELOG 미발행 절 신설**(0.1.0 이후 파괴적
  변경 2·새 기능 6·고침 요약을 소급 기재, 이후 기능 커밋마다 항목 추가가 규율).
- **빌드 순서 규율 신설** — 해시가 내용 시점을 가리키려면 **기능 커밋 → 빌드 → dist
  커밋** 순서여야 한다(빌드를 먼저 하면 해시가 한 발 늦는다). build.js 주석에 명시.
- **검증** — free 게이트 초록(문안 정확 대조 2건), `npm test` 45/45 + 타입체크,
  헤더 4줄 실물 확인. 프리릴리즈 버전 표기는 발행 정책과 함께 소유자 몫으로 보류.

## 닫힘 — Free.interpreters: 여러 api 의 프로그램을 한 해석으로 (2026-08-17)

- **경위** — 소유자 문제 제기("각각 만든 api·프로그램의 합성"). 조사로 문제가 갈렸다:
  프로그램(AST) 합성은 이미 됨(같은 Free 모나드 — chain 이 잇는다, 실측), 막힌 것은
  실행(4차-2 의 옳은 벽). 답은 여러 명부를 아는 문지기. 소유자 결정: 이름
  `Free.interpreters`, 같은 api 중복은 라벨 거부. 플랜 모드로 계획 승인.
- **계획 리뷰가 설계를 구했다** — 코덱스 Blocker 2: 심볼 필드로 명부를 실으면
  `getOwnPropertySymbols` 로 새어 변조·위조 가능. v2: **모듈 사설 WeakMap 등록부**로
  교체(반환 객체는 `{ run }` 그대로, 등록·열람·변조 불가). Major 6 도 반영(읽기 순서
  보존, 라우터 경로 에러 재검증, 타입은 선언 전용 unique symbol 브랜드 — 구조적 {run}
  을 정적으로도 거부, 등). [`plan/260817-free-interpreters.md`](./plan/260817-free-interpreters.md)
- **검증 (2026-08-17)** — 신규 검사 9건(동명 명령 라우팅·중첩 순열·중복 위치 3종·위조
  인자·심볼 0 단언·라우터 에러/Task/then 게터 재검증), 뮤테이션 4종 전부 잡힘(이름만
  디스패치/중복 검사 제거/등록부 검증 제거/합성체 미등록), 전후 한 프로세스 대조 6건
  불일치 0(malformed 명령 포함). 구현 리뷰: **Blocker 해소 CONFIRMED**(코덱스가 Proxy·
  심볼 위조·복사 공격 + GC 2천 쌍 회수 실측), Major 1(계획의 검사 2사례 누락)은 즉시
  보충. 45/45 + 타입체크, baseline 차이 = Free 표면 `interpreters` 추가 1건뿐. 문서
  Free.md 2층 절 신설(실행 예제). dist 재빌드.

## 닫힘 — 코덱스 4차 전면 감사, 6건 전부 (2026-08-17)

번호는 코덱스 것 그대로. 6건 전부 주 에이전트가 독립 재현(2회 실측). Critical 0.
기록: [`review/260817-codex-index-audit-4.md`](./review/260817-codex-index-audit-4.md)

**소유자 결정 — 두 회차 분할** ("큰 범위 수리가 버그를 또 만들 것 같다"): 국소 5건은
즉시·건별 커밋, 구조 교체인 4차-3 은 Free.api 방식의 계획 회차(계획서→코덱스 계획
리뷰→승인→구현→전후 한 프로세스 대조)로 분리.

**1회차 닫힘 (2026-08-17)** — 5건 전부: 회귀 테스트 선행(빨강 실측)→수리→초록, 건별
커밋 5개로 분리(문제 시 개별 되돌림 가능). 4차-5 통지 스냅샷(newState 한 단어) ·
4차-6 성공 모양 검증(라벨 거부, 동기 경로 문안도 통일) · 4차-1 defineProperty ·
4차-4 정규화 키(.type 소문자와 같으면 기존 표기 유지 — 문서·별칭 불변, algebra-type·
WriterT.md 17예제 무변경 확인) · 4차-2 어휘 객체를 정체성 표식으로(거부 문안 불변 —
문서 무변경). `npm test` 45/45 + 타입체크, baseline 차이 없음, dist 재빌드.
테스트 선행이 곧 수리 되돌림 뮤테이션의 영수증이다(수리 전 빨강 = 되돌리면 빨강).

**2회차 닫힘 — [4차-3] (2026-08-17)** — 계획 회차로 진행:
[`plan/260817-free-api-continuation.md`](./plan/260817-free-api-continuation.md) v1 →
코덱스 계획 리뷰(Major 3·Minor 2 — "fns 는 공개 러너로 관측 가능" 정정, 갈래 공유
검사 신설, 구현 무관 게이트) → v2 소유자 승인 → 구현(연속을 { f, prev } cons 로,
변경 3곳). 검증: 전후 한 프로세스 대조 11건 불일치 0, 뮤테이션 3종 잡힘(복사 회귀는
concat 없이 심어도 구조 공유 단언이 잡음 — 구현 무관 게이트의 실증), 구성 1만
2.6ms/10만 25.6ms(9.8배=선형), 45/45 + baseline 차이 없음. **코덱스 구현 리뷰:
Blocker/Major 0 · Minor 1** — 실행 단계 선형성이 게이트 밖(매 단계 slice 를 심으면
전부 초록, 코덱스 실측). 후속으로 run 중 slice/concat 0회 게이트를 추가하고 코덱스의
그 변이로 빨강→복원 초록 확인. 다음 선택지: 코덱스 5차("수리들을 재공격하라").

| # | 심각도 | 무엇 | 성격 |
| --- | --- | --- | --- |
| 4차-2 | Major | 동명 명령이면 **다른 Free.api 의 해석기가 조용히 실행** — 문서 계약("다른 api 거부") 위반 | 깨끗한 버그 |
| 4차-5 | Major | Actor 구독자 재진입 시 한 통지의 result 와 state 가 서로 다른 메시지를 가리킴 | 깨끗한 버그 |
| 4차-4 | Major | WriterT 별칭이 `.type` 만 봐서 합/곱 Number 모노이드가 한 자리를 다툼 — 3차 C2(익명 모노이드 태그)와 같은 병 | 깨끗한 버그 |
| 4차-1 | Major | 객체 그릇 `into` 에 `__proto__` 키 쌍이 오면 데이터가 아니라 프로토타입을 바꿈 | 견고성 |
| 4차-6 | Minor | 비동기 Actor 가 `[result, state]` 아닌 값을 resolve 하면 uncaught + 큐 정지(무음 정지 잔당) | 견고성 |
| 4차-3 | Major | `Free.api` 깊은 map **구성**이 O(n²) — 만 번 map 에 기존 원소 5천만 복사(실측). 실행은 스택 안전하나 구성 비용이 제곱 | 성능 |

- **완료조건** — 소유자가 건별 처리 방향을 정하고, 택한 수리마다 뮤테이션 영수증이 나온다.

## 닫힘 — transduce 비커리드 정렬 + transducer.into 신설 (2026-08-17)

- **경위** — 소유자 질문 "커링 4개를 풀어야 하는 게 맞나?"에서 출발. 조사 결과 4단 커링은
  대가만 내고 이득을 못 쓰는 상태였다: 문서 호출 전부가 부분 적용 없이 4연쇄를 통째로 쓰고,
  라이브러리 자기 관례(Static Land 비커리드 — `map(f, fa)`)와도, 정전(Clojure·Ramda 4인자
  단일 호출)과도 어긋났다. push 리듀서 손글씨도 마찰. **소유자 결정: B(비커리드) + C(into).**
- **into 의미 결정** — 정전끼리 갈린다(실측): Clojure 는 그릇에 실제로 붓고(내용 보존),
  Ramda 는 그릇을 타입 증인으로만 쓴다(`R.into(['씨앗'],…)` → 씨앗 소실 — 자기 문서와
  구현이 어긋난 상태). **Clojure 의미 + 원본 불변(얕은 복사)** 채택 — 이름이 약속하는 바.
  그릇 5종: 배열(push)·문자열(+)·Set(add)·Map/객체([키,값] 쌍, 아니면 라벨 던짐).
- **검증 (2026-08-17)** — 균형 괄호 파서로 문서 23곳·테스트 7곳 기계 변환. 변이 2종 전부
  잡힘(씨앗 버림→FAIL, 원본 변이→FAIL, 복원 0). func 87 PASS, `npm test` 45/45 + 타입체크,
  docs into 절(실행 예제 — 씨앗 보존·원본 불변·라벨 거부를 게이트가 잠금). **baseline 은
  차이 0/110 인데 이는 격자가 transducer 를 안 보기 때문** — 이 변경의 영수증은 변이 쪽이다.
- **곁가지** — 최상위 `fp.into`(flipCurried(pipe) 조합자)와 이름 동거: 이름공간이 갈려
  충돌은 없으나(`fp.into` vs `fp.transducer.into`) 뜻이 달라 혼동 여지는 있다. 소유자 인지.
- **breaking** — `transduce` 시그니처. npm 발행 전(개명·exec 정렬과 같은 논리).

## 닫힘 — 도그푸딩 리포트(media-downloader)의 마찰 3건 수리 (2026-08-16)

- **경위** — 소유자가 yt-dlp CLI 를 `Free.api` 로 이행하고 리포트를 작성했다(아티팩트
  904e73df). 소득: DSL 정의부 24→8줄, 수동 next 배선 6→0곳, 구방식은 map 4천 회에서
  무음 정지·신방식은 20만 통과, 실패 처리 6종 문서대로. **"배선이 걷히니 설계 문제가
  드러났다"** — 진행바가 순수 구역에서 변이되던 것과 커서 버그를 사용자가 스스로 발견.
  `ReaderT('free')` 가 `Free.api` 와 합성됨도 확인. 리포트의 무음 정지는 이행 직전 dist
  기준이고, **현재 버전은 같은 상황을 RangeError 거부로 크게 실패시킨다**(실측 — 코덱스
  감사 2차의 runWithTask try 수리가 손으로 짠 함자도 지킨다).
- **마찰 3건 → 전부 수리 (소유자: "셋 다 하시죠")** — ① dist 헤더에 `Version:`(package.json
  semver) ② 같은 헤더에 `Changelog:` GitHub URL — 벤더링 사용자가 파일 안에서 버전과
  변경 이력 위치를 얻는다. 둘 다 `buildOutputs`/`buildTypeDeclarations` 의 순수 계약을
  지키려 **버전을 세 번째 입력**으로 넣었고, 그 덕에 dist-sync 게이트가 "버전 올리고 빌드
  잊음"도 잡게 됐다. ③ `Free.api.interpreter` 의 plain-object 거부 문안에 원인 지목 절
  추가(`(inherited handlers are not accepted)`).
- **검증 (2026-08-16)** — 변이 2종: 버전만 올리고 빌드 안 함 → dist-sync exit 1 / 문안 절
  제거 → free 게이트 FAIL 1, 복원 확인. `npm test` 45/45 + 타입체크. **곁가지 사고** —
  변이 복원 스니펫이 개수 검사 없이 첫 일치를 바꿔 절이 Setoid.Struct 에 잘못 붙었었다.
  게이트(setoid·free 동시 빨강)가 즉시 잡았고 교정했다. 교훈: 일회성 치환도 count==1
  단언을 생략하지 않는다.

## 닫힘 — Writer.exec 를 State·mtl 과 정렬, eval 신설 (2026-08-16)

- **원인** — `Writer.exec()` 가 값을 돌려줬다 — 같은 라이브러리 `State.exec`(상태 반환),
  이름의 원산지 Haskell mtl `execWriter`(로그 반환)와 정반대. Free+Reader/Writer/State
  예제를 만들던 에이전트가 로그를 기대하고 `exec()` 를 불렀다 틀린 것이 함정의 실증.
  Static Land 는 run/eval/exec 를 규정하지 않는다(명세 원문 확인) — 명세가 아니라 관례 문제.
- **결정 (소유자)** — **B1**: `exec()` 는 출력을, 신설 `eval()` 은 값을 돌려준다
  (State 의 run/eval/exec 3형제와 완전 대칭). npm 발행 전이라 breaking 비용 최소 시점.
- **검증 (2026-08-16)** — 뮤테이션: 자체 1종 + 코덱스 독립 3종(eval 교체·exec 교체·상호
  교환) 전부 잡힘. `npm test` 45/45 + 타입체크, baseline 동작 차이 0/110, dist 3종
  (ESM/CJS/min) 직접 실행 확인(코덱스). 코덱스 적대 리뷰 Critical/Major/Minor 0건. 푸시 완료.

## 닫힘 — 문서 윤문 2겹 절차, Free.md·README 2편 (2026-08-16)

- **경위** — 소유자: "문서에 AI slop 이 많다." `humanize-korean` 스킬(보수 강도) 1겹 +
  육하원칙·평서 서술 점검(직접) 1겹. 소유자가 문장 단위로 5회 교정하며 작문 원칙이 확립됨
  — ① 인지 순서·속도 설계 ② 육하원칙(주어·이유 생략 금지) ③ 비유·각색 대신 평서 기술
  서술 ④ 구체 명사는 개념 도입 후에만. 전부 메모리에 기록.
- **검증** — 코드 블록 기계 대조 무변경(Free.md 9 + README 14), 문서 예제 438개 통과,
  링크·앵커 전수 검사 0건 깨짐(GitHub 의 `{#앵커}` 렌더링 실물 확인). 셋 다 푸시 완료.
- **부수 발견** — docs/README 의존성 그래프 절만 반말체였던 것을 합니다체로 통일.

## 닫힘 — Forget 을 Profunctor 명부에 올렸다 (2026-08-15)

- **원인** — `Forget` 이 `Strong`·`Choice`·`Wander` 세 층에만 등록돼 있고 `Profunctor` 만
  비어 있었다. 인스턴스는 `promap` 을 갖고 실제로 도는데 그 층에서는 못 꺼냈다.
  **이유가 코드에도 문서에도 없었다** — `tagged` 는 없는 이유가 적혀 있는데 이쪽은 없었다.
- **소유자 판정** — *"Forget 은 Profunctor 의 하위 개념입니다. Maybe 에서 Just 가
  하위개념인 것처럼요."*
- **해결책** — 네 층에 다 등록한다. 법칙 게이트의 `Profunctor` 검사가 `x => x * 10` 이라는
  벌거벗은 함수를 하드코딩하고 있어 `Forget` 캐리어를 못 받았으므로, `Strong`/`Choice` 와
  같이 `PROFUNCTOR_KIT` 에서 캐리어와 「여는 법」을 받게 바꿨다.
- **검증** — 네 층이 같은 인스턴스를 준다. 법칙이 도는 인스턴스 76 → **77**(새로 올린 것에
  실제로 법칙이 돈다). 뮤테이션 둘(등록 제거 / kit 을 무시하고 벌거벗은 함수로 되돌림)
  전부 잡음. `npm test` 45/45 + 타입체크. `baseline` 차이 2건 = `Profunctor` 명부에
  `forget(array)`·`forget(maybe)` 생김, 없어진 것 0.
- **참고** — `docs/Profunctor.md` 「등록된 인스턴스」 표를 네 층 격자로 바꿨다.

## 닫힘 — Const · Forget 캐리어도 클래스다 (2026-08-15)

- **원인** — `Identity` 만 클래스가 되고 `Const`·`Forget` 은 객체 리터럴로 남았다. 셋 다
  `traverse` 에 넘기는 같은 자리인데 격이 달랐다.
- **소유자 판정** — *"데이터를 받는 것도 형식이 있다면 클래스를 정의하고 그 타입으로 받읍시다."*
- **해결책** — `class Const { value, _typeName }` · `class Forget { run, _typeName }`.
  태그가 모노이드마다 다르므로 **클래스는 하나이고 태그를 인스턴스가 지닌다** — `Maybe` 의
  반대 모양이다(`Just`/`Nothing` 둘이 `'Maybe'` 하나로 수렴).
- **검증** — `constructor.name` 이 `'Object'` 에서 `'Const'`·`'Forget'` 으로. optics 셋
  (`view`/`toList`/`preview`)과 `Const.ap` 그대로. 모노이드가 다르면 여전히 섞이지 않는다.
  뮤테이션 둘(각각 객체 리터럴로 되돌림) 전부 잡음. `npm test` 45/45 + 타입체크.
  **`baseline` 차이 0 — 다만 baseline 은 `constructor.name` 을 안 보므로 이 변경을 애초에
  못 본다.** 영수증은 뮤테이션 쪽이다.
- **안 한 것** — `fp.Const`·`fp.Forget` 공개 문을 만들지 않았고 심볼도 안 붙였다. 새 공개
  표면이라 별도 승인이 필요하다. 지금은 팩토리로만 닿는다.
- **참고** — `docs/internals.md#identity-const`

## 닫힘 — Identity 를 클래스로 세웠다 (2026-08-15)

- **원인** — `Identity` 를 `{ value, _typeName: 'Identity' }` 객체 리터럴로 만들고 이름만
  넣었다. 소유자 판정: *"Object의 하위타입을 만들고 타입이름을 넣으면서 값싸게 해결하려고
  한 것이 잘못된 겁니다."*
- **해결책** — `Maybe` 와 같은 급의 클래스. 심볼(`Symbols.Identity`), 공개 문(`fp.Identity`
  의 `of`/`isIdentity`), 인스턴스 메서드(`map`/`extend`/`extract`), 타입 선언.
- **검증** — `constructor.name` 이 `'Object'` 에서 `'Identity'` 로, `instanceof` 성립.
  레지스트리 다섯 인스턴스가 모두 이 클래스의 값을 낸다. `npm test` 45/45 + 타입체크.
  `dist-sync` 가 새 선언 파일이 빌드 명단에 없는 것을 잡았다 — 배포본에서 빠질 뻔했다.
- **참고** — `tests/identity.test.js`, `docs/internals.md#identity-const`

## 철회 — `Symbols.TypeName` (2026-08-15, 같은 날 삭제)

- **무엇이었나** — 값이 자기 타입 이름을 **심볼 키 아래** 적어 두게 하고 `types.of` 가
  그것만 읽게 한 기제. `_typeName` 문자열은 베낄 수 있으므로 객체 리터럴 위조를 막으려던 것.
- **왜 삭제했나** — **소유자가 동의한 구현이 아니다.** 내가 정하고 지나갔고, 소유자가
  질문한 뒤에야 성격을 설명했다. 소유자 지시: *"제가 동의하지 않은 구현으로 지금까지 많은
  비용을 냈습니다. TypeName 기능 삭제하십시오."*
- **덧붙여, 내 주장도 과했다** — "위조가 막힌다" 고 적었지만 `Symbol.for` 는 전역
  등록소라 작정하면 같은 칸을 열 수 있다(실측: 심볼까지 베낀 객체는 통과했다). 막히는 것은
  **실수로 같은 모양이 되는 경우**뿐이었다.
- **무엇을 걷었나** — `Symbols.TypeName`, `types.of` 의 심볼 분기, 데이터 타입 prototype
  9곳, `constOf`/`forgetOf`, 트랜스포머 4곳, baseline 프로브 5개, 문서 두 절.
  `index.js` 에 잔재 0. `Identity` 클래스는 승인된 것이라 남겼다.
- **남은 상태** — `types.of` 는 다시 `_typeName` 문자열을 읽는다. 문자열을 베낀 객체는
  타입 클래스 메서드를 통과한다. 이는 **원래 상태**이고 결함으로 열려 있다 — 고칠지는
  소유자 결정 사항이다.


## 닫힘 — 타입의 깊이를 정하고 튜플을 고쳤다 (2026-08-15)

- **원인** — 값의 타입을 어디까지 표현하고 검사할지가 정해져 있지 않았다. 그래서 내가
  재귀 검증(AST)을 건의했고, 소유자가 **두 겹까지**로 확정했다 — `Maybe<Array>` 이지
  `Maybe<Array<number>>` 가 아니다.
- **해결책** — `.dev/plan/260815-type-ast-proposal.md`. 재귀 검증·`extractors`·중첩 타입
  폐기. 남은 일은 컨테이너 축뿐.
- **검증** — `.type` 23종 중 규칙 위반 **0건**(이미 지켜지고 있었다). 깊이 3 은 레지스트리
  키 `maybe(maybe(array))` 하나인데 그 인스턴스의 `.type` 은 `'Maybe'` 이고 깊이는 위임이
  만든다(각 겹이 자기 층에서 거부하는 것을 실측). 튜플 길이 검사 추가 후 `npm test` 44/44,
  뮤테이션 2종(검사 제거 / `===2` 를 `>=2` 로) 전부 잡음.
- **남은 것** — `Set`·`Map`·`Triple` 을 컨테이너로 넣는 일. 필요해질 때.
- **참고** — `CLAUDE.md` 「Traps」, `tests/bifunctor.test.js`


## 닫힘 — Forget 이 자기 타입을 갖는다 (2026-08-15)

- **원인** — `Wander.Forget(m).type` 이 `'function'` 이라 `FunctionWander` 와 한 태그였다.
  `Forget<r> a b = a -> r` 이라 캐리어가 벌거벗은 함수여서 구분할 표식이 없었다.
  `.type` 게이트의 팩토리 표에 **Forget 이 아예 없었다** — 그래서 살아남았다.
- **해결책** — 캐리어를 `{ run, _typeName: 'Forget(<키>)' }` 로 감싸고 `wrap`/`unwrap` 을
  문으로 둔다(`Applicative.Const` 와 같은 모양). `wrap` 이 `Const.wrap` 을 지나므로
  `f` 가 모노이드 값을 안 내놓는 것도 같이 걸린다.
- **완료조건** — 두 인스턴스가 서로의 캐리어를 거부하고, Lens 경로에서도 `f` 가 검사된다.
- **검증** — 네 혼동 사례 전부 거부, `foldMapOf('array', prop('a'), x=>x*2, {a:3})` 가
  `6` 에서 거부로 바뀜. 뮤테이션 2종(태그를 `'function'` 으로 / `wrap` 에서 검사 제거)
  전부 잡음. `npm test` 44/44 + 타입체크. `baseline` 차이는 인스턴스 2개가 `function`
  묶음에서 `forget(array)`·`forget(maybe)` 묶음으로 이동한 것뿐, 그 외 0건.
- **곁가지** — `baseline` 의 명단에 `Strong`/`Choice`/`Wander` 가 없어 **세 레지스트리를
  통째로 안 보고 있었다.** 넣었다. `.type` 게이트의 팩토리 표에도 Forget 을 넣었다.
- **참고** — `docs/internals.md#forget-newtype`


## 닫힘 — 팩토리 네임스페이스 통일 (2026-08-14)

- **원인** — 인스턴스 팩토리 관례가 둘이었다. `Maybe.Semigroup`·`Maybe.Monoid`·
  `Maybe.Setoid`·`Maybe.Ord`·`Either.Semigroup`·`Either.Setoid` **6개**와
  `Setoid.Array`·`Ord.Array`·`Setoid.Struct`·`Applicative.Const`·`Wander.Forget` **5개**.
  5:6 이라 어느 쪽도 예외가 아니었고, **아무 게이트도 이것을 안 봤다.**
- **해결책** — 타입 클래스 쪽으로 통일. 근거 둘: (1) 팩토리가 내는 것은 `lookup` 과 같은
  인스턴스이므로 타입 클래스에 산다 — `registry-api` 가 원래 지키던 선이다.
  (2) `Semigroup.Maybe('array')` 가 `Semigroup<Maybe<Array>>` 로 **글자 순서대로** 읽힌다.
- **완료조건** — 데이터 타입에 타입클래스 이름의 멤버가 0개, 게이트가 부활을 잡는다.
- **검증** — 138곳 개명(20파일). `npm test` 44/44 + 타입체크. 뮤테이션 3종
  (별칭 부활 / 완전 되돌림 / 이름 뒤집기) **전부 잡음**. `baseline` 차이 10건은 전부
  프로브 동시 개명의 파급이고, 「데이터타입 정적 표면」 행 신설로 확인하니
  **없어진 것 6개 = 옮긴 것 6개, 엉뚱한 것 0건**.
- **곁가지** — `Semigroup.Either` 의 타입 선언이 인자 **하나**인데 런타임은 **둘**이었다.
  TS 로 쓰면 통과하고 실행하면 던지는 상태였다. 선언을 런타임에 맞췄다.
- **참고** — `.dev/retrospect/260814-factory-namespace.md`, 규칙 98·99,
  `docs/internals.md#constrained-instances`


## 현재 위치 — 2026-08-14, `main` 에 병합 완료

**목표: Static Land 명세와 실제 코드를 일치시킨다.** — 이 회차는 끝났다.

```
✅ 레지스트리 정합성
✅ Ord 를 Setoid 로            ← 이 회차의 본체
✅ 검증 장치                    ← Functor 11 + 나머지 15 클래스까지 닫음 (ChainRec·Traversable 은 제외, 아래에 이유)
✅ 남은 정리 — 전부 닫힘
```

**병합 (2026-08-14)** — `static-land-cleanup` 33 커밋을 `main` 으로 **패스트포워드**하고
`origin/main` 에 푸시했다. `main` 이력은 여전히 선형이다(머지 커밋 0개 유지).
병합 직전 게이트: `npm test` **42 파일 전부 통과 + `tsc --noEmit` 통과**.
(해시는 안 적는다 — amend·rebase 로 바뀌면 이 줄이 거짓이 된다.)

**공개 API 가 깨진 변경 셋** — 사용자에게 알려야 한다.
`Category.id` 는 이제 **불러서** 얻는다(`C.id` → `C.id()`) ·
`Filterable.lookup('either'/'task')` 는 던진다(`Either.filter`·`Task.filter` 함수는 그대로) ·
`Either.Semigroup` 은 인자 둘을 받고 `Left ⊕ Left` 를 누적한다.
`package.json` 은 `0.0.0` 이라 버전 표기는 손대지 않았다.

**다음 회차의 입력** — ~~`ChainRec` · `Traversable` · `Foldable` 자기참조~~ 전부
2026-08-15 에 닫았다(위 법칙 게이트 항목들). 남았던 구조적 한계도 닫았다(2026-08-16):
- `Validation` — 한계가 아니었다. 원소가 최대 1개라 뒤집을 순서가 없고(실측), 값 방문은
  `tests/validation.test.js` 가 고정한다.
- `Object` — **"각 타입의 테스트가 진다"가 거짓이었다.** 기존 검사가 덧셈(가환)이라 순서에
  장님이었고, 역순 뮤테이션이 어디에도 안 걸렸다(실측). `tests/foldable.test.js` 에 비가환
  순서 고정 검사(문자열 키 삽입순·정수 키 오름차순·혼합)를 넣었다 — 역순 뮤테이션이 이제
  잡히고, 법칙 게이트는 여전히 초록(자기참조 + 닻 없음, 그래서 이 검사가 존재한다).
  `npm test` 45/45. 소스 무변경 — dist·baseline 은 볼 것이 없다.

---

## ✅ 닫힘 — 2026-08-14, Optics 를 우리 조각으로 다시 세웠다

**소유자 지적** — *"이미 존재하는(함수 합성으로 구현 가능한) 함수를 자체적으로 만들었고,
이곳의 다른 함수 모듈과 다른 구현 스타일이다."* 그리고 **"이건 단순한 구현의 문제이지
전역적인 문제는 아니다"** — 에이전트가 근거 유실·게이트 부재로 틀을 넓히려던 것을 바로잡았다.
문제는 하나다: **Optics 가 이 라이브러리의 함수·타입클래스 합성으로 만들어지지 않았다.**

**두 번에 나눈다 (소유자 결정).** 1차는 새 공개 표면 없이 되는 것, 2차는 라이브러리가
조각을 내줘야 하는 것.

| 상태 | 무엇 | 새 표면 |
| --- | --- | --- |
| ✅ | [1차 — 있는 것을 안 쓰던 세 자리](#optics-1차) | 없음 |
| ✅ | [2차 — 라이브러리가 안 내주는 세 자리 + Strong/Choice/Wander](#optics-2차) | 있음 |

<h3 id="optics-1차">✅ 1차 — 있는 것을 안 쓰던 세 자리</h3>

- **원인** — 세 자리 모두 이 파일에 이미 있는 것을 안 보고 직접 썼다.

  | 자리 | 전 | 후 |
  | --- | --- | --- |
  | `functionProfunctor.wander` | `a => ({ value: p(a) })` — 캐리어를 리터럴로 | `compose2(I.of, p)` |
  | `forgetProfunctor.dimap` | `promap(f, identity, p)` — 항등을 손으로 끼움 | `Contravariant.lookup('predicate').contramap(f, p)` |
  | `Lens` | `s => [getter(s), s]` — 튜플을 리터럴로 | `s => tuple(getter(s), s)` |

- **왜 `Contravariant` 가 맞나** — Forget 은 출력을 버리므로 **첫 인자에만 반변**이다.
  그 이름이 `Contravariant` 다. `Profunctor` + 항등은 더 넓은 것을 빌려 쓴 것이다.
  실측: 전 입력에서 결과가 같다(`[3,0,-15,7.5]`).
- **완료조건** — 관측 동작이 그대로다.
- **검증 (2026-08-14)** — 수정 전후를 한 프로세스에 같이 로드해 **검사 20개 대조 → 불일치 0건**
  (Lens/Prism/Iso/Traversal, 중첩·혼합 합성, 불변성, 빈 컨테이너, 실패 경로 넷 포함).
  `npm run baseline` **diff 0줄** — 격자가 optics 를 36곳 본다.
  `tests/optics.test.js` 76개 전부 통과. `npm test` 44/44 + 타입체크.
- **부수 확인** — `dist-sync` 게이트가 "빌드를 잊었다" 로 먼저 빨개졌다. 어제 세운 것이
  처음으로 실제 상황에서 작동했다.

<h3 id="optics-2차">✅ 2차 — 계획 260814-strong-choice-wander.md 5단계 전부</h3>

- **검증 (2026-08-14) — 완료조건 여섯 중 다섯 충족, 하나는 미달**

  | # | 조건 | 결과 |
  | --- | --- | --- |
  | ① | Optics 구역에 `{ value:` 리터럴 0개, 세 P 가 레지스트리 조회 | ✅ 리터럴 0개, 조회 3곳 |
  | ② | 던지는 스텁 둘이 사라진다 | **⚠ 절반.** 등록 인스턴스에서는 사라졌으나 `review` 경로에 진단으로 남았다 |
  | ③ | `npm run baseline` 차이 0 | **⚠ 차이 8건.** 다만 **전부 추가이고 없어진 것 0개** — 새 이름·새 인스턴스뿐 |
  | ④ | `tests/optics.test.js` 를 한 줄도 안 고치고 통과 | **❌ 미달.** 3줄 고쳤다(`dimap`→`promap`) |
  | ⑤ | 새 인스턴스가 `.type`·명세 게이트에 잡히고 뮤테이션이 전부 잡힌다 | ✅ 뮤테이션 21종 |
  | ⑥ | 2026-08-11 근거와 뒤집은 이유가 `docs/internals.md#optics` 에 | ✅ |

- **④를 못 지킨 이유** — optic 이 부르는 이름을 `dimap` 에서 `promap` 으로 바꿨기 때문이다.
  등록 인스턴스의 이름이 `promap` 이고 시그니처가 같다. **계획이 이 이름 변경을 예상하지
  못했다** — 사설 딕셔너리를 등록 인스턴스로 바꾸면 이름도 그쪽을 따라가야 한다는 것을
  계획 단계에서 안 셌다. 공개 API 변경이라 커밋에 `BREAKING CHANGE` 로 적었다.
- **③의 8건** — `fst`·`snd`·`Strong`·`Choice`·`Wander` export, `identity` Extend/Comonad,
  profunctor 인스턴스 다섯. 기존 항목이 바뀐 것은 **0건**이다.

<details><summary>원래 계획 — 무엇을 하려 했나</summary>

- **원인** — 남은 셋은 **쓸 것이 없어서** 손으로 쓴 것이다. Optics 가 남의 타입 **내부
  표현**(`{ value: … }`)을 직접 읽고 쓴다. 실측:

  | 필요한 것 | 지금 | 근거 |
  | --- | --- | --- |
  | `Const` 캐리어 생성자 | **없다** | `fp.Const` 가 `undefined`. `Const(m).of([7])` 는 `{value:[]}` — **값을 버린다** |
  | `Identity` 캐리어에서 값 꺼내기 | **없다** | `identity` `Comonad` 가 없다. 지금은 `.value` 를 직접 읽는다 |
  | 튜플의 첫 원소 | **없다** | `fst`/`snd` 가 없어 `Comonad.lookup('array').extract` 를 빌려 쓴다(소스에 변명 주석) |

- **왜 미룰 수 없나** — YAGNI 가 아니다. **이미 필요해서 Optics 가 몰래 쓰고 있고**, 그
  사용이 리터럴로 위장돼 있어 아무도 감시하지 못한다. `IdentityFunctor` 의 캐리어 모양이
  바뀌면 Optics 가 조용히 깨지는데, Optics 는 레지스트리 밖이라 법칙·명세·`.type` 게이트
  셋 다 언급이 **0건**이다.
- **완료조건** — Optics 구역에 `{ value:` 리터럴이 0개이고, 관측 동작이 그대로다.
- **참고** — Strong/Choice/Wander 를 타입 클래스로 안 올린 근거는 `CLAUDE.md` 에 있었는데
  하네스 제거(`b970b96`) 때 지워졌다. **5단계에서 `docs/internals.md#optics` 로 되살렸다.**

</details>

---

## ✅ 닫힘 — `Const` 를 법칙 게이트에 넣었다 (2026-08-14)

- **소유자 판단** — *"이건 사용하는 요구에 따라 달라질 수 있습니다. 타입이 폭발하는
  지점이죠. 미리 만드는 게 아니라 요구하면 만들어주거나 사용자가 직접 만들면 됩니다.
  우리가 모든 인스턴스를 미리 만들어줄 필요는 없습니다. 하지만 **테스트를 위해 기본 타입
  몇 개만 등록하는 것은 허용**됩니다."*
- **한 일** — 라이브러리는 그대로 두고, `tests/staticland-laws.test.js` 가 자기 몫으로
  `Applicative.Const(Monoid.lookup('number'))` 하나를 부른다. **숫자 모노이드를 고른 이유**:
  기존 `Object` 표본(`{ value: 1 }`)이 그대로 유효한 상자가 된다. 배열 모노이드였다면 상자
  안이 배열이어야 해서 표본 장치 13곳을 통째로 고쳐야 했다.
- **함께 필요했던 것 둘**
  ① `OF_BY_LABEL` — `Apply` 법칙이 `OF.Object`(아무 값이나 담는 Identity 용)로 **함수를**
  Const 상자에 넣어 `concat` 에서 죽었다. Const 는 자기 `wrap` 이 그 자리다. 라벨로 거는
  이유는 `.type` 이 `'Object'` 라 Identity 와 타입으로는 못 가르기 때문이다.
  ② `MAP_IS_BLIND` — Const 의 `map` 이 아무것도 안 하는 것은 **정의**라 「표본이 공허하지
  않은지」 검사에 정당하게 걸린다. 이유와 함께 예외로 뒀고, 이유가 없으면 검사가 멈춘다.
- **검증 (2026-08-14)** — 전에는 **초록이었던** 결함(`Const.of` 를 "값을 담는" 것으로 바꾸기)을
  다시 심으니 이제 **법칙 게이트가 잡는다.** 순회 대상 Functor 11 → 12, 나머지 69 → 71.
  `npm test` 44/44 + 타입체크, `npm run baseline` 차이 0(테스트만 고쳤다).

<details><summary>원래 기록 — 무엇이 문제였나</summary>

- **경위** — `Const.of` 를 "값을 담는" 것으로 바꾸는 결함을 심었는데 **법칙 게이트가 초록**
  이었다. `tests/optics.test.js` 10개가 잡았을 뿐이다.
- **원인** — `Const` 인스턴스는 **불러야 생긴다.** 실측: 로드 직후 `Applicative.types` 에
  `const(...)` 키가 **0개**다. 법칙 게이트는 로드 시점 레지스트리를 훑으므로 애초에 볼 수가
  없다. `tests/staticland-laws.test.js` 에 `const(` 언급도 0건.
- **왜 아픈가** — `Identity` 는 로드 때 등록돼 법칙 검사를 받는데 **`Const` 만 안 받는다.**
  둘은 같은 캐리어를 쓰는 짝인데 한쪽만 감시된다. `FACTORY_CASES` 가 팩토리 산물을 명시적으로
  부르는 이유와 같은 문제다 — 그 명단에 `Const` 가 없다.
- **완료조건** — `Const` 의 `map`/`ap`/`of` 를 뒤집는 결함이 법칙 게이트에 잡힌다.
- **해결책 후보** — `staticland-laws.test.js` 의 `FACTORY_CASES` 에 `Applicative.Const('array')`
  를 넣는다. 다만 그 명단은 지금 Setoid/Ord/Semigroup 계열만 담고 있어 Applicative 법칙을
  어떻게 태울지 함께 봐야 한다.

</details>

---

## 닫힘 — `Wander`·`Traversable`·`ChainRec` 법칙 게이트 (2026-08-15)

- **원인** — 세 클래스가 "등가식만으로 부족하다"는 이유로 법칙 게이트 밖이었다
  (`Wander` 는 `KNOWN_DEVIATIONS`, 나머지 둘은 파일 머리의 「못 잡는 것」에만 기록).
  실제로 부족한 것은 **재료**였다: Identity/Const 사영, 자연변환 하나, Compose Applicative
  하나면 전부 구체식이 된다. Compose 는 `new fp.Applicative(...)` 로 테스트가 직접 만들 수
  있었다(registry 인자를 안 넘기면 레지스트리가 안 자란다) — "만들 수 없다"가 착오였다.
- **해결책** — `staticland-laws.test.js` 의 `CLASS_LAWS` 에 셋을 넣었다.
  `Traversable`: 항등(Identity)·자연성(Maybe~>Either, 변환의 of/ap 보존을 별도 검사가 실측)·
  합성(Compose(Maybe,Either)). `Wander`: 두 사영 — `wander ≡ map`(FunctionWander) ·
  `wander ≡ foldMap`(Forget, 오른쪽이 Foldable.reduce 라 traverse/reduce 어긋남도 걸린다).
  `ChainRec`: 명세 등가식(정상·퇴화·Array 는 갈라지는 걸음까지) + 동기 5만 걸음 스택 검사.
  `KNOWN_DEVIATIONS` 는 비었다.
- **곁가지 — `TaskChainRec` 이 명세의 스택 제약을 어기고 있었다.** 동기 완료를 fork 콜백
  재귀로 이어 800~2,000걸음에서 스택이 넘쳤고(임계값은 스택 상태 따라 요동), `Task.fork` 의
  catch 가 settle 뒤 예외를 버려 **reject 도 없이 조용히 영원히 안 열렸다**(실측: f 757회
  호출 후 무음 정지). 동기 완료는 반복문으로, 비동기 완료만 재귀로 돌게 고쳤다 — 비동기는
  이벤트 루프가 스택을 이미 비운 뒤라 안 쌓인다. 공개 API 불변.
- **완료조건** — `wander`·`traverse`·`chainRec` 를 뒤집는 뮤테이션이 법칙 게이트에 잡힌다.
- **검증 (2026-08-15)** — 법칙 순회 77 → **86**(ChainRec 4 + Traversable 3 + Wander 2).
  뮤테이션 **9종 전부 잡힘**, 매번 `cmp` 로 복원 확인: ① Task 재귀 복원 → 스택 제약 ②
  FunctionWander 가 p 무시 → wander≡map ③ Forget wander 가 empty 고정 → wander≡foldMap ④
  Array traverse 누적 뒤집기 → 항등 ⑤⑥ Maybe/Either traverse 가 f 무시 → **Traversable
  법칙은 양변이 같이 무너져 못 잡고 Wander 사영이 잡는다**(예측대로) ⑦ MaybeChainRec 이
  Nothing 무시 → 등가 ⑧ ArrayChainRec 큐를 너비우선으로 → 등가(갈라지는 걸음) ⑨
  `KNOWN_DEVIATIONS` 부활 → 순회 개수 86 검사와 명단 잠금 **두 겹**에 잡힘.
  `npm test` 45/45 + 타입체크. `npm run baseline` **차이 없음**(다만 baseline 격자는 깊은
  동기 걸음을 안 보므로 Task 수리의 영수증은 게이트 쪽이다). `dist/` 재빌드 완료.
- **못 덮은 것** — ∀ Applicative·∀ 자연변환은 시험으로 못 덮는다(구체 재료 하나씩).
  스택 "상수 배"는 증명이 아니라 동기 5만 걸음 통과로 갈음. Forget 검사는 합 모노이드라
  순서를 못 가른다(순서는 Traversable 항등이 traverse 층에서 고정). **Foldable 법칙의
  자기참조는 그대로 남아 있다** — reduce 순서는 여전히 각 타입의 테스트 몫이다.
- **참고** — `docs/internals.md#chainrec-stack`(예제가 실행되는 회귀 테스트),
  `tests/staticland-laws.test.js` 머리의 「못 잡는 것」.

## 닫힘 — Static Land 준수·호환성 감사, compose 방향은 의도된 이탈 (2026-08-16)

- **경위** — 소유자 질문: "Static Land 를 온전히 구현했나, 호환성 문제는." staticland-reviewer
  적대 감사 + 주 에이전트 실측 + 명세 원문 대조.
- **판정** — 거의 온전. 24개 타입클래스 전부, compose 외 모든 인자 순서 명세 일치, 딕셔너리
  상호운용 온전(메서드가 this 비의존 own 함수), of 계약 부합. **유일 이탈: `Semigroupoid.compose`
  방향이 명세와 반대**(라이브러리 우→좌=fp.compose, 명세 좌→우=fp.pipe).
- **소유자 판단** — "이건 Static Land 쪽 버그다. 같은 고민한 사람들이 있을 것." → 웹 조사:
  ① TC39 proposal-function-helpers #5 가 이 방향을 재론 ② Ramda·Sanctuary 도 사용자용 compose 는
  관례대로 우→좌로 뒤집어 제시 — **이 라이브러리 방향이 그들이 사용자에게 주는 방향과 같다**
  ③ 자동 요약이 같은 시그니처를 두 번 반대로 오독(혼란 실증).
- **결정 (소유자)** — **의도된 이탈로 확정.** 구현 무변경. `docs/internals.md#compose-direction`
  신설(근거·출처), `docs/Semigroupoid.md` 포인터. 예제 실행이 회귀 잠금.
- **참고** — [`review/260816-staticland-conformance.md`](./review/260816-staticland-conformance.md)

## 닫힘 — `Free.dsl` 구현 (2026-08-16, 계획 v2 대로)

- **경위** — 에이전트 설계 7회 실패 후 소유자가 설계를 가져왔고, 소유자 질문 셋이 최종형까지
  깎았다(payload 빌더 제거·어휘/해석기 분리). 계획을 코덱스가 리뷰(Blocker 1·Major 5), 전부
  반영한 v2 를 소유자가 승인. [`plan/260816-free-dsl.md`](./plan/260816-free-dsl.md)
- **구현** — `Free.dsl(...이름)` → api + `api.interpreter(핸들러)` → `.run`(Promise).
  연속은 함수 목록(스택 안전 — 코덱스 Major 5), null-프로토타입 + own-property(프로토타입
  이름 안전 — Major 2), run 에 own-property 가드(교차 dsl — Blocker), thenable 은
  Promise.resolve 동화. 약 55줄.
- **검증 (2026-08-16)** — 계획 완료조건 6항 전부:
  ① 함자 항등·합성(관측 대조) + map 2만 단계 스택 검사 — `tests/free.test.js`(레지스트리 밖
  산물이라 법칙 게이트 순회 밖임을 파일 머리에 명시) ② 동작 시나리오 전부(thenable 값이
  **중간에** 쓰이는 형태 — Major 4 반영), 에러 문안 8종(동기 6 `assertThrowsWith` + 비동기 2
  reject 대조) ③ **뮤테이션 7종 전부 잡힘**(map 무시/연속 재귀합성 회귀/가드 제거/승격 제거/
  대조 2종 제거/예약 제거). ⑥(상속 핸들러)은 plain-object 관문에 **포섭**됨을 실측으로 확인해
  테스트 주석에 기록 ④ 전체 테스트 45 + 타입체크 ⑤ baseline 차이 = Free 표면 `dsl` 추가
  1건뿐(스크립트로 전/후 목록 대조, 제거 0) ⑥ `docs/Free.md#dsl`(실행 예제·틀리면 던짐),
  기존 liftF 절은 Advanced 로 재배치, `docs/README.md` Free 행, 타입 선언(`DslApi` — 명령
  이름 리터럴 보존), dist 재빌드.
- **커밋·푸시** — 완료.
- **후속 — `Free.api` 로 개명 (2026-08-16, 소유자 판정)** — *"구조를 만드는 게 아니라 mock
  api 를 만들고 있어요."* 이 문의 존재 이유가 구조(Free 트리)를 숨기는 것이라, 이름은 숨긴
  것(dsl)이 아니라 보이는 것(api)을 가리켜야 한다. 에러 문안 8종(`Free.api:` 접두)·내부
  이름·타입(`FreeApi`)·테스트·문서 앵커(`#api`) 일괄 개명. baseline: Free 표면 `api` 추가 /
  `dsl` 제거, 그 외 0. 푸시 완료. 문서는 같은 날 인지 순서(1층 사용→2층 패턴→3층 내부)로
  전면 재작성 — 낡은 문서의 no-run 뒤에 숨어 있던 러너 시그니처 오류(2인자 표기, 실제는
  커리드)도 이때 걷혔다.

## 닫힘 — 코덱스 index.js 적대적 리뷰 3차, 7건 처리 (2026-08-16)

- **경위** — 소유자 지시로 영역 특정 없이 파일 전체 재검토. 7건 CONFIRMED(2회 실측). 이번은
  「모두 수리」가 자명하지 않았다 — 셋으로 갈렸다: 깨끗한 버그 2, 퇴화값 한계 3, 설계 결정 2.
  주 에이전트가 판정을 세 무리로 갈라 올리고 소유자가 갈래마다 정했다.
- **A. 깨끗한 버그 2 (수리)** — #6 `Setoid.Struct` 가 상속 필드를 own 으로 인정
  (`n in a`→`hasOwnProperty`) · #7 `once` 가 재진입 시 두 번 실행(`called=true` 를 앞으로).
- **B. 퇴화값 한계 3 (문서화, 0에서의 곱셈군과 같은 부류)** — #3 NaN 이 수 Setoid/Ord 반사성
  위반(Object.is 로 바꾸면 -0/0 이 갈려 부작용) · #4 Infinity 가 덧셈군 역원 위반 · #5 빈 배열
  Comonad extract=undefined(Array 는 NonEmpty 에서만 Comonad). `docs/internals.md` 에 실행 예제로.
- **C. 설계 결정 2 (소유자 방향대로 구현)** — C1 `Writer` 를 monoid 팩토리로
  (`Applicative.Writer`·`Monad.Writer`, of 재설계 — 등록 array 인스턴스는 유지) · C2 `Const`·
  `Forget` 의 익명 monoid 에 카운터 고유 태그(트랜스포머 방식). **C1 은 내 2차 수리 ③이
  드러낸 것** — 다른 monoid 거부가 등록 Writer 의 array 고정 of 와 충돌.
- **검증 (2026-08-16)** — 뮤테이션 5종(A 2·C1 1·C2 2) 전부 잡힘. `npm test` 45/45 + 타입체크 +
  docs 433개. `baseline` 차이 1건 = Writer 팩토리 추가뿐(없어진 것 0). dist 재빌드.
- **참고** — [`review/260816-codex-index-audit-3.md`](./review/260816-codex-index-audit-3.md)

## 닫힘 — 코덱스 index.js 적대적 리뷰 2차, 새 결함 5건 전부 수리 (2026-08-16)

- **경위** — 1차 수리 여섯 직후 그 수리들을 재공격하도록 다시 걸었다(중간에 프로토타입 공격
  어휘로 코덱스가 오탐 거부 → 어휘 빼고 재요청해 완주). **1차 수리 여섯은 견뎠고**(별칭 가드
  의심은 REFUTED), 새 결함 5건: HIGH 2 · MEDIUM 1 · LOW 2, 전부 CONFIRMED(2회 실측).
  **소유자 결정: 모두 수리.**
- **결함·수리** — ① Actor 비동기 구독자 예외 → actor 영구 정지(Task 무음정지 계열): 정착·
  큐진행을 통지 앞으로 ② `Free.runWithTask` 후속 runner 예외 → Promise 영구 pending: step
  을 try 로 감쌈 ③ `Setoid.Struct` 캐시 키 충돌(구분자 이스케이프 없음): JSON 키 ④ `extra.path`
  상속 프로퍼티 통과: hasOwnProperty ⑤ `transducer.map`/`filter` 지연 검증: 생성 시 검사.
- **검증 (2026-08-16)** — 유효 경로 불변: `npm test` 45/45 + 타입체크 + baseline 차이 없음.
  회귀 검사 5건, **수리 되돌림 뮤테이션 5종 전부 잡힘**, 복원 확인. dist 재빌드.
- **참고** — [`review/260816-codex-index-audit-2.md`](./review/260816-codex-index-audit-2.md)

## 닫힘 — 코덱스 index.js 적대적 리뷰 6건, 전부 수리 (2026-08-16)

- **경위** — 소유자 지시로 코덱스가 `index.js` 전체를 적대적으로 검토했다. Critical 0 ·
  **Major 5 · Minor 1, 전부 CONFIRMED** — 코덱스의 재현 여섯을 주 에이전트가 독립으로
  전부 다시 돌려 확인했다. 번호는 코덱스 것 그대로. **소유자 결정: 여섯 전부 수리.**
- **수리 내용** — ① `Task.catchError`: 핸들러의 예외는 그 에러로, 비Task 반환은 라벨 있는
  TypeError 로 reject(전에는 영원히 미정착) ② 트랜스포머: 같은 alias 재등록을 라벨 있는
  에러로 거부 + 캐시 키를 **정규화된 모나드**로 바꿔 `StateT('maybe')` 와
  `StateT(Monad.lookup('maybe'))` 가 같은 것을 돌려준다(전에는 두 문이 서로를 덮었다)
  ③ `Validation.ap`·`Writer.ap/chain`: 모노이드 인스턴스가 다르면 거부(전에는 왼쪽을
  조용히 채택 — 순서 따라 5/6) ④ `resolver` 를 자기 소유 키로 좁힘 —
  `lookup('constructor')` 가 `unsupported key` 로, 팩토리 안쪽 해석도 같이 닫힘
  ⑤ `fromPromise`: `Promise.resolve` 동화로 then 만 가진 thenable 정상 처리
  ⑥ `showValue`: 사용자 toString 도 보호막 안으로(`[unprintable]`).
- **검증 (2026-08-16)** — 결함 재현 여섯이 수리 전 전부 재현되고(2회 실측: 코덱스 + 주
  에이전트) 수리 후 전부 고쳐진 출력. 유효 경로 불변의 영수증: `npm test` **45/45** +
  타입체크(기존 검사 전부 초록) + `npm run baseline` **차이 없음**. 회귀 고정: 새 검사
  8건(task 3 · registry 1 · statet 2 · writer 1 · validation 1)과 docs 예제 1줄 —
  각각이 수리를 되돌리면 빨개지는 자리다. `dist/` 재빌드.
- **덤** — `WriterT` 캐시 저장부가 낡은 키(M)를 쓰는 것을 수리 중 발견해 같이 맞췄다
  (안 맞추면 캐시가 어긋난다).
- **참고** — [`review/260816-codex-index-audit.md`](./review/260816-codex-index-audit.md)

## 닫힘 — 합성 감사, A 목록 적용 (2026-08-15)

- **경위** — 소유자 요청으로 "합성으로 되는데 개별 구현한 자리" 를 전수 조사했다(3,337줄).
  결과는 A. 확실한 후보 12건(약 27곳) · B. 스타일 패밀리 3건 · C. 그대로가 맞는 자리.
- **결정 (2026-08-15, 소유자)** — *"일단 A"*. B 는 셋 다 같은 날 결정이 났다:
  ~~Kleisli Semigroupoid 3형제~~(승인·적용, 아래 B2),
  ~~Maybe/Either.pipe 중복~~(승인·적용, 아래 B3),
  **튜플 리터럴 통일(B1)은 안 한다** — 아래.
- **B1 기각 (2026-08-15, 소유자)** — *"Tuple 의 정의가 배열과 같다면 굳이 재정의할 필요는
  없을 것 같아요."* 실측이 근거다: `tuple` 은 `(...args) => args` 라 길이 제한도 태그도
  없고(`tuple(1,2,3)` 통과), 쌍임을 강제하는 자리는 소비 측의 `TupleBifunctor.bimap`
  (`=== 2` 검사) 하나뿐이다. 리터럴을 `tuple()` 로 바꿔도 울타리가 0이므로 개명일 뿐이다.
  **Lens 가 특수했던 이유** — optics 는 남의 타입(Strong 의 `first` 가 먹는 쌍)과 합성되는
  경로라 "라이브러리 조각으로 세운다"는 그 회차의 목표에 묶여 있었다. 자기 표현을 자기가
  만드는 `State`/`Writer` 에는 그 근거가 없다. `snd` 가 "둘째"가 아니라 "마지막"이라는
  사실도 이때 확인했다(쌍에서는 같다, 소스 주석 `index.js` fst/snd 자리에 이미 있음).
- **B3 적용 (2026-08-15)** — **뼈대는 소유자가 직접 설계했다**: `pipeWhile(predicate)` —
  predicate 가 참인 동안만 잇는 범용 pipe. 성공 판별자는 새로 안 짰다 — `Maybe.isJust`·
  `Either.isRight` 정적 함수가 "타입이 맞고 성공인가"를 이미 한 몸에 담고 있어 그대로 재료가
  된다. 첫 인자 검사는 각 문에 남겨 기존 에러 메시지를 글자 그대로 보존했다.
  **소유자 결정: `fp.pipeWhile` 로 공개** — export·타입 선언 3곳·`tests/func.test.js` 3건·
  `docs/Maybe.md` `#pipewhile` 절(틀리면 던지는 예제)·`docs/Either.md` 참조를 함께 냈다.
- **B3 검증 (2026-08-15)** — 전후 한 프로세스 대조 **9건 전부 동일**(성공 사슬·중간
  Nothing/Left 단락·상자 아닌 반환 통과·첫 인자 오류 메시지 글자·빈 함수 목록).
  가지 뒤집기 뮤테이션 → `func`·`docs-examples` 둘 다 잡음. `npm test` 45/45 + 타입체크.
  `baseline` 차이 1건 = 최상위 export 에 `pipeWhile` **추가**뿐, 없어진 것 0. dist 재빌드.
- **B2 적용 (2026-08-15, 소유자: "합쳐볼까요")** — 셋의 같은 몸을 `kleisliCompose` 하나로.
  짝 Chain 이 자기보다 늦게 등록되므로 **조회는 호출 시점**이어야 한다 — 주석의 이 주장을
  뮤테이션(즉시 조회로 변경 → `semigroupoid.test.js` 가 잡음)으로 증명했다. 합성 방향
  뒤집기 뮤테이션도 같은 파일이 잡는다(법칙 게이트는 못 잡는다 — 뒤집힌 합성도 결합법칙은
  성립하는 반대 범주다. 방향은 각 타입 테스트 몫). 전후 한 프로세스 대조 5건(방향·퇴화·
  단락·거부·id 법칙) 전부 동일. `npm test` 45/45, baseline 차이 없음, dist 재빌드.
- **`chainOf` 검사 (2026-08-15, 소유자 지적 후 승인)** — `f`·`g` 는 클래스 게이트가 이미
  검사하므로(실측) 헬퍼의 빈틈은 `chainOf` 뿐이었다. 둘을 막았다: thunk 가 함수가 아니면
  **로드 시점**에 `Argument must be a function: kleisliCompose`, thunk 가 빈 것을 돌려주면
  호출 시점에 `kleisliCompose: chainOf() must return a Chain`(전에는 벌거벗은
  `Cannot read properties of undefined`). 뮤테이션 둘 다 실측, 정상 경로 5건 동일 유지.
- **적용** — A 전부(23개 치환): `identity` 7곳 + first/xor 2곳, `fold` 6곳,
  `fst`/`snd` 5곳, `compose2`/`compose` 2곳, 에타 2곳(Prism `Either.Left`·`Reader.asks`),
  `Validation.collect` 의 `lift` 재구현 제거.
- **검증 (2026-08-15)** — ① 사전에 합성형과 원형의 동등을 실측 22건 대조(불일치 0) ②
  적용 후 **HEAD 와 수정본을 한 프로세스에 같이 로드해 33건 대조** — 실패 경로 포함
  (extract 비배열, contramap 비함수, Prism 빗나감, collect 0인자, 트랜스포머 run/eval/exec).
  **32건 동일, 차이 1건은 의도된 개선**: `Reader.asks(비함수)` 가 실행 시점의 벌거벗은
  에러에서 생성 시점의 라벨 있는 에러로(생성자 검사가 이미 있었다 — 감사 문서에 예고됨).
  ③ `npm test` 45/45 + 타입체크, `npm run baseline` **차이 없음**, `dist/` 재빌드.
- **참고** — [`review/260815-composition-audit.md`](./review/260815-composition-audit.md)

## 닫힘 — `Foldable` 의 순서를 `traverse` 에 잇는다 (2026-08-15)

- **원인** — Foldable 명세 법칙은 reduce 를 reduce 로 정의하는 자기참조라, `reduce` 순회
  순서가 통째로 뒤집혀도 양변이 같이 뒤집혀 초록이었다(실측으로 확인된 기록이 있었다).
- **해결책** — Traversable 항등 법칙이 traverse 의 방문 순서를 고정하므로, 그것을 거울 밖
  기준으로 쓴다: `reduce` 가 원소를 만나는 순서와 `traverse` 가 만나는 순서를 대조한다.
  수집기는 Const(array) 동형인데 레지스트리에 안 올리려고 테스트가 직접 만든다.
- **완료조건** — reduce 순서를 뒤집는 뮤테이션이 이 게이트에 잡힌다.
- **검증 (2026-08-15)** — 뮤테이션 2종 전부 잡힘: ① `ArrayFoldable.reduce` 역순(**전에는
  이 게이트가 초록으로 통과시키던 그 결함**) → `방문 순서가 traverse 와 다르다` ②
  `MaybeFoldable.reduce` 가 값 무시 → 같은 검사 + Wander foldMap 이중으로. 매번 `cmp` 복원.
  `npm test` 45/45 + 타입체크. 소스 무변경(테스트만) — baseline 은 안 돌렸다(볼 것이 없다).
- **한계** — `Object`·`Validation` 은 Traversable 이 없어 대조 불가. 순서는 여전히
  각 타입의 테스트 몫이다(파일 머리 「못 잡는 것」에 기록).

## 닫힘 — `TaskChainRec` 수리, 코덱스 리뷰 후 승인 (2026-08-15)

- **경위** — 위 게이트 작업 중 결함을 발견하고 **동의 없이 고쳤다.** 소유자 원칙: *"제 동의
  없이 고치면 삭제됩니다."* 소유자 지시로 코덱스에게 그 부분만 적대적 리뷰를 받았다.
- **코덱스 판정 (2026-08-15, 세션 01a003bc-70a5)** — 주장 넷 중 둘 확정, 둘 반박.
  - **결함은 실재 (CONFIRMED ×2)** — 옛 구현은 스택 크기에 따라 실패 지점이 이동
    (`--stack_size=128/512/2048` → 137/820/2001걸음, 기본 스택 1659걸음에서 무음 정지).
    RangeError 가 settle 된 가드 안에서 잡혀 밖으로 안 나오는 것도 계측으로 확인.
  - **수리의 일곱 공격 지점 전부 안전 (4a~4g CONFIRMED)** — 늦은 콜백·이중 콜백·동기 거부·
    resolve 가 던짐·동기 done·비동기 재진입(동시 활성 1)·메모리(GC 후 heap 안정).
  - **"관측 동작 전부 보존" 은 반박 (REFUTED)** — 두 차이가 실재한다.
    ① **Major**: 걸음의 computation 이 `resolve(...)` **뒤에** 실행하는 코드의 순서.
    옛: 전체 사슬이 끝난 뒤 거꾸로 실행(f0,before0,f1,…,after1,after0) /
    새: 다음 걸음 전에 바로 실행(f0,before0,after0,f1,…). 주 에이전트 판단: 그 "나중에
    실행하려고 프레임을 살려 두는 것"이 곧 스택 누적이라, **어떤 스택 안전 구현도 이 순서는
    못 지킨다** — 수리의 부작용이 아니라 결함의 다른 얼굴이다.
    ② **Minor**: 규격 밖 태그(`{tag:'weird'}`) 처리 방향이 반대가 됐다. 옛: next 아니면
    종료(99 로 resolve) / 새: done 아니면 계속(무한 반복 위험). 옛 방향으로 맞추는 것은
    한 줄이다(`tag !== 'next'` 면 종료).
- **선택지** — (가) 유지 + 순서 차이를 문서에 (나) 유지 + ② 한 줄 정렬 + 문서 (다) 전부
  되돌리고 명세 미준수 명단 + ⏸. 주 에이전트 권고: (나).
- **결정 (2026-08-15, 소유자)** — **(나) 유지 + 한 줄 정렬.** 수리는 승인됐다.
- **검증 (2026-08-15)** — 규격 밖 태그를 옛 방향(종료)으로 정렬: 코덱스의 옛 구현 실측
  (99 / f 1회)과 새 구현이 정확히 일치. 순서 차이 ①과 태그 처리 둘 다
  `docs/internals.md#chainrec-stack` 에 **틀리면 던지는 예제**로 박았다 — 정렬을 되돌리는
  뮤테이션 → 문서 게이트가 잡음(`internals.md example 31`), 복원 확인. `npm test` 45/45 +
  타입체크, `npm run baseline` 차이 없음, `dist/` 재빌드.
- **완료조건** — 소유자가 셋 중 하나를 고르고, 고른 길의 검증(뮤테이션 포함)이 끝난다. → **닫힘**

---

## ✅ 닫힘 — 버그: `plus(...)` 키가 타입이 아니었다 (2026-08-14)

- **소유자 판정** — *"`plus(maybe)` 는 `Plus<Maybe>` 가 아니면 잘못 만들어진 겁니다."*
  이어서 — *"타입 정의가 잘못된 것이라면 버그입니다. 그런 기능(출신 기록)을 타입으로
  인정할 수 없습니다."* 그리고 — *"제가 승인을 했지만 당신이 저에게 제대로 설명하지 않고
  제 의도와 다르게 만들었으니 비용이 많이 들어도 반드시 바꿔야 합니다."*
- **무엇이 버그였나** — 이 라이브러리에서 `f(x)` 는 `F<X>` 를 뜻한다. 그런데
  `Monoid.lookup('plus(maybe)')` 는 **`Plus` 가 아니라 `Monoid` 를 돌려줬고**, `Plus` 레지스트리에는
  그 키가 아예 없었다(실측). 진짜 `Plus<Maybe>` 의 키는 그냥 `'maybe'` 였다. 괄호 안이
  원소가 아니라 **출신**(어디서 유도했는지)이었다.
- **덤으로 드러난 중복** — `plus(array)` 는 `ArrayMonoid` 와 **동작이 같았다**(실측:
  `concat([1],[2])` 둘 다 `[1,2]`, `empty()` 둘 다 `[]`). 같은 연산이 두 이름으로 등록돼 있었다.
- **고친 것** — 유도본의 키를 **그 타입의 이름 그대로** 쓴다. 그리고 **그 타입에 이미 Monoid 가
  있으면 유도하지 않는다** — `registerAs` 가 조용히 덮으므로 막지 않으면 `ArrayMonoid` 가 사라진다.

  | 지금 | 전 |
  | --- | --- |
  | `Monoid.lookup('maybe')` | `plus(maybe)` |
  | `Semigroup.lookup('maybe')` | `plus(maybe)` |
  | — (등록 안 함, `ArrayMonoid` 가 그 자리) | `plus(array)` |

- **비용** — 약 48곳. `index.js` 3 · 테스트 18 · 문서 23 · `.d.ts` 4. 되돌릴 필요가 없었다.
- **검증 (2026-08-14)** — 뮤테이션 셋 전부 잡힘: 옛 키를 되살림 / `Monoid` 쪽 보호 제거
  (`ArrayMonoid` 를 덮는다) / `Semigroup` 쪽 보호 제거.
  인스턴스 133 → **131**(중복 둘 제거), 법칙 순회 `Semigroup` 14 → 13 · `Monoid` 12 → 11.
  `npm test` 44/44 + 타입체크. `baseline` 차이 11건 — 전부 이 키 변경의 파급이고
  (`const(plus(maybe))` → `const(maybe)` 포함) 엉뚱한 곳은 0건.
- **게이트가 못 잡은 자리 하나** — `types/data/builtins.d.ts` 와 타입 테스트에 옛 키가
  남아 있었다. `npm test` 는 초록이었고 **`tsc` 가 잡았다.** 런타임 게이트만으로는
  타입 선언의 드리프트를 못 본다.

---

## ⬜ 다음에 볼 것 — 사용성 (2026-08-14 사용 후기)

**아직 시작하지 않았다. 소유자가 "수정할 게 많으니 그 후에" 로 미뤘다 (2026-08-14).**

출처는 에이전트가 `dist/` 를 소비자처럼 불러 흔한 작업 넷을 짜 본 기록이다. 만드는 쪽이
아니라 **쓰는 쪽**에서 나온 것이라 번호를 `사용-N` 으로 따로 둔다. 넷 중 셋은 첫 시도에
돌았고 렌즈에서 걸렸다.

**여기서 나온 것은 정확성 문제가 아니다.** 라이브러리 내부 규율(법칙 게이트 5개, 실행되는
문서 예제 409개)은 이미 대부분의 배포된 FP 라이브러리보다 엄격하다. 아래는 전부
**도달 가능성** 문제다 — 잘 만든 것이 남에게 닿지 않는다.

| 상태 | # | 무엇 | 왜 아픈가 |
| --- | --- | --- | --- |
| ✅ | 사용-1 | [`Optics.prop` 신설](#사용-1) | 닫힘 |
| ✅ | 사용-2 | [배포 메타데이터 + MIT + README](#사용-2) | 닫힘 — 발행만 남았다 |
| ✅ | 사용-3 | [`lookup` / `of` 구분이 첫 화면에 없다](#사용-3) | 닫힘 (2026-08-15) |
| ✅ | 사용-4 | [`Maybe`/`Either` 의 출력이 안 읽힌다](#사용-4) | 닫힘 (2026-08-15) |

<h3 id="사용-1">✅ [사용-1] <code>Optics.prop</code> 신설</h3>

- **원인** — `Optics.Lens` 는 `(getter, setter)` 를 받는다. 그런데 처음 쓰는 사람이 가장
  자연스럽게 쓰는 것은 `Optics.Lens('address')` 다. 실측: `Lens: getter must be a function`
  으로 던진다. 에러 메시지는 정확하지만, 그 다음에 사용자가 하는 일은 정해져 있다 —
  `const prop = k => Optics.Lens(o => o[k], (v, o) => ({ ...o, [k]: v }));` 를 직접 쓴다.
- **왜 지금 없나** — `Optics` 는 profunctor 인코딩으로 옮기면서 **구조**를 갖추는 데 집중했고
  편의 함수는 안 넣었다. 구조는 옳다 — 이건 그 위에 얹는 한 줄이다.
- **해결책** — `Optics.prop(key)` 를 내보낸다. 이름은 `prop`/`at`/`key` 중 소유자가 정한다.
  배열 인덱스용(`Optics.index(i)`)까지 갈지는 별건.
- **완료조건** — `Optics.compose(Optics.prop('address'), Optics.prop('city'))` 가 읽기·수정·
  원본 보존 셋을 만족하고, **`docs/Optics.md` 의 첫 예제가 그것으로 시작한다.** 문서 예제는
  실행되므로 그것이 곧 회귀 테스트다.
- **검증 (2026-08-14)** — `compose(prop('address'), prop('city'))` 로 읽기·수정·원본 보존이
  된다. **배열 인덱스도 받는다** — 복사가 자기 모양을 지켜서 배열은 배열로 남고, 그래야 뒤에
  오는 순회 optic 과 합성된다(`compose(prop('xs'), traversed('array'))` 실측).
  뮤테이션 셋 전부 잡힘: 배열 복사를 객체로 / 원본을 직접 고침 / 키 검증 제거.
  `docs/Optics.md` 에 절을 더했고 예제가 실행된다(413 → 415).
  `npm run baseline` 차이 0, `npm test` 44/44.
- **참고** — 규칙 「'어렵다' 를 숫자로 바꿔라 — 첫 실행 예제까지의 거리」
  ([`retrospect/260811-77313b-1-optics-docs.md`](./retrospect/260811-77313b-1-optics-docs.md))

<h3 id="사용-2">✅ [사용-2] 배포 메타데이터</h3>

- **원인** — 라이브러리로 쓰이는 것을 아직 목표로 두지 않았다. 그 결과 `package.json` 이
  개발용 상태 그대로다.
- **실측 (2026-08-14)**

  | 없는 것 | 무슨 일이 생기나 |
  | --- | --- |
  | `version: "0.0.0"` | **고정할 버전이 없다.** 오늘만 파괴적 변경 셋을 내보냈다 |
  | `CHANGELOG` | 무엇이 깨졌는지 커밋 메시지를 뒤져야 안다 |
  | `LICENSE` | 회사에서 못 쓴다. 법무가 막는다 |
  | `files` | `npm publish` 하면 `.dev/` 11,705줄과 테스트가 딸려 간다 |
  | `exports` | `main`/`module` 만 있어 최신 번들러가 구식 경로를 탄다 |

- **왜 에이전트가 못 정하나** — 버전을 `0.1.0` 으로 시작할지 `1.0.0` 으로 갈지, 라이선스를
  무엇으로 할지는 **소유자의 결정**이다. 파괴적 변경을 이미 내보냈으므로 첫 번호가 곧
  "여기서부터 약속한다" 는 선언이 된다.
- **완료조건** — `npm pack --dry-run` 산출물에 `dist/`·`README`·`LICENSE` 만 들어 있고,
  `node -e "require('fun-fp-js')"` 가 설치본에서 동작한다.
- **결정 (2026-08-14, 소유자)** — **`0.1.0`**. `1.0.0` 은 에이전트가 근거를 대고 소유자가
  승인해야 한다고 정했고, 에이전트가 **지금은 권할 수 없다**고 답했다 — 사흘에 파괴적 변경
  일곱 번, 그 대부분이 새 게이트가 찾은 것이라 감시 없는 곳(`ChainRec`·`Traversable`·
  `Wander`)에서 더 나올 것으로 본다. `1.0.0` 조건 넷은 `CHANGELOG.md` 에 적었다.
- **검증 (2026-08-14)** — `version` `0.1.0` · `exports`(types→import→require 순) ·
  `files` · `sideEffects: false` · `CHANGELOG.md` 신설.
  배포물이 **260개 2.23MB → 6개 507KB** 로 줄었다(`.dev` 109개, `tests` 48개, `.idea` 5개가
  나가고 있었다). 실제로 묶어 **딴 디렉터리에 설치해** 확인했다 — ESM `import` 와 CJS
  `require` 둘 다 동작하고, `exports` 의 `types` 경로로 TypeScript 도 해석된다
  (`Just<number>` 에 문자열 함수를 넘기면 컴파일 오류가 난다).
- **LICENSE (2026-08-14, 소유자)** — **MIT**. `LICENSE` 파일과 `package.json` 의
  `license`·`author`·`repository`·`homepage`·`bugs`·`description`·`keywords` 를 채웠다.
- **덤으로 찾은 것 — 루트 `README.md` 가 `# TODO` 한 줄이었다.** `files` 에 들어 있어
  **npm 패키지의 첫 화면**이 그것이 될 뻔했다. 이틀 전 사용성 후기에서 못 잡았다 —
  그때 본 것은 `docs/README.md` 였다. 다시 썼고, **문서 예제 검사기를 루트까지 넓혀** 이제
  README 예제도 실행된다(415 → 417). 깨뜨려 보니 빌드가 멈춘다.
- **"용량이 작다" 는 주장에 숫자를 붙였다** — npm 레지스트리 실측. `sanctuary` 가 우리보다
  작다는 것도 그대로 적었다(다만 의존성 7개를 끌고 온다).
- **발행은 소유자가 한다.** `npm publish` 는 계정 인증이 필요하다(`npm whoami` → E401).
  에이전트는 포장까지만 한다.
- **참고** — 오늘 낸 파괴적 변경 셋은 위 「현재 위치」에 적혀 있다. 첫 CHANGELOG 의 재료다.

<h3 id="사용-3">✅ [사용-3] <code>lookup</code> / <code>of</code> 구분이 첫 화면에 없다</h3>

- **검증 (2026-08-15)** — `docs/README.md` 첫 화면(학습 순서 앞)에 「먼저 이것부터 —
  lookup 과 of」 절과 표를 넣었다. 예제가 실행된다: lookup 으로 꺼낸 도구 / of 로 넣은 값 /
  꺼낸 인스턴스의 of / **반대로 부르면 TypeError** 까지 네 경우. `npm test` 45/45.
  소유자 지시 (2026-08-15): "1번 지금 합시다."

- **원인** — `lookup(key)` 는 레지스트리에서 인스턴스를 꺼내고, `of(value)` 는 값을 들어올린다.
  **이 구분이 `CLAUDE.md` 의 「Traps」에 적혀 있다는 것 자체가 신호다** — 만드는 쪽도
  헷갈린다면 쓰는 쪽은 반드시 헷갈린다. `docs/README.md` 첫 화면은 학습 순서 목록이라
  이 구분이 없다.
- **해결책** — `docs/README.md` 앞쪽에 표 하나. 실행되는 예제를 붙이면 회귀 테스트가 된다.
- **완료조건** — 처음 읽는 사람이 「어느 것을 부를 것인가」를 문서 첫 화면에서 답할 수 있다
  (소유자 판단). 표의 예제가 `docs-examples.test.js` 에서 돈다.

<h3 id="사용-4">✅ [사용-4] <code>Maybe</code>/<code>Either</code> 의 출력이 안 읽힌다</h3>

- **검증 (2026-08-15, 소유자 동의: "2번 동의합니다")** — `Just`/`Nothing`/`Left`/`Right` 에
  `toString` 만 더했다(생성자 모양 표기: `Just(1)`·`Nothing`·`Left("e")`·중첩은
  `Right(Just(2))`). JSON·`_typeName` 불변 — **`npm run baseline` 차이 0** 이 그 영수증.
  `docs/Maybe.md`·`docs/Either.md` 의 `#tostring` 절 예제가 틀리면 던지는 형태로 실행된다
  (표기 위조 뮤테이션 → 두 문서 다 잡음, 복원 후 426개 초록). `npm test` 45/45 + 타입체크.

- **원인** — 실측: `console.log(JSON.stringify(Maybe.Nothing()))` 이 `{"_typeName":"Maybe"}` 다.
  `Just(1)` 과 `Nothing()` 이 한눈에 안 갈린다.
- **실측 (2026-08-14) — `_typeName` 은 건드리면 안 된다.** 표시용 필드가 아니라
  [`index.js:60`](./../index.js#L60) 의 `types.of` 가 **타입 태그로 읽는 값**이다
  (`if (a._typeName !== undefined) return a._typeName;`). 17곳에서 설정된다. 이름을 바꾸거나
  숨기면 타입 판정이 통째로 깨진다.
- **해결책** — 따라서 표현만 더한다. `toString` 은 지금 없다(실측: `String(Just(1))` 이
  `[object Object]`). 붙일 자리가 비어 있으므로 기존 동작을 건드리지 않는다.
  Node 의 `util.inspect.custom` 까지 갈지는 별건 — 그것은 Node 전용이라 브라우저에서 안 돈다.
- **완료조건** — `Just(1)` 과 `Nothing()` 이 출력에서 갈리고, **`npm run baseline` 차이 0**
  (`_typeName` 을 안 건드렸다는 증거가 이것이다).

---

## ✅ 닫힘 — 2026-08-14, ES 상한 (커밋·푸시 완료)

`main` 병합 뒤 소유자가 `index.js` 의 `?.`·`??` 를 보고 시작됐다. 폴리필이 있는데 문법을
쓰면 그 폴리필이 무의미해진다 — 문법을 모르는 런타임은 파싱에서 죽어 폴리필이 실행되지도
않는다. **소유자 결정 (2026-08-14): 상한은 ES2018.** 기준 런타임은 Google Apps Script다
(배포 목적지가 아니라 참고 기준).

| 상태 | 무엇 |
| --- | --- |
| ✅ | [`?.`·`??`·`??=` 7곳 제거](#es-문법제거) |
| ✅ | [ES2018 상한 게이트 신설](#es-게이트) |
| ✅ | [폴리필 넷 중 둘을 뺐다 — 상한 아래는 검사가 무의미](#es-폴리필) |
| ✅ | 근거를 `docs/internals.md#es-ceiling` 에, 규칙을 `CLAUDE.md` 에 |
| ✅ | [`dist/` 재빌드](#es-dist) |
| ✅ | [`dist/` 를 소스와 묶는 게이트 — 낡은 산출물을 이제 기계가 막는다](#dist-sync) |
| ✅ | [`tests/`·빌드 스크립트도 상한을 지킨다 — 소유자: 건다](#es-tests) |
| ✅ | [`dist/fun-fp.d.ts` 와 선언 파일 명단도 묶었다](#dts-sync) |

<h3 id="es-문법제거">✅ <code>?.</code>·<code>??</code>·<code>??=</code> 7곳 제거</h3>

- **완료조건** — 잔여 0건이고 관측 가능한 동작이 그대로다.
- **검증 (2026-08-14)** — `grep` 잔여 **0건**, `node --check` 통과. 동작 동일성은 셋으로 받았다:
  ① **수정 전후를 한 프로세스에 같이 로드해** 검사 13개 대조 → **불일치 0건**
  (`git show HEAD:index.js` 로 원본을 꺼냄. `Object.create(null)`·없는 타입·빈 문자열 키·
  잘못된 인자 같은 실패 경로 포함) ② `npm run baseline` 출력 파일 `diff` → **0줄**
  ③ `npm test` **43/43 + 타입체크** 통과.
- **주의** — `??` 를 `||` 로 바꾸지 않았다. `||` 는 `0`·`''`·`false` 도 넘긴다.
  `undefined`/`null` 만 검사하는 형태로 옮겼다.

<h3 id="es-게이트">✅ ES2018 상한 게이트 신설</h3>

- **원인** — 규칙만 적으면 다음 회차에 다시 샌다. 이 저장소의 방식대로 게이트를 세운다.
- **해결책** — `tests/es-ceiling.test.js`. 이미 devDependency 인 TypeScript 파서로 구문
  트리를 훑는다. **정규식을 안 쓴 이유**: `index.js` 주석에 `Forget<r>`·`a -> b`·
  `docs/internals.md#anchor` 가 널려 있어 문자열 검색은 오탐이 난다.
- **완료조건** — 상한을 넘는 결함을 심으면 잡힌다.
- **검증 (2026-08-14)** — 결함 **13종을 심어 13종 전부 잡았다.** `?.`(69번 줄 되돌리기)·
  `??`·`??=`·`||=`·클래스 필드·`#private`·`catch` 바인딩 생략·`.flat()`·
  `Object.fromEntries` 직접 호출·`globalThis`·`.replaceAll()`·숫자 구분자·동적 `import()`.
  매번 `cmp` 로 작업 트리 복원을 확인했다. (`npm test` 가 아니라 테스트 파일을 **직접**
  돌렸다 — npm 은 종료 코드를 삼킨다.)
- **게이트 자신의 버그 둘을 게이트가 잡았다** — ① 규칙표를 평범한 객체로 만들어
  `PROTO_APIS['constructor']` 가 `Object.prototype` 을 타고 참이 됐다(멀쩡한 5곳을 잡음).
  `Object.create(null)` 로 고쳤다. ② `polyfills.array.flatMap` 의 소유자가 `polyfills.array`
  라 한 겹 검사로는 면제가 안 됐다. 접근 사슬의 뿌리까지 내려가게 고쳤다.
- **못 잡는 것** — 이름을 문자열로 만들어 부르는 경우(`obj['flatMap']()`), 그리고 표준화된
  것이 문법이 아니라 *동작*인 경우(`Array.prototype.sort` 안정성, ES2019). 파일 머리에 적었다.

<h3 id="es-폴리필">✅ 폴리필 넷 중 둘 제거</h3>

- **소유자 질문 (2026-08-14)** — "이미 만든 폴리필도 필요없지 않을까요?" **절반만 맞다.**
- **원인** — 상한을 ES2018 로 정하면 `Object.entries`·`Object.values`(**ES2017**)는 상한을
  지키는 런타임에 반드시 있다. 검사해도 늘 네이티브로 가고 대체 가지는 **영원히 안 불린다**
  — 시험된 적 없는 코드로 남는다. 반면 `Array.prototype.flatMap`·`Object.fromEntries`
  (**ES2019**)는 상한 위라 없을 수 있다.
- **왜 넷 다 지우면 안 되나** — 검사를 없애고 대체 구현으로 고정하면 **O(n²)** 이 된다.
  `Array` 모나드의 `chain` 이 그 경로다. 실측: 20,000개에서 네이티브 0.3869ms 대
  `reduce`+`concat` 277.7724ms — **718배**. 1,000개에서도 15.7배.
  검사는 "구형에서도 돈다" 와 "신형에서는 빠르다" 를 동시에 산다.
- **한 일** — `entries`·`values` 검사 제거(23줄 → 18줄). 호출부는 `Object.entries(...)`·
  `Object.values(...)` 직접 호출로 바꿨다. 이로써 `index.js:1044` 가 이미 직접 부르던 것과
  형태가 통일됐다.
- **검증 (2026-08-14)** — 대체 구현 넷을 꺼내 네이티브와 11개 입력으로 대조 → **불일치 0건**
  (구멍 있는 배열·중복 키·빈 입력 포함). `npm run baseline` 세션 최초 기록과 **diff 0줄**.
  `npm test` 43/43 + 타입체크.
- **게이트에 규칙을 박았다** — "폴리필은 상한 위의 것만 검사한다". 상한 아래를 다시 검사하게
  되돌리는 뮤테이션 → **잡힘**.

<h3 id="es-게이트-구멍">✅ 게이트의 면제 범위가 너무 넓었다 (같은 회차에 발견·수정)</h3>

- **원인** — 처음에 `polyfills` **블록 전체**를 면제했다. 그러면 블록 *안에서* 검사 없이
  원본 API 를 직접 부르는 결함이 통과한다.
- **발견 경위** — 뮤테이션으로 잡혔다. `polyfills.object.fromEntries(` 를
  `Object.fromEntries(` 로 바꿨는데 게이트가 **초록**이었다. 결함이 실제로 심어졌는지
  파일을 눈으로 확인한 뒤 판정했다.
- **해결책** — 면제 단위를 "블록 안" 에서 "**기능 검사 삼항 안**" 으로 좁혔다. 원본 API 를
  볼 자격은 삼항의 조건과 참-가지뿐이다.
- **검증 (2026-08-14)** — 뚫렸던 결함 재시도 → **잡힘**. 인접 결함 셋(블록 안 `flatMap` 직접
  호출 · 상한 아래 재검사 · 블록 밖 `?.`)도 전부 잡힘. 정상 소스는 초록 유지.

<h3 id="es-dist">✅ <code>dist/</code> 재빌드</h3>

- **원인** — `dist/` 는 이 작업 전에 빌드됐다. `?.` 4건·`??` 3건이 산출물에 그대로 있었다.
  소스는 규칙을 지키는데 사용자가 받는 것은 안 지키는 상태였다.
- **완료조건** — `npm run build` 후 세 산출물에 `?.`·`??` 가 0건.
- **검증 (2026-08-14)** — ESM·CJS·min·`.d.ts` 넷을 다시 만들었다. 세 산출물 전부
  `?.` **0건** · `??` **0건** · `polyfills.object.values` **0건**.
  산출물을 직접 로드해 동작도 봤다 — CJS 에서 `Ord.lookup('number').equals(1,1)` `true`,
  `Object` filter(폴리필 경로) `{b:2,c:3}`, `Object` foldable(`Object.values` 직접) `6`,
  `Array` chain(`flatMap` 경로) `[1,2,2,4,3,6]`, `Category.id()` 가 `function`;
  ESM 에서 `Ord instanceof Setoid` `true`, `Either.Semigroup` Left 누적 `e1e2`.
- **결정 (2026-08-14, 소유자)** — ES 상한 게이트는 **`index.js` 만** 본다.
  뒤이어 소유자가 관점을 바로잡았다 — 아래 `dist-sync` 로 이어진다.

<h3 id="dist-sync">✅ <code>dist/</code> 를 소스와 묶는다 — 내용을 훑는 대신</h3>

- **소유자 지적 (2026-08-14)** — "dist 는 index.js 와 동일하다고 보는 게 맞다. 1개의 진실
  소스에서 만들기 때문이다." **관점이 바뀌었다.** 산출물을 따로 훑는 것은 같은 일을 두 번
  하는 것이다. 확인해 보니 실제로 그렇다 — `build.js` 는 문자열 변환일 뿐이고 결정적이지
  않은 입력은 헤더의 빌드 시각 하나뿐이며, `dist/fun-fp.js` 는 헤더를 떼면 `index.js` 와
  글자까지 같다.
- **다만** 그 동일성은 **빌드를 돌렸을 때만** 참이다. 그래서 검사할 것은 산출물의 내용이
  아니라 **"dist 가 지금 index.js 의 빌드 결과와 같은가"** 다. 이것이 초록이면 `index.js`
  에 대해 증명한 것이 `dist/` 에도 자동으로 성립한다.
- **해결책** — `build.js` 의 변환을 순수 함수 `buildOutputs(source, builtAt)` 로 빼내
  CLI 와 검사가 **같은 코드**를 쓰게 했다. 검사가 변환을 베끼면 `build.js` 가 바뀔 때
  조용히 어긋나고 그때 거짓 초록이 된다. `tests/dist-sync.test.js` 신설.
- **완료조건** — 소스를 고치고 빌드를 잊은 상황이 잡힌다.
- **검증 (2026-08-14)** — 리팩터링이 산출물을 안 바꾼 것부터 확인했다: 세 산출물을 빌드 시각
  줄만 지우고 해시 대조 → **셋 다 동일**. 결함 5종을 심어 **5종 전부 잡았다** —
  ① index.js 를 고치고 빌드 잊음(핵심) ② index.js 에 `?.` 되돌리고 빌드 잊음
  ③④⑤ 세 산출물을 각각 직접 위조. 매번 `cmp` 로 복원 확인. `npm test` **44/44 + 타입체크**.
  `npm run build` CLI 도 그대로 동작한다.
- **만드는 중 실수 하나** — 빌드 시각 정규화가 비대칭이었다. 기대값에 `'X'` 를 넘겼는데
  그것은 치환 대상(숫자)이 아니라 기대값만 정규화를 안 거쳤고, 거짓 실패가 났다.
  양쪽이 같은 정규화를 지나도록 실제 시각 모양을 넘긴다. 민파일은 콜론 뒤 공백까지 지워져
  `Built:2026-…` 가 되므로 정규식에 `\s*` 가 필요하다.

<h3 id="dts-sync">✅ <code>dist/fun-fp.d.ts</code> 와 선언 파일 명단</h3>

- **원인** — `.d.ts` 는 `index.js` 가 아니라 `types/` 에서 `build-types.js` 가 만든다.
  진실 소스가 달라 짝을 따로 맺어야 한다.
- **해결책** — `build.js` 와 같은 모양으로 `buildTypeDeclarations(readFile, builtAt)` 를
  빼내고 `TYPE_FILES` 명단을 내보냈다. CLI 는 직접 실행할 때만 파일을 쓴다.
- **덤으로 찾은 구멍** — `build-types.js` 의 파일 명단은 **손으로 적는다.** 새 선언 파일을
  만들고 명단에 안 넣으면 배포되는 `.d.ts` 에서 조용히 빠진다. **타입만 사라지고 런타임은
  멀쩡하므로 다른 어떤 검사에도 안 걸린다.** 지금은 실재 24개 = 명단 24개로 어긋난 것이
  없지만(실측), 앞으로를 막기 위해 양방향 대조를 넣었다.
- **완료조건** — `types/` 를 고치고 빌드를 잊으면 잡히고, 명단 누락도 잡힌다.
- **검증 (2026-08-14)** — 리팩터링이 산출물을 안 바꾼 것부터 확인(빌드 시각만 빼고 해시 동일).
  결함 4종을 심어 **4종 전부 잡았다** — ① `types/HKT.d.ts` 고치고 빌드 잊음
  ② `dist/fun-fp.d.ts` 직접 위조 ③ 새 선언 파일을 만들고 명단에 안 넣음
  ④ 명단에서 파일 하나를 뺌. 매번 복원 확인.
  `npm test` **44/44 + 타입체크**, `npm run build` 산출물 4개 그대로.
- **주의** — 명단 대조는 `types/__tests__/*.test-d.ts` 를 뺀다. 배포물이 아니다.

<h3 id="es-tests">✅ <code>tests/</code>·빌드 스크립트도 상한을 지킨다</h3>

- **결정 (2026-08-14, 소유자)** — 건다. 개발 파일은 배포되지 않고 Node 전용 API 를 쓰므로
  여기서 사는 것은 호환성이 아니라 **일관성**이다. 사람은 옆 파일의 관례를 베껴 쓰고,
  저장소 절반이 `?.` 를 쓰면 그것이 `index.js` 로 새어 들어온다.
- **실측** — 파서로 세니 **23건**이었다(빌드 스크립트 둘은 **0건** — 앞서 문자열 검색으로
  본 "`build-types.js` 1건" 은 오탐이었다). 내역: `??` 9 · `?.` 4 · `catch` 바인딩 생략 4 ·
  `matchAll` 3 · `Object.fromEntries` 1 · `flatMap` 1. 게이트를 넓히자 스캐너가 안 보던
  **최상위 `await` 1 · 동적 `import()` 2** 가 더 나왔다.
- **한 일** — `matchAll` 은 세 곳에서 쓰였다. 회피 코드를 세 번 베끼면 그것이 다음 드리프트의
  씨앗이라 `tests/utils.js` 에 `allMatches` 하나를 두고 모두 그것을 쓴다. 최상위 `await` 는
  `async` 함수로 감쌌다 — 덤으로 거부를 잡게 됐다(전에는 처리되지 않은 거부로 샜다).
- **예외 하나** — `tests/baseline.js` 의 동적 `import()`. HEAD 의 `index.js` 를 임시 파일로
  써서 불러오는데 경로가 실행 시점에 정해지므로 **ESM 에는 이것 말고 수단이 없다.**
  이유와 함께 표에 적었고, 게이트가 ① 이유가 있는지 ② 그 예외가 아직 쓰이는지를 본다 —
  원인이 사라졌는데 줄만 남으면 다음 사람이 "여기는 원래 예외" 라고 읽는다.
- **검증 (2026-08-14)** — 검사 대상 **파일 51개**. 결함 5종을 심어 **5종 전부 잡았다** —
  `tests/utils.js` 에 `globalThis` · `staticland-laws` 에 `?.` · `build.js` 에 `.flat()` ·
  `build-types.js` 에 `catch` 생략 · **예외 목록에서 항목 지우기**. 매번 `cmp` 로 복원 확인.
  `npm test` **44/44 + 타입체크**, `npm run baseline` "차이 없음".
- **게이트가 자기를 잡을 뻔했다** — 규칙표에 `globalThis:` 가 키로 들어 있어서, 객체 리터럴의
  **키로 쓰인 이름은 참조가 아니다**를 구분해야 했다. 안 그러면 게이트가 자기 자신을 잡는다.

| 상태 | # | 무엇 |
| --- | --- | --- |
| ✅ | — | [법칙이 레지스트리 전체를 안 본다](#functor법칙) |
| ✅ | — | [`Filterable` 소멸 법칙을 `Either`/`Task` 가 못 지킨다](#filterable소멸) |
| ✅ | — | [`Category.id` 의 모양이 명세·타입 선언과 다르다](#category-id) |
| ✅ | 1차-9 | [컨테이너 인스턴스의 `.type` 이 어떤 게이트에도 안 걸린다](#1차-9) |
| ✅ | 2차-3 | [`default` 의 동종 제약이 격자·문서에 없다](#2차-3) |
| ✅ | 2차-6 | [`FunctionFunctor.map` 이 `compose2` 를 직접 다시 씀](#2차-6) |
| ✅ | 2차-8 | [부모 인스턴스 조회가 관례와 다름](#2차-8) |
| ✅ | 2차-9 | [거짓 주석 — "뼈대가 이미 정해 두고 있다"](#2차-9) |
| ✅ | 2차-10 | [죽은 앵커 `docs/internals.md#ord-setoid`](#2차-10) |
| ✅ | 2차-11 | [게이트 ③의 한계를 소스 주석이 과장](#2차-11) |
| ✅ | 1차-5 | [`_ordLte` — Ord 헬퍼가 Setoid 이름 아래](#1차-5) |
| ✅ | 1차-7 | [없어진 `struct(...)` 키를 광고하는 주석](#1차-7) |
| ✅ | 1차-8 | [`either(...)` 항수가 레지스트리마다 다름](#1차-8) |
| ✅ | — | [`NumberProductGroup` 이 0에서 군 법칙을 깬다](#곱셈군) |
| ✅ | — | [`dist/` 재빌드](#dist) |

---

## ✅ 닫힘 — 검증 장치

<h3 id="functor법칙">✅ Functor~Traversable 법칙이 레지스트리 전체를 안 본다</h3>

- **원인** — 값 수준 다섯 클래스(Setoid·Ord·Semigroup·Monoid·Group)는 표본만 있으면 법칙을
  돌릴 수 있어 먼저 했다. 컨테이너는 동등이 타입마다 달라 미뤘다 — `Task`·`Reader`·`State`
  는 안에 함수가 있어 구조 비교가 안 된다. **`Ord` 를 놓쳤던 것과 같은 모양의 구멍**이
  그대로 남아 있다: 각 `tests/*.test.js` 가 **테스트에 이름을 적어 둔 인스턴스만** 본다.
- **해결책** — 타입별 동등을 표로 두고(`Task` 는 `fork` 결과 비교 같은 관측 동등),
  `staticland-laws.test.js` 의 `LAWS`·`FACTORY_CASES` 구조를 그대로 확장한다.
- **완료조건** — `Functor` 등록 인스턴스 전부에 항등·합성 법칙이 돌고, 아무 인스턴스의 `map`
  을 뒤집는 뮤테이션이 잡힌다.
- **검증 (2026-08-13) — Functor 는 닫혔다** — 등록 11개 전부에 항등·합성이 돈다. 컨테이너는
  값이 아니라 **관측**으로 비교한다(`OBSERVE`): `Task` 는 `fork` 결과, `Reader`/`State` 는
  표본 환경·상태에서의 `run`, `Writer` 는 `run()`, `Free` 는 `Pure` 의 값.
  깨끗한 뮤테이션 셋(`Maybe`/`Reader`/`Free` 의 `map` 이 함수를 안 쓰게)을 심어 **새 게이트가
  단독으로** 잡는 것을 확인했다. 표본이 공허하지 않은지 보는 검사도 함께 넣었다 — 각 타입마다
  "합성을 안 하는 map" 의 차이가 실제로 관측되는지 본다.
- **검증 (2026-08-13) — 나머지도 닫았다** — `Semigroupoid`·`Filterable`·`Bifunctor`·
  `Contravariant`·`Profunctor`·`Apply`·`Applicative`·`Alt`·`Plus`·`Alternative`·`Chain`·
  `Monad`·`Foldable`·`Extend`·`Comonad` 열다섯을 레지스트리 순회로 돌린다. 법칙 원문은
  명세에서 가져와 옮겼다. 값 수준 5 + `Functor` 11 + 팩토리 11 + 나머지 **63** 개.
  뮤테이션으로 확인: `MaybeChain.chain` 이 f 무시 / `ArrayAlt.alt` 가 둘째 버림 /
  `ArrayFilterable.filter` 가 predicate 무시 / `ArrayComonad.extract` 를 마지막 원소로 /
  `MaybePlus.zero` 를 `Just(0)` 으로 / `MaybeApplicative.of` 를 항상 `Nothing` 으로 —
  **여섯 전부 잡힌다.**
- **덮지 못한 것** — `ChainRec`(스택 사용 제약이 법칙에 들어 있어 등가식만으로는 불충분)과
  `Traversable`(자연변환·Applicative 합성이 필요)은 넣지 않았다. `Category` 는 아래 결정 대기.
  `Foldable` 법칙은 자기참조라 `reduce` 전체가 뒤집혀도 통과한다(파일 머리에 실측과 함께 적음).
- **참고** — [`tests/staticland-laws.test.js`](./../tests/staticland-laws.test.js) 머리의
  「못 잡는 것」 · [`learning/INDEX.md`](./learning/INDEX.md) 규칙 31-1

## ✅ 닫힘 — 리뷰 판정 (2026-08-13)

<h3 id="2차-3">✅ [2차-3] <code>default</code> 의 동종 제약이 격자·문서에 없다</h3>

- **원인** — `lookup('default')` 를 정식 인스턴스로 만들면서 타입 검사가 붙었다.
  `equals(1,'a')` 가 `false` → 던짐으로 바뀌었다. **소유자 승인을 받은 의도된 변경**이지만,
  그 사실을 지키는 장치가 없다. `tests/baseline-report.js` 에 `default` 언급이 0건이고
  `docs/internals.md` 의 `'any'` 절은 새 인스턴스 둘을 모른다.
- **해결책** — 격자에 이종 비교 한 줄, `#any` 절에 `DefaultSetoid`/`DefaultOrd` 추가.
- **완료조건** — 그 제약을 되돌리는 뮤테이션(`type:'any'` → 검증 없는 리터럴)이 잡힌다.
- **검증 (2026-08-13)** — 세 곳에 박았다. ① `docs/internals.md#any` 에 절을 더했고 예제가
  `docs-examples.test.js` 에서 돈다(485개 통과) ② `tests/setoid.test.js`·`ord.test.js` 가
  이종 인자의 던짐과 인스턴스 동일성을 전문으로 고정 ③ `baseline` 격자에 네 줄.
  되돌리는 뮤테이션을 양쪽에 심어 확인: `DefaultSetoid.equals = Setoid.op` → **41/1**,
  `DefaultOrd.lte = Ord.op` → **41/1**. `npm run baseline` 차이 없음.
- **참고** — [`review/260813-index-audit-2.md`](./review/260813-index-audit-2.md) 3번 · [`index.js:1003`](./../index.js#L1003) · [`docs/internals.md`](./../docs/internals.md) `#any`

<h3 id="2차-6">✅ [2차-6] <code>FunctionFunctor.map</code> 이 <code>compose2</code> 를 직접 다시 씀</h3>

- **원인** — 명세 게이트 ③을 만족시키려고 `FunctionFunctor` 를 급히 만들면서, 같은 파일에
  이미 있는 `compose2` 를 조회하지 않고 람다를 직접 썼다. **관례를 실행으로 조회하라는
  규칙 22를 어겼다** — 형제 둘은 이미 `super(compose2, …)` 로 넘기고 있다.
- **해결책** — `super(compose2, 'function', Functor.types, 'function')`.
- **완료조건** — 형제 셋의 형태가 같고, 전 입력에서 `map`/`concat`/`compose` 결과가 일치한다
  (이미 일치함을 실측). 합성 방향 뒤집기 뮤테이션은 이미 잡힌다.
- **검증 (2026-08-13)** — `super(compose2, 'function', Functor.types, 'function')` 로 바꿔 형제 둘과
  형태가 같아졌다. 전 입력 대조: `Functor.map` / `Semigroup.concat` / `Semigroupoid.compose` 가
  `[10,20,-10,80]` 로 셋 다 일치. `npm run baseline` 차이 없음.
- **참고** — [`index.js:803`](./../index.js#L803) vs [`index.js:94`](./../index.js#L94) ·
  형제: `FunctionSemigroup`·`FunctionSemigroupoid` · [`review/260813-index-audit-2.md`](./review/260813-index-audit-2.md) 6번 · [`learning/INDEX.md`](./learning/INDEX.md) 규칙 22

<h3 id="2차-8">✅ [2차-8] 부모 인스턴스 조회가 관례와 다름</h3>

- **원인** — `Ord extends Setoid` 를 만들며 짝 Setoid 를 `Setoid.lookup('number')` 로 꺼냈다.
  파일의 선례 68곳은 전부 `Parent.types.ClassName` 이다. 실행으로 관례를 조회하지 않았다.
- **해결책** — 68곳과 형태를 맞추거나, `lookup` 을 고르는 이유(미등록 시 라벨 있는 TypeError)를
  **한 줄로 적고 결정으로 기록**한다. 규칙 19: 다른 규칙을 들여놓는 것은 결정이다.
- **완료조건** — `grep` 집계가 한 형태로 모이거나, 두 형태가 공존하는 이유가 소스에 적혀 있다.
- **검증 (2026-08-13)** — 여섯 자리를 `Setoid.types.<클래스이름>` 으로 바꿨다.
  집계가 한 형태로 모였다: `.types.X` 68 → **74**, `Setoid.lookup` 6 → **0**.
  `npm run baseline` 차이 없음.
- **참고** — [`index.js:873`](./../index.js#L873) `946` `960` `972` `1011` `1222` ·
  현재 집계 `.types.X` 68 / `Setoid.lookup` 6 · [`review/260813-index-audit-2.md`](./review/260813-index-audit-2.md) 8번

<h3 id="2차-9">✅ [2차-9] 거짓 주석 — "뼈대가 <em>이미</em> 정해 두고 있다"</h3>

- **원인** — `Either.Setoid` 를 공용 뼈대에 올리며 주석을 달았는데 두 겹으로 틀렸다.
  ① 그 다인자 분기는 **같은 변경에서 새로 만든 것**이라 "이미" 가 아니다.
  ② 안쪽 하나라도 미등록이면 캐시가 **아예 안 걸린다**. 바로 위 주석이 그렇게 설명하는데
  이 줄이 반대로 말한다.
- **해결책** — "안쪽이 둘이면 양쪽 키를 다 알 때만 캐시된다" 로 고치거나 지운다.
- **완료조건** — 소스를 읽고 실행 결과와 모순이 없다(소유자 판단).
- **검증 (2026-08-13)** — `index.js:1565` 를 "양쪽 키를 다 알 때만 캐시된다 — 한쪽이 미등록이면
  캐시가 없다" 로 고쳤다. 실행 대조: 양쪽 키면 `Either.Setoid('string','number')` 동일성 `true`,
  왼쪽을 미등록 인스턴스로 주면 `false`.
- **참고** — [`review/260813-index-audit-2.md`](./review/260813-index-audit-2.md) 9번 · [`index.js:1565`](./../index.js#L1565)

<h3 id="2차-10">✅ [2차-10] 죽은 앵커 <code>docs/internals.md#ord-setoid</code></h3>

- **원인** — 주석이 두 줄을 넘어가서 `docs/` 로 빼고 힌트만 남기는 규약을 따랐는데,
  **가리킨 절을 만들지 않았다.** 지금 그 앵커는 0개다.
- **해결책** — `docs/internals.md` 에 `{#ord-setoid}` 절을 만들고 길이·로케일 예제를 넣는다.
  문서 예제는 테스트가 실행하므로 **그것이 곧 회귀 테스트**가 된다.
- **완료조건** — 앵커가 실재하고, 그 절의 예제가 `docs-examples.test.js` 에서 돈다.
- **검증 (2026-08-13)** — `docs/internals.md` 에 `{#ord-setoid}` 절을 만들었다(앵커 0개 → 1개).
  예제 넷이 `docs-examples.test.js` 에서 돈다 — 484개 전부 통과. 길이 순서의 반대칭과
  NFC/NFD 로케일 동치를 예제가 실행한다.
- **참고** — [`review/260813-index-audit-2.md`](./review/260813-index-audit-2.md) 10번 · [`index.js:951`](./../index.js#L951) · [`docs/internals.md`](./../docs/internals.md)

<h3 id="2차-11">✅ [2차-11] 게이트 ③의 한계를 소스 주석이 과장</h3>

- **원인** — `FunctionFunctor` 주석에 "명세가 요구하는 그것이다" 라고 단정했다. 그런데 그
  판정을 내리는 게이트는 `.type` **문자열**만 비교한다. `TupleBifunctor`(`.type='Array'`)가
  `ArrayFunctor` 로 만족되는데, 튜플의 둘째 자리만 매핑해야 할 자리에 배열 전체를 매핑하는
  Functor 다. **게이트가 확인한 것이 아닌데 확인한 것처럼 썼다.**
- **해결책** — 주석에서 단정을 빼고 무엇인지만 말한다(`map = 후합성`). 게이트 파일의
  「못 잡는 것」에 `TupleBifunctor` 사례를 명시한다.
- **완료조건** — 주석에 게이트가 보증하지 않는 주장이 없다(소유자 판단).
- **검증 (2026-08-13)** — `index.js:802` 에서 "명세가 요구하는 그것이다" 를 빼고
  "map 은 후합성이다 — compose2 와 같은 연산" 으로 바꿨다. 실행 대조: `map(g,fn)` 과
  `Semigroupoid.compose(g,fn)` 이 전 입력에서 `[10,20,-10,80]` 로 일치.
  게이트 ③의 한계(`TupleBifunctor` 가 `ArrayFunctor` 로 만족된다)를
  `tests/staticland-spec.test.js` 머리의 「못 잡는 것」에 실측값과 함께 적었다.
- **참고** — [`index.js:803`](./../index.js#L803) ·
  [`tests/staticland-spec.test.js`](./../tests/staticland-spec.test.js) 검사 ③ · [`review/260813-index-audit-2.md`](./review/260813-index-audit-2.md) 11번

<h3 id="1차-5">✅ [1차-5] <code>_ordLte</code> — Ord 헬퍼가 Setoid 이름 아래</h3>

- **원인** — 컨테이너 Ord 를 만들며 배열 사전식 비교 함수를 `Setoid.Array._ordLte` 로 붙였다.
  이 파일에서 공개 팩토리에 붙은 밑줄 속성은 **전부 캐시**인데 이것만 로직이다. 밖에서
  `fp.Setoid.Array._ordLte` 로 닿는다 — 공개 표면 오염이다.
- **해결책** — 파일의 다른 헬퍼처럼 모듈 지역 `const arrayOrdLte` 로 내리고 `Ord.Array` 위에 둔다.
- **완료조건** — `fp.Setoid.Array._ordLte` 가 `undefined` 이고 42/42 초록.
- **검증 (2026-08-13)** — 모듈 지역 `const arrayOrdLte` 로 내렸다.
  `fp.Setoid.Array._ordLte` 가 `undefined`(공개 표면에서 사라졌다). 사전식 동작 그대로:
  `lte([1,2],[1,3])` `true` · `lte([1,3],[1,2])` `false` · `lte([1],[1,0])` `true` ·
  반대칭 `equals([1,2],[1,2])` `true`. `npm run baseline` 차이 없음.
- **참고** — [`review/260813-index-audit.md`](./review/260813-index-audit.md) 5번 · [`index.js:1555`](./../index.js#L1555) · 사용처는 [`1564`](./../index.js#L1564) 한 줄뿐

<h3 id="1차-7">✅ [1차-7] 없어진 <code>struct(...)</code> 키를 광고하는 주석</h3>

- **원인** — `struct` 를 레지스트리 밖으로 빼면서 키 문법을 없앴는데, 그 문법을 설명하는
  주석을 안 고쳤다. 지금 그 키로 조회하면 던진다.
- **해결책** — `struct(age:number,name:string)` 를 지우고 "내부 캐시 키" 라고만 쓴다.
- **완료조건** — 주석이 광고하는 키가 실제로 조회된다, 또는 그런 주장이 없다.
- **검증 (2026-08-13)** — `index.js:1573` 을 "내부 캐시 키만 필드 이름 정렬로 정규화한다
  (조회 키는 없다)" 로 고쳤다. 실행 대조: `Setoid.lookup('struct(a:number)')` → `unsupported key`,
  `Setoid.Struct({b,a}) === Setoid.Struct({a,b})` → `true`.
- **참고** — [`review/260813-index-audit.md`](./review/260813-index-audit.md) 7번 · [`index.js:1573`](./../index.js#L1573)

## ✅ 닫힘 — 소유자가 결정한 것

<h3 id="filterable소멸">✅ <code>Filterable</code> 소멸 법칙을 <code>Either</code>/<code>Task</code> 가 못 지킨다</h3>

- **원인** — 명세: `F.filter(x => false, a) ≡ F.filter(x => false, b)`. 전부 걸러내면 **입력과
  무관하게 같은 것**이 나와야 한다. `Array`·`Maybe`·`Object` 는 `[]`·`Nothing`·`{}` 라는
  정규 빈 상자가 있어 지켜지는데, `Either`/`Task` 는 없다. 실측:
  `filter(항상 false, Right(1))` → `Left(1)`, `Right(9)` → `Left(9)` — 값이 왼쪽으로 옮겨간다.
  `Task` 도 같다(`Task.of(1)` → `rejected(1)`).
- **왜 에이전트가 못 정하나** — 고치는 길이 셋이고 전부 공개 표면을 바꾼다.
  ① 왼쪽 `Monoid` 를 받는 팩토리로 바꾼다(fp-ts 의 `getFilterable(M)` 방식) —
  `Filterable.lookup('either')` 가 사라진다. ② 등록을 뺀다. ③ 명세 미준수로 두고 문서화한다.
- **조사 (2026-08-13)** — 다른 라이브러리를 찾아봤다. fp-ts 는 `getFilterable(M: Monoid<E>)`,
  Haskell `witherable` 은 `Monoid e => Filterable (Either e)` 다. **둘 다 전역 등록이 아니라
  왼쪽 `Monoid` 를 요구하는 조건부다.** 다만 그쪽 법칙집에는 **소멸 법칙이 없다**(Haskell 은
  보존·합성 둘뿐). 전제가 다른 곳의 결론이라 그대로 가져올 수 없다 — 규칙 5.
- **증명** — Static Land 아래에서는 `Monoid` 를 줘도 불가능하다. `Left` 에는 술어를 부를 값이
  없어 보존/뭉갬 중 하나로 고정해야 하는데, 보존하면 소멸이(`Left(e1)`≠`Left(e2)`), 뭉개면
  항등이(`filter(x=>true, Left(e))`≠`Left(e)`) 깨진다. **정보가 아니라 모양의 문제다.**
- **결정 (2026-08-13, 소유자)** — 등록을 뗀다. "함수형 라이브러리는 정확해야 한다."
- **검증 (2026-08-13)** — `Filterable.lookup('either'/'task')` 가 `unsupported key` 로 막힌다.
  `Either.filter`·`Task.filter` 는 평범한 함수로 남아 **동작이 그대로다**(실측).
  `npm run baseline` 차이 5건 — 전부 레지스트리·`Algebra.all` 목록에서 둘이 빠진 것이고
  `filter` 결과 자체는 차이 0. 다시 등록하는 뮤테이션 → **40/2**(개수 게이트 + 법칙 게이트).
  `KNOWN_DEVIATIONS` 가 비었다. 근거는 `docs/internals.md#filterable` 에 예제와 함께 있다.

<h3 id="category-id">[⏸] <code>Category.id</code> 의 모양이 명세·타입 선언과 다르다</h3>

- **원인** — 명세는 `id()` 를 **불러서** 항등 사상을 얻는다(법칙도 `M.compose(a, M.id())` 로
  쓴다). 런타임은 `id` 자체가 사상이라 `id()` 는 사상을 호출해 버린다. 실측:
  `Category.lookup('function').id()` → `undefined`, `maybe`/`either`/`task` → 뜻 없는 객체.
  `id` 를 사상으로 직접 쓰면 법칙은 성립한다(`compose(a, C.id)` ≡ `a`).
- **왜 이게 아픈가** — `types/TypeClasses.d.ts:210` 이 `readonly id: <A>() => Kind<…>` 로
  **명세 쪽**을 선언한다. `Ord` 때와 같은 유형이다 — TS 사용자는 `tsc` 를 통과하고 런타임에
  `undefined` 를 받는다.
- **왜 에이전트가 못 정하나** — `id` 를 `() => 사상` 으로 바꾸면 공개 표면이 바뀐다
  (breaking). 타입 선언을 런타임에 맞추면 명세에서 멀어진다. 어느 쪽이 이 라이브러리의
  약속인지는 소유자가 정한다.
- **결정 (2026-08-13, 소유자)** — 코드를 명세·타입 선언 쪽에 맞춘다. 셋 중 둘이 같은 말을
  하면 그쪽이 기준이고, 같은 날 `Ord` 에서도 같은 방향을 골랐다.
- **검증 (2026-08-13)** — `instance.id = () => id` 로 바꿨다. 네 인스턴스 전부
  `typeof id()` 가 `function` 이고, 명세 법칙 `compose(a, id()) ≡ a` · `compose(id(), a) ≡ a`
  가 `function`·`maybe`·`either`·`task` 에서 성립한다. 법칙 게이트에 `Category` 를 넣어
  네 인스턴스를 순회한다(검사 대상 63 → 67). 옛 모양으로 되돌리는 뮤테이션 → **39/3**.
  `KNOWN_DEVIATIONS` 에서 뺐다.
- **BREAKING** — `C.id` 를 사상으로 직접 쓰던 코드는 `C.id()` 로 바꿔야 한다.

## ⏸ 결정이 끝난 것 (기록)

<h3 id="타입-지원-범위">⏸ <code>Algebra</code> 와 <code>.type</code> 의 범위 — 타입 체계가 아니다</h3>

- **소유자 원칙 (2026-08-15)** — *"여기 `Algebra`와 `type` 필드는 가볍게 타입클래스와 값
  타입을 지원할 뿐입니다."*
- **무엇을 뜻하나** — `Algebra` 는 인스턴스를 찾아 주고, `.type` 은 "이 인스턴스가 다루는
  것이 맞는지" **한 겹** 보는 데까지다. 구조적 검증·원소 검사·위조 차단은 이곳의 일이 아니다.
- **결정 (2026-08-15, 소유자)** — `_typeName` 문자열을 베낀 객체가 타입 클래스 메서드를
  통과하는 것은 **의도된 한계다.** 결함이 아니므로 닫지 않는다.

  ```
  { value: 1, _typeName: 'Identity' } 를 Functor.lookup('identity').map 에  ->  통과
  ```

  일부러 속이는 것은 쓰는 쪽 몫이고, 가벼운 지원 장치가 막을 대상이 아니다.
  실수로 같은 모양이 되는 경우(변형이 둘인 타입 등)는 대부분 다른 데서 걸린다.
- **여기서 갈라져 나온 것** — 이 한계를 막으려고 `Symbols.TypeName` 을 만들었다가 동의 없는
  구현이라 같은 날 삭제했다. 위 「철회」 항목 참조. 그 기제도 완전한 차단은 아니었다 —
  `Symbol.for` 는 전역 등록소라 작정하면 같은 칸을 연다(실측).
- **함께 보는 것** — AST 를 안 하기로 한 판정([`plan/260815-type-ast-proposal.md`](./plan/260815-type-ast-proposal.md))과
  같은 결에 있다. 타입 식은 두 겹까지이고, 깊이는 위임이 만든다.

- **결정 (2026-08-15, 소유자) — `Set`·`Map`·`Triple` 도 같다.** *"자바스크립트에서는 값
  타입 지원하지 않으니, 여기도 지원하지 않습니다."*

  `new Set([1, 'a'])` 도 `new Map([['a', 1], [2, 'b']])` 도 JS 가 막지 않는다. 그것들이
  원소 타입을 지니지 않으므로 우리도 지니게 하지 않는다 — `set(number)`·`map(string,number)`
  같은 **안쪽 칸은 만들지 않는다.**

  따라서 이 셋에 남는 것은 **컨테이너 축뿐이다**(`instanceof Set`·`instanceof Map`·길이 3).
  넣을지는 여전히 「필요해질 때」이고, 넣더라도 값 타입은 없다.


<h3 id="1차-8">✅ [1차-8] <code>either(...)</code> 항수가 레지스트리마다 다름</h3>

- **원인** — `Setoid` 쪽 `either` 를 2항으로 도입할 때 `Semigroup` 에 이미 1항 `either` 가
  있다는 것을 근거에 넣지 않았다.
- **왜 에이전트가 못 정하나** — 조립 키는 이 라이브러리의 **공용 타입 문법**이다. 한쪽으로
  통일하는 것은 설계 결정이고, `Either.Semigroup` 을 2항으로 넓히면 `Validation` 처럼 왼쪽을
  누적하는 인스턴스로 가는 길이 열린다. 그 방향을 소유자가 정해야 한다.
- **참고** — [`review/260813-index-audit.md`](./review/260813-index-audit.md) 8번
- **결정 (2026-08-13, 소유자)** — (가) `Semigroup` 도 둘을 받게 넓힌다. 문법을 통일하고
  **왼쪽을 실제로 쓴다** — 받아만 놓고 안 쓰면 인자가 거짓말이 된다.
- **검증** — `Either.Semigroup('string','array')` 로 바뀌었고 키가 `either(string,array)` 다.
  `Setoid.lookup('either(string,number)')` 와 같은 형식. 의미는 `Validation` 선례를 따른다:
  둘 다 `Left` 면 왼쪽 법으로 누적(`Left('e1')·Left('e2')` → `Left('e1e2')`), 한쪽만 `Left` 면
  그것이 이긴다. 1항으로 부르면 `expects 2 inner arguments, got 1`. 42/42 초록.
- **BREAKING** — `Either.Semigroup(sg)` 를 쓰던 코드는 두 인자로 바꿔야 하고,
  `Left ⊕ Left` 가 첫 번째를 고르는 대신 누적한다.
- **실측** — `Semigroup.lookup('either(number)')` 성공 / `Setoid.lookup('either(number)')` 던짐,
  그 반대도 마찬가지.

<h3 id="곱셈군">[⏸] <code>NumberProductGroup</code> 이 0에서 군 법칙을 깬다</h3>

- **원인** — 0은 곱셈 역원이 없다(`1/0 = Infinity`, `0 × Infinity = NaN`). 수학적으로 옳다 —
  곱셈 군은 0을 뺀 수에서만 군이다. **그리고 0이 아니어도 부동소수점이 깬다** — `a × (1/a)` 가
  정확히 1이 되려면 반올림이 상쇄돼야 해서 `49`·`1e21`·`9.571…` 같은 평범한 값에서 깨진다
  (실측). `-3`·`0.1` 은 우연히 성립한다.
- **결정 (2026-08-13, 소유자)** — (가) 문서에 경고를 넣는다. 고칠 수 있는 결함이 아니라
  **알려야 할 사실**이다.
- **검증** — `docs/internals.md#product-group` 절을 만들었고 예제가 실행된다(487개 통과).
  `49` 는 `1.0000000000000002`, `0` 은 `NaN`, 덧셈 군은 같은 값에서 정확히 `0` 이라는 대비를 담았다.
- **참고** — [`tests/staticland-laws.test.js`](./../tests/staticland-laws.test.js) 의
  `SAMPLE_OVERRIDES` — 이유가 적혀 있다

<h3 id="dist">[⏸] <code>dist/</code> 재빌드</h3>

**결정 (2026-08-13, 소유자)**: (나) 병합 직전에 한 번 한다. — 이 회차 끝에 수행했다. 지금 하면 이후 변경마다 큰
diff 가 다시 생긴다. 저장소의 기존 방식이기도 하다(`build: dist 를 현재 소스로 갱신한다`).

**그러나 병합 전에는 반드시 해야 한다.** `dist/` 는 이 브랜치 시작 시점 그대로이고,
`class Ord extends Setoid`·`FunctionFunctor`·`DefaultSetoid` 가 하나도 없다. 이대로 배포하면
**사용자가 받는 것과 소스가 다르다** — `Ord.equals` 없는 옛 동작을 받는다.

- **완료조건** — `npm run build` 후 `dist/fun-fp.js` 에 위 셋이 들어 있고 테스트가 초록.
- **검증 (2026-08-13)** — `npm run build` 로 ESM·CJS·min·`.d.ts` 넷을 만들었다. 세 산출물
  전부에 `class Ord extends Setoid`·`FunctionFunctor`·`DefaultSetoid`·`StringLengthSetoid`·
  `arrayOrdLte`·`Ord.super` 가 들어 있다. **산출물을 직접 로드해 동작도 확인했다** —
  ESM 에서 `Ord.lookup('number').equals(1,1)` `true`, `StringLengthOrd.equals('ab','cd')`
  `true`, `Either.Semigroup('string','array')` 의 Left 누적 `e1e2`; CJS 에서
  `Ord.lookup('number') instanceof Setoid` `true`. 42/42 초록.

---

## ✅ 닫힌 것

<details><summary><b>[1차-9] 컨테이너 인스턴스의 <code>.type</code> 이 게이트 밖이었다</b></summary>

<span id="1차-9"></span>

- **원인** — `.type` 게이트의 "팩토리로만 생기는 파생 인스턴스" 명단이 다섯 개짜리 고정
  목록인데, 컨테이너 `Setoid`/`Ord` 여섯이 거기 없다. **주 에이전트가 "게이트 둘을 신설해
  상당 부분 해소됐다" 고 말했는데 근거 없는 말이었다** — 새 게이트는 *메서드가 있는가*와
  *메서드끼리 맞는가*를 보지 `.type` **값**을 안 본다.
- **해결책** — `tests/algebra-type.test.js` 의 그 명단에 여섯 줄을 더한다:
  `Maybe.Setoid`·`Maybe.Ord`·`Setoid.Array`·`Ord.Array`·`Either.Setoid`·`Setoid.Struct`.
  마지막 것은 레지스트리 밖이라 이 목록이 유일한 감시자다.
- **완료조건** — 여섯 자리의 `.type` 을 비정규 소문자로 바꾸는 뮤테이션이 **전부** 잡힌다.
- **검증 (2026-08-13)** — `tests/algebra-type.test.js` 의 팩토리 명단에 여섯 줄을 더한 뒤
  하나씩 심어 확인했다. 여섯 전부 `41 passed, 1 failed`:
  `Maybe.Setoid`→`'maybe'` · `Maybe.Ord`→`'maybe'` · `Setoid.Array`→`'array'` ·
  `Ord.Array`→`'array'` · `Either.Setoid`→`'either'` · `Setoid.Struct`→`'object'`.
  매번 `cmp` 로 작업 트리 복원을 확인했고 복원 후 42/42 초록.
  (고치기 전에는 같은 뮤테이션이 42/42 초록으로 통과했다.)
- **참고** — [`review/260813-index-audit.md`](./review/260813-index-audit.md) 9번 ·
  [`tests/algebra-type.test.js:172`](./../tests/algebra-type.test.js) ·
  [`learning/INDEX.md`](./learning/INDEX.md) 규칙 31-1

</details>


<details><summary><b>레지스트리 정합성</b> — 세 항목</summary>

| 무엇 | 완료조건 | 검증 (2026-08-13) |
| --- | --- | --- |
| `lookup('default')` 를 정식 인스턴스로 | 레지스트리·`Algebra.all`·`.type` 게이트에 보인다 | `Algebra.all('any')` → `firstSemigroup,lastSemigroup,defaultSetoid,defaultOrd` · `Setoid.Array('default')` 캐시 히트 `false`→`true` |
| 컨테이너 팩토리 뼈대 통합 (손코드 4개 제거) | `baseline` 차이가 에러 메시지뿐 | 41항목 대조 → 차이 9건 전부 에러 메시지. 동작·캐시·중첩 키·등록 키 목록 32건 차이 0 |
| 인자 개수 검증 복구 | 개수 오류에 던지고 레지스트리에 `undefined` 키 0개 | `Maybe.Setoid()` → `expects 1 inner argument, got 0` (8팩토리) · `undefined` 포함 키 `[]` · 검증 제거 뮤테이션 → **41/1** |

세 번째는 두 번째가 **낸 회귀**다. 뼈대를 가변 인자로 넓히며 `[].every()` 가 공허하게 참이
되는 것을 놓쳤다. 격자에 정상 호출만 있어 `baseline` 이 못 잡았다 — **격자는 실패 경로도 담아야 한다.**

</details>

<details><summary><b>Ord 를 Setoid 로</b> — 이 회차의 본체</summary>

명세: "Ord must support Setoid algebra for the same T". 코드는 `Ord extends Algebra` 였고
타입 선언은 `extends Setoid` 라고 **거짓말**하고 있었다 — `tsc` 통과 후 런타임 `TypeError`.

| 무엇 | 완료조건 | 검증 (2026-08-13) |
| --- | --- | --- |
| `class Ord extends Setoid` + 생성자 | `Ord.lookup(k).equals` 가 함수 | `Ord.lookup('number').equals(1,1)` → `true` (전 `TypeError`) · `new Ord({}, lte, 'number')` → `Ord: argument must be a Setoid` |
| 짝 Setoid 8자리 | `lte` 동작이 HEAD 와 동일 | `baseline` 35항목 → 차이 12건 전부 의도한 것, `lte` 11건 차이 0 |
| 길이·로케일 동치를 별도 Setoid 로 | `StringLengthOrd.equals('ab','cd') === true` | 실측 `true` · 짝을 `StringSetoid` 로 바꾸는 뮤테이션 → **41/1** (`반대칭 깨짐: "ab" 와 "cd"`) |

`StringLengthOrd` 는 `'ab'` 와 `'cd'` 를 같은 자리에 놓으므로 글자 동등과 **다른 동치**를
유도한다. `StringSetoid` 를 재활용했다면 "같은 자리인데 같지 않다" 는 모순된 물건이 됐다.

**[2차-7] 은 처방을 기각하고 닫았다.** 리뷰어가 "안쪽 키로 `Setoid.Array(key)` 를 불러
공유하라" 고 했는데, 그러면 `Ord.Array(StringLengthOrd)` 의 반대칭이 깨진다(키로 조회한
`Setoid.Array('string')` 은 `equals(['ab'],['cd'])` 를 `false` 라 한다). 코드 대신 그
지름길을 막는 법칙 케이스를 넣었고, 처방을 뮤테이션으로 심으니 41/1 로 잡힌다.

</details>

<details><summary><b>게이트 셋</b>과 뮤테이션 검증</summary>

`.type` 태그(`algebra-type`) → 메서드 존재(`staticland-spec`) → 메서드끼리 맞는가
(`staticland-laws`). 셋이 서로를 검사한다 — 인스턴스를 하나 늘리면 세 곳이 동시에 멈추고
각각 이유를 요구한다.

**검증 (2026-08-13)** — 리뷰어가 뚫었던 6건 + 인자 검증 제거를 다시 심어 전부 `41 passed,
1 failed`. 목록: `DateOrd` 짝 교체 · `Ord.Array` 짝 교체 · `Maybe.Ord` 짝 교체 · 인스턴스
캐시 arity 분기 제거 · `Ord.super` 검증 끄기 · `FunctionFunctor` 합성 뒤집기 · 인자 검증 제거.
매번 `cmp` 로 작업 트리 복원을 확인했다.

리뷰어가 법칙 게이트를 **6번 뚫었고** 전부 막았다. 원인은 둘이었다:
① 참조 타입 표본에 "서로 다른 객체인데 동치인 쌍" 이 없어 반대칭 분기가 `a === b` 일 때만 탔다.
② 레지스트리 순회만 해서 팩토리 산물을 안 봤다.

부수 발견: `tests/utils.js` 의 `assertThrows` 는 "던지는가" 만 보고 두 번째 인자는 설명으로만
쓴다. 그 파일의 기존 검증 테스트들이 넘기는 정규식은 **전부 장식**이다. 메시지를 대조하려면
`assertThrowsWith` 를 써야 한다.

</details>
