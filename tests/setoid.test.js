// Setoid Laws Tests
import fp from '../index.js';
import { test, assertEquals, logSection } from './utils.js';

const { Setoid } = fp;

logSection('Setoid Laws');

// === Number Setoid ===
const numSetoid = Setoid.lookup('number');

test('Number Setoid - Reflexivity: equals(a, a) === true', () => {
    assertEquals(numSetoid.equals(5, 5), true);
    assertEquals(numSetoid.equals(0, 0), true);
    assertEquals(numSetoid.equals(-3.14, -3.14), true);
});

test('Number Setoid - Symmetry: equals(a, b) === equals(b, a)', () => {
    assertEquals(numSetoid.equals(1, 2), numSetoid.equals(2, 1));
    assertEquals(numSetoid.equals(5, 5), numSetoid.equals(5, 5));
});

test('Number Setoid - Transitivity: equals(a, b) && equals(b, c) => equals(a, c)', () => {
    const a = 42, b = 42, c = 42;
    if (numSetoid.equals(a, b) && numSetoid.equals(b, c)) {
        assertEquals(numSetoid.equals(a, c), true);
    }
});

// === String Setoid ===
const strSetoid = Setoid.lookup('string');

test('String Setoid - Reflexivity', () => {
    assertEquals(strSetoid.equals('hello', 'hello'), true);
    assertEquals(strSetoid.equals('', ''), true);
});

test('String Setoid - Symmetry', () => {
    assertEquals(strSetoid.equals('a', 'b'), strSetoid.equals('b', 'a'));
});

test('String Setoid - Transitivity', () => {
    const a = 'x', b = 'x', c = 'x';
    if (strSetoid.equals(a, b) && strSetoid.equals(b, c)) {
        assertEquals(strSetoid.equals(a, c), true);
    }
});

// === Boolean Setoid ===
const boolSetoid = Setoid.lookup('boolean');

test('Boolean Setoid - Reflexivity', () => {
    assertEquals(boolSetoid.equals(true, true), true);
    assertEquals(boolSetoid.equals(false, false), true);
});

test('Boolean Setoid - Symmetry', () => {
    assertEquals(boolSetoid.equals(true, false), boolSetoid.equals(false, true));
});

// === Date Setoid ===
const dateSetoid = Setoid.lookup('date');

test('Date Setoid - Reflexivity', () => {
    const d = new Date('2024-01-01');
    assertEquals(dateSetoid.equals(d, d), true);
});

test('Date Setoid - Symmetry', () => {
    const d1 = new Date('2024-01-01');
    const d2 = new Date('2024-01-02');
    assertEquals(dateSetoid.equals(d1, d2), dateSetoid.equals(d2, d1));
});

test('Date Setoid - Equal dates by value', () => {
    const d1 = new Date('2024-01-01');
    const d2 = new Date('2024-01-01');
    assertEquals(dateSetoid.equals(d1, d2), true);
});

// === Default Setoid (reference equality) ===
const defaultSetoid = Setoid.lookup('default');

test('Default Setoid - Reference equality', () => {
    assertEquals(defaultSetoid.equals(1, 1), true);
    assertEquals(defaultSetoid.equals(1, 2), false);
    const obj = { a: 1 };
    assertEquals(defaultSetoid.equals(obj, obj), true);
});

// 'default' 는 .type 이 'any' 다 — 값 타입은 안 보지만 "두 인자가 같은 타입" 은 본다.
// 한때 레지스트리 밖 맨 객체라 이종 인자에 조용히 false 를 줬다. 그 상태로 되돌아가면 여기서 멈춘다.
test('Default Setoid - 이종 인자는 던진다 (조용히 false 를 주지 않는다)', () => {
    let m = '(안 던짐)';
    try { defaultSetoid.equals(1, 'a'); } catch (e) { m = e.message; }
    assertEquals(m, 'Setoid.equals: arguments must be the same type');
    assertEquals(defaultSetoid instanceof Setoid, true);
    assertEquals(defaultSetoid === Setoid.lookup('default'), true, '꺼낼 때마다 같은 물건이어야 한다');
});


logSection('Setoid — 컨테이너 (안쪽 비교법을 받아 만든다)');

// 헬퍼(assertDeepEquals)를 쓰지 않는다. 그 헬퍼가 검사 대상을 쓰게 되면 둘이 같이
// 틀렸을 때 아무도 못 잡는다 — 여기서는 equals 의 결과를 불리언으로 직접 본다.
const { Maybe, Either } = fp;
const J = Maybe.Just, N = Maybe.Nothing, L = Either.Left, R = Either.Right;

test('팩토리를 부르기 전에도 조립 키로 꺼내진다', () => {
    assertEquals(Setoid.lookup('maybe(number)') instanceof Setoid, true);
    assertEquals(Setoid.lookup('array(number)') instanceof Setoid, true);
    assertEquals(Setoid.lookup('either(string,number)') instanceof Setoid, true);
});

test('Maybe: 같은 쪽끼리만, 안쪽까지 본다', () => {
    const S = Setoid.lookup('maybe(number)');
    assertEquals(S.equals(J(1), J(1)), true);
    assertEquals(S.equals(J(1), J(2)), false);
    assertEquals(S.equals(N(), N()), true);
    assertEquals(S.equals(J(1), N()), false);
    assertEquals(S.equals(N(), J(1)), false);
});

test('Array: 길이와 원소를 본다', () => {
    const S = Setoid.lookup('array(number)');
    assertEquals(S.equals([], []), true);
    assertEquals(S.equals([1, 2], [1, 2]), true);
    assertEquals(S.equals([1, 2], [1, 3]), false);
    assertEquals(S.equals([1], [1, 2]), false);
});

test('Either: 자리마다 다른 비교법을 쓴다', () => {
    const S = Setoid.lookup('either(string,number)');
    assertEquals(S.equals(R(1), R(1)), true);
    assertEquals(S.equals(R(1), R(2)), false);
    assertEquals(S.equals(L('a'), L('a')), true);
    assertEquals(S.equals(L('a'), L('b')), false);
    assertEquals(S.equals(L('a'), R(1)), false);
    assertEquals(S.equals(R(1), L('a')), false);
});

test('중첩된 조립 키도 해석된다', () => {
    assertEquals(Setoid.lookup('maybe(array(number))').equals(J([1, 2]), J([1, 2])), true);
    assertEquals(Setoid.lookup('maybe(array(number))').equals(J([1, 2]), J([1, 3])), false);
    // 최상위 쉼표에서만 자르는지 — 안쪽 괄호의 쉼표에 속으면 여기서 깨진다
    const S = Setoid.lookup('either(maybe(number),array(string))');
    assertEquals(S.equals(L(J(1)), L(J(1))), true);
    assertEquals(S.equals(R(['a']), R(['a'])), true);
    assertEquals(S.equals(R(['a']), R(['b'])), false);
});

test('같은 키는 같은 인스턴스를 준다 (캐시)', () => {
    assertEquals(Setoid.lookup('maybe(number)') === Setoid.lookup('maybe(number)'), true);
    assertEquals(Setoid.lookup('either(string,number)') === Setoid.lookup('either(string,number)'), true);
});

test('법칙 — 반사·대칭·추이 (Maybe)', () => {
    const S = Setoid.lookup('maybe(number)');
    const xs = [N(), J(1), J(2)];
    for (const a of xs) assertEquals(S.equals(a, a), true, '반사성');
    for (const a of xs) for (const b of xs) assertEquals(S.equals(a, b), S.equals(b, a), '대칭성');
    for (const a of xs) for (const b of xs) for (const c of xs) {
        if (S.equals(a, b) && S.equals(b, c)) assertEquals(S.equals(a, c), true, '추이성');
    }
});

test('법칙 — 반사·대칭·추이 (Either)', () => {
    const S = Setoid.lookup('either(string,number)');
    const xs = [L('a'), L('b'), R(1), R(2)];
    for (const a of xs) assertEquals(S.equals(a, a), true, '반사성');
    for (const a of xs) for (const b of xs) assertEquals(S.equals(a, b), S.equals(b, a), '대칭성');
    for (const a of xs) for (const b of xs) for (const c of xs) {
        if (S.equals(a, b) && S.equals(b, c)) assertEquals(S.equals(a, c), true, '추이성');
    }
});

test('다른 타입을 넘기면 던진다', () => {
    let threw = false;
    try { Setoid.lookup('maybe(number)').equals(J(1), 1); } catch { threw = true; }
    assertEquals(threw, true, 'Maybe 아닌 것을 섞으면 거부한다');
});


logSection('Setoid — Struct (레코드는 즉석 모양이라 레지스트리 밖이다)');

test('입구는 팩토리뿐이다 — 문자열 키로는 못 꺼낸다', () => {
    // 레코드는 사용자마다 다른 즉석 모양이라 무한히 많다. 전역 레지스트리에 올리면
    // Algebra.all('object') 가 오염되므로 등록하지 않는다.
    let message = '(안 던짐)';
    try { Setoid.lookup('struct(age:number,name:string)'); } catch (e) { message = e.message; }
    assertEquals(message, 'Setoid.lookup: unsupported key struct(age:number,name:string)');
});

test('레지스트리와 Algebra.all 을 오염시키지 않는다', () => {
    Setoid.Struct({ probe: 'number' });
    assertEquals(Object.keys(Setoid.types).filter(k => k.startsWith('struct')).length, 0);
    assertEquals(Object.keys(fp.Algebra.all('object')).filter(k => /^struct/.test(k)).length, 0);
});

test('필드 순서가 달라도 같은 인스턴스다 (내부 정규화 캐시)', () => {
    assertEquals(Setoid.Struct({ name: 'string', age: 'number' })
        === Setoid.Struct({ age: 'number', name: 'string' }), true);
});

test('선언한 필드와 정확히 같아야 한다 — 초과도 부족도 거부', () => {
    const S = Setoid.Struct({ name: 'string', age: 'number' });
    assertEquals(S.equals({ name: 'A', age: 1 }, { name: 'A', age: 1 }), true);
    assertEquals(S.equals({ name: 'A', age: 1 }, { name: 'A', age: 1, x: 0 }), false, '초과 필드');
    assertEquals(S.equals({ name: 'A', age: 1 }, { name: 'A' }), false, '부족 필드');
    assertEquals(S.equals({ name: 'A', age: 1 }, { name: 'A', age: 2 }), false, '값이 다름');
});

test('중첩 — struct 안의 struct, struct 안의 array', () => {
    const N = Setoid.Struct({ name: 'string', address: Setoid.Struct({ city: 'string' }) });
    assertEquals(N.equals({ address: { city: 'Seoul' }, name: 'A' }, { address: { city: 'Seoul' }, name: 'A' }), true);
    assertEquals(N.equals({ address: { city: 'Seoul' }, name: 'A' }, { address: { city: 'Busan' }, name: 'A' }), false);
    const U = Setoid.Struct({ users: Setoid.Array(Setoid.Struct({ name: 'string' })) });
    assertEquals(U.equals({ users: [{ name: 'a' }] }, { users: [{ name: 'a' }] }), true);
    assertEquals(U.equals({ users: [{ name: 'a' }] }, { users: [{ name: 'b' }] }), false);
});

test('법칙 — 반사·대칭·추이 (Struct)', () => {
    const S = Setoid.Struct({ name: 'string', age: 'number' });
    const xs = [{ name: 'A', age: 1 }, { name: 'A', age: 2 }, { name: 'B', age: 1 }];
    for (const a of xs) assertEquals(S.equals(a, a), true, '반사성');
    for (const a of xs) for (const b of xs) assertEquals(S.equals(a, b), S.equals(b, a), '대칭성');
    for (const a of xs) for (const b of xs) for (const c of xs) {
        if (S.equals(a, b) && S.equals(b, c)) assertEquals(S.equals(a, c), true, '추이성');
    }
});

test('빈 필드와 잘못된 인자는 던진다', () => {
    let m1 = '(안 던짐)'; try { Setoid.Struct({}); } catch (e) { m1 = e.message; }
    assertEquals(m1, 'Setoid.Struct: fields must not be empty');
    let m2 = '(안 던짐)'; try { Setoid.Struct('name:string'); } catch (e) { m2 = e.message; }
    assertEquals(m2, 'Setoid.Struct: fields must be a plain object');
});

// 안쪽이 둘인 팩토리는 인스턴스 캐시(WeakMap)를 쓸 수 없다 — 무엇을 키로 삼을지 정할 수
// 없기 때문이다. 첫 인자만 키로 쓰면 오른쪽이 다른 둘이 같은 인스턴스로 합쳐진다.
test('Either.Setoid - 미등록 왼쪽이 같아도 오른쪽이 다르면 다른 인스턴스다', () => {
    const left = new fp.Setoid((a, b) => a === b, 'string');
    const withNumber = Either.Setoid(left, 'number');
    const withString = Either.Setoid(left, 'string');
    assertEquals(withNumber === withString, false, '오른쪽이 다른데 캐시가 합쳤다');
    assertEquals(withString.equals(Either.Right('a'), Either.Right('a')), true);
    assertEquals(withNumber.equals(Either.Right(1), Either.Right(1)), true);
});

// 안쪽 개수가 틀리면 조용히 통과하지 말고 던져야 한다 — 통과하면 undefined 가 키에 박혀
// 전역 레지스트리에 maybe(undefined) 같은 쓰레기가 남는다.
test('컨테이너 팩토리 - 안쪽 개수가 틀리면 던진다', () => {
    const cases = [
        [() => Maybe.Setoid(), 'Maybe.Setoid: expects 1 inner argument, got 0'],
        [() => Setoid.Array(), 'Setoid.Array: expects 1 inner argument, got 0'],
        [() => Either.Setoid(), 'Either.Setoid: expects 2 inner arguments, got 0'],
        [() => Either.Setoid('number'), 'Either.Setoid: expects 2 inner arguments, got 1'],
        [() => Maybe.Setoid('number', 'string'), 'Maybe.Setoid: expects 1 inner argument, got 2'],
    ];
    for (const [fn, expected] of cases) {
        let message = '(안 던짐)';
        try { fn(); } catch (e) { message = e.message; }
        assertEquals(message, expected);
    }
    const polluted = [...Object.keys(Setoid.types), ...Object.keys(fp.Semigroup.types)]
        .filter(k => k.includes('undefined'));
    assertEquals(polluted.join(','), '', '레지스트리에 undefined 키가 들어갔다');
});

console.log('\n✅ Setoid tests completed');
