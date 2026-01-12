// Alt, Plus, Alternative tests
import fp from '../index.js';
import { test, assertEquals, assert, logSection } from './utils.js';

const { Alt, Plus, Alternative, Maybe } = fp;

logSection('Alt');

test('Alt.types has MaybeAlt', () => {
    assert(Alt.types.MaybeAlt, 'should have MaybeAlt');
});

test('MaybeAlt.alt returns first Just', () => {
    const just = Maybe.of(5);
    const nothing = Maybe.Nothing();

    const result = Alt.types.MaybeAlt.alt(nothing, just);
    assert(Maybe.isJust(result), 'should be Just');
    assertEquals(result.value, 5);
});

test('MaybeAlt.alt returns second when first is Nothing', () => {
    const nothing1 = Maybe.Nothing();
    const nothing2 = Maybe.Nothing();
    const just = Maybe.of(10);

    const result = Alt.types.MaybeAlt.alt(nothing1, just);
    assertEquals(result.value, 10);
});

test('MaybeAlt.alt returns Nothing when both Nothing', () => {
    const nothing1 = Maybe.Nothing();
    const nothing2 = Maybe.Nothing();

    const result = Alt.types.MaybeAlt.alt(nothing1, nothing2);
    assert(Maybe.isNothing(result), 'should be Nothing');
});

logSection('Alt Laws');

test('Associativity: alt(alt(a, b), c) === alt(a, alt(b, c))', () => {
    const a = Maybe.Nothing();
    const b = Maybe.of(1);
    const c = Maybe.of(2);
    const { alt } = Alt.types.MaybeAlt;

    const left = alt(alt(a, b), c);
    const right = alt(a, alt(b, c));
    assertEquals(left.value, right.value);
});

logSection('Plus');

test('Plus.types has MaybePlus', () => {
    assert(Plus.types.MaybePlus, 'should have MaybePlus');
});

test('MaybePlus has zero (Nothing)', () => {
    const zero = Plus.types.MaybePlus.zero();
    assert(Maybe.isNothing(zero), 'zero should be Nothing');
});

logSection('Plus Laws');

test('Right identity: alt(a, zero) === a', () => {
    const a = Maybe.of(5);
    const result = Alt.types.MaybeAlt.alt(a, Plus.types.MaybePlus.zero());
    assertEquals(result.value, a.value);
});

test('Left identity: alt(zero, a) === a', () => {
    const a = Maybe.of(5);
    const result = Alt.types.MaybeAlt.alt(Plus.types.MaybePlus.zero(), a);
    assertEquals(result.value, a.value);
});

logSection('Alternative');

test('Alternative.types has MaybeAlternative', () => {
    assert(Alternative.types.MaybeAlternative, 'should have MaybeAlternative');
});

console.log('\n✅ Alt, Plus, Alternative tests completed\n');
