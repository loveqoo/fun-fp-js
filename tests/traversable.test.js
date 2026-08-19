// Traversable tests
import fp from '../index.js';
import { test, testAsync, assertEquals, assert, logSection } from './utils.js';

const { Traversable, Maybe, Either, Task, Applicative } = fp;

logSection('Traversable');

test('Traversable.types has ArrayTraversable', () => {
    assert(Traversable.types.ArrayTraversable, 'should have ArrayTraversable');
});

test('ArrayTraversable.traverse with Maybe - all Just', () => {
    const arr = [1, 2, 3];
    const result = Traversable.types.ArrayTraversable.traverse(
        Applicative.types.MaybeApplicative,
        x => Maybe.of(x * 2),
        arr
    );

    assert(Maybe.isJust(result), 'should be Just');
    assertEquals(result.value, [2, 4, 6]);
});

test('ArrayTraversable.traverse with Maybe - has Nothing', () => {
    const arr = [1, 2, 3];
    const result = Traversable.types.ArrayTraversable.traverse(
        Applicative.types.MaybeApplicative,
        x => x === 2 ? Maybe.Nothing() : Maybe.of(x * 2),
        arr
    );

    assert(Maybe.isNothing(result), 'should be Nothing when any element fails');
});

test('ArrayTraversable.traverse with Either - all Right', () => {
    const arr = [1, 2, 3];
    const result = Traversable.types.ArrayTraversable.traverse(
        Applicative.types.EitherApplicative,
        x => Either.Right(x * 2),
        arr
    );

    assert(Either.isRight(result), 'should be Right');
    assertEquals(result.value, [2, 4, 6]);
});

test('ArrayTraversable.traverse with Either - has Left', () => {
    const arr = [1, 2, 3];
    const result = Traversable.types.ArrayTraversable.traverse(
        Applicative.types.EitherApplicative,
        x => x === 2 ? Either.Left('error at 2') : Either.Right(x * 2),
        arr
    );

    assert(Either.isLeft(result), 'should be Left when any element fails');
    assertEquals(result.value, 'error at 2');
});

test('ArrayTraversable.traverse with Array applicative - no shared mutation', () => {
    const result = Traversable.types.ArrayTraversable.traverse(
        Applicative.types.ArrayApplicative,
        x => [x, x + 10],
        [1, 2]
    );

    assertEquals(result, [[1, 2], [1, 12], [11, 2], [11, 12]]);
});

test('ArrayTraversable.traverse with Array applicative - empty input', () => {
    const result = Traversable.types.ArrayTraversable.traverse(
        Applicative.types.ArrayApplicative,
        x => [x],
        []
    );

    assertEquals(result, [[]]);
});

testAsync('ArrayTraversable.traverse with Task', async () => {
    const arr = [1, 2, 3];
    const result = Traversable.types.ArrayTraversable.traverse(
        Applicative.types.TaskApplicative,
        x => Task.of(x * 2),
        arr
    );

    // Task uses fork instead of run
    const resolved = await new Promise((resolve, reject) => {
        result.fork(reject, resolve);
    });
    assertEquals(resolved, [2, 4, 6]);
});

logSection('Traversable Laws');

test('Identity: traverse(F, F.of, a) === F.of(a)', () => {
    const arr = [1, 2, 3];
    const { of } = Applicative.types.MaybeApplicative;

    const result = Traversable.types.ArrayTraversable.traverse(
        Applicative.types.MaybeApplicative,
        of,
        arr
    );

    assert(Maybe.isJust(result), 'should be Just');
    assertEquals(result.value, arr);
});

console.log('\n✅ Traversable tests completed\n');

// 6차 감사 [9] — 누적을 걸음마다 [...a, b] 로 펼쳐 원소 수의 제곱만큼 복사했다.
// 지금은 cons 로 잇고 끝에서 한 번만 편다. 시간 대신 **누적의 모양**을 잠근다 —
// 걸음마다 자라는 배열이 applicative 를 지나가면 그것이 곧 옛 구현이다.
// 7차 감사 [3] — 이 게이트가 Array 만 봐서, 같은 병이 남은 NonEmptyList 를 놓쳤다.
// **등록된 Traversable 을 전부 돈다** — 다음 인스턴스가 생겨도 같은 누락이 안 생기게.
const TRAVERSE_CASES = {
    array: { make: xs => xs, read: out => out },
    nonemptylist: {
        make: xs => new fp.NonEmptyList(xs[0], xs.slice(1)),
        read: out => out.toArray(),
    },
};

test('6차-9/7차-3: 누적이 자라는 배열로 applicative 를 지나가지 않는다 (등록된 컨테이너 전부)', () => {
    const { Functor, Apply } = fp;
    for (const key of ['array', 'nonemptylist']) {
        assert(TRAVERSE_CASES[key] !== undefined, `${key} 가 명단에 없다`);
        assert(Traversable.lookup(key) !== undefined, `${key} Traversable 이 등록돼 있지 않다`);
    }
    for (const key of Object.keys(TRAVERSE_CASES)) {
        const { make, read } = TRAVERSE_CASES[key];
        const seen = [];
        const box = v => ({ v, _typeName: 'TraverseProbe' });
        // map 의 둘째 인자가 누적이다 — 그 모양을 기록한다.
        const F = new Functor((f, x) => { seen.push(x.v); return box(f(x.v)); }, 'TraverseProbe');
        const A = new Apply(F, (ff, fx) => box(ff.v(fx.v)), 'TraverseProbe');
        const probe = new Applicative(A, box, 'TraverseProbe');

        const out = Traversable.lookup(key).traverse(probe, x => box(x * 2), make([1, 2, 3, 4]));
        assertEquals(read(out.v), [2, 4, 6, 8], `${key} 결과`);
        assert(seen.length > 0, `${key}: 관측기가 아무것도 못 봤다 — 게이트가 눈을 감았다`);
        assertEquals(seen.filter(v => Array.isArray(v)).length, 0, `${key} 가 자라는 배열을 흘렸다`);
    }
});
