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
import { test, logSection } from './utils.js';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const docsDir = join(rootDir, 'docs');
const indexUrl = pathToFileURL(join(rootDir, 'index.js')).href;

// Assign to globalThis rather than declaring consts: many examples start with their own
// `const { Maybe } = FunFP;`, which would collide with an injected `const Maybe`.
const PREAMBLE =
    `import FunFP from ${JSON.stringify(indexUrl)};\n` +
    'Object.assign(globalThis, FunFP); globalThis.FunFP = FunFP;\n';

// Captures the fence info string so `no-run` (and its reason) can be read.
const FENCE = /^```javascript([^\n]*)\n([\s\S]*?)^```/gm;

const parseFence = info => {
    const trimmed = info.trim();
    if (!trimmed.startsWith('no-run')) return { run: true };
    return { run: false, reason: trimmed.slice('no-run'.length).trim() };
};

const extract = source =>
    [...source.matchAll(FENCE)].map(([, info, code]) => ({ ...parseFence(info), code }));

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

// Docs still being repaired for block-independence. Their examples are executed and
// counted, but failures are reported as pending instead of failing the build — otherwise
// the gate would be red for the whole repair effort. This list only shrinks; when it hits
// zero, delete it. The count is printed on every run so it cannot quietly become permanent.
const PENDING = new Set([
    'Alt.md', 'Applicative.md', 'Bifunctor.md', 'ChainRec.md', 'Contravariant.md',
    'Either.md', 'Extend.md', 'Filterable.md', 'Free.md', 'Functor.md', 'Maybe.md',
    'Monad.md', 'Monoid.md', 'Profunctor.md', 'README.md', 'Reader.md', 'Semigroup.md',
    'Semigroupoid.md', 'Setoid.md', 'State.md', 'Task.md', 'Traversable.md',
    'Validation.md', 'Writer.md',
]);

logSection('Docs examples');

const docs = readdirSync(docsDir).filter(n => n.endsWith('.md')).sort();
let totalRun = 0;
let totalSkipped = 0;
let totalPending = 0;

for (const name of docs) {
    const blocks = extract(readFileSync(join(docsDir, name), 'utf8'));
    if (blocks.length === 0) continue;

    const runnable = blocks.filter(b => b.run);
    const skipped = blocks.filter(b => !b.run);
    totalRun += runnable.length;
    totalSkipped += skipped.length;

    console.log(`\ndocs/${name} — ${runnable.length} run, ${skipped.length} skipped`);

    // A bare `no-run` would let anyone silence a failing example without saying why.
    skipped.forEach((block, i) => {
        test(`docs/${name} no-run ${i + 1} has a reason`, () => {
            if (!block.reason) {
                throw new Error(
                    `\`\`\`javascript no-run 에 이유가 없다 — "no-run <이유>" 로 쓰라\n   at: ${firstLine(block.code)}`
                );
            }
        });
    });

    const pending = PENDING.has(name);
    let docPending = 0;

    runnable.forEach((block, i) => {
        const check = () => {
            const { status, signal, error, stderr } = runBlock(block.code);
            if (error) throw new Error(`could not start: ${error.message}`);
            if (signal) throw new Error(`killed by ${signal}`);
            if (status !== 0) {
                throw new Error(`exit ${status}\n   at: ${firstLine(block.code)}\n${stderr.trim()}`);
            }
        };
        if (!pending) {
            test(`docs/${name} example ${i + 1}`, check);
            return;
        }
        try {
            check();
        } catch (e) {
            docPending++;
            console.log(`⏳ [PENDING] docs/${name} example ${i + 1} — ${firstLine(block.code)}`);
        }
    });

    totalPending += docPending;
    if (pending && docPending === 0) {
        console.log(`   ↑ 이 문서는 이제 전부 통과한다 — PENDING 목록에서 빼라`);
    }
}

console.log(`\n총 ${totalRun}개 예제 실행, ${totalSkipped}개 스킵(no-run)`);
if (PENDING.size > 0) {
    console.log(
        `⏳ 수리 대기: 문서 ${PENDING.size}개 / 실패 ${totalPending}건 — ` +
        'tests/docs-examples.test.js 의 PENDING 을 비우는 것이 목표다'
    );
}

// A broken extractor would run zero examples and still report green.
if (totalRun === 0) {
    console.error('❌ [FAIL] 실행된 예제가 0개다 — 코드블록 추출을 확인하라');
    process.exitCode = 1;
}
