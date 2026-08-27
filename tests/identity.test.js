// Identity — 진짜 타입인가.
//
// 한때 Identity 는 `{ value, _typeName: 'Identity' }` 객체 리터럴이었다. 소유자 판정
// (2026-08-15): *"Object의 하위타입을 만들고 타입이름을 넣으면서 값싸게 해결하려고 한 것이
// 잘못된 겁니다."* 그래서 Maybe 와 같은 급으로 세웠다 — 클래스, 심볼, 공개 문.
//
// **이 파일이 보는 것은 타입의 정체이지 위조 차단이 아니다.** `types.of` 는 `_typeName`
// 문자열을 읽으므로 그 문자열을 베낀 객체는 타입 클래스 메서드를 통과한다. 그것을 막는
// 기제(`Symbols.TypeName`)를 만들었다가 소유자 결정으로 걷어냈다 — 합의되지 않은 구현이었다.
// 심볼을 보는 것은 `isIdentity` 뿐이다.
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
    assertEquals(id.map(x => x).constructor.name, 'Identity', 'map 결과도 Identity 다');
});

test('isIdentity 는 심볼을 본다 — 문자열은 못 속인다', () => {
    assert(Identity.isIdentity(Identity.of(1)), '진짜');
    assert(!Identity.isIdentity({ value: 1, _typeName: 'Identity' }), '문자열만 베낀 것');
    assert(!Identity.isIdentity(null), 'null');
    assert(!Identity.isIdentity(undefined), 'undefined');
    assert(!Identity.isIdentity(5), '원시값');
});

test('레지스트리의 아홉 인스턴스가 이 클래스의 값을 낸다', () => {
    const of = fp.Applicative.lookup('identity').of;
    assertEquals(of(1).constructor.name, 'Identity', 'Applicative.of');
    assertEquals(fp.Functor.lookup('identity').map(x => x, of(1)).constructor.name, 'Identity');
    assertEquals(fp.Apply.lookup('identity').ap(of(x => x + 1), of(1)).value, 2);
    assertEquals(fp.Extend.lookup('identity').extend(w => w.value, of(1)).constructor.name, 'Identity');
    assertEquals(fp.Comonad.lookup('identity').extract(of(7)), 7);
    assertEquals(fp.Chain.lookup('identity').chain(x => of(x + 1), of(1)).value, 2);
    assertEquals(fp.Monad.lookup('identity').chain(x => of(x * 2), fp.Monad.lookup('identity').of(3)).value, 6);
});

// optics 의 over 가 Identity 를 지난다 — 클래스로 바뀐 뒤에도 도는지 본다.
test('optics 가 그대로 돈다', () => {
    const { Optics } = fp;
    assertEquals(JSON.stringify(Optics.over(Optics.prop('a'), x => x * 10, { a: 3 })), '{"a":30}');
    assertEquals(Optics.view(Optics.prop('a'), { a: 3 }), 3);
});

console.log('\n✅ Identity tests completed\n');

// 승격의 존재 이유 — 실제 등록 identity 가 트랜스포머의 안쪽 모나드로 돈다(코덱스 7차 결함 2).
// 트랜스포머 테스트 4종은 파일 내부 가짜 Identity 를 쓰므로, 이 통합은 여기서만 지킨다.
test('트랜스포머의 안쪽 모나드로 identity 가 돈다', () => {
    const RT = fp.ReaderT('identity');
    const r = RT.runReaderT({ h: 'a' }, RT.asks(e => e.h).chain(h => RT.of(h + '!')));
    assertEquals(r.constructor.name, 'Identity');
    assertEquals(r.value, 'a!');
    const ST = fp.StateT('identity');
    const st = ST.runState(10, ST.get.chain(v => ST.put(v + 1).chain(() => ST.of(v))));
    assertEquals(JSON.stringify(st.value), '[10,11]');
    const ET = fp.EitherT('identity');
    const et = ET.runEitherT(ET.of(7).chain(x => ET.of(x * 2)));
    assertEquals(et.value.value, 14);
});
