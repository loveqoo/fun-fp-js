# 회차 3 — 등록 계층 완성 (#1·#2·#3)

회차 1 리뷰의 남은 3건. 전부 **"만들어놓고 절반만 등록했다"** 유형이다.

## 지금 상태 (실측)

```
Applicative.of('identity')            => OK
Functor.of('identity')                => THROW unsupported key      ← #2
Apply.of('identity')                  => THROW unsupported key      ← #2
Applicative.Const(Monoid.of('array')) => OK
Applicative.Const('array')            => THROW (키를 못 받는다)        ← #1
Applicative.of('const(array)')        => THROW unsupported key      ← #1
```

## A. `identity` 를 3단으로 등록한다 (#2)

등록된 **다른 모든** Applicative 는 등록된 Apply 로부터 만든다 —
`MaybeFunctor`(1188) → `MaybeApply`(1194) → `MaybeApplicative`(1202). 같은 패턴이
`Array`/`Either`/`Task`/`Validation`/`Reader`/`Writer` 에도 있다.

`IdentityApplicative` 만 `new Apply(new Functor(...))` 를 익명으로 만든다.

```javascript no-run 변경안
class IdentityFunctor extends Functor {
    constructor() { super((f, x) => ({ value: f(x.value) }), 'Object', Functor.types, 'identity'); }
}
modules.push(IdentityFunctor);
class IdentityApply extends Apply {
    constructor() { super(Functor.types.IdentityFunctor, (ff, fa) => ({ value: ff.value(fa.value) }), 'Object', Apply.types, 'identity'); }
}
modules.push(IdentityApply);
class IdentityApplicative extends Applicative {
    constructor() { super(Apply.types.IdentityApply, v => ({ value: v }), 'Object', Applicative.types, 'identity'); }
}
modules.push(IdentityApplicative);
```

**주의**: `type` 이 `'Object'` 인데 `ObjectFilterable`/`ObjectFoldable` 은 `'object'`(소문자)를
쓴다. `types.equals(a, b, 'Object')` 는 **대소문자 폴백이 없어** 대문자여야 한다(회차 5
리뷰가 확인). 그 사실을 주석으로 남긴다 — 누가 "일관성" 으로 정리하면 optics 가 죽는다.

**키 충돌 확인**: `Filterable.types`/`Foldable.types` 의 `object` 와 `Functor.types` 의
`identity` 는 다른 레지스트리라 무관. 실행으로 확인한다.

## B. `Applicative.Const` 가 키를 받고 등록되게 한다 (#1)

선례는 `Maybe.Monoid(innerSG)` (`index.js:1403~`) — **키면 등록하고, 인스턴스면 캐시한다.**
`resolveInnerSemigroup`(1395) / `normalizeSemigroupKey`(1381) 과 같은 모양의 monoid 해석기가
필요하다.

```javascript no-run 변경안
const normalizeMonoidKey = x => {
    const instance = typeof x === 'string' ? Monoid.of(x) : x;
    if (typeof x !== 'string' && !(x && x[Symbols.Monoid] === true)) {
        raise(new TypeError('normalizeMonoidKey: argument must be a string or Monoid instance'));
    }
    // 등록된 소문자 alias 중 가장 짧은 것을 키로 삼는다 (normalizeSemigroupKey 와 동일)
    ...
    return { key: best, instance };
};
Applicative.Const = monoid => {
    const { key, instance: m } = resolveMonoid('Applicative.Const', monoid);
    if (key !== null && Applicative.Const._keyCache.has(key)) return ...;
    if (key === null && Applicative.Const._instanceCache.has(m)) return ...;
    const result = new Applicative(new Apply(new Functor(...), ...), ..., 'Object');
    if (key !== null) { Applicative.types[`const(${key})`] = result; ... } else { ... }
    return result;
};
```

결과: `Applicative.Const('array')` 와 `Applicative.of('const(array)')` 가 동작한다.

**키 형식은 `const(<monoid키>)`** — `CLAUDE.md` 「이름 규칙」의 `<바깥>(<안>)` 관례를 따른다.

**`normalizeSemigroupKey` 와 중복이 아닌지 먼저 본다** — 두 함수가 레지스트리만 다르고
로직이 같다면 하나로 매개변수화한다(규칙 18: 조합으로 되나).

## C. TypeScript (#3)

`ApplicativeInstances` 에 `identity` 추가 + `Applicative.Const` 선언.
`identity` 의 TypeLambda 가 필요하다 — `{ value: A }` 를 나타내는 것.
`types/TypeLambdas.d.ts` 의 기존 정의를 보고 같은 모양으로.

`NonHKTClasses.test-d.ts` 또는 `DefaultExport.test-d.ts` 에 **뮤테이션 감지 줄**을 넣는다 —
회차 1 리뷰 #4 에서 배운 것(선언만 하고 고정 안 하면 조용히 되돌아간다).

## Verification

1. `Functor.of('identity')` · `Apply.of('identity')` · `Applicative.of('identity')` ·
   `Applicative.of('const(array)')` 전부 동작
2. `npm run baseline` — **레지스트리 키 줄 3개가 늘어나야 한다**(`Functor.types`,
   `Apply.types`, `Applicative.types`). 격자에 그 줄이 없으면 **추가한다**
3. **뮤테이션**: 3단 등록에서 한 단을 빼면 잡히는가 / d.ts 키를 빼면 tsc 가 잡는가
4. `npm test` + `tsc` + 문서 예제
5. `staticland-reviewer` **백그라운드**

## 범위 밖

- `deriveFromPlus` 의 재래핑 (#10 잔여) — 타입 클래스 전체에 닿는다
- `Strong`/`Choice`/`Wander` 타입 클래스
- `docs/` 의 `plus(` 0건
