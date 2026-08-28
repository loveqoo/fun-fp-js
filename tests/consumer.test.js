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
import fp from '../index.js';
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

// 표면 전수 게이트 — 런타임 공개 이름 전원을 값으로 import 해 선언과 대조한다.
// 외부 리뷰(2026-08-28)가 여섯 이름의 선언 누락/타입 전용을 잡았다: fst·snd 는 선언이
// 없었고 Strong·Choice·Wander 는 타입으로만 있었다. 픽스처를 런타임에서 생성하므로
// 새 공개 이름이 선언 없이 추가되면 여기서 빨강이 난다.
test('공개 이름 전원이 값으로 선언되어 있고, 선언이 런타임 사실과 정합한다', () => {
    const tsc = join(rootDir, 'node_modules', '.bin', 'tsc');
    assertEquals(existsSync(tsc), true, 'tsc 가 없다 — devDependencies 를 설치하라');
    const dir = mkdtempSync(join(tmpdir(), 'funfp-surface-'));
    const names = Object.keys(fp).sort();
    // 배열 리터럴 하나에 92개를 넣으면 TS2589(재귀 한도) — 이름별 void 로 값 사용만 만든다
    writeFileSync(join(dir, 'roster.ts'),
        `import { ${names.join(', ')} } from ${JSON.stringify(distEsm)};\n` +
        names.map(n => `void ${n};`).join('\n') + '\n');
    // 같은 리뷰의 선언↔런타임 불일치 세 건을 컴파일 주장으로 고정한다
    writeFileSync(join(dir, 'claims.ts'),
        `import { Traversable, Applicative, MonadError, Choice, Maybe, Either, Semigroup, Monoid } from ${JSON.stringify(distEsm)};\n` +
        `import type { Either as E } from ${JSON.stringify(distEsm)};\n` +
        // traverse 는 런타임처럼 3인자 — 커링 호출은 오류여야 한다
        `const trav = Traversable.lookup('array');\n` +
        `const app = Applicative.lookup('maybe');\n` +
        `void trav.traverse(app, (n: number) => Maybe.Just(n + 1), [1, 2, 3]);\n` +
        `// @ts-expect-error traverse 는 커링이 아니다\n` +
        `void trav.traverse(app);\n` +
        // Choice.left 는 Left 쪽 변환 (런타임 실측 Left(3) → Left(6))
        `const l: (e: E<number, string>) => E<number, string> =\n` +
        `    Choice.lookup('function').left((n: number) => n * 2);\n` +
        `void l(Either.Left(3) as E<number, string>);\n` +
        // raiseError 는 문맥에서 슬롯을 추론하고, handleError 는 실제 값을 받는다 (never 오염 금지)
        `const ME = MonadError.lookup('either');\n` +
        `const e: E<string, number> = ME.raiseError('boom');\n` +
        `void ME.handleError(() => Either.Right(0) as unknown as E<string, number>, e);\n` +
        // 에러 채널은 raiseError 인자 타입을 따른다 (재리뷰 3차 3번 — unsound 대입 차단)
        `// @ts-expect-error string 에러를 number 채널에 못 넣는다\n` +
        `const badE: E<number, string> = ME.raiseError('boom');\n` +
        `void badE;\n` +
        // identity 인스턴스는 진짜 Identity 표면을 나른다 (재리뷰 3차 2번 — 캐리어 축소 금지)
        `void Applicative.lookup('identity').of(1).map((n: number) => n + 1);\n` +
        // 타입 클래스 직접 생성이 선언에도 있다 (재리뷰 3차 4번 — 문서 26곳이 가르치는 문)
        `const sg = new Semigroup((a: number, b: number) => a + b, 'number');\n` +
        `void new Monoid(sg, () => 0, 'number');\n`);
    const r = spawnSync(tsc, ['--noEmit', '--strict', '--module', 'nodenext',
        '--moduleResolution', 'nodenext', '--target', 'es2020',
        join(dir, 'roster.ts'), join(dir, 'claims.ts')], { encoding: 'utf8' });
    assertEquals(r.status, 0, `표면 대조 실패 (${names.length}개 이름)\n${(r.stdout || '').split('\n').slice(0, 8).join('\n')}`);
});

// 레지스트리 대조 게이트(정방향) — 런타임 lookup 키 전원이 TS 에서도 통한다.
// 재리뷰 3차 1번: 런타임엔 있는데 TS 등록이 빠진 키가 26개였다(function·identity·
// store·tuple·tagged·object·date·default·Kleisli 셋 등). 역방향(TS 유령 키)은 팩토리
// 실행 뒤에만 런타임 키가 생겨 전수 대조가 안 된다 — 실측으로 잡힌 유령 키 하나
// (Contravariant 'function', 런타임 키는 'predicate')만 고정해 둔다.
test('런타임 레지스트리 키 전원이 TS lookup 에서 통한다', () => {
    const tsc = join(rootDir, 'node_modules', '.bin', 'tsc');
    assertEquals(existsSync(tsc), true, 'tsc 가 없다 — devDependencies 를 설치하라');
    const dir = mkdtempSync(join(tmpdir(), 'funfp-registry-'));
    const classes = Object.keys(fp)
        .filter(n => fp[n] && fp[n].types && typeof fp[n].lookup === 'function').sort();
    const lines = [];
    for (const c of classes) {
        // 소문자 시작 키가 lookup 키다 — 대문자 키는 클래스 이름(표시용)
        for (const k of Object.keys(fp[c].types).filter(k => k[0] === k[0].toLowerCase()).sort()) {
            lines.push(`void ${c}.lookup(${JSON.stringify(k)});`);
        }
    }
    writeFileSync(join(dir, 'parity.ts'),
        `import { ${classes.join(', ')} } from ${JSON.stringify(distEsm)};\n` +
        lines.join('\n') + '\n' +
        `// @ts-expect-error 런타임 키는 'predicate' — 'function' 은 유령 키였다\n` +
        `void Contravariant.lookup('function');\n`);
    const r = spawnSync(tsc, ['--noEmit', '--strict', '--module', 'nodenext',
        '--moduleResolution', 'nodenext', '--target', 'es2020', join(dir, 'parity.ts')],
        { encoding: 'utf8' });
    assertEquals(r.status, 0, `레지스트리 대조 실패 (${classes.length}개 클래스, ${lines.length}개 키)\n${(r.stdout || '').split('\n').slice(0, 8).join('\n')}`);
});
