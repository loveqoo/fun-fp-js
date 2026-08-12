// 커밋된 버전(기본 HEAD)과 현재 작업 트리를 같은 입력으로 대조한다.
//
// 왜 있는가: 두 회차 연속으로 "내부 교체라 동작이 같다" 를 검증 기준으로 삼았는데 둘 다
// 틀렸고, 두 번 다 `npm test` 는 초록이었다. 바뀐 경로에 테스트가 없으면 초록이 아무것도
// 증명하지 않는다. 이 헬퍼는 테스트 유무와 무관하게 **관측 가능한 동작의 차이**를 뽑는다.
//
//   회차 1: view(prism, 매치실패)  undefined -> TypeError   (테스트 0건이라 안 걸림)
//   회차 2: preview(traversed, [1,'a'])  Just(1) -> TypeError (테스트 0건이라 안 걸림)
//
// 차이가 곧 실패는 아니다 — 의도한 변경일 수 있다. 그래서 이것은 게이트가 아니라 보고서다.
// 판정은 사람이 한다: 나온 차이가 계획에 적혀 있는가?
//
// 사용법:
//   import { diffCases } from './baseline.js';
//   await diffCases([
//       ['preview 이종 대상', fp => fp.preview(fp.traversed('array'), [1, 'a'])],
//       ['view 빈 배열',      fp => fp.view(fp.traversed('array'), [])],
//   ]);
//
// index.js 는 외부 import 가 없는 단일 파일이라 임시 복사본을 그대로 로드할 수 있다.
// 확장자를 .mjs 로 두는 이유는 임시 디렉토리가 package.json 의 "type": "module" 밖에 있기
// 때문이다.
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const loadBaseline = async (ref = 'HEAD', file = 'index.js') => {
    const src = execFileSync('git', ['show', `${ref}:${file}`], {
        cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
    });
    const dir = mkdtempSync(join(tmpdir(), 'funfp-baseline-'));
    const path = join(dir, 'index.mjs');
    writeFileSync(path, src);
    const mod = (await import(pathToFileURL(path).href)).default;
    rmSync(dir, { recursive: true, force: true });   // 평가가 끝났으므로 파일은 필요 없다
    return mod;
};

export const loadCurrent = async () =>
    (await import(pathToFileURL(join(repoRoot, 'index.js')).href)).default;

// 값이든 예외든 같은 모양의 문자열로 만든다 — 대조는 문자열끼리 한다.
const observe = run => {
    let v;
    try { v = run(); }
    catch (e) { return `THROW ${e.constructor.name}: ${e.message}`; }
    return render(v);
};

// 구조를 재귀로 걸어 표기한다. JSON.stringify 에 넘기면 안 되는 이유:
// Nothing 과 Just(undefined) 가 둘 다 {"_typeName":"Maybe"} 로, Left(2) 와 Right(2) 가
// 둘 다 {"value":2,"_typeName":"Either"} 로 붕괴한다 — 이 라이브러리의 핵심 구분이
// 정확히 그 사각지대다. 차이를 숨기는 대조 도구는 없는 것보다 나쁘다.
// NaN/-0/undefined 도 JSON 에서는 전부 null 이 되므로 직접 쓴다.
const render = (v, seen = new WeakSet()) => {
    if (v === undefined) return 'undefined';
    if (v === null) return 'null';
    switch (typeof v) {
        case 'number': return Object.is(v, -0) ? '-0' : String(v);   // NaN 도 'NaN' 으로
        case 'string': return JSON.stringify(v);
        case 'boolean': return String(v);
        case 'bigint': return `${v}n`;
        case 'symbol': return v.toString();
        case 'function': return `[Function ${v.name || 'anonymous'}]`;
    }
    if (seen.has(v)) return '[Circular]';
    seen.add(v);
    try {
        // isNothing/isLeft 는 이 라이브러리 컨테이너의 표식이다. 중첩에서도 잡아야 한다.
        if (typeof v.isNothing === 'function') return v.isNothing() ? 'Nothing' : `Just(${render(v.value, seen)})`;
        if (typeof v.isLeft === 'function') return v.isLeft() ? `Left(${render(v.value, seen)})` : `Right(${render(v.value, seen)})`;
        if (Array.isArray(v)) return `[${v.map(x => render(x, seen)).join(', ')}]`;
        if (v instanceof Map) return `Map{${[...v].map(([k, x]) => `${render(k, seen)} => ${render(x, seen)}`).join(', ')}}`;
        if (v instanceof Set) return `Set{${[...v].map(x => render(x, seen)).join(', ')}}`;
        if (v instanceof Date) return `Date(${Number.isNaN(v.getTime()) ? 'Invalid' : v.toISOString()})`;
        if (v instanceof RegExp) return String(v);
        // 생성자 이름을 붙인다 — 같은 필드를 가진 다른 클래스를 구분하기 위해.
        const tag = v.constructor && v.constructor.name !== 'Object' ? v.constructor.name : '';
        return `${tag}{${Object.keys(v).map(k => `${k}: ${render(v[k], seen)}`).join(', ')}}`;
    } finally { seen.delete(v); }   // 형제가 같은 객체를 공유하는 것은 순환이 아니다
};

// cases: [label, fp => any][]  —  fp 는 라이브러리 export 객체
// 반환: { total, changed, rows } — rows[i] = { label, before, after, changed }
export const diffCases = async (cases, { ref = 'HEAD', quiet = false } = {}) => {
    const [base, cur] = await Promise.all([loadBaseline(ref), loadCurrent()]);
    const rows = cases.map(([label, run]) => {
        const before = observe(() => run(base));
        const after = observe(() => run(cur));
        return { label, before, after, changed: before !== after };
    });
    const changed = rows.filter(r => r.changed);
    if (!quiet) {
        console.log(`\n=== ${ref} 대비 동작 차이 (${changed.length}/${rows.length}) ===\n`);
        const w = Math.max(...rows.map(r => r.label.length));
        for (const r of rows) {
            console.log(`${r.changed ? '≠' : ' '} ${r.label.padEnd(w)}  ${r.before}${r.changed ? `  ->  ${r.after}` : ''}`);
        }
        console.log(changed.length
            ? `\n차이 ${changed.length}건. 계획서에 적혀 있는 변경인지 대조하라 — 없으면 회귀다.`
            : '\n차이 없음.');
    }
    return { total: rows.length, changed: changed.length, rows };
};
