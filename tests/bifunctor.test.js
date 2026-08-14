// Bifunctor tests
import fp from '../index.js';
import { test, assertEquals, assert, logSection } from './utils.js';

const { Bifunctor, Either } = fp;

logSection('Bifunctor');

test('Bifunctor.types has EitherBifunctor', () => {
    assert(Bifunctor.types.EitherBifunctor, 'should have EitherBifunctor');
});

test('EitherBifunctor.bimap on Right', () => {
    const right = Either.Right(5);
    const result = Bifunctor.types.EitherBifunctor.bimap(
        x => x.toUpperCase(),  // for Left
        x => x * 2,            // for Right
        right
    );
    assertEquals(result.value, 10);
    assert(Either.isRight(result), 'should still be Right');
});

test('EitherBifunctor.bimap on Left', () => {
    const left = Either.Left('error');
    const result = Bifunctor.types.EitherBifunctor.bimap(
        x => x.toUpperCase(),  // for Left
        x => x * 2,            // for Right
        left
    );
    assertEquals(result.value, 'ERROR');
    assert(Either.isLeft(result), 'should still be Left');
});

logSection('Bifunctor Laws');

test('Identity: bimap(id, id, a) === a', () => {
    const id = x => x;
    const right = Either.Right(42);
    const result = Bifunctor.types.EitherBifunctor.bimap(id, id, right);
    assertEquals(result.value, right.value);
});

test('Composition: bimap(f . g, h . i, a) === bimap(f, h, bimap(g, i, a))', () => {
    const f = x => x + '!';
    const g = x => x.toUpperCase();
    const h = x => x * 2;
    const i = x => x + 1;

    const left = Either.Left('err');
    const { bimap } = Bifunctor.types.EitherBifunctor;

    // bimap(f . g, h . i, a)
    const leftResult = bimap(x => f(g(x)), x => h(i(x)), left);
    // bimap(f, h, bimap(g, i, a))
    const rightResult = bimap(f, h, bimap(g, i, left));

    assertEquals(leftResult.value, rightResult.value);
});

logSection('튜플 — JS 타입이 아니라 길이가 정한다');

// 소유자 결정(2026-08-15): 관리하는 것은 컨테이너 타입과 그 안의 값 타입 둘뿐이고,
// 깊이는 둘까지다. 튜플은 JS 타입이 아니므로 .type 은 'Array' 가 맞다 — 대신 길이를
// 연산이 본다. 전에는 안 봐서 조용히 값을 버리고 없는 값을 만들었다(실측):
//
//   bimap(x=>x*10, x=>x+1, [1,2,3,4,5])  ->  [10, 3]      뒤 셋이 사라졌다
//   bimap(x=>x*10, x=>x+1, [])           ->  [NaN, NaN]   없는 것을 만들었다
test('길이가 2 가 아니면 거부한다 — 조용히 버리거나 만들지 않는다', () => {
    const T = Bifunctor.lookup('tuple');
    const messageOf = a => { try { T.bimap(x => x * 10, x => x + 1, a); return '(안 던짐)'; }
                             catch (e) { return e.message; } };
    assertEquals(JSON.stringify(T.bimap(x => x * 10, x => x + 1, [1, 2])), '[10,3]', '길이 2 는 그대로');
    assertEquals(messageOf([1, 2, 3, 4, 5]), 'Bifunctor.bimap: tuple must have exactly 2 elements, got 5');
    assertEquals(messageOf([]), 'Bifunctor.bimap: tuple must have exactly 2 elements, got 0');
    assertEquals(messageOf([7]), 'Bifunctor.bimap: tuple must have exactly 2 elements, got 1');
});

// 느슨한 모드는 **타입** 검사를 끄는 것이다. [] 에서 [NaN, NaN] 이 나오는 것은 타입 문제가
// 아니라 결함이므로 이 검사는 모드와 무관하게 산다.
test('느슨한 모드에서도 산다 — 이건 타입 검사가 아니다', () => {
    fp.setStrictMode(false);
    let message = '(안 던짐)';
    try { Bifunctor.lookup('tuple').bimap(x => x, x => x, []); } catch (e) { message = e.message; }
    fp.setStrictMode(true);
    assertEquals(message, 'Bifunctor.bimap: tuple must have exactly 2 elements, got 0');
});

// .type 을 'Tuple' 로 바꾸는 것은 답이 아니다 — types.of([1,2]) 가 'Array' 를 내므로
// 모든 호출이 실패한다. JS 가 [1,2] 를 배열이라 하는 것을 우리가 못 바꾼다.
test('.type 은 Array 다 — 튜플은 JS 타입이 아니다', () => {
    assertEquals(Bifunctor.lookup('tuple').type, 'Array');
    assert(Bifunctor.lookup('tuple') !== fp.Functor.lookup('array'), '인스턴스는 다르다');
});

console.log('\n✅ Bifunctor tests completed\n');
