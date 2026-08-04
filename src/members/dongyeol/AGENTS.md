# Dongyeol ownership boundary

This subtree is owned by Dongyeol.

- Do not modify any file under `src/members/dongyeol/**` unless the task explicitly requests a Dongyeol change and is authorized by Dongyeol.
- Exclude this subtree from unrelated bulk refactors, formatting, lint autofixes, CSS cleanup, asset moves, dependency migrations, and generated rewrites.
- Read-only inspection and review are allowed. When an unrelated task appears to require a change here, report the dependency and propose the change instead of applying it.
- Preserve the member route namespace, scoped styling, Pinia IDs, storage keys, and API namespace already used by this module.
- Never read, copy, generate, or commit `.env.local` or real API keys.
- The matching server implementation is under `mock-api/dongyeol/**`; changes to its contract must be coordinated with this frontend.
