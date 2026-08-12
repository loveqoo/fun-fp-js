# Context — 회차 4 재료 조사

리뷰 #2(유도를 규칙으로) 와 #7(`view` 를 코드로 강제) 을 실행 가능한 형태로 확인했다.

## #2 — `Plus` 생성자에서 유도할 때의 걸림돌 하나

리뷰어가 프로토타입으로 **38 파일 통과, −12줄**을 보였고 "`register()` 가
`instance.constructor.name` 을 키로도 쓰므로 이름 처리만 정하면 된다" 고 단서를 달았다.
소스로 확인했다:

```javascript
const register = (target, instance, ...aliases) => {
    target[instance.constructor.name] = instance;          // ← 여기가 문제
    for (const alias of aliases) { target[alias.toLowerCase()] = instance; }
};
```

`Plus` 생성자 안에서 `new Monoid(..., Monoid.types, 'plus(maybe)')` 를 부르면 유도
인스턴스의 `constructor.name` 이 **`Monoid`** 라 `Monoid.types['Monoid']` 가 생긴다.
`ArrayPlus` 와 `MaybePlus` 가 둘 다 그러므로 **나중 것이 앞의 것을 덮는다.**

**해법은 이미 저장소에 있다** — `Maybe.Monoid` (`index.js:1374`) 는 `register()` 를 안 쓰고
키를 직접 넣는다:

```javascript
Monoid.types[`maybe(${key})`] = result;
```

같은 방식을 쓰면 생성자 이름 키가 안 생긴다.

정의 순서도 막지 않는다 — `Monoid` 는 `index.js:459`, `Plus` 는 `:573`.

### 래핑 겹수 (리뷰 #3)

리뷰어 실측: `plus(*)` 의 `concat` 은 **4겹**이다(Alt 2겹 + Semigroup 2겹), 오버헤드 +36%.
Alt 쪽 2겹은 **이번 변경 이전부터 있던 것**이다 — `Plus` 생성자가
`super(alt, alt.alt, type)` 로 이미 래핑된 `alt.alt` 를 다시 넘겨 `Alt` 가 한 번 더 씌운다.

우리가 더한 것은 Semigroup 2겹이고, 바깥 겹은 안쪽보다 검사가 약하거나 같아 **안전성
증가가 0**이다. `Alternative` (`index.js:594`) 가 `this.alt = plus.alt` 로 **재래핑을 피하는
선례**를 이미 갖고 있다.

## #7 — `view` 를 코드가 강제하게 만들기

현재 (`index.js:2413`):

```javascript
const view = (lens, s) => {
    typeof lens !== 'function' && raise(new TypeError('view: optic must be a function'));
    return Maybe.fold(
        () => raise(new TypeError('view: optic has no target — …')),
        a => a,
        preview(lens, s)       // ← 첫 대상만 본다. 몇 개인지 모른다
    );
};
```

`preview` 는 첫 대상만 주므로 **대상이 몇 개인지 알 수 없다.** 그래서 `view(traversed, [1,2,3])`
가 아무 불평 없이 `1` 을 준다 — 세 명세가 "정확히 1대상" 이라 말하는데 코드가 강제하지 않는다.

`toListOf` 기반으로 바꾸면 개수를 안다:

| 대상 수 | 현재 | 바꾼 뒤 |
| --- | --- | --- |
| 0 | TypeError | TypeError (동일) |
| 1 | 그 값 | 그 값 (동일) |
| 2+ | **첫 값** (미보증) | **TypeError** — "Lens 전용" 이 문서가 아니라 코드가 된다 |

비용: `toListOf` 는 전부 모으므로 `preview` 보다 느리다. `view` 는 Lens 전용이라 대상이
1개인 게 정상이므로 실질 차이는 없다.

**`npm run baseline` 격자에 이미 `view 다중` 3줄이 있어** 바꾸면 즉시 표에 잡힌다.

## 이번 회차에 함께 볼 것

| 리뷰 # | 내용 |
| --- | --- |
| 1 | `plus(array)` 가 `Monoid.of('array')` 와 관측 차이 0 — #2 를 하면 자동 해소 |
| 3 | 파생 Semigroup 이 `Semigroup.types` 에 없다 (등록 Monoid 중 유일) |
| 4 | `MonoidInstances` 에 새 키 2개 없음 — TS 에서 호출 불가 |
| 부수 | `index.js:915-919` 와 `CLAUDE.md` 의 Haskell 대응 서술이 부정확 — 두 모노이드는 **값이 다른 경우가 하나도 없고** THROW 여부만 다르다 |

## 이번 회차에 쓸 도구 (회차 3·4 Scaffolding 산출)

`npm run baseline` — 상시 격자 40케이스. 현재 HEAD 대비 11건 차이(전부 계획에 있는 것).
새 표면을 건드리면 줄을 더한다. 레지스트리 키와 최상위 export 목록도 격자에 있다.
