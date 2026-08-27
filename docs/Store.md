# Store

> English: [./en/Store.md](./en/Store.md)

**모든 위치의 값을 이미 알고, 지금 어디를 보는지만 든 타입 — State 의 쌍대**

## 개념

Store 는 두 가지로 이뤄집니다.

- **조회** — 위치를 받아 값을 내는 함수 `S -> A`
- **초점** — 지금 보고 있는 위치 `S`

State 와 화살표 방향이 반대입니다. State 는 「상태를 받아 값과 새 상태를 **내놓는**」 것이고,
Store 는 「모든 상태에서의 값을 **이미 알고**, 지금 어디를 보는지만 든」 것입니다.
그래서 State 는 Monad 이고 Store 는 **Comonad** 입니다.

| | 받는 함수 | 하는 일 |
| --- | --- | --- |
| `chain` (Monad) | `a -> M b` — 값 하나로 문맥을 만든다 | 만들어진 문맥들을 이어 붙인다 |
| `extend` (Comonad) | `W a -> b` — 문맥 전체에서 값 하나를 뽑는다 | 모든 위치에서 뽑아 새 문맥을 짓는다 |

## 문

```javascript
import FunFP from 'fun-fp-js';
const { Store } = FunFP;

const w = new Store(x => x * 10, 3);   // 조회: 10배, 초점: 3

console.log(w.extract());                       // 30   초점 위치를 읽는다
console.log(w.peek(7));                         // 70   초점을 안 옮기고 다른 위치를 읽는다
console.log(w.seek(5).extract());               // 50   초점만 옮긴 새 Store
console.log(w.experiment(i => [i - 1, i + 1])); // [ 20, 40 ]   여러 위치를 한 번에
console.log(w.map(n => n + 1).extract());       // 31   조회 뒤에 합성
```

`extend` 가 핵심입니다. **한 위치만 보는 국소 규칙**을 주면, **모든 위치에서 그 규칙을 본
새 Store** 가 나옵니다.

```javascript
const { Store } = FunFP;

const w = new Store(x => x * 10, 3);
// 규칙: 자기 값 + 오른쪽 이웃 값. Store 하나(초점 있는 시야)를 받아 값 하나를 낸다.
const rule = s => s.extract() + s.peek(s.index + 1);

const next = w.extend(rule);
console.log(next.extract());   // 70   초점 3 에서: 30 + 40
console.log(next.peek(0));     // 10   위치 0 에서: 0 + 10
```

레지스트리에는 `Functor`·`Extend`·`Comonad` 세 인스턴스가 `store` 키로 등록돼 있습니다.

```javascript
const { Store, Comonad } = FunFP;
const w = new Store(x => x + 1, 0);
console.log(Comonad.lookup('store').extract(w) === w.extract());   // true
```

## 라이프 게임 — 국소 규칙이 판 전체가 된다

Store 의 대표 사례입니다. 규칙은 **칸 하나와 그 이웃만** 압니다. 판 전체를 아는 코드는
어디에도 없습니다 — `extend` 한 번이 판 전체의 한 세대입니다.

```javascript
const { Store } = FunFP;

const W = 5, H = 5;
const key = ([x, y]) => `${x},${y}`;
const wrap = n => ((n % W) + W) % W;
const neighbours = ([x, y]) => {
    const out = [];
    for (const dx of [-1, 0, 1]) for (const dy of [-1, 0, 1])
        if (dx || dy) out.push([wrap(x + dx), wrap(y + dy)]);
    return out;
};

// 국소 규칙: 내 칸과 이웃 여덟만 본다
const conway = grid => {
    const alive = grid.experiment(neighbours).filter(Boolean).length;
    return grid.extract() ? (alive === 2 || alive === 3) : alive === 3;
};

const glider = new Set([[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]].map(key));
const board = new Store(pos => glider.has(key(pos)), [0, 0]);

const next = Store.memo(board.extend(conway), key);   // 한 세대 — memo 는 아래 「성능」 참조

const show = grid => {
    const rows = [];
    for (let y = 0; y < H; y += 1) {
        let row = '';
        for (let x = 0; x < W; x += 1) row += grid.peek([x, y]) ? '#' : '.';
        rows.push(row);
    }
    return rows.join('\n');
};
console.log(show(next) === '.....\n#.#..\n.##..\n.#...\n.....');   // true   글라이더가 한 칸 내려왔다
```

## 성능 — 반복 `extend` 는 `memo` 로 감싸야 합니다

`extend` 는 아무것도 계산하지 않습니다. **조회 함수를 한 겹 더 감쌀 뿐입니다.** 그래서
라이프 게임처럼 **규칙이 여러 위치를 읽으면**, 세대를 거듭할 때 읽기 한 번이 이전 세대
전체의 재계산이 되어 **비용이 지수로 폭발합니다.** 한 위치만 읽는 규칙이면 선형이라
memo 가 없어도 됩니다.

```javascript no-run 세대 수에 따라 지수적으로 느려지는 문제 상황
let board = new Store(lookup, [0, 0]);
for (let g = 0; g < 20; g += 1) board = board.extend(conway);   // 이대로는 못 돌린다
```

`Store.memo(store, keyOf)` 가 조회에 캐시를 끼운 새 Store 를 냅니다. **`keyOf` 는
필수입니다** — 위치를 캐시 키로 바꾸는 방법은 위치 타입마다 달라서, 라이브러리가
기본값을 정하지 않고 쓰는 쪽에 위임합니다. 숫자·문자열이면 항등(`s => s`)이면 되고
(단 하나의 경계 — 캐시의 Map 은 `+0` 과 `-0` 을 같은 키로 봅니다. 그 둘을 가르는 조회라면
키에서도 갈라 주십시오), 좌표 배열 같은 객체면 직렬화를 줍니다.

```javascript
const { Store } = FunFP;

let calls = 0;
const m = Store.memo(new Store(x => { calls += 1; return x * 2; }, 0), s => s);
m.peek(5); m.peek(5); m.peek(5);
console.log(calls);   // 1   세 번 읽어도 계산은 한 번

// 객체 위치는 직렬화를 준다 — 항등이면 매번 새 배열이라 캐시가 안 걸린다
const grid = Store.memo(new Store(([x, y]) => x + y, [0, 0]), ([x, y]) => x + ',' + y);
console.log(grid.peek([1, 2]));   // 3
```

**서로 다른 위치가 같은 키를 받으면 뒤에 읽은 위치가 앞의 값을 돌려받습니다** — 키가
위치를 가르는 것은 `keyOf` 를 준 쪽의 책임입니다. 왜 기본값을 두지 않았는지는
[internals](./internals.md#store-perf)에 있습니다.

## 관련 타입 클래스

- **[Comonad](./Comonad.md)** — `extract` 의 집. Store 는 `Identity`·`Array`·`NonEmptyList` 에
  이은 네 번째 인스턴스이고, 컨테이너가 아닌 첫 인스턴스입니다.
- **[State](./State.md)** — 쌍대. 상태를 **바꾸며 나아가는** 쪽.
- **[Reader](./Reader.md)** — 조회 함수만 있고 초점이 없는 것이 Reader 입니다. 초점 하나를
  더 들면 Store 가 됩니다.
