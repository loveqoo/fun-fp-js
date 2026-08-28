// 소비자 관점 게이트 — 배포물(dist)을 소비자가 쓰는 그대로 검사한다.
//
// 왜 있나: 0.2.1 까지 d.ts 는 named export 를 약속했지만 런타임은 default 뿐이라
// `import { Maybe }` 가 TypeScript 는 통과하고 런타임에서 죽었다. 그리고 우리 typecheck 는
// skipLibCheck 라 d.ts 자체를 검사한 적이 없어, 번들에 TS2395 ×138 등 잠복 오류가 쌓였다
// (외부 리뷰 + nodenext 소비자 재현, 2026-08-28). 이 게이트는 둘 다 소비자 자리에서 본다.
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { test, assertEquals, logSection } from './utils.js';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const distEsm = join(rootDir, 'dist', 'fun-fp.js');

logSection('Consumer surface');

test('dist ESM 이 named export 를 제공하고 default 와 같은 명단이다', () => {
    // 동적 import() 는 ES2020 이라 상한 위반 — 자식 프로세스의 정적 import 로 검사한다
    const r = spawnSync(process.execPath, ['--input-type=module', '-e',
        `import * as ns from ${JSON.stringify(pathToFileURL(distEsm).href)};\n` +
        `const named = Object.keys(ns).filter(k => k !== 'default').sort();\n` +
        `const dflt = Object.keys(ns.default).sort();\n` +
        `if (JSON.stringify(named) !== JSON.stringify(dflt)) { console.error('명단 불일치'); process.exit(1); }\n` +
        `for (const k of named) if (ns[k] !== ns.default[k]) { console.error('다른 값: ' + k); process.exit(1); }\n` +
        `console.log(named.length);`
    ], { encoding: 'utf8' });
    assertEquals(r.status, 0, `named/default 대조 실패\n${(r.stderr || '').slice(0, 200)}`);
    assertEquals(parseInt(r.stdout, 10) >= 92, true, 'named export 수가 92개 미만이다');
});

test('named import 가 실행된다 (0.2.1 의 SyntaxError 재발 방지)', () => {
    const r = spawnSync(process.execPath, ['--input-type=module', '-e',
        `import { Maybe, Store, pipe } from ${JSON.stringify(pathToFileURL(distEsm).href)};\n` +
        `if (String(Maybe.Just(1)) !== 'Just(1)') throw new Error('Maybe');\n` +
        `if (!Store.isStore(new Store(x => x, 0))) throw new Error('Store');\n` +
        `if (pipe(x => x + 1)(1) !== 2) throw new Error('pipe');`
    ], { encoding: 'utf8' });
    assertEquals(r.status, 0, `named import 실행 실패\n${(r.stderr || '').slice(0, 300)}`);
});

test('배포 d.ts 가 nodenext 소비자 설정에서 오류 없이 컴파일된다', () => {
    const tsc = join(rootDir, 'node_modules', '.bin', 'tsc');
    assertEquals(existsSync(tsc), true, 'tsc 가 없다 — devDependencies 를 설치하라');
    const dir = mkdtempSync(join(tmpdir(), 'funfp-consumer-'));
    // skipLibCheck 없이 — 우리 typecheck 가 못 보는 d.ts 자체를 소비자 설정으로 검사한다
    writeFileSync(join(dir, 't.ts'),
        `import { Maybe, Store, ReaderT } from ${JSON.stringify(distEsm)};\n` +
        `const a = Maybe.Just(1);\nconst w = new Store((x: number) => x, 0);\n`);
    const r = spawnSync(tsc, ['--noEmit', '--strict', '--module', 'nodenext',
        '--moduleResolution', 'nodenext', '--target', 'es2020', join(dir, 't.ts')],
        { encoding: 'utf8' });
    assertEquals(r.status, 0, `번들 d.ts 컴파일 실패\n${(r.stdout || '').split('\n').slice(0, 6).join('\n')}`);
});
