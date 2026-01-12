// Profunctor tests
import fp from '../index.js';
import { test, assertEquals, assert, logSection } from './utils.js';

const { Profunctor } = fp;

logSection('Profunctor');

test('Profunctor.types has FunctionProfunctor', () => {
    assert(Profunctor.types.FunctionProfunctor, 'should have FunctionProfunctor');
});

test('FunctionProfunctor.promap transforms both input and output', () => {
    // promap(f, g, fn) = g . fn . f
    // f: pre-process input
    // g: post-process output
    const fn = x => x * 2;
    const f = x => x + 1;  // pre: add 1 to input
    const g = x => x * 10; // post: multiply output by 10

    const result = Profunctor.types.FunctionProfunctor.promap(f, g, fn);
    // result(5) = g(fn(f(5))) = g(fn(6)) = g(12) = 120
    assertEquals(result(5), 120);
});

logSection('Profunctor Laws');

test('Identity: promap(id, id, a) === a', () => {
    const id = x => x;
    const fn = x => x * 2;
    const result = Profunctor.types.FunctionProfunctor.promap(id, id, fn);
    assertEquals(result(5), fn(5));
});

test('Composition: promap(f . g, h . i, a) === promap(g, h, promap(f, i, a))', () => {
    const f = x => x + 1;
    const g = x => x * 2;
    const h = x => x + 10;
    const i = x => x * 3;
    const fn = x => x;

    const { promap } = Profunctor.types.FunctionProfunctor;

    // promap(f . g, h . i, fn)
    const left = promap(x => f(g(x)), x => h(i(x)), fn);
    // promap(g, h, promap(f, i, fn))
    const right = promap(g, h, promap(f, i, fn));

    assertEquals(left(5), right(5));
});

console.log('\n✅ Profunctor tests completed\n');
