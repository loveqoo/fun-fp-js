# Lens

> 한국어: [../Lens.md](../Lens.md)

A **composable accessor for reading and writing a specific part of nested
immutable data**

> A Lens is an optic whose **target count is exactly 1**. For the cases where
> the count can be 0 or many, and for how to compose different kinds together,
> see [Optics](./Optics.md).

## Quick look

```javascript
const { Lens, view, set, over, compose } = FunFP.Optics;

const addressLens = Lens(u => u.address, (a, u) => ({ ...u, address: a }));
const cityLens = Lens(a => a.city, (c, a) => ({ ...a, city: c }));
const userCity = compose(addressLens, cityLens);

const user = { name: 'Anthony', address: { city: 'Seoul', country: 'KR' } };

view(userCity, user);              // 'Seoul'
set(userCity, 'Busan', user);      // { name, address: { city: 'Busan', country: 'KR' } }
over(userCity, s => s.toUpperCase(), user);

// the original stays unchanged
console.log(user.address.city);    // 'Seoul'
```

Once built, `userCity` serves all three purposes: reading, writing, and
transforming.

## Concept

A Lens is a **first-class accessor** for a small value `a` inside a larger
structure `s`. It bundles a getter and a setter into one pair, and because
it's a value, it **composes.**

```
Lens s a = { get: s -> a, set: (a, s) -> s }
```

The key point is that the setter never mutates the original: it **returns a
new structure.** So every update done through a Lens is immutable.

## Why Lens?

### Problem: immutable updates on nested objects get messy fast

The deeper the nesting, the more the spreads nest inside each other, and you
have to check by eye whether you missed a layer.

```javascript no-run the problem — deliberately bad code
// to change one city name, you rebuild all three layers
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

// reading needs defensive code too
const cityName = user && user.address && user.address.city
    ? user.address.city.name
    : undefined;
```

## Construction

`Lens(getter, setter)`: the setter's argument order is `(newValue,
originalStructure) => newStructure`.

```javascript
const { Lens, view, set } = FunFP.Optics;

const nameLens = Lens(
    person => person.name,                        // getter: s -> a
    (value, person) => ({ ...person, name: value }) // setter: (a, s) -> s
);

view(nameLens, { name: 'Anthony', age: 30 });  // 'Anthony'
set(nameLens, 'Kim', { name: 'Anthony', age: 30 });
```

It also works for array indices.

```javascript
const { Lens, view, set } = FunFP.Optics;

const atLens = i => Lens(
    xs => xs[i],
    (v, xs) => xs.map((x, j) => (j === i ? v : x))
);

const second = atLens(1);
view(second, ['a', 'b', 'c']);        // 'b'
set(second, 'B', ['a', 'b', 'c']);    // ['a', 'B', 'c']
```

If the getter or setter isn't a function, it throws `TypeError` immediately.

```javascript
const { Lens } = FunFP.Optics;

try {
    Lens('not a function', (v, s) => s);
} catch (e) {
    console.log(e instanceof TypeError);  // true
}
```

## Main operations

### view - reading a value

```javascript
const { Lens, view } = FunFP.Optics;

const ageLens = Lens(p => p.age, (v, p) => ({ ...p, age: v }));

view(ageLens, { name: 'A', age: 30 });  // 30
```

### set - replacing a value

Builds a new structure without touching the original.

```javascript
const { Lens, set } = FunFP.Optics;

const nameLens = Lens(p => p.name, (v, p) => ({ ...p, name: v }));

const original = { name: 'A', age: 30 };
const updated = set(nameLens, 'B', original);

console.log(updated.name);   // 'B'
console.log(original.name);  // 'A' — the original is unchanged
```

### over - transforming the current value with a function

Reads, applies, and writes back, all in one step.

```javascript
const { Lens, over } = FunFP.Optics;

const ageLens = Lens(p => p.age, (v, p) => ({ ...p, age: v }));

over(ageLens, n => n + 1, { name: 'A', age: 30 });
// { name: 'A', age: 31 }
```

`set(lens, b, s)` is actually `over(lens, () => b, s)`.

### compose - composing nested paths

**Regular `compose` can't compose Lenses.** That's because an optic has the
shape `P => pab => ...` and takes a Profunctor dictionary as its first
argument. `compose` first injects the same `P` into both Lenses, then does
function composition at that layer.

The argument order goes **from outside in.**

```javascript
const { Lens, view, set, compose } = FunFP.Optics;

const addressLens = Lens(u => u.address, (a, u) => ({ ...u, address: a }));
const cityLens = Lens(a => a.city, (c, a) => ({ ...a, city: c }));
const zipLens = Lens(c => c.zip, (z, c) => ({ ...c, zip: z }));

// even 3 levels of nesting go in one call, via variadic arguments
const userZip = compose(addressLens, cityLens, zipLens);

const user = { address: { city: { name: 'Seoul', zip: '04524' } } };
view(userZip, user);              // '04524'
set(userZip, '06236', user);      // a new structure with only the deep part changed
```

## Lens laws

A well-formed Lens satisfies three laws. If a Lens you wrote behaves
strangely, check these three first.

```javascript
const { Lens, view, set } = FunFP.Optics;

const nameLens = Lens(p => p.name, (v, p) => ({ ...p, name: v }));
const s = { name: 'A', age: 30 };

// 1. get-set: writing back the value you just read gives the original
console.log(JSON.stringify(set(nameLens, view(nameLens, s), s)) === JSON.stringify(s));

// 2. set-get: reading after a write gives back what was written
console.log(view(nameLens, set(nameLens, 'B', s)) === 'B');

// 3. set-set: writing twice in a row leaves only the last one
console.log(
    JSON.stringify(set(nameLens, 'C', set(nameLens, 'B', s))) ===
    JSON.stringify(set(nameLens, 'C', s))
);
```

## Type checks

`view`/`set`/`over`/`compose` throw `TypeError` when a non-function value
sits where a Lens should be.

```javascript
const { view, over, compose } = FunFP.Optics;

const notALens = 42;

try { view(notALens, {}); } catch (e) { console.log('view:', e.constructor.name); }
try { over(notALens, x => x, {}); } catch (e) { console.log('over:', e.constructor.name); }
try { compose(notALens); } catch (e) { console.log('compose:', e.constructor.name); }
```

## Practical examples

### 1. Partial update of a config object

When making a copy of default settings with just one item changed, no layer
gets skipped.

```javascript
const { Lens, over, compose } = FunFP.Optics;

const serverLens = Lens(c => c.server, (v, c) => ({ ...c, server: v }));
const portLens = Lens(s => s.port, (v, s) => ({ ...s, port: v }));
const serverPort = compose(serverLens, portLens);

const defaults = {
    server: { host: 'localhost', port: 8080 },
    logLevel: 'info'
};

const production = over(serverPort, p => p + 1000, defaults);

console.log(production.server.port);   // 9080
console.log(production.server.host);   // 'localhost' — unchanged
console.log(defaults.server.port);     // 8080 — the original is unchanged
```

### 2. Changing just one item in a list

Composing an index Lens with a field Lens turns "the name of the 3rd user"
into a single value.

```javascript
const { Lens, view, set, compose } = FunFP.Optics;

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

const secondName = compose(atLens(1), nameLens);

console.log(view(secondName, users));            // 'Kim'
const renamed = set(secondName, 'Park', users);
console.log(renamed[1].name);                    // 'Park'
console.log(users[1].name);                      // 'Kim' — the original is unchanged
console.log(renamed[0] === users[0]);            // true — an unchanged item shares its reference
```

The last line matters: items that didn't change **keep the same
reference**, which plays well with reference-comparison-based change
detection (React's `memo` and the like).

### 3. Building reusable update functions

Partially applying a Lens turns "this update" into a named function.

```javascript
const { Lens, over, compose } = FunFP.Optics;

const profileLens = Lens(u => u.profile, (v, u) => ({ ...u, profile: v }));
const tagsLens = Lens(p => p.tags, (v, p) => ({ ...p, tags: v }));
const userTags = compose(profileLens, tagsLens);

// turn the update logic itself into a value
const addTag = tag => user => over(userTags, tags => [...tags, tag], user);
const removeTag = tag => user => over(userTags, tags => tags.filter(t => t !== tag), user);

const user = { name: 'A', profile: { tags: ['js'], bio: '' } };

const tagged = addTag('fp')(user);
console.log(tagged.profile.tags);           // ['js', 'fp']
console.log(removeTag('js')(tagged).profile.tags);  // ['fp']
console.log(user.profile.tags);             // ['js'] — the original is unchanged
```

### 4. Chaining several updates through a pipe

Partially applying `over` so that it returns `s => s` lets you chain updates
with `pipe`.

```javascript
const { pipe } = FunFP;
const { Lens, over } = FunFP.Optics;

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

## Related type classes

- [Profunctor](./Profunctor.md) - the `P` a Lens takes. A Lens uses its
  `first` (product) side. `view` injects `Forget`; `over`/`set` inject a
  function, which is why reading and writing both come out of a single Lens.
- [Semigroupoid](./Semigroupoid.md) - `compose` is composition for Lenses.
  Because of the F-explicit encoding it isn't compatible with regular
  `compose`, though, so it's offered as a dedicated function.

## Learn more

- [Van Laarhoven Lenses](https://www.twanvl.nl/blog/haskell/cps-functional-references)
