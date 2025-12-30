const { test, assertEquals } = require('./utils');
const funFpJs = require('../index');

const { core, transducer, monoid } = funFpJs();
const { pipe, compose } = core;
// Transducer is now a class with static methods
const { map, filter, take, into } = transducer;

test('Transducer: Array Map Reference', () => {
    const data = [1, 2, 3];
    // xform for just map
    const xform = map(x => x * 2);
    // Use Monoid.array.concat (which is basically push)
    const result = into(monoid.array.concat, xform, data);
    assertEquals(result, [2, 4, 6]);
});

test('Transducer: Filter + Map Composition', () => {
    const data = [1, 2, 3, 4, 5, 6];
    // compose(map, filter) executing left-to-right in data flow logic
    // But wait, transducer composition is tricky.
    // If we want: Filter even -> Map doubble
    // Standard composition: compose(filter(isEven), map(double))
    // Let's verify strict composition order.

    // Logic: even only -> double them
    const isEven = x => x % 2 === 0;
    const double = x => x * 2;

    // In transducer world, `compose(A, B)` means data flows A -> B.
    // Because `A(B(reducer))` -> `A` wraps `B`.
    // So data hits `A` first, then `B`, then `reducer`.
    const xform = compose(
        filter(isEven),
        map(double)
    );

    const result = into(monoid.array.concat, xform, data);
    // [2, 4, 6] -> filter(even) -> [2, 4, 6] -> map(double) -> [4, 8, 12]
    assertEquals(result, [4, 8, 12]);
});

test('Transducer: Take (Early Termination)', () => {
    const data = [1, 2, 3, 4, 5, 6];
    const xform = take(3);
    const result = into(monoid.array.concat, xform, data);
    assertEquals(result, [1, 2, 3]);
});

test('Transducer: Infinite Generator with Take', () => {
    function* infinite() {
        let i = 1;
        while (true) yield i++;
    }

    const xform = compose(
        map(x => x * 10),
        take(5)
    );

    const result = into(monoid.array.concat, xform, infinite());
    assertEquals(result, [10, 20, 30, 40, 50]);
});

test('Transducer: Monoid Integration (Sum)', () => {
    const data = [1, 2, 3, 4, 5];
    // map(+1) -> sum
    const xform = map(x => x + 1);

    // Initial: 0, Concat: +
    const result = into(monoid.number.sum, xform, data);
    // [2, 3, 4, 5, 6] sum = 20
    assertEquals(result, 20);
});

test('Transducer: Monoid Integration (String)', () => {
    const data = ['a', 'b', 'c'];
    const xform = map(c => c.toUpperCase());

    const result = into(monoid.string.concat, xform, data);
    assertEquals(result, "ABC");
});
