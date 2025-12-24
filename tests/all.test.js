const funFpJs = require('../all_in_one.js');
const $fp = funFpJs({ log: () => { } }); // Disable logs for testing

const { fp: core, either, monoid, free, extra } = $fp;

const {
    identity, constant, pipe, compose, curry, partial, flip, negate, once, catch: runCatch, runOrDefault,
    predicate, tap, also, useOrLift, useArrayOrLift, range, rangeBy, Types
} = core;

const {
    left, right, catch: eitherCatch, from, fromNullable, validate, validateAll,
    sequence, pipeK, traverse, traverseAll
} = either;

const {
    number, string, boolean, array, object, fold, concat, invert, power
} = monoid;

const { done, suspend, trampoline } = free;
const { template } = extra;

const { logAssert: assert } = require('./utils.js');

console.log('\n--- 1. Func Module Tests ---');

assert('identity', identity(5), 5);
assert('constant', core.constant(10)(), 10);

const add1 = x => x + 1;
const double = x => x * 2;
assert('pipe', pipe(add1, double)(5), 12);
assert('compose', compose(add1, double)(5), 11);

const sum3 = (a, b, c) => a + b + c;
assert('curry', curry(sum3)(1)(2)(3), 6);
assert('partial', partial(sum3, 1, 2)(3), 6);

const sub = (a, b) => a - b;
assert('flip', flip(sub)(1, 10), 9); // 10 - 1

const isEven = x => x % 2 === 0;
assert('negate', negate(isEven)(3), true);

let count = 0;
const incOnce = once(() => ++count);
incOnce(); incOnce();
assert('once', count, 1);

assert('runOrDefault (success)', runOrDefault(0)(() => 5), 5);
assert('runOrDefault (fail)', runOrDefault(0)(() => { throw new Error(); }), 0);

assert('predicate (true)', predicate(x => x > 0)(5), true);
assert('predicate (false)', predicate(x => x > 0)(-5), false);
assert('predicate (safe)', predicate(x => x.length)(null), false);

assert('range', range(3), [0, 1, 2]);
assert('rangeBy', rangeBy(2, 5), [2, 3, 4]);

console.log('\n--- 2. Either Module Tests ---');

assert('right value', right(10).value, 10);
assert('left value (normalized)', left('err').value[0].message, 'err');

assert('map (Right)', right(5).map(x => x * 2).value, 10);
assert('map (Left)', left('err').map(x => x * 2).value[0].message, 'err');

assert('flatMap (Right -> Right)', right(5).flatMap(x => right(x * 2)).value, 10);
assert('flatMap (Right -> Left)', right(5).flatMap(x => left('fail')).value[0].message, 'fail');

assert('filter (Pass)', right(10).filter(x => x > 5).value, 10);
assert('filter (Fail)', right(3).filter(x => x > 5).value[0].message, 'filter: predicate failed');

assert('ap (Success)', right(a => b => a + b).ap(right(1)).ap(right(2)).value, 3);
assert('ap (Accumulate Errors)', right(a => b => a + b).ap(left('e1')).ap(left('e2')).value.map(e => e.message), ['e1', 'e2']);

assert('fold (Right)', right(10).fold(e => 0, v => v * 2), 20);
assert('fold (Left)', left('err').fold(e => e[0].message.toUpperCase(), v => v), 'ERR');

assert('fromNullable (Value)', fromNullable(5).value, 5);
assert('fromNullable (Null)', fromNullable(null).isLeft(), true);

assert('validateAll (All Pass)', validateAll([right(1), right(2)]).value, [1, 2]);
assert('validateAll (Accumulate)', validateAll([right(1), left('e1'), left('e2')]).value.map(e => e.message), ['e1', 'e2']);

const kleisli = pipeK(x => right(x + 1), x => right(x * 2));
assert('pipeK', kleisli(5).value, 12);

console.log('\n--- 3. Monoid Module Tests ---');

assert('number.sum (fold)', fold(number.sum)([1, 2, 3, 4]).value, 10);
assert('number.product (power)', power(number.product)(2, 3).value, 8);
assert('string.concat', concat(string.concat)('a', 'b').value, 'ab');
assert('boolean.all', fold(boolean.all)([true, false, true]).value, false);
assert('number.sum (invert)', invert(number.sum)(5).value, -5);

console.log('\n--- 4. Free/Trampoline Module Tests ---');

const factorial = trampoline((n, acc = 1) =>
    n <= 1 ? done(acc) : suspend(() => factorial(n - 1, n * acc))
);
assert('trampoline factorial', factorial(5), 120);
assert('trampoline stack check', typeof factorial(1000), 'number');

console.log('\n--- 5. Extra Module Tests ---');

const tplData = { user: { name: 'Anthony', age: 30 } };
assert('template (nested)', template('Age of {{user.name}} is {{user.age}}', tplData), 'Age of Anthony is 30');
assert('template (missing)', template('{{missing.path}}', tplData), '{{missing.path}}');
assert('template (falsy 0)', template('Count: {{val}}', { val: 0 }), 'Count: 0');

console.log('\n--- 6. Type Class Protocol Tests ---');

assert('isFunctor (Right)', core.isFunctor(right(5)), true);
assert('isMonad (Right)', core.isMonad(right(5)), true);
assert('isApplicative (Right)', core.isApplicative(right(5)), true);
assert('isFunctor (Pure)', core.isFunctor(done(5)), true);

console.log('\n--- Final Summary ---');
console.log('Tests complete.');
