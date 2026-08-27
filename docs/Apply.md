# Apply

> English: [./en/Apply.md](./en/Apply.md)

**상자 속 함수를 상자 속 값에 적용하는 타입 클래스**

## 개념

`Functor.map` 은 보통 함수를 상자 속 값에 적용합니다. 함수 자체가 상자 안에 있으면
`map` 으로는 꺼낼 수 없습니다 — 그 자리가 `Apply.ap` 입니다.

인자가 여럿인 함수를 상자 몇 개에 나눠 적용할 때 씁니다. 상자마다 하나씩 `ap` 을
이어 붙이면, 커링된 함수가 인자를 하나씩 받아 갑니다.

## 인터페이스

```javascript no-run 시그니처·의사코드 표기
Apply.lookup(키): Apply 인스턴스
Apply.ap(mf, mv): Apply b   // mf: Apply (a -> b), mv: Apply a
```

## 법칙

### 합성 (Composition)
```javascript no-run 대수 법칙 — 자유변수 표기
ap(ap(map(f => g => x => f(g(x)), a), u), v) === ap(a, ap(u, v))
```

## 사용 예시

```javascript
import FunFP from 'fun-fp-js';
const { Apply, Maybe } = FunFP;

const { ap } = Apply.lookup('maybe');
const add = a => b => a + b;

console.log(String(ap(Maybe.Just(add(3)), Maybe.Just(4))));    // Just(7)
console.log(String(ap(Maybe.Nothing(), Maybe.Just(4))));       // Nothing   함수 상자가 비면 결과도 빈다
console.log(String(ap(Maybe.Just(add(3)), Maybe.Nothing())));  // Nothing   값 상자가 비어도 빈다
```

### 인자 여럿을 상자 여럿에서

```javascript
const { Apply, Applicative, Maybe } = FunFP;
const { ap } = Apply.lookup('maybe');
const { of } = Applicative.lookup('maybe');

const mkUser = name => age => ({ name, age });
const user = ap(ap(of(mkUser), Maybe.Just('kim')), Maybe.Just(40));
console.log(user.value);   // { name: 'kim', age: 40 }
```

### Validation — 실패를 모으는 `ap`

`ap` 이 `chain` 과 갈라지는 지점입니다. `chain` 은 앞 결과가 있어야 다음으로 가지만,
`ap` 의 두 상자는 서로를 모릅니다 — 그래서 **양쪽의 실패를 다 모을 수 있습니다.**
[Validation](./Validation.md) 이 그 성질을 씁니다.

```javascript
const { Apply, Applicative, Validation } = FunFP;
const A = Applicative.lookup('validation');

const name = Validation.Invalid(['이름이 비었다']);
const age = Validation.Invalid(['나이가 음수다']);
console.log(A.ap(A.map(n => a => ({ n, a }), name), age).errors);
// [ '이름이 비었다', '나이가 음수다' ]   둘 다 모인다 — chain 이면 첫 실패에서 멈췄다
```

## 관련 타입 클래스

- **[Functor](./Functor.md)** — 부모. 보통 함수를 적용하는 `map`.
- **[Applicative](./Applicative.md)** — 자식. 값을 상자에 넣는 `of` 가 더해집니다.
- **[Chain](./Chain.md)** — 앞 결과에 의존하는 다음 단계가 필요하면 이쪽입니다.
