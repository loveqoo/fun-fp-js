# State

**상태 변환 모나드**

## 개념

State는 **상태를 입력받아 (값, 새상태)를 반환하는 계산**을 표현합니다.

- 상태를 명시적으로 전달하지 않고 변환
- `run(initialState)`로 한번만 주입
- 상태 스레딩(threading)을 자동화

## 왜 State인가?

### 문제: 상태를 함수마다 전달해야 함

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

**문제점:**
- 상태를 명시적으로 전달해야 함
- 중간 변수(s1, s2, s3)가 필요
- 실수로 이전 상태를 사용할 수 있음
- 코드가 장황함

### 해결: State로 상태 흐름 캡슐화

```javascript
const { State, Chain } = FunFP;
const { chain } = Chain.of('state');

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

**장점:**
- 상태는 `run(5)`로 한번만 주입
- 상태가 자동으로 전달됨
- 중간 변수 불필요
- 깔끔한 체이닝

## 생성

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

## 주요 연산 (Static Land 우선)

### map - 값 변환, 상태 유지 (Functor)

```javascript
const { Functor } = FunFP;
const { map } = Functor.of('state');

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

### chain - 값 변환 + 상태 흐름 (Chain)

State를 반환하는 함수로 연쇄하며, 상태가 자동 전달됩니다.

```javascript
const { Chain } = FunFP;
const { chain } = Chain.of('state');

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

### ap - 함수 적용 + 상태 스레딩 (Apply)

```javascript
const { Apply } = FunFP;
const { ap } = Apply.of('state');

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

## 실행

```javascript
const state = new State(s => [s * 2, s + 10]);

// run - [값, 새상태] 튜플
state.run(5);   // [10, 15]

// eval - 값만
state.eval(5);  // 10

// exec - 새상태만
state.exec(5);  // 15
```

## State 헬퍼 메서드

### State.get - 현재 상태 읽기

```javascript
State.get.run(42);  // [42, 42]

// 상태를 값으로 사용
State.get
    .chain(s => State.of(s * 2))
    .run(21);  // [42, 21]
```

### State.put - 상태 교체

```javascript
State.put(100).run(42);  // [undefined, 100]

// chain으로 상태 변경 후 계속
State.put(10)
    .chain(_ => State.get)
    .run(42);  // [10, 10] - 상태가 42에서 10으로 변경됨
```

### State.modify - 상태 변환

```javascript
State.modify(s => s * 2).run(21);  // [undefined, 42]

// chain으로 변환 후 값 얻기
State.modify(s => s + 10)
    .chain(_ => State.get)
    .run(5);  // [15, 15]
```

### State.gets - 상태에서 값 추출

```javascript
State.gets(s => s.name).run({ name: 'Alice', age: 30 });
// ['Alice', { name: 'Alice', age: 30 }]

// 여러 필드 추출
State.gets(s => s.x)
    .chain(x => State.gets(s => s.y).map(y => x + y))
    .run({ x: 10, y: 32 });
// [42, { x: 10, y: 32 }]
```

## 인스턴스 메서드 (편의 기능)

Static Land 및 Static 메서드 이후에 추가된 편의 메서드입니다.

```javascript
// map
State.of(21).map(x => x * 2).eval(null);  // 42

// chain
State.get
    .chain(s => State.put(s + 1))
    .chain(_ => State.get)
    .run(5);  // [6, 6]
```

## 타입 체크

```javascript
State.isState(State.of(5));              // true
State.isState(new State(s => [s, s]));   // true
State.isState(s => [s, s]);              // false (함수는 State 아님)
State.isState(5);                        // false
```

## 실용적 예시

### 1. 카운터 / ID 생성기

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

### 2. 스택 연산

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

### 3. 랜덤 넘버 생성 (시드 기반)

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

### 4. 파서 상태 관리

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

### 5. 게임 턴 시뮬레이션

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

### 6. State 체이닝으로 복잡한 상태 변환

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

## 관련 타입 클래스

State가 구현하는 타입 클래스:

- **Functor**: `map` - 값 변환, 상태 유지
- **Apply**: `ap` - 함수 적용, 상태 스레딩
- **Applicative**: `of` - 상태 불변 State 생성
- **Chain**: `chain` - State 연쇄, 상태 전파
- **Monad**: Applicative + Chain

## State.pipeK / State.composeK

Kleisli 합성으로 State를 반환하는 함수들을 조합합니다.

### State.pipeK - 왼쪽에서 오른쪽 합성

```javascript
const add5 = x => new State(s => [x + 5, s + 1]);
const double = x => new State(s => [x * 2, s + 1]);
const toString = x => new State(s => [`Result: ${x}`, s + 1]);

const pipeline = State.pipeK(add5, double, toString);
const [value, finalState] = pipeline(1).run(0);
// value: 'Result: 12'
// finalState: 3 (상태가 3번 증가)
```

### State.composeK - 오른쪽에서 왼쪽 합성

```javascript
const pipeline = State.composeK(toString, double, add5);
const [value, finalState] = pipeline(1).run(0);
// value: 'Result: 12' (동일한 결과)
```

## State.lift

다중 인자 함수를 State 컨텍스트로 리프트합니다.

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

## State 사용 패턴

### 언제 State를 사용하는가?

**사용하면 좋은 경우:**
1. 상태를 여러 함수에 전달해야 할 때
2. 상태 변환을 순수 함수로 표현하고 싶을 때
3. 카운터, 스택, 파서 등 상태 기반 연산
4. 랜덤 넘버 생성 (시드 기반)
5. 게임 루프, 시뮬레이션

**사용하지 않아도 되는 경우:**
1. 상태가 한 함수에서만 사용될 때
2. 단순히 변수를 업데이트하는 것이 더 명확할 때
3. 상태가 전역적이고 여러 모듈에서 공유될 때 (Redux 등 고려)

### State vs 명시적 상태 전달

| | 명시적 전달 | State |
|---|---|---|
| 가독성 | 직관적 | 익숙해지면 간결 |
| 보일러플레이트 | 많음 (중간 변수) | 적음 (자동 스레딩) |
| 에러 가능성 | 높음 (잘못된 상태 사용) | 낮음 (자동 전파) |
| 테스트 | 각 단계 검증 필요 | 최종 상태만 검증 |

## 관련 문서

**비슷한 타입:**
- [Reader](./Reader.md) - 환경 기반 계산 (상태 읽기만)
- [Writer](./Writer.md) - 출력 추적 모나드

**사용하는 타입 클래스:**
- [Functor](./Functor.md)
- [Apply](./Apply.md)
- [Applicative](./Applicative.md)
- [Chain](./Chain.md)
- [Monad](./Monad.md)

**함께 사용:**
- State + Reader = ReaderT State (환경 읽기 + 상태 변환)
- State + Either = 상태 변환 + 에러 처리
