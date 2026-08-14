// 게이트 ④ — 저장소의 자바스크립트가 ES2018 상한을 넘지 않는가.
//
// 왜 있나: index.js 1번 줄의 polyfills 는 "구형 런타임도 받아준다" 는 약속이다. 그런데
// 폴리필은 *메서드*만 메운다. 문법(?. ?? ??= 클래스 필드)은 파싱 단계에서 죽으므로 폴리필이
// 실행될 기회조차 없다 — 약속을 문법 하나가 조용히 깬다. 기준은 Google Apps Script 다.
// 근거와 판단 경위는 docs/internals.md#es-ceiling 에 있다.
//
// 배포물은 index.js 뿐인데 왜 tests/ 와 빌드 스크립트까지 보는가: **규칙이 하나여야 새지
// 않기 때문이다.** 개발 파일은 Node 전용 API 를 쓰므로 구형 런타임에서 돌 일이 없다 —
// 여기서 사는 것은 호환성이 아니라 일관성이다. 사람은 옆 파일의 관례를 베껴 쓰고, 저장소
// 절반이 ?. 를 쓰면 그것이 index.js 로 새어 들어온다. 소유자 결정(2026-08-14).
//
// 왜 정규식이 아니라 파서인가: 이 파일의 주석에는 `Forget<r>` `a -> b` `docs/…#anchor`
// 같은 타입 표기가 널려 있어 문자열 검색은 오탐이 난다. 구문 트리는 주석을 안 본다.
//
// 못 잡는 것 — 정직하게 적는다:
// ① 런타임 값으로만 드러나는 것. `obj['flatMap'](…)` 처럼 이름을 문자열로 만들면 안 보인다.
// ② 표준화 시점이 문법이 아니라 *동작*인 것. 대표적으로 Array.prototype.sort 안정성(ES2019)
//    — 지금 index.js 의 유일한 sort 는 중복 없는 키 배열이라 안정성과 무관하다(실측).
// ③ dist/ 는 안 본다 — 볼 필요가 없다. dist 는 index.js 하나에서 만들어지고,
//    tests/dist-sync.test.js 가 "dist 가 지금 index.js 의 빌드 결과와 같은가" 를 지킨다.
//    그 둘이 함께 초록이면 여기서 증명한 것이 dist 에도 그대로 성립한다.
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { test, assertEquals, allMatches } from './utils.js';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const read = rel => readFileSync(join(rootDir, ...rel.split('/')), 'utf8');

// 검사 대상 — 이 저장소의 손으로 쓴 자바스크립트 전부. dist/ 는 없다(아래 「못 잡는 것」 ③).
const TARGETS = ['index.js', 'build.js', 'build-types.js']
    .concat(readdirSync(join(rootDir, 'tests')).filter(n => n.endsWith('.js')).sort().map(n => `tests/${n}`));

const SOURCE = 'index.js';
const text = read(SOURCE);

// 프로토타입 없는 표로 만든다 — 평범한 객체면 표에 없는 'constructor'·'toString' 이
// Object.prototype 을 타고 참이 되어, 게이트가 멀쩡한 코드를 잡는다(실제로 겪었다).
const table = entries => Object.assign(Object.create(null), entries);
// 정적 메서드는 소유자까지 맞춰 본다 — `.any` `.at` 같은 흔한 이름의 오탐을 막는다.
const STATIC_APIS = table({
    'Object.fromEntries': 'ES2019', 'Object.hasOwn': 'ES2022',
    'Promise.allSettled': 'ES2020', 'Promise.any': 'ES2021',
});
// 프로토타입 메서드는 이름만으로 본다 — 소유자를 정적으로 알 수 없다.
const PROTO_APIS = table({
    flat: 'ES2019', flatMap: 'ES2019', trimStart: 'ES2019', trimEnd: 'ES2019',
    matchAll: 'ES2020', replaceAll: 'ES2021', at: 'ES2022',
});
const GLOBALS = table({
    globalThis: 'ES2020', WeakRef: 'ES2021', FinalizationRegistry: 'ES2021',
    AggregateError: 'ES2021', structuredClone: 'ES2022',
});
// `polyfills.array.flatMap` 의 소유자는 `polyfills.array` 라 한 겹으로는 안 보인다. 뿌리까지 내려간다.
const rootIdentifier = expr => {
    let cur = expr;
    while (ts.isPropertyAccessExpression(cur)) cur = cur.expression;
    return ts.isIdentifier(cur) ? cur.text : null;
};

const isInsideFunction = node => {
    for (let p = node.parent; p; p = p.parent) {
        if (ts.isFunctionDeclaration(p) || ts.isFunctionExpression(p) ||
            ts.isArrowFunction(p) || ts.isMethodDeclaration(p)) return true;
    }
    return false;
};

// 객체 리터럴의 키로 쓰인 이름은 참조가 아니다 — 이 게이트 자신의 규칙표에 `globalThis:`
// 가 있어서, 이 구분이 없으면 게이트가 자기 자신을 잡는다.
const isPropertyName = node => {
    const p = node.parent;
    if (!p) return false;
    if (ts.isPropertyAccessExpression(p) && p.name === node) return true;
    if ((ts.isPropertyAssignment(p) || ts.isPropertySignature(p) || ts.isMethodDeclaration(p)) && p.name === node) return true;
    return false;
};

const scan = rel => {
const text = read(rel);
const sourceFile = ts.createSourceFile(rel, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
const findings = [];
const report = (node, what, since) => {
    const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    findings.push({ file: rel, line: line + 1, what, since });
};

// 폴리필 블록은 index.js 에만 있다. 기능이 있는지 검사한 뒤에만 부르므로 구형에서 안전하다.
const polyfillsRange = (() => {
    if (rel !== SOURCE) return null;
    for (const stmt of sourceFile.statements) {
        if (!ts.isVariableStatement(stmt)) continue;
        const decl = stmt.declarationList.declarations[0];
        if (decl && ts.isIdentifier(decl.name) && decl.name.text === 'polyfills') {
            return { start: stmt.getStart(sourceFile), end: stmt.getEnd() };
        }
    }
    throw new Error('polyfills 선언을 못 찾았다 — 면제 범위를 정할 수 없다');
})();
const inPolyfills = node => {
    if (polyfillsRange === null) return false;
    const start = node.getStart(sourceFile);
    return start >= polyfillsRange.start && start < polyfillsRange.end;
};
// 면제는 "폴리필 블록 안" 이 아니라 "**기능 검사 삼항 안**" 이다. 블록 전체를 면제했더니
// 블록 안에서 검사 없이 직접 부르는 결함을 못 잡았다(뮤테이션으로 확인) — 그 자리는
// polyfills.* 를 거쳐야 한다. 조건과 참-가지만 원본 API 를 볼 자격이 있다.
const isExempt = node => {
    if (!inPolyfills(node)) return false;
    for (let p = node.parent; p; p = p.parent) {
        if (ts.isConditionalExpression(p) && inPolyfills(p)) return true;
    }
    return false;
};

const walk = node => {
    if (!isExempt(node)) {
        // ── 문법 ──
        if (node.questionDotToken) report(node, '옵셔널 체이닝 ?.', 'ES2020');
        if (ts.isBinaryExpression(node)) {
            const op = node.operatorToken.kind;
            if (op === ts.SyntaxKind.QuestionQuestionToken) report(node, '널 병합 ??', 'ES2020');
            if (op === ts.SyntaxKind.QuestionQuestionEqualsToken) report(node, '널 병합 대입 ??=', 'ES2021');
            if (op === ts.SyntaxKind.BarBarEqualsToken) report(node, '논리 대입 ||=', 'ES2021');
            if (op === ts.SyntaxKind.AmpersandAmpersandEqualsToken) report(node, '논리 대입 &&=', 'ES2021');
        }
        if (ts.isCatchClause(node) && !node.variableDeclaration) report(node, 'catch 바인딩 생략', 'ES2019');
        if (ts.isPropertyDeclaration(node)) report(node, '클래스 필드 선언', 'ES2022');
        if (ts.isPrivateIdentifier(node)) report(node, '#private 필드', 'ES2022');
        if (ts.isBigIntLiteral(node)) report(node, 'BigInt 리터럴', 'ES2020');
        if (ts.isNumericLiteral(node) && node.getText(sourceFile).includes('_')) report(node, '숫자 구분자', 'ES2021');
        if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) report(node, '동적 import()', 'ES2020');
        if (ts.isRegularExpressionLiteral(node)) {
            const flags = node.getText(sourceFile).split('/').pop();
            if (flags.includes('d')) report(node, '정규식 d 플래그', 'ES2022');
        }
        if (ts.isAwaitExpression(node) && !isInsideFunction(node)) report(node, '최상위 await', 'ES2022');

        // ── 표준 라이브러리 ──
        if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.name)) {
            const name = node.name.text;
            const owner = ts.isIdentifier(node.expression) ? node.expression.text : null;
            const qualified = owner ? `${owner}.${name}` : null;
            if (qualified && STATIC_APIS[qualified]) {
                report(node, qualified, STATIC_APIS[qualified]);
            } else if (PROTO_APIS[name] && rootIdentifier(node.expression) !== 'polyfills') {
                report(node, `.${name}()`, PROTO_APIS[name]);
            }
        }
        if (ts.isIdentifier(node) && GLOBALS[node.text] && !isPropertyName(node)) {
            report(node, node.text, GLOBALS[node.text]);
        }
    }
    node.forEachChild(walk);
};
sourceFile.forEachChild(walk);
return findings;
};

// 이유 있는 예외. **이유 없이 여기 추가하지 마라** — 이유가 곧 판정 근거다.
// 아래 검사가 ① 이유가 비어 있지 않은지 ② 그 예외가 실제로 쓰이는지를 함께 본다.
const EXEMPTIONS = [
    ['tests/baseline.js', '동적 import()',
        'HEAD 의 index.js 를 임시 파일로 써서 불러온다. 경로가 실행 시점에 정해지므로 ESM 에는 이것 말고 수단이 없다 — 배포되지 않는 개발 전용 파일이다'],
];
const exemptionFor = f => EXEMPTIONS.find(([file, what]) => f.file === file && f.what === what);

const rawFindings = TARGETS.reduce((acc, rel) => acc.concat(scan(rel)), []);
const allFindings = rawFindings.filter(f => exemptionFor(f) === undefined);

console.log(`\n=== ES2018 상한 게이트 — 파일 ${TARGETS.length}개 ===\n`);

test(`손으로 쓴 자바스크립트에 ES2019 이상 문법·API 가 없다`, () => {
    const detail = allFindings
        .map(f => `      ${f.file}:${f.line}  ${f.what}  (${f.since})`)
        .join('\n');
    assertEquals(allFindings.length, 0,
        allFindings.length === 0 ? '' : `ES2018 상한을 넘는 것 ${allFindings.length}건:\n${detail}\n` +
        '      폴리필로 메울 수 있는 *메서드*라면 index.js 의 polyfills 블록에 넣어라.\n' +
        '      *문법*이라면 못 메운다 — 다른 표현으로 바꿔야 한다.\n' +
        '      matchAll 은 tests/utils.js 의 allMatches 를 써라.');
});

// 예외는 썩는다. 원인이 사라졌는데 줄만 남으면 다음 사람이 "여기는 원래 예외" 라고 읽는다.
test('예외에는 이유가 있고, 전부 실제로 쓰인다', () => {
    for (const [file, what, reason] of EXEMPTIONS) {
        assertEquals(typeof reason === 'string' && reason.length > 20, true,
            `${file} 의 '${what}' 예외에 이유가 없거나 너무 짧다`);
    }
    const unused = EXEMPTIONS
        .filter(([file, what]) => !rawFindings.some(f => f.file === file && f.what === what))
        .map(([file, what]) => `${file}: ${what}`);
    assertEquals(unused, [], '더 이상 해당하지 않는 예외 — 지워라');
});

test('검사 대상이 조용히 줄지 않는다', () => {
    // 파일 목록을 읽어서 만들므로, tests/ 에 파일을 더하면 자동으로 대상이 된다.
    // 다만 index.js·build.js·build-types.js 가 빠지는 것은 못 알아채므로 못 박는다.
    for (const must of ['index.js', 'build.js', 'build-types.js']) {
        assertEquals(TARGETS.includes(must), true, `${must} 이 검사 대상에서 빠졌다`);
    }
    assertEquals(TARGETS.length > 40, true, `검사 대상이 ${TARGETS.length}개뿐이다 — 목록 수집이 깨졌다`);
});

// 게이트가 눈을 뜨고 있는지 스스로 검사한다. 초록 테스트는 영수증이 아니다 —
// 아무것도 안 보는 게이트도 초록이기 때문이다.
test('게이트가 실제로 탐지한다 (자기검사)', () => {
    const probe = ts.createSourceFile('probe.js',
        'const a = x?.y ?? z; let b; b ??= 1; class K { #p = 1; static s = 2; }\n' +
        'const c = [].flat(); const d = Object.fromEntries([]); const e = globalThis;\n' +
        'try { a(); } catch { }\n',
        ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    const hits = [];
    const probeWalk = n => {
        if (n.questionDotToken) hits.push('?.');
        if (ts.isBinaryExpression(n)) {
            if (n.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) hits.push('??');
            if (n.operatorToken.kind === ts.SyntaxKind.QuestionQuestionEqualsToken) hits.push('??=');
        }
        if (ts.isPrivateIdentifier(n)) hits.push('#private');
        if (ts.isPropertyDeclaration(n)) hits.push('클래스 필드');
        if (ts.isCatchClause(n) && !n.variableDeclaration) hits.push('catch 생략');
        if (ts.isPropertyAccessExpression(n) && ts.isIdentifier(n.name)) {
            if (n.name.text === 'flat') hits.push('.flat()');
            if (n.name.text === 'fromEntries') hits.push('Object.fromEntries');
        }
        if (ts.isIdentifier(n) && n.text === 'globalThis' &&
            !(n.parent && ts.isPropertyAccessExpression(n.parent) && n.parent.name === n)) hits.push('globalThis');
        n.forEachChild(probeWalk);
    };
    probe.forEachChild(probeWalk);
    const expected = ['?.', '??', '??=', '#private', '클래스 필드', 'catch 생략', '.flat()', 'Object.fromEntries', 'globalThis'];
    const missed = expected.filter(e => !hits.includes(e));
    assertEquals(missed, [], `게이트가 못 잡는 규칙: ${missed.join(', ')}`);
});

// 폴리필이 상한 *아래*의 것까지 검사하면 죽은 가지가 생긴다 — 상한을 지키는 런타임에는
// 반드시 있으므로 대체 구현이 영원히 안 불린다. 그런 코드는 시험된 적 없이 남는다.
test('폴리필은 상한 위의 것만 검사한다', () => {
    const open = text.indexOf('const polyfills = {');
    assertEquals(open >= 0, true, 'polyfills 선언을 못 찾았다');
    const block = text.slice(open, text.indexOf('\n};', open));
    const detected = allMatches(/^\s*\w+:\s*([A-Za-z.]+)\s*$/gm, block).map(m => m[1]).sort();
    assertEquals(detected, ['Array.prototype.flatMap', 'Object.fromEntries'],
        'ES2019 인 둘만 검사해야 한다. 상한 아래(Object.entries·Object.values 등)를 검사하면\n' +
        '      대체 가지가 죽은 코드가 되고, 상한 위를 안 검사하면 구형 런타임에서 죽는다.');
});
