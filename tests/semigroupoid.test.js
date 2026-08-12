// Semigroupoid and Category tests
import fp from '../index.js';
import { test, assertEquals, assert, assertThrows, logSection } from './utils.js';

const { Semigroupoid, Category, identity } = fp;

logSection('Semigroupoid');

test('Semigroupoid.types has FunctionSemigroupoid', () => {
    assert(Semigroupoid.types.FunctionSemigroupoid, 'should have FunctionSemigroupoid');
});

test('FunctionSemigroupoid.compose composes two functions', () => {
    const double = x => x * 2;
    const addOne = x => x + 1;
    const composed = Semigroupoid.types.FunctionSemigroupoid.compose(double, addOne);
    // compose(double, addOne)(5) = double(addOne(5)) = double(6) = 12
    assertEquals(composed(5), 12);
});

test('FunctionSemigroupoid.compose - associativity', () => {
    const f = x => x + 1;
    const g = x => x * 2;
    const h = x => x - 3;
    const { compose } = Semigroupoid.types.FunctionSemigroupoid;

    // compose(f, compose(g, h)) === compose(compose(f, g), h)
    const left = compose(f, compose(g, h));
    const right = compose(compose(f, g), h);
    assertEquals(left(10), right(10));
});

test('FunctionSemigroupoid.compose - throws for non-function', () => {
    const { compose } = Semigroupoid.types.FunctionSemigroupoid;
    assertThrows(() => compose(5, x => x), 'compose with non-function first arg');
    assertThrows(() => compose(x => x, 5), 'compose with non-function second arg');
});

logSection('Category');

test('Category.types has FunctionCategory', () => {
    assert(Category.types.FunctionCategory, 'should have FunctionCategory');
});

test('FunctionCategory has id (identity)', () => {
    const { id } = Category.types.FunctionCategory;
    assertEquals(id(5), 5);
    assertEquals(id('hello'), 'hello');
    const obj = { a: 1 };
    assert(id(obj) === obj, 'id should return same reference');
});

test('FunctionCategory.compose inherits from Semigroupoid', () => {
    const double = x => x * 2;
    const addOne = x => x + 1;
    const composed = Category.types.FunctionCategory.compose(double, addOne);
    assertEquals(composed(5), 12);
});

test('Category laws - left identity: compose(id, f) === f', () => {
    const f = x => x * 2;
    const { compose, id } = Category.types.FunctionCategory;
    assertEquals(compose(id, f)(5), f(5));
});

test('Category laws - right identity: compose(f, id) === f', () => {
    const f = x => x * 2;
    const { compose, id } = Category.types.FunctionCategory;
    assertEquals(compose(f, id)(5), f(5));
});

logSection('Semigroupoid / Category — Kleisli 인스턴스');

// .type 은 compose 의 검사에 쓰이지 않는다(그쪽은 'function' 이 하드코딩돼 있다).
// 즉 동작으로는 관측되지 않으므로 필드를 직접 읽어야 어긋난 것을 잡는다.
test('Semigroupoid 인스턴스 4종의 .type 은 전부 function', () => {
    for (const key of ['function', 'maybe', 'either', 'task']) {
        assertEquals(Semigroupoid.lookup(key).type, 'function', `Semigroupoid.lookup('${key}').type`);
    }
});

test('Category 인스턴스 4종의 .type 은 전부 function', () => {
    for (const key of ['function', 'maybe', 'either', 'task']) {
        assertEquals(Category.lookup(key).type, 'function', `Category.lookup('${key}').type`);
    }
});

test('키가 달라도 서로 다른 인스턴스다', () => {
    assert(Semigroupoid.lookup('maybe') !== Semigroupoid.lookup('function'), 'maybe !== function');
    assert(Semigroupoid.lookup('either') !== Semigroupoid.lookup('task'), 'either !== task');
});

test('MaybeSemigroupoid.compose 는 Kleisli 화살표를 합성한다', () => {
    const { compose } = Semigroupoid.lookup('maybe');
    const half = x => x % 2 === 0 ? fp.Maybe.Just(x / 2) : fp.Maybe.Nothing();
    const inc = x => fp.Maybe.Just(x + 1);
    assertEquals(compose(inc, half)(8).value, 5);      // 8 -> Just(4) -> Just(5)
    assert(compose(inc, half)(7).isNothing(), '홀수면 Nothing 이 전파된다');
});

test('MaybeSemigroupoid.compose 는 함수가 아닌 인자를 거부한다', () => {
    const { compose } = Semigroupoid.lookup('maybe');
    assertThrows(() => compose(fp.Maybe.Just(1), x => fp.Maybe.Just(x)), 'Maybe 를 넘기면 던진다');
    assertThrows(() => compose(x => fp.Maybe.Just(x), fp.Maybe.Just(1)), '두 번째 인자도 마찬가지');
});

test('MaybeCategory.id 는 Kleisli 항등 화살표다', () => {
    const { compose, id } = Category.lookup('maybe');
    const inc = x => fp.Maybe.Just(x + 1);
    assertEquals(id(3).value, 3);
    assertEquals(compose(inc, id)(3).value, 4);
    assertEquals(compose(id, inc)(3).value, 4);
});

console.log('\n✅ Semigroupoid and Category tests completed\n');
