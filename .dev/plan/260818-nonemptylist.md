# 계획 — `NonEmptyList`: 비어 있을 수 없는 목록

## Context — 왜 하는가

빈 입력의 가능성 때문에 반쪽으로 남은 자리가 셋 있다(전부 실측, 2026-08-18):

1. **배열 Comonad 가 법칙을 표본 필터로 가리고 있다.** `extract([])` 는 `undefined`
   를 주고 법칙(`extract(extend(f, w)) ≡ f(w)`)이 빈 배열에서 깨진다. 게이트는
   `tests/staticland-laws.test.js:737` 에서 빈 배열을 표본에서 걸러 초록을 유지한다
   — 정직하게 주석까지 달았지만, 가림이지 채움이 아니다.
2. **`first`·`last` Semigroup 이 접기에 못 들어간다.** Semigroup 12 : Monoid 10 —
   짝 없는 둘이 정확히 `FirstSemigroup`·`LastSemigroup` 이다. `foldMap` 은 Monoid
   를 요구하므로(`foldMap: second argument must be a Monoid`) "첫 원소로 접는다"가
   표현 불가능하다. 같은 이유로 max/min 은 바닥값(`-Infinity`)이 있는 숫자에만 있다.
3. 컨테이너가 비어 있지 않음을 **타입이 보증하는 자리가 없다** — 매번 `Maybe` 로
   감싸거나 호출자가 검사한다.

소유자 결정(2026-08-18): 범위를 좁게 — **데이터 타입 + 인스턴스 + `reduce1`/
`foldMap1` 까지만.** Validation 오류 자리 교체는 하지 않는다.

## 설계

### 데이터 타입 (index.js, `/* NonEmptyList */` 구역 — Validation 구역 뒤)

표현은 **`head` + `tail`(배열)** — 비어 있지 않음이 검사가 아니라 **구조로** 보증된다.
`Validation` 구역의 관례(클래스 + `_typeName` + `Symbols` + 정적 문)를 그대로 따른다.

```javascript
class NonEmptyList {
    constructor(head, tail) {
        Array.isArray(tail) || raise(new TypeError('NonEmptyList: tail must be an array'));
        this.head = head; this.tail = tail; this._typeName = 'NonEmptyList';
    }
}
NonEmptyList.prototype[Symbols.NonEmptyList] = true;
NonEmptyList.of = x => new NonEmptyList(x, []);
NonEmptyList.make = (head, ...rest) => new NonEmptyList(head, rest);
NonEmptyList.fromArray = xs => (Array.isArray(xs) && xs.length > 0)
    ? Maybe.Just(new NonEmptyList(xs[0], xs.slice(1))) : Maybe.Nothing();   // 빈 것은 Nothing
NonEmptyList.isNonEmptyList = x => x != null && x[Symbols.NonEmptyList] === true;
NonEmptyList.prototype.toArray = function () { return [this.head, ...this.tail]; };
NonEmptyList.prototype.last = function () {
    return this.tail.length ? this.tail[this.tail.length - 1] : this.head; };
```

`Symbols.NonEmptyList: Symbol.for('fun-fp-js/NonEmptyList')` 를 데이터 타입 심볼
묶음(Validation 뒤)에 추가. `types.of` 는 `_typeName` 을 먼저 보므로(index.js:66)
`types.check(v, 'NonEmptyList')` 는 추가 작업 없이 작동한다(실측 관례 확인).

### 접기 둘 — Monoid 없이 (이 회차의 핵심 문)

타입 클래스 신설 없이 **데이터 타입 정적 문**으로 둔다(`Validation.collect` 와 같은
층). Foldable1 클래스는 대상이 하나뿐이라 계단 값이 없다 — MonadError 때
ApplicativeError 를 안 만든 것과 같은 판단.

```javascript
NonEmptyList.reduce1 = (f, nel) => { /* head 를 초기값으로 tail 을 접는다 */ };
NonEmptyList.foldMap1 = (semigroup, f, nel) => { /* empty 없이 concat 만으로 */ };
```

- `reduce1`: `f` 가 함수가 아니면 `TypeError('NonEmptyList.reduce1: first argument
  must be a function')`. `nel` 이 NonEmptyList 아니면 `TypeError('NonEmptyList.reduce1:
  second argument must be a NonEmptyList')`.
- `foldMap1`: 첫 인자가 `Symbols.Semigroup` 인스턴스가 아니면 `TypeError(
  'NonEmptyList.foldMap1: first argument must be a Semigroup')`. 나머지 인자 검증은
  reduce1 과 같은 꼴(`f`/`nel` 각각 라벨 거부).
- 성립 확인(테스트로): `foldMap1(Semigroup.lookup('first'), x => x, nel)` = 첫 원소,
  `'last'` = 마지막 원소 — **명부의 짝 없는 Semigroup 둘이 처음으로 접기에 들어간다.**

### 인스턴스 11개 — 그리고 의도된 부재 4개

이름 관례 `NonEmptyList<클래스>` + 별칭 `'nonEmptyList'`(register 가 소문자로 내려
저장 키는 `nonemptylist` — Algebra.all 의 소문자 규칙과 일치, 실측 확인).

| 클래스 | 몸 | 비고 |
| --- | --- | --- |
| Functor | head 에 f, tail 에 map | |
| Apply | 모든 짝 (f, x) — 배열과 같은 데카르트 곱 | 결과도 비지 않음 |
| Applicative | `of` = 원소 하나 | |
| Chain | 각 원소의 결과(NEL)를 이어붙임 | 비지 않음이 보존된다 |
| Monad | Applicative + Chain | |
| Semigroup | `concat(a, b)` = a 뒤에 b | `type: 'NonEmptyList'` |
| Alt | `alt = concat` | 결합·분배 법칙 성립(배열과 동형) |
| Foldable | `reduce(f, init, nel)` — toArray 접기 | 기존 `foldMap` 과도 결합됨 |
| Traversable | head·tail 을 applicative 로 꿰매 NEL 로 복원 | |
| Extend | `extend(f, w)` = 접미사들(각각 NEL)에 f | 길이 보존 |
| Comonad | `extract` = head — **전체 정의된 온전한 함수** | 표본 필터 불필요 |

**의도된 부재(문서에 명시)** — 이 타입의 존재 이유가 이 부재다:
- **Monoid 없음** — 항등원은 빈 목록인데 그것이 없다. `first`/`last` 와 같은 처지가
  되어, "Semigroup 이지만 Monoid 아님"이 추상 인스턴스 둘이 아니라 만질 수 있는
  데이터 타입으로 명부에 선다.
- **Plus·Alternative 없음** — `zero()` 가 빈 목록이다. Alt 만 있는 첫 컨테이너.
- **Filterable 없음** — 거르면 비어질 수 있다. 거르고 싶으면 `toArray` 로 나가는
  것이 정직한 경로다.

### 공개 표면

최상위 `NonEmptyList`. 정적: `of`, `make`, `fromArray`, `isNonEmptyList`, `reduce1`,
`foldMap1`, 위임 정적(`map`·`chain` 등은 Validation 관례에 맞춰 필요한 만큼).
프로토타입: `toArray`, `last`(+ `head`/`tail` 는 필드). 기존 문 이동·개명 없음.
배열 Comonad 는 **그대로 둔다**(제거는 호환 파괴 — 별개 결정). 다만 게이트의 표본
필터 주석에 "온전한 자리는 NonEmptyList" 한 줄을 덧붙인다.

## 함께 바꾸는 파일

- `index.js` — 심볼 + 데이터 타입 + 인스턴스 11 + export (`Maybe` 옆).
- `tests/staticland-laws.test.js` — `FUNCTOR_SAMPLES`/`OBSERVE`/`EQUALS`/`PURE` 에
  NonEmptyList 표본(1원소·다원소), 순회 잠금 88→(구현 시 확정, 계획상 +11 클래스
  편입분), Comonad 필터 주석 한 줄.
- `tests/nonemptylist.test.js`(신설) — 생성·`fromArray([])→Nothing`·reduce1/foldMap1
  (first/last 실증 포함)·거부 문안 전건·last/toArray.
- `tests/baseline-report.js` — 데이터타입 정적 표면 행에 `'NonEmptyList'` 추가.
- `tests/registry-api.test.js` — `DATA_TYPES` 에 추가(8→9), 테스트명 수 갱신.
- `types/data/NonEmptyList.d.ts`(신설) + `types/index.d.ts` + `TypeClasses` 인스턴스
  선언 + **`build-types.js` 손 명단에 추가**(빠지면 배포 d.ts 에서 조용히 빠진다 —
  internals 의 함정 문서 그대로. 양방향 대조 검사가 있어 누락은 빨강으로 잡힌다).
- `docs/NonEmptyList.md`(신설, 실행 예제 3: fromArray/Maybe 경계 · foldMap1+first/last
  · extract 가 항상 값을 줌) + `docs/README.md` 학습 순서·표 + CHANGELOG 미발행 절.
- `dist/` 재빌드(기능 커밋 → 빌드 → dist 커밋). `.dev/TODO.md`.

## 검증

1. **법칙 게이트** — 신규 표본으로 11개 클래스 전 법칙, Comonad 는 필터 없이 통과.
2. **뮤테이션 6종** — ㉮ `fromArray` 의 빈 검사 제거(빈 NEL 생성) → 전용 테스트 빨강
   ㉯ `extract` 가 head 대신 last → Comonad 법칙 빨강 ㉰ `extend` 가 접미사 대신 전체
   반복 → Comonad/Extend 법칙 빨강 ㉱ `concat` 순서 뒤집기 → foldMap1 first/last 실증
   빨강(결합법칙만으로는 못 잡는다 — 그래서 실증 테스트가 게이트다) ㉲ `foldMap1` 의
   Semigroup 심볼 검사 제거 → 문안 검사 빨강 ㉳ `traverse` 가 순서를 뒤집음 →
   Traversable 법칙 빨강. 각각 **표적 치환으로 복원**(260818 회고 — checkout 금지).
3. **전체 게이트** — `npm test` 48 + 타입체크, 문서 예제, baseline(기대: 최상위 export
   +1, 데이터타입 정적 표면 +1행, 레지스트리 키 클래스당 +2(이름+별칭)×11, Algebra.all
   에 `nonemptylist` 묶음 신설, **없어진 것 0**), dist 재빌드.

## 절차 (관례)

코덱스 계획 리뷰 → 반영(v2) 보고 → 소유자 승인 → 구현(테스트 선행) → 검증 전부 →
코덱스 구현 리뷰 → TODO 기록. 커밋·푸시는 소유자 지시.

## 하지 않는 것

- **Validation 오류 자리 교체** — 호환 파괴, 별개 결정(소유자 확정).
- **Foldable1/Semigroup1 타입 클래스** — 대상이 하나뿐, 계단 값 없음.
- **ChainRec** — chainRec 의 존재 이유는 깊은 재귀의 스택 안전인데, NEL 의 chain 은
  매 걸음 목록이 자라 스택보다 결과 크기가 먼저 문제가 된다 — 스택 안전이 주는
  구조적 이득이 성립하지 않는 자리다.
- **배열 Comonad 제거** — 호환 파괴. 게이트 주석으로 관계만 남긴다.
- **컨테이너 Setoid/Ord 팩토리**(`Setoid.NonEmptyList('number')`) — N값 컨테이너는
  내부 슬롯을 갖지 않는다는 타입 규칙(소유자 재정, 2026-08-15)과 같은 자리. 필요해지면
  Array 팩토리와 같은 문으로 별도 회차.

---

## v2 — 코덱스 계획 리뷰 반영 (Blocker 2 · Major 6 · 범위 재결정 2, 2026-08-18)

**[Blocker 1] 게이트 표 이름을 실물로 정정.** 편입 대상은 `FUNCTOR_SAMPLES/OBSERVE/
EQUALS/PURE` 가 아니라 **`SAMPLES` · `EQ` · `OBSERVE` · `FUNCTOR_SAMPLES` · `OF`** 다
(staticland-laws:94·122·176·197·383). 특히 Semigroup 법칙은 `SAMPLES.NonEmptyList` 와
`EQ.NonEmptyList` 가 없으면 아예 돌지 않는다. `DEGENERATE` 는 넣지 않는다 — 빈 값이
없는 것이 이 타입이다.

**[Blocker 2] Extend/Comonad 검사 함수가 NEL 을 못 본다.** 현재 `ff`/`gg` 는
`Array.isArray(w)` 일 때만 내용을 읽어 NEL 에서는 항상 0 — 올바른 접미사 구현과
"전체 반복" 뮤테이션이 **둘 다 초록**임을 코덱스가 실행으로 증명했다. `ff`/`gg` 를
캐리어별로 분기(NEL 은 `toArray()` 를 읽음)하도록 고친다. 뮤테이션 ㉰ 은 이 수리
후에만 유효하다.

**[Major 3] 뮤테이션 ㉱ 교체.** NEL 의 `concat`(컨테이너 결합)과 `foldMap1` 의
first/last(원소 Semigroup)는 서로 독립 — concat 을 뒤집어도 foldMap1 은 불변(실행
증명: `NEL_CONCAT [1,2,3,4]↔[3,4,1,2]` 에서 `FOLDMAP_FIRST_LAST 1 3` 동일). 잡는
게이트는 **방향 고정 테스트**: `concat(make(1,2), make(3,4)).toArray() ≡ [1,2,3,4]`
(Alt 도 같은 몸이므로 함께 고정된다).

**[Major 4] 순회 잠금 예상 정정** — `checked` 88→**97**(CLASS_LAWS 는 Functor·
Semigroup 을 따로 세므로 11 중 9만 가산), Functor 독립 잠금 12→**13**, Semigroup
독립 잠금 13→**14**. 구현 시 실측으로 확정.

**[Major 5·6] 손 명단 두 곳 추가** — `WANDER_TARGETS`(Array/Maybe/Either 손 열거)에
NEL 을 넣어 `wander ≡ map`/`wander ≡ foldMap` 투영 검증에 편입, `FOLD_ORDER_ANCHOR`
에 NEL 기준 순서를 넣어 방문 순서 회귀를 감시.

**[Major 7] baseline 기대 구분** — 레지스트리 키 +2×11 = 22 는 등록 총량이고,
baseline 의 **직접 열거 행**(Functor/Apply/Applicative/Monoid/Semigroup)에는 그중
4클래스 8키만 보인다. 나머지는 「모든 레지스트리 키」·「지연 등록 후」 두 행(전
클래스 순회, MonadError 회차에 신설된 guard 포함)에서 관측된다. 구현 시 실측 대조.

**[Major 8] 인스턴스 초안을 실물 서명으로 명시** — 전부 이웃(Array*)과 같은 꼴:

```javascript
class NonEmptyListFunctor extends Functor {
    constructor() { super((f, w) => new NonEmptyList(f(w.head), w.tail.map(f)),
        'NonEmptyList', Functor.types, 'nonEmptyList'); }
}
class NonEmptyListApply extends Apply {          // Apply(functor, ap, type, registry, alias)
    constructor() { super(Functor.types.NonEmptyListFunctor, (ff, fa) => {
        const out = [];
        for (const f of ff.toArray()) for (const x of fa.toArray()) out.push(f(x));
        return new NonEmptyList(out[0], out.slice(1));
    }, 'NonEmptyList', Apply.types, 'nonEmptyList'); }
}
class NonEmptyListApplicative extends Applicative {   // (apply, of, ...)
    constructor() { super(Apply.types.NonEmptyListApply, x => NonEmptyList.of(x),
        'NonEmptyList', Applicative.types, 'nonEmptyList'); }
}
class NonEmptyListChain extends Chain {          // (apply, chain, ...)
    constructor() { super(Apply.types.NonEmptyListApply, (f, fa) => {
        const out = [];
        for (const x of fa.toArray()) { const r = f(x); out.push(r.head, ...r.tail); }
        return new NonEmptyList(out[0], out.slice(1));
    }, 'NonEmptyList', Chain.types, 'nonEmptyList'); }
}
class NonEmptyListMonad extends Monad {          // (applicative, chain, ...)
    constructor() { super(Applicative.types.NonEmptyListApplicative,
        Chain.types.NonEmptyListChain, 'NonEmptyList', Monad.types, 'nonEmptyList'); }
}
class NonEmptyListSemigroup extends Semigroup {  // (concat, ...)
    constructor() { super((a, b) => new NonEmptyList(a.head, [...a.tail, b.head, ...b.tail]),
        'NonEmptyList', Semigroup.types, 'nonEmptyList'); }
}
class NonEmptyListAlt extends Alt {              // (functor, alt, ...)
    constructor() { super(Functor.types.NonEmptyListFunctor,
        (a, b) => Semigroup.types.NonEmptyListSemigroup.concat(a, b),
        'NonEmptyList', Alt.types, 'nonEmptyList'); }
}
class NonEmptyListFoldable extends Foldable {    // (reduce, ...)
    constructor() { super((f, init, w) => w.toArray().reduce(f, init),
        'NonEmptyList', Foldable.types, 'nonEmptyList'); }
}
class NonEmptyListTraversable extends Traversable {   // (functor, foldable, traverse, ...)
    constructor() { super(Functor.types.NonEmptyListFunctor, Foldable.types.NonEmptyListFoldable,
        (A, f, w) => w.toArray().reduce(
            (acc, x) => A.ap(A.map(xs => y => [...xs, y], acc), f(x)), A.of([]))
        /* 마지막에 A.map(arr => new NonEmptyList(arr[0], arr.slice(1)), …) 로 복원 */,
        'NonEmptyList', Traversable.types, 'nonEmptyList'); }
}
class NonEmptyListExtend extends Extend {        // (functor, extend, ...)
    constructor() { super(Functor.types.NonEmptyListFunctor, (f, w) => {
        const arr = w.toArray();
        const out = arr.map((_, i) => f(new NonEmptyList(arr[i], arr.slice(i + 1))));
        return new NonEmptyList(out[0], out.slice(1));
    }, 'NonEmptyList', Extend.types, 'nonEmptyList'); }
}
class NonEmptyListComonad extends Comonad {      // (extend, extract, ...)
    constructor() { super(Extend.types.NonEmptyListExtend, w => w.head,
        'NonEmptyList', Comonad.types, 'nonEmptyList'); }
}
```

(Traversable 의 복원 주석 자리는 구현에서 완성 — 초안의 요지는 인자 순서와 의존
인스턴스 참조가 실물과 같다는 것.)

**[범위 재결정 1 — ChainRec]** v1 의 제외 근거("결과가 자라 스택보다 먼저 문제")는
**틀렸다** — 매 걸음 크기 1 을 유지하는 재귀가 가능하므로 스택 안전 이득은 실재한다
(코덱스 반례 인정, 철회). 재결정: **이번 회차 유예, 근거는 회차 규모** — 표준 인스턴스
완결성 항목으로 TODO 에 남기고, 닫는 조건은 "ChainRec 편입 또는 편입하지 않기로 한
소유자 결정 기록".

**[범위 재결정 2 — Foldable1]** "대상이 하나뿐"은 YAGNI 금지와 긴장한다는 지적을
인정. 소유자 결정 사항으로 승격 — 선택지: (A) 지금 `Foldable1` 클래스 신설(reduce1 이
클래스 문이 되고 NEL 이 첫 등록) (B) 정적 문으로 시작하되 **승격 조건을 기록**(두
번째 비공 컨테이너가 서는 순간 클래스로 승격 — MonadError 때 ApplicativeError 를
유예한 것과 같은 꼴). 권고는 B.

**리뷰가 확인해 준 것(변경 없음)** — Apply 데카르트곱 ≡ chain 유도(실행 증명),
Alt 분배·접미사 Extend·head extract 표준 구성, Monoid/Plus/Alternative/Filterable
부재의 구조적 타당성(Filterable 법칙이 "모두 거른 결과 동일"을 요구 — 닫힌 filter
불가), 심볼·등록·별칭 소문자화·build-types 함정 서술 정확.

---

## v3 — 소유자 결정 (2026-08-18, 구현 착수 기준)

1. **이름** — 숫자 접미사 폐기. `reduce1`→**`reduceLeft`**, `foldMap1`→**`reduceMap`**,
   승격 시 클래스명은 **`Reducible`**(cats 실물 이름). 거부 문안도 같은 이름으로:
   `NonEmptyList.reduceLeft: ...` / `NonEmptyList.reduceMap: ...`.
2. **Reducible 클래스는 유예** — 정적 문으로 시작. 승격 조건 기록: 두 번째 비공
   컨테이너가 서는 순간 클래스로 승격.
3. **ChainRec 유예** — 닫는 조건: 편입 또는 편입하지 않기로 한 소유자 결정 기록.
