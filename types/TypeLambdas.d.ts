/**
 * TypeLambdas for JS built-in types (Array, Function).
 *
 * All per-data-type and transformer TypeLambdas now live in their own
 * files under ./data/ and ./data/transformers/. This file exists solely
 * for built-in JS types that do not have a dedicated data-file module.
 *
 * Ownership map:
 *   Maybe       → ./data/Maybe.d.ts
 *   Either      → ./data/Either.d.ts
 *   Task        → ./data/Task.d.ts
 *   Validation  → ./data/Validation.d.ts
 *   Reader      → ./data/Reader.d.ts
 *   Writer      → ./data/Writer.d.ts
 *   State       → ./data/State.d.ts
 *   Free        → ./data/Free.d.ts
 *   StateT(M)   → ./data/transformers/StateT.d.ts
 *   EitherT(M)  → ./data/transformers/EitherT.d.ts
 *   ReaderT(M)  → ./data/transformers/ReaderT.d.ts
 *   WriterT(M)  → ./data/transformers/WriterT.d.ts
 */

import type { TypeLambda } from "./HKT";
import type { Identity } from "./data/Identity";

export interface ArrayTypeLambda extends TypeLambda {
    readonly type: ReadonlyArray<this["Target"]>;
}

// Identity — 런타임 인스턴스는 진짜 Identity 클래스를 나른다(instanceof 실측 2026-08-28).
// 캐리어 모양({ value })으로 좁히면 map/chain/extract 표면을 잃는다 — 외부 재리뷰 3차 2번.
// (객체 리터럴 타입 안의 this 는 그 리터럴에 묶인다: TS2526 — 이름 붙은 타입 참조 유지)
export interface IdentityTypeLambda extends TypeLambda {
    readonly type: Identity<this["Target"]>;
}

// Const<r> — 담는 모양은 Identity 와 같은 { value } 지만 map 이 값을 버린다.
// 목표 타입이 r 로 고정되므로 Target 을 쓰지 않는다.
export interface ConstTypeLambda extends TypeLambda {
    readonly type: { readonly value: unknown };
}

// Forget<r> — p a b = a -> r. 값 방향을 버리고 r 만 모으는 optics 의 접기 Profunctor.
// (객체 리터럴 타입 안의 this 는 그 리터럴에 묶인다: TS2526 — 캐리어를 이름으로 분리)
export interface ForgetCarrier<In> {
    readonly run: (a: In) => unknown;
}
export interface ForgetTypeLambda extends TypeLambda {
    readonly type: ForgetCarrier<this["In"]>;
}

export interface FunctionTypeLambda extends TypeLambda {
    readonly type: (a: this["In"]) => this["Target"];
}

// Object — Filterable/Foldable 의 'object' 키가 나르는 문자열 키 레코드.
// (객체 리터럴 타입 안의 this 는 그 리터럴에 묶인다: TS2526 — 캐리어를 이름으로 분리)
export interface ObjectCarrier<A> {
    readonly [key: string]: A;
}
export interface ObjectTypeLambda extends TypeLambda {
    readonly type: ObjectCarrier<this["Target"]>;
}

// Tuple — Bifunctor 의 'tuple' 키. bimap 이 [Out2, Target] 두 자리를 함께 변환한다.
export interface TupleTypeLambda extends TypeLambda {
    readonly type: readonly [this["Out2"], this["Target"]];
}

// Tagged — p a b = b. 입력을 무시하는 optics 의 review 전용 Profunctor(Choice 'tagged').
export interface TaggedTypeLambda extends TypeLambda {
    readonly type: this["Target"];
}
