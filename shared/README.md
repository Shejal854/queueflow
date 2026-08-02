# shared/

This folder is intentionally minimal in this project.

In a larger codebase, `shared/` would hold TypeScript types and constants
imported by BOTH `server/` and `worker/` (job status enums, priority
weights, the `IJob` shape, etc.) via a real monorepo tool (npm/pnpm
workspaces or Turborepo).

**Why we didn't wire that up here:** for an SDE-1 interview project, a
full workspace/monorepo build pipeline is exactly the kind of
"unnecessary technology" this project deliberately avoids -- it adds
config surface (workspace root package.json, tsconfig project
references, build ordering) without teaching a new distributed-systems
concept. Instead, `server/src/constants.ts` and `worker/src/constants.ts`
are kept in manual sync (small, rarely-changing files).

**Possible Improvement (mention this in interviews):** convert this repo
to an npm workspace with `shared/` as a real published-internally
package (`@queueflow/shared`), so the constants and interfaces have a
single source of truth and a type mismatch between services would fail
at compile time instead of relying on developer discipline.
