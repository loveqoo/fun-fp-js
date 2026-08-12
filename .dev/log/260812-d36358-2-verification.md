# Verification — 회차 2 (리뷰 12건 반영)

## 계획서 항목 대조

| 항목 | 판정 | 근거 |
| --- | --- | --- |
| **B #5 에러 귀속 회귀** | ✅ | 8개 연산 전부 자기 이름으로 던진다 (아래 표) |
| **C #6 `foldMapOf` 검사** | ✅ | 6가지 optic 종류 **전부** 거부. 뮤테이션 1건 검거 |
| **D #4 d.ts 12키** | ✅ | 뮤테이션 재측정 **12/12 검거** (전에는 6/12) |
| **G #10 주석의 거짓 근거** | ✅ | 성능 근거 제거 + "성능을 근거로 삼지 마라" 명시 |
| **F #8 `foldMapOf` 문서** | ✅ | `docs/Optics.md` 4블록 + 연산 표 행. 문서 예제 검사기 통과 |
| #7 격자 42케이스 사망 | ✅ | 리뷰어가 읽기 전에 이미 고침 (`is not a function` 0건) |
| **A #11 네이밍 관례 명문화** | ⏳ | `CLAUDE.md` = context 클래스 → Compounding |
| **E #9 `CLAUDE.md` 사실 오류** | ⏳ | 같음 |
| #1·#2·#3 등록 계층 | ⏳ | 다음 회차 (계획서 「범위 밖」) |

## 에러 귀속 — 8개 연산 실측

```
preview    => preview: optic must be a function
toList     => toList: optic must be a function
view       => view: optic must be a function
foldMapOf  => foldMapOf: optic must be a function
over       => over: optic must be a function
set        => set: optic must be a function
review     => review: prism must be a function
compose    => Optics.compose: argument 0 must be an optic
```

**격자에 5줄을 추가해 이 자리를 상시 감시한다** — 회귀가 잠복했던 이유가 감시가 없어서였다.
현재 `preview`/`view`/`over`/`review` 는 HEAD 와 동일, `toList` 만 이름 변경에 따른 의도된 차이.

## `foldMapOf` 검사 — optic 종류와 무관하게 균일

```
Lens / Iso / Prism(매치) / Prism(실패) / Traversal / 합성   → 6/6 THROW ✓
```

전에는 `first` 경로(Lens·Iso)가 monoid 를 안 만져서 **쓰레기 monoid 로도 조용히 통과**했다.

### 리뷰어 권고를 채택하지 않았다 — 근거

리뷰어는 `Symbols.Monoid` 를 요구하면 Static Land 이점 ③(등록 안 된 인스턴스 수용)이
죽는다며 duck-typing 을 권했다. **실측으로 확인한 결과 그 전제가 틀렸다:**

```
기존 foldMap(foldable, monoid) — index.js:1959
  리터럴 { empty, concat }        → THROW 'foldMap: second argument must be a Monoid'
  new Monoid(...) 사용자 인스턴스  → 6  (통과)

foldMapOf 도 동일하게
  new Monoid(new Semigroup((a,b)=>a+b,'number'), ()=>0, 'number')  → traversal·Lens 둘 다 통과
```

**리터럴이 Lens 에서만 통과했던 것은 `first` 경로가 monoid 를 안 만져서 생긴 우연**이지
설계된 통로가 아니었다. traversal 은 `Applicative.Const` 의 `checkAndSet('Monoid.super')` 가
이미 거부하고 있었다 — 즉 **전부터 일관성이 없었다.**

이점 ③ 은 `new Monoid(...)` 로 유지된다. 등록이 아니라 **생성**이 통로다.

## 뮤테이션 3건 — 이번에 넣은 검사가 전부 잡힌다

| 지운 것 | 결과 |
| --- | --- |
| `foldMapOf` 의 monoid 검사 | 1건 빨간불 |
| `foldMapOf` 의 f 검사 | 2건 빨간불 |
| `preview` 의 귀속 검사 | 2건 빨간불 |

## 부수 — 메시지 형식을 파일 관례에 맞췄다

`types.checkFunction(f, 'foldMapOf')` 는 `Argument must be a function: foldMapOf` 로
**접미사** 형식이라 파일의 `over: f must be a function` 관례와 달랐다. 직접 raise 로 바꿔
`foldMapOf: f must be a function` 이 되게 했다.

## 현재 상태

```
npm test          38 files passed, 0 failed  (문서 예제 379개)
tsc --noEmit      통과
npm run baseline  58케이스, 차이 14건 (전부 계획된 변경)
```

리뷰어 2차가 백그라운드 실행 중이다.
