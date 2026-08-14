#!/usr/bin/env node
/**
 * Build script for Fun-FP-JS
 * Generates browser-compatible UMD bundle from ES module source
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SOURCE_FILE = path.join(__dirname, 'index.js');
const OUTPUT_FILE = path.join(__dirname, 'dist', 'fun-fp.cjs');
const OUTPUT_MIN_FILE = path.join(__dirname, 'dist', 'fun-fp.min.cjs');

// 순수 변환 — 입력은 소스와 빌드 시각뿐이다. tests/dist-sync.test.js 가 이 함수를 그대로
// 불러 dist 가 현재 소스의 빌드 결과인지 본다. 검사가 변환을 베끼면 언젠가 서로 어긋난다.
export const buildOutputs = (source, builtAt) => {

// Extract the export statement
const exportMatch = source.match(/export default \{[\s\S]*?\};/);
if (!exportMatch) {
    throw new Error('Could not find export default statement');
}

// Get export content (the object being exported)
const exportStatement = exportMatch[0];
const exportBody = exportStatement
    .replace('export default ', 'return ')
    .replace(/;$/, ';');

// Remove the export statement from source
const coreCode = source.replace(exportStatement, '').trim();

// Build timestamp
const buildInfo = `/**
 * Fun-FP-JS - Functional Programming Library
 * Built: ${builtAt}
 * Static Land specification compliant
 */`;

// UMD wrapper
const umdCode = `${buildInfo}
(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        // CommonJS
        module.exports = factory();
        module.exports.default = module.exports;
    } else {
        // Browser global
        root.FunFP = factory();
    }
}(typeof self !== 'undefined' ? self : this, function() {
    'use strict';

${coreCode}

${exportBody}
}));
`;

// Simple minification (basic, without a proper minifier)
// For production, use terser or esbuild
const minified = umdCode
    // Remove single-line comments (but keep the header)
    .replace(/(?<!:)\/\/(?!.*\*\/).*$/gm, '')
    // Remove multi-line comments except the header
    .replace(/\/\*(?!\*\n \* Fun-FP-JS)[\s\S]*?\*\//g, '')
    // Remove extra whitespace
    .replace(/\n\s*\n/g, '\n')
    .replace(/\n\s+/g, '\n')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}\[\]:;,=<>!&|?+\-*/()])\s*/g, '$1')
    // Restore some necessary spaces
    .replace(/return\{/g, 'return {')
    .replace(/\}function/g, '} function')
    .replace(/\}class/g, '} class')
    .replace(/\}const/g, '} const')
    .replace(/\}let/g, '} let')
    .replace(/\}if/g, '} if')
    .replace(/\}while/g, '} while')
    .replace(/\}else/g, '} else')
    .replace(/elseif/g, 'else if')
    .replace(/else\{/g, 'else {')
    .replace(/if\(/g, 'if (')
    .replace(/while\(/g, 'while (')
    .replace(/for\(/g, 'for (')
    .replace(/\)=>/g, ') =>')
    .trim();

// ESM 은 헤더 + 소스 그대로다 — dist/fun-fp.js 에서 헤더를 떼면 index.js 와 글자까지 같다.
const esmContent = `${buildInfo}\n` + source;

return { cjs: umdCode, min: minified, esm: esmContent };
};

// 직접 실행할 때만 파일을 쓴다. import 하면 변환 함수만 가져간다.
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
    const source = fs.readFileSync(SOURCE_FILE, 'utf-8');
    const { cjs, min, esm } = buildOutputs(source, new Date().toISOString());

    const distDir = path.join(__dirname, 'dist');
    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
    }
    const OUTPUT_ESM_FILE = path.join(__dirname, 'dist', 'fun-fp.js');

    fs.writeFileSync(OUTPUT_FILE, cjs, 'utf-8');
    console.log(`✅ Built: ${OUTPUT_FILE}`);
    console.log(`   Size: ${(cjs.length / 1024).toFixed(2)} KB`);

    fs.writeFileSync(OUTPUT_MIN_FILE, min, 'utf-8');
    console.log(`✅ Built: ${OUTPUT_MIN_FILE}`);
    console.log(`   Size: ${(min.length / 1024).toFixed(2)} KB`);

    fs.writeFileSync(OUTPUT_ESM_FILE, esm, 'utf-8');
    console.log(`✅ Built: ${OUTPUT_ESM_FILE} (ESM)`);
    console.log(`   Size: ${(esm.length / 1024).toFixed(2)} KB`);

    console.log('\n📦 Build complete!');
    console.log('\nUsage:');
    console.log('  Browser: <script src="dist/fun-fp.cjs"></script>');
    console.log('           Then use: FunFP.Maybe, FunFP.Either, etc.');
    console.log('  CommonJS: const FunFP = require("./dist/fun-fp.cjs")');
    console.log('  ESM: import FunFP from "./dist/fun-fp.js"');
}

