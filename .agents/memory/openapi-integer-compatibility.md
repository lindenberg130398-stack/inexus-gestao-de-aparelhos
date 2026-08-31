---
name: OpenAPI integer compatibility
description: Compatibility constraint between the API generator and the workspace Zod version.
---

Use OpenAPI `number` rather than `integer` in generated API schemas.

**Why:** The current generator emits `zod.int()` for `integer`, but the workspace's Zod runtime does not provide that API, causing the shared libraries to fail typechecking after code generation.

**How to apply:** For IDs, counts, and installments, define `type: number` and enforce whole-number semantics in application validation when needed.