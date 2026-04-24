/**
 * Runtime configuration hooks.
 */

// Toggle strict-mode runtime type checking. Default is on in dev
// environments (NODE_ENV !== 'production') and off otherwise.
export declare function setStrictMode(val: boolean): void;

// Install a handler for errors thrown inside `tap` side-effects. Default
// is a silent no-op.
export declare function setTapErrorHandler(
    handler: (e: unknown) => void
): void;
