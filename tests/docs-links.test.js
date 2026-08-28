// Checks every relative markdown link in the docs so a reader never lands on a 404.
//
// 왜 있나: 2026-08-19 에 `./Apply.md`·`./Chain.md` 를 가리키는 링크 **8곳**이 있었는데
// 두 파일은 존재한 적이 없다. GitHub 에서 누르면 404 였고, **아무 게이트도 이것을 안 봤다** —
// 문서 예제 게이트는 코드블록만 본다. 앵커(`#...`)까지 본다: 앵커는 파일보다 조용히 깨진다.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, logSection, allMatches } from './utils.js';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const docsDir = join(rootDir, 'docs');
const enDir = join(docsDir, 'en');

// `[텍스트](./경로.md#앵커)` — 상대 경로만 본다. http(s) 는 이 게이트의 몫이 아니다(네트워크).
const LINK = /\[[^\]]*\]\((\.{1,2}\/[^)\s#]+\.md)(#[^)\s]+)?\)/g;
// 앵커는 `{#이름}` 으로 명시한 것과 GitHub 이 제목에서 만드는 것 둘 다 받는다.
const EXPLICIT_ANCHOR = /\{#([^}]+)\}/g;

const slugOf = heading => heading
    .replace(/\{#[^}]*\}/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-');

const anchorsOf = source => {
    const found = new Set();
    for (const [, name] of allMatches(EXPLICIT_ANCHOR, source)) found.add(name);
    for (const line of source.split('\n')) {
        const m = /^#{1,6}\s+(.*)$/.exec(line);
        if (m) found.add(slugOf(m[1]));
    }
    return found;
};

const files = [
    { label: 'README.md', path: join(rootDir, 'README.md') },
    { label: 'CHANGELOG.md', path: join(rootDir, 'CHANGELOG.md') },
    { label: 'CLAUDE.md', path: join(rootDir, 'CLAUDE.md') },
    ...readdirSync(docsDir).filter(n => n.endsWith('.md')).sort()
        .map(n => ({ label: `docs/${n}`, path: join(docsDir, n) })),
    // 번역본도 본다 — 영어판의 링크가 깨지면 영어 독자만 404 를 맞는다.
    ...(existsSync(enDir)
        ? readdirSync(enDir).filter(n => n.endsWith('.md')).sort()
            .map(n => ({ label: `docs/en/${n}`, path: join(enDir, n) }))
        : []),
    { label: 'README.ko.md', path: join(rootDir, 'README.ko.md') },
];

logSection('Docs links');

let totalLinks = 0;
const anchorCache = new Map();

for (const { label, path } of files) {
    if (!existsSync(path)) continue;
    const source = readFileSync(path, 'utf8');
    const links = allMatches(LINK, source);
    totalLinks += links.length;

    test(`${label} — 상대 링크 ${links.length}개가 실재한다`, () => {
        const broken = [];
        for (const [whole, target, anchor] of links) {
            const resolved = resolve(dirname(path), target);
            if (!existsSync(resolved)) { broken.push(`${whole} — 파일 없음`); continue; }
            if (!anchor) continue;
            if (!anchorCache.has(resolved)) anchorCache.set(resolved, anchorsOf(readFileSync(resolved, 'utf8')));
            if (!anchorCache.get(resolved).has(anchor.slice(1))) broken.push(`${whole} — 앵커 없음`);
        }
        if (broken.length > 0) throw new Error(`깨진 링크 ${broken.length}개\n   ${broken.join('\n   ')}`);
    });
}

console.log(`\n상대 링크 ${totalLinks}개 검사`);

// 추출기가 망가지면 링크 0개를 보고도 초록이 된다.
test('링크 추출기가 살아 있다', () => {
    if (totalLinks < 100) throw new Error(`상대 링크가 ${totalLinks}개뿐이다 — 추출기를 확인하라`);
});
