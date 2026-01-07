// Test utilities - ESM version
export const assert = (condition, message) => {
    if (!condition) throw new Error(message || 'Assertion failed');
};

export const assertEquals = (actual, expected, message) => {
    const a = JSON.stringify(actual);
    const e = JSON.stringify(expected);
    if (a !== e) {
        throw new Error(`${message || 'Value mismatch'}\n      Expected: ${e}\n      Actual:   ${a}`);
    }
};

export const deepEquals = (a, b) => {
    // Handle Maybe/Either/Task instances
    if (a && b && a._typeName && b._typeName) {
        if (a._typeName !== b._typeName) return false;
        if (a._typeName === 'Maybe') {
            if (a.isJust() !== b.isJust()) return false;
            return a.isNothing() || deepEquals(a.value, b.value);
        }
        if (a._typeName === 'Either') {
            if (a.isLeft() !== b.isLeft()) return false;
            return deepEquals(a.value, b.value);
        }
    }
    // Primitive comparison
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        return a.every((v, i) => deepEquals(v, b[i]));
    }
    if (typeof a === 'object' && a !== null) {
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        if (keysA.length !== keysB.length) return false;
        return keysA.every(k => deepEquals(a[k], b[k]));
    }
    return false;
};

export const assertDeepEquals = (actual, expected, message) => {
    if (!deepEquals(actual, expected)) {
        throw new Error(`${message || 'Deep value mismatch'}\n      Expected: ${JSON.stringify(expected)}\n      Actual:   ${JSON.stringify(actual)}`);
    }
};

export const test = (name, callback) => {
    try {
        callback();
        console.log(`✅ [PASS] ${name}`);
    } catch (e) {
        console.error(`❌ [FAIL] ${name}`);
        console.error(`   Error: ${e.message}`);
        if (typeof process !== 'undefined') {
            process.exitCode = 1;
        }
    }
};

export const testAsync = async (name, callback) => {
    try {
        await callback();
        console.log(`✅ [PASS] ${name}`);
    } catch (e) {
        console.error(`❌ [FAIL] ${name}`);
        console.error(`   Error: ${e.message}`);
        if (typeof process !== 'undefined') {
            process.exitCode = 1;
        }
    }
};

export const assertThrows = (fn, desc) => {
    try {
        fn();
        throw new Error(`Expected '${desc}' to throw, but it did not.`);
    } catch (e) {
        if (e.message.startsWith('Expected')) throw e;
    }
};

export const logSection = title => console.log(`\n=== ${title} ===\n`);
