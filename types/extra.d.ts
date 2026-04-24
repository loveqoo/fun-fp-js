/**
 * extra — miscellaneous helpers:
 *   - `path` walks a dotted key string on a nested object, returning
 *     Either<null, T> (Left null if any step missed).
 *   - `template` substitutes `{{key.path}}` placeholders in a message.
 */

import type { Either } from "./data/Either";

export declare const extra: {
    readonly path: (
        keyStr: string
    ) => (data: unknown) => Either<null, unknown>;
    readonly template: (message: string, data: unknown) => string;
};
