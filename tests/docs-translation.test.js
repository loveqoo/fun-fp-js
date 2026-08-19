// Keeps the English docs from drifting away from the Korean originals.
//
// 한국어가 정본이고 영어는 번역본이다. 번역은 **산문만** 건드린다 — 코드 블록은 글자까지
// 같아야 한다. 그래야 ① 두 문서가 같은 것을 가르치고 ② 문서 예제 게이트(실행 + 값 대조)가
// 양쪽에 똑같이 돌고 ③ 번역본이 조용히 낡지 않는다. 산문이 낡는 것은 이 게이트가 못 잡는다 —
// 그건 사람이 볼 몫이고, 코드가 갈라지는 것은 기계가 볼 몫이다.
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
    test(`${label} — 영어판의 코드 블록이 정본과 같다`, () => {
        const a = fencesOf(readFileSync(ko, 'utf8'));
        const b = fencesOf(readFileSync(en, 'utf8'));
        if (a.length !== b.length) {
            throw new Error(`코드 블록 수가 다르다 — 정본 ${a.length}개, 영어판 ${b.length}개`);
        }
        const diff = [];
        a.forEach((block, i) => {
            if (block.code !== b[i].code) diff.push(`${i + 1}번째 블록의 코드가 다르다`);
            else if (block.info !== b[i].info) diff.push(`${i + 1}번째 블록의 펜스 정보가 다르다 ('${block.info}' vs '${b[i].info}')`);
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
