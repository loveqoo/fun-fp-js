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

export interface ArrayTypeLambda extends TypeLambda {
    readonly type: ReadonlyArray<this["Target"]>;
}

// Identity — traverse 에 넘겨 "그냥 매핑" 으로 쓰는 Applicative. 담는 모양은 { value }.
export interface IdentityTypeLambda extends TypeLambda {
    readonly type: IdentityCarrier<this["Target"]>;
}
// 객체 리터럴 타입 안의 this 는 그 리터럴에 묶인다(TS2526) — 캐리어 모양을 이름으로 분리
export interface IdentityCarrier<A> {
    readonly value: A;
}

// Const<r> — 담는 모양은 Identity 와 같은 { value } 지만 map 이 값을 버린다.
// 목표 타입이 r 로 고정되므로 Target 을 쓰지 않는다.
export interface ConstTypeLambda extends TypeLambda {
    readonly type: { readonly value: unknown };
}

export interface FunctionTypeLambda extends TypeLambda {
    readonly type: (a: this["In"]) => this["Target"];
}
