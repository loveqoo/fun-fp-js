/**
 * Identity — 값을 그대로 나르는 상자.
 *
 * `traverse` 에 넘기면 "그냥 매핑" 이 되고, optics 의 `over` 가 그렇게 씁니다.
 * 등록된 인스턴스: Functor / Apply / Applicative / Extend / Comonad (키 `'identity'`).
 *
 * 한때 `{ value }` 객체 리터럴이었습니다. 지금은 클래스입니다 —
 * docs/internals.md#identity-const
 */
import type { IdentityTypeLambda } from "../TypeLambdas";

export declare class Identity<A> {
    readonly value: A;
    readonly _typeName: "Identity";
    private constructor(value: A);
    map<B>(f: (a: A) => B): Identity<B>;
    extend<B>(f: (w: Identity<A>) => B): Identity<B>;
    extract(): A;
    /** 생성자는 비공개다 — 값을 넣는 문은 이것뿐이다. */
    static of<A>(value: A): Identity<A>;
    /** 심볼을 본다. `_typeName` 문자열만 베낀 객체는 여기서 걸린다. */
    static isIdentity(x: unknown): x is Identity<unknown>;
}

export type { IdentityTypeLambda };
