// Monoid Laws Tests
import fp from '../index.js';
import { test, assertEquals, assertEqualsBy, assert, assertThrowsWith, logSection } from './utils.js';

const { Monoid, Maybe, Apply } = fp;

logSection('Monoid Laws');

// === String Monoid ===
const strMonoid = Monoid.lookup('string');

test('String Monoid - Right identity: concat(a, empty()) === a', () => {
    const a = 'Hello';
    assertEquals(strMonoid.concat(a, strMonoid.empty()), a);
});

test('String Monoid - Left identity: concat(empty(), a) === a', () => {
    const a = 'Hello';
    assertEquals(strMonoid.concat(strMonoid.empty(), a), a);
});

// === Array Monoid ===
const arrMonoid = Monoid.lookup('array');

test('Array Monoid - Right identity', () => {
    const a = [1, 2, 3];
    assertEquals(arrMonoid.concat(a, arrMonoid.empty()), a);
});

test('Array Monoid - Left identity', () => {
    const a = [1, 2, 3];
    assertEquals(arrMonoid.concat(arrMonoid.empty(), a), a);
});

// === Number Sum Monoid ===
const numSumMonoid = Monoid.lookup('number');

test('Number Sum Monoid - Right identity: a + 0 === a', () => {
    const a = 42;
    assertEquals(numSumMonoid.concat(a, numSumMonoid.empty()), a);
});

test('Number Sum Monoid - Left identity: 0 + a === a', () => {
    const a = 42;
    assertEquals(numSumMonoid.concat(numSumMonoid.empty(), a), a);
});

// === Number Product Monoid ===
const numProductMonoid = Monoid.lookup('NumberProductMonoid');

test('Number Product Monoid - Right identity: a * 1 === a', () => {
    const a = 42;
    assertEquals(numProductMonoid.concat(a, numProductMonoid.empty()), a);
});

test('Number Product Monoid - Left identity: 1 * a === a', () => {
    const a = 42;
    assertEquals(numProductMonoid.concat(numProductMonoid.empty(), a), a);
});

// === Number Max Monoid ===
const numMaxMonoid = Monoid.lookup('NumberMaxMonoid');

test('Number Max Monoid - Right identity: max(a, -Infinity) === a', () => {
    const a = 42;
    assertEquals(numMaxMonoid.concat(a, numMaxMonoid.empty()), a);
});

test('Number Max Monoid - Left identity: max(-Infinity, a) === a', () => {
    const a = 42;
    assertEquals(numMaxMonoid.concat(numMaxMonoid.empty(), a), a);
});

// === Number Min Monoid ===
const numMinMonoid = Monoid.lookup('NumberMinMonoid');

test('Number Min Monoid - Right identity: min(a, Infinity) === a', () => {
    const a = 42;
    assertEquals(numMinMonoid.concat(a, numMinMonoid.empty()), a);
});

test('Number Min Monoid - Left identity: min(Infinity, a) === a', () => {
    const a = 42;
    assertEquals(numMinMonoid.concat(numMinMonoid.empty(), a), a);
});

// === Boolean All Monoid ===
const boolAllMonoid = Monoid.lookup('boolean');

test('Boolean All Monoid - Right identity: a && true === a', () => {
    assertEquals(boolAllMonoid.concat(true, boolAllMonoid.empty()), true);
    assertEquals(boolAllMonoid.concat(false, boolAllMonoid.empty()), false);
});

test('Boolean All Monoid - Left identity: true && a === a', () => {
    assertEquals(boolAllMonoid.concat(boolAllMonoid.empty(), true), true);
    assertEquals(boolAllMonoid.concat(boolAllMonoid.empty(), false), false);
});

// === Boolean Any Monoid ===
const boolAnyMonoid = Monoid.lookup('BooleanAnyMonoid');

test('Boolean Any Monoid - Right identity: a || false === a', () => {
    assertEquals(boolAnyMonoid.concat(true, boolAnyMonoid.empty()), true);
    assertEquals(boolAnyMonoid.concat(false, boolAnyMonoid.empty()), false);
});

test('Boolean Any Monoid - Left identity: false || a === a', () => {
    assertEquals(boolAnyMonoid.concat(boolAnyMonoid.empty(), true), true);
    assertEquals(boolAnyMonoid.concat(boolAnyMonoid.empty(), false), false);
});

// === Boolean Xor Monoid ===
const boolXorMonoid = Monoid.lookup('BooleanXorMonoid');

test('Boolean Xor Monoid - Right identity: a !== false === a', () => {
    assertEquals(boolXorMonoid.concat(true, boolXorMonoid.empty()), true);
    assertEquals(boolXorMonoid.concat(false, boolXorMonoid.empty()), false);
});

test('Boolean Xor Monoid - Left identity: false !== a === a', () => {
    assertEquals(boolXorMonoid.concat(boolXorMonoid.empty(), true), true);
    assertEquals(boolXorMonoid.concat(boolXorMonoid.empty(), false), false);
});

// === Function Monoid ===
const fnMonoid = Monoid.lookup('function');

test('Function Monoid - Right identity: compose(f, identity) === f', () => {
    const f = x => x * 2;
    const result = fnMonoid.concat(f, fnMonoid.empty());
    assertEquals(result(5), f(5));
});

test('Function Monoid - Left identity: compose(identity, f) === f', () => {
    const f = x => x * 2;
    const result = fnMonoid.concat(fnMonoid.empty(), f);
    assertEquals(result(5), f(5));
});

// === Maybe Monoid ===
logSection('Maybe Monoid');

const maybeMN = Maybe.Monoid('array');
// 비교도 라이브러리의 Setoid 로 한다 — 사설 deepEquals 를 대체했다
const eqMA = fp.Setoid.lookup('maybe(array(number))');
const eqAN = fp.Setoid.lookup('array(number)');

test('Maybe Monoid - empty() returns Nothing', () => {
    assertEqualsBy(eqMA, maybeMN.empty(), Maybe.Nothing());
});

test('Maybe Monoid - Right identity: concat(a, empty()) === a', () => {
    assertEqualsBy(eqMA, maybeMN.concat(Maybe.Just([1, 2]), maybeMN.empty()), Maybe.Just([1, 2]));
});

test('Maybe Monoid - Left identity: concat(empty(), a) === a', () => {
    assertEqualsBy(eqMA, maybeMN.concat(maybeMN.empty(), Maybe.Just([1, 2])), Maybe.Just([1, 2]));
});

test('Maybe Monoid - Associativity: concat(concat(a, b), c) === concat(a, concat(b, c))', () => {
    const a = Maybe.Just([1]), b = Maybe.Just([2]), c = Maybe.Just([3]);
    assertEqualsBy(eqMA,
        maybeMN.concat(maybeMN.concat(a, b), c),
        maybeMN.concat(a, maybeMN.concat(b, c))
    );
});

test('Maybe Monoid - registry: Monoid.lookup resolves parameterized key', () => {
    assert(Monoid.lookup('maybe(array)') === Maybe.Monoid('array'));
});

test('Maybe Monoid - invalid input throws', () => {
    assertThrowsWith(() => Maybe.Monoid({}), 'Maybe.Monoid: innerSG must be a supported semigroup key or Semigroup instance');
});

// === first/last Semigroup — 값 타입을 보지 않는다 ('any') ===
// (a,b) => a 와 (a,b) => b 는 값의 타입과 무관하다. 한때 'object' 로 등록돼 원시값을
// 거부했는데, types/data/builtins.d.ts 는 처음부터 unknown 으로 선언하고 있었다.
const { Semigroup } = fp;

test("Semigroup 'first' - 원시값에서 동작한다", () => {
    assertEquals(Semigroup.lookup('first').concat(1, 2), 1);
    assertEquals(Semigroup.lookup('first').concat('a', 'b'), 'a');
});

test("Semigroup 'last' - 원시값에서 동작한다", () => {
    assertEquals(Semigroup.lookup('last').concat(1, 2), 2);
    assertEquals(Semigroup.lookup('last').concat('a', 'b'), 'b');
});

test("Semigroup 'first' - 객체에서도 동작한다", () => {
    assertEqualsBy(fp.Setoid.lookup('struct(a:number)'), Semigroup.lookup('first').concat({ a: 1 }, { a: 2 }), { a: 1 });
});

// 'any' 는 "무슨 타입이어야 하는가" 만 끈다. "두 인자가 같은 타입인가" 는 살아 있다.
//
// 메시지를 부분 문자열이 아니라 **전문으로** 대조한다. 'must be the same type' 만 보면
// 'and match object' 가 붙은 옛 메시지도 통과해서 아무것도 고정하지 못한다.
const messageOf = f => { try { f(); } catch (e) { return e.message; } return '(안 던졌다)'; };

test("Semigroup 'first' - 타입이 섞이면 여전히 거부한다 ('any' 는 타입명을 붙이지 않는다)", () => {
    assertEquals(
        messageOf(() => Semigroup.lookup('first').concat(1, 'a')),
        'Semigroup.concat: arguments must be the same type'
    );
});

test("'any' 가 아닌 인스턴스는 기대 타입명을 계속 알려준다", () => {
    assertEquals(
        messageOf(() => Monoid.lookup('array').concat(1, 2)),
        'Semigroup.concat: arguments must be the same type and match Array'
    );
});

test("Semigroup 'first'/'last' - Monoid 가 아니다 (항등원이 없다)", () => {
    assertThrowsWith(() => Monoid.lookup('first'), 'unsupported key');
    assertThrowsWith(() => Monoid.lookup('last'), 'unsupported key');
});

// === plus(maybe) — Plus 에서 유도한 Monoid ===
// Haskell 의 Data.Monoid.First 에 해당한다: 안을 열지 않고 봉투째 하나를 고른다.
// maybe(first)(= Maybe.Monoid('first')) 와는 다른 모노이드다 — 그쪽은 안을 합친다.
const plusMaybe = Monoid.lookup('plus(maybe)');

test("Monoid 'plus(maybe)' - 첫 Just 를 고른다", () => {
    assertEquals(plusMaybe.concat(Maybe.Just(1), Maybe.Just(2)).value, 1);
    assertEquals(plusMaybe.concat(Maybe.Nothing(), Maybe.Just(2)).value, 2);
    assert(plusMaybe.concat(Maybe.Nothing(), Maybe.Nothing()).isNothing());
});

test("Monoid 'plus(maybe)' - identity: empty() 는 Nothing", () => {
    const a = Maybe.Just(7);
    assertEquals(plusMaybe.concat(a, plusMaybe.empty()).value, 7);
    assertEquals(plusMaybe.concat(plusMaybe.empty(), a).value, 7);
});

// 이것이 maybe(first) 와 갈리는 지점이다 — 안을 안 보므로 타입이 섞여도 고를 수 있다.
test("Monoid 'plus(maybe)' - 안을 열지 않으므로 타입이 섞여도 동작한다", () => {
    assertEquals(plusMaybe.concat(Maybe.Just(1), Maybe.Just('a')).value, 1);
    assertEquals(plusMaybe.concat(Maybe.Just(null), Maybe.Just(1)).value, null);
    assertThrowsWith(() => Maybe.Monoid('first').concat(Maybe.Just(1), Maybe.Just('a')), 'must be the same type');
});

test("Monoid 'plus(array)' - Plus 유도가 array 에도 대칭으로 있다", () => {
    assertEqualsBy(eqAN, Monoid.lookup('plus(array)').concat([1], [2]), [1, 2]);
    assertEqualsBy(eqAN, Monoid.lookup('plus(array)').empty(), []);
});

// 유도는 손으로 쓴 특례 2개가 아니라 Plus 생성자의 규칙이다 — Plus 를 새로 등록하면
// 짝 Monoid/Semigroup 이 자동으로 따라온다.
test("Plus 유도 - 짝 Semigroup 도 레지스트리에 있다", () => {
    assertEquals(Semigroup.lookup('plus(maybe)').concat(Maybe.Just(1), Maybe.Just(2)).value, 1);
    assertEqualsBy(eqAN, Semigroup.lookup('plus(array)').concat([1], [2]), [1, 2]);
});

test("Plus 유도 - 같은 키는 같은 인스턴스", () => {
    assert(Monoid.lookup('plus(maybe)') === Monoid.lookup('plus(maybe)'));
    assert(Semigroup.lookup('plus(maybe)') === Semigroup.lookup('plus(maybe)'));
});

// register() 가 instance.constructor.name 을 키로 쓰므로, 유도에서 그것을 쓰면
// Monoid.types['Monoid'] 가 생기고 두 Plus 가 서로 덮는다.
test("Plus 유도 - 생성자 이름 키를 오염시키지 않는다", () => {
    assertEquals(Monoid.types['Monoid'], undefined);
    assertEquals(Semigroup.types['Semigroup'], undefined);
});

test("Plus 유도 - alt 와 같은 결과를 준다", () => {
    const a = Maybe.Just(1), b = Maybe.Just(2);
    assertEquals(Monoid.lookup('plus(maybe)').concat(a, b).value, fp.Alt.lookup('maybe').alt(a, b).value);
});

// === Identity / Const Applicative — traverse 에 넘기는 것들 ===
// 이것들이 레지스트리에 있어야 "심볼만 위조해 검증을 건너뛴 것" 과 구분할 수 있다.
// 사설 딕셔너리로 되돌리면 아래가 빨간불이 된다 — 그것이 이 테스트의 목적이다.
const { Applicative, Functor } = fp;

test('Applicative identity - 레지스트리에서 꺼낼 수 있다', () => {
    const id = Applicative.lookup('identity');
    assert(id instanceof Applicative);
    assertEquals(id.of(1).value, 1);
    assertEquals(id.map(x => x + 1, { value: 1 }).value, 2);
    assertEquals(id.ap({ value: x => x * 3 }, { value: 2 }).value, 6);
});

// 심볼 위조로는 이 검사들이 전부 사라진다.
test('Applicative identity - 검사가 살아 있다', () => {
    const id = Applicative.lookup('identity');
    assertThrowsWith(() => id.map(1, { value: 1 }), 'Functor.map');
    assertThrowsWith(() => id.map(x => x, [1]), 'Functor.map');
    assertThrowsWith(() => id.ap({ value: x => x }, [1]), 'Apply.ap');
});

test('Applicative.Const - monoid 로 모으고 값은 버린다', () => {
    const c = Applicative.Const(Monoid.lookup('array'));
    assertEqualsBy(eqAN, c.of().value, []);
    assertEqualsBy(eqAN, c.ap({ value: [1] }, { value: [2] }).value, [1, 2]);
    assertEqualsBy(eqAN, c.map(x => x + 1, { value: [9] }).value, [9]);   // 값을 버린다
});


// 등록된 다른 모든 Applicative 는 등록된 Apply 로부터 만들어진다
// (MaybeFunctor → MaybeApply → MaybeApplicative). identity 도 같아야 한다.
test('identity - Functor/Apply/Applicative 3단이 전부 등록돼 있다', () => {
    assert(Functor.lookup('identity') instanceof Functor);
    assert(Applicative.lookup('identity') instanceof Applicative);
    assertEquals(Functor.lookup('identity').map(x => x + 1, { value: 1 }).value, 2);
    assertEquals(Applicative.lookup('identity').of(7).value, 7);
});

// Applicative.Const 는 Maybe.Monoid(innerSG) 선례를 따라야 한다 — 키면 등록, 인스턴스면 캐시.
test('Applicative.Const - 키로 만들면 레지스트리에 등록된다', () => {
    const c = Applicative.Const('array');
    assert(Applicative.lookup('const(array)') === c);
    assertEqualsBy(eqAN, c.of().value, []);
});

test('Applicative.Const - 같은 키/인스턴스는 같은 인스턴스', () => {
    assert(Applicative.Const('array') === Applicative.Const('array'));
    assert(Applicative.Const('array') === Applicative.Const(Monoid.lookup('array')));
    const mine = new Monoid(new Semigroup((a, b) => a + b, 'number'), () => 0, 'number');
    assert(Applicative.Const(mine) === Applicative.Const(mine));
});

// 지연 해석 — 팩토리를 부르기 전에도 const(<키>) 로 꺼낼 수 있어야 한다(Maybe.Monoid 선례).
// 'string' 을 쓰는 이유: 다른 테스트가 Applicative.Const('string') 을 부르지 않으므로
// 이 테스트 전에 등록되지 않는다. 'array' 를 쓰면 앞 테스트가 이미 등록해 구멍을 못 잡는다.
test('Applicative.Const - 팩토리 호출 전에도 레지스트리에서 해석된다', () => {
    const c = Applicative.lookup('const(string)');
    assert(c instanceof Applicative);
    assertEquals(c.of().value, '');
    assert(Applicative.Const('string') === c);   // 해석 결과가 팩토리와 같은 인스턴스
});

test('Applicative.Const - Monoid 가 아니면 거부한다', () => {
    assertThrowsWith(() => Applicative.Const({}), 'Applicative.Const');
    assertThrowsWith(() => Applicative.Const('없는키'), 'unsupported key');
});

// types.equals(a, b, 'Object') 는 types.check 와 달리 **대소문자 폴백이 없다**.
// 같은 파일의 ObjectFilterable/ObjectFoldable 은 'object'(소문자)를 쓰므로,
// 누가 "일관성" 을 이유로 여기를 소문자로 바꾸면 Apply.ap 이 전부 던져
// optics 의 traversal 이 통째로 죽는다. 주석만으로 막아두지 않는다.
test("Identity/Const 의 type 은 'Object' 대문자여야 한다", () => {
    assertEquals(Functor.lookup('identity').type, 'Object');
    assertEquals(Applicative.lookup('identity').type, 'Object');
    assertEquals(Applicative.Const(Monoid.lookup('array')).type, 'Object');
});

// identity 를 3단으로 고쳐놓고 같은 회차에 새로 쓴 Const 에서 재발시켰다.
test('Applicative.Const - Functor/Apply 층도 등록된다', () => {
    Applicative.Const('array');
    assert(Functor.lookup('const(array)') instanceof Functor);
    assert(Apply.lookup('const(array)') instanceof Apply);
});

console.log('\n✅ Monoid tests completed');
