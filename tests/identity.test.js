// Identity — 진짜 타입인가, 그리고 이름을 문자열로 참칭할 수 있는가.
//
// 한때 Identity 는 `{ value, _typeName: 'Identity' }` 객체 리터럴이었다. 그러면 이름은
// **베끼면 된다.** 소유자 판정(2026-08-15): *"Object의 하위타입을 만들고 타입이름을
// 넣으면서 값싸게 해결하려고 한 것이 잘못된 겁니다."*
//
// 이 저장소의 설계는 **타입은 심볼로 정의하고 값은 문자열로 넣는다** 이다. `_typeName` 의
// 직무는 합타입 수렴(Just·Nothing 이 둘 다 'Maybe')이지 타입 선언이 아니다. 그래서
// `types.of` 는 **심볼만** 본다 — `_typeName` 은 눈에 보이라고 남긴 필드다.
import fp from '../index.js';
import { test, assertEquals, assert, logSection } from './utils.js';

const { Identity } = fp;

logSection('Identity — 진짜 타입인가');

test('클래스다 — 평범한 객체가 아니다', () => {
    const id = Identity.of(5);
    assertEquals(id.constructor.name, 'Identity', '객체 리터럴이면 Object 가 나온다');
    assert(id instanceof Identity, 'instanceof 가 성립한다');
    assertEquals(id.value, 5);
    assertEquals(id._typeName, 'Identity');
});

test('인스턴스 메서드가 레지스트리를 지난다', () => {
    const id = Identity.of(5);
    assertEquals(id.map(x => x * 2).value, 10);
    assertEquals(id.extract(), 5);
    assertEquals(id.extend(w => w.value + 1).value, 6);
    assert(id.map(x => x).constructor.name === 'Identity', 'map 결과도 Identity 다');
});

test('isIdentity 는 심볼을 본다 — 문자열은 못 속인다', () => {
    assert(Identity.isIdentity(Identity.of(1)), '진짜');
    assert(!Identity.isIdentity({ value: 1, _typeName: 'Identity' }), '베낀 것');
    assert(!Identity.isIdentity(null), 'null');
    assert(!Identity.isIdentity(undefined), 'undefined');
    assert(!Identity.isIdentity(5), '원시값');
});

logSection('이름 참칭 — 아홉 타입 전부');

// `_typeName` 만 베낀 평범한 객체가 타입 클래스 메서드를 통과하던 자리다.
// 표에 있는 이름은 심볼이 없으면 실제 JS 모양('Object')으로 답한다.
const FORGEABLE = [
    ['Identity', fp.Identity.of(1), i => fp.Functor.lookup('identity').map(x => x, i)],
    ['Maybe', fp.Maybe.Just(1), m => fp.Functor.lookup('maybe').map(x => x, m)],
    ['Either', fp.Either.Right(1), e => fp.Functor.lookup('either').map(x => x, e)],
    ['Task', fp.Task.of(1), t => fp.Functor.lookup('task').map(x => x, t)],
    ['Validation', fp.Validation.Valid(1), v => fp.Functor.lookup('validation').map(x => x, v)],
    ['Free', fp.Free.of(1), f => fp.Functor.lookup('free').map(x => x, f)],
    ['Reader', fp.Reader.of(1), r => fp.Functor.lookup('reader').map(x => x, r)],
    ['Writer', fp.Writer.of(1), w => fp.Functor.lookup('writer').map(x => x, w)],
    ['State', fp.State.of(1), s => fp.Functor.lookup('state').map(x => x, s)]
];

test('진짜는 통과한다 — 아홉 전부', () => {
    const broken = FORGEABLE.filter(([name, real, use]) => {
        try { use(real); return false; } catch (e) { return true; }
    }).map(([name]) => name);
    assertEquals(broken.join(', '), '', '진짜인데 거부당했다');
});

test('이름만 베낀 것은 거부한다 — 아홉 전부', () => {
    const passed = FORGEABLE.filter(([name, , use]) => {
        try { use({ value: 1, _typeName: name }); return true; } catch (e) { return false; }
    }).map(([name]) => name);
    assertEquals(passed.join(', '), '', '베낀 이름이 통과했다');
});

// 매개변수화된 셋은 클래스가 아니지만 캐리어가 심볼을 지닌다 — 이름만 베끼면 안 통한다.
test('매개변수화된 타입도 막는다 — Const · Forget · StateT', () => {
    fp.Applicative.Const('array'); fp.Wander.Forget('array');
    fp.StateT('maybe'); fp.EitherT('task'); fp.ReaderT('maybe');
    fp.WriterT('maybe', fp.Monoid.lookup('array'));
    const forged = [
        ['Const(array)', () => fp.Apply.lookup('const(array)')
            .ap({ value: [1], _typeName: 'Const(array)' }, { value: [2], _typeName: 'Const(array)' })],
        ['Forget(array)', () => fp.Strong.lookup('forget(array)')
            .first({ run: a => [a], _typeName: 'Forget(array)' })],
        // 트랜스포머는 **넷 다** 본다. 하나만 보면 나머지 셋에서 심볼이 빠져도 초록이다(실측).
        ['StateT(Maybe)', () => fp.Functor.lookup('statet(maybe)')
            .map(x => x, { _program: null, _typeName: 'StateT(Maybe)' })],
        ['EitherT(Task)', () => fp.Functor.lookup('eithert(task)')
            .map(x => x, { _program: null, _typeName: 'EitherT(Task)' })],
        ['ReaderT(Maybe)', () => fp.Functor.lookup('readert(maybe)')
            .map(x => x, { _program: null, _typeName: 'ReaderT(Maybe)' })],
        ['WriterT(Maybe,Array)', () => fp.Functor.lookup('writert(maybe,array)')
            .map(x => x, { _program: null, _typeName: 'WriterT(Maybe,Array)' })]
    ];
    const passed = forged.filter(([, use]) => {
        try { use(); return true; } catch (e) { return false; }
    }).map(([name]) => name);
    assertEquals(passed.join(', '), '', '베낀 이름이 통과했다');
});

test('진짜 매개변수화 캐리어는 통과한다', () => {
    const C = fp.Applicative.Const('array');
    assertEquals(C.ap(C.wrap([1]), C.wrap([2])).value.join(','), '1,2');
    assertEquals(C.wrap([1])._typeName, 'Const(array)', '_typeName 은 눈에 보인다');
    assertEquals(fp.StateT('maybe').of(1).run(0).value.join(','), '1,0');
    // 진짜 값도 넷 다 — 심볼을 떼면 여기가 먼저 깨진다.
    const real = [
        ['statet(maybe)', fp.StateT('maybe').of(1)],
        ['eithert(task)', fp.EitherT('task').of(1)],
        ['readert(maybe)', fp.ReaderT('maybe').of(1)],
        ['writert(maybe,array)', fp.WriterT('maybe', fp.Monoid.lookup('array')).of(1)]
    ];
    const broken = real.filter(([key, value]) => {
        try { fp.Functor.lookup(key).map(x => x, value); return false; } catch (e) { return true; }
    }).map(([key]) => key);
    assertEquals(broken.join(', '), '', '진짜 트랜스포머 값이 거부당했다');
});

// _typeName 은 남아 있지만 권위가 아니다. 둘이 어긋나면 심볼이 이긴다.
test('_typeName 은 보이는 필드일 뿐 — 심볼이 이긴다', () => {
    const id = Identity.of(1);
    Object.defineProperty(id, '_typeName', { value: 'Maybe', configurable: true });
    assertEquals(id._typeName, 'Maybe', '문자열은 바뀌었다');
    // 그래도 Identity 로 취급된다 — 심볼이 말하기 때문이다.
    assertEquals(fp.Functor.lookup('identity').map(x => x + 1, id).value, 2);
    let message = '(안 던짐)';
    try { fp.Functor.lookup('maybe').map(x => x, id); } catch (e) { message = e.message; }
    assertEquals(message, 'Functor.map: arguments must be (function, Maybe)');
});

console.log('\n✅ Identity tests completed\n');
