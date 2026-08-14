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

// 라이브러리의 Setoid 로 단언한다. 사설 deepEquals 를 대체한 것 —
// 비교 규칙이 테스트 헬퍼가 아니라 검증 대상인 라이브러리 자신에게서 나온다.
// setoid 는 인스턴스 그대로 받는다(키 해석은 호출부가 Setoid.lookup 으로 한다).
export const assertEqualsBy = (setoid, actual, expected, message) => {
    if (!setoid.equals(actual, expected)) {
        throw new Error(`${message || 'Setoid mismatch'}\n      Expected: ${JSON.stringify(expected)}\n      Actual:   ${JSON.stringify(actual)}`);
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

// testAsync() calls are floating (not awaited) throughout the suite. If one never
// settles, the event loop drains and the process exits 0 with the assertion silently
// skipped — a false pass. Track them and fail at exit if any are still pending.
// Keyed by a unique token, not by name — two tests may share a name.
const pending = new Map();
let nextToken = 0;

if (typeof process !== 'undefined' && typeof process.on === 'function') {
    process.on('exit', () => {
        if (pending.size === 0) return;
        for (const name of pending.values()) console.error(`❌ [PENDING] ${name} — never settled`);
        console.error(`   ${pending.size} async test(s) did not finish before exit`);
        process.exitCode = 1;
    });
}

export const testAsync = async (name, callback) => {
    const token = nextToken++;
    pending.set(token, name);
    try {
        await callback();
        console.log(`✅ [PASS] ${name}`);
    } catch (e) {
        console.error(`❌ [FAIL] ${name}`);
        console.error(`   Error: ${e.message}`);
        if (typeof process !== 'undefined') {
            process.exitCode = 1;
        }
    } finally {
        pending.delete(token);
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

export const assertThrowsWith = (fn, expectedMessage, desc) => {
    try {
        fn();
        throw new Error(`Expected to throw '${expectedMessage}', but did not.`);
    } catch (e) {
        if (e.message.startsWith('Expected to throw')) throw e;
        if (!e.message.includes(expectedMessage)) {
            throw new Error(`${desc || 'Error message mismatch'}\n      Expected message containing: ${expectedMessage}\n      Actual: ${e.message}`);
        }
    }
};

export const logSection = title => console.log(`\n=== ${title} ===\n`);

// String.prototype.matchAll 은 ES2020 이라 저장소 상한(ES2018) 위다 — exec 루프로 같은 것을
// 만든다. 근거는 docs/internals.md#es-ceiling. 원본 정규식의 lastIndex 를 건드리지 않도록
// 복제해서 돌린다(matchAll 도 그렇게 한다).
export const allMatches = (re, text) => {
    if (!re.global) throw new Error('allMatches: 정규식에 g 플래그가 필요하다');
    const scan = new RegExp(re.source, re.flags);
    const out = [];
    let m;
    while ((m = scan.exec(text)) !== null) {
        out.push(m);
        if (m[0] === '') scan.lastIndex++;   // 빈 매치에서 제자리걸음하지 않게
    }
    return out;
};
