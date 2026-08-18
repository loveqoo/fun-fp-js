// 도그푸딩 3회차 — start/cancel 을 터미널에서 실기로 눌러본다.
//
// 실행:  node .dev/experiment/260819-start-cancel-demo.mjs
// 취소:  다운로드가 도는 중에 Ctrl+C  (협조적 취소 — 비행 중인 단계는 마저 끝나고,
//        다음 명령 경계에서 멈춘다. 두 번째 Ctrl+C 는 무해한 중복 취소다.)
//
// 보는 것:
//   ① 끝까지 두면       → 파일 3개가 전부 "받음" 으로 끝난다
//   ② 중간에 Ctrl+C     → 진행 중이던 파일까지는 받고, 나머지는 시작도 안 한다
//                          거부 사유의 cancelled === true 로 "취소"와 "실패"가 갈린다
import fp from '../../index.js';

const { Free } = fp;

// 어휘 — 내려받기 도메인의 명령 셋
const api = Free.api('log', 'download', 'checksum');

// 프로그램 — 파일 셋을 순서대로 받고 검증한다 (해석기를 모르는 순수 데이터)
const files = ['a.bin', 'b.bin', 'c.bin'];
const program = files.reduce(
    (acc, name) => acc
        .chain(() => api.log(`${name} 받기 시작`))
        .chain(() => api.download(name))
        .chain(sum => api.checksum(name, sum))
        .chain(() => api.log(`${name} 받음 ✓`)),
    api.log(`파일 ${files.length}개 내려받기`)
);

// 해석기 — 다운로드 하나가 1.5초 걸리는 흉내
const wait = ms => new Promise(res => setTimeout(res, ms));
const it = api.interpreter({
    log: msg => { console.log('  ' + msg); },
    download: async name => { await wait(1500); return 'sum:' + name; },
    checksum: async (name, sum) => { await wait(200); return sum === 'sum:' + name; },
});

console.log('시작합니다 — 중간에 Ctrl+C 를 눌러보세요 (약 5초 소요)\n');
const handle = it.start(program);

// Ctrl+C → 협조적 취소. 프로세스는 결과 보고까지 살아 있어야 하므로 exit 하지 않는다.
process.on('SIGINT', () => {
    console.log('\n[Ctrl+C] 취소 요청 — 비행 중인 단계는 마저 끝납니다');
    handle.cancel();
});

handle.promise.then(
    () => console.log('\n완주 — 전부 받았습니다'),
    e => {
        if (e && e.cancelled === true) {
            console.log('\n취소로 멈춤 — 사유:', e.message, '(cancelled === true)');
        } else {
            console.log('\n실패로 멈춤 —', e && e.message);
        }
    }
);
