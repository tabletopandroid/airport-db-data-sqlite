# @tabletopandroid/airport-db-data-sqlite

A lightweight SQLite database distribution of airport data for the airport-db ecosystem. This package provides only the database file—querying is handled by separate packages.

## Installation

```bash
npm install @tabletopandroid/airport-db-data-sqlite
```

## Usage

Use the `getDatabasePath()` function to get the absolute path to the SQLite database:

```javascript
import { getDatabasePath } from "@tabletopandroid/airport-db-data-sqlite";

const dbPath = getDatabasePath();
console.log(dbPath);
// Output: /path/to/node_modules/@tabletopandroid/airport-db-data-sqlite/data/airports.sqlite
```

### With sql.js (Browser/WASM)

```javascript
import { getDatabasePath } from "@tabletopandroid/airport-db-data-sqlite";
import initSqlJs from "sql.js";
import fs from "fs";

const SQL = await initSqlJs();
const data = fs.readFileSync(getDatabasePath());
const db = new SQL.Database(data);

const result = db.exec("SELECT * FROM airports WHERE icao = 'KLZU'");
console.log(result);
```

### With better-sqlite3 (Node.js)

```javascript
import Database from "better-sqlite3";
import { getDatabasePath } from "@tabletopandroid/airport-db-data-sqlite";

const db = new Database(getDatabasePath(), { readonly: true });
const airport = db.prepare("SELECT * FROM airports WHERE icao = ?").get("KLZU");
console.log(airport);
```

### With D1 (Cloudflare Workers)

```typescript
import { getDatabasePath } from "@tabletopandroid/airport-db-data-sqlite";

// Copy the database file to your project and reference it in wrangler.toml
// Then bind it to your worker environment
```

## Database Schema

The `airports.sqlite` file contains the following tables:

### airports

Core airport identity and location data

- `icao` (TEXT, PRIMARY KEY)
- `iata` (TEXT, UNIQUE)
- `faa` (TEXT)
- `name` (TEXT)
- `type` (TEXT)
- `latitude`, `longitude`
- `elevation_ft`
- `country`, `country_code`
- `state`, `city`, `zip`
- `timezone`
- `has_tower` (BOOLEAN)

### runways

Runway specifications

- `id` (TEXT)
- `airport_icao` (TEXT, FOREIGN KEY)
- `length_ft`, `width_ft`
- `surface`
- `lighting`

### infrastructure

Airport facilities

- `airport_icao` (TEXT, FOREIGN KEY)
- `has_fbo`, `has_hangars`, `has_tie_downs`

### operational

AIRAC-aware operational data

- `airport_icao` (TEXT, FOREIGN KEY)
- `airac_cycle`

### frequencies

Radio frequencies

- `airport_icao` (TEXT, FOREIGN KEY)
- `atis`, `tower`, `ground`, `clearance`, `unicom`, `approach`, `departure`

### fuel_available

Available fuel types

- `airport_icao` (TEXT, FOREIGN KEY)
- `fuel_type`

## Why Just the Database?

This package provides **only the data distribution**:

- ✅ No runtime dependencies
- ✅ Works in any JavaScript environment (Node.js, browsers, workers, WASM)
- ✅ Use the query library of your choice
- ✅ Smaller package footprint
- ✅ Distributes pre-built schema with indexes

Query packages can import this and provide API layers for specific use cases.

## Querying Packages

Packages that build on this data distribution:

- `airport-db` — TypeScript query API for Node.js
- _Additional query libraries coming_

## Development

### Regenerating the Database

If you have airport data you want to add:

```bash
npm run generate-db
```

This reads `scripts/generate-db.js` which uses sql.js to create the clean schema.

## Contributing

This project is open-source and welcomes contributions! We're building a comprehensive, community-maintained airport database.

### How to Contribute

- **Add airport data** — Improve coverage or accuracy
- **Fix errors** — Suggest corrections
- **Improve documentation** — Help others understand the data
- **Report issues** — Let us know about missing or incorrect data

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines on:

- Setting up your development environment
- Adding or updating airport data
- Data quality standards
- Submission workflow

### Data Quality

We prioritize accuracy and completeness. All contributions should reference verifiable public sources like:

- FAA (Federal Aviation Administration)
- ICAO (International Civil Aviation Organization)
- OurAirports.com
- OpenFlights

## License

This project is licensed under the **Open Data Commons Open Database License (ODbL) v1.0**.

This means:

- ✅ You can use, copy, and share the database
- ✅ You can create works from it
- ✅ You can modify and improve it
- ℹ️ You must attribute the source
- ℹ️ Any improvements must be shared back under the same license

See [LICENSE](./LICENSE) for full details and [opendatacommons.org](https://opendatacommons.org/licenses/odbl/1.0/) for more information.

---

Built with ✈️ by the open aviation community
