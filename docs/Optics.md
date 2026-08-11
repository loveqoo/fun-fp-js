# Optics

**데이터의 일부를 가리키는 합성 가능한 접근자** — Lens, Prism, Traversal

## 개념

Optic은 큰 구조 `s` 안의 부분 `a`를 **읽고 쓰는 방법을 값으로 만든 것**입니다. 값이므로
합성할 수 있고, 한 번 만들면 읽기·쓰기·변환에 모두 씁니다.

세 종류는 **대상이 몇 개냐**로 갈립니다.

| optic | 대상 수 | 예 |
| --- | --- | --- |
| [Lens](./Lens.md) | 정확히 1개 | 객체의 필드, 배열의 특정 인덱스 |
| **Prism** | 0개 또는 1개 | `Either`의 `Right`, 짝수만, 파싱 성공한 것만 |
| **Traversal** | 0..n개 | 배열의 모든 원소, `Maybe` 안의 값 |

셋 다 같은 표현을 씁니다 (profunctor 인코딩):

```
Optic s a = P => P a a -> P s s
```

**어떤 `P`를 주입하느냐가 연산을 정합니다.** 하나의 정의에서 읽기·쓰기·역생성이 전부
나오는 이유입니다.

| 주입하는 `P` | 얻는 연산 |
| --- | --- |
| 함수 (`a -> b`) | `over`, `set` |
| `Forget<r>` (`a -> r`) | `view`, `preview`, `toListOf` |
| `Tagged` (`b`만 담는다 — 입력을 무시) | `review` |

세 optic은 `P`의 어떤 메서드를 쓰느냐로 갈립니다 — Lens는 `first`(곱), Prism은 `left`(합),
Traversal은 `wander`(순회)입니다. **`Tagged`에는 `first`와 `wander`가 없고**, 그것이 곧
"Lens와 Traversal은 `review`할 수 없다"는 제약입니다.

## 왜 Prism과 Traversal인가?

### 문제: Lens만으로는 "없을 수도 있는 것"과 "여러 개"를 못 다룬다

```javascript no-run 문제 상황 — Lens 로는 표현할 수 없다
// Lens 는 대상이 반드시 1개여야 한다.
// Either 의 Right 는 없을 수도 있다 → getter 가 무엇을 돌려줘야 하나?
const rightLens = Lens(
    e => e.value,              // Left 일 때는? 거짓말이 된다
    (v, e) => Either.Right(v)  // Left 를 Right 로 바꿔버린다
);

// 배열 전체를 바꾸려면 매번 map 을 손으로 쓴다
const updated = {
    ...db,
    users: db.users.map(u => ({ ...u, name: u.name.toUpperCase() }))
};
```

### 해결: 대상 수에 맞는 optic을 쓰고 합성한다

```javascript
const { Lens, Prism, traversed, composeOptic, preview, toListOf, over, Maybe, Either } = FunFP;

// Prism — 있을 수도, 없을 수도
const rightP = Prism(
    e => (e.isRight() ? Maybe.Just(e.value) : Maybe.Nothing()),
    v => Either.Right(v)
);

console.log(preview(rightP, Either.Right(5)).value);        // 5
console.log(preview(rightP, Either.Left('e')).isNothing()); // true
console.log(over(rightP, x => x * 2, Either.Left('e')).value); // 'e' — 원본 그대로

// Traversal — 0..n 개
const each = traversed('array');
console.log(over(each, x => x * 10, [1, 2, 3]));   // [10, 20, 30]

// 합성 — 셋을 자유롭게 섞는다
const usersL = Lens(o => o.users, (v, o) => ({ ...o, users: v }));
const nameL = Lens(u => u.name, (v, u) => ({ ...u, name: v }));
const allNames = composeOptic(usersL, each, nameL);

const db = { users: [{ name: 'a' }, { name: 'b' }] };
console.log(toListOf(allNames, db));                          // ['a', 'b']
console.log(JSON.stringify(over(allNames, s => s.toUpperCase(), db)));
// {"users":[{"name":"A"},{"name":"B"}]}
```

## 생성

### Lens — 정확히 1개

자세한 내용은 [Lens](./Lens.md) 문서를 보십시오.

```javascript
const { Lens, view } = FunFP;

const nameLens = Lens(
    p => p.name,
    (v, p) => ({ ...p, name: v })
);

console.log(view(nameLens, { name: 'Anthony', age: 30 }));  // 'Anthony'
```

### Prism — 0개 또는 1개

`Prism(match, build)` — `match`는 **`Maybe`를 돌려줘야** 합니다.

```javascript
const { Prism, preview, review, Maybe } = FunFP;

// 짝수만 통과시키는 Prism
const evenP = Prism(
    n => (n % 2 === 0 ? Maybe.Just(n) : Maybe.Nothing()),
    n => n
);

console.log(preview(evenP, 4).value);         // 4
console.log(preview(evenP, 3).isNothing());   // true
console.log(review(evenP, 8));                // 8 — 거꾸로 만들기
```

`match`가 `Maybe`가 아니면 즉시 `TypeError`입니다.

```javascript
const { Prism, preview } = FunFP;

const bad = Prism(() => 42, v => v);
try {
    preview(bad, 1);
} catch (e) {
    console.log(e.message);  // 'Prism: match must return a Maybe'
}
```

### Traversal — 0..n개

`traversed(key)`는 **이미 있는 [Traversable](./Traversable.md) 인스턴스**를 optic으로
끌어옵니다. 새로 정의할 필요가 없습니다.

```javascript
const { traversed, toListOf, over, Maybe } = FunFP;

const each = traversed('array');
console.log(toListOf(each, [1, 2, 3]));       // [1, 2, 3]

const inMaybe = traversed('maybe');
console.log(toListOf(inMaybe, Maybe.Just(5)));    // [5]
console.log(toListOf(inMaybe, Maybe.Nothing()));  // [] — 대상 없음
```

## 주요 연산

읽기 셋과 쓰기 둘입니다. **`view`만 Lens 전용**이고 나머지는 세 optic 모두 동작합니다.

| 연산 | 결과 | 대상 0개일 때 |
| --- | --- | --- |
| `view(lens, s)` | `a` | Lens 전용 — 쓰지 마십시오 |
| `preview(optic, s)` | `Maybe a` | `Nothing` |
| `toListOf(optic, s)` | `[a]` | `[]` |
| `over(optic, f, s)` | `s` | 원본 그대로 |
| `set(optic, b, s)` | `s` | 원본 그대로 |
| `review(prism, a)` | `s` | Prism 전용 |

### preview - 첫 대상

```javascript
const { traversed, preview } = FunFP;

const each = traversed('array');
console.log(preview(each, [7, 8, 9]).value);   // 7 — 첫 번째만
console.log(preview(each, []).isNothing());    // true
```

### toListOf - 모든 대상

```javascript
const { Lens, traversed, composeOptic, toListOf } = FunFP;

const each = traversed('array');
const scoreL = Lens(x => x.score, (v, x) => ({ ...x, score: v }));

const scores = composeOptic(each, scoreL);
console.log(toListOf(scores, [{ score: 10 }, { score: 20 }]));  // [10, 20]
```

### over / set - 모든 대상 변경

**대상이 없으면 원본을 그대로 돌려줍니다.** 이것이 Prism·Traversal의 핵심 성질입니다.

```javascript
const { Prism, traversed, over, set, Maybe } = FunFP;

const evenP = Prism(n => (n % 2 === 0 ? Maybe.Just(n) : Maybe.Nothing()), n => n);

console.log(over(evenP, x => x * 100, 4));   // 400 — 매칭됨
console.log(over(evenP, x => x * 100, 3));   // 3   — 매칭 안 됨, 원본
console.log(set(evenP, 0, 3));               // 3   — set 도 마찬가지

const each = traversed('array');
console.log(over(each, x => x + 1, []));     // [] — 빈 배열도 안전
```

### review - Prism으로 거꾸로 만들기

```javascript
const { Prism, review, preview, Maybe, Either } = FunFP;

const rightP = Prism(
    e => (e.isRight() ? Maybe.Just(e.value) : Maybe.Nothing()),
    v => Either.Right(v)
);

const built = review(rightP, 42);
console.log(built.isRight(), built.value);            // true 42
console.log(preview(rightP, built).value);            // 42 — 법칙: preview ∘ review = Just
```

`review`는 **Prism에만** 동작합니다. `Tagged`는 입력을 무시하고 출력만 담으므로 `a -> s`
방향을 만들 수 있지만, 그 대신 곱(`first`)과 순회(`wander`)를 구현할 수 없습니다.
Lens나 Traversal에 쓰면 그 자리에서 걸립니다.

```javascript
const { Lens, traversed, review } = FunFP;

const nameLens = Lens(p => p.name, (v, p) => ({ ...p, name: v }));
try {
    review(nameLens, 'x');
} catch (e) {
    console.log(e.message);  // 'review: argument must be a Prism (a Lens cannot be reviewed)'
}

try {
    review(traversed('array'), 'x');
} catch (e) {
    console.log(e.message);  // '... (a Traversal cannot be reviewed)'
}
```

**합성된 Prism에서도 동작합니다.** optic 합성이 곧 함수 합성이라 `Tagged`가 그대로 흘러갑니다.

```javascript
const { Prism, composeOptic, preview, review, Maybe, Either } = FunFP;

const rightP = Prism(e => (e.isRight() ? Maybe.Just(e.value) : Maybe.Nothing()), v => Either.Right(v));
const evenP = Prism(n => (n % 2 === 0 ? Maybe.Just(n) : Maybe.Nothing()), n => n);
const rightEven = composeOptic(rightP, evenP);

console.log(JSON.stringify(review(rightEven, 4)));   // Right(4)
console.log(preview(rightEven, review(rightEven, 8)).value);   // 8 — 법칙 유지
```

## 합성

`composeOptic(...)`은 **바깥에서 안쪽으로** 받습니다. 종류가 달라도 섞을 수 있고, 결과의
대상 수는 **곱**입니다 — Lens(1개) × Traversal(n개) = n개.

```javascript
const { Lens, Prism, traversed, composeOptic, toListOf, over, Maybe } = FunFP;

const each = traversed('array');
const evenP = Prism(n => (n % 2 === 0 ? Maybe.Just(n) : Maybe.Nothing()), n => n);

// Traversal + Prism — 통과한 것만 바꾼다
const evens = composeOptic(each, evenP);
console.log(toListOf(evens, [1, 2, 3, 4]));              // [2, 4]
console.log(over(evens, x => x * 100, [1, 2, 3, 4]));    // [1, 200, 3, 400]
```

Lens끼리도 같은 함수로 합성합니다 — 종류별로 다른 이름이 필요 없습니다.

```javascript
const { Lens, composeOptic, view } = FunFP;

const addressLens = Lens(u => u.address, (a, u) => ({ ...u, address: a }));
const cityLens = Lens(a => a.city, (c, a) => ({ ...a, city: c }));

console.log(view(composeOptic(addressLens, cityLens), { address: { city: 'Seoul' } }));
// 'Seoul'
```

**일반 `compose`로는 optic을 합성할 수 없습니다.** `P`가 첫 인자이므로 `composeOptic`이
`P`를 모든 optic에 먼저 주입한 뒤 그 층에서 함수 합성을 합니다.

## 법칙

Prism이 올바른지 확인하려면 두 가지를 봅니다.

```javascript
const { Prism, preview, review, Maybe, Either } = FunFP;

const rightP = Prism(
    e => (e.isRight() ? Maybe.Just(e.value) : Maybe.Nothing()),
    v => Either.Right(v)
);

// 1. build 한 것은 반드시 match 된다
console.log(preview(rightP, review(rightP, 42)).value === 42);   // true

// 2. match 된 것을 build 하면 원본과 같다
const s = Either.Right(7);
const focus = preview(rightP, s).value;
console.log(review(rightP, focus).value === s.value);            // true
```

Traversal은 항등 함수로 훑으면 원본이 나와야 합니다.

```javascript
const { traversed, over } = FunFP;

const each = traversed('array');
const s = [1, 2, 3];
console.log(JSON.stringify(over(each, x => x, s)) === JSON.stringify(s));  // true
```

## 실용적 예시

### 1. 중첩 컬렉션의 일괄 갱신

```javascript
const { Lens, traversed, composeOptic, over, toListOf } = FunFP;

const each = traversed('array');
const itemsL = Lens(o => o.items, (v, o) => ({ ...o, items: v }));
const priceL = Lens(i => i.price, (v, i) => ({ ...i, price: v }));

const allPrices = composeOptic(itemsL, each, priceL);

const cart = {
    items: [
        { name: '책', price: 15000 },
        { name: '펜', price: 2000 }
    ]
};

console.log(toListOf(allPrices, cart));                    // [15000, 2000]
const taxed = over(allPrices, p => Math.round(p * 1.1), cart);
console.log(taxed.items.map(i => i.price));                // [16500, 2200]
console.log(cart.items.map(i => i.price));                 // [15000, 2000] — 원본 불변
```

### 2. 성공한 것만 골라 처리하기

`Either` 배열에서 `Right`만 변환합니다. 실패는 손대지 않습니다.

```javascript
const { Prism, traversed, composeOptic, toListOf, over, Maybe, Either } = FunFP;

const each = traversed('array');
const rightP = Prism(
    e => (e.isRight() ? Maybe.Just(e.value) : Maybe.Nothing()),
    v => Either.Right(v)
);
const successes = composeOptic(each, rightP);

const results = [Either.Right(1), Either.Left('실패'), Either.Right(3)];

console.log(toListOf(successes, results));          // [1, 3] — 성공만
const doubled = over(successes, x => x * 2, results);
console.log(doubled.map(e => e.value));             // [2, '실패', 6] — 실패는 그대로
```

### 3. 조건부 부분 갱신

Prism으로 "조건에 맞는 것만"을 값으로 만들어 재사용합니다.

```javascript
const { Lens, Prism, traversed, composeOptic, over, toListOf, Maybe } = FunFP;

const each = traversed('array');
const activeOnly = Prism(
    u => (u.active ? Maybe.Just(u) : Maybe.Nothing()),
    u => u
);
const nameL = Lens(u => u.name, (v, u) => ({ ...u, name: v }));

const activeNames = composeOptic(each, activeOnly, nameL);

const users = [
    { name: 'alice', active: true },
    { name: 'bob', active: false },
    { name: 'carol', active: true }
];

console.log(toListOf(activeNames, users));                       // ['alice', 'carol']
const shouted = over(activeNames, s => s.toUpperCase(), users);
console.log(shouted.map(u => u.name));                           // ['ALICE', 'bob', 'CAROL']
```

### 4. 안전한 깊은 읽기

`preview`는 경로 어디가 비어도 `Nothing`을 돌려줍니다 — 방어 코드가 필요 없습니다.

```javascript
const { Lens, Prism, composeOptic, preview, Maybe } = FunFP;

const profileL = Lens(u => u.profile, (v, u) => ({ ...u, profile: v }));
const definedP = Prism(
    x => (x === undefined || x === null ? Maybe.Nothing() : Maybe.Just(x)),
    x => x
);
const bioL = Lens(p => p.bio, (v, p) => ({ ...p, bio: v }));

const bio = composeOptic(profileL, definedP, bioL);

console.log(preview(bio, { profile: { bio: '안녕' } }).value);      // '안녕'
console.log(preview(bio, { profile: undefined }).isNothing());      // true
```

## 관련 타입 클래스

- [Lens](./Lens.md) - Lens 하나만 자세히 다룹니다. 법칙 3개와 실용 예시 포함.
- [Profunctor](./Profunctor.md) - optic이 받는 `P`가 바로 이것입니다. `dimap`에 더해
  `first`(곱) · `left`(합) · `wander`(순회)를 갖춘 딕셔너리를 씁니다.
- [Traversable](./Traversable.md) - `wander`가 이 레지스트리의 `traverse`에 위임합니다.
  내부 Applicative(Identity/Const)는 그 호출에만 쓰입니다.
- [Traversable](./Traversable.md) - `traversed(key)`가 이 레지스트리를 그대로 씁니다.
- [Maybe](./Maybe.md) - `Prism`의 `match`와 `preview`의 결과 타입.

## 더 알아보기

- [Profunctor Optics: Modular Data Accessors](https://arxiv.org/abs/1703.10857) (Pickering, Gibbons, Wu)
- [Van Laarhoven Lenses](https://www.twanvl.nl/blog/haskell/cps-functional-references) — 이전 인코딩
