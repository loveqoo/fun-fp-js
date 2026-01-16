#!/usr/bin/env node
/**
 * Build script for Fun-FP-JS
 * Generates browser-compatible UMD bundle from ES module source
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SOURCE_FILE = path.join(__dirname, 'index.js');
const OUTPUT_FILE = path.join(__dirname, 'dist', 'fun-fp.cjs');
const OUTPUT_MIN_FILE = path.join(__dirname, 'dist', 'fun-fp.min.cjs');

// Read source
const source = fs.readFileSync(SOURCE_FILE, 'utf-8');

// Extract the export statement
const exportMatch = source.match(/export default \{[\s\S]*?\};/);
if (!exportMatch) {
    console.error('Could not find export default statement');
    process.exit(1);
}

// Get export content (the object being exported)
const exportStatement = exportMatch[0];
const exportBody = exportStatement
    .replace('export default ', 'return ')
    .replace(/;$/, ';');

// Remove the export statement from source
const coreCode = source.replace(exportStatement, '').trim();

// Build timestamp
const now = new Date();
const buildInfo = `/**
 * Fun-FP-JS - Functional Programming Library
 * Built: ${now.toISOString()}
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

// Ensure dist directory exists
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Write UMD bundle
fs.writeFileSync(OUTPUT_FILE, umdCode, 'utf-8');
console.log(`✅ Built: ${OUTPUT_FILE}`);
console.log(`   Size: ${(umdCode.length / 1024).toFixed(2)} KB`);

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

fs.writeFileSync(OUTPUT_MIN_FILE, minified, 'utf-8');
console.log(`✅ Built: ${OUTPUT_MIN_FILE}`);
console.log(`   Size: ${(minified.length / 1024).toFixed(2)} KB`);

// Copy ESM source to dist
const OUTPUT_ESM_FILE = path.join(__dirname, 'dist', 'fun-fp.js');
fs.copyFileSync(SOURCE_FILE, OUTPUT_ESM_FILE);
console.log(`✅ Copied: ${OUTPUT_ESM_FILE} (ESM)`);
console.log(`   Size: ${(fs.statSync(OUTPUT_ESM_FILE).size / 1024).toFixed(2)} KB`);

console.log('\n📦 Build complete!');
console.log('\nUsage:');
console.log('  Browser: <script src="dist/fun-fp.cjs"></script>');
console.log('           Then use: FunFP.Maybe, FunFP.Either, etc.');
console.log('  CommonJS: const FunFP = require("./dist/fun-fp.cjs")');
console.log('  ESM: import FunFP from "./dist/fun-fp.js"');

