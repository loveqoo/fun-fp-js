---
description: Fun-FP-JS 프로젝트 개요 및 기술 철학
---

# Fun-FP-JS Project Overview & Context
This document serves as a context provider for AI agents to quickly understand the project structure and technical philosophy.

## Project Nature
Fun-FP-JS is a robust, production-grade JavaScript functional programming library. 

It focuses on providing core FP utilities, algebraic data types (Monads, Monoids), and safe execution patterns (Trampolining, Error handling) with a strong preference for point-free style and lazy evaluation.

## Technical Principles
Safety First: Extensive use of expectedFunctions and runCatch to ensure runtime safety.

Algebraic Laws: Either.ap follows Applicative laws with error accumulation (concatenating Left values if they support it).

Point-free Style: Functions are designed to be composed without explicit arguments where possible.
Stack Safety: Recursive operations are handled via trampoline and Free monad to prevent RangeError.

YAGNI (You Aren't Gonna Need It)
