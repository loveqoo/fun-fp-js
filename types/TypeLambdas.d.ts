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

export interface FunctionTypeLambda extends TypeLambda {
    readonly type: (a: this["In"]) => this["Target"];
}
