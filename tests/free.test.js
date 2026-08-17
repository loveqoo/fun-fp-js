// Free Monad tests
import fp from '../index.js';
import { test, testAsync, assertEquals, assert, logSection, assertThrowsWith } from './utils.js';

const { Free, Functor, Chain, Monad, Task, trampoline } = fp;
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

/* ── Free.api — 계획 .dev/plan/260816-free-dsl.md 의 완료조건 ──
   내부 명령 함자(makeApiCommand)는 레지스트리 밖 산물이라 staticland-laws 의 순회에
   안 잡힌다 — 함자 법칙(항등·합성·스택)은 여기(공개 표면 경유 관측)가 유일한 감시자다. */

testAsync('Free.api - 함자 법칙: 항등·합성 (관측 대조)', async () => {
    const api = fp.Free.api('probe');
    const run = p => api.interpreter({ probe: x => x }).run(p);
    const f = x => x + 1, g = x => x * 2;
    assertEquals(await run(api.probe(7).map(x => x)), await run(api.probe(7)));                    // 항등
    assertEquals(await run(api.probe(3).map(g).map(f)), await run(api.probe(3).map(x => f(g(x))))); // 합성
});

testAsync('Free.api - 깊은 map 사슬에 스택이 안 자란다 (2만 단계)', async () => {
    const api = fp.Free.api('zero');
    let p = api.zero();
    for (let i = 0; i < 20000; i++) p = p.map(v => v + 1);
    assertEquals(await api.interpreter({ zero: () => 0 }).run(p), 20000);
});

testAsync('Free.api - 계약 시나리오: 두 해석기, thenable 값이 중간에 쓰인다', async () => {
    const api = fp.Free.api('getUser', 'getPosts');
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

test('Free.api - 선언·해석기 시점 에러 문안 (동기 6종)', () => {
    assertThrowsWith(() => fp.Free.api(''), 'Free.api: command name must be a non-empty string');
    assertThrowsWith(() => fp.Free.api('interpreter'), "Free.api: command name 'interpreter' is reserved");
    assertThrowsWith(() => fp.Free.api('a', 'a'), "Free.api: duplicate command name 'a'");
    const api = fp.Free.api('a');
    assertThrowsWith(() => api.interpreter(null), 'Free.api.interpreter: handlers must be a plain object');
    assertThrowsWith(() => api.interpreter({ a: x => x, gohst: x => x }), "Free.api.interpreter: unknown command 'gohst'");
    assertThrowsWith(() => api.interpreter({}), "Free.api.interpreter: missing handler 'a'");
    // 상속 핸들러는 표현 자체가 불가 — 커스텀 프로토타입은 plain object 관문이 먼저 거른다(포섭).
    assertThrowsWith(() => api.interpreter(Object.assign(Object.create({ a: x => x }), {})),
        'Free.api.interpreter: handlers must be a plain object (inherited handlers are not accepted)');
});

testAsync('Free.api - 실행 시점 reject 문안 (비동기 2종) + 예외 경로', async () => {
    const api = fp.Free.api('a');
    const it = api.interpreter({ a: x => x });
    assertEquals(await it.run(42).catch(e => e.message), 'Free.api.run: program must be a Free value');
    const B = fp.Free.api('b');
    assertEquals(await it.run(api.a(1).chain(() => B.b())).catch(e => e.message), "Free.api.run: no handler for 'b'");
    // 핸들러 throw / thenable 거부 / then getter 예외 → 전부 reject
    const boom = api.interpreter({ a: () => { throw new Error('h-boom'); } });
    assertEquals(await boom.run(api.a()).catch(e => e.message), 'h-boom');
    const rej = api.interpreter({ a: () => Promise.reject(new Error('p-boom')) });
    assertEquals(await rej.run(api.a()).catch(e => e.message), 'p-boom');
    const evil = api.interpreter({ a: () => ({ get then() { throw new Error('g-boom'); } }) });
    assertEquals(await evil.run(api.a()).catch(e => e.message), 'g-boom');
});

testAsync('Free.api - 어휘 0개 허용, 프로토타입 이름 명령 안전', async () => {
    const empty = fp.Free.api();
    assertEquals(await empty.interpreter({}).run(fp.Free.of(7)), 7);   // 순수 프로그램만
    const api = fp.Free.api('toString', 'constructor');
    const it = api.interpreter({ toString: () => 'ts', constructor: () => 'ctor' });
    assertEquals(await it.run(api.toString().chain(a => api.constructor().map(b => a + '/' + b))), 'ts/ctor');
    assertEquals(Object.getPrototypeOf({}), Object.prototype);          // 오염 없음 확인용 카나리
});

console.log('\n✅ Free Monad tests completed\n');

testAsync('4차-2: 동명 명령이라도 다른 api 의 프로그램은 거부된다', async () => {
    const billing = Free.api('get');
    const secrets = Free.api('get');
    const outcome = await secrets.interpreter({ get: k => 'secret:' + k })
        .run(billing.get('invoice-42'))
        .then(v => ['resolve', v], e => ['reject', e.message]);
    assertEquals(outcome[0], 'reject');
    assert(outcome[1].indexOf("no handler for 'get'") >= 0, '거부 문안: ' + outcome[1]);
});

/* ── 4차-3: 연속 적재 O(n) — 계획 .dev/plan/260817-free-api-continuation.md ── */

test('4차-3: map 은 연속을 복사하지 않고 이전 목록을 참조로 공유한다', () => {
    const api = Free.api('go');
    const base = api.go();
    const mapped = base.map(x => x + 1);
    assert(mapped.functor.fns.prev === base.functor.fns, '이전 연속이 참조 그대로 공유돼야 한다');
});

test('4차-3: 구성에 concat 이 쓰이지 않는다 (보조 계측)', () => {
    const api = Free.api('go');
    let program = api.go();
    const orig = Array.prototype.concat;
    let calls = 0;
    Array.prototype.concat = function (...a) { calls++; return orig.apply(this, a); };
    try { for (let i = 0; i < 1000; i++) program = program.map(x => x); }
    finally { Array.prototype.concat = orig; }
    assertEquals(calls, 0);
});

testAsync('4차-3: 한 프로그램에서 갈라진 두 갈래는 서로 독립이다', async () => {
    const api = Free.api('num');
    const it = api.interpreter({ num: () => 10 });
    const base = api.num().map(x => x + 1);
    const p1 = base.map(x => x * 2);
    const p2 = base.map(x => x * 3);
    assertEquals(await it.run(p1), 22);
    assertEquals(await it.run(p2), 33);
    assertEquals(await it.run(p1), 22);
    assertEquals(await it.run(base), 11);
});

testAsync('4차-3: 실행 단계도 배열 복사가 없다 (run 중 slice/concat 0회)', async () => {
    const api = Free.api('go');
    const it = api.interpreter({ go: () => 0 });
    let p = api.go();
    for (let i = 0; i < 2000; i++) p = p.map(x => x + 1);
    const oSlice = Array.prototype.slice, oConcat = Array.prototype.concat;
    let calls = 0;
    Array.prototype.slice = function (...a) { calls++; return oSlice.apply(this, a); };
    Array.prototype.concat = function (...a) { calls++; return oConcat.apply(this, a); };
    try {
        const v = await it.run(p);
        assertEquals(v, 2000);
        assertEquals(calls, 0);
    } finally {
        Array.prototype.slice = oSlice;
        Array.prototype.concat = oConcat;
    }
});

/* ── Free.interpreters — 계획 .dev/plan/260817-free-interpreters.md ── */

testAsync('interpreters: 두 api 를 섞은 프로그램이 실행된다', async () => {
    const db = Free.api('load', 'save');
    const mail = Free.api('send');
    const it = Free.interpreters(
        db.interpreter({ load: k => '유저:' + k, save: x => x }),
        mail.interpreter({ send: to => Promise.resolve('발송→' + to) })
    );
    const program = db.load('u1').chain(u => mail.send(u)).chain(r => db.save('기록:' + r));
    assertEquals(await it.run(program), '기록:발송→유저:u1');
});

testAsync('interpreters: 동명 명령이 각자 명부로 라우팅된다', async () => {
    const a = Free.api('get');
    const b = Free.api('get');
    const it = Free.interpreters(
        a.interpreter({ get: k => 'A:' + k }),
        b.interpreter({ get: k => 'B:' + k })
    );
    assertEquals(await it.run(a.get('x')), 'A:x');
    assertEquals(await it.run(b.get('x')), 'B:x');
    assertEquals(await it.run(a.get('1').chain(x => b.get(x))), 'B:A:1');
});

testAsync('interpreters: 명부 밖 api 와 비-Free 입력은 기존 문안으로 거부', async () => {
    const a = Free.api('go');
    const c = Free.api('go');
    const it = Free.interpreters(a.interpreter({ go: () => 1 }));
    const r1 = await it.run(c.go()).then(() => 'resolve', e => e.message);
    assertEquals(r1, "Free.api.run: no handler for 'go' (the api owning this command has no interpreter here — another api also defines 'go')");
    const r2 = await it.run(42).then(() => 'resolve', e => e.message);
    assertEquals(r2, 'Free.api.run: program must be a Free value');
});

testAsync('interpreters: 중첩 합성 — (AB)C 와 A(BC) 둘 다 동작', async () => {
    const A = Free.api('a'), B = Free.api('b'), C = Free.api('c');
    const [ia, ib, ic] = [A.interpreter({ a: () => 'a' }), B.interpreter({ b: () => 'b' }), C.interpreter({ c: () => 'c' })];
    const p = A.a().chain(x => B.b().chain(y => C.c().map(z => x + y + z)));
    assertEquals(await Free.interpreters(Free.interpreters(ia, ib), ic).run(p), 'abc');
    assertEquals(await Free.interpreters(ia, Free.interpreters(ib, ic)).run(p), 'abc');
});

test('interpreters: 같은 api 중복은 위치와 무관하게 동기 거부', () => {
    const A = Free.api('a'), B = Free.api('b');
    const ia = A.interpreter({ a: () => 1 });
    const ia2 = A.interpreter({ a: () => 2 });
    const ib = B.interpreter({ b: () => 3 });
    assertThrowsWith(() => Free.interpreters(ia, ia2), 'Free.interpreters: duplicate interpreter for the same api');
    assertThrowsWith(() => Free.interpreters(Free.interpreters(ia, ib), ia2), 'Free.interpreters: duplicate interpreter for the same api');
    assertThrowsWith(() => Free.interpreters(Free.interpreters(ia, ib), Free.interpreters(ia2)), 'Free.interpreters: duplicate interpreter for the same api');
});

test('interpreters: 빈 인자·위조 인자는 동기 라벨 거부, 반환 객체에 심볼 없음', () => {
    assertThrowsWith(() => Free.interpreters(), 'Free.interpreters: at least one interpreter is required');
    assertThrowsWith(() => Free.interpreters(null), 'Free.interpreters: arguments must be Free.api interpreters');
    assertThrowsWith(() => Free.interpreters({ run: () => Promise.resolve(1) }), 'Free.interpreters: arguments must be Free.api interpreters');
    const A = Free.api('a');
    const it = Free.interpreters(A.interpreter({ a: () => 1 }));
    assertEquals(Object.getOwnPropertySymbols(it).length, 0);
    assertEquals(Object.keys(it), ['run', 'start']);
});

test('interpreters: 각 해석기의 생성 시점 검증은 합성과 무관하게 산다', () => {
    const A = Free.api('a');
    assertThrowsWith(() => Free.interpreters(A.interpreter({})), "Free.api.interpreter: missing handler 'a'");
    assertThrowsWith(() => Free.interpreters(A.interpreter({ a: () => 1, typo: () => 2 })), "Free.api.interpreter: unknown command 'typo'");
});

testAsync('interpreters: 라우터 경로의 에러·연속 재검증', async () => {
    const A = Free.api('boom', 'deny', 'val');
    const it = Free.interpreters(A.interpreter({
        boom: () => { throw new Error('던짐'); },
        deny: () => Promise.reject(new Error('거부')),
        val: () => 1,
    }));
    assertEquals(await it.run(A.boom()).then(() => 'resolve', e => e.message), '던짐');
    assertEquals(await it.run(A.deny()).then(() => 'resolve', e => e.message), '거부');
    let deep = A.val();
    for (let i = 0; i < 2000; i++) deep = deep.map(x => x + 1);
    assertEquals(await it.run(deep), 2001);
});

testAsync('interpreters: Task 반환 핸들러와 던지는 then 게터도 라우터에서 규약대로', async () => {
    const A = Free.api('t', 'evil');
    const it = Free.interpreters(A.interpreter({
        t: () => Task.of(3),
        evil: () => ({ get then() { throw new Error('then-게터'); } }),
    }));
    assertEquals(await it.run(A.t()), 3);
    assertEquals(await it.run(A.evil()).then(() => 'resolve', e => e.message), 'then-게터');
});

testAsync('interpreters: 이름이 겹칠 때만 거부 문안에 원인 절이 붙는다', async () => {
    const Ui = Free.api('log');
    const Net = Free.api('log');
    const router = Free.interpreters(Ui.interpreter({ log: () => 'ui' }));
    assertEquals(await router.run(Ui.log('x')), 'ui');
    const msg = await router.run(Net.log('x')).then(() => 'resolve', e => e.message);
    assertEquals(msg, "Free.api.run: no handler for 'log' (the api owning this command has no interpreter here — another api also defines 'log')");
    const Other = Free.api('zap');
    const msg2 = await router.run(Other.zap()).then(() => 'resolve', e => e.message);
    assertEquals(msg2, "Free.api.run: no handler for 'zap'");
});

/* ── start/cancel — 계획 .dev/plan/260818-free-api-start.md (v2) ── */

testAsync('start①: 진행 중 취소 — 이후 핸들러 미시작, 문안·표식 동시', async () => {
    const api = Free.api('step');
    let calls = 0;
    const it = api.interpreter({ step: n => { calls++; return new Promise(res => setTimeout(() => res(n), 20)); } });
    let p = api.step(1);
    for (const n of [2, 3, 4]) p = p.chain(() => api.step(n));
    const h = it.start(p);
    setTimeout(h.cancel, 30);   // 2단계 비행 중
    const e = await h.promise.then(() => null, e => e);
    assertEquals(e.message, 'Free.api.run: cancelled');
    assertEquals(e.cancelled, true);
    assert(calls === 2, '취소 후 핸들러가 더 불렸다: ' + calls);
});

testAsync('start②: 취소 후에는 사용자 연속(.map)도 실행되지 않는다', async () => {
    const api = Free.api('go');
    const it = api.interpreter({ go: () => new Promise(res => setTimeout(() => res(1), 20)) });
    let mapped = false;
    const h = it.start(api.go().map(v => { mapped = true; return v; }));
    setTimeout(h.cancel, 5);    // 비행 중 취소 — 착륙 후 연속 적용 전에 걸려야 한다
    await h.promise.then(() => null, () => null);
    assertEquals(mapped, false);
});

testAsync('start③: 정착 후 취소·이중 취소는 무해하다', async () => {
    const api = Free.api('go');
    const it = api.interpreter({ go: () => 7 });
    const h = it.start(api.go());
    const v = await h.promise;
    h.cancel(); h.cancel();
    assertEquals(v, 7);
    assertEquals(await h.promise, 7);   // 정착값 불변
});

testAsync('start④: 라우터(Free.interpreters)에서도 start 가 동작한다', async () => {
    const a = Free.api('x');
    const b = Free.api('y');
    const it = Free.interpreters(
        a.interpreter({ x: () => new Promise(res => setTimeout(() => res('x'), 20)) }),
        b.interpreter({ y: () => 'y' })
    );
    const h = it.start(a.x().chain(() => b.y()));
    setTimeout(h.cancel, 5);
    const e = await h.promise.then(() => null, e => e);
    assertEquals(e.cancelled, true);
});

testAsync('start⑤: 핸들러 안에서 cancel 하면 다음 경계에서 발효한다 (타이머 없는 즉시 정착 경로)', async () => {
    // 완전 동기 프로그램은 start() 반환 전에 완주해 취소할 틈이 없다(계약). 즉시 정착
    // Promise 는 경계가 마이크로태스크로 갈라져 손잡이가 잡힌다 — 그 경로를 고정한다.
    const api = Free.api('step');
    let handle;
    let calls = 0;
    const it = api.interpreter({ step: n => { calls++; if (n === 2) handle.cancel(); return Promise.resolve(n); } });
    let p = api.step(1);
    for (const n of [2, 3, 4]) p = p.chain(() => api.step(n));
    handle = it.start(p);
    const e = await handle.promise.then(() => null, e => e);
    assertEquals(e.cancelled, true);
    assertEquals(calls, 2);   // 3·4 는 미시작
});

testAsync('start⑥⑦: 취소 없는 start 는 run 과 같고, 반환 모양은 정확히 둘이다', async () => {
    const api = Free.api('go');
    const it = api.interpreter({ go: () => Promise.resolve('값') });
    const h = it.start(api.go().map(v => v + '!'));
    assertEquals(Object.keys(h).sort().join(','), 'cancel,promise');
    assertEquals(await h.promise, '값!');
    assertEquals(await it.run(api.go().map(v => v + '!')), '값!');
});

testAsync('start⑧: 일반 실패 거부에는 cancelled 표식이 없다', async () => {
    const api = Free.api('boom');
    const it = api.interpreter({ boom: () => { throw new Error('도메인 실패'); } });
    const e = await it.start(api.boom()).promise.then(() => null, e => e);
    assertEquals(e.message, '도메인 실패');
    assertEquals(e.cancelled, undefined);
});

testAsync('start⑨: Pure 전용 프로그램은 경계가 없어 취소와 무관하게 완주한다', async () => {
    const api = Free.api('unused');
    const it = api.interpreter({ unused: () => 0 });
    const h = it.start(Free.of(42).map(x => x + 1));
    h.cancel();   // 경계가 한 번도 없다 — 정상 완주가 계약
    assertEquals(await h.promise, 43);
});

testAsync('start⑩: 연속(.map) 안에서 cancel 하면 후속 연속이 실행되지 않는다', async () => {
    const api = Free.api('go');
    const it = api.interpreter({ go: () => Promise.resolve(1) });
    let handle;
    const calls = [];
    const p = api.go()
        .map(v => { calls.push('map1'); handle.cancel(); return v + 1; })
        .map(v => { calls.push('map2'); return v + 1; });
    handle = it.start(p);
    const e = await handle.promise.then(() => null, e => e);
    assertEquals(calls.join(','), 'map1');
    assertEquals(e && e.cancelled, true);
});

testAsync('start⑪: chain 콜백 안에서 cancel 하면 다음 핸들러가 디스패치되지 않는다', async () => {
    const api = Free.api('step');
    let handle;
    const calls = [];
    const it = api.interpreter({ step: n => { calls.push('handler' + n); return Promise.resolve(n); } });
    const p = api.step(1).chain(v => { calls.push('cancel-chain'); handle.cancel(); return api.step(2); });
    handle = it.start(p);
    const e = await handle.promise.then(() => null, e => e);
    assertEquals(calls.join(','), 'handler1,cancel-chain');
    assertEquals(e && e.cancelled, true);
});

testAsync('start⑫: 취소와 비행 중 실패가 경주하면 실패가 이긴다 (계약)', async () => {
    const api = Free.api('boom');
    const it = api.interpreter({ boom: () => new Promise((_, rej) => setTimeout(() => rej(new Error('비행 실패')), 20)) });
    const h = it.start(api.boom());
    setTimeout(h.cancel, 5);   // 비행 중 취소 — 그러나 실행은 이미 실패로 끝난다
    const e = await h.promise.then(() => null, e => e);
    assertEquals(e.message, '비행 실패');
    assertEquals(e.cancelled, undefined);
});
