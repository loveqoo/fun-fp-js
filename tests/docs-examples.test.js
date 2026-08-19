// Runs the code examples in docs/ so documentation cannot drift from the code.
//
// Convention (also written up in CLAUDE.md):
//   ```javascript            -> executed
//   ```javascript no-run 이유  -> skipped; the reason is REQUIRED
//
// Every docs/*.md is checked — there is no registration list to forget. Each block runs
// in its own process with a preamble that puts the whole library in scope, so examples
// must be self-contained, which is also better for anyone reading from the middle of a page.
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { test, logSection, allMatches } from './utils.js';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const docsDir = join(rootDir, 'docs');
const indexUrl = pathToFileURL(join(rootDir, 'index.js')).href;

// Assign to globalThis rather than declaring consts: many examples start with their own
// `const { Maybe } = FunFP;`, which would collide with an injected `const Maybe`.
// `fp` 도 함께 둔다 — README 는 진짜 import 문(`import fp from 'fun-fp-js'`)을 보여줘야
// 하는데 그 줄은 아래에서 떼어내므로, 그 이름이 없으면 예제가 죽는다.
const PREAMBLE =
    `import FunFP from ${JSON.stringify(indexUrl)};\n` +
    'Object.assign(globalThis, FunFP); globalThis.FunFP = FunFP; globalThis.fp = FunFP;\n';

// Captures the fence info string so `no-run` (and its reason) can be read.
const FENCE = /^```javascript([^\n]*)\n([\s\S]*?)^```/gm;

const parseFence = info => {
    const trimmed = info.trim();
    if (!trimmed.startsWith('no-run')) return { run: true };
    return { run: false, reason: trimmed.slice('no-run'.length).trim() };
};

const extract = source =>
    allMatches(FENCE, source).map(([, info, code]) => ({ ...parseFence(info), code }));

// Many examples open with `import FunFP from 'fun-fp-js';` to show readers how to import.
// That line is useful in the docs but collides with the preamble's own import, so strip it
// rather than making the docs less instructive.
const IMPORT_LINE = /^\s*(?:import\s+[^;\n]*\s+from\s+|const\s+[^=\n]*=\s*require\s*\()\s*['"]fun-fp-js['"]\)?;?[ \t]*\n/gm;

const runBlock = code =>
    spawnSync(process.execPath, ['--input-type=module', '-e', PREAMBLE + code.replace(IMPORT_LINE, '')], {
        cwd: rootDir,
        encoding: 'utf8',
    });

const firstLine = code => code.trim().split('\n')[0];

// 예제의 `// 기대값` 주석을 실제 출력과 대조한다. 이것이 없던 동안 게이트는 **던지는 어긋남만**
// 잡았고, 값이 조용히 틀린 것은 초록으로 통과했다(실측 2026-08-19: internals 곱셈군·WriterT 둘).
// 기대값은 주석의 앞부분이고, 두 칸 이상 공백이나 ' — ' 뒤는 사람 읽을 설명으로 본다.
const expectedOf = line => {
    const m = /\/\/\s*(.+?)\s*$/.exec(line);
    if (!m) return null;
    const value = m[1].split(/\s{2,}|\s—\s/)[0].trim();
    return value === '' ? null : value;
};
// 표기 차이는 흡수한다 — 사람은 `[1, 2]` 로 쓰고 node 는 `[ 1, 2 ]` 로, JSON.stringify 는
// `[1,2]` 로 찍는다. 따옴표도 지운다: 여러 인자를 찍으면 node 는 문자열을 맨몸으로 내는데
// 문서는 `'값'` 으로 적는 편이다. **대가는 분명하다 — 이 게이트는 `'1'` 과 `1` 을 못 가른다.**
// 그 구분이 필요한 주장은 전용 테스트가 져야 한다.
const normalize = s => s.trim()
    .replace(/['"]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([[\]{},:])\s*/g, '$1');
// 주석이 붙은 console.log 의 기대값들이 **출력 안에 그 순서대로** 나타나야 한다(부분 수열).
// 한 줄씩 1:1 로 묶지 않는 이유는 `try { console.log(x) } catch (e) { console.log(e.message) }`
// 처럼 **호출 자리 둘이 출력 한 줄**을 내는 예제가 흔하기 때문이다 — 1:1 을 고집했더니 정작
// 검사하려던 블록이 통째로 대조 밖으로 빠졌다(2026-08-19 실측: 뮤테이션 셋이 전부 안 잡혔다).
// 대가: 주석이 엉뚱한 줄과 짝지어질 수 있다. 그래도 값이 바뀌면 짝이 사라져 빨강이 된다.
// 주석 줄 자체에 'console.log' 라는 글자가 있는 경우가 있다(설명문) — 코드 부분만 보고 센다.
// `//` 가 문자열 안에 있으면 그 줄을 놓치지만, 놓침은 초록이 아니라 대조 대상에서 빠지는 쪽이다.
const codePart = line => {
    const at = line.indexOf('//');
    return at === -1 ? line : line.slice(0, at);
};
const comparable = (code, stdout) => {
    const logs = code.split('\n').filter(l => codePart(l).indexOf('console.log') !== -1);
    if (logs.length === 0) { noLogs += 1; return null; }
    const expected = logs.map(expectedOf).filter(e => e !== null);
    if (expected.length === 0) return null;
    const out = stdout.split('\n').filter(l => l.trim() !== '');
    const pairs = [];
    let at = 0;
    for (const e of expected) {
        let hit = -1;
        for (let i = at; i < out.length; i += 1) {
            if (normalize(out[i]) === normalize(e)) { hit = i; break; }
        }
        pairs.push({ expected: e, actual: hit === -1 ? null : out[hit], rest: out.slice(at) });
        if (hit !== -1) at = hit + 1;
    }
    return pairs;
};

logSection('Docs examples');

// 루트 README 도 넣는다. **npm 패키지의 첫 화면**이라 여기가 낡으면 가장 먼저 눈에 띈다 —
// 그런데 한때 이 파일은 "# TODO" 한 줄이었고 아무도 몰랐다.
const enDir = join(docsDir, 'en');
// 영어판도 **실행하고 값까지 대조한다.** 번역이 코드 주석·문자열까지 영어로 옮기기로 하면서
// 두 문서의 코드가 더는 같지 않다 — 그러면 "정본과 글자가 같다"는 보증이 사라지므로,
// 그 자리를 "영어판도 스스로 돌고 제 값을 낸다"로 메운다(소유자 결정, 2026-08-19).
const docs = [
    { label: 'README.md', path: join(rootDir, 'README.md') },
    { label: 'README.en.md', path: join(rootDir, 'README.en.md') },
    ...readdirSync(docsDir).filter(n => n.endsWith('.md')).sort()
        .map(n => ({ label: `docs/${n}`, path: join(docsDir, n) })),
    ...(existsSync(enDir)
        ? readdirSync(enDir).filter(n => n.endsWith('.md')).sort()
            .map(n => ({ label: `docs/en/${n}`, path: join(enDir, n) }))
        : []),
];
let totalRun = 0;
let totalSkipped = 0;
let totalCompared = 0;
let totalUncompared = 0;
let noLogs = 0;

for (const { label: name, path } of docs) {
    const blocks = extract(readFileSync(path, 'utf8'));
    if (blocks.length === 0) continue;

    const runnable = blocks.filter(b => b.run);
    const skipped = blocks.filter(b => !b.run);
    totalRun += runnable.length;
    totalSkipped += skipped.length;

    console.log(`\n${name} — ${runnable.length} run, ${skipped.length} skipped`);

    // A bare `no-run` would let anyone silence a failing example without saying why.
    skipped.forEach((block, i) => {
        test(`${name} no-run ${i + 1} has a reason`, () => {
            if (!block.reason) {
                throw new Error(
                    `\`\`\`javascript no-run 에 이유가 없다 — "no-run <이유>" 로 쓰라\n   at: ${firstLine(block.code)}`
                );
            }
        });
    });

    runnable.forEach((block, i) => {
        test(`${name} example ${i + 1}`, () => {
            const { status, signal, error, stdout, stderr } = runBlock(block.code);
            if (error) throw new Error(`could not start: ${error.message}`);
            if (signal) throw new Error(`killed by ${signal}`);
            if (status !== 0) {
                throw new Error(`exit ${status}\n   at: ${firstLine(block.code)}\n${stderr.trim()}`);
            }
            const pairs = comparable(block.code, stdout);
            if (pairs === null) { totalUncompared += 1; return; }
            totalCompared += pairs.length;
            const wrong = pairs.filter(p => p.actual === null);
            if (wrong.length > 0) {
                throw new Error(
                    `문서의 기대값이 출력에 없다\n   at: ${firstLine(block.code)}\n` +
                    wrong.map(p => `   기대 [${p.expected}]  남은 출력 [${p.rest.join(' | ').trim()}]`).join('\n')
                );
            }
        });
    });
}

console.log(`\n총 ${totalRun}개 예제 실행, ${totalSkipped}개 스킵(no-run)`);
console.log(`출력 대조: ${totalCompared}줄 / 대조 밖 ${totalUncompared}블록 = 출력 없음 ${noLogs} + 기대값 주석 없음 ${totalUncompared - noLogs}`);

// A broken extractor would run zero examples and still report green.
if (totalRun === 0) {
    console.error('❌ [FAIL] 실행된 예제가 0개다 — 코드블록 추출을 확인하라');
    process.exitCode = 1;
}
