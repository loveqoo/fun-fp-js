/**
 * Fun FP JS 빌드 스크립트
 * 
 * 전략:
 *   1. 각 모듈에서 @build-start 마커 이후 코드 추출
 *   2. 네임스페이스 치환 적용 (core.xxx → xxx)
 *   3. UMD 래퍼로 감싸서 all_in_one.cjs 생성
 * 
 * 실행: node build.js
 */

const fs = require('fs');
const path = require('path');

const MODULES_DIR = path.join(__dirname, 'modules');
const BUILD_DIR = path.join(__dirname, 'build');
const PARTS_DIR = path.join(BUILD_DIR, 'parts');
const OUTPUT_FILE = path.join(BUILD_DIR, 'all_in_one.cjs');

// 모듈 순서 (의존성 순서대로)
const MODULE_ORDER = ['core', 'either', 'monoid', 'free', 'extra', 'task'];

// 특수 치환 (예약어나 네이밍 충돌)
const SPECIAL_REPLACEMENTS = {
    'core.catch': 'runCatch',
    'either.catch': 'Either.catch',
};

// 모듈의 return 문에서 export 블록 추출 (파일 끝에서부터 탐색)
function extractReturnStatement(content, moduleName) {
    const lines = content.split('\n');

    let startIdx = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].trim().startsWith('return {')) {
            startIdx = i;
            break;
        }
    }
    if (startIdx < 0) return null;

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

    const returnLines = lines.slice(startIdx + 1, endIdx);
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

// @build-start 마커부터 return 문 직전까지 본문 추출
function parseModule(content, moduleName) {
    const lines = content.split('\n');

    let bodyStart = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === '// @build-start') {
            bodyStart = i + 1;
            break;
        }
    }
    if (bodyStart < 0) {
        console.warn(`   ⚠️  ${moduleName}: @build-start 마커 없음!`);
        bodyStart = 1;
    }

    let bodyEnd = lines.length - 1;
    for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].trim().startsWith('return {')) {
            bodyEnd = i - 1;
            break;
        }
    }

    while (bodyEnd > bodyStart) {
        const line = lines[bodyEnd].trim();
        if (line === '' || line.startsWith('if (typeof module')) {
            bodyEnd--;
        } else {
            break;
        }
    }

    return { body: lines.slice(bodyStart, bodyEnd + 1).join('\n') };
}

// 네임스페이스 치환 적용
function applyReplacements(body) {
    let result = body;

    // 1. 특수 치환 먼저
    for (const [pattern, replacement] of Object.entries(SPECIAL_REPLACEMENTS)) {
        const [namespace, func] = pattern.split('.');
        result = result.replace(new RegExp(`${namespace}\\.${func}\\b`, 'g'), replacement);
    }

    // 2. 자동 치환
    result = result.replace(/\bcore\.(\w+)\b/g, '$1');
    result = result.replace(/\beither\.(\w+)\b/g, 'Either.$1');
    result = result.replace(/\bfree\.Free\b/g, 'Free');
    result = result.replace(/\bfree\.(\w+)\b/g, 'Free.$1');
    result = result.replace(/\bmonoid\.(\w+)\b/g, '$1');

    return result;
}

function build() {
    console.log('🔧 Building all_in_one.cjs...\n');

    if (!fs.existsSync(BUILD_DIR)) fs.mkdirSync(BUILD_DIR);
    if (!fs.existsSync(PARTS_DIR)) fs.mkdirSync(PARTS_DIR);

    console.log('📦 Step 1: 모듈 추출...');
    const moduleBodies = {};
    const moduleReturns = {};

    for (const name of MODULE_ORDER) {
        const filePath = path.join(MODULES_DIR, `${name}.js`);
        const content = fs.readFileSync(filePath, 'utf8');
        const { body } = parseModule(content, name);
        const returnContent = extractReturnStatement(content, name);

        console.log(`   ${name}: ${body.split('\n').length} lines`);
        fs.writeFileSync(path.join(PARTS_DIR, `${name}.body.js`), body);

        moduleBodies[name] = body;
        moduleReturns[name] = returnContent;
    }

    console.log('\n🔄 Step 2: 치환 적용...');
    const combinedBodies = [];
    const INDENT = '    ';

    for (const name of MODULE_ORDER) {
        let body = applyReplacements(moduleBodies[name]);
        const indentedBody = body.split('\n').map(line => line ? INDENT + line : line).join('\n');
        combinedBodies.push(`\n        // ========== ${name.toUpperCase()} ==========\n${indentedBody}`);
        fs.writeFileSync(path.join(PARTS_DIR, `${name}.transformed.js`), body);
    }

    console.log('\n📄 Step 3: 최종 파일 생성...');
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
        module.exports = factory();
        module.exports.default = module.exports;
    } else if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else {
        root.funFpJs = factory();
    }
})(typeof self !== 'undefined' ? self : this, function() {
    'use strict';
    var cachedInstance = null;
    var funFpJs = function(dependencies, cacheable) {
        if (cacheable === undefined) cacheable = true;
        if (cacheable && cachedInstance) return cachedInstance;
        dependencies = dependencies || {};
`;

    console.log('\n📝 Step 4: return 문 생성...');
    const returnParts = MODULE_ORDER.map(name => {
        let content = moduleReturns[name];
        if (content) {
            content = applyReplacements(content);
            return content.split('\n').map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return '';
                const isFirst = i === 0;
                const isLast = trimmed === '},';
                return (isFirst || isLast ? '            ' : '                ') + trimmed;
            }).filter(Boolean).join('\n');
        }
        return '';
    }).filter(Boolean);

    const RETURN_STATEMENT = `
        var instance = {
${returnParts.join('\n')}
        };
        if (cacheable) cachedInstance = instance;
        return instance;
    };
    return funFpJs;
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports.default = module.exports;
}
`;

    fs.writeFileSync(OUTPUT_FILE, UMD_HEADER + combinedBodies.join('\n') + RETURN_STATEMENT);

    const size = (fs.statSync(OUTPUT_FILE).size / 1024).toFixed(2);
    console.log(`\n✅ Build complete: ${OUTPUT_FILE}`);
    console.log(`   Size: ${size} KB`);
    return true;
}

function runTests() {
    console.log('\n🧪 테스트 실행...\n');
    const { execSync } = require('child_process');
    try {
        execSync(`./test.sh "${OUTPUT_FILE}"`, { cwd: __dirname, stdio: 'inherit' });
        return true;
    } catch (e) {
        return false;
    }
}

function copyToRoot() {
    const ROOT_FILE = path.join(__dirname, 'all_in_one.cjs');
    fs.copyFileSync(OUTPUT_FILE, ROOT_FILE);
    console.log(`\n📋 Copied to: ${ROOT_FILE}`);
}

function cleanup() {
    console.log('\n🧹 빌드 디렉토리 정리...');
    if (fs.existsSync(BUILD_DIR)) {
        fs.rmSync(BUILD_DIR, { recursive: true, force: true });
    }
    console.log('   완료.');
}

// 메인 실행
if (build()) {
    if (runTests()) {
        copyToRoot();
        cleanup();
        console.log('\n🎉 Build and deploy successful!');
    } else {
        console.log('\n❌ 테스트 실패. 디버깅을 위해 빌드 출력 유지.');
        process.exit(1);
    }
} else {
    console.log('\n❌ 빌드 실패.');
    process.exit(1);
}
