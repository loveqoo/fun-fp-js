# Optics

**데이터의 일부를 가리키는 합성 가능한 접근자** — Iso, Lens, Prism, Traversal

Optic은 큰 구조 안의 부분을 **읽고 쓰는 방법을 값으로 만든 것**입니다. 값이므로 합성할 수
있고, 한 번 만들면 읽기·쓰기에 모두 씁니다.

## 어느 것을 쓸까 — 대상 수로 고른다

| 대상 | optic | 예 |
| --- | --- | --- |
| 정확히 1개 (무손실 변환) | **Iso** | 섭씨 ↔ 화씨, 문자열 ↔ 문자 배열 |
| 정확히 1개 | [Lens](./Lens.md) | 객체의 필드, 배열의 특정 인덱스 |
| 0개 또는 1개 | **Prism** | `Either`의 `Right`, 짝수만, 파싱 성공한 것만 |
| 0..n개 | **Traversal** | 배열의 모든 원소, `Maybe` 안의 값 |

## 빠르게 보기

## 속성 하나를 보려면 `prop`

가장 흔한 Lens 다. 중첩된 것은 `compose` 로 잇는다.

```javascript
const { Optics } = FunFP;

const cityL = Optics.compose(Optics.prop('address'), Optics.prop('city'));
const user = { id: 7, address: { city: 'Seoul', zip: '04524' } };

console.log(Optics.view(cityL, user));              // 'Seoul'
console.log(Optics.set(cityL, 'Busan', user).address.city);   // 'Busan'
console.log(user.address.city);                     // 'Seoul'  원본은 그대로
```

**배열 인덱스도 받는다.** 복사가 자기 모양을 지키므로 배열은 배열로 남는다 — 그래야 뒤에
오는 순회 optic 과 합성된다.

```javascript
const { Optics } = FunFP;

console.log(Optics.set(Optics.prop(0), 99, [10, 20, 30]));   // [ 99, 20, 30 ]

const xs = Optics.compose(Optics.prop('xs'), Optics.traversed('array'));
console.log(Optics.over(xs, x => x * 10, { xs: [1, 2, 3] }));   // { xs: [ 10, 20, 30 ] }
```

직접 만들려면 `Lens(getter, setter)` 를 쓴다 — `prop` 은 그 특수한 경우다.

```javascript
const { Maybe, Either } = FunFP;
const { Lens, Prism, traversed, compose, preview, toList, over } = FunFP.Optics;

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
const allNames = compose(usersL, each, nameL);

const db = { users: [{ name: 'a' }, { name: 'b' }] };
console.log(toList(allNames, db));                          // ['a', 'b']
console.log(JSON.stringify(over(allNames, s => s.toUpperCase(), db)));
// {"users":[{"name":"A"},{"name":"B"}]}
```

종류가 달라도 `compose`으로 섞어 씁니다. 나머지는 이 네 가지의 변주입니다.

## 왜 여러 종류가 필요한가?

### 문제: Lens만으로는 "없을 수도 있는 것"과 "여러 개"를 못 다룬다

```javascript no-run 문제 상황 — Lens 로는 표현할 수 없다
// Lens 는 대상이 반드시 1개여야 한다.
// Either 의 Right 는 없을 수도 있다 → getter 가 무엇을 돌려줘야 하나?
const rightLens = Lens(
    e => e.value,              // Left 일 때는? 거짓말이 된다
    (v, e) => Either.Right(v)  // Left 를 Right 로 바꿔버린다
);

// 배열 전체를 바꾸려면 매번 map 을 직접 쓴다
const updated = {
    ...db,
    users: db.users.map(u => ({ ...u, name: u.name.toUpperCase() }))
};
```

## 생성

### Iso — 무손실 양방향 변환

`Iso(to, from)` — 두 표현이 정보 손실 없이 오갈 때 씁니다.

```javascript
const { Iso, view, review, over } = FunFP.Optics;

const fahrenheit = Iso(c => c * 9 / 5 + 32, f => (f - 32) * 5 / 9);

console.log(view(fahrenheit, 100));            // 212  — 정방향
console.log(review(fahrenheit, 212));          // 100  — 역방향
console.log(over(fahrenheit, f => f + 18, 100)); // 110 — 화씨에서 더하고 섭씨로 돌아온다
```

**법칙 두 개**가 무손실을 보장합니다. 깨지면 Iso가 아닙니다.

```javascript
const { Iso, view, review } = FunFP.Optics;

const chars = Iso(s => s.split(''), a => a.join(''));

console.log(review(chars, view(chars, 'abc')) === 'abc');            // true
console.log(view(chars, review(chars, ['x', 'y'])).join('') === 'xy'); // true
```

`Iso`는 **Lens이자 Prism**이므로 여섯 연산이 전부 동작합니다.

```javascript
const { Iso, view, preview, toList, over, set, review } = FunFP.Optics;

const fahrenheit = Iso(c => c * 9 / 5 + 32, f => (f - 32) * 5 / 9);

console.log(view(fahrenheit, 0));              // 32
console.log(preview(fahrenheit, 0).value);     // 32   — 항상 Just
console.log(toList(fahrenheit, 0));          // [32] — 항상 1개
console.log(set(fahrenheit, 212, 0));          // 100
console.log(review(fahrenheit, 32));           // 0
```

**뒤집은 Iso는 따로 만들 필요가 없습니다** — `view`와 `review`로 유도됩니다.

```javascript
const { Iso, view, review } = FunFP.Optics;

const fahrenheit = Iso(c => c * 9 / 5 + 32, f => (f - 32) * 5 / 9);
const celsius = Iso(f => review(fahrenheit, f), c => view(fahrenheit, c));

console.log(view(celsius, 212));    // 100
console.log(review(celsius, 100));  // 212
```

### Lens — 정확히 1개

자세한 내용은 [Lens](./Lens.md) 문서를 보십시오.

```javascript
const { Lens, view } = FunFP.Optics;

const nameLens = Lens(
    p => p.name,
    (v, p) => ({ ...p, name: v })
);

console.log(view(nameLens, { name: 'Anthony', age: 30 }));  // 'Anthony'
```

### Prism — 0개 또는 1개

`Prism(match, build)` — `match`는 **`Maybe`를 돌려줘야** 합니다.

```javascript
const { Maybe } = FunFP;
const { Prism, preview, review } = FunFP.Optics;

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
const { Prism, preview } = FunFP.Optics;

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
const { Maybe } = FunFP;
const { traversed, toList, over } = FunFP.Optics;

const each = traversed('array');
console.log(toList(each, [1, 2, 3]));       // [1, 2, 3]

const inMaybe = traversed('maybe');
console.log(toList(inMaybe, Maybe.Just(5)));    // [5]
console.log(toList(inMaybe, Maybe.Nothing()));  // [] — 대상 없음
```

## 주요 연산

읽기 셋과 쓰기 둘입니다. **`view`만 Lens 전용**이고 나머지는 세 optic 모두 동작합니다.

| 연산 | 결과 | 대상 0개일 때 | 대상 2개 이상일 때 |
| --- | --- | --- | --- |
| `view(lens, s)` | `a` | **`TypeError`** | **`TypeError`** |
| `preview(optic, s)` | `Maybe a` | `Nothing` | 첫 대상 |
| `toList(optic, s)` | `[a]` | `[]` | 전부 |
| `foldMapOf(monoid, optic, f, s)` | `r` | `monoid.empty()` | 전부 모음 |
| `over(optic, f, s)` | `s` | 원본 그대로 | 전부 변환 |
| `set(optic, b, s)` | `s` | 원본 그대로 | 전부 교체 |
| `review(prism, a)` | `s` | Prism·Iso 전용 | 해당 없음 |

**`view`는 대상이 정확히 1개일 때만 동작합니다** — 대상 수를 세어 그 외에는 던집니다.

```javascript
const { view, traversed } = FunFP.Optics;

try {
    view(traversed('array'), [1, 2, 3]);
} catch (e) {
    console.log(e.message);
    // view: expected exactly one target, got 3 — use preview or toList
}
```

세는 것은 **대상 수**이지 값이 아닙니다. 대상이 1개이고 그 값이 `undefined` 면 그대로
돌려줍니다. 대상 수가 1이 아닐 수 있는 자리에는 `preview` 나 `toList` 를 쓰십시오.

### preview - 첫 대상

```javascript
const { traversed, preview } = FunFP.Optics;

const each = traversed('array');
console.log(preview(each, [7, 8, 9]).value);   // 7 — 첫 번째만
console.log(preview(each, []).isNothing());    // true
```

### toList - 모든 대상

```javascript
const { Lens, traversed, compose, toList } = FunFP.Optics;

const each = traversed('array');
const scoreL = Lens(x => x.score, (v, x) => ({ ...x, score: v }));

const scores = compose(each, scoreL);
console.log(toList(scores, [{ score: 10 }, { score: 20 }]));  // [10, 20]
```

### foldMapOf - Monoid 를 골라 모으기

`preview` 와 `toList` 는 모으는 방식이 정해져 있습니다 — 각각 "첫 대상" 과 "배열". 다르게
모으려면 `foldMapOf(monoid, optic, f, s)` 로 **Monoid 를 직접 고릅니다.**

```javascript
const { Monoid } = FunFP;
const { traversed, foldMapOf } = FunFP.Optics;

const each = traversed('array');

console.log(foldMapOf(Monoid.lookup('number'), each, x => x, [1, 2, 3]));            // 6  합계
console.log(foldMapOf(Monoid.lookup('NumberProductMonoid'), each, x => x, [2, 3, 4])); // 24   곱으로 모은다
console.log(foldMapOf(Monoid.lookup('NumberMaxMonoid'), each, x => x, [2, 9, 4]));   // 9  최대
console.log(foldMapOf(Monoid.lookup('string'), each, String, [1, 2, 3]));            // '123'
```

**대상이 없으면 Monoid 의 항등원**입니다.

```javascript
const { Monoid } = FunFP;
const { traversed, foldMapOf } = FunFP.Optics;

console.log(foldMapOf(Monoid.lookup('number'), traversed('array'), x => x, []));  // 0
```

`toList` 와 `preview` 는 이것의 특수 경우입니다 — Monoid 가 각각 `array` 와 `maybe` 로
고정된 것입니다.

```javascript
const { Monoid, Maybe } = FunFP;
const { traversed, foldMapOf, toList } = FunFP.Optics;

const each = traversed('array');
console.log(JSON.stringify(foldMapOf(Monoid.lookup('array'), each, a => [a], [1, 2, 3])));
console.log(JSON.stringify(toList(each, [1, 2, 3])));   // [1,2,3]   위와 같다
```

**등록하지 않은 Monoid 도 받습니다.** 다만 `{ empty, concat }` 리터럴이 아니라 `Monoid` 여야
합니다 — 기존 [`foldMap`](./Foldable.md) 과 같은 규칙입니다.

```javascript
const { Monoid, Semigroup } = FunFP;
const { traversed, foldMapOf } = FunFP.Optics;

const commaJoin = new Monoid(
    new Semigroup((a, b) => (a && b ? a + ',' + b : a + b), 'string'),
    () => '',
    'string'
);
console.log(foldMapOf(commaJoin, traversed('array'), String, [1, 2, 3]));  // '1,2,3'
```

### over / set - 모든 대상 변경

**대상이 없으면 원본을 그대로 돌려줍니다.** 이것이 Prism·Traversal의 핵심 성질입니다.

```javascript
const { Maybe } = FunFP;
const { Prism, traversed, over, set } = FunFP.Optics;

const evenP = Prism(n => (n % 2 === 0 ? Maybe.Just(n) : Maybe.Nothing()), n => n);

console.log(over(evenP, x => x * 100, 4));   // 400 — 매칭됨
console.log(over(evenP, x => x * 100, 3));   // 3   — 매칭 안 됨, 원본
console.log(set(evenP, 0, 3));               // 3   — set 도 마찬가지

const each = traversed('array');
console.log(over(each, x => x + 1, []));     // [] — 빈 배열도 안전
```

### review - Prism으로 거꾸로 만들기

```javascript
const { Maybe, Either } = FunFP;
const { Prism, review, preview } = FunFP.Optics;

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
const { Lens, traversed, review } = FunFP.Optics;

const nameLens = Lens(p => p.name, (v, p) => ({ ...p, name: v }));
try {
    review(nameLens, 'x');
} catch (e) {
    console.log(e.message);  // 'review: argument must be a Prism (a Lens cannot be reviewed)'
}

try {
    review(traversed('array'), 'x');
} catch (e) {
    console.log(e.message);  // review: argument must be a Prism (a Traversal cannot be reviewed)
}
```

**합성된 Prism에서도 동작합니다.** optic 합성이 곧 함수 합성이라 `Tagged`가 그대로 흘러갑니다.

```javascript
const { Maybe, Either } = FunFP;
const { Prism, compose, preview, review } = FunFP.Optics;

const rightP = Prism(e => (e.isRight() ? Maybe.Just(e.value) : Maybe.Nothing()), v => Either.Right(v));
const evenP = Prism(n => (n % 2 === 0 ? Maybe.Just(n) : Maybe.Nothing()), n => n);
const rightEven = compose(rightP, evenP);

console.log(JSON.stringify(review(rightEven, 4)));   // {"value":4,"_typeName":"Either"}   Right(4)
console.log(preview(rightEven, review(rightEven, 8)).value);   // 8 — 법칙 유지
```

## 합성

`compose(...)`은 **바깥에서 안쪽으로** 받습니다. 종류가 달라도 섞을 수 있고, 결과의
대상 수는 **곱**입니다 — Lens(1개) × Traversal(n개) = n개.

```javascript
const { Maybe } = FunFP;
const { Lens, Prism, traversed, compose, toList, over } = FunFP.Optics;

const each = traversed('array');
const evenP = Prism(n => (n % 2 === 0 ? Maybe.Just(n) : Maybe.Nothing()), n => n);

// Traversal + Prism — 통과한 것만 바꾼다
const evens = compose(each, evenP);
console.log(toList(evens, [1, 2, 3, 4]));              // [2, 4]
console.log(over(evens, x => x * 100, [1, 2, 3, 4]));    // [1, 200, 3, 400]
```

Lens끼리도 같은 함수로 합성합니다 — 종류별로 다른 이름이 필요 없습니다.

```javascript
const { Lens, compose, view } = FunFP.Optics;

const addressLens = Lens(u => u.address, (a, u) => ({ ...u, address: a }));
const cityLens = Lens(a => a.city, (c, a) => ({ ...a, city: c }));

console.log(view(compose(addressLens, cityLens), { address: { city: 'Seoul' } }));
// 'Seoul'
```

**일반 `compose`로는 optic을 합성할 수 없습니다.** `P`가 첫 인자이므로 `compose`이
`P`를 모든 optic에 먼저 주입한 뒤 그 층에서 함수 합성을 합니다.

## 법칙

Prism이 올바른지 확인하려면 두 가지를 봅니다.

```javascript
const { Maybe, Either } = FunFP;
const { Prism, preview, review } = FunFP.Optics;

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
const { traversed, over } = FunFP.Optics;

const each = traversed('array');
const s = [1, 2, 3];
console.log(JSON.stringify(over(each, x => x, s)) === JSON.stringify(s));  // true
```

## 실용적 예시

### 1. 중첩 컬렉션의 일괄 갱신

```javascript
const { Lens, traversed, compose, over, toList } = FunFP.Optics;

const each = traversed('array');
const itemsL = Lens(o => o.items, (v, o) => ({ ...o, items: v }));
const priceL = Lens(i => i.price, (v, i) => ({ ...i, price: v }));

const allPrices = compose(itemsL, each, priceL);

const cart = {
    items: [
        { name: '책', price: 15000 },
        { name: '펜', price: 2000 }
    ]
};

console.log(toList(allPrices, cart));                    // [15000, 2000]
const taxed = over(allPrices, p => Math.round(p * 1.1), cart);
console.log(taxed.items.map(i => i.price));                // [16500, 2200]
console.log(cart.items.map(i => i.price));                 // [15000, 2000] — 원본 불변
```

### 2. 성공한 것만 골라 처리하기

`Either` 배열에서 `Right`만 변환합니다. 실패는 손대지 않습니다.

```javascript
const { Maybe, Either } = FunFP;
const { Prism, traversed, compose, toList, over } = FunFP.Optics;

const each = traversed('array');
const rightP = Prism(
    e => (e.isRight() ? Maybe.Just(e.value) : Maybe.Nothing()),
    v => Either.Right(v)
);
const successes = compose(each, rightP);

const results = [Either.Right(1), Either.Left('실패'), Either.Right(3)];

console.log(toList(successes, results));          // [1, 3] — 성공만
const doubled = over(successes, x => x * 2, results);
console.log(doubled.map(e => e.value));             // [2, '실패', 6] — 실패는 그대로
```

### 3. 조건부 부분 갱신

Prism으로 "조건에 맞는 것만"을 값으로 만들어 재사용합니다.

```javascript
const { Maybe } = FunFP;
const { Lens, Prism, traversed, compose, over, toList } = FunFP.Optics;

const each = traversed('array');
const activeOnly = Prism(
    u => (u.active ? Maybe.Just(u) : Maybe.Nothing()),
    u => u
);
const nameL = Lens(u => u.name, (v, u) => ({ ...u, name: v }));

const activeNames = compose(each, activeOnly, nameL);

const users = [
    { name: 'alice', active: true },
    { name: 'bob', active: false },
    { name: 'carol', active: true }
];

console.log(toList(activeNames, users));                       // ['alice', 'carol']
const shouted = over(activeNames, s => s.toUpperCase(), users);
console.log(shouted.map(u => u.name));                           // ['ALICE', 'bob', 'CAROL']
```

### 4. 안전한 깊은 읽기

`preview`는 경로 어디가 비어도 `Nothing`을 돌려줍니다 — 방어 코드가 필요 없습니다.

```javascript
const { Maybe } = FunFP;
const { Lens, Prism, compose, preview } = FunFP.Optics;

const profileL = Lens(u => u.profile, (v, u) => ({ ...u, profile: v }));
const definedP = Prism(
    x => (x === undefined || x === null ? Maybe.Nothing() : Maybe.Just(x)),
    x => x
);
const bioL = Lens(p => p.bio, (v, p) => ({ ...p, bio: v }));

const bio = compose(profileL, definedP, bioL);

console.log(preview(bio, { profile: { bio: '안녕' } }).value);      // '안녕'
console.log(preview(bio, { profile: undefined }).isNothing());      // true
```

## 내부 구조

여기부터는 optic을 **쓰는 데는 필요 없습니다.** `review`가 왜 Lens에서 안 되는지 같은
질문의 답이 궁금할 때 보십시오.

셋 다 같은 표현을 씁니다 (profunctor 인코딩):

```
Optic s a = P => P a a -> P s s
```

**어떤 `P`를 주입하느냐가 연산을 정합니다.** 하나의 정의에서 읽기·쓰기·역생성이 전부
나오는 이유입니다.

| 주입하는 `P` | 얻는 연산 |
| --- | --- |
| 함수 (`a -> b`) | `over`, `set` |
| `Forget<r>` (`a -> r`) | `view`, `preview`, `toList` |
| `Tagged` (`b`만 담는다 — 입력을 무시) | `review` |

네 optic은 `P`의 어떤 메서드를 쓰느냐로 갈립니다.

| optic | 쓰는 메서드 |
| --- | --- |
| `Iso` | `dimap`만 |
| `Lens` | `first` (곱) |
| `Prism` | `left` (합) |
| `Traversal` | `wander` (순회) |

**`Tagged`에는 `first`와 `wander`가 없고**, 그것이 곧 "Lens와 Traversal은 `review`할 수
없다"는 제약입니다. 반대로 **`Iso`는 `dimap`만 쓰므로 모든 `P`에서 동작합니다** — Lens이자
Prism이라 `view`도 `review`도 됩니다. 요구하는 것이 가장 적어 optic 계층의 최상단입니다.

`wander`는 [Traversable](./Traversable.md) 레지스트리의 `traverse`에, `dimap`은
[Profunctor](./Profunctor.md) 레지스트리의 `promap`에 위임합니다.

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
