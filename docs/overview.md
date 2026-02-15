# Overview

`@tabletopandroid/airport-db-data-sqlite` is a data-distribution package for the `airport-db` ecosystem.

It ships a prebuilt SQLite database and a helper function to locate it at runtime.

## Why Database-Only

- No query abstraction lock-in
- Usable across Node.js, browser/WASM, and worker runtimes
- Small runtime surface
- Query libraries can evolve independently

## Related Packages

- `airport-db` - TypeScript query API for Node.js

## Source of Truth

- Schema: [`docs/schema.md`](./schema.md)
- CSV import behavior: [`docs/csv-import.md`](./csv-import.md)
- Publishing/release flow: [`docs/publishing.md`](./publishing.md)
