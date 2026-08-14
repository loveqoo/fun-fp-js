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
import { readFileSync, readdirSync } from 'node:fs';
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

logSection('Docs examples');

// 루트 README 도 넣는다. **npm 패키지의 첫 화면**이라 여기가 낡으면 가장 먼저 눈에 띈다 —
// 그런데 한때 이 파일은 "# TODO" 한 줄이었고 아무도 몰랐다.
const docs = [
    { label: 'README.md', path: join(rootDir, 'README.md') },
    ...readdirSync(docsDir).filter(n => n.endsWith('.md')).sort()
        .map(n => ({ label: `docs/${n}`, path: join(docsDir, n) })),
];
let totalRun = 0;
let totalSkipped = 0;

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
            const { status, signal, error, stderr } = runBlock(block.code);
            if (error) throw new Error(`could not start: ${error.message}`);
            if (signal) throw new Error(`killed by ${signal}`);
            if (status !== 0) {
                throw new Error(`exit ${status}\n   at: ${firstLine(block.code)}\n${stderr.trim()}`);
            }
        });
    });
}

console.log(`\n총 ${totalRun}개 예제 실행, ${totalSkipped}개 스킵(no-run)`);

// A broken extractor would run zero examples and still report green.
if (totalRun === 0) {
    console.error('❌ [FAIL] 실행된 예제가 0개다 — 코드블록 추출을 확인하라');
    process.exitCode = 1;
}
