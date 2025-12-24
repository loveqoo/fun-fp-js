# Fun-FP-JS Project Overview & Context

This document serves as a context provider for AI agents to quickly understand the project structure and technical philosophy.

## 🚀 Project Nature
**Fun-FP-JS** is a robust, production-grade JavaScript functional programming library. It focuses on providing core FP utilities, algebraic data types (Monads, Monoids), and safe execution patterns (Trampolining, Error handling) with a strong preference for **point-free style** and **lazy evaluation**.

## 📂 Folder Structure
- `/modules`: Core logic separated by domain.
    - `func.js`: Basic utilities (`pipe`, `compose`, `curry`, `tap`, etc.).
    - `either.js`: `Either` (Left/Right) Monad for error handling and validation.
    - `monoid.js`: Monoid and Group implementations (Sum, Product, Any, All, etc.).
    - `free.js`: Free Monad and Trampoline for stack-safe recursion.
    - `extra.js`: High-level utilities like a safe `template` engine.
- `/tests`: Unified test suite.
    - `*.test.js`: Functional tests divided by feature.
    - `utils.js`: Shared test utilities (`test`, `assert`, `assertEquals`, `logAssert`).
- `all_in_one.js`: A consolidated, single-file version of the entire library.
- `index.js`: Entry point that initializes the library.
- `test.sh`: Bash script runner that auto-detects and executes all `*.test.js` files.

## 🛠 Technical Principles
1. **Safety First**: Extensive use of `assertFunction` and `runCatch` to ensure runtime safety.
2. **Algebraic Laws**: `Either.ap` follows Applicative laws with error accumulation (concatenating `Left` values if they support it).
3. **Point-free Style**: Functions are designed to be composed without explicit arguments where possible.
4. **Stack Safety**: Recursive operations are handled via `trampoline` and `Free` monad to prevent `RangeError`.
5. **Consolidation**: Any changes to individual modules in `/modules` must be synced to `all_in_one.js`.

## 🔄 Current State (as of 2025-12-24)
- **Unified Testing**: All reproduction scripts and fragmented tests have been moved to `/tests` and renamed to `*.test.js`.
- **Template Engine**: Supports nested paths (e.g., `{{ user.name }}`) and is resilient to spaces in keys (e.g., `{{ user . name }}`).
- **Retry Mechanism**: `once` utility correctly handles failures, allowing retry on exception while caching only successful results.
- **Strict Validation**: `apply2` and similar utilities enforce strict argument counting.

## 📝 Guidelines for Future Tasks
- Always verify changes using `bash test.sh`.
- When modifying core logic, ensure both the specific module and `all_in_one.js` are updated.
- Maintain the "Return-Either" pattern for functions that can fail rather than throwing raw errors.
- Use `tests/utils.js` for any new test files to maintain consistency.
