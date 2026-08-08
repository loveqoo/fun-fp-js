// Runs the code examples in docs/ so documentation cannot drift from the code.
//
// Convention (also written up in CLAUDE.md):
//   ```javascript          -> executed
//   ```javascript no-run   -> skipped, but counted and reported
//
// Each block runs in its own process with `import FunFP from '<index.js>'` prepended,
// so examples must be self-contained — which makes them better examples anyway.
//
// Scope: only the docs listed in TARGETS. The older 30 docs use a `FunFP` global that
// is never imported plus undefined helpers (fetchUser, ...), so they are not runnable
// as written and are out of scope here.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { test, logSection } from './utils.js';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const indexUrl = pathToFileURL(join(rootDir, 'index.js')).href;
const PREAMBLE = `import FunFP from ${JSON.stringify(indexUrl)};\n`;

const TARGETS = [
    'Lens.md',
    'Transducer.md',
    'Actor.md',
    'StateT.md',
    'EitherT.md',
    'ReaderT.md',
    'WriterT.md',
];

// Captures the fence info string so `no-run` can opt a block out.
const FENCE = /^```javascript([^\n]*)\n([\s\S]*?)^```/gm;

const extract = source => {
    const blocks = [];
    for (const [, info, code] of source.matchAll(FENCE)) {
        blocks.push({ code, run: !info.split(/\s+/).includes('no-run') });
    }
    return blocks;
};

const runBlock = code =>
    spawnSync(process.execPath, ['--input-type=module', '-e', PREAMBLE + code], {
        cwd: rootDir,
        encoding: 'utf8',
    });

logSection('Docs examples');

let totalRun = 0;
let totalSkipped = 0;
const missing = [];

for (const name of TARGETS) {
    const path = join(rootDir, 'docs', name);
    if (!existsSync(path)) {
        // Not an error yet — docs land across several rounds. But never silently.
        missing.push(name);
        continue;
    }

    const blocks = extract(readFileSync(path, 'utf8'));
    const runnable = blocks.filter(b => b.run);
    const skipped = blocks.length - runnable.length;
    totalRun += runnable.length;
    totalSkipped += skipped;

    console.log(`\ndocs/${name} — ${runnable.length} run, ${skipped} skipped`);

    runnable.forEach((block, i) => {
        test(`docs/${name} example ${i + 1}`, () => {
            const { status, signal, error, stderr } = runBlock(block.code);
            if (error) throw new Error(`could not start: ${error.message}`);
            if (signal) throw new Error(`killed by ${signal}`);
            if (status !== 0) {
                const firstLine = block.code.trim().split('\n')[0];
                throw new Error(`exit ${status}\n   at: ${firstLine}\n${stderr.trim()}`);
            }
        });
    });
}

console.log(`\n총 ${totalRun}개 예제 실행, ${totalSkipped}개 스킵(no-run)`);
if (missing.length > 0) console.log(`아직 없는 문서: ${missing.join(', ')}`);

// An allowlist typo would silently run zero examples and still report green.
if (totalRun === 0) {
    console.error('❌ [FAIL] 실행된 예제가 0개다 — TARGETS 목록이나 코드블록 추출을 확인하라');
    process.exitCode = 1;
}
