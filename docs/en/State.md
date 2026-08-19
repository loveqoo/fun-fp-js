# State

> 한국어: [../State.md](../State.md)

**State-transforming monad**

## Concept

State represents **a computation that takes a state and returns (value, new state)**.

- Transforms without explicitly passing the state around
- Injected once through `run(initialState)`
- Automates state threading

## Why State?

### The problem: state has to be passed to every function

```javascript
// 상태를 파라미터로 계속 전달
const increment = state => state + 1;
const double = state => state * 2;
const decrement = state => state - 1;

const pipeline = state => {
    const s1 = increment(state);
    const s2 = double(s1);
    const s3 = decrement(s2);
    return s3;
};

pipeline(5);  // 11
```

**Problems:**
- The state has to be passed explicitly
- Intermediate variables (s1, s2, s3) are needed
- The previous state can be used by mistake
- The code is verbose

### The fix: encapsulate the state flow with State

```javascript
const { State, Chain } = FunFP;
const { chain } = Chain.lookup('state');

const increment = State.modify(s => s + 1);
const double = State.modify(s => s * 2);
const decrement = State.modify(s => s - 1);

const pipeline = chain(
    _ => chain(
        _ => decrement,
        double
    ),
    increment
);

// 또는 인스턴스 메서드로
const pipeline2 = increment
    .chain(_ => double)
    .chain(_ => decrement);

pipeline.exec(5);  // 11 - 상태만 반환
```

**Advantages:**
- The state is injected once, through `run(5)`
- The state is threaded automatically
- No intermediate variables needed
- Clean chaining

## Creation

```javascript
import FunFP from 'fun-fp-js';
const { State } = FunFP;

// of - 상태 불변, 값만 반환
const state = State.of(42);
state.run('any state');  // [42, 'any state']

// new State - 상태 변환 함수
const transform = new State(s => [s * 2, s + 10]);
transform.run(5);  // [10, 15]

// get - 현재 상태 읽기
State.get.run(42);  // [42, 42]

// put - 상태 교체
State.put(100).run(42);  // [undefined, 100]

// modify - 상태 변환
State.modify(s => s * 2).run(21);  // [undefined, 42]

// gets - 상태에서 값 추출
State.gets(s => s.name).run({ name: 'Alice', age: 30 });
// ['Alice', { name: 'Alice', age: 30 }]
```

## Main operations (Static Land first)

### map - transform the value, keep the state (Functor)

```javascript
const { Functor } = FunFP;
const { map } = Functor.lookup('state');

const state = State.of(21);
map(x => x * 2, state).run('any');
// [42, 'any'] - 값만 변경, 상태는 그대로

// 상태 변환하는 경우
const transform = new State(s => [s, s + 10]);
map(x => x * 2, transform).run(5);
// [10, 15] - 값 2배, 상태 +10

// 또는 Static 메서드
State.map(x => x * 2, state);
```

### chain - transform the value + thread the state (Chain)

Chains through a function that returns a State, and the state is passed automatically.

```javascript
const { Chain } = FunFP;
const { chain } = Chain.lookup('state');

const state = State.of(5);
const useValue = x => new State(s => [x + s, s * 2]);

chain(useValue, state).run(10);
// of(5): [5, 10]
// useValue(5): [5 + 10, 10 * 2] = [15, 20]

// 여러 chain 연결
State.of(1)
    .chain(a => new State(s => [a + s, s + 1]))
    .chain(b => new State(s => [b * s, s + 1]))
    .run(10);
// of(1): [1, 10]
// chain 1: [1 + 10, 10 + 1] = [11, 11]
// chain 2: [11 * 11, 11 + 1] = [121, 12]
// [121, 12]

// 또는 Static 메서드
State.chain(useValue, state);
```

### ap - apply a function + thread the state (Apply)

```javascript
const { Apply } = FunFP;
const { ap } = Apply.lookup('state');

const sf = State.of(x => x * 2);
const sa = State.of(21);
ap(sf, sa).run(null);
// [42, null]

// 상태 의존적 계산
const sf2 = new State(s => [x => x + s, s * 2]);
const sa2 = new State(s => [s, s + 1]);
ap(sf2, sa2).run(5);
// sf: s=5 -> [x => x + 5, 10]
// sa: s=10 -> [10, 11]
// apply: (x => x + 5)(10) = 15
// [15, 11]

// 또는 Static 메서드
State.ap(sf, sa);
```

## Running

```javascript
const state = new State(s => [s * 2, s + 10]);

// run - [값, 새상태] 튜플
state.run(5);   // [10, 15]

// eval - 값만
state.eval(5);  // 10

// exec - 새상태만
state.exec(5);  // 15
```

## State helper methods

### State.get - read the current state

```javascript
State.get.run(42);  // [42, 42]

// 상태를 값으로 사용
State.get
    .chain(s => State.of(s * 2))
    .run(21);  // [42, 21]
```

### State.put - replace the state

```javascript
State.put(100).run(42);  // [undefined, 100]

// chain으로 상태 변경 후 계속
State.put(10)
    .chain(_ => State.get)
    .run(42);  // [10, 10] - 상태가 42에서 10으로 변경됨
```

### State.modify - transform the state

```javascript
State.modify(s => s * 2).run(21);  // [undefined, 42]

// chain으로 변환 후 값 얻기
State.modify(s => s + 10)
    .chain(_ => State.get)
    .run(5);  // [15, 15]
```

### State.gets - extract a value from the state

```javascript
State.gets(s => s.name).run({ name: 'Alice', age: 30 });
// ['Alice', { name: 'Alice', age: 30 }]

// 여러 필드 추출
State.gets(s => s.x)
    .chain(x => State.gets(s => s.y).map(y => x + y))
    .run({ x: 10, y: 32 });
// [42, { x: 10, y: 32 }]
```

## Instance methods (conveniences)

Convenience methods added after the Static Land and static methods.

```javascript
// map
State.of(21).map(x => x * 2).eval(null);  // 42

// chain
State.get
    .chain(s => State.put(s + 1))
    .chain(_ => State.get)
    .run(5);  // [6, 6]
```

## Type checking

```javascript
State.isState(State.of(5));              // true
State.isState(new State(s => [s, s]));   // true
State.isState(s => [s, s]);              // false (함수는 State 아님)
State.isState(5);                        // false
```

## Practical examples

### 1. Counter / ID generator

```javascript
const { State } = FunFP;

const increment = State.modify(n => n + 1);
const decrement = State.modify(n => n - 1);
const getCount = State.get;

// 카운터 조작
const program = increment
    .chain(_ => increment)
    .chain(_ => increment)
    .chain(_ => decrement)
    .chain(_ => getCount);

program.eval(0);  // 2
program.exec(0);  // 2

// 고유 ID 생성
const freshId = State.get.chain(n =>
    State.put(n + 1).map(_ => `id_${n}`)
);

const threeIds = freshId
    .chain(id1 => freshId
        .chain(id2 => freshId
            .map(id3 => [id1, id2, id3])));

threeIds.run(0);
// [['id_0', 'id_1', 'id_2'], 3]
```

### 2. Stack operations

```javascript
const { State } = FunFP;

const push = x => State.modify(stack => [...stack, x]);
const pop = new State(stack => {
    const newStack = [...stack];
    const value = newStack.pop();
    return [value, newStack];
});
const peek = State.gets(stack => stack[stack.length - 1]);

// 스택 프로그램
const program = push(1)
    .chain(_ => push(2))
    .chain(_ => push(3))
    .chain(_ => pop)
    .chain(top => State.of(top * 10));

program.run([]);
// [30, [1, 2]]

// 계산기 (후위 표기법)
const calculate = tokens => {
    const processToken = token => {
        if (typeof token === 'number') {
            return push(token);
        }
        // 연산자
        return pop.chain(b =>
            pop.chain(a => {
                let result;
                if (token === '+') result = a + b;
                else if (token === '*') result = a * b;
                return push(result);
            })
        );
    };

    return tokens.reduce(
        (acc, token) => acc.chain(_ => processToken(token)),
        State.of(null)
    ).chain(_ => pop);
};

calculate([5, 3, '+', 2, '*']).eval([]);
// (5 + 3) * 2 = 16
```

### 3. Random number generation (seed-based)

```javascript
const { State } = FunFP;

// 단순 선형 합동 생성기 (Linear Congruential Generator)
const nextRandom = new State(seed => {
    const newSeed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const value = newSeed % 100;  // 0-99 범위
    return [value, newSeed];
});

// 3개의 랜덤 넘버 생성
const threeRandoms = nextRandom
    .chain(r1 => nextRandom
        .chain(r2 => nextRandom
            .map(r3 => [r1, r2, r3])));

threeRandoms.run(42);
// [[67, 12, 89], 1234567890] (예시, 실제 값은 시드에 따라 다름)

// 랜덤 범위 헬퍼
const randomRange = (min, max) =>
    nextRandom.map(n => min + (n % (max - min + 1)));

const rollDice = randomRange(1, 6);
const rollTwoDice = rollDice.chain(d1 =>
    rollDice.map(d2 => d1 + d2)
);

rollTwoDice.eval(42);  // 2-12 사이 값
```

### 4. Parser state management

```javascript
const { State } = FunFP;

// 간단한 파서: 입력 문자열에서 문자 읽기
const char = new State(input => {
    if (input.length === 0) return [null, input];
    return [input[0], input.slice(1)];
});

const satisfy = predicate => char.chain(c =>
    c && predicate(c) ? State.of(c) : State.of(null)
);

const digit = satisfy(c => /\d/.test(c));
const letter = satisfy(c => /[a-z]/i.test(c));

// 숫자 파싱
const number = digit.chain(d1 =>
    digit.map(d2 => d2 ? parseInt(d1 + d2) : parseInt(d1))
);

number.run('42abc');
// [42, 'abc'] - '42'를 파싱하고 'abc'가 남음

// 단어 파싱 (재귀적)
const word = letter.chain(c => {
    if (c === null) return State.of('');
    return word.map(rest => c + rest);
});

word.run('hello123');
// ['hello', '123']
```

### 5. Simulating game turns

```javascript
const { State } = FunFP;

// 게임 상태: { player: { hp, atk }, enemy: { hp, atk }, turn: number }
const attack = (attacker, defender) => State.modify(game => {
    const damage = game[attacker].atk;
    return {
        ...game,
        [defender]: {
            ...game[defender],
            hp: game[defender].hp - damage
        },
        turn: game.turn + 1
    };
});

const playerAttack = attack('player', 'enemy');
const enemyAttack = attack('enemy', 'player');

const isGameOver = State.gets(game =>
    game.player.hp <= 0 || game.enemy.hp <= 0
);

const playTurn = playerAttack
    .chain(_ => enemyAttack);

const playUntilOver = isGameOver.chain(over =>
    over ? State.get : playTurn.chain(_ => playUntilOver)
);

const initialState = {
    player: { hp: 100, atk: 15 },
    enemy: { hp: 80, atk: 10 },
    turn: 0
};

const finalState = playUntilOver.exec(initialState);
console.log('Final state:', finalState);
// 플레이어 또는 적의 HP가 0 이하가 될 때까지 턴 진행
```

### 6. Complex state transformation through State chaining

```javascript
const { State } = FunFP;

// 사용자 프로필 업데이트
const updateProfile = updates => State.modify(profile => ({
    ...profile,
    ...updates,
    updatedAt: new Date().toISOString()
}));

const incrementLoginCount = State.modify(profile => ({
    ...profile,
    loginCount: (profile.loginCount || 0) + 1
}));

const addActivity = activity => State.modify(profile => ({
    ...profile,
    activities: [...(profile.activities || []), activity]
}));

const loginWorkflow = updateProfile({ lastLogin: new Date().toISOString() })
    .chain(_ => incrementLoginCount)
    .chain(_ => addActivity({ type: 'login', timestamp: new Date().toISOString() }))
    .chain(_ => State.get);

const initialProfile = {
    id: 'user123',
    name: 'Alice',
    loginCount: 5,
    activities: []
};

const updatedProfile = loginWorkflow.eval(initialProfile);
console.log(updatedProfile);
// {
//   id: 'user123',
//   name: 'Alice',
//   loginCount: 6,
//   lastLogin: '2026-01-25T...',
//   updatedAt: '2026-01-25T...',
//   activities: [{ type: 'login', timestamp: '...' }]
// }
```

## Related type classes

Type classes that State implements:

- **Functor**: `map` - transforms the value, keeps the state
- **Apply**: `ap` - applies a function, threads the state
- **Applicative**: `of` - creates a State that leaves the state unchanged
- **Chain**: `chain` - chains States, propagates the state
- **Monad**: Applicative + Chain

## State.pipeK / State.composeK

Combine functions that return a State through Kleisli composition.

### State.pipeK - left-to-right composition

```javascript
const add5 = x => new State(s => [x + 5, s + 1]);
const double = x => new State(s => [x * 2, s + 1]);
const toString = x => new State(s => [`Result: ${x}`, s + 1]);

const pipeline = State.pipeK(add5, double, toString);
const [value, finalState] = pipeline(1).run(0);
// value: 'Result: 12'
// finalState: 3 (상태가 3번 증가)
```

### State.composeK - right-to-left composition

```javascript
const add5 = x => new State(s => [x + 5, s + 1]);
const double = x => new State(s => [x * 2, s + 1]);
const toString = x => new State(s => [`Result: ${x}`, s + 1]);

const pipeline = State.composeK(toString, double, add5);
const [value, finalState] = pipeline(1).run(0);
// value: 'Result: 12' (동일한 결과)
```

## State.lift

Lifts a multi-argument function into the State context.

```javascript
const add = (a, b) => a + b;
const liftedAdd = State.lift(add);

const s1 = new State(s => [10, s + 1]);
const s2 = new State(s => [32, s + 1]);

const [value, finalState] = liftedAdd(s1, s2).run(0);
// value: 42
// finalState: 2

// 상태 의존적 State
const multiply = (a, b) => a * b;
const liftedMultiply = State.lift(multiply);

const sx = State.gets(s => s.x);
const sy = State.gets(s => s.y);

liftedMultiply(sx, sy).eval({ x: 6, y: 7 });
// 42
```

## State usage patterns

### When should you use State?

**Good use cases:**
1. State needs to be passed to several functions
2. You want to express state transformation as pure functions
3. State-based computations such as counters, stacks, parsers
4. Random number generation (seed-based)
5. Game loops, simulations

**Cases where it's not needed:**
1. The state is only used inside a single function
2. Simply updating a variable is already clearer
3. The state is global and shared across several modules (consider Redux, etc.)

### State vs explicit state passing

| | Explicit passing | State |
|---|---|---|
| Readability | intuitive | concise once familiar |
| Boilerplate | high (intermediate variables) | low (automatic threading) |
| Risk of error | high (using the wrong state) | low (propagated automatically) |
| Testing | must verify each step | only the final state needs checking |

## Related documents

**Similar types:**
- [Reader](./Reader.md) - environment-based computation (reading only)
- [Writer](./Writer.md) - output-tracking monad

**Type classes used:**
- [Functor](./Functor.md)
- [Apply](./Applicative.md) - `ap` is documented under Applicative
- [Applicative](./Applicative.md)
- [Chain](./Monad.md) - `chain` is documented under Monad
- [Monad](./Monad.md)

**Used together with:**
- State + Reader = ReaderT State (reading the environment + transforming state)
- State + Either = state transformation + error handling
