// Keeps the English docs from drifting away from the Korean originals.
//
// 한국어가 정본이고 영어는 번역본이다.
//
// **한때 코드 블록을 글자까지 대조했다.** 그 규칙 덕에 번역이 코드를 건드리는 사고를 다섯 번
// 잡았다(코드 안 한글 주석의 영어화, `\u00e9` 를 실제 문자로 바꿔 쓴 것 등). 그러나 대가가
// 있었다 — 코드 안 주석·문자열이 한국어로 남아 영어 독자에게 반쪽이었다. 소유자 결정
// (2026-08-19): **코드 안까지 영어로 옮긴다.** 그래서 글자 대조는 여기서 걷고,
// 대신 `docs-examples` 게이트가 **영어판도 실행하고 값까지 대조**한다.
//
// 여기 남는 것은 **구조**다 — 블록 수와 실행 여부(no-run)가 짝마다 같아야 한다. 그것이
// 어긋나면 번역이 예제를 빠뜨렸거나 실행 대상에서 몰래 뺐다는 뜻이다.
// 두 문서의 **논리가 갈라지는 것**은 이제 기계가 못 잡는다 — 사람이 볼 몫이다.
//
// 짝은 규약으로 정한다: README.md ↔ README.en.md, docs/X.md ↔ docs/en/X.md.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, logSection, allMatches } from './utils.js';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const docsDir = join(rootDir, 'docs');
const enDir = join(docsDir, 'en');

// 코드 펜스 전체(언어·정보 문자열 포함)를 그대로 뽑는다 — no-run 이유까지 같아야 한다.
const FENCE = /^```([^\n]*)\n([\s\S]*?)^```/gm;
const fencesOf = source => allMatches(FENCE, source).map(([, info, code]) => ({ info: info.trim(), code }));

const pairs = [
    { ko: join(rootDir, 'README.md'), en: join(rootDir, 'README.en.md'), label: 'README.md' },
    ...(existsSync(enDir)
        ? readdirSync(enDir).filter(n => n.endsWith('.md')).sort()
            .map(n => ({ ko: join(docsDir, n), en: join(enDir, n), label: `docs/${n}` }))
        : []),
];

logSection('Docs translation');

test('번역본이 있는 문서는 한국어 정본도 있다', () => {
    const orphans = pairs.filter(p => !existsSync(p.ko)).map(p => p.label);
    if (orphans.length > 0) {
        throw new Error(`영어판만 있고 정본이 없다: ${orphans.join(', ')}`);
    }
});

for (const { ko, en, label } of pairs) {
    if (!existsSync(en)) continue;
    test(`${label} — 영어판의 코드 블록 구조가 정본과 같다`, () => {
        const a = fencesOf(readFileSync(ko, 'utf8'));
        const b = fencesOf(readFileSync(en, 'utf8'));
        if (a.length !== b.length) {
            throw new Error(`코드 블록 수가 다르다 — 정본 ${a.length}개, 영어판 ${b.length}개`);
        }
        // no-run 뒤의 **이유는 산문**이라 번역돼도 된다. 실행되느냐 마느냐만 같으면 된다.
        const kind = info => (info.split(/\s+/)[0] || '') + (/(^|\s)no-run(\s|$)/.test(info) ? ' no-run' : '');
        const diff = [];
        a.forEach((block, i) => {
            if (kind(block.info) !== kind(b[i].info)) {
                diff.push(`${i + 1}번째 블록의 실행 여부가 다르다 ('${block.info}' vs '${b[i].info}')`);
            }
        });
        if (diff.length > 0) throw new Error(`${diff.length}건\n   ${diff.join('\n   ')}`);
    });
}

console.log(`\n번역 짝 ${pairs.filter(p => existsSync(p.en)).length}쌍 대조`);

// 짝이 0쌍이면 이 파일은 아무것도 안 보고 초록이 된다. 번역을 시작한 뒤로는 그것이 사고다.
test('번역 짝이 하나라도 있다', () => {
    const found = pairs.filter(p => existsSync(p.en)).length;
    if (found === 0) throw new Error('영어판을 하나도 못 찾았다 — 짝 규약(README.en.md · docs/en/X.md)을 확인하라');
});
