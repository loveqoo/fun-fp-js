// Identity 가 진짜 타입인지 — 선언이 실제로 쓰이는지 본다.
// "tsc 통과" 는 영수증이 아니다. 선언이 파일에 있어도 쓰이지 않으면 통과한다.
import { Identity } from "../data/Identity";
import type { Equals, Expect } from "./_test-utils";

const id = Identity.of(42);
type _i1 = Expect<Equals<typeof id, Identity<number>>>;

const mapped = id.map((n) => `${n}`);
type _i2 = Expect<Equals<typeof mapped, Identity<string>>>;

const inner = id.extract();
type _i3 = Expect<Equals<typeof inner, number>>;

const extended = id.extend((w) => w.value + 1);
type _i4 = Expect<Equals<typeof extended, Identity<number>>>;

const tag: "Identity" = id._typeName;

// 위조 판별은 타입 좁히기까지 해야 한다.
declare const unknownValue: unknown;
if (Identity.isIdentity(unknownValue)) {
    type _i5 = Expect<Equals<typeof unknownValue, Identity<unknown>>>;
}

// 생성자는 막혀 있다 — of 만이 문이다.
// @ts-expect-error 생성자는 비공개다
const forbidden = new Identity(1);
