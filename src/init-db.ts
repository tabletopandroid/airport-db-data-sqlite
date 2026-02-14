import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

/**
 * Initialize the SQLite database with schema
 */
function initializeDatabase() {
  const dbPath = path.join(__dirname, "..", "data", "airports.db");
  const dataDir = path.dirname(dbPath);

  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const db = new Database(dbPath);

  // Enable foreign keys
  db.pragma("foreign_keys = ON");

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS airports (
      icao TEXT PRIMARY KEY,
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

    CREATE TABLE IF NOT EXISTS runways (
      id TEXT NOT NULL,
      airport_icao TEXT NOT NULL PRIMARY KEY,
      length_ft INTEGER NOT NULL,
      width_ft INTEGER NOT NULL,
      surface TEXT NOT NULL,
      lighting BOOLEAN NOT NULL,
      FOREIGN KEY (airport_icao) REFERENCES airports(icao) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS fuel_available (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      airport_icao TEXT NOT NULL,
      fuel_type TEXT NOT NULL,
      UNIQUE(airport_icao, fuel_type),
      FOREIGN KEY (airport_icao) REFERENCES airports(icao) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS infrastructure (
      airport_icao TEXT PRIMARY KEY,
      has_fbo BOOLEAN,
      has_hangars BOOLEAN,
      has_tie_downs BOOLEAN,
      FOREIGN KEY (airport_icao) REFERENCES airports(icao) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS operational (
      airport_icao TEXT PRIMARY KEY,
      airac_cycle TEXT NOT NULL,
      FOREIGN KEY (airport_icao) REFERENCES airports(icao) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS frequencies (
      airport_icao TEXT PRIMARY KEY,
      atis TEXT,
      tower TEXT,
      ground TEXT,
      clearance TEXT,
      unicom TEXT,
      approach TEXT,
      departure TEXT,
      FOREIGN KEY (airport_icao) REFERENCES airports(icao) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_airports_icao ON airports(icao);
    CREATE INDEX IF NOT EXISTS idx_airports_iata ON airports(iata);
    CREATE INDEX IF NOT EXISTS idx_airports_country_code ON airports(country_code);
    CREATE INDEX IF NOT EXISTS idx_airports_state ON airports(state);
    CREATE INDEX IF NOT EXISTS idx_airports_city ON airports(city);
    CREATE INDEX IF NOT EXISTS idx_airports_type ON airports(type);
    CREATE INDEX IF NOT EXISTS idx_fuel_airport ON fuel_available(airport_icao);
  `);

  console.log(`Database initialized at: ${dbPath}`);
  db.close();
}

// Run initialization if executed directly
if (require.main === module) {
  try {
    initializeDatabase();
    console.log("Database initialization completed successfully");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  }
}

export default initializeDatabase;
