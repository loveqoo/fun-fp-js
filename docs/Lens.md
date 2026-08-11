# Lens

중첩된 불변 데이터의 특정 부분을 **읽고 쓰는 합성 가능한 접근자**

> Lens는 **대상이 정확히 1개**인 optic입니다. 0개이거나 여러 개일 수 있는 경우와
> 종류를 섞어 합성하는 법은 [Optics](./Optics.md)를 보십시오.

## 빠르게 보기

```javascript
const { Lens, view, set, over, composeOptic } = FunFP;

const addressLens = Lens(u => u.address, (a, u) => ({ ...u, address: a }));
const cityLens = Lens(a => a.city, (c, a) => ({ ...a, city: c }));
const userCity = composeOptic(addressLens, cityLens);

const user = { name: 'Anthony', address: { city: 'Seoul', country: 'KR' } };

view(userCity, user);              // 'Seoul'
set(userCity, 'Busan', user);      // { name, address: { city: 'Busan', country: 'KR' } }
over(userCity, s => s.toUpperCase(), user);

// 원본은 그대로다
console.log(user.address.city);    // 'Seoul'
```

한 번 만든 `userCity`는 읽기·쓰기·변환 **세 가지 모두에 쓰입니다.**

한 번 만든 `userCity`는 읽기·쓰기·변환 **세 가지 모두에 쓰입니다.**

## 개념

Lens는 큰 구조 `s` 안에 있는 작은 값 `a`에 대한 **1급 접근자**입니다. getter와 setter를
한 쌍으로 묶은 값이며, 값이기 때문에 **합성할 수 있습니다.**

```
Lens s a = { get: s -> a, set: (a, s) -> s }
```

핵심은 setter가 원본을 변경하지 않고 **새 구조를 돌려준다**는 점입니다. 그래서 Lens로 하는
모든 갱신은 불변입니다.

## 왜 Lens인가?

### 문제: 중첩 객체의 불변 갱신은 금방 지저분해진다

깊이가 늘어날수록 스프레드가 중첩되고, 어느 층을 빠뜨렸는지 눈으로 확인해야 합니다.

```javascript no-run 문제 상황 — 일부러 나쁜 코드
// 도시 이름 하나 바꾸려고 세 층을 다시 조립해야 한다
const updated = {
    ...user,
    address: {
        ...user.address,
        city: {
            ...user.address.city,
            name: 'Busan'
        }
    }
};

// 읽기도 방어 코드가 필요하다
const cityName = user && user.address && user.address.city
    ? user.address.city.name
    : undefined;
```

## 생성

`Lens(getter, setter)` — setter는 `(새값, 원본구조) => 새구조` 순서입니다.

```javascript
const { Lens, view, set } = FunFP;

const nameLens = Lens(
    person => person.name,                        // getter: s -> a
    (value, person) => ({ ...person, name: value }) // setter: (a, s) -> s
);

view(nameLens, { name: 'Anthony', age: 30 });  // 'Anthony'
set(nameLens, 'Kim', { name: 'Anthony', age: 30 });
```

배열 인덱스에도 쓸 수 있습니다.

```javascript
const { Lens, view, set } = FunFP;

const atLens = i => Lens(
    xs => xs[i],
    (v, xs) => xs.map((x, j) => (j === i ? v : x))
);

const second = atLens(1);
view(second, ['a', 'b', 'c']);        // 'b'
set(second, 'B', ['a', 'b', 'c']);    // ['a', 'B', 'c']
```

getter나 setter가 함수가 아니면 즉시 `TypeError`가 납니다.

```javascript
const { Lens } = FunFP;

try {
    Lens('not a function', (v, s) => s);
} catch (e) {
    console.log(e instanceof TypeError);  // true
}
```

## 주요 연산

### view - 값 읽기

```javascript
const { Lens, view } = FunFP;

const ageLens = Lens(p => p.age, (v, p) => ({ ...p, age: v }));

view(ageLens, { name: 'A', age: 30 });  // 30
```

### set - 값 교체

원본을 건드리지 않고 새 구조를 만듭니다.

```javascript
const { Lens, set } = FunFP;

const nameLens = Lens(p => p.name, (v, p) => ({ ...p, name: v }));

const original = { name: 'A', age: 30 };
const updated = set(nameLens, 'B', original);

console.log(updated.name);   // 'B'
console.log(original.name);  // 'A' — 원본 불변
```

### over - 현재 값을 함수로 변환

읽고, 적용하고, 다시 쓰는 과정을 한 번에 합니다.

```javascript
const { Lens, over } = FunFP;

const ageLens = Lens(p => p.age, (v, p) => ({ ...p, age: v }));

over(ageLens, n => n + 1, { name: 'A', age: 30 });
// { name: 'A', age: 31 }
```

`set(lens, b, s)`는 사실 `over(lens, () => b, s)`입니다.

### composeOptic - 중첩 경로 합성

**일반 `compose`로는 Lens를 합성할 수 없습니다.** optic이 `P => pab => ...` 형태로
Profunctor 딕셔너리를 첫 인자로 받기 때문입니다. `composeOptic`는 두 Lens에 같은 `P`를 먼저
주입한 뒤 그 층에서 함수 합성을 합니다.

인자 순서는 **바깥에서 안쪽으로**입니다.

```javascript
const { Lens, view, set, composeOptic } = FunFP;

const addressLens = Lens(u => u.address, (a, u) => ({ ...u, address: a }));
const cityLens = Lens(a => a.city, (c, a) => ({ ...a, city: c }));
const zipLens = Lens(c => c.zip, (z, c) => ({ ...c, zip: z }));

// 3단계 중첩도 가변 인자로 한 번에
const userZip = composeOptic(addressLens, cityLens, zipLens);

const user = { address: { city: { name: 'Seoul', zip: '04524' } } };
view(userZip, user);              // '04524'
set(userZip, '06236', user);      // 깊은 곳만 바뀐 새 구조
```

## Lens 법칙

올바른 Lens는 세 법칙을 만족합니다. 직접 만든 Lens가 이상하게 동작한다면 이 셋을 먼저
확인하십시오.

```javascript
const { Lens, view, set } = FunFP;

const nameLens = Lens(p => p.name, (v, p) => ({ ...p, name: v }));
const s = { name: 'A', age: 30 };

// 1. get-set: 읽은 값을 그대로 다시 쓰면 원본과 같다
console.log(JSON.stringify(set(nameLens, view(nameLens, s), s)) === JSON.stringify(s));

// 2. set-get: 쓴 값을 읽으면 쓴 값이 나온다
console.log(view(nameLens, set(nameLens, 'B', s)) === 'B');

// 3. set-set: 연달아 쓰면 마지막 것만 남는다
console.log(
    JSON.stringify(set(nameLens, 'C', set(nameLens, 'B', s))) ===
    JSON.stringify(set(nameLens, 'C', s))
);
```

## 타입 체크

`view`/`set`/`over`/`composeOptic`는 Lens 자리에 함수가 아닌 값이 오면 `TypeError`를 냅니다.

```javascript
const { view, over, composeOptic } = FunFP;

const notALens = 42;

try { view(notALens, {}); } catch (e) { console.log('view:', e.constructor.name); }
try { over(notALens, x => x, {}); } catch (e) { console.log('over:', e.constructor.name); }
try { composeOptic(notALens); } catch (e) { console.log('composeOptic:', e.constructor.name); }
```

## 실용적 예시

### 1. 설정 객체의 부분 갱신

기본 설정에서 한 항목만 바꾼 사본을 만들 때, 어느 층도 빠뜨리지 않습니다.

```javascript
const { Lens, over, composeOptic } = FunFP;

const serverLens = Lens(c => c.server, (v, c) => ({ ...c, server: v }));
const portLens = Lens(s => s.port, (v, s) => ({ ...s, port: v }));
const serverPort = composeOptic(serverLens, portLens);

const defaults = {
    server: { host: 'localhost', port: 8080 },
    logLevel: 'info'
};

const production = over(serverPort, p => p + 1000, defaults);

console.log(production.server.port);   // 9080
console.log(production.server.host);   // 'localhost' — 유지
console.log(defaults.server.port);     // 8080 — 원본 불변
```

### 2. 목록 안의 한 항목만 바꾸기

인덱스 Lens와 필드 Lens를 합성하면 "3번째 사용자의 이름"이 하나의 값이 됩니다.

```javascript
const { Lens, view, set, composeOptic } = FunFP;

const atLens = i => Lens(
    xs => xs[i],
    (v, xs) => xs.map((x, j) => (j === i ? v : x))
);
const nameLens = Lens(u => u.name, (v, u) => ({ ...u, name: v }));

const users = [
    { id: 1, name: 'Anthony' },
    { id: 2, name: 'Kim' },
    { id: 3, name: 'Lee' }
];

const secondName = composeOptic(atLens(1), nameLens);

console.log(view(secondName, users));            // 'Kim'
const renamed = set(secondName, 'Park', users);
console.log(renamed[1].name);                    // 'Park'
console.log(users[1].name);                      // 'Kim' — 원본 불변
console.log(renamed[0] === users[0]);            // true — 안 바뀐 항목은 참조 공유
```

마지막 줄이 중요합니다 — 바뀌지 않은 항목은 **같은 참조를 유지**하므로 참조 비교 기반의
변경 감지(React의 memo 등)와 잘 맞습니다.

### 3. 재사용 가능한 갱신 함수 만들기

Lens를 부분 적용하면 "이 갱신"이 이름 있는 함수가 됩니다.

```javascript
const { Lens, over, composeOptic } = FunFP;

const profileLens = Lens(u => u.profile, (v, u) => ({ ...u, profile: v }));
const tagsLens = Lens(p => p.tags, (v, p) => ({ ...p, tags: v }));
const userTags = composeOptic(profileLens, tagsLens);

// 갱신 로직 자체를 값으로
const addTag = tag => user => over(userTags, tags => [...tags, tag], user);
const removeTag = tag => user => over(userTags, tags => tags.filter(t => t !== tag), user);

const user = { name: 'A', profile: { tags: ['js'], bio: '' } };

const tagged = addTag('fp')(user);
console.log(tagged.profile.tags);           // ['js', 'fp']
console.log(removeTag('js')(tagged).profile.tags);  // ['fp']
console.log(user.profile.tags);             // ['js'] — 원본 불변
```

### 4. 여러 갱신을 파이프로 잇기

`over`가 `s => s`를 돌려주도록 부분 적용하면 `pipe`로 이어붙일 수 있습니다.

```javascript
const { Lens, over, pipe } = FunFP;

const nameLens = Lens(p => p.name, (v, p) => ({ ...p, name: v }));
const ageLens = Lens(p => p.age, (v, p) => ({ ...p, age: v }));

const normalize = pipe(
    person => over(nameLens, s => s.trim(), person),
    person => over(nameLens, s => s.toUpperCase(), person),
    person => over(ageLens, n => Math.max(0, n), person)
);

console.log(normalize({ name: '  anthony  ', age: -5 }));
// { name: 'ANTHONY', age: 0 }
```

## 관련 타입 클래스

- [Profunctor](./Profunctor.md) - Lens가 받는 `P`입니다. Lens는 그중 `first`(곱)를 씁니다.
  `view`는 `Forget`을, `over`/`set`은 함수를 주입합니다 — 하나의 Lens에서 읽기와 쓰기가
  모두 나오는 이유입니다.
- [Semigroupoid](./Semigroupoid.md) - `composeOptic`는 Lens에 대한 합성입니다. 다만 F-explicit
  인코딩 때문에 일반 `compose`와 호환되지 않아 전용 함수로 제공됩니다.

## 더 알아보기

- [Van Laarhoven Lenses](https://www.twanvl.nl/blog/haskell/cps-functional-references)
