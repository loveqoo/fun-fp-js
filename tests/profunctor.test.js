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
    }
    // 각자 다른 것을 담는다. 같은 것을 가리키면 이 셋이 서로를 덮어쓴다.
    assert(Strong.types !== Choice.types && Choice.types !== Wander.types, '레지스트리가 겹친다');
    // Tagged 는 Choice 에만 있다 — Strong·Wander 가 아니라는 사실이 여기 드러난다.
    assert(Choice.types.TaggedChoice, 'Choice 에 Tagged 가 있어야 한다');
    assertEquals(Object.keys(Strong.types).includes('tagged'), false, 'Tagged 는 Strong 이 아니다');
    assertEquals(Object.keys(Wander.types).includes('tagged'), false, 'Tagged 는 Wander 가 아니다');
    // Profunctor 레지스트리에도 안 올린다 — .type 이 'any' 인 Functor 가 없어 명세를 못 지킨다.
    assertEquals(Object.keys(Profunctor.types).includes('tagged'), false,
        'Tagged 를 Profunctor 로 등록하면 명세 게이트 ③이 멈춘다');
});


// ─── 등록된 인스턴스 다섯 ────────────────────────────────────────────
// 표준대로 second/right 도 진다. Optics 는 first/left/wander 만 쓰므로, 짝을 테스트가
// 안 잡으면 감시 밖이다 — 실제로 Forget.right 를 망가뜨려도 아무 데서도 안 걸렸다.
logSection('Profunctor 확장 인스턴스');

test('function - Strong/Choice/Wander 셋이 등록돼 있다', () => {
    assert(Strong.lookup('function') instanceof Strong);
    assert(Choice.lookup('function') instanceof Choice);
    assert(Wander.lookup('function') instanceof Wander);
});

test('function Wander - 네 메서드가 서로 다른 자리를 본다', () => {
    const W = Wander.lookup('function');
    assertEquals(W.first(x => x * 10)([3, 9]), [30, 9]);
    assertEquals(W.second(x => x * 10)([3, 9]), [3, 90]);
    assertEquals(W.left(x => x * 10)(Either.Left(4)).value, 40);
    assertEquals(W.left(x => x * 10)(Either.Right(4)).value, 4);
    assertEquals(W.right(x => x * 10)(Either.Right(4)).value, 40);
    assertEquals(W.right(x => x * 10)(Either.Left(4)).value, 4);
});

test('Forget - 3단으로 등록되고 같은 키는 같은 인스턴스', () => {
    const F = Wander.Forget(fp.Monoid.lookup('array'));
    assert(Strong.lookup('forget(array)') === F, 'Strong 층에 없다');
    assert(Choice.lookup('forget(array)') === F, 'Choice 층에 없다');
    assert(Wander.lookup('forget(array)') === F, 'Wander 층에 없다');
    assert(Wander.Forget('array') === F, '같은 키가 다른 인스턴스를 낸다');
});

test('Forget - 모으는 쪽만 모으고 나머지는 빈 것을 낸다', () => {
    const F = Wander.Forget(fp.Monoid.lookup('array'));
    // 캐리어는 반드시 wrap 을 지난다 — 벌거벗은 함수는 FunctionWander 의 것이다.
    const p = F.wrap(a => [a]);
    assertEquals(F.unwrap(F.first(p))([7, 9]), [7]);
    assertEquals(F.unwrap(F.second(p))([7, 9]), [9]);
    // left 는 Left 를 모으고 Right 는 버린다. right 는 그 반대다.
    assertEquals(F.unwrap(F.left(p))(Either.Left(5)), [5]);
    assertEquals(F.unwrap(F.left(p))(Either.Right(5)), []);
    assertEquals(F.unwrap(F.right(p))(Either.Right(5)), [5]);
    assertEquals(F.unwrap(F.right(p))(Either.Left(5)), []);
});

// Forget 은 한때 .type 이 'function' 이라 FunctionWander 와 한 태그였다. 넷 다 통과했다.
test('Forget - 벌거벗은 함수와 서로 섞이지 않는다', () => {
    const F = Wander.Forget(fp.Monoid.lookup('array'));
    const FN = Wander.lookup('function');
    const messageOf = fn => { try { fn(); return '(안 던짐)'; } catch (e) { return e.message; } };
    assertEquals(messageOf(() => F.first(a => [a])),
        'Strong.first: argument must match Forget(array)');
    assertEquals(messageOf(() => FN.first(F.wrap(a => [a]))),
        'Strong.first: argument must match function');
    assertEquals(F.type, 'Forget(array)', 'Forget 은 자기 타입이다');
    assert(FN.type === 'function' && F.type !== FN.type, '두 인스턴스가 한 태그를 쓰면 안 된다');
});

// wrap 이 Const 의 문을 지나므로 fn 의 결과가 모노이드 값이 아니면 거기서 걸린다.
test('Forget.wrap - 모노이드가 아닌 값을 내는 함수는 부를 때 걸린다', () => {
    const F = Wander.Forget(fp.Monoid.lookup('array'));
    const bad = F.wrap(a => a * 2);        // array 를 내야 하는데 숫자를 낸다
    let message = '(안 던짐)';
    try { F.unwrap(F.first(bad))([7, 9]); } catch (e) { message = e.message; }
    assertEquals(message, 'Semigroup.concat: arguments must be the same type and match Array');
});

// Tagged 가 Strong·Wander 가 아니라는 것이 "Lens/Traversal 은 review 할 수 없다" 다.
test('Tagged - Choice 이지만 Strong 도 Wander 도 아니다', () => {
    const T = Choice.lookup('tagged');
    assert(T instanceof Choice);
    assert(!(T instanceof Strong), 'Tagged 가 Strong 이면 안 된다');
    assertEquals(typeof T.first, 'undefined');
    assertEquals(typeof T.wander, 'undefined');
    // .value 만 보면 안 된다 — Left(7) 과 Right(7) 의 value 가 둘 다 7 이라
    // right 를 Left 로 바꿔치기해도 통과한다(실측). 어느 쪽인지를 봐야 잡힌다.
    assert(T.left(7).isLeft() && T.left(7).value === 7, 'left 는 Left 를 내야 한다');
    assert(T.right(7).isRight() && T.right(7).value === 7, 'right 는 Right 를 내야 한다');
    // 입력을 무시하므로 promap 은 출력 변환만 태운다.
    assertEquals(T.promap(x => x, x => x * 2, 7), 14);
});

console.log('\n✅ Profunctor tests completed\n');
