# Dongyeol Mock API ownership boundary

This subtree is owned by Dongyeol and implements the `/api/dongyeol/**` contract.

- Do not modify any file under `mock-api/dongyeol/**` unless the task explicitly requests a Dongyeol API change and is authorized by Dongyeol.
- Exclude this subtree from unrelated refactors, formatting, mock-data replacement, endpoint renaming, and generated rewrites.
- Read-only inspection and review are allowed. Propose cross-team changes before applying them.
- Do not merge these endpoints into another member's `/api/auth`, `/api/health`, or `/api/reset` routes.
- Never add real credentials or secrets. The included accounts and JWT secret are classroom-only mock values.
- Keep the frontend client under `src/members/dongyeol/api/**` in sync with any explicit contract change.
