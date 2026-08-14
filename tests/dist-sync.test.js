// 게이트 ⑤ — dist/ 가 지금의 index.js 를 빌드한 결과와 같은가.
//
// 왜 있나: 진실 소스는 index.js 하나뿐이고 dist/ 는 그것을 문자열로 변환한 것이다. 그래서
// "dist 는 index.js 와 같다" 고 말할 수 있다 — **빌드를 돌렸을 때만**. 안 돌리면 dist 는
// 옛 index.js 의 사본으로 남고, 그 순간 사용자가 받는 것과 소스가 달라진다. 실제로 겪었다:
// index.js 에서 ?. 를 지운 뒤에도 dist 에는 ?. 4건과 ?? 3건이 그대로 있었다.
//
// 이 검사가 초록이면 index.js 에 대해 증명한 것이 dist 에도 그대로 성립한다. 그래서
// ES 상한 검사(es-ceiling)는 dist 를 따로 훑지 않는다 — 훑을 필요가 없다.
//
// 변환을 베끼지 않는다: build.js 의 buildOutputs 를 그대로 불러 쓴다. 검사가 변환 규칙을
// 복사해 두면 build.js 가 바뀔 때 조용히 어긋나고, 그때 이 검사는 거짓 초록이 된다.
//
// 진실 소스는 둘이다. index.js -> 세 JS 산출물, types/ -> dist/fun-fp.d.ts. 둘 다 본다.
//
// 못 잡는 것:
// ① 빌드 시각(헤더의 Built)은 의도된 차이라 지운 뒤 비교한다. 시각만 바꿔치기한 위조는
//    이 검사의 관심사가 아니다.
// ② types/__tests__/*.test-d.ts 는 배포물이 아니라 명단 대조에서 뺀다.
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildOutputs } from '../build.js';
import { buildTypeDeclarations, TYPE_FILES } from '../build-types.js';
import { test, assertEquals } from './utils.js';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (...p) => readFileSync(join(rootDir, ...p), 'utf8');

const source = read('index.js');
// 헤더의 빌드 시각은 매 빌드마다 다르다. 민파일은 콜론 뒤 공백까지 지워져 `Built:2026-…`
// 가 되므로 \s* 가 필요하다 — 이것을 빠뜨려 처음에 대조가 어긋났다.
const stripBuiltAt = text => text.replace(/Built:\s*[0-9TZ:.\-]+/g, 'Built:X');

// 양쪽이 같은 정규화를 지나야 한다 — 여기에 'X' 를 바로 넣으면 치환 대상이 아니어서
// 기대값만 정규화를 안 거치고, 그 비대칭이 거짓 실패를 만든다(겪었다).
const expected = buildOutputs(source, '1970-01-01T00:00:00.000Z');
const OUTPUTS = [
    ['dist/fun-fp.js', 'esm'],
    ['dist/fun-fp.cjs', 'cjs'],
    ['dist/fun-fp.min.cjs', 'min'],
];

console.log('\n=== dist 동기화 게이트 ===\n');

// 어긋난 지점을 줄 번호로 짚어 준다 — 12만 자짜리 파일에 "다름" 만 찍으면 쓸모가 없다.
const firstDifference = (a, b) => {
    const la = a.split('\n'), lb = b.split('\n');
    for (let i = 0; i < Math.max(la.length, lb.length); i++) {
        if (la[i] !== lb[i]) {
            const cut = s => s === undefined ? '(줄 없음)' : (s.length > 90 ? s.slice(0, 90) + '…' : s);
            return `      첫 차이 ${i + 1}번째 줄\n        빌드 결과: ${cut(lb[i])}\n        dist 파일: ${cut(la[i])}`;
        }
    }
    return '      줄 단위로는 같다 — 줄 수만 다르다';
};

for (const [file, key] of OUTPUTS) {
    test(`${file} 이 현재 index.js 의 빌드 결과와 같다`, () => {
        const actual = stripBuiltAt(read(...file.split('/')));
        const want = stripBuiltAt(expected[key]);
        assertEquals(actual === want, true,
            `${file} 이 index.js 와 어긋난다. npm run build 를 돌려라.\n` +
            firstDifference(actual, want) + '\n');
    });
}

// ESM 은 헤더 + 소스 그대로다. 이 관계가 깨지면 "dist 는 index.js 와 같다" 는 말 자체가
// 성립하지 않으므로 따로 못 박는다.
test('dist/fun-fp.js 는 헤더를 떼면 index.js 와 글자까지 같다', () => {
    const esm = read('dist', 'fun-fp.js');
    const HEADER = /^\/\*\*\n \* Fun-FP-JS[^]*?\n \*\/\n/;
    assertEquals(HEADER.test(esm), true, 'ESM 산출물의 헤더 모양이 예상과 다르다');
    assertEquals(esm.replace(HEADER, '') === source, true,
        'ESM 산출물에서 헤더를 뗀 나머지가 index.js 와 다르다 — npm run build 를 돌려라');
});

// ── 타입 선언: 진실 소스가 types/ 라 위와 짝이 다르다 ──

const typesDir = join(rootDir, 'types');
const readType = rel => readFileSync(join(typesDir, rel), 'utf8');
const expectedDts = buildTypeDeclarations(readType, '1970-01-01T00:00:00.000Z');

test('dist/fun-fp.d.ts 가 현재 types/ 의 빌드 결과와 같다', () => {
    const actual = stripBuiltAt(read('dist', 'fun-fp.d.ts'));
    const want = stripBuiltAt(expectedDts);
    assertEquals(actual === want, true,
        'dist/fun-fp.d.ts 가 types/ 와 어긋난다. npm run build 를 돌려라.\n' +
        firstDifference(actual, want) + '\n');
});

// build-types.js 의 파일 명단은 손으로 적는다. 새 선언 파일을 만들고 명단에 안 넣으면
// 배포되는 .d.ts 에서 조용히 빠진다 — 타입만 사라지므로 런타임 테스트로는 안 잡힌다.
test('types/ 의 선언 파일이 전부 빌드 명단에 있다', () => {
    const walk = dir => readdirSync(dir, { withFileTypes: true }).reduce((acc, e) => {
        const full = join(dir, e.name);
        if (e.isDirectory()) return e.name === '__tests__' ? acc : acc.concat(walk(full));
        return e.name.endsWith('.d.ts') && !e.name.endsWith('.test-d.ts') ? acc.concat([full]) : acc;
    }, []);
    const onDisk = walk(typesDir).map(p => relative(typesDir, p).split(sep).join('/')).sort();
    const listed = [...TYPE_FILES].sort();
    const missing = onDisk.filter(f => !listed.includes(f));
    const ghost = listed.filter(f => !onDisk.includes(f));
    assertEquals(missing, [], `types/ 에 있는데 build-types.js 명단에 없다 — 배포에서 빠진다:\n      ${missing.join('\n      ')}`);
    assertEquals(ghost, [], `명단에 있는데 실재하지 않는다:\n      ${ghost.join('\n      ')}`);
});

// 이 게이트가 눈을 뜨고 있는지 스스로 본다. 소스를 한 글자 바꾼 채로 빌드하지 않은 상황을
// 흉내 내어, 검사가 그것을 다르다고 말하는지 확인한다.
test('게이트가 실제로 탐지한다 (자기검사)', () => {
    const tampered = source.replace('const polyfills', 'const polyfills /* 심은 결함 */');
    assertEquals(tampered === source, false, '결함을 심을 자리를 못 찾았다 — 자기검사가 공허하다');
    const rebuilt = buildOutputs(tampered, '1970-01-01T00:00:00.000Z');
    assertEquals(stripBuiltAt(rebuilt.esm) === stripBuiltAt(expected.esm), false,
        '소스를 바꿨는데 빌드 결과가 같다고 나온다 — 이 게이트는 아무것도 안 보고 있다');
    assertEquals(stripBuiltAt(rebuilt.cjs) === stripBuiltAt(expected.cjs), false,
        'cjs 도 소스 변화를 반영해야 한다');

    const tamperedDts = buildTypeDeclarations(
        rel => readType(rel).replace('export', 'export /* 심은 결함 */'),
        '1970-01-01T00:00:00.000Z');
    assertEquals(stripBuiltAt(tamperedDts) === stripBuiltAt(expectedDts), false,
        'types/ 를 바꿨는데 빌드 결과가 같다고 나온다 — .d.ts 쪽은 아무것도 안 보고 있다');
});
