# Profunctor

> 한국어: [../Profunctor.md](../Profunctor.md)

A type class that can transform both input and output (the contravariant
cousin of Bifunctor).

## Definition

```javascript no-run signature / pseudocode
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

```javascript no-run signature / pseudocode
// identity
promap(x => x, x => x, p) ≡ p

// composition
promap(f, g, promap(h, i, p)) ≡ promap(x => h(f(x)), x => g(i(x)), p)
```

## Example: functions

```javascript
const { promap } = Profunctor.lookup('function');
// a function (a → b) is a classic example of a Profunctor
// the input is contravariant, the output is covariant

const double = x => x * 2;

// promap: transforms input + output
const result = promap(
    str => parseInt(str),   // input: string → number
    n => `result: ${n}`,    // output: number → string
    double                   // original function: number → number
);

result('5');  // 'result: 10'
// '5' → parseInt → 5 → double → 10 → format → 'result: 10'
```

## Relationship

```
Contravariant (transforms input)  ─┐
                                   ├── Profunctor
Functor (transforms output)       ─┘
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
console.log(C.right(x => x * 10)(Either.Left(4)).value);   // 4   passes it through

console.log(Wander.lookup('function') instanceof Strong);  // true
```

### Registered instances

| Key | Profunctor | Strong | Choice | Wander | Where it is used |
| --- | :-: | :-: | :-: | :-: | --- |
| `function` | O | O | O | O | optics' `over` / `set` |
| `forget(<monoid key>)` | O | O | O | O | optics' `view` / `preview` / `toList`, built with `Wander.Forget(monoid)` |
| `tagged` | · | · | O | · | optics' `review` |

`tagged` sits only under `Choice` because it **genuinely lacks `first` and
`wander`**, and that absence is exactly what "a Lens or a Traversal cannot be
`review`ed" means.

`forget` is the opposite case: since it has `promap`, it **must also sit
under `Profunctor`.** For a while that layer alone stood empty, and nowhere
recorded why. `Forget` is a subordinate concept of `Profunctor` (owner's
ruling, 2026-08-15), and the registry now has to say so.

```javascript
const { Profunctor, Wander, Monoid } = FunFP;

const F = Wander.Forget(Monoid.lookup('array'));
console.log(Profunctor.lookup('forget(array)') === F);   // true   all four layers are the same instance
console.log(F.unwrap(F.promap(s => s.length, x => x, F.wrap(n => [n])))('abc'));
// [ 3 ]   only the input gets processed — the output-side function is discarded
```

```javascript
const { Strong, Choice, Wander, Monoid, Optics } = FunFP;

const F = Wander.Forget(Monoid.lookup('array'));
console.log(F.type);                             // 'Forget(array)'  its own type
// the carrier goes through wrap — a bare function belongs to FunctionWander and is rejected.
const p = F.wrap(a => [a]);
console.log(F.unwrap(F.first(p))([7, 9]));       // [ 7 ]   collects only the left side
console.log(Strong.lookup('forget(array)') === F);  // true  registered under all three levels

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
const myP = {                                   // no registration needed
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
