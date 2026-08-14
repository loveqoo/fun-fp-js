// Profunctor tests
import fp from '../index.js';
import { test, assertEquals, assert, assertThrowsWith, logSection } from './utils.js';

const { Profunctor, Strong, Choice, Wander, Either, identity } = fp;

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


// ─── Strong / Choice / Wander — Static Land 밖의 셋 ──────────────────
// optics 가 요구해서 명시적으로 구현한다(Free 처럼 내부용이라고 숨기지 않는다).
// 아직 인스턴스는 등록하지 않는다 — 이 단계는 클래스만 세운다.
logSection('Strong / Choice / Wander');

const P = Profunctor.lookup('function');
const mkStrong = () => new Strong(P,
    p => ([a, c]) => [p(a), c],
    p => ([c, a]) => [c, p(a)], 'function');
const mkChoice = () => new Choice(P,
    p => e => Either.bimap(p, identity, e),
    p => e => Either.bimap(identity, p, e), 'function');

test('Strong - first 는 왼쪽만, second 는 오른쪽만 건드린다', () => {
    const S = mkStrong();
    assertEquals(S.first(x => x * 10)([3, 9]), [30, 9]);
    assertEquals(S.second(x => x * 10)([3, 9]), [3, 90]);
    // 둘이 같은 자리를 보면 안 된다 — 바꿔치기하면 여기서 잡힌다.
    assert(JSON.stringify(S.first(x => x * 10)([3, 9])) !== JSON.stringify(S.second(x => x * 10)([3, 9])),
        'first 와 second 가 같은 자리를 본다');
});

test('Choice - left 는 Left 만, right 는 Right 만 건드린다', () => {
    const C = mkChoice();
    assertEquals(C.left(x => x * 10)(Either.Left(4)).value, 40);
    assertEquals(C.left(x => x * 10)(Either.Right(4)).value, 4);    // 통과시킨다
    assertEquals(C.right(x => x * 10)(Either.Right(4)).value, 40);
    assertEquals(C.right(x => x * 10)(Either.Left(4)).value, 4);    // 통과시킨다
});

// JS 는 다중 상속이 안 된다. Traversable 선례대로 하나만 extends 하고 나머지는 복사한다.
test('Wander - 부모 둘을 진다 (Strong 은 상속, Choice 는 복사)', () => {
    const S = mkStrong(), C = mkChoice();
    const W = new Wander(S, C, (_traverse, p) => p, 'function');
    assert(W instanceof Strong, 'Strong 을 상속해야 한다');
    assert(W instanceof Profunctor, 'Profunctor 도 이어야 한다');
    assertEquals(typeof W.promap, 'function');
    assertEquals(W.first(x => x * 10)([3, 9]), [30, 9]);
    assertEquals(W.left(x => x * 10)(Either.Left(4)).value, 40);    // Choice 에서 복사된 것
    assertEquals(W.right(x => x * 10)(Either.Right(4)).value, 40);
    assertEquals(typeof W.wander, 'function');
});

test('Strong / Choice / Wander - 잘못된 부모를 거부한다', () => {
    assertThrowsWith(() => new Strong({}, x => x, x => x, 'function'),
        'Strong: argument must be a Profunctor');
    assertThrowsWith(() => new Choice({}, x => x, x => x, 'function'),
        'Choice: argument must be a Profunctor');
    assertThrowsWith(() => new Wander(mkStrong(), mkStrong(), (t, p) => p, 'function'),
        'Wander: second argument must be a Choice');
    assertThrowsWith(() => new Wander(mkChoice(), mkChoice(), (t, p) => p, 'function'),
        'Wander: first argument must be a Strong');
});

test('Strong - 타입이 안 맞는 profunctor 값을 거부한다', () => {
    assertThrowsWith(() => mkStrong().first(42), 'Strong.first: argument must match function');
});

// 정적 상속의 함정. withTypeRegistry 를 빼먹으면 Strong.types 가 Profunctor.types 를
// 가리켜 남의 인스턴스를 자기 것으로 착각한다 — 명세 게이트 ①이 실제로 그것을 잡았다.
test('Strong / Choice / Wander - 각자 자기 레지스트리를 가진다', () => {
    for (const [name, C] of [['Strong', Strong], ['Choice', Choice], ['Wander', Wander]]) {
        assert(C.types !== Profunctor.types, `${name}.types 가 Profunctor.types 를 가리킨다`);
        assertEquals(Object.keys(C.types).length, 0, `${name} 은 아직 등록된 인스턴스가 없어야 한다`);
        assertThrowsWith(() => C.lookup('function'), `${name}.lookup: unsupported key function`);
    }
});

console.log('\n✅ Profunctor tests completed\n');
