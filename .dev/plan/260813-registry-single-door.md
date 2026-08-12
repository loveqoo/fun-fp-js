# 계획 — 레지스트리에 쓰는 문을 하나로 모은다

## 무엇을

지금 인스턴스를 레지스트리에 넣는 경로가 **14개**다.

| | 어디 |
| --- | --- |
| `register(types, instance, ...aliases)` | 함수 1개 (호출 23곳) |
| `X.types[키] = 인스턴스` **직접 대입** | **13곳** — `Plus` 유도(588·589), `Const`(1038~1040), `Maybe`/`Either` 파생(1448·1466·1487), 트랜스포머(2555~2573) |

`index.js` 밖에서 쓰는 곳은 없다(`grep -rnE "\.types\[[^]]+\]\s*=" tests/ types/ docs/` → 0건).

**직접 대입이 `register()` 를 안 쓰는 이유는 하나뿐이다** — `register()` 가
`instance.constructor.name` 도 키로 넣는데, 파생 인스턴스는 클래스 이름이 그냥 `Monoid`·
`Applicative` 라서 `Monoid.types['Monoid']` 같은 키가 생기고 서로 덮는다.

## 왜

**두 번 물렸다.** 2026-08-13 회차에서:

- `.type` 이 인스턴스마다 제각각 어긋났다 — 등록 시점에 강제할 자리가 없었다
- `.type` 게이트가 `plus(array)`·`plus(maybe)` 를 못 훑었다 — 대문자 키가 없는 인스턴스가
  감시 밖이었다

문이 하나면 **등록 규칙을 한 자리에서 강제할 수 있다.** 그리고 부산물로
[`Algebra.all` 의 캐시](../../docs/internals.md)가 따라온다 — 지금은 부를 때마다 레지스트리
전체(엔트리 230개)를 훑어 `lookup` 대비 650배다.

## 어떻게

**문 하나를 만들고 `register()` 를 그 위에 다시 세운다.**

```javascript
const registerAs = (types, key, instance) => { types[key] = instance; /* + 역인덱스 */ };
const register = (types, instance, ...aliases) => {
    registerAs(types, instance.constructor.name, instance);
    for (const alias of aliases) registerAs(types, alias.toLowerCase(), instance);
};
```

직접 대입 13곳은 `registerAs(X.types, 키, 인스턴스)` 로 바꾼다. **동작은 그대로다** —
지금도 같은 대입을 하고 있다.

역인덱스는 `.type`(소문자) → `Map<인스턴스, { name, key }>` 다. `Algebra.all` 이 쓰는
표시 이름 규칙(대문자 클래스 키 우선, 없으면 조립 키 + 클래스 이름)을 등록 시점에 정해
둔다. `Algebra.all` 은 훑기를 멈추고 인덱스를 꺼낸다 — **O(E) → O(k)**.

## 완료 조건 — "바뀐 것이 무엇을 건드리나"

값이 아니라 **표면과 시점**을 본다(규칙 12).

1. **`Algebra.all` 이 모든 타입에서 키까지 동일**해야 한다. 3개 타입만 보던 격자를
   **전 타입으로 넓혀서** 대조한다.
2. **`Object.keys(X.types)` 가 24개 레지스트리 전부에서 동일**해야 한다. 격자에 5개만
   있으므로 24개로 넓힌다.
3. **지연 등록도 새 문을 지나야 한다** — `Maybe.Semigroup('number')`·`Applicative.Const`·
   트랜스포머 4종을 만든 **뒤에도** 1·2가 성립하는지 본다. 이것이 이번 변경의 핵심
   위험이다: 문을 하나 빠뜨리면 그 인스턴스만 인덱스에 없고, `Algebra.all` 에서 조용히
   사라진다.
4. `npm test` 40 파일 + `tsc`, `npm run baseline` 차이 0건.
5. **성능을 숫자로 남긴다** — `Algebra.all` 이 실제로 O(k) 가 됐는지. 격자는 값만 보므로
   이 변경의 이득도 대가도 격자로는 안 잡힌다(규칙 18).

## 이 계획이 놓칠 수 있는 것

- **인덱스가 최신인지**를 강제하는 것이 없다. 누가 `X.types[키] = ...` 를 다시 직접 쓰면
  인덱스에만 없고 `lookup` 은 된다 — **조용한 불일치**다. 테스트로 "인덱스와 실제 레지스트리가
  일치하는가" 를 박는다.
- 그래도 **직접 대입을 금지할 방법은 없다.** 문법으로 막을 수 없으므로 테스트가 유일한
  게이트다. 게이트가 무엇을 막지 *못하는지* 먼저 적는다(규칙 31-1).
