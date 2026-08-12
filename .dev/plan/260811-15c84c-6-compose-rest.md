# 회차 6 — 남은 손코드 5건 + 20배 성능

회차 5 리뷰(위반 8건)의 1·2·3순위를 처리한다.

## A. 조합으로 대체 — 5건 (리뷰어 치환 실증 완료)

전부 리뷰어가 바꿔서 **38/38 통과 + baseline 차이 0** 을 확인한 것들이다.

| 위치 | 지금 | 조합 |
| --- | --- | --- |
| `forgetProfunctor.first` | `p => ([a,_c]) => p(a)` + **거짓 주석** | `p => t => p(Comonad.of('array').extract(t))` |
| `composeOptic` | `optics.reduceRight((acc,o) => o(P)(acc), pab)` | `compose(...optics.map(o => o(P)))(pab)` |
| `set` | `over(optic, () => b, s)` | `over(optic, constant(b), s)` |
| `taggedProfunctor.left` | `p => Either.Left(p)` | `Either.Left` |
| `traversed` | `(F,f,s) => instance.traverse(F,f,s)` | `instance.traverse` |

**`composeOptic` 의 인자 검증 루프는 남긴다** — `compose` 는 `o(P)` 결과만 보므로
`composeOptic: argument ${i}` 의 인덱스 진단을 잃는다.

`forgetProfunctor.first` 의 거짓 주석("fst 는 레지스트리에 없다")을 지우고, 대신
"`Comonad.of('array').extract` 가 배열의 head 라 2-튜플에서는 fst 다" 로 바꾼다.

## B. 20배 — 이중 래핑 제거 (회차 8 → 6으로 당김)

회차 5에서 실측: `preview` **20.3배**, `toListOf` 3.8배, `over` 2.4배.

리뷰어가 원인을 분해했다 — **조합이 아니라 클래스 생성자 체인**이다:

```javascript no-run 현재 — 같은 함수를 두 번 감싼다
class Apply extends Functor {
    constructor(functor, ap, ...) { super(functor.map, type); ... }
    //                                    ^^^^^^^^^^^ 이미 래핑된 것을 다시 래핑
}
class Applicative extends Apply {
    constructor(apply, of, ...) { super(apply, apply.ap, type); ... }
    //                                         ^^^^^^^^ 같음
}
```

`Alternative` 가 이미 **재래핑을 피하는 선례**를 갖고 있다(`index.js:594` `this.alt = plus.alt`).

**이것은 optics 전용이 아니라 타입 클래스 전체에 닿는다.** 그래서 별도 커밋으로 나누고,
**전후를 같은 벤치로 재서 회고에 숫자를 남긴다**(규칙 74).

측정 격자(100원소 배열, 20000회): `preview` / `toListOf` / `over` / 합성 `toListOf` /
`view` Lens. HEAD · 회차 5 · 회차 6 세 시점을 비교한다.

**바깥 겹이 안쪽보다 검사가 약하거나 같다는 것을 먼저 실증한다** — 그래야 제거가
안전성을 낮추지 않는다는 근거가 된다. 아니면 하지 않는다.

## C. `identity`/`const` Applicative 등록 (리뷰 #3 — 유일한 게이트)

회차 5 리뷰 #7: **이번 회차의 두 핵심 주장 모두 뮤테이션으로 안 잡힌다.**
`bimap` 조합 되돌리기도, **심볼 위조 복원도** 38/38 통과.

관측 동등이라 원리적으로 못 잡는다. **등록만이 게이트를 만든다** — `Applicative.of('identity')`
로 꺼낼 수 있으면 `instanceof Applicative`·검사 동작을 테스트로 고정할 수 있다.

```javascript no-run 변경안
class IdentityApplicative extends Applicative {
    constructor() { super(new Apply(new Functor(...), ...), v => ({ value: v }),
                          'Object', Applicative.types, 'identity'); }
}
modules.push(IdentityApplicative);
// Const 는 매개변수화 — Maybe.Monoid(innerSG) 선례대로 _instanceCache
Applicative.Const = monoid => { ... };
```

테스트: `Applicative.of('identity') instanceof Applicative`,
`Applicative.of('identity').map(1, {value:1})` 이 던지는지(심볼 위조로는 안 던진다),
`Applicative.Const(m)` 캐시 동일성.

**이 테스트가 있으면 심볼 위조 복원이 빨간불이 된다** — 회차 5에 없던 게이트다.

## Verification

1. `npm run baseline` — **A 는 관측 동등이어야 한다**(차이 12건 그대로)
2. **성능 3시점 비교표** — HEAD / 회차 5 / 회차 6. B 의 효과를 숫자로
3. `npm test` + `tsc`
4. **뮤테이션**: ① `identityApplicative` 를 심볼 위조로 복원 → **이번엔 잡혀야 한다**(C 의 목적)
   ② B 의 재래핑 제거를 되돌리기 → 안 잡히는 것이 정상(관측 동등), 대신 성능표로 본다
5. `staticland-reviewer` → 회차 5의 8건 대조

## 범위 밖 — 다음 회차

| 회차 | 범위 |
| --- | --- |
| 7 | optics 모듈 객체 + bare export 11개 + `optics.foldMapOf` |
| 8 | `docs/` 의 `plus(` 0건 · `plus(maybe)` 이름 · `plus(array)` 중복 |

## 되돌리는 법

A · B · C 별도 커밋. **B 만 타입 클래스 전체에 닿는다.**
