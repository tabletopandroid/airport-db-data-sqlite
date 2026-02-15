/**
 * Generate the airports.sqlite database using sql.js
 * This creates the schema without requiring native SQLite bindings
 *
 * Usage: node scripts/generate-db.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import initSqlJs from "sql.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function generateDatabase() {
  const SQL = await initSqlJs();
  const db = new SQL.Database();

  // Execute schema creation
  db.run(`
    CREATE TABLE airports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      icao TEXT NOT NULL UNIQUE,
      iata TEXT UNIQUE,
      faa TEXT UNIQUE,
      local TEXT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      type_source TEXT,
      status TEXT,
      is_public_use BOOLEAN,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      elevation_ft INTEGER NOT NULL,
      country TEXT NOT NULL,
      country_code TEXT NOT NULL,
      state TEXT,
      county TEXT,
      city TEXT,
      zip TEXT,
      timezone TEXT,
      magnetic_variation REAL,
      has_tower BOOLEAN NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE runways (
      id INTEGER PRIMARY KEY,
      airport_id INTEGER NOT NULL,

      length_ft INTEGER NOT NULL,
      width_ft INTEGER NOT NULL,
      surface TEXT NOT NULL,
      lighted BOOLEAN NOT NULL,

      FOREIGN KEY (airport_id) REFERENCES airports(id) ON DELETE CASCADE
    );

    CREATE TABLE runway_ends (
      id INTEGER PRIMARY KEY,
      runway_id INTEGER NOT NULL,

      ident TEXT NOT NULL,
      heading_degT REAL NOT NULL,
      latitude_deg REAL NOT NULL,
      longitude_deg REAL NOT NULL,

      displaced_threshold_ft INTEGER,
      elevation_ft INTEGER,

      FOREIGN KEY (runway_id) REFERENCES runways(id) ON DELETE CASCADE
    );

    CREATE TABLE fuel_available (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      airport_id INTEGER NOT NULL,
      fuel_type TEXT NOT NULL,
      UNIQUE(airport_id, fuel_type),
      FOREIGN KEY (airport_id) REFERENCES airports(id) ON DELETE CASCADE
    );

    CREATE TABLE infrastructure (
      airport_id INTEGER PRIMARY KEY,
      has_fbo BOOLEAN,
      has_hangars BOOLEAN,
      has_tie_downs BOOLEAN,
      FOREIGN KEY (airport_id) REFERENCES airports(id) ON DELETE CASCADE
    );

    CREATE TABLE operational (
      airport_id INTEGER PRIMARY KEY,
      airac_cycle TEXT NOT NULL,
      FOREIGN KEY (airport_id) REFERENCES airports(id) ON DELETE CASCADE
    );

    CREATE TABLE frequencies (
      airport_id INTEGER PRIMARY KEY,
      atis TEXT,
      tower TEXT,
      ground TEXT,
      clearance TEXT,
      unicom TEXT,
      approach TEXT,
      departure TEXT,
      FOREIGN KEY (airport_id) REFERENCES airports(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_airports_icao ON airports(icao);
    CREATE INDEX IF NOT EXISTS idx_airports_iata ON airports(iata);
    CREATE INDEX IF NOT EXISTS idx_airports_country_code ON airports(country_code);
    CREATE INDEX IF NOT EXISTS idx_airports_state ON airports(state);
    CREATE INDEX IF NOT EXISTS idx_airports_city ON airports(city);
    CREATE INDEX IF NOT EXISTS idx_airports_type ON airports(type);
    CREATE INDEX IF NOT EXISTS idx_fuel_airport ON fuel_available(airport_id);
  `);

  // Write database to file
  const data = db.export();
  const buffer = Buffer.from(data);

  const dataDir = path.join(__dirname, "..", "dist");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, "airports.sqlite");
  fs.writeFileSync(dbPath, buffer);

  console.log(`✓ Database created at: ${dbPath}`);
  console.log(`✓ File size: ${buffer.length} bytes`);
  console.log("✓ Ready for distribution");
}

generateDatabase().catch((error) => {
  console.error("Error generating database:", error);
  process.exit(1);
});
