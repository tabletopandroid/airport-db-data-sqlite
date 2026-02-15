# Usage

Use `getDatabasePath()` to get the absolute path to the packaged SQLite file.

## Basic

```javascript
import { getDatabasePath } from "@tabletopandroid/airport-db-data-sqlite";

const dbPath = getDatabasePath();
console.log(dbPath);
// /path/to/node_modules/@tabletopandroid/airport-db-data-sqlite/dist/airports.sqlite
```

## With better-sqlite3 (Node.js)

```javascript
import Database from "better-sqlite3";
import { getDatabasePath } from "@tabletopandroid/airport-db-data-sqlite";

const db = new Database(getDatabasePath(), { readonly: true });
const airport = db.prepare("SELECT * FROM airports WHERE icao = ?").get("KLZU");
console.log(airport);
```

## With sql.js (Browser/WASM)

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

## With D1 (Cloudflare Workers)

```typescript
import { getDatabasePath } from "@tabletopandroid/airport-db-data-sqlite";

// Copy the database file to your project and reference it in wrangler.toml,
// then bind it to your worker environment.
```
