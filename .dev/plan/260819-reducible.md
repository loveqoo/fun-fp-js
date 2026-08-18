# 계획 — `Reducible` 승격: 항등원 없는 접기를 클래스로

## Context — 왜 지금인가

NonEmptyList 회차의 유예 조건은 "두 번째 비공 컨테이너가 서는 순간 승격"이었다.
그 두 번째가 **이미 명부에 있다 — `Identity`.** 값 하나를 반드시 담는 컨테이너의
극한이 Identity 이고, cats 도 `Reducible[Id]` 를 준다. 새 데이터 타입을 지어낼
필요 없이 조건이 충족되므로, 소유자 지시(2026-08-19 "승격 해봅시다")에 따라
`NonEmptyList.reduceLeft/reduceMap` 정적 문을 타입 클래스로 올린다.

승격이 주는 것: "항등원 없이 접을 수 있다"가 한 타입의 재주가 아니라 **계약**이
되고, 조합자가 타입을 넘나든다 — `reduceMap(first)` 를 NonEmptyList 에도 Identity
에도 같은 문으로. MonadError 때와 같은 명부 효과.

## 설계

### 클래스 (index.js, Foldable 정의 뒤 — ChainRec·Comonad 상속 관례 그대로)

```javascript
// 명세 밖 — 비어 있을 수 없는 것의 접기. Monoid(빈 경우의 답) 없이 Semigroup 만 받는다.
class Reducible extends Foldable {
    constructor(foldable, reduceLeft, reduceMap, type, registry, ...aliases) {
        checkAndSet('Reducible.super')(foldable);
        super(foldable.reduce, type);
        unwrapIfSameType(this, foldable, 'reduce');
        checkAndSet('Reducible')(this, reduceLeft, reduceMap);
        registry && register(registry, this, ...aliases);
    }
    reduceLeft() { raise(new Error('Reducible: reduceLeft is not implemented')); }
    reduceMap() { raise(new Error('Reducible: reduceMap is not implemented')); }
}
Reducible.prototype[Symbols.Reducible] = true;
```

`Symbols.Reducible` 신설. checkAndSet 두 규칙 신설(관례 그대로):
- `Reducible.super`: `Foldable` 심볼 검사 — `'Reducible: first argument must be a Foldable'`
- `Reducible`: strict 에서 Chain 꼴 래핑 —
  `reduceLeft`: `(f, fa)` 가 (함수, 그 타입) 아니면
  `` `Reducible.reduceLeft: arguments must be (function, ${type})` ``
  `reduceMap`: 첫 인자가 Semigroup 심볼 아니면
  `'Reducible.reduceMap: first argument must be a Semigroup'`,
  나머지는 `` `Reducible.reduceMap: arguments must be (Semigroup, function, ${type})` ``

`withTypeRegistry(Reducible)`. Static Land 밖(Strong/Wander/MonadError 와 같은 취급).

### 인스턴스 둘 (+ 전제 하나)

| 타입 | reduceLeft | reduceMap | 전제 |
| --- | --- | --- | --- |
| NonEmptyList | 기존 정적 문의 몸 이동 | 〃 | 기존 NonEmptyListFoldable |
| Identity | `(f, id) => id.value` | `(sg, f, id) => f(id.value)` | **IdentityFoldable 신설** — `(f, init, id) => f(init, id.value)` (cats 의 Foldable[Id]. 지금 Identity 는 Foldable 이 없어 부모 전제부터 세운다) |

### 정적 문의 거취

`NonEmptyList.reduceLeft/reduceMap` 는 **위임으로 남긴다**(Validation.map 관례 —
데이터 타입 정적은 레지스트리 인스턴스로 위임). 몸은 클래스 게이트가 지니므로
거부 문안이 `NonEmptyList.…` 에서 `Reducible.…` 로 바뀐다 — 미발행이라 비용 0,
전용 테스트의 문안 고정을 갱신하고 CHANGELOG 미발행 절에 한 줄.

## 법칙 (게이트 편입 — CLASS_LAWS.Reducible)

Foldable 과의 **정합**이 법칙이다(cats 와 같은 접근):
1. 원소 보존 — `reduceMap(배열Sg, x => [x], fa) ≡ reduce((acc, x) => acc.concat([x]), [], fa)`
   (reduceMap 이 원소를 순서대로 전부 본다 — Foldable 의 관측과 일치)
2. reduceLeft 정합 — `reduceLeft(f, fa) ≡ reduceMap(배열Sg, x => [x], fa) 를 초기값 없이 접은 것`
3. first/last 뽑기 — `reduceMap(firstSg, id, fa)` ≡ 원소 배열의 첫 값, `lastSg` ≡ 마지막 값
   (Semigroup 이 정말 쓰인다는 관측 — ㉱류 방향 변이를 게이트가 직접 가른다)

클래스별 잠금(2). 순회 잠금 갱신(98→100 예상: Reducible 2. IdentityFoldable 은
Foldable 묶음이므로 CLASS_LAWS.Foldable 사각 여부를 구현 시 실측).

## 함께 바꾸는 파일

- `index.js` — Symbols·checkAndSet 2규칙·클래스·withTypeRegistry·IdentityFoldable·
  인스턴스 2·NEL 정적 위임 전환·export `Reducible`.
- `tests/staticland-laws.test.js` — CLASS_LAWS.Reducible + 잠금.
- `tests/nonemptylist.test.js` — 문안 갱신(Reducible 라벨), Algebra.all 12→13.
- `tests/registry-api.test.js` — TYPE_CLASSES 25→26, 테스트명.
- `tests/algebra-type.test.js` — 잠금 143→146(IdentityFoldable·Reducible 2).
- `tests/baseline-report.js` — TYPE_CLASSES·정적 표면·`.type` 행에 Reducible.
- `types/` — TypeClasses.d.ts(Reducible 인터페이스·Instances·lookup), NonEmptyList.d.ts·
  Identity 선언 등록, index.d.ts. build-types 명단은 기존 파일이라 무변.
- `docs/NonEmptyList.md` 갱신 + `docs/README.md` 표·의존성 그래프(명세 밖 절) +
  `docs/internals.md` 근거 한 줄 + CHANGELOG.
- baseline 기대: export +1(Reducible), 레지스트리 키(+Reducible 4키 + Foldable 에
  IdentityFoldable 2키), `.type` 행 신설, Algebra.all(identity·nonemptylist 행),
  정적 표면 +1행. **없어진 것 0** (정적 문은 위임으로 존속).
- dist 재빌드(기능 커밋 → 빌드 → dist 커밋). `.dev/TODO.md` 유예 항목 닫힘.

## 검증

뮤테이션 5종 — ㉮ reduceMap 이 head 를 건너뜀 → 법칙 1·3 ㉯ Semigroup 무시하고
마지막 값 반환 → 법칙 3(first) ㉰ Identity 의 reduceMap 이 f 를 안 부름 → 법칙 1
㉱ 캐리어 검사 제거 → 문안 테스트 ㉲ IdentityFoldable 의 reduce 가 init 무시 →
Foldable 정합. 전체 게이트 + baseline + dist. 복원은 표적 치환.

## 절차 (관례)

코덱스 계획 리뷰 → 반영(v2) 보고 → 구현(테스트 선행) → 검증 전부 → 코덱스 구현
리뷰 → TODO. 커밋·푸시는 소유자 지시.

## 하지 않는 것

- 새 비공 데이터 타입 발명 — Identity 가 조건을 이미 충족한다.
- `foldMap1`/`reduce1` 이름 부활 — 소유자 결정(숫자 접미사 폐기) 유지.
- Foldable 전 인스턴스에 Reducible 확장 — 비어 있을 수 있는 타입(Array·Maybe)은
  구조적으로 자격이 없다. 그 부재가 이 클래스의 뜻이다.

---

## v2 — 코덱스 계획 리뷰 반영 (Blocker 2 · Major 7 · Minor 3, 2026-08-19)

**[B1] 법칙 비교는 결과 종류별 EQ 로.** `same(obs, …)` 재사용은 공허해진다(결과가
컨테이너가 아니라 배열·원소 — Identity 의 obs 는 둘 다 undefined 로 열어 무엇이든
통과, 실행 증명). 원소 보존은 배열 JSON, reduceLeft·first/last 는 원소 EQ(표본이
숫자이므로 Object.is). `reduce((acc,x)=>acc.concat([x]),[],u)` 로 뽑은 원소 배열이
기준값이다(Foldable 정합이 곧 법칙). reduceLeft 정합식 확정:
`reduceLeft(f, u) ≡ elems.slice(1).reduce(f, elems[0])`.

**[B2] `tests/staticland-spec.test.js` 를 변경 목록에 추가.** README 그래프에
Reducible 을 그리면 SPEC 표와 어긋나 검사 ⑤가 빨강. SPEC 에
`{ sameT: ['Foldable'], spec: false }` 로 편입하고, 단일 문자열인 `method` 가
`reduceLeft`·`reduceMap` 둘을 잠글 수 있게 배열 허용으로 게이트를 확장한다(기존
항목은 무변).

**[M] 문안·검증 정정** — super 규칙 문안은 단일 부모 관례로
`'Reducible: argument must be a Foldable'`. checkAndSet 'Reducible' 규칙은 생성 시
두 구현이 함수인지 먼저 검증(`'Reducible: reduceLeft must be a function'` 꼴, Foldable
규칙과 같은 순서) 후 호출 래퍼 설치.

**[M] 판정력의 분업 명시** — Identity 표본(단일 원소)은 원소 보존만 가르고,
reduceLeft 방향·Semigroup 사용·first/last 구분은 **다원소 NEL 표본 몫**이다.
뮤테이션 기대도 클래스별로 구분해 적는다.

**[M] 잠금 정정** — staticland 순회 98→**101**(IdentityFoldable 이 Foldable 순회에
+1, Reducible +2). algebra-type 143→146, registry-api 25→26,
Algebra.all: identity 5→**7**, nonemptylist 12→**13**(행 수 기준 — "키 2개"는
레지스트리 키 수 표현이었음을 정정).

**[M] 낡은 명부 문구 동반 수리** — `tests/identity.test.js` "다섯 인스턴스" 잠금
5→7, `docs/README.md` 의 Identity 등록 명부("세 곳" — 이미 낡아 있음)를 7개 실물로
정정. `foldMap(Foldable.lookup('identity'), …)` 가 합법화되는 것은 새 공개 능력이므로
동작 테스트와 문서 한 줄을 넣는다. NEL 문서는 "접기의 소유자는 Reducible 인스턴스,
정적 문은 위임"으로 재서술.

**[설계 판단 정정 — 시간 논거]** "두 번째가 이제 섰다"는 틀렸다. Identity 는
2026-08-15 부터 공개 데이터 타입이었고 유예 조건 기록(08-18)보다 먼저다. 사실은:
**유예 당시 Identity 를 후보에서 빠뜨린 누락**이었고, 이번 승격은 그 누락을 발견한
소유자의 별도 결정(2026-08-19 "Identity 포함으로 진행")이다. 조건 문구가 아니라
이 결정이 승격의 근거다.

---

## v3 — 구현 중 결정 변경 기록 (2026-08-19, 구현 리뷰 Major 1 반영)

**[B2 해소 방식 변경]** v2 는 SPEC 표 편입 + method 배열 확장을 지시했으나, 구현
시점에 **MonadError 선례**(SPEC 표·README 그래프 불포함, 검사 ⑤(b) 필터가 d.ts
선언을 자동 무시)를 발견해 그 길로 풀었다 — spec 게이트 무변경으로 정합하며 검사
⑤·⑥ 통과를 구현 리뷰가 실행 확인했다. v2 의 B2 문구는 이 기록으로 대체된다.

**[잠금 산술 정정]** v2 의 algebra-type 143→146 은 낡은 수치 — MonadError 동반
수리(그 회차 누락 +2)를 포함해 **143→148** 이 실측이다(구현 리뷰 산술 검증).
