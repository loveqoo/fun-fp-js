// isX 서술어 열 개의 공통 경계를 한 표로 고정한다.
//
// 열 서술어는 공용 몸 하나(hasSymbol, index.js)를 쓴다 — 한 곳의 회귀가 열 곳을 동시에
// 뚫는다. 타입별 위조 테스트는 흩어져 있어 경계(상속 심볼·심볼값 1·던지는 getter)가
// 게이트 밖이었다(코덱스 4차 리뷰의 잔여 지적, 2026-08-27). 이 표가 그 자리를 잠근다.
import fp from '../index.js';
import { test, assertEquals, logSection } from './utils.js';

logSection('isX predicates');

const CASES = [
    ['Identity', fp.Identity.isIdentity, fp.Identity.of(1)],
    ['Maybe', fp.Maybe.isMaybe, fp.Maybe.Just(1)],
    ['Either', fp.Either.isEither, fp.Either.Right(1)],
    ['Task', fp.Task.isTask, fp.Task.of(1)],
    ['Validation', fp.Validation.isValidation, fp.Validation.Valid(1)],
    ['NonEmptyList', fp.NonEmptyList.isNonEmptyList, fp.NonEmptyList.of(1)],
    ['Reader', fp.Reader.isReader, fp.Reader.of(1)],
    ['Writer', fp.Writer.isWriter, fp.Writer.of(1)],
    ['State', fp.State.isState, fp.State.of(1)],
    ['Store', fp.Store.isStore, new fp.Store(x => x, 0)],
];
const symbolOf = name => Symbol.for(`fun-fp-js/${name}`);

for (const [name, isX, real] of CASES) {
    test(`is${name} — 경계 표`, () => {
        assertEquals(isX(real), true, '진짜 인스턴스');
        assertEquals(isX(null), false, 'null');
        assertEquals(isX(undefined), false, 'undefined');
        assertEquals(isX(1), false, '원시값');
        assertEquals(isX({ _typeName: name }), false, '문자열만 베낀 것');
        // 심볼값이 true 가 아니면 거부한다 — 공용 몸을 Boolean(x[sym]) 으로 바꾸는 회귀가 여기 걸린다
        assertEquals(isX({ [symbolOf(name)]: 1 }), false, '심볼값 1');
        assertEquals(isX({ [symbolOf(name)]: false }), false, '심볼값 false');
        // 상속 심볼은 인정한다 — 프로토타입에 심볼을 두는 현 구조가 그 위에 서 있다
        assertEquals(isX(Object.create(real)), true, '상속 심볼');
        // Symbol.for 전역 명부의 성질상, 심볼을 직접 단 외부 객체는 통과한다 — 문서화된 현행 동작
        assertEquals(isX({ [symbolOf(name)]: true }), true, '심볼을 단 외부 객체');
        // 던지는 getter — 예외는 삼키지 않고 그대로 전파한다. 공용 몸을 try/catch 로 감싸
        // false 를 내는 회귀가 여기 걸린다(코덱스 6차가 그 변이로 표 전체 초록을 실증했다).
        const 던지는 = {};
        Object.defineProperty(던지는, symbolOf(name), { get() { throw new Error('boom:' + name); } });
        let thrown = '';
        try { isX(던지는); } catch (e) { thrown = e.message; }
        assertEquals(thrown, 'boom:' + name, '던지는 getter 의 예외가 전파된다');
    });
}

// 다른 타입의 진짜 인스턴스는 전부 거부한다 — 심볼이 타입마다 다르다는 사실의 고정
test('교차 판정 — 열 서술어가 서로의 인스턴스를 거부한다', () => {
    const wrong = [];
    for (const [name, isX] of CASES) {
        for (const [other, , inst] of CASES) {
            if (name !== other && isX(inst)) wrong.push(`is${name}(${other})`);
        }
    }
    assertEquals(wrong.join(', '), '', '참으로 판정된 교차 입력');
});

// Free 는 이 무리의 예외다 — Free 심볼 하나가 아니라 Pure/Impure 심볼의 합성으로 판별한다.
// Free 심볼만 단 가짜가 hasSymbol(Symbols.Free) 이면 true 였겠지만 실제 isFree 는 false
// (코덱스 4차 반례의 고정 — 이 예외를 hasSymbol 로 '통일'하는 회귀가 여기 걸린다).
test('Free.isFree 는 hasSymbol 무리가 아니다 — Free 심볼만 단 가짜를 거부한다', () => {
    const fake = { [Symbol.for('fun-fp-js/Free')]: true };
    assertEquals(fake[Symbol.for('fun-fp-js/Free')], true, '가짜가 Free 심볼을 달고 있다');
    assertEquals(fp.Free.isFree(fake), false, '그래도 isFree 는 거부한다');
    assertEquals(fp.Free.isFree(fp.Free.of(1)), true, '진짜는 인정한다');
});
