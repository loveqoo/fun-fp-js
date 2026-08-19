// ChainRec tests
import fp from '../index.js';
import { test, testAsync, assertEquals, assert, logSection } from './utils.js';

const { ChainRec, Either, Task } = fp;

logSection('ChainRec');

test('ChainRec.types has EitherChainRec', () => {
    assert(ChainRec.types.EitherChainRec, 'should have EitherChainRec');
});

test('ChainRec.types has TaskChainRec', () => {
    assert(ChainRec.types.TaskChainRec, 'should have TaskChainRec');
});

test('ChainRec.next and ChainRec.done exist', () => {
    assert(typeof ChainRec.next === 'function', 'next should be function');
    assert(typeof ChainRec.done === 'function', 'done should be function');
});

test('EitherChainRec.chainRec - simple iteration', () => {
    // f(next, done, i) signature
    // Sum numbers from 1 to n
    const result = ChainRec.types.EitherChainRec.chainRec(
        (next, done, { sum, i }) =>
            i > 10
                ? Either.Right(done(sum))         // Done
                : Either.Right(next({ sum: sum + i, i: i + 1 })),  // Continue
        { sum: 0, i: 1 }
    );

    assert(Either.isRight(result), 'should be Right');
    assertEquals(result.value, 55);  // 1+2+...+10 = 55
});

test('EitherChainRec.chainRec - stack safe', () => {
    // Large iteration that would overflow without tail-call optimization
    const result = ChainRec.types.EitherChainRec.chainRec(
        (next, done, i) => i >= 1000
            ? Either.Right(done(i))
            : Either.Right(next(i + 1)),
        0
    );

    assertEquals(result.value, 1000);
});

test('EitherChainRec.chainRec - early failure with Left', () => {
    const result = ChainRec.types.EitherChainRec.chainRec(
        (next, done, i) => i >= 5
            ? Either.Left('error at 5')
            : Either.Right(next(i + 1)),
        0
    );

    assert(Either.isLeft(result), 'should stop with Left');
    assertEquals(result.value, 'error at 5');
});

test('EitherChainRec.chainRec - stack safe with 10000 iterations', () => {
    const result = ChainRec.types.EitherChainRec.chainRec(
        (next, done, i) => i >= 10000
            ? Either.Right(done(i))
            : Either.Right(next(i + 1)),
        0
    );

    assertEquals(result.value, 10000);
});

test('EitherChainRec.chainRec - stack safe with 100000 iterations', () => {
    const result = ChainRec.types.EitherChainRec.chainRec(
        (next, done, i) => i >= 100000
            ? Either.Right(done(i))
            : Either.Right(next(i + 1)),
        0
    );

    assertEquals(result.value, 100000);
});

console.log('\n✅ ChainRec tests completed\n');

// 6차 감사 [8] — 큐를 shift/unshift 로 돌려서, 갈래가 쌓이면 큐 길이만큼 원소를 옮겼다(제곱).
// 시간은 기계마다 흔들리므로 **무엇을 부르는지**를 잠근다 — 4차-3 의 slice/concat 게이트와 같은 수법.
// 7차 감사 [1] — 이 게이트가 Array 만 봐서, 같은 병이 남은 NonEmptyList 를 놓쳤다.
// **등록된 인스턴스를 전부 돈다** — 세 번째 인스턴스가 생겨도 같은 누락이 안 생기게.
const CHAINREC_CASES = {
    array: {
        wrap: steps => steps,
        size: out => out.length,
    },
    nonemptylist: {
        wrap: steps => new fp.NonEmptyList(steps[0], steps.slice(1)),
        size: out => out.toArray().length,
    },
};

test('6차-8/7차-1: chainRec 이 shift/unshift 를 안 쓴다 (등록된 컨테이너 전부)', () => {
    const container = Object.keys(CHAINREC_CASES);
    // 명단이 비면 아무것도 안 보고 초록이 된다 — 레지스트리에 있는 것을 다 덮는지 먼저 본다.
    for (const key of ['array', 'nonemptylist']) {
        assert(container.indexOf(key) !== -1, `${key} 가 명단에 없다`);
        assert(ChainRec.lookup(key) !== undefined, `${key} ChainRec 이 등록돼 있지 않다`);
    }
    const oShift = Array.prototype.shift, oUnshift = Array.prototype.unshift;
    for (const key of container) {
        const { wrap, size } = CHAINREC_CASES[key];
        let moves = 0;
        Array.prototype.shift = function (...a) { moves++; return oShift.apply(this, a); };
        Array.prototype.unshift = function (...a) { moves++; return oUnshift.apply(this, a); };
        try {
            const out = ChainRec.lookup(key).chainRec(
                (next, done, i) => wrap(i >= 500 ? [done(i)] : [next(i + 1), done(i)]), 0);
            assertEquals(size(out), 501, `${key} 결과 개수`);
            assertEquals(moves, 0, `${key} 가 큐를 옮겼다`);
        } finally {
            Array.prototype.shift = oShift;
            Array.prototype.unshift = oUnshift;
        }
    }
});

// 순서는 결과에 그대로 드러난다 — 깊이 우선이 아니면 값이 갈린다. 스택으로 바꾸며 이 순서를 지켰다.
test('6차-8: 깊이 우선 순서가 그대로다', () => {
    const out = ChainRec.lookup('array').chainRec(
        (next, done, i) => i >= 3 ? [done('d' + i)] : [next(i + 1), done('d' + i)], 0);
    assertEquals(out, ['d3', 'd2', 'd1', 'd0']);
    const wide = ChainRec.lookup('array').chainRec(
        (next, done, i) => i >= 2 ? [done(i)] : [next(i + 1), next(i + 1)], 0);
    assertEquals(wide, [2, 2, 2, 2]);
});

