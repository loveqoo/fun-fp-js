# Profunctor

> 한국어: [../Profunctor.md](../Profunctor.md)

A type class that can transform both input and output (the contravariant
cousin of Bifunctor).

## Definition

```javascript no-run 시그니처·의사코드 표기
class Profunctor extends Algebra {
    constructor(promap, type, registry, ...aliases)
}
```

## Core operation

| Operation | Signature | Description |
|-----|---------|-----|
| `promap` | `(a → b, c → d, F b c) → F a d` | transforms input and output at once |

- The first function (`a → b`): transforms the input (contravariant)
- The second function (`c → d`): transforms the output (covariant)

## Laws

```javascript no-run 시그니처·의사코드 표기
// identity
promap(x => x, x => x, p) ≡ p

// composition
promap(f, g, promap(h, i, p)) ≡ promap(x => h(f(x)), x => g(i(x)), p)
```

## Example: functions

```javascript
const { promap } = Profunctor.lookup('function');
// 함수 (a → b)는 Profunctor의 대표적인 예시
// 입력은 contravariant, 출력은 covariant

const double = x => x * 2;

// promap: 입력 변환 + 출력 변환
const result = promap(
    str => parseInt(str),   // 입력: string → number
    n => `결과: ${n}`,      // 출력: number → string  
    double                   // 원래 함수: number → number
);

result('5');  // '결과: 10'
// '5' → parseInt → 5 → double → 10 → format → '결과: 10'
```

## Relationship

```
Contravariant (입력 변환)  ─┐
                           ├── Profunctor
Functor (출력 변환)        ─┘
```

## The extension set — `Strong` / `Choice` / `Wander` {#extensions}

**Not part of the Static Land spec.** [Optics](./Optics.md) needed them, so
they were implemented explicitly, and the names follow the standard.

| Class | Methods | What it adds |
| --- | --- | --- |
| `Strong` | `first` · `second` | touches only **one side** of a product (a pair) → Lens |
| `Choice` | `left` · `right` | touches only **one side** of a sum (`Either`) → Prism |
| `Wander` | `wander` | touches **every position** inside a container → Traversal |

`Wander` carries both `Strong` and `Choice`.

```javascript
const { Strong, Choice, Wander, Either } = FunFP;

const S = Strong.lookup('function');
console.log(S.first(x => x * 10)([3, 'c']));     // [ 30, 'c' ]
console.log(S.second(x => x * 10)(['c', 3]));    // [ 'c', 30 ]

const C = Choice.lookup('function');
console.log(C.left(x => x * 10)(Either.Left(4)).value);    // 40
console.log(C.right(x => x * 10)(Either.Left(4)).value);   // 4   통과시킨다

console.log(Wander.lookup('function') instanceof Strong);  // true
```

### Registered instances

| Key | Profunctor | Strong | Choice | Wander | Where it is used |
| --- | :-: | :-: | :-: | :-: | --- |
| `function` | O | O | O | O | optics' `over` / `set` |
| `forget(<monoid key>)` | O | O | O | O | optics' `view` / `preview` / `toList` — built with `Wander.Forget(monoid)` |
| `tagged` | · | · | O | · | optics' `review` |

`tagged` sits only under `Choice` because it **genuinely lacks `first` and
`wander`**, and that absence is exactly what "a Lens or a Traversal cannot be
`review`ed" means.

`forget` is the opposite case — since it has `promap`, it **must also sit
under `Profunctor`.** For a while that layer alone stood empty, and nowhere
recorded why. `Forget` is a subordinate concept of `Profunctor` (owner's
ruling, 2026-08-15), and the registry now has to say so.

```javascript
const { Profunctor, Wander, Monoid } = FunFP;

const F = Wander.Forget(Monoid.lookup('array'));
console.log(Profunctor.lookup('forget(array)') === F);   // true   네 층이 같은 인스턴스다
console.log(F.unwrap(F.promap(s => s.length, x => x, F.wrap(n => [n])))('abc'));
// [ 3 ]   입력만 손질된다 — 출력 쪽 함수는 버려진다
```

```javascript
const { Strong, Choice, Wander, Monoid, Optics } = FunFP;

const F = Wander.Forget(Monoid.lookup('array'));
console.log(F.type);                             // 'Forget(array)'  자기 타입이다
// 캐리어는 wrap 을 지난다 — 벌거벗은 함수는 FunctionWander 의 것이라 거부된다.
const p = F.wrap(a => [a]);
console.log(F.unwrap(F.first(p))([7, 9]));       // [ 7 ]   왼쪽만 모은다
console.log(Strong.lookup('forget(array)') === F);  // true  3단으로 등록된다

console.log(typeof Choice.lookup('tagged').first);  // 'undefined'
const aLens = Optics.Lens(o => o.a, (b, o) => ({ ...o, a: b }));
try { Optics.review(aLens, 1); }
catch (e) { console.log(e.message); }
// 'review: argument must be a Prism (a Lens cannot be reviewed)'
```

**You can also build your own profunctor and drop it into an optic.** An
optic is just an ordinary function that runs as long as `promap` and whatever
other methods it needs are present.

```javascript
const { Optics } = FunFP;

const nameLens = Optics.Lens(o => o.name, (v, o) => ({ ...o, name: v }));
const myP = {                                   // 등록 안 해도 된다
    promap: (f, g, p) => s => g(p(f(s))),
    first: p => ([a, c]) => [p(a), c],
};
console.log(nameLens(myP)(s => s.toUpperCase())({ name: 'a', age: 1 }));
// { name: 'A', age: 1 }
```

The laws and their limits (what is checked and what is not) are in
[internals.md#optics](./internals.md#optics).

## See also

- [Functor](./Functor.md) - transforms output
- [Contravariant](./Contravariant.md) - transforms input
- [Bifunctor](./Bifunctor.md) - transforms two outputs (covariant)
- [Optics](./Optics.md) - where the extension set above is actually used
