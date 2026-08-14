/**
 * Identity — 값을 그대로 나르는 상자.
 *
 * `traverse` 에 넘기면 "그냥 매핑" 이 되고, optics 의 `over` 가 그렇게 씁니다.
 * 등록된 인스턴스: Functor / Apply / Applicative / Extend / Comonad (키 `'identity'`).
 *
 * 한때 `{ value }` 객체 리터럴이라 평범한 객체와 구분되지 않았습니다. 지금은 클래스이고
 * 심볼을 지녀 `isIdentity` 가 위조를 가릅니다 — docs/internals.md#identity-const
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
    /** 문자열 표식은 베낄 수 있지만 심볼은 못 베낀다 — 이것만이 위조를 가른다. */
    static isIdentity(x: unknown): x is Identity<unknown>;
}

export type { IdentityTypeLambda };
