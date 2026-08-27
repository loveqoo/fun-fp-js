// 포장 횟수 게이트 — 상속 생성자가 부모의 이미 포장된 메서드를 재포장하지 않는다.
//
// 병력: Chain.ap 2배, ChainRec.ap 3배, Comonad.map 3배 등 일곱 자리가 이중·삼중으로
// 검사를 돌았다(코덱스 8차 발견 → 전수 실측, 2026-08-28). 해독제는 unwrapIfSameType 인데
// Apply·Applicative·Monad 만 쓰고 다섯 생성자(Chain·ChainRec·Extend·Comonad·Traversable)가
// 빠져 있었다. 이 표는 "검사 1회 = _typeName 읽기 2회" 를 전 경로에 고정한다 —
// unwrapIfSameType 호출을 하나 지우면 그 행이 4 이상으로 튀어 빨강이 된다.
import fp from '../index.js';
import { test, assertEquals, logSection } from './utils.js';

logSection('Wrap count');

const mk = { maybe: () => fp.Maybe.Just(1), identity: () => fp.Identity.of(1) };
const count = (key, run) => {
    let reads = 0;
    const spy = new Proxy(mk[key](), { get(o, k) { if (k === '_typeName') reads += 1; return o[k]; } });
    run(spy);
    return reads;
};

const f = x => fp.Maybe.Just(x + 1);
const fnJ = fp.Maybe.Just(x => x);

// [라벨, 캐리어, 실행] — 기대값은 전부 2 (입구 검사 1 + chain 이면 반환 검사 1 이 아니라,
// types.check 한 번이 _typeName 을 2회 읽는 현행 구현의 상수다. 상수가 바뀌면 전 행이
// 같이 움직이므로 "행마다 같은가" 가 아니라 "2배·3배로 튀는 행이 없는가" 를 본다.)
const ROWS = [
    ['Functor.map', 'maybe', s => fp.Functor.lookup('maybe').map(x => x, s)],
    ['Apply.ap', 'maybe', s => fp.Apply.lookup('maybe').ap(fnJ, s)],
    ['Applicative.ap', 'maybe', s => fp.Applicative.lookup('maybe').ap(fnJ, s)],
    ['Alt.alt', 'maybe', s => fp.Alt.lookup('maybe').alt(s, fp.Maybe.Just(2))],
    ['Chain.ap', 'maybe', s => fp.Chain.lookup('maybe').ap(fnJ, s)],
    ['Chain.chain', 'maybe', s => fp.Chain.lookup('maybe').chain(f, s)],
    ['ChainRec.ap', 'maybe', s => fp.ChainRec.lookup('maybe').ap(fnJ, s)],
    ['ChainRec.chain', 'maybe', s => fp.ChainRec.lookup('maybe').chain(f, s)],
    ['Monad.ap', 'maybe', s => fp.Monad.lookup('maybe').ap(fnJ, s)],
    ['Monad.chain', 'maybe', s => fp.Monad.lookup('maybe').chain(f, s)],
    ['Extend.map', 'identity', s => fp.Extend.lookup('identity').map(x => x, s)],
    ['Extend.extend', 'identity', s => fp.Extend.lookup('identity').extend(w => 1, s)],
    ['Comonad.map', 'identity', s => fp.Comonad.lookup('identity').map(x => x, s)],
    ['Comonad.extend', 'identity', s => fp.Comonad.lookup('identity').extend(w => 1, s)],
    ['Comonad.extract', 'identity', s => fp.Comonad.lookup('identity').extract(s)],
    ['Traversable.map', 'maybe', s => fp.Traversable.lookup('maybe').map(x => x, s)],
];

test('전 경로의 검사가 1회다 — 재포장된 자리가 없다', () => {
    const bad = [];
    for (const [label, key, run] of ROWS) {
        const n = count(key, run);
        if (n !== 2) bad.push(`${label}: ${n} (기대 2)`);
    }
    assertEquals(bad.join(' | '), '', '재포장으로 검사가 불어난 자리');
});
