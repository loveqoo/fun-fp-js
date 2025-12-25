const $core = require('../modules/core.js');
const { core } = $core();

const { assert, assertEquals } = require('./utils.js');

console.log('Starting reproduction tests...');

// 1. once should not cache result if it throws
try {
    let count = 0;
    const onceF = core.once(() => {
        count++;
        if (count === 1) throw new Error('First fail');
        return 'Success';
    });

    console.log('Testing once retry on failure...');
    try {
        onceF();
    } catch (e) {
        console.log('  Caught expected error:', e.message);
    }

    const result = onceF();
    console.log('  Second call result:', result);
    assertEquals(result, 'Success', 'once should allow retry if first attempt failed');
    assertEquals(count, 2, 'once should have been called twice because first one failed');

    const thirdResult = onceF();
    assertEquals(thirdResult, 'Success', 'third call should returned cached success');
    assertEquals(count, 2, 'once should not be called again after success');
    console.log('✅ once retry test passed');
} catch (e) {
    console.log('❌ once retry test failed:', e.message);
}

// 2. apply2 should throw if not exactly 2 elements
try {
    console.log('Testing apply2 strictness...');
    const add = (a, b) => a + b;
    const applied = core.apply2(add);

    try {
        applied([1, 2, 3]);
        assert(false, 'apply2 should throw for 3 elements');
    } catch (e) {
        console.log('  Caught expected error for 3 elements:', e.message);
        assert(e instanceof TypeError, 'Should be TypeError');
    }

    try {
        applied([1]);
        assert(false, 'apply2 should throw for 1 element');
    } catch (e) {
        console.log('  Caught expected error for 1 element:', e.message);
        assert(e instanceof TypeError, 'Should be TypeError');
    }

    assertEquals(applied([1, 2]), 3, 'apply2 should work for 2 elements');
    console.log('✅ apply2 strictness test passed');
} catch (e) {
    console.log('❌ apply2 strictness test failed:', e.message);
}
