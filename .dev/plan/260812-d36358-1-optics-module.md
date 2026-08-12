# optics 를 모듈 객체로

## 왜 지금

`CLAUDE.md` 「폐기된 판단」이 **"최상위 bare export 11개"** 를 YAGNI 의 청구서로 기록하고
있고, 앞 작업의 계획서가 이 항목을 **여섯 회차 연속** 다음으로 밀었다.

Static Land 의 첫 번째 이점이 "No name clashes" 인데 `set`·`over`·`view` 는 전역에 두면
안 되는 대표적인 흔한 이름이다.

## 파급 범위 — 호출 200여 곳이 아니라 구조분해 39줄이다

```
구조분해로 가져오는 블록: 38   ← const { Lens, view } = FunFP;  를 = FunFP.optics; 로
프리앰블에 의존하는 블록 :  1   ← 구조분해 줄을 추가해야 한다
```

`tests/optics.test.js` 도 파일 상단에서 한 번만 구조분해한다.

## 변경 사항

### A. `optics` 모듈 객체 — `transducer` 선례를 따른다

`transducer` 가 IIFE 로 묶어 모듈 객체 하나만 내보내는 것과 같은 모양으로 간다.
**모듈 안이므로 이름을 줄인다** — 길게 지은 것 자체가 네임스페이스가 없다는 증거였다.

| 지금 (최상위) | 모듈 안 |
| --- | --- |
| `composeOptic` | `compose` |
| `toListOf` | `toList` |
| 나머지 9개 | 그대로 |
| — | **`foldMapOf` 신설** |

```javascript no-run 결과
const { optics } = FunFP;
optics.Lens(getter, setter)
optics.view(lens, s)
optics.compose(a, b)
optics.toList(optic, s)
optics.foldMapOf(Monoid.of('number'), traversed('array'), [1,2,3])   // 6
```

**`optics.compose` 가 최상위 `compose` 와 이름이 같아도 충돌하지 않는다** — `transducer.map`
이 그런 것과 같다.

### B. 최상위 bare export 11개 **삭제** (사용자 승인)

`Iso Lens Prism traversed composeOptic view preview toListOf review set over` → 전부 제거.
버전이 0.0.0 이고 이번 작업의 목적 자체가 이름 충돌 제거다. 둘 다 남기면 목적이 달성되지
않고 사용자가 어느 쪽을 쓸지 모른다.

`npm run baseline` 격자의 「최상위 export 키」 줄이 **11개 감소 + 1개 증가**를 자동으로 잡는다.

### C. `foldMapOf(monoid, optic, s)` 신설 — 입구

`preview`/`toList` 는 Monoid 가 함수 안에 박혀 있어 **사용자가 다른 방식으로 모을 수 없다.**
회차 1 리뷰 #4 가 "주석이 주장하는 이득이 코드에 없다" 고 지적한 것의 실제 해결이다.

```javascript no-run 변경안
const foldMapOf = (monoid, optic, s) =>
    runOptic('foldMapOf', optic, forgetProfunctor(monoid), a => a, s);
// toList 는 그 특수 경우가 된다
const toList = (optic, s) => foldMapOf(Monoid.of('array'), optic, a => [a], s);
```

**주의**: `forgetProfunctor` 의 `pab` 는 `a => r` 이므로 `foldMapOf` 는 `a` 를 그대로 r 로
쓴다. `toList` 는 `a => [a]` 로 감싸야 하므로 **시그니처가 다르다** — 실행으로 확인한 뒤
형태를 정한다. 필요하면 `foldMapOf(monoid, f, optic, s)` 로 `f` 를 받는다
(Haskell `foldMapOf :: Monoid r => Fold s a -> (a -> r) -> s -> r` 이 그렇다).

**이름이 `foldMap` 이 아니어야 한다** — `index.js:1959` 에 `foldMap(foldable, monoid)` 가
이미 있고 최상위 export 이며 `docs/Foldable.md` 가 문서화한다. 회차 4 리뷰 #6 이 지적했다.

### D. 타입 선언

`types/Lens.d.ts` 가 11개를 개별 `export declare function` 으로 선언한다. 모듈 객체 형태로
바꾸고 `types/index.d.ts` 의 재수출도 맞춘다. `tsc --noEmit` 통과가 조건이다.

### E. 문서

`docs/Optics.md`(24블록) · `docs/Lens.md`(14블록) 의 구조분해 줄을 `= FunFP.optics;` 로,
프리앰블 의존 1블록에 구조분해 추가. `CLAUDE.md` 의 optics 절도.

`docs/` 는 사람 영역이라 **`harness allow` 로 먼저 승인받는다.**

## Verification

1. `node -e "..."` 로 `optics` 모듈의 12개 키 존재 확인, 최상위 11개 부재 확인
2. **`npm run baseline`** — 「최상위 export 키」 줄이 11 감소 + 1 증가.
   **다른 줄은 전부 그대로여야 한다**(이름만 바뀌는 것이므로 동작은 동일)
3. `foldMapOf` 로 `Monoid.of('number')` 합계를 내는 테스트
4. `npm test` + `tsc` + 문서 예제 검사기
5. **뮤테이션**: `optics` 객체에서 키 하나를 빼면 테스트가 잡는가
6. `staticland-reviewer` — **`run_in_background: true` 로 돌린다**(규칙 21).
   결과를 `.dev/review/` 에 남긴다

## 되돌리는 법

A(모듈 신설) · B(bare export 제거) · C(`foldMapOf`) · D+E(타입·문서)를 별도 커밋으로.
**B 만 사용자 코드를 깬다.**

## 범위 밖

- `Strong`/`Choice`/`Wander` 를 타입 클래스로 (별도 작업)
- `docs/` 의 `plus(` 0건 (별도)
- 앞 작업 회차 6의 미검증 변경 — `unwrapIfSameType` 리뷰 (별도)
