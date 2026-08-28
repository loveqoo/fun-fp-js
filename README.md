# fun-fp-js

> English: [./README.en.md](./README.en.md)

**즐거운 함수형 프로그래밍.** [Static Land](https://github.com/fantasyland/static-land)
기반 타입 클래스 라이브러리입니다. 의존성 0개, min+gzip 26KB.

즐거움은 합성 결과가 예상을 벗어나지 않는 데서 옵니다. 이 라이브러리가 제공하는 타입과
연산은 수학 법칙을 지키도록 만들어졌고, 캐리어가 법칙을 허용하는 범위에서 테스트가
검증합니다. 캐리어 자체가 법칙을 정확히 못 지키는 자리(부동소수 덧셈의 결합법칙 등)는
숨기지 않고 문서에 적어 둡니다([internals](https://github.com/loveqoo/fun-fp-js/blob/main/docs/internals.md#number-sum)). 법칙을 지키는
타입은 조합해도 법칙대로 동작하므로, 사용자는 조합할 때마다 동작 여부를 일일이 시험할
필요가 없습니다. 바로 아래 맛보기가 첫 예입니다. 이름·이메일·나이를 검사하는 함수 세 개를
이으면 합쳐진 검사가 실패한 항목의 에러를 전부 모아 한 번에 돌려줍니다.

```bash
npm install fun-fp-js
```

배포물은 `dist/`(ESM·CJS·min·타입 선언)와 README 뿐입니다 — 소스·테스트는 저장소에 있습니다.

## 맛보기 — 에러를 모아서 한 번에

`try/catch` 는 첫 에러에서 멈춥니다. 에러를 전부 모으려면 사용자가 에러 배열을 직접
관리하는 코드를 짜야 합니다.

```javascript
import fp from 'fun-fp-js';

const { Validation, Applicative, Traversable, sequence } = fp;
const A = Applicative.lookup('validation');
const T = Traversable.lookup('array');

const notEmpty = (field, s) => s.length > 0
    ? Validation.Valid(s) : Validation.Invalid([`${field} 가 비었다`]);
const isEmail = s => s.includes('@')
    ? Validation.Valid(s) : Validation.Invalid(['이메일 형식이 아니다']);
const adult = n => n >= 18
    ? Validation.Valid(n) : Validation.Invalid([`미성년: ${n}`]);

// 검사 셋을 배열로 묶으면 하나의 검사가 된다
const validate = u => sequence(T, A, [notEmpty('name', u.name), isEmail(u.email), adult(u.age)]);

console.log(validate({ name: 'anthony', email: 'a@b.c', age: 40 }).value);
// [ 'anthony', 'a@b.c', 40 ]

console.log(validate({ name: '', email: 'nope', age: 12 }).errors);
// [ 'name 가 비었다', '이메일 형식이 아니다', '미성년: 12' ]   ← 셋 다 모인다
```

## 중첩된 데이터를 불변으로

```javascript
import fp from 'fun-fp-js';

const { Optics } = fp;
const cityL = Optics.compose(Optics.prop('address'), Optics.prop('city'));
const user = { id: 7, address: { city: 'Seoul', zip: '04524' } };

console.log(Optics.view(cityL, user));                        // 'Seoul'
console.log(Optics.set(cityL, 'Busan', user).address.city);   // 'Busan'
console.log(user.address.city);                               // 'Seoul'  원본은 그대로
```

## 가볍다

| | 배포 크기 | 실행 의존성 |
| --- | --- | --- |
| **fun-fp-js** | **0.65 MB** | **0개** |
| sanctuary | 0.23 MB | 7개 |
| immutable | 0.69 MB | 0개 |
| ramda | 1.15 MB | 0개 |
| lodash | 1.35 MB | 0개 |
| rxjs | 4.29 MB | 1개 |
| fp-ts | 4.52 MB | 0개 |

*(다른 줄은 npm 레지스트리의 `dist.unpackedSize`, 2026-08-14 실측. 우리 줄은 `npm pack --dry-run`
으로 2026-08-28 에 다시 쟀습니다 — 파일 8개, unpackedSize 0.65MB, 압축본 0.15MB.)*

표에서 보듯 `sanctuary` 는 우리보다 작습니다. 다만 패키지 7개를 함께 끌고 옵니다.
그리고 우리 0.65MB 에는 ESM·CJS·min·TypeScript 선언 네 벌이 다 들어 있습니다.
실제로 번들에 들어가는 것은 **min+gzip 26KB** 입니다.

의존성이 0개라는 것은 취약점 통지가 우리 것 하나에서만 온다는 뜻이기도 합니다.

## 무엇이 들어 있나

| | |
| --- | --- |
| 타입 클래스 | Static Land 24종 — `Setoid` `Ord` `Monoid` `Functor` `Monad` `Traversable` … |
| 명세 밖 5종 | `MonadError` 실패를 일급으로 · `Reducible` 빈 경우 없는 접기 · optics 가 쓰는 `Strong` `Choice` `Wander` |
| 데이터 타입 | `Maybe` `Either` `Task` `Validation` `NonEmptyList` `Identity` `Reader` `Writer` `State` `Store` `Free` `Actor` |
| optics | `Lens` `Prism` `Iso` `Traversal` — profunctor 인코딩이라 전부 합성된다 |
| 트랜스포머 | `StateT` `EitherT` `ReaderT` `WriterT` |
| Free 사용성 | `Free.api` 어휘 선언 · `Free.interpreters` 해석기 합성 · `start` 협조적 취소 |
| 조합자 | `compose` `pipe` `pipeWhile` `curry` `flip` `converge` `transducer` … |

ESM 과 CommonJS 둘 다, TypeScript 선언 포함. 문법 상한은 **ES2018** 입니다.

**Static Land 호환** — 모든 타입 클래스가 Static Land 인터페이스(정적 메서드, 명세와 같은
인자 순서)를 따릅니다. 클래스 인스턴스지만 메서드가 `this` 에 의존하지 않아 딕셔너리로 떼어
쓸 수 있습니다. **한 가지 이탈**: `Semigroupoid`·`Category` 의 `compose` 는 관례(우→좌,
`fp.compose` 와 같은 방향)를 택해 명세와 방향이 반대입니다. Ramda·Sanctuary 가 사용자에게
주는 방향과 같으며 명세 방향이 필요하면 `pipe` 를 쓰면 됩니다. 근거:
[`docs/internals.md#compose-direction`](https://github.com/loveqoo/fun-fp-js/blob/main/docs/internals.md#compose-direction).

## 문서도 테스트가 검증합니다

**문서의 예제 990개(영어판 포함)를 테스트가 실행하고, 예제에 적힌 `// 기대값` 을 실제 출력과 대조합니다.**
값이 달라지면 테스트와 npm 발행이 멈춥니다. 이 README 의 예제도 그 안에 있습니다.

한계도 적어 둡니다 — 대조는 기대값 주석이 붙은 줄만 봅니다(지금 964줄). 주석 없는 블록
136개는 실행만 되고 값은 안 봅니다(출력 자체가 없는 408개는 대조 대상이 아닙니다). 그리고 정규화가 따옴표를 지우므로 `'1'` 과 `1` 을 못
가릅니다. 그 구분이 필요한 주장은 전용 테스트가 집니다.

저장소 안 문서 사이의 상대 링크와 앵커 592개도 검사합니다 — 그 범위 안에서는 눌러서 404 가 나오는 링크가 없습니다(외부 URL 은 검사 밖입니다).

- [가이드](https://github.com/loveqoo/fun-fp-js/blob/main/docs/README.md) — 학습 순서와 타입별 문서
- [내부 구조](https://github.com/loveqoo/fun-fp-js/blob/main/docs/internals.md) — `index.js` 를 고치는 사람을 위한 것
- [변경 기록](https://github.com/loveqoo/fun-fp-js/blob/main/CHANGELOG.md)

## 상태 — `0.2.x`

**`0.x` 동안 공개 API 는 바뀔 수 있습니다.** 바뀐 것은 전부 버전과 함께
[CHANGELOG](https://github.com/loveqoo/fun-fp-js/blob/main/CHANGELOG.md) 에 적습니다 — `0.1.0` 이후의 파괴적 변경 목록은 `0.2.0` 절에
있습니다.

정확성은 적대적 리뷰(코덱스, `index.js` 전면 감사 열 회차 + 이후 변경마다)와 뮤테이션으로
확인한 게이트가 지킵니다 — 눈에 띄는 수리: `ChainRec`·`Traversable`·`Wander` 법칙 검증,
`Task`·`Actor`·트랜스포머·`Free` 러너에서 **실패가 조용히 사라지던** 결함들.

`1.0.0` 으로 가는 조건은 [CHANGELOG](https://github.com/loveqoo/fun-fp-js/blob/main/CHANGELOG.md#100-까지) 에 적어 두었습니다.

지금 상태에서 지키고 있는 것:

| | |
| --- | --- |
| 타입 클래스 | 29종 (Static Land 24 + 명세 밖 5) |
| 등록된 인스턴스 | 157개 (타입 클래스별 고유 인스턴스의 합) |
| 실행되는 문서 예제 | 990개 (그중 964줄은 값까지 대조) |
| 테스트 파일 | 55개 |
| 배포물 | 0.65MB — ESM·CJS·min·TypeScript 선언 네 벌 |

## 라이선스

MIT
