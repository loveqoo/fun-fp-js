
const { test, assert } = require('../utils');
const ALL_IN_ONE_PATH = process.env.ALL_IN_ONE || '../all_in_one.cjs';

console.log('🚀 Starting Singleton Pattern tests...');

test('Singleton: should return same instance when cacheable=true (default)', () => {
    const fp1 = require(ALL_IN_ONE_PATH)();
    const fp2 = require(ALL_IN_ONE_PATH)();

    assert(fp1 === fp2, 'Instances should be identical for default cacheable=true');
    assert(fp1.either.Either === fp2.either.Either, 'Classes should be identical');
});

test('Singleton: should return same cached instance even with different dependencies when cacheable=true', () => {
    const fp1 = require(ALL_IN_ONE_PATH)();
    const fp3 = require(ALL_IN_ONE_PATH)({ log: console.error }); // cacheable defaults to true

    // 새로운 동작: cacheable=true일 때 첫 번째 인스턴스를 캐시하고 반환
    assert(fp1 === fp3, 'Instances should be same when cacheable=true (uses first cached instance)');
});

test('Singleton: should return different instance when cacheable=false', () => {
    const fp1 = require(ALL_IN_ONE_PATH)();
    const fp4 = require(ALL_IN_ONE_PATH)({}, false); // cacheable=false

    assert(fp1 !== fp4, 'Instances should be different when cacheable=false');
});

test('Singleton: instanceOf check should work across same-option instances', () => {
    const fp1 = require(ALL_IN_ONE_PATH)();
    const fp2 = require(ALL_IN_ONE_PATH)();

    const right1 = fp1.either.right(42);
    assert(right1 instanceof fp2.either.Either, 'Instance created by fp1 should be instance of fp2.Either');
});

test('Singleton: instanceOf check should fail across different instances (cacheable=false)', () => {
    // cacheable=false로 다른 인스턴스를 생성하면 다른 클래스 정의를 가짐
    const fp1 = require(ALL_IN_ONE_PATH)();
    const fp4 = require(ALL_IN_ONE_PATH)({}, false); // cacheable=false -> 새 인스턴스

    const right1 = fp1.either.right(42);
    assert(!(right1 instanceof fp4.either.Either), 'Instance created by fp1 should NOT be instance of fp4.Either');
});

console.log('✅ Singleton tests completed!');
