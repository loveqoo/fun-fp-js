# Identity

> English: [./en/Identity.md](./en/Identity.md)

**아무 효과도 더하지 않는 상자**

## 개념

`Identity` 는 값을 감싸기만 하고 아무 일도 안 합니다 — 실패도, 지연도, 누적도 없습니다.
「아무것도 안 하는 상자」가 존재하는 이유는, **상자를 요구하는 자리에 효과 없이 들어가기
위해서**입니다. 쓰는 자리가 둘 있습니다.

- **`traverse` 에 넘기면 「그냥 매핑」이 됩니다** — optics 의 `over` 가 이 길입니다.
  근거: [internals](./internals.md#identity-const).
- **트랜스포머의 안쪽 모나드로 넣으면 감싸기 전의 보통 모나드가 나옵니다** —
  `ReaderT('identity')` 는 맨 `Reader` 와 같은 값을 냅니다.

## 문

```javascript
import FunFP from 'fun-fp-js';
const { Identity } = FunFP;

const w = Identity.of(7);
console.log(w.value);                                    // 7
console.log(String(w.map(n => n + 1).value));            // 8
console.log(w.chain(n => Identity.of(n * 3)).value);     // 21
console.log(w.extract());                                // 7   Comonad 의 문
console.log(Identity.isIdentity(w));                     // true
console.log(Identity.isIdentity({ value: 7 }));          // false   모양만 베낀 것은 가른다
```

레지스트리에는 아홉 곳에 등록돼 있습니다 — `Functor`·`Apply`·`Applicative`·`Chain`·
`Monad`·`Extend`·`Comonad`·`Foldable`·`Reducible`.

## 트랜스포머의 안쪽 모나드로

```javascript
const { ReaderT, Reader } = FunFP;

const RT = ReaderT('identity');
const p = RT.asks(e => e.host).chain(h => RT.of(h + '!'));
const bare = Reader.asks(e => e.host).chain(h => Reader.of(h + '!'));

console.log(RT.runReaderT({ host: 'a' }, p).value);   // a!   Identity 한 겹에 싸여 나온다
console.log(bare.run({ host: 'a' }));                 // a!   맨 Reader 와 같은 값
```

## `traverse` 의 짝으로

```javascript
const { Traversable, Applicative, Maybe } = FunFP;

const T = Traversable.lookup('maybe');
const I = Applicative.lookup('identity');

// Identity 로 traverse 하면 효과 없는 "그냥 매핑" 이 된다
console.log(String(T.traverse(I, n => I.of(n * 10), Maybe.Just(4)).value));   // Just(40)
```

## 관련 문서

- **[Applicative](./Applicative.md)** — `traverse` 에 넘기는 Applicative 라는 관점.
- **[Comonad](./Comonad.md)** — `extract` 를 지닌 네 인스턴스 중 하나.
- **[ReaderT](./ReaderT.md)** 등 트랜스포머 — 안쪽 모나드 자리.
