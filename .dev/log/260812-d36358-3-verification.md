# Verification — 회차 3 (등록 계층)

## 계획서 조건 대조

| # | 조건 | 판정 | 근거 |
| --- | --- | --- | --- |
| 1 | `Functor.of('identity')` · `Apply.of` · `Applicative.of` | ✅ | 셋 다 OK. 3단 등록 완료 |
| 1 | `Applicative.of('const(array)')` | ⚠ **부분** | `Applicative.Const('array')` 를 **부른 뒤에만** 동작 — 아래 |
| 2 | 격자에 레지스트리 줄 추가 | ✅ | `Functor.types`/`Apply.types`/`Applicative.types` 3줄 추가, 61케이스 |
| 3 | 뮤테이션 | ✅ | 3건 전부 검거 (아래) |
| 4 | `npm test` + `tsc` + 문서 예제 | ✅ | 38 files, typecheck passed |
| 5 | `staticland-reviewer` 백그라운드 | ⏳ 2차 실행 중 |

## 미완 — resolver 를 안 넣었다

선례 대조:

```
Monoid.of('maybe(first)')      — Maybe.Monoid('first') 호출 전에도  OK
Applicative.of('const(array)') — Applicative.Const('array') 호출 전  THROW
```

차이의 원인을 찾았다. `index.js:1498` 에 **resolver** 가 있다:

```javascript
addResolver(Monoid, key => {
    const m = /^maybe\((.+)\)$/.exec(key);
    return m ? Maybe.Monoid(m[1]) : null;
});
```

`Applicative` 에는 `addResolver` 가 없다(`grep addResolver(Applicative` → 0건).
**선례를 절반만 따랐다** — `_keyCache`/`_instanceCache` 와 `const(<키>)` 등록은 했는데
지연 해석기를 빼먹었다.

`addResolver` 는 `index.js:713`, `Applicative.Const` 는 `:1028` 이라 순서는 문제없다.

**Verification 은 소스를 못 쓰므로 다음 회차로 넘긴다.** 한 줄이면 된다:

```javascript
addResolver(Applicative, key => {
    const m = /^const\((.+)\)$/.exec(key);
    return m ? Applicative.Const(m[1]) : null;
});
```

이것을 못 봤다는 것 자체가 기록할 값어치가 있다 — **선례를 따른다고 하면서 선례의 어느
부분을 따랐는지 목록으로 확인하지 않았다.**

## 뮤테이션 3건

| 지운 것 | 결과 |
| --- | --- |
| `builtins.d.ts` 의 `FunctorInstances.identity` | tsc 에러 1건 |
| `modules.push(IdentityFunctor)` | 테스트 1건 빨간불 |
| `Applicative.types['const(<키>)'] = result` | 테스트 2건 빨간불 |

## 구조 개선 — 중복을 매개변수화했다 (규칙 18)

`normalizeSemigroupKey` 를 `normalizeTypeClassKey(TypeClass, symbol, label)` 로 일반화하고
`normalizeSemigroupKey` / `normalizeConstMonoid` 둘 다 그것으로 만들었다. 레지스트리만 다르고
로직이 같았다.

## 현재 상태

```
npm test          38 files passed
tsc --noEmit      통과
npm run baseline  61케이스, 차이 17건
```

차이 17건 = 앞 작업 계획분 10건 + 레지스트리 키 5줄(`Functor`/`Apply`/`Applicative`/
`Monoid`/`Semigroup` — 전부 이번·앞 작업의 의도된 등록) + 최상위 export + `toList` 이름.
