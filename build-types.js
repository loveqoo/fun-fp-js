#!/usr/bin/env node
/**
 * Build script for fun-fp-js TypeScript declarations.
 * Concatenates all `types/**\/*.d.ts` files into `dist/fun-fp.d.ts`.
 *
 * Strategy:
 *   1. Read each file in dependency order (defined in FILES below).
 *   2. Strip every `import` / `export * from` line — all symbols land
 *      in the single flat module.
 *   3. Unwrap every `declare module "..." { ... }` block by removing
 *      its opening/closing braces; the interface declarations inside
 *      merge with the same-named interfaces already present.
 *   4. Emit a header and write `dist/fun-fp.d.ts`.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TYPES_DIR = path.join(__dirname, 'types');
const OUT_FILE = path.join(__dirname, 'dist', 'fun-fp.d.ts');

// Dependency order — later files may reference earlier ones.
// 손으로 적는 명단이라 새 선언 파일을 만들고 여기 안 넣으면 조용히 배포에서 빠진다 —
// tests/dist-sync.test.js 가 types/ 의 실재 파일과 이 명단을 대조한다.
export const TYPE_FILES = [
    'HKT.d.ts',
    'TypeClasses.d.ts',
    'TypeLambdas.d.ts',
    'data/Maybe.d.ts',
    'data/Either.d.ts',
    'data/Task.d.ts',
    'data/Validation.d.ts',
    'data/Reader.d.ts',
    'data/Writer.d.ts',
    'data/State.d.ts',
    'data/Free.d.ts',
    'data/builtins.d.ts',
    'data/transformers/StateT.d.ts',
    'data/transformers/EitherT.d.ts',
    'data/transformers/ReaderT.d.ts',
    'data/transformers/WriterT.d.ts',
    'data/transformers/registrations.d.ts',
    'utilities.d.ts',
    'Lens.d.ts',
    'Actor.d.ts',
    'transducer.d.ts',
    'extra.d.ts',
    'runtime.d.ts',
    'index.d.ts',
];

/** Strip every `import` and `export * from` line. */
function stripImports(src) {
    const lines = src.split('\n');
    const out = [];
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        // Single-line import
        if (/^\s*import\s+(type\s+)?.*from\s+["'][^"']+["']\s*;?\s*$/.test(line)
         || /^\s*import\s+["'][^"']+["']\s*;?\s*$/.test(line)) {
            i++;
            continue;
        }
        // Multi-line import (opens with "import {" or "import type {" and
        // the closing brace + from clause is on a later line)
        if (/^\s*import\s+(type\s+)?\{\s*$/.test(line)) {
            // Consume until we find the closing "} from '...';"
            while (i < lines.length && !/\}\s*from\s+["'][^"']+["']\s*;?\s*$/.test(lines[i])) {
                i++;
            }
            i++;  // skip the closing line too
            continue;
        }
        // `export * from '...';` and `export type * from '...';`
        if (/^\s*export\s+(type\s+)?\*\s+from\s+["'][^"']+["']\s*;?\s*$/.test(line)) {
            i++;
            continue;
        }
        // `export { Foo } from '...';` — keep the local symbols; these
        // are re-exports we can drop since the original declarations are
        // already concatenated.
        if (/^\s*export\s+(type\s+)?\{[^}]*\}\s+from\s+["'][^"']+["']\s*;?\s*$/.test(line)) {
            i++;
            continue;
        }
        out.push(line);
        i++;
    }
    return out.join('\n');
}

/**
 * Unwrap `declare module "..." { ... }` by removing the opening line
 * and the matching closing `}`. Tracks brace depth so nested braces
 * inside interface bodies don't trip the match.
 */
function unwrapDeclareModule(src) {
    const lines = src.split('\n');
    const out = [];
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        const m = line.match(/^(\s*)declare\s+module\s+["'][^"']+["']\s*\{\s*$/);
        if (!m) {
            out.push(line);
            i++;
            continue;
        }
        // Entered declare-module block — skip this line, then track
        // braces until we see the closing one at depth 0.
        i++;
        let depth = 1;
        while (i < lines.length && depth > 0) {
            const inner = lines[i];
            // Count braces ignoring ones inside string literals (quick
            // approximation — our d.ts files don't embed `{`/`}` in strings).
            for (const ch of inner) {
                if (ch === '{') depth++;
                else if (ch === '}') depth--;
            }
            if (depth === 0) {
                // This line closes the block — drop only the trailing `}`.
                // In practice our close lines are just `}` on their own, so
                // skip entirely.
                const trimmed = inner.trim();
                if (trimmed !== '}') {
                    // Unusual; keep everything before the final closing `}`.
                    out.push(inner.replace(/\}\s*$/, ''));
                }
                i++;
                break;
            }
            // Dedent by one level (matches our 4-space indent convention).
            out.push(inner.replace(/^ {4}/, ''));
            i++;
        }
    }
    return out.join('\n');
}

/** Collapse more than two consecutive blank lines. */
function collapseBlankLines(src) {
    return src.replace(/\n{3,}/g, '\n\n');
}

// 순수 변환 — 입력은 선언 파일 내용과 빌드 시각뿐이다. readFile 은 상대 경로를 받아 내용을
// 돌려준다. tests/dist-sync.test.js 가 이 함수를 그대로 불러 dist/fun-fp.d.ts 를 검증한다.
export const buildTypeDeclarations = (readFile, builtAt) => {
    const header = `/**
 * fun-fp-js — TypeScript declarations (bundled single-file build).
 *
 * Built: ${builtAt}
 * Source: all .d.ts files under the types/ directory.
 *
 * Generated by build-types.js — do not edit by hand. Regenerate with
 * \`node build-types.js\` after modifying any declaration file in types/.
 */
`;

    const chunks = [header];
    for (const rel of TYPE_FILES) {
        let content = readFile(rel);
        content = stripImports(content);
        content = unwrapDeclareModule(content);
        chunks.push(`\n// ═══════════════════════════════════════════════════════\n//   ${rel}\n// ═══════════════════════════════════════════════════════\n`);
        chunks.push(content.trim());
        chunks.push('\n');
    }

    return collapseBlankLines(chunks.join(''));
};

// 직접 실행할 때만 파일을 쓴다. import 하면 변환 함수와 명단만 가져간다.
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
    const output = buildTypeDeclarations(
        rel => fs.readFileSync(path.join(TYPES_DIR, rel), 'utf-8'),
        new Date().toISOString()
    );

    const distDir = path.join(__dirname, 'dist');
    if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

    fs.writeFileSync(OUT_FILE, output, 'utf-8');

    const sizeKB = (output.length / 1024).toFixed(2);
    const lineCount = output.split('\n').length;
    console.log(`✅ Built: ${OUT_FILE}`);
    console.log(`   Size: ${sizeKB} KB (${lineCount} lines)`);
    console.log(`   Files: ${TYPE_FILES.length}`);
}
