// 소스→문서 방향의 게이트 — 공개 이름 전부가 문서 어딘가에 언급된다.
//
// docs-examples 는 문서→소스 방향(적힌 것이 참인가)만 지킨다. 반대 방향(만든 것이 적혀
// 있는가)은 아무도 안 봤고, 실측(2026-08-28) 92개 중 24개가 어느 문서에도 없었다 —
// pipeFrom 은 개명까지 한 이름인데 CHANGELOG 밖에 없었고, setStrictMode 는 문서가 strict
// 모드를 여러 번 말하면서 켜는 문을 안 알려줬다. 이 게이트가 그 방향을 잠근다.
//
// 한계: "언급"은 이름 문자열의 존재다 — 설명이 옳은지는 docs-examples 와 리뷰가 진다.
import { readFileSync, readdirSync } from 'node:fs';
import fp from '../index.js';
import { test, assertEquals, logSection } from './utils.js';

logSection('Docs coverage');

const docs = ['README.ko.md', ...readdirSync('docs').filter(f => f.endsWith('.md')).map(f => 'docs/' + f)]
    .map(f => readFileSync(f, 'utf8')).join('\n');

test('공개 이름 전부가 한국어 문서 어딘가에 언급된다', () => {
    const missing = Object.keys(fp).filter(name => !docs.includes(name));
    assertEquals(missing.join(', '), '', '문서에 언급이 없는 공개 이름 — 새 이름을 내보냈으면 문서(조합자 명부 등)에 적어라');
});

// 영어판도 같은 기준 — 정본에만 적고 번역을 잊는 회귀가 여기 걸린다.
const enDocs = ['README.md', ...readdirSync('docs/en').filter(f => f.endsWith('.md')).map(f => 'docs/en/' + f)]
    .map(f => readFileSync(f, 'utf8')).join('\n');

test('공개 이름 전부가 영어 문서 어딘가에 언급된다', () => {
    const missing = Object.keys(fp).filter(name => !enDocs.includes(name));
    assertEquals(missing.join(', '), '', '영어 문서에 언급이 없는 공개 이름');
});

// 한국어 문서 전부에 영어 짝이 있다 (README 포함 — 번역 게이트는 docs/ 만 본다)
test('한국어 문서마다 영어 짝이 있다', () => {
    const ko = readdirSync('docs').filter(f => f.endsWith('.md'));
    const en = new Set(readdirSync('docs/en').filter(f => f.endsWith('.md')));
    const missing = ko.filter(f => !en.has(f));
    assertEquals(missing.join(', '), '', '영어 짝이 없는 문서');
});
