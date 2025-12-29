#!/usr/bin/env node
/**
 * Build Script for Fun FP JS
 * 
 * Strategy:
 *   1. Extract each module into parts (body + asserts)
 *   2. Merge all assertFunctions entries
 *   3. Combine bodies with namespace replacements
 *   4. Wrap in UMD template
 * 
 * Usage: node build.js
 */

const fs = require('fs');
const path = require('path');

const MODULES_DIR = path.join(__dirname, 'modules');
const BUILD_DIR = path.join(__dirname, 'build');
const PARTS_DIR = path.join(BUILD_DIR, 'parts');
const OUTPUT_FILE = path.join(BUILD_DIR, 'all_in_one.cjs');

// Module order (dependencies first)
const MODULE_ORDER = ['core', 'either', 'monoid', 'free', 'extra', 'task'];

// Special case replacements (reserved words or naming conflicts)
// Format: { 'namespace.function': 'replacement' }
const SPECIAL_REPLACEMENTS = {
    'core.catch': 'runCatch',      // catch is reserved
    'either.catch': 'Either.catch', // Either class static method
};

/**
 * Extract the return statement content from a module
 * Returns the inner content of the module's export (e.g., "core: { ... }")
 */
function extractReturnStatement(content, moduleName) {
    const lines = content.split('\n');

    // Find "return {" line
    let startIdx = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('return {')) {
            startIdx = i;
            break;
        }
    }

    if (startIdx < 0) return null;

    // Find matching closing brace
    let braceCount = 0;
    let endIdx = startIdx;

    for (let i = startIdx; i < lines.length; i++) {
        braceCount += (lines[i].match(/{/g) || []).length;
        braceCount -= (lines[i].match(/}/g) || []).length;
        if (braceCount === 0) {
            endIdx = i;
            break;
        }
    }

    // Extract just the module export content (skip "return {" and "};" lines)
    const returnLines = lines.slice(startIdx + 1, endIdx);

    // Find the module's export block (e.g., "core: { ... }")
    let moduleContent = '';
    let inModule = false;
    let moduleBraceCount = 0;

    for (const line of returnLines) {
        const trimmed = line.trim();

        if (trimmed.startsWith(`${moduleName}: {`)) {
            inModule = true;
            moduleContent = line;
            moduleBraceCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
            if (moduleBraceCount === 0) break;
            continue;
        }

        if (inModule) {
            moduleContent += '\n' + line;
            moduleBraceCount += (line.match(/{/g) || []).length;
            moduleBraceCount -= (line.match(/}/g) || []).length;
            if (moduleBraceCount === 0) break;
        }
    }

    return moduleContent;
}

/**
 * Parse a module file and extract parts
 */
function parseModule(content, moduleName) {
    const lines = content.split('\n');

    // Find assertFunctions block
    const asserts = [];
    let assertStart = -1, assertEnd = -1;
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.trim().startsWith('const assertFunctions = {')) {
            assertStart = i;
            braceCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
            if (braceCount === 0) {
                assertEnd = i;
                break;
            }
            continue;
        }

        if (assertStart >= 0 && assertEnd < 0) {
            braceCount += (line.match(/{/g) || []).length;
            braceCount -= (line.match(/}/g) || []).length;

            // Extract key-value pairs
            const match = line.match(/^\s*'([^']+)':\s*(.+?),?\s*$/);
            if (match) {
                asserts.push({ key: match[1], value: match[2].replace(/,\s*$/, '') });
            }

            if (braceCount === 0) {
                assertEnd = i;
            }
        }
    }

    // Find body start (after wrapper and dependencies)
    let bodyStart = 0;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.match(/^const \$\w+ = \(dependencies/)) {
            bodyStart = i + 1;
            break;
        }
    }

    // Skip dependencies and log for non-core
    while (bodyStart < lines.length) {
        const line = lines[bodyStart].trim();
        if (line.startsWith('const { core }') ||
            line.startsWith('const { either }') ||
            line.startsWith('const log =') ||
            line === '') {
            bodyStart++;
        } else {
            break;
        }
    }

    // Find body end (before return statement)
    let bodyEnd = lines.length - 1;
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (line.startsWith('return {')) {
            bodyEnd = i - 1;
            break;
        }
    }

    // Go back past empty lines and module export
    while (bodyEnd > bodyStart) {
        const line = lines[bodyEnd].trim();
        if (line === '' || line.startsWith('if (typeof module')) {
            bodyEnd--;
        } else {
            break;
        }
    }

    // Extract body (excluding assertFunctions block)
    const bodyLines = [];
    for (let i = bodyStart; i <= bodyEnd; i++) {
        if (i >= assertStart && i <= assertEnd) continue; // Skip assertFunctions
        bodyLines.push(lines[i]);
    }

    return {
        asserts,
        body: bodyLines.join('\n'),
    };
}

/**
 * Apply namespace replacements to body
 * 1. Apply special case replacements first (core.catch → runCatch)
 * 2. Then auto-replace remaining patterns (core.xxx → xxx, either.xxx → xxx)
 */
function applyReplacements(body) {
    let result = body;

    // 1. Apply special cases first
    for (const [pattern, replacement] of Object.entries(SPECIAL_REPLACEMENTS)) {
        const [namespace, func] = pattern.split('.');
        const regex = new RegExp(`${namespace}\\.${func}\\b`, 'g');
        result = result.replace(regex, replacement);
    }

    // 2. Auto-replace remaining namespace prefixes
    // core.xxx → xxx (except already handled special cases)
    result = result.replace(/\bcore\.(\w+)\b/g, '$1');

    // either.xxx → Either.xxx (class static methods)
    result = result.replace(/\beither\.(\w+)\b/g, 'Either.$1');

    return result;
}

/**
 * Generate assertFunctions code from merged entries
 */
function generateAssertFunctions(allAsserts) {
    let code = '    const assertFunctions = {\n';
    for (const { key, value } of allAsserts) {
        // Remove core. prefix in values
        const cleanValue = value.replace(/core\./g, '');
        code += `        '${key}': ${cleanValue},\n`;
    }
    code += '    };';
    return code;
}

/**
 * Main build function
 */
function build() {
    console.log('🔧 Building all_in_one.cjs...\n');

    // Create directories
    if (!fs.existsSync(BUILD_DIR)) fs.mkdirSync(BUILD_DIR);
    if (!fs.existsSync(PARTS_DIR)) fs.mkdirSync(PARTS_DIR);

    // Step 1: Parse each module
    console.log('📦 Step 1: Extracting module parts...');
    const allAsserts = [];
    const moduleBodies = {};
    const moduleReturns = {}; // Store return statements

    for (const name of MODULE_ORDER) {
        const filePath = path.join(MODULES_DIR, `${name}.js`);
        const content = fs.readFileSync(filePath, 'utf8');
        const { asserts, body } = parseModule(content, name);

        // Extract return statement
        const returnContent = extractReturnStatement(content, name);

        console.log(`   ${name}: ${asserts.length} asserts, ${body.split('\n').length} lines`);

        // Save parts
        fs.writeFileSync(path.join(PARTS_DIR, `${name}.body.js`), body);
        fs.writeFileSync(path.join(PARTS_DIR, `${name}.asserts.json`), JSON.stringify(asserts, null, 2));

        allAsserts.push(...asserts);
        moduleBodies[name] = body;
        moduleReturns[name] = returnContent;
    }

    // Step 2: Merge assertFunctions
    console.log('\n🔗 Step 2: Merging assertFunctions...');
    const mergedAsserts = generateAssertFunctions(allAsserts);
    fs.writeFileSync(path.join(PARTS_DIR, '_merged.asserts.js'), mergedAsserts);
    console.log(`   Total: ${allAsserts.length} entries`);

    // Step 3: Apply replacements and combine bodies
    console.log('\n🔄 Step 3: Applying replacements...');
    const combinedBodies = [];
    const INDENT = '    '; // 4 spaces (modules already have 4 spaces, total 8)

    for (const name of MODULE_ORDER) {
        let body = moduleBodies[name];
        body = applyReplacements(body);

        // For core, inject assertFunctions after assertFunction definition
        if (name === 'core') {
            const lines = body.split('\n');
            const insertIdx = lines.findIndex(l => l.includes('return fs; // array'));
            if (insertIdx >= 0) {
                lines.splice(insertIdx + 2, 0, '', mergedAsserts);
            }
            body = lines.join('\n');
        }

        // Add indentation to each line
        const indentedBody = body.split('\n').map(line => line ? INDENT + line : line).join('\n');

        combinedBodies.push(`\n        // ========== ${name.toUpperCase()} ==========\n${indentedBody}`);
        fs.writeFileSync(path.join(PARTS_DIR, `${name}.transformed.js`), body);
    }

    // Step 4: Build final file
    console.log('\n📄 Step 4: Building final file...');

    // Generate build info (local time + timezone)
    const now = new Date();
    const buildTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const buildDate = now.toLocaleString('sv-SE', { timeZone: buildTz }).replace('T', ' ');

    const UMD_HEADER = `/**
 * Fun FP JS - A Lightweight Functional Programming Library
 * UMD (Universal Module Definition) + ESM build
 * 
 * Built: ${buildDate} (${buildTz})
 * 
 * Supports: CommonJS, AMD, Browser globals, ES Modules
 * 
 * Auto-generated by build.js - DO NOT EDIT DIRECTLY
 * Edit modules/*.js files instead and run: node build.js
 */
(function(root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        // CommonJS
        module.exports = factory();
        // ESM interop: allow "import funFpJs from '...'" 
        module.exports.default = module.exports;
    } else if (typeof define === 'function' && define.amd) {
        // AMD
        define([], factory);
    } else {
        // Browser globals
        root.funFpJs = factory();
    }
})(typeof self !== 'undefined' ? self : this, function() {
    'use strict';
    var funFpJs = function(dependencies) {
        dependencies = dependencies || {};
        var log = dependencies.enableLog === false ? function(){} : (typeof dependencies.log === 'function' ? dependencies.log : console.log);
`;

    // Build RETURN_STATEMENT dynamically from module exports
    console.log('\n📝 Step 5: Generating return statement from modules...');
    const returnParts = MODULE_ORDER.map(name => {
        let content = moduleReturns[name];
        if (content) {
            // Apply replacements to return statement content too
            content = applyReplacements(content);
            // Add proper indentation (12 spaces for inside return {})
            return content.split('\n').map((line, i, arr) => {
                const trimmed = line.trim();
                if (!trimmed) return '';
                // First line (module: {) and last line (},) get 12 spaces, middle lines get 16
                const isFirst = i === 0;
                const isLast = trimmed === '},';
                return (isFirst || isLast ? '            ' : '                ') + trimmed;
            }).filter(Boolean).join('\n');
        }
        return '';
    }).filter(Boolean);

    const RETURN_STATEMENT = `
        return {
${returnParts.join('\n')}
        };
    };
    return funFpJs;
});

// ESM interop: allow default import in ES Modules
// Usage: import funFpJs from './all_in_one.cjs';
if (typeof module !== 'undefined' && module.exports) {
    module.exports.default = module.exports;
}
`;

    const finalContent = UMD_HEADER + combinedBodies.join('\n') + RETURN_STATEMENT;
    fs.writeFileSync(OUTPUT_FILE, finalContent);

    const size = (fs.statSync(OUTPUT_FILE).size / 1024).toFixed(2);
    console.log(`\n✅ Build complete: ${OUTPUT_FILE}`);
    console.log(`   Size: ${size} KB`);

    return true;
}

/**
 * Run tests with the built file
 */
function runTests() {
    console.log('\n🧪 Running tests with built file...\n');

    const { execSync } = require('child_process');

    try {
        execSync(`./test.sh "${OUTPUT_FILE}"`, {
            cwd: __dirname,
            stdio: 'inherit',
        });
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Copy built file to root
 */
function copyToRoot() {
    const ROOT_FILE = path.join(__dirname, 'all_in_one.cjs');
    fs.copyFileSync(OUTPUT_FILE, ROOT_FILE);
    console.log(`\n📋 Copied to: ${ROOT_FILE}`);
}

/**
 * Clean up build directory
 */
function cleanup() {
    console.log('\n🧹 Cleaning up build directory...');

    // Remove entire build directory
    if (fs.existsSync(BUILD_DIR)) {
        fs.rmSync(BUILD_DIR, { recursive: true, force: true });
    }

    console.log('   Done.');
}

// Main execution
if (build()) {
    if (runTests()) {
        copyToRoot();
        cleanup();
        console.log('\n🎉 Build and deploy successful!');
    } else {
        console.log('\n❌ Tests failed. Build output kept for debugging.');
        process.exit(1);
    }
} else {
    console.log('\n❌ Build failed.');
    process.exit(1);
}
