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

// `handle` may return a synchronous `[result, newState]` pair, a Promise of one, or a
// Task thereof.
export declare function Actor<S, M, R>(config: {
    readonly init: S;
    readonly handle: (state: S, msg: M) => [R, S] | Promise<[R, S]> | Task<[R, S]>;
    // Subscribers see results in message order. Set false for the pre-2026-08-19
    // behaviour, where the queue advanced before notifying and notifications could
    // arrive out of order. Defaults to true.
    readonly notifyInOrder?: boolean;
    // Milliseconds a single handler may take before its message is rejected with a
    // `timedOut: true` error and the queue moves on. Defaults to 1000; pass Infinity
    // to wait forever. Where timers are unavailable (Google Apps Script has no
    // setTimeout) the deadline is checked at the next queue boundary instead.
    readonly timeout?: number;
}): ActorRef<S, M, R>;
