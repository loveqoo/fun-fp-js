# Setoid

**동등성(Equality)을 비교할 수 있는 타입**

## 개념

Setoid는 두 값이 "같은지" 비교할 수 있는 타입을 정의합니다. JavaScript의 `===`와 비슷하지만, 커스텀 동등성 로직을 정의할 수 있습니다.

## 법칙

Setoid는 다음 법칙을 만족해야 합니다:

### 1. 반사성 (Reflexivity)
```javascript
equals(a, a) === true
```
자기 자신과는 항상 같습니다.

### 2. 대칭성 (Symmetry)
```javascript
equals(a, b) === equals(b, a)
```
비교 순서를 바꿔도 결과가 같습니다.

### 3. 추이성 (Transitivity)
```javascript
if (equals(a, b) && equals(b, c)) {
    equals(a, c) === true
}
```
a가 b와 같고, b가 c와 같으면, a와 c도 같습니다.

## 인터페이스

```javascript
Setoid.equals(a, b): boolean
```

## 사용 예시

### 기본 타입 비교

```javascript
import FunFP from 'fun-fp-js';
const { Setoid } = FunFP;

// 숫자 비교
Setoid.types.NumberSetoid.equals(1, 1);    // true
Setoid.types.NumberSetoid.equals(1, 2);    // false

// 문자열 비교
Setoid.types.StringSetoid.equals('hello', 'hello');  // true

// 불리언 비교
Setoid.types.BooleanSetoid.equals(true, true);  // true

// 배열 비교 (깊은 비교)
Setoid.types.ArraySetoid.equals([1, 2], [1, 2]);  // true
Setoid.types.ArraySetoid.equals([1, 2], [1, 3]);  // false

// 객체 비교 (깊은 비교)
Setoid.types.ObjectSetoid.equals({a: 1}, {a: 1});  // true
```

### 자동 타입 추론

```javascript
// Setoid.of로 타입에 맞는 인스턴스 자동 선택
const numSetoid = Setoid.of('number');
numSetoid.equals(1, 1);  // true
```

## 실용적 활용

### 중복 제거
```javascript
const uniqueBy = (setoid, arr) => arr.reduce((acc, item) => 
    acc.some(x => setoid.equals(x, item)) ? acc : [...acc, item],
    []
);

const numbers = [1, 2, 1, 3, 2];
uniqueBy(Setoid.types.NumberSetoid, numbers);  // [1, 2, 3]
```

### 배열에서 요소 찾기
```javascript
const findBy = (setoid, target, arr) => 
    arr.find(x => setoid.equals(x, target));

findBy(Setoid.types.ObjectSetoid, {id: 1}, [{id: 1, name: 'a'}, {id: 2, name: 'b'}]);
// {id: 1, name: 'a'}
```

## 관련 타입 클래스

- **Ord**: Setoid를 확장하여 순서 비교(`lte`) 추가
