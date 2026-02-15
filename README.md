# @tabletopandroid/airport-db-data-sqlite

A lightweight SQLite database distribution for the `airport-db` ecosystem.

This package ships:

- a prebuilt SQLite database (`dist/airports.sqlite`)
- a small runtime helper (`getDatabasePath()`)

## Install

```bash
npm install @tabletopandroid/airport-db-data-sqlite
```

## Quick Start

```javascript
import { getDatabasePath } from "@tabletopandroid/airport-db-data-sqlite";
import Database from "better-sqlite3";

const db = new Database(getDatabasePath(), { readonly: true });
const airport = db.prepare("SELECT * FROM airports WHERE icao = ?").get("KLZU");
console.log(airport?.name);
```

`getDatabasePath()` resolves to:

`/path/to/node_modules/@tabletopandroid/airport-db-data-sqlite/dist/airports.sqlite`

## Schema

Canonical schema documentation lives in [`docs/schema.md`](./docs/schema.md).

## Documentation

- Overview: [`docs/overview.md`](./docs/overview.md)
- Usage examples: [`docs/usage.md`](./docs/usage.md)
- Schema reference: [`docs/schema.md`](./docs/schema.md)
- CSV import details: [`docs/csv-import.md`](./docs/csv-import.md)
- Publishing and releases: [`docs/publishing.md`](./docs/publishing.md)
- Contributing guide: [`CONTRIBUTING.md`](./CONTRIBUTING.md)

Data corrections must be made upstream in OurAirports first; this repo consumes and distributes that data.

## License

Licensed under **ODbL 1.0**. See [`LICENSE`](./LICENSE).
