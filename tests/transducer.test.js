const { test, assertEquals } = require('./utils');
const funFpJs = require('../index');

const { transducer } = funFpJs();
const { from } = transducer;

// ========== Basic Operations ==========

test('from().collect() - identity', () => {
    const result = from([1, 2, 3]).collect();
    assertEquals(result, [1, 2, 3]);
});

test('from().map() - transforms values', () => {
    const result = from([1, 2, 3]).map(x => x * 2).collect();
    assertEquals(result, [2, 4, 6]);
});

test('from().filter() - filters values', () => {
    const result = from([1, 2, 3, 4, 5]).filter(x => x % 2 === 0).collect();
    assertEquals(result, [2, 4]);
});

test('from().take() - limits count', () => {
    const result = from([1, 2, 3, 4, 5]).take(3).collect();
    assertEquals(result, [1, 2, 3]);
});

test('from().drop() - skips values', () => {
    const result = from([1, 2, 3, 4, 5]).drop(2).collect();
    assertEquals(result, [3, 4, 5]);
});

// ========== Chaining ==========

test('chaining - filter then map', () => {
    const result = from([1, 2, 3, 4, 5, 6])
        .filter(x => x % 2 === 0)
        .map(x => x * 10)
        .collect();
    assertEquals(result, [20, 40, 60]);
});

test('chaining - map then filter then take', () => {
    const result = from([1, 2, 3, 4, 5])
        .map(x => x * 2)
        .filter(x => x > 4)
        .take(2)
        .collect();
    assertEquals(result, [6, 8]);
});

test('chaining - drop then take', () => {
    const result = from([1, 2, 3, 4, 5])
        .drop(2)
        .take(2)
        .collect();
    assertEquals(result, [3, 4]);
});

// ========== Terminal Methods ==========

test('sum() - sums values', () => {
    const result = from([1, 2, 3, 4, 5]).sum();
    assertEquals(result, 15);
});

test('sum() with map', () => {
    const result = from([1, 2, 3]).map(x => x * 10).sum();
    assertEquals(result, 60);
});

test('join() - joins as string', () => {
    const result = from(['a', 'b', 'c']).join('-');
    assertEquals(result, 'a-b-c');
});

test('join() with map', () => {
    const result = from(['a', 'b', 'c']).map(s => s.toUpperCase()).join('');
    assertEquals(result, 'ABC');
});

test('count() - counts elements', () => {
    const result = from([1, 2, 3, 4, 5]).filter(x => x > 2).count();
    assertEquals(result, 3);
});

test('first() - returns first element', () => {
    const result = from([1, 2, 3]).first();
    assertEquals(result, 1);
});

test('first() with filter', () => {
    const result = from([1, 2, 3, 4, 5]).filter(x => x > 3).first();
    assertEquals(result, 4);
});

// ========== Lazy Evaluation (Generators) ==========

test('infinite generator with take', () => {
    function* infinite() {
        let i = 1;
        while (true) yield i++;
    }
    const result = from(infinite()).take(5).collect();
    assertEquals(result, [1, 2, 3, 4, 5]);
});

test('infinite generator with map then take', () => {
    function* infinite() {
        let i = 1;
        while (true) yield i++;
    }
    const result = from(infinite())
        .map(x => x * 10)
        .take(3)
        .collect();
    assertEquals(result, [10, 20, 30]);
});

test('infinite generator with filter then take', () => {
    function* infinite() {
        let i = 0;
        while (true) yield i++;
    }
    // 짝수만 10개 가져오기
    const result = from(infinite())
        .filter(x => x % 2 === 0)
        .take(5)
        .collect();
    assertEquals(result, [0, 2, 4, 6, 8]);
});

// ========== Custom Reduce ==========

test('reduce() - custom reducer', () => {
    const result = from([1, 2, 3, 4])
        .reduce((acc, val) => acc * val, 1);
    assertEquals(result, 24);
});

test('reduce() with transformations', () => {
    const result = from([1, 2, 3, 4, 5])
        .filter(x => x % 2 === 1)  // 홀수만
        .map(x => x * x)           // 제곱
        .reduce((acc, val) => acc + val, 0);  // 합
    assertEquals(result, 35);  // 1 + 9 + 25
});

// ========== Edge Cases ==========

test('empty array - toArray', () => {
    const result = from([]).collect();
    assertEquals(result, []);
});

test('empty array - sum', () => {
    const result = from([]).sum();
    assertEquals(result, 0);
});

test('empty array - join', () => {
    const result = from([]).join('-');
    assertEquals(result, '');
});

test('take(0) - returns empty', () => {
    const result = from([1, 2, 3]).take(0).collect();
    assertEquals(result, []);
});

test('take more than length', () => {
    const result = from([1, 2]).take(10).collect();
    assertEquals(result, [1, 2]);
});

test('filter all out', () => {
    const result = from([1, 2, 3]).filter(x => x > 10).collect();
    assertEquals(result, []);
});

// ========== flatMap ==========

test('flatMap - flatten nested arrays', () => {
    const result = from([[1, 2], [3, 4], [5]])
        .flatMap(arr => arr)
        .collect();
    assertEquals(result, [1, 2, 3, 4, 5]);
});

test('flatMap - expand each element', () => {
    const result = from([1, 2, 3])
        .flatMap(x => [x, x * 10])
        .collect();
    assertEquals(result, [1, 10, 2, 20, 3, 30]);
});

test('flatMap - with filter and take', () => {
    const result = from([1, 2, 3])
        .flatMap(x => [x, x * 10])
        .filter(x => x > 5)
        .take(2)
        .collect();
    assertEquals(result, [10, 20]);
});

test('flatMap - empty inner iterable', () => {
    const result = from([1, 2, 3])
        .flatMap(x => x === 2 ? [] : [x])
        .collect();
    assertEquals(result, [1, 3]);
});

// ========== Functor/Monad Symbols ==========

test('Transducer has Functor/Monad symbols', () => {
    const { core } = funFpJs();
    const t = from([1, 2, 3]);
    assertEquals(t[core.Types.Functor], true);
    assertEquals(t[core.Types.Monad], true);
});

// ========== fold with Monoid ==========

test('fold - sum with monoid', () => {
    const { monoid } = funFpJs();
    const result = from([1, 2, 3, 4, 5]).fold(monoid.number.sum);
    assertEquals(result.isRight(), true);
    assertEquals(result.value, 15);
});

test('fold - string concat with monoid', () => {
    const { monoid } = funFpJs();
    const result = from(['a', 'b', 'c']).fold(monoid.string.concat);
    assertEquals(result.isRight(), true);
    assertEquals(result.value, 'abc');
});

test('fold - array concat with monoid', () => {
    const { monoid } = funFpJs();
    const result = from([[1, 2], [3, 4], [5]]).fold(monoid.array.concat);
    assertEquals(result.isRight(), true);
    assertEquals(JSON.stringify(result.value), JSON.stringify([1, 2, 3, 4, 5]));
});

test('fold - set union with monoid and mapper', () => {
    const { monoid } = funFpJs();
    const result = from([1, 2, 3, 2, 1]).fold(monoid.set.union, x => new Set([x]));
    assertEquals(result.isRight(), true);
    assertEquals(result.value.size, 3);
    assertEquals(result.value.has(1), true);
    assertEquals(result.value.has(2), true);
    assertEquals(result.value.has(3), true);
});

// ========== Error Cases ==========

test('from() - throws for non-iterable (number)', () => {
    let thrown = false;
    try { from(123); } catch (e) { thrown = true; }
    assertEquals(thrown, true);
});

test('from() - throws for non-iterable (null)', () => {
    let thrown = false;
    try { from(null); } catch (e) { thrown = true; }
    assertEquals(thrown, true);
});

test('from() - throws for non-iterable (plain object)', () => {
    let thrown = false;
    try { from({ a: 1 }); } catch (e) { thrown = true; }
    assertEquals(thrown, true);
});

console.log('\n✅ All Transducer tests completed!');
