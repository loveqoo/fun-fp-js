// Test runner — single entry point for `npm test`.
//
// Runs every tests/*.test.js in its own child process, then type-checks the
// declarations in types/. Exits non-zero if anything fails.
//
// Why separate processes: several test files toggle global library state via
// fp.setStrictMode(). Importing them all into one process would let that state
// leak between files.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const testsDir = dirname(fileURLToPath(import.meta.url));
const rootDir = dirname(testsDir);
const tsc = join(rootDir, 'node_modules', 'typescript', 'bin', 'tsc');

// Describes how a child process ended, for the failure summary.
const outcome = ({ status, signal, error }) => {
    if (error) return `could not start: ${error.message}`;
    if (signal) return `killed by ${signal}`;
    return `exit ${status}`;
};

const failed = ({ status, signal, error }) => Boolean(error) || signal !== null || status !== 0;

const run = (script, args = []) =>
    spawnSync(process.execPath, [script, ...args], { cwd: rootDir, stdio: 'inherit' });

const testFiles = readdirSync(testsDir)
    .filter(name => name.endsWith('.test.js'))
    .sort();

const failures = [];

for (const name of testFiles) {
    const path = join(testsDir, name);
    console.log(`\n=== ${relative(rootDir, path)} ===`);
    const result = run(path);
    if (failed(result)) failures.push({ label: relative(rootDir, path), result });
}

console.log('\n=== typecheck (tsc --noEmit) ===');
let typecheck;
if (existsSync(tsc)) {
    typecheck = run(tsc, ['--noEmit']);
} else {
    // Treating a missing tsc as "skipped" would leave a silent hole in the gate.
    console.error(`typescript not found at ${relative(rootDir, tsc)} — run \`npm install\``);
    typecheck = { status: 1, signal: null, error: null };
}
if (failed(typecheck)) failures.push({ label: 'typecheck', result: typecheck });

const testFailures = failures.filter(f => f.label !== 'typecheck');
const passedCount = testFiles.length - testFailures.length;

console.log('\n── Summary ─────────────────────');
console.log(`test files : ${passedCount} passed, ${testFailures.length} failed`);
console.log(`typecheck  : ${failed(typecheck) ? 'failed' : 'passed'}`);
if (failures.length > 0) {
    console.log('failed:');
    for (const { label, result } of failures) console.log(`  ${label} (${outcome(result)})`);
}

process.exit(failures.length > 0 ? 1 : 0);
