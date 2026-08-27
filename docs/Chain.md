# Chain

> English: [./en/Chain.md](./en/Chain.md)

**앞 결과로 다음 상자를 만드는 타입 클래스**

## 개념

`map` 의 콜백은 보통 값을 돌려줍니다. 콜백이 **상자를 돌려주면** `map` 은 상자를 이중으로
포갭니다 — `Maybe<Maybe<number>>` 처럼. `chain` 은 같은 콜백을 받되 결과를 한 겹으로
폅니다. 그래서 「앞 단계의 결과를 보고 다음 단계를 정하는」 연쇄가 됩니다.

`ap`([Apply](./Apply.md))과의 구분: `ap` 의 두 상자는 서로를 모르고(그래서 실패를 모을 수
있고), `chain` 의 다음 상자는 앞 값이 있어야 만들어집니다(그래서 첫 실패에서 멈춥니다).

## 인터페이스

```javascript no-run 시그니처·의사코드 표기
Chain.lookup(키): Chain 인스턴스
Chain.chain(f, m): Chain b   // f: a -> Chain b — 콜백이 상자를 돌려줘야 한다
```

## 법칙

### 결합 (Associativity)
```javascript no-run 대수 법칙 — 자유변수 표기
chain(g, chain(f, m)) === chain(x => chain(g, f(x)), m)
```

## 사용 예시

```javascript
import FunFP from 'fun-fp-js';
const { Chain, Functor, Maybe } = FunFP;

const { chain } = Chain.lookup('maybe');
const { map } = Functor.lookup('maybe');
const half = n => n % 2 === 0 ? Maybe.Just(n / 2) : Maybe.Nothing();

console.log(String(map(half, Maybe.Just(8))));     // Just(Just(4))   map 은 이중으로 포갠다
console.log(String(chain(half, Maybe.Just(8))));   // Just(4)         chain 은 한 겹으로 편다
console.log(String(chain(half, Maybe.Just(7))));   // Nothing         실패에서 멈춘다
console.log(String(chain(half, chain(half, Maybe.Just(8)))));   // Just(2)   연쇄
```

### 콜백은 상자를 돌려줘야 합니다

`map` 쓸 자리에 `chain` 을 쓰는 것이 가장 흔한 실수입니다. strict 모드는 그 실수를
**실수한 자리에서** 거부합니다 — 근거와 경계(게으른 타입)는
[internals](./internals.md#chain-return)에 있습니다.

```javascript
const { Chain, Maybe } = FunFP;
const { chain } = Chain.lookup('maybe');

try { chain(n => n + 1, Maybe.Just(8)); }   // 콜백이 맨 값을 돌려줬다 — map 쓸 자리
catch (e) { console.log(e.message); }   // 'Chain.chain: callback must return Maybe, got number'
```

### Kleisli 합성 — 상자 없이 화살표만 먼저 잇기

`a -> Chain b` 꼴 함수(Kleisli 화살표)들은 값 없이 먼저 합쳐 둘 수 있습니다.
`chain` 을 두 번 하는 것과 화살표를 미리 합쳐 한 번 하는 것이 같다는 것 — 그것이
위의 결합 법칙입니다.

```javascript
const { Maybe } = FunFP;
const half = n => n % 2 === 0 ? Maybe.Just(n / 2) : Maybe.Nothing();
const dec = n => n > 0 ? Maybe.Just(n - 1) : Maybe.Nothing();

const pipeline = Maybe.pipeK(half, dec);   // 값이 오기 전에 합쳐 둔다
console.log(String(pipeline(8)));   // Just(3)
console.log(String(pipeline(7)));   // Nothing
```

## 관련 타입 클래스

- **[Apply](./Apply.md)** — 부모. 서로 모르는 상자들의 결합.
- **[Monad](./Monad.md)** — `chain` 에 `of` 가 더해진 것. 등록된 Chain 은 전부 Monad 까지 갑니다.
- **[ChainRec](./ChainRec.md)** — `chain` 재귀를 스택 없이 도는 자매.
