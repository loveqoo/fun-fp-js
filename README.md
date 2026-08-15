# fun-fp-js

**즐거운 함수형 프로그래밍.** [Static Land](https://github.com/fantasyland/static-land)
기반 타입 클래스 라이브러리입니다. 의존성 0개, gzip 21KB.

즐거움은 **합성이 놀라지 않는 데서** 옵니다. 법칙이 성립하니까 렌즈 두 개를 이으면 그냥
되고, 검증 세 개를 이으면 에러가 쌓입니다. "이게 될까?" 하고 시험해 볼 필요가 없습니다.

```bash
npm install fun-fp-js
```

## 맛보기 — 에러를 모아서 한 번에

`try/catch` 는 첫 에러에서 멈추고, 직접 짜면 배열에 밀어 넣는 코드가 됩니다.

```javascript
import fp from 'fun-fp-js';

const { Validation, Applicative } = fp;
const A = Applicative.lookup('validation');

const notEmpty = (field, s) => s.length > 0
    ? Validation.Valid(s) : Validation.Invalid([`${field} 가 비었다`]);
const isEmail = s => s.includes('@')
    ? Validation.Valid(s) : Validation.Invalid(['이메일 형식이 아니다']);
const adult = n => n >= 18
    ? Validation.Valid(n) : Validation.Invalid([`미성년: ${n}`]);

const mkUser = name => email => age => ({ name, email, age });
const validate = u =>
    A.ap(A.ap(A.ap(A.of(mkUser), notEmpty('name', u.name)), isEmail(u.email)), adult(u.age));

console.log(validate({ name: 'anthony', email: 'a@b.c', age: 40 }).value);
// { name: 'anthony', email: 'a@b.c', age: 40 }

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
| **fun-fp-js** | **0.50 MB** | **0개** |
| sanctuary | 0.23 MB | 7개 |
| immutable | 0.69 MB | 0개 |
| ramda | 1.15 MB | 0개 |
| lodash | 1.35 MB | 0개 |
| rxjs | 4.29 MB | 1개 |
| fp-ts | 4.52 MB | 0개 |

*(npm 레지스트리의 `dist.unpackedSize`, 2026-08-14 실측)*

**정직하게 — `sanctuary` 는 우리보다 작습니다.** 다만 패키지 7개를 함께 끌고 옵니다.
그리고 우리 0.50MB 에는 ESM·CJS·min·TypeScript 선언 **네 벌이 다 들어 있습니다.**
실제로 번들에 들어가는 것은 **gzip 21KB** 입니다.

의존성이 0개라는 것은 **취약점 통지가 우리 것 하나에서만 온다**는 뜻이기도 합니다.

## 무엇이 들어 있나

| | |
| --- | --- |
| 타입 클래스 | Static Land 24종 — `Setoid` `Ord` `Monoid` `Functor` `Monad` `Traversable` … |
| 데이터 타입 | `Maybe` `Either` `Task` `Validation` `Reader` `Writer` `State` `Free` `Actor` |
| optics | `Lens` `Prism` `Iso` `Traversal` — profunctor 인코딩이라 전부 합성된다 |
| 트랜스포머 | `StateT` `EitherT` `ReaderT` `WriterT` |
| 조합자 | `compose` `pipe` `pipeWhile` `curry` `flip` `converge` `transducer` … |

ESM 과 CommonJS 둘 다, TypeScript 선언 포함. 문법 상한은 **ES2018** 입니다.

**Static Land 호환** — 모든 타입 클래스가 Static Land 인터페이스(정적 메서드, 명세와 같은
인자 순서)를 따르고, 클래스 인스턴스지만 메서드가 `this` 에 의존하지 않아 딕셔너리로 떼어
쓸 수 있습니다. **한 가지 이탈**: `Semigroupoid`·`Category` 의 `compose` 는 관례(우→좌,
`fp.compose` 와 같은 방향)를 택해 명세와 방향이 반대입니다 — Ramda·Sanctuary 가 사용자에게
주는 방향과 같으며, 명세 방향이 필요하면 `pipe` 를 쓰면 됩니다. 근거:
[`docs/internals.md#compose-direction`](./docs/internals.md#compose-direction).

## 문서가 낡지 않습니다

**문서의 예제 434개를 테스트가 실행합니다.** 설명이 코드와 어긋나면 빌드가 멈춥니다.
이 README 의 예제도 그 안에 있습니다.

- [가이드](./docs/README.md) — 학습 순서와 타입별 문서
- [내부 구조](./docs/internals.md) — `index.js` 를 고치는 사람을 위한 것
- [변경 기록](./CHANGELOG.md)

## 상태 — `0.1.0`

**아직 굳지 않았습니다.** `0.x` 인 이유가 있습니다 — 최근에도 정확성 결함을 고치느라 공개
표면이 여러 번 바뀌었습니다. 그 대부분은 적대적 리뷰와 새로 세운 검사 장치가 찾은 것이고,
공개 표면이 아직 움직이는 중이라 `0.x` 로 둡니다. `ChainRec`·`Traversable`·`Wander` 의 법칙은
이제 게이트가 돌고, `Task`·`Actor`·트랜스포머의 "실패가 조용히 사라지던" 자리들도 막았습니다.

`1.0.0` 으로 가는 조건은 [CHANGELOG](./CHANGELOG.md#100-까지) 에 적어 두었습니다.

지금 상태에서 지키고 있는 것:

| | |
| --- | --- |
| 등록된 인스턴스 | 131개 |
| 법칙이 도는 인스턴스 | 149개 |
| 실행되는 문서 예제 | 434개 |
| 테스트 파일 | 45개 |

## 라이선스

MIT
