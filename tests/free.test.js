// Free Monad tests
import fp from '../index.js';
import { test, testAsync, assertEquals, assert, logSection, assertThrowsWith } from './utils.js';

const { Free, Functor, Chain, Monad, trampoline } = fp;
const { Thunk } = Free;

logSection('Free Monad - Basic');

test('Free.of creates Pure', () => {
    const pure = Free.of(42);
    assert(Free.isPure(pure), 'should be Pure');
    assertEquals(pure.value, 42);
});

test('Free.pure creates Pure', () => {
    const pure = Free.pure('hello');
    assert(Free.isPure(pure), 'should be Pure');
    assertEquals(pure.value, 'hello');
});

test('Free.isFree checks Free type', () => {
    const pure = Free.pure(42);
    const impure = Thunk.suspend(() => 42);
    assert(Free.isFree(pure), 'Pure should be Free');
    assert(Free.isFree(impure), 'Impure should be Free');
    assert(!Free.isFree(42), 'Number should not be Free');
});

test('Functor.lookup("free").map transforms value', () => {
    const pure = Free.pure(5);
    const mapped = Functor.lookup('free').map(x => x * 2, pure);
    assert(Free.isPure(mapped), 'should still be Pure');
    assertEquals(mapped.value, 10);
});

test('Chain.lookup("free").chain chains computation', () => {
    const pure = Free.pure(5);
    const result = Chain.lookup('free').chain(x => Free.pure(x + 1), pure);
    assert(Free.isPure(result), 'should be Pure');
    assertEquals(result.value, 6);
});

logSection('Free Monad - Thunk');

test('Thunk.of creates Thunk', () => {
    const thunk = Thunk.of(() => 42);
    assertEquals(thunk.run(), 42);
});

test('Thunk.map composes functions', () => {
    const thunk = Thunk.of(() => 5);
    const mapped = thunk.map(x => x * 2);
    assertEquals(mapped.run(), 10);
});

test('Thunk.done creates Pure', () => {
    const done = Thunk.done(42);
    assert(Free.isPure(done), 'should be Pure');
    assertEquals(done.value, 42);
});

test('Thunk.suspend creates Impure', () => {
    const suspended = Thunk.suspend(() => 42);
    assert(Free.isImpure(suspended), 'should be Impure');
});

logSection('Free Monad - Trampoline');

test('trampoline - simple computation', () => {
    const program = Thunk.done(42);
    const result = trampoline(program);
    assertEquals(result, 42);
});

test('trampoline - suspended computation', () => {
    const program = Thunk.suspend(() => 42);
    const result = trampoline(program);
    assertEquals(result, 42);
});

test('trampoline - chained computation using Chain', () => {
    const chain = Chain.lookup('free');
    const program = chain.chain(
        x => chain.chain(
            y => Thunk.done(y + 1),
            Thunk.suspend(() => x * 2)
        ),
        Thunk.suspend(() => 5)
    );
    const result = trampoline(program);
    assertEquals(result, 11); // (5 * 2) + 1 = 11
});

test('trampoline - stack safe recursion', () => {
    const chain = Chain.lookup('free');
    // Factorial using trampoline (stack safe)
    const factorial = n => {
        const go = (n, acc) =>
            n <= 1
                ? Thunk.done(acc)
                : chain.chain(x => x, Thunk.suspend(() => go(n - 1, n * acc)));
        return trampoline(go(n, 1));
    };
    assertEquals(factorial(5), 120);
    assertEquals(factorial(10), 3628800);
});

test('trampoline - sum with large recursion', () => {
    const chain = Chain.lookup('free');
    const sum = n => {
        const go = (n, acc) =>
            n <= 0
                ? Thunk.done(acc)
                : chain.chain(x => x, Thunk.suspend(() => go(n - 1, acc + n)));
        return trampoline(go(n, 0));
    };
    assertEquals(sum(100), 5050);
    assertEquals(sum(1000), 500500);
});

logSection('Free Monad - runSync');

test('runSync - executes program', () => {
    const interpreter = thunk => thunk.run();
    const program = Thunk.suspend(() => 42);
    const result = Free.runSync(interpreter)(program);
    assertEquals(result, 42);
});

test('runSync - handles function target (memoized)', () => {
    const interpreter = thunk => thunk.run();
    let callCount = 0;
    const makeProgram = () => {
        callCount++;
        return Thunk.suspend(() => callCount);
    };
    const runner = Free.runSync(interpreter)(makeProgram);
    const result1 = runner();
    assert(typeof result1 === 'number', 'should return number');
});

logSection('Free Monad - runAsync');

testAsync('runAsync - executes async program', async () => {
    const asyncInterpreter = async thunk => {
        await new Promise(r => setTimeout(r, 1));
        return thunk.run();
    };
    const program = Thunk.suspend(() => 42);
    const result = await Free.runAsync(asyncInterpreter)(program);
    assertEquals(result, 42);
});

testAsync('runAsync - chains async computations using Chain', async () => {
    const chain = Chain.lookup('free');
    const asyncInterpreter = async thunk => {
        await new Promise(r => setTimeout(r, 1));
        return thunk.run();
    };
    const program = chain.chain(
        x => Thunk.suspend(() => x * 2),
        Thunk.suspend(() => 5)
    );
    const result = await Free.runAsync(asyncInterpreter)(program);
    assertEquals(result, 10);
});

logSection('Free Monad - Static Land Laws');

test('Left identity: chain(f, of(a)) === f(a)', () => {
    const chain = Chain.lookup('free');
    const f = x => Free.pure(x * 2);
    const a = 5;
    const left = chain.chain(f, Free.pure(a));
    const right = f(a);
    assertEquals(left.value, right.value);
});

test('Right identity: chain(of, m) === m', () => {
    const chain = Chain.lookup('free');
    const m = Free.pure(42);
    const result = chain.chain(Free.pure, m);
    assertEquals(result.value, m.value);
});

test('Associativity: chain(g, chain(f, m)) === chain(x => chain(g, f(x)), m)', () => {
    const chain = Chain.lookup('free');
    const m = Free.pure(5);
    const f = x => Free.pure(x + 1);
    const g = x => Free.pure(x * 2);
    const left = chain.chain(g, chain.chain(f, m));
    const right = chain.chain(x => chain.chain(g, f(x)), m);
    assertEquals(left.value, right.value);
});

logSection('Free Monad - pipeK');

test('Free.pipeK composes Kleisli arrows', () => {
    const inc = x => Free.pure(x + 1);
    const double = x => Free.pure(x * 2);
    const pipeline = Free.pipeK(inc, double);
    const result = trampoline(pipeline(5));
    assertEquals(result, 12); // (5 + 1) * 2 = 12
});

logSection('Free Monad - Deep Nesting');

test('Free Monad - deeply nested chain (1000 levels)', () => {
    const chain = Chain.lookup('free');
    let program = Free.pure(0);
    for (let i = 0; i < 1000; i++) {
        program = chain.chain(x => Free.pure(x + 1), program);
    }
    const result = trampoline(program);
    assertEquals(result, 1000);
});

test('Free Monad - deeply nested chain (10000 levels)', () => {
    const chain = Chain.lookup('free');
    let program = Free.pure(0);
    for (let i = 0; i < 10000; i++) {
        program = chain.chain(x => Free.pure(x + 1), program);
    }
    const result = trampoline(program);
    assertEquals(result, 10000);
});

test('Free Monad - deeply nested Thunk.suspend', () => {
    const chain = Chain.lookup('free');
    const buildDeep = (n, acc) => {
        if (n <= 0) return Thunk.done(acc);
        return chain.chain(x => x, Thunk.suspend(() => buildDeep(n - 1, acc + 1)));
    };
    const result = trampoline(buildDeep(5000, 0));
    assertEquals(result, 5000);
});

// 비동기 후속 step 에서 runner 가 던져도 Promise 가 pending 이 아니라 reject 된다(코덱스 2차 ②).
testAsync('runWithTask - 비동기 후속 runner 예외는 reject 로 나온다', async () => {
    let n = 0;
    const program = fp.Chain.lookup('free').chain(() => fp.Free.Thunk.suspend(() => 42), fp.Free.Thunk.suspend(() => 1));
    const runner = fr => { n++; if (n === 2) throw new Error('runner-boom'); return new fp.Task((_, ok) => setTimeout(() => ok(fr.run()), 0)); };
    let outcome = 'PENDING';
    await fp.Free.runWithTask(runner)(program).then(v => { outcome = 'resolve:' + v; }, e => { outcome = 'reject:' + e.message; });
    assertEquals(outcome, 'reject:runner-boom');
});

/* ── Free.dsl — 계획 .dev/plan/260816-free-dsl.md 의 완료조건 ──
   내부 명령 함자(makeDslCommand)는 레지스트리 밖 산물이라 staticland-laws 의 순회에
   안 잡힌다 — 함자 법칙(항등·합성·스택)은 여기(공개 표면 경유 관측)가 유일한 감시자다. */

testAsync('Free.dsl - 함자 법칙: 항등·합성 (관측 대조)', async () => {
    const api = fp.Free.dsl('probe');
    const run = p => api.interpreter({ probe: x => x }).run(p);
    const f = x => x + 1, g = x => x * 2;
    assertEquals(await run(api.probe(7).map(x => x)), await run(api.probe(7)));                    // 항등
    assertEquals(await run(api.probe(3).map(g).map(f)), await run(api.probe(3).map(x => f(g(x))))); // 합성
});

testAsync('Free.dsl - 깊은 map 사슬에 스택이 안 자란다 (2만 단계)', async () => {
    const api = fp.Free.dsl('zero');
    let p = api.zero();
    for (let i = 0; i < 20000; i++) p = p.map(v => v + 1);
    assertEquals(await api.interpreter({ zero: () => 0 }).run(p), 20000);
});

testAsync('Free.dsl - 계약 시나리오: 두 해석기, thenable 값이 중간에 쓰인다', async () => {
    const api = fp.Free.dsl('getUser', 'getPosts');
    // thenable 승격 검증의 핵심: 중간 명령(getUser)이 Promise 를 주고 그 값을 다음 명령이 쓴다
    const program = api.getUser(1).chain(user => api.getPosts(user.id).map(posts => user.name + ':' + posts.length));
    const real = api.interpreter({
        getUser: id => Promise.resolve({ id, name: 'anthony' }),
        getPosts: userId => fp.Task.of([{}, {}]),
    });
    assertEquals(await real.run(program), 'anthony:2');
    const mock = api.interpreter({ getUser: () => ({ id: 0, name: 'MOCK' }), getPosts: () => [] });
    assertEquals(await mock.run(program), 'MOCK:0');       // 같은 프로그램, 다른 세계
    assertEquals(await real.run(program), 'anthony:2');    // 재실행 안전
    const { getUser } = api;                               // 구조분해 안전
    assertEquals(await real.run(getUser(1).map(u => u.name)), 'anthony');
});

test('Free.dsl - 선언·해석기 시점 에러 문안 (동기 6종)', () => {
    assertThrowsWith(() => fp.Free.dsl(''), 'Free.dsl: command name must be a non-empty string');
    assertThrowsWith(() => fp.Free.dsl('interpreter'), "Free.dsl: command name 'interpreter' is reserved");
    assertThrowsWith(() => fp.Free.dsl('a', 'a'), "Free.dsl: duplicate command name 'a'");
    const api = fp.Free.dsl('a');
    assertThrowsWith(() => api.interpreter(null), 'Free.dsl.interpreter: handlers must be a plain object');
    assertThrowsWith(() => api.interpreter({ a: x => x, gohst: x => x }), "Free.dsl.interpreter: unknown command 'gohst'");
    assertThrowsWith(() => api.interpreter({}), "Free.dsl.interpreter: missing handler 'a'");
    // 상속 핸들러는 표현 자체가 불가 — 커스텀 프로토타입은 plain object 관문이 먼저 거른다(포섭).
    assertThrowsWith(() => api.interpreter(Object.assign(Object.create({ a: x => x }), {})),
        'Free.dsl.interpreter: handlers must be a plain object');
});

testAsync('Free.dsl - 실행 시점 reject 문안 (비동기 2종) + 예외 경로', async () => {
    const api = fp.Free.dsl('a');
    const it = api.interpreter({ a: x => x });
    assertEquals(await it.run(42).catch(e => e.message), 'Free.dsl.run: program must be a Free value');
    const B = fp.Free.dsl('b');
    assertEquals(await it.run(api.a(1).chain(() => B.b())).catch(e => e.message), "Free.dsl.run: no handler for 'b'");
    // 핸들러 throw / thenable 거부 / then getter 예외 → 전부 reject
    const boom = api.interpreter({ a: () => { throw new Error('h-boom'); } });
    assertEquals(await boom.run(api.a()).catch(e => e.message), 'h-boom');
    const rej = api.interpreter({ a: () => Promise.reject(new Error('p-boom')) });
    assertEquals(await rej.run(api.a()).catch(e => e.message), 'p-boom');
    const evil = api.interpreter({ a: () => ({ get then() { throw new Error('g-boom'); } }) });
    assertEquals(await evil.run(api.a()).catch(e => e.message), 'g-boom');
});

testAsync('Free.dsl - 어휘 0개 허용, 프로토타입 이름 명령 안전', async () => {
    const empty = fp.Free.dsl();
    assertEquals(await empty.interpreter({}).run(fp.Free.of(7)), 7);   // 순수 프로그램만
    const api = fp.Free.dsl('toString', 'constructor');
    const it = api.interpreter({ toString: () => 'ts', constructor: () => 'ctor' });
    assertEquals(await it.run(api.toString().chain(a => api.constructor().map(b => a + '/' + b))), 'ts/ctor');
    assertEquals(Object.getPrototypeOf({}), Object.prototype);          // 오염 없음 확인용 카나리
});

console.log('\n✅ Free Monad tests completed\n');
