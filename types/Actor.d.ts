/**
 * Actor — lightweight message queue with sequential handling and
 * optional Task-based async handling.
 */

import type { Task } from "./data/Task";

export interface ActorRef<S, M, R> {
    // Enqueue a message; receive a Task that resolves with the handler's
    // result (or rejects if the handler throws / returns a rejected Task).
    readonly send: (msg: M) => Task<R>;
    // Subscribe to handler completions. Returns an unsubscribe function.
    readonly subscribe: (
        fn: (result: R, state: S) => void
    ) => () => void;
    readonly getState: () => S;
}

// `handle` may return either a synchronous `[result, newState]` pair or a
// Task thereof.
export declare function Actor<S, M, R>(config: {
    readonly init: S;
    readonly handle: (state: S, msg: M) => [R, S] | Task<[R, S]>;
}): ActorRef<S, M, R>;
