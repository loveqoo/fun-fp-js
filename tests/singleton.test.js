
const { test, assert } = require('./utils');
const ALL_IN_ONE_PATH = process.env.ALL_IN_ONE || '../all_in_one.cjs';

console.log('🚀 Starting Singleton Pattern tests...');

test('Singleton: should return same instance for same options', () => {
    // Force reload for fresh test environment logic if needed, but require cache works per process
    const fp1 = require(ALL_IN_ONE_PATH)();
    const fp2 = require(ALL_IN_ONE_PATH)();

    assert(fp1 === fp2, 'Instances should be identical for default options');
    assert(fp1.either.Either === fp2.either.Either, 'Classes should be identical');
});

test('Singleton: should return different instances for different options', () => {
    const fp1 = require(ALL_IN_ONE_PATH)();
    const fp3 = require(ALL_IN_ONE_PATH)({ log: console.error });

    assert(fp1 !== fp3, 'Instances should be different for different options');
});

test('Singleton: instanceOf check should work across same-option instances', () => {
    const fp1 = require(ALL_IN_ONE_PATH)();
    const fp2 = require(ALL_IN_ONE_PATH)();

    const right1 = fp1.either.right(42);
    assert(right1 instanceof fp2.either.Either, 'Instance created by fp1 should be instance of fp2.Either');
});

test('Singleton: instanceOf check should fail across different-option instances', () => {
    // This behavior is expected because they are different class definitions
    const fp1 = require(ALL_IN_ONE_PATH)();
    const fp3 = require(ALL_IN_ONE_PATH)({ log: console.error }); // diff options -> diff instance

    const right1 = fp1.either.right(42);
    assert(!(right1 instanceof fp3.either.Either), 'Instance created by fp1 should NOT be instance of fp3.Either');
});

console.log('✅ Singleton tests completed!');
