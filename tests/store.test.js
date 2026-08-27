// Store Comonad Tests — State 의 쌍대. (조회: S -> A, 초점: S) 둘로 이뤄진다.
import fp from '../index.js';
import { test, assertEquals, assert, logSection } from './utils.js';

const { Store, Functor, Extend, Comonad } = fp;

logSection('Store Comonad');

// === 생성과 검증 ===
test('Store 는 조회 함수를 요구한다', () => {
    let threw = false;
    try { new Store('not a function', 0); } catch (e) { threw = true; }
    assertEquals(threw, true);
});

test('isStore 는 Store 만 참이다', () => {
    assertEquals(Store.isStore(new Store(x => x, 0)), true);
    assertEquals(Store.isStore({ _lookup: x => x, _index: 0 }), false);
    assertEquals(Store.isStore(null), false);
});

// === 문 여섯 ===
test('extract 는 초점 위치를 읽는다', () => {
    assertEquals(new Store(x => x * 10, 3).extract(), 30);
});

test('peek 는 초점을 옮기지 않고 다른 위치를 읽는다', () => {
    const w = new Store(x => x * 10, 3);
    assertEquals(w.peek(7), 70);
    assertEquals(w.index, 3);
});

test('seek 는 초점만 옮긴 새 Store 를 낸다 — 원본은 그대로', () => {
    const w = new Store(x => x * 10, 3);
    const moved = w.seek(5);
    assertEquals(moved.extract(), 50);
    assertEquals(w.index, 3);
});

test('experiment 는 지정한 위치들을 한 번에 읽는다', () => {
    const w = new Store(x => x * 10, 3);
    assertEquals(JSON.stringify(w.experiment(i => [i - 1, i, i + 1])), '[20,30,40]');
});

test('map 은 조회 뒤에 합성한다 — 초점 유지', () => {
    const w = new Store(x => x * 10, 3).map(n => n + 1);
    assertEquals(w.extract(), 31);
    assertEquals(w.peek(0), 1);
});

test('extend 는 국소 규칙을 모든 위치로 넓힌다', () => {
    // 규칙: 자기 값 + 오른쪽 이웃 값
    const w = new Store(x => x * 10, 3).extend(s => s.extract() + s.peek(s.index + 1));
    assertEquals(w.extract(), 70);   // 30 + 40
    assertEquals(w.peek(0), 10);     // 0 + 10
});

// === 레지스트리 ===
test('Functor/Extend/Comonad 에 store 키로 등록된다', () => {
    assertEquals(Functor.lookup('store').type, 'Store');
    assertEquals(Extend.lookup('store').type, 'Store');
    assertEquals(Comonad.lookup('store').type, 'Store');
    // 인스턴스 메서드와 레지스트리가 같은 몸이다
    const w = new Store(x => x + 1, 0);
    assertEquals(Comonad.lookup('store').extract(w), w.extract());
});

// === memo — 관측 동등 + 호출 횟수 감소 (뮤테이션 ④의 게이트) ===
test('Store.memo 는 관측을 바꾸지 않는다', () => {
    const w = new Store(x => x * 10, 3);
    const m = Store.memo(w, s => s);
    assertEquals(m.extract(), w.extract());
    assertEquals(m.index, w.index);
    for (const s of [0, 1, 2, 7]) assertEquals(m.peek(s), w.peek(s));
});

test('Store.memo 는 같은 위치의 재계산을 없앤다', () => {
    let calls = 0;
    const m = Store.memo(new Store(x => { calls += 1; return x * 2; }, 0), s => s);
    m.peek(5); m.peek(5); m.peek(5);
    assertEquals(calls, 1);
    m.peek(6);
    assertEquals(calls, 2);
});

test('Store.memo 는 Store 가 아니면 거부한다', () => {
    let msg = '';
    try { Store.memo({}, s => s); } catch (e) { msg = e.message; }
    assertEquals(msg, 'Store.memo: first argument must be a Store');
});

test('Store.memo 는 keyOf 없이는 거부한다 — 키 생성은 위임이다', () => {
    let msg = '';
    try { Store.memo(new Store(x => x, 0)); } catch (e) { msg = e.message; }
    assertEquals(msg, 'Argument must be a function: Store.memo');
});

// 코덱스 6차 후속 재현(2026-08-27): 기본 JSON.stringify 는 NaN/null 을 "null" 하나로 합쳐
// 조회 순서에 따라 값이 달라졌다. 기본값을 없애고 위임한 뒤, 항등 keyOf 는 Map 이 가른다.
test('항등 keyOf 는 NaN 과 null 위치를 가른다 — 순서 무관', () => {
    const w = new Store(s => (Number.isNaN(s) ? 'nan' : String(s)), 0);
    const first = Store.memo(w, s => s);
    assertEquals(first.peek(NaN), 'nan');
    assertEquals(first.peek(null), 'null');
    const second = Store.memo(w, s => s);
    assertEquals(second.peek(null), 'null');
    assertEquals(second.peek(NaN), 'nan');
});

// 코덱스 재리뷰(2026-08-27)의 잔여 지적: Map 은 SameValueZero 라 +0/-0 이 같은 키다.
// 이것은 결함이 아니라 위임의 경계다 — 문서가 그 경계를 적고, 이 표본이 현행 동작을 고정한다.
test('항등 keyOf 에서 +0 과 -0 은 같은 키다 — 가르려면 keyOf 가 갈라야 한다', () => {
    const w = new Store(s => (Object.is(s, -0) ? 'neg' : 'pos'), 1);
    const merged = Store.memo(w, s => s);
    assertEquals(merged.peek(-0), 'neg');
    assertEquals(merged.peek(0), 'neg');   // 항등 키: 먼저 읽은 -0 의 값을 받는다
    const split = Store.memo(w, s => (Object.is(s, -0) ? '-0' : s));
    assertEquals(split.peek(-0), 'neg');
    assertEquals(split.peek(0), 'pos');    // 키를 가르면 각자 제 값
});

// === 라이프 게임 한 걸음 — 국소 규칙(conway)이 extend 한 번으로 판 전체가 된다 ===
test('글라이더가 한 세대 이동한다', () => {
    const W = 5, H = 5;
    const key = ([x, y]) => `${x},${y}`;
    const wrap = n => ((n % W) + W) % W;
    const neighbours = ([x, y]) => {
        const out = [];
        for (const dx of [-1, 0, 1]) for (const dy of [-1, 0, 1])
            if (dx || dy) out.push([wrap(x + dx), wrap(y + dy)]);
        return out;
    };
    const conway = grid => {
        const alive = grid.experiment(neighbours).filter(Boolean).length;
        return grid.extract() ? (alive === 2 || alive === 3) : alive === 3;
    };
    const glider = new Set([[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]].map(key));
    const board = new Store(pos => glider.has(key(pos)), [0, 0]);
    const next = Store.memo(board.extend(conway), key);
    const show = grid => {
        const rows = [];
        for (let y = 0; y < H; y += 1) {
            let row = '';
            for (let x = 0; x < W; x += 1) row += grid.peek([x, y]) ? '#' : '.';
            rows.push(row);
        }
        return rows.join('|');
    };
    assertEquals(show(board), '.#...|..#..|###..|.....|.....');
    assertEquals(show(next), '.....|#.#..|.##..|.#...|.....');
});
