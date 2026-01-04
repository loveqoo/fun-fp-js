const { test, assert, assertEquals, assertThrows } = require('../utils.js');
const $core = require('../../static_modules/impl.js');
const {
    ChainRec,
    ArrayChainRec
} = $core;

console.log('🚀 Starting ChainRec tests...\n');

// ========== ArrayChainRec ==========
console.log('📦 ArrayChainRec...');

test('ArrayChainRec.chainRec - simple counter', () => {
    // f : (next, done, n) -> [Step]
    // 0부터 n까지의 숫자를 배열로 생성하는 예제
    const f = (next, done, n) => {
        if (n === 0) return [done(0)];
        return [done(n), ...[next(n - 1)]]; // done(n)을 결과에 넣고 next(n-1)로 재귀
    };

    const result = ArrayChainRec.chainRec(f, 3);
    // n=3 -> [done(3), next(2)]
    // n=2 -> [done(2), next(1)]
    // n=1 -> [done(1), next(0)]
    // n=0 -> [done(0)]
    // result -> [3, 2, 1, 0]
    assertEquals(result, [3, 2, 1, 0]);
});

test('ArrayChainRec.chainRec - sum accumulator', () => {
    // 1부터 n까지의 합을 구하는 예제 (누산기 사용)
    const f = (next, done, { n, acc }) => {
        if (n === 0) return [done(acc)];
        return [next({ n: n - 1, acc: acc + n })];
    };

    const result = ArrayChainRec.chainRec(f, { n: 5, acc: 0 });
    assertEquals(result, [15]);
});

test('ArrayChainRec.chainRec - branching (binary tree traversal like)', () => {
    // 이진 트리 탐색과 유사한 분기 테스트
    const f = (next, done, n) => {
        if (n <= 0) return [done(0)];
        if (n === 1) return [done(1)];
        return [next(n - 1), next(n - 2)];
    };

    const result = ArrayChainRec.chainRec(f, 3);
    // n=3 -> [next(2), next(1)]
    // n=2 -> [next(1), next(0)]
    // n=1 -> [done(1)]
    // n=0 -> [done(0)]
    // leaves: 1, 0, 1
    assertEquals(result, [1, 0, 1]);
});

// ========== ChainRec.of API ==========
console.log('\n📦 ChainRec.of...');

test('ChainRec.of - array', () => {
    const CR = ChainRec.of('array');
    const f = (next, done, n) => n <= 0 ? [done(0)] : [next(n - 1)];
    assertEquals(CR.chainRec(f, 2), [0]);
});

test('ChainRec.of - throws on unsupported key', () => {
    assertThrows(() => ChainRec.of('unsupported'), 'unsupported key');
});

// ========== Stack Safety ==========
console.log('\n📦 Stack Safety...');

test('ArrayChainRec.chainRec - should be stack-safe', () => {
    const largeNumber = 10000;
    const f = (next, done, n) => {
        if (n <= 0) return [done('ok')];
        return [next(n - 1)];
    };

    // 이 테스트가 통과한다는 것은 내부에 RangeError: Maximum call stack size exceeded 가 없음을 의미
    const result = ArrayChainRec.chainRec(f, largeNumber);
    assertEquals(result, ['ok']);
});

console.log('\n✅ All ChainRec tests completed!');
