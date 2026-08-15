// Foldable tests
import fp from '../index.js';
import { test, assertEquals, assert, logSection } from './utils.js';

const { Foldable } = fp;

logSection('Foldable');

test('Foldable.types has ArrayFoldable', () => {
    assert(Foldable.types.ArrayFoldable, 'should have ArrayFoldable');
});

test('ArrayFoldable.reduce - sum', () => {
    const arr = [1, 2, 3, 4, 5];
    const result = Foldable.types.ArrayFoldable.reduce((acc, x) => acc + x, 0, arr);
    assertEquals(result, 15);
});

test('ArrayFoldable.reduce - product', () => {
    const arr = [1, 2, 3, 4];
    const result = Foldable.types.ArrayFoldable.reduce((acc, x) => acc * x, 1, arr);
    assertEquals(result, 24);
});

test('ArrayFoldable.reduce - collect to array', () => {
    const arr = [1, 2, 3];
    const result = Foldable.types.ArrayFoldable.reduce((acc, x) => [...acc, x * 2], [], arr);
    assertEquals(result, [2, 4, 6]);
});

test('ArrayFoldable.reduce - empty array', () => {
    const result = Foldable.types.ArrayFoldable.reduce((acc, x) => acc + x, 0, []);
    assertEquals(result, 0);
});

test('Foldable.lookup resolves to ArrayFoldable', () => {
    const instance = Foldable.lookup('array');
    assert(instance === Foldable.types.ArrayFoldable, 'should resolve to ArrayFoldable');
});

logSection('Foldable - Object');

test('Foldable.types has ObjectFoldable', () => {
    assert(Foldable.types.ObjectFoldable, 'should have ObjectFoldable');
});

test('ObjectFoldable.reduce - sum values', () => {
    const obj = { a: 1, b: 2, c: 3 };
    const result = Foldable.types.ObjectFoldable.reduce((acc, x) => acc + x, 0, obj);
    assertEquals(result, 6);
});

// 순서는 이 검사만 지킨다 — 법칙 게이트의 Foldable 은 자기참조라 순서 뒤집기를 못 보고,
// Object 는 Traversable 이 없어 traverse 대조(닻)도 못 내린다. 위의 sum 은 가환이라 장님이다.
test('ObjectFoldable.reduce - 순회 순서는 Object.values 의 순서다', () => {
    const app = (acc, x) => `${acc}|${x}`;
    // 문자열 키는 넣은 순서
    assertEquals(Foldable.types.ObjectFoldable.reduce(app, '', { b: 2, a: 1, c: 3 }), '|2|1|3');
    // 정수 모양 키는 오름차순이 먼저다 — JS 명세의 속성 순서 그대로
    assertEquals(Foldable.types.ObjectFoldable.reduce(app, '', { 2: 'x', 1: 'y' }), '|y|x');
    // 섞이면 정수 키(오름차순) 뒤에 문자열 키(넣은 순서)
    assertEquals(Foldable.types.ObjectFoldable.reduce(app, '', { b: 'B', 3: 'three', a: 'A', 1: 'one' }), '|one|three|B|A');
});

console.log('\n✅ Foldable tests completed\n');
