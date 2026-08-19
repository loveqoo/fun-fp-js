# Transducer

> 한국어: [../Transducer.md](../Transducer.md)

A reducer transformer that **composes transformation logic only**, without building
intermediate arrays

## Concept

A Transducer is a **function that takes a reducer and returns a reducer**.

```
Transducer = Reducer -> Reducer
Reducer     = (acc, value) -> acc
```

If you rewrite `map` or `filter` not as "an operation on a collection" but as "an
operation on a reducer," you can assemble the transformation stages **independently of
any collection**. Once assembly is done, you traverse the data exactly once, via
`transduce`.

The transducer in fun-fp-js works on anything with a `Symbol.iterator` — arrays, Sets,
Maps, strings, and generators are all included.

## Why Transducer?

### Problem: chaining array methods allocates an array at every step

```javascript no-run 문제 상황 — 일부러 나쁜 코드
// 각 단계가 새 배열을 할당한다 — 100만 개면 중간 배열도 100만 개씩
const result = hugeArray
    .map(x => x * 2)        // 새 배열 1
    .filter(x => x > 10)    // 새 배열 2
    .slice(0, 3);           // 새 배열 3 — 앞의 두 단계는 전부 다 돌고 나서야 잘린다

// 그리고 변환 로직을 따로 떼어 재사용할 수 없다
```

Even though `slice(0, 3)` is last, `map` and `filter` still process **every element**
before the cut happens.

### Solution: compose the transformations and traverse once

```javascript
const { transducer, compose } = FunFP;

const push = (acc, x) => [...acc, x];

// 변환 단계만 조립 — 아직 아무 데이터도 없다
const xf = compose(
    transducer.map(x => x * 2),
    transducer.filter(x => x > 10),
    transducer.take(3)
);

// 이제 한 번 순회한다. 중간 배열 없음, take(3)에서 즉시 중단.
console.log(transducer.transduce(xf, push, [], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
// [12, 14, 16]
```

The moment `take(3)` is satisfied, traversal **stops** — the remaining elements are
never touched at all.

## Creation

There are three basic transducers. All of them take the "receives a reducer, returns a
reducer" shape.

```javascript
const { transducer } = FunFP;

const double = transducer.map(x => x * 2);
const evens = transducer.filter(x => x % 2 === 0);
const firstThree = transducer.take(3);

// 셋 다 함수다 — 아직 실행된 것은 없다
console.log(typeof double, typeof evens, typeof firstThree);
// function function function
```

## Main operations

### transduce - running it

Takes four arguments at once: `transduce(transducer, reducer, initial, collection)`.
This is an uncurried call, the same style as this library's other doors (`map(f, fa)`
and the like).

```javascript
const { transducer } = FunFP;

const push = (acc, x) => [...acc, x];

transducer.transduce(transducer.map(x => x * 2), push, [], [1, 2, 3]);
// [2, 4, 6]
```

Swap the reducer and the shape of the result changes — no need to collect into an
array.

```javascript
const { transducer } = FunFP;

const sum = (acc, x) => acc + x;

// 두 배한 값들의 합 — 중간 배열을 전혀 만들지 않는다
console.log(transducer.transduce(transducer.map(x => x * 2), sum, 0, [1, 2, 3, 4]));
// 20
```

### into - pouring into a vessel {#into}

The reducer-and-initial-value slot in `transduce` is, most of the time, "collect it
into an array." `into` reduces those two arguments down to a **single vessel to hold
the result** — the library looks at the vessel's type and derives the reducer for you.

```javascript
const { transducer, compose } = FunFP;

const xf = compose(transducer.map(x => x * 2), transducer.take(2));

// 배열 그릇 — push 리듀서가 유도된다
console.log(transducer.into([], xf, [1, 2, 3, 4]));   // [2, 4]

// 문자열 그릇 — 이어붙이기
console.log(transducer.into('', transducer.map(s => s.toUpperCase()), 'abc'));   // 'ABC'

// Set 그릇 — add (중복은 Set 규칙대로 합쳐진다)
console.log([...transducer.into(new Set(), transducer.map(x => x % 3), [1, 2, 4, 5])]);   // [1, 2]

// Map·객체 그릇 — 원소가 [키, 값] 쌍이어야 한다
console.log(transducer.into({}, transducer.map(x => [x, x * 10]), [1, 2]));   // { '1': 10, '2': 20 }
```

The vessel's existing contents are preserved, and the original vessel is left
unmodified. This follows Clojure's `into` semantics — Ramda's `R.into` discards the
vessel's contents and looks only at its type, so it differs from this one.

```javascript
const { transducer } = FunFP;

const seed = ['씨앗'];
const result = transducer.into(seed, transducer.map(x => x + 1), [1, 2]);
console.log(result);   // ['씨앗', 2, 3] — 내용 보존
console.log(seed);     // ['씨앗'] — 원본 불변
```

Supported vessels are arrays, strings, Sets, Maps, and plain objects; passing any other
vessel, or feeding a Map/object vessel an element that isn't a pair, throws with the
offending name called out.

```javascript
const { transducer } = FunFP;

[() => transducer.into(42, transducer.map(x => x), []),
 () => transducer.into({}, transducer.map(x => x), [1])].forEach(bad => {
    try { bad(); console.log('통과하면 안 됨'); }
    catch (e) { console.log(e.message.slice(0, 26)); }
});
// transducer.into: vessel mu
// transducer.into: Map/objec
```

### map - transforming values

```javascript
const { transducer } = FunFP;

const push = (acc, x) => [...acc, x];

transducer.transduce(transducer.map(s => s.toUpperCase()), push, [], ['a', 'b']);
// ['A', 'B']
```

### filter - only what passes the condition

```javascript
const { transducer } = FunFP;

const push = (acc, x) => [...acc, x];

transducer.transduce(transducer.filter(x => x % 2 === 0), push, [], [1, 2, 3, 4, 5]);
// [2, 4]
```

### take - the first n, then an early stop

`take` returns a `Reduced` once its count is filled, which **stops traversal
outright.**

```javascript
const { transducer } = FunFP;

const push = (acc, x) => [...acc, x];

// 원소가 n개보다 적으면 있는 만큼만
console.log(transducer.transduce(transducer.take(10), push, [], [1, 2, 3]));
// [1, 2, 3]
```

Whether the early stop actually happens can be confirmed via a side effect.

```javascript
const { transducer } = FunFP;

const push = (acc, x) => [...acc, x];
let touched = 0;

const counted = transducer.map(x => { touched++; return x; });
const xf = r => counted(transducer.take(2)(r));

transducer.transduce(xf, push, [], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

console.log('건드린 원소 수:', touched);  // 건드린 원소 수: 2   10개가 아니다
```

`take` accepts positive integers only.

```javascript
const { transducer } = FunFP;

[0, -1, 1.5, '3'].forEach(bad => {
    try {
        transducer.take(bad);
        console.log('통과하면 안 됨:', bad);
    } catch (e) {
        console.log(`take(${JSON.stringify(bad)}) → ${e.constructor.name}`);
    }
});
```

### Composition — data flows left to right

This is where it's easy to get confused. `compose(a, b)` reads as `a(b(x))` in ordinary
function composition, but for transducers, **data passes through `a` first.**

The order in which reducers get wrapped is the reverse of the order in which data
flows.

```javascript
const { transducer, compose } = FunFP;

const push = (acc, x) => [...acc, x];

// 데이터 흐름: filter 먼저 → 그다음 map
const filterThenMap = compose(
    transducer.filter(x => x % 2 === 0),
    transducer.map(x => x * 2)
);
console.log(transducer.transduce(filterThenMap, push, [], [1, 2, 3, 4, 5]));
// [4, 8]   — [2,4]로 걸러진 뒤 두 배

// 순서를 뒤집으면 결과가 달라진다: map 먼저 → 그다음 filter
const mapThenFilter = compose(
    transducer.map(x => x * 2),
    transducer.filter(x => x % 2 === 0)
);
console.log(transducer.transduce(mapThenFilter, push, [], [1, 2, 3, 4, 5]));
// [2, 4, 6, 8, 10]   — 전부 두 배 되어 모두 짝수
```

## Caution: take is stateful

`transducer.take(n)` itself **is safe to reuse** — a fresh counter is created every
time `transduce` runs. But **a reducer you've already applied it to** holds onto that
counter, and by a second run it is already spent.

```javascript
const { transducer } = FunFP;

const push = (acc, x) => [...acc, x];

// 안전: 적용되지 않은 transducer는 재사용 가능
const t = transducer.take(2);
console.log(transducer.transduce(t, push, [], [1, 2, 3, 4, 5]));  // [1, 2]
console.log(transducer.transduce(t, push, [], [1, 2, 3, 4, 5]));  // [1, 2] — 정상

// 위험: 미리 적용해두면 카운터가 공유된다
const applied = transducer.take(2)(push);
console.log(transducer.transduce(() => applied, push, [], [1, 2, 3]));  // [1, 2]
console.log(transducer.transduce(() => applied, push, [], [1, 2, 3]));  // [] — 소진됨
```

**Rule of thumb**: keep transducers unapplied, and leave the applying to `transduce`.

## Type checking

`transduce` throws a `TypeError` if given something that isn't an iterable.

```javascript
const { transducer } = FunFP;

const push = (acc, x) => [...acc, x];

try {
    transducer.transduce(transducer.map(x => x), push, [], 42);
} catch (e) {
    console.log(e.constructor.name);  // TypeError
}
```

## Practical examples

### 1. The first few matches out of a large list

Finding 5 errors out of a million log lines, without scanning the whole thing.

```javascript
const { transducer, compose } = FunFP;

const push = (acc, x) => [...acc, x];

const logs = [
    { level: 'info', msg: 'start' },
    { level: 'error', msg: 'disk full' },
    { level: 'warn', msg: 'slow' },
    { level: 'error', msg: 'timeout' },
    { level: 'error', msg: 'refused' },
    { level: 'info', msg: 'done' }
];

const firstTwoErrors = compose(
    transducer.filter(l => l.level === 'error'),
    transducer.map(l => l.msg),
    transducer.take(2)
);

console.log(transducer.transduce(firstTwoErrors, push, [], logs));
// ['disk full', 'timeout'] — 'refused'까지 가지 않고 멈춘다
```

### 2. Using it as-is on non-array data

Anything iterable works. Even an infinite generator is safe when paired with `take`.

```javascript
const { transducer, compose } = FunFP;

const push = (acc, x) => [...acc, x];

function* naturals() {
    let n = 1;
    while (true) yield n++;
}

const firstSquares = compose(
    transducer.filter(n => n % 3 === 0),
    transducer.map(n => n * n),
    transducer.take(4)
);

console.log(transducer.transduce(firstSquares, push, [], naturals()));
// [9, 36, 81, 144]
```

Using `.filter().map().slice()` on an infinite sequence never returns, because it hangs
forever on the first stage. A transducer finishes because `take` cuts the traversal
short.

```javascript
const { transducer } = FunFP;

// Set과 문자열에도 그대로
const push = (acc, x) => [...acc, x];
const upper = transducer.map(s => s.toUpperCase());

console.log(transducer.transduce(upper, push, [], new Set(['a', 'b', 'a'])));
// ['A', 'B'] — Set이라 중복 제거는 이미 되어 있다

console.log(transducer.transduce(upper, (acc, c) => acc + c, '', 'hello'));
// 'HELLO'
```

### 3. Naming transformation logic for reuse

Keeping pipeline pieces as values lets you assemble them in more than one place.

```javascript
const { transducer, compose } = FunFP;

const push = (acc, x) => [...acc, x];

// 재사용할 조각들
const activeOnly = transducer.filter(u => u.active);
const toName = transducer.map(u => u.name);
const adultsOnly = transducer.filter(u => u.age >= 18);

const users = [
    { name: 'A', age: 30, active: true },
    { name: 'B', age: 15, active: true },
    { name: 'C', age: 40, active: false },
    { name: 'D', age: 22, active: true }
];

const activeAdultNames = compose(activeOnly, adultsOnly, toName);
console.log(transducer.transduce(activeAdultNames, push, [], users));
// ['A', 'D']

// 같은 조각으로 다른 파이프라인
const activeNames = compose(activeOnly, toName);
console.log(transducer.transduce(activeNames, push, [], users));
// ['A', 'B', 'D']
```

### 4. Aggregating without collecting into an array

Swap the reducer and one traversal gives you statistics.

```javascript
const { transducer, compose } = FunFP;

const orders = [
    { item: 'book', price: 15000, paid: true },
    { item: 'pen', price: 2000, paid: false },
    { item: 'desk', price: 89000, paid: true },
    { item: 'lamp', price: 34000, paid: true }
];

const paidWithTax = compose(
    transducer.filter(o => o.paid),
    transducer.map(o => Math.round(o.price * 1.1))
);

// 합계 — 중간 배열 없음
const total = transducer.transduce(paidWithTax, (acc, x) => acc + x, 0, orders);
console.log('합계:', total);

// 같은 파이프라인, 다른 리듀서 — 최댓값
const max = transducer.transduce(paidWithTax, (acc, x) => Math.max(acc, x), 0, orders);
console.log('최댓값:', max);
```

## Related type classes

- [Foldable](./Foldable.md) - `transduce` is, in the end, a fold. A transducer is the
  layer that assembles the reducer that fold will use.
- [Semigroupoid](./Semigroupoid.md) - Transducers compose via `compose`. Just note that
  the direction data flows is the reverse of ordinary function composition.
- [Filterable](./Filterable.md) - `filter` over a container. What's different about a
  transducer's `filter` is that it transforms a reducer, not a container.

## Learn more

- [Clojure Transducers](https://clojure.org/reference/transducers)
