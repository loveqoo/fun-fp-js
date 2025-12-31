const assert = (condition, message) => {
    if (!condition) throw new Error(message || 'Assertion failed');
};

const assertEquals = (actual, expected, message) => {
    const a = JSON.stringify(actual);
    const e = JSON.stringify(expected);
    if (a !== e) {
        throw new Error(`${message || 'Value mismatch'}\n      Expected: ${e}\n      Actual:   ${a}`);
    }
};

const test = (name, callback) => {
    try {
        callback();
        console.log(`✅ [PASS] ${name}`);
    } catch (e) {
        console.error(`❌ [FAIL] ${name}`);
        console.error(`   Error: ${e.message}`);
        // Ensure the test suite runner knows about the failure if needed
        if (typeof process !== 'undefined') {
            process.exitCode = 1;
        }
    }
};

const logAssert = (name, actual, expected) => {
    const pass = JSON.stringify(actual) === JSON.stringify(expected);
    console.log(`${pass ? '✅' : '❌'} ${name}`);
    if (!pass) {
        console.log(`   Expected: ${JSON.stringify(expected)}`);
        console.log(`   Actual:   ${JSON.stringify(actual)}`);
        if (typeof process !== 'undefined') {
            process.exitCode = 1;
        }
    }
};

const assertThrows = (fn, desc) => {
    try {
        fn();
        throw new Error(`Expected '${desc}' to throw, but it did not.`);
    } catch (e) {
        if (e.message.startsWith('Expected')) throw e;
        // Success: it threw an error as expected
    }
};

module.exports = {
    assert,
    assertEquals,
    test,
    logAssert,
    assertThrows
};
