#!/usr/bin/env node

/**
 * Import CSV data into airports.sqlite
 *
 * This script reads CSV files from the source of truth and imports them
 * into the SQLite database, matching the schema exactly.
 *
 * Usage: node scripts/import-csv.js [database-path]
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const Database = require("better-sqlite3");

const DEFAULT_DB_PATH = path.join(__dirname, "..", "data", "airports.sqlite");
const CSV_DIR = path.join(__dirname, "..", "tmp");

const AIRPORTS_CSV = path.join(CSV_DIR, "airports.csv");
const RUNWAYS_CSV = path.join(CSV_DIR, "runways.csv");
const FREQUENCIES_CSV = path.join(CSV_DIR, "airport-frequencies.csv");
const COUNTRIES_CSV = path.join(CSV_DIR, "countries.csv");

class CSVImporter {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = new Database(dbPath);
    this.countriesMap = new Map(); // code -> name
    this.stats = {
      airports: { inserted: 0, skipped: 0, updated: 0 },
      runways: { inserted: 0, skipped: 0 },
      frequencies: { inserted: 0, skipped: 0 },
    };
  }

  /**
   * Load country code → name mapping from CSV
   */
  async loadCountries() {
    console.log("🌍 Loading country mappings...");

    const fileStream = fs.createReadStream(COUNTRIES_CSV, {
      encoding: "utf8",
    });
    const rl = readline.createInterface({ input: fileStream });

    let lineNum = 0;
    let columnMap = null;
    let count = 0;

    for await (const line of rl) {
      lineNum++;

      if (!line.trim()) continue;

      if (lineNum === 1) {
        columnMap = this.getColumnMap(line);
        continue;
      }

      const row = this.parseCSVLine(line);
      const code = row[columnMap["code"]]?.trim();
      const name = row[columnMap["name"]]?.trim();

      if (code && name) {
        this.countriesMap.set(code, name);
        count++;
      }
    }

    console.log(`  ✓ Loaded ${count} countries`);
  }

  /**
   * Parse CSV line respecting quoted fields
   */
  parseCSVLine(line) {
    const result = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  /**
   * Parse header line and return column index map
   */
  getColumnMap(headerLine) {
    const headers = this.parseCSVLine(headerLine);
    return headers.reduce((map, header, idx) => {
      map[header.toLowerCase()] = idx;
      return map;
    }, {});
  }

  /**
   * Convert string to boolean
   */
  toBoolean(value) {
    if (value === null || value === undefined || value === "") return null;
    return value === "1" || value.toLowerCase() === "true" || value === "yes";
  }

  /**
   * Convert string to number or null
   */
  toNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }

  /**
   * Import airports from CSV
   */
  async importAirports() {
    console.log("\n📍 Importing airports...");

    const fileStream = fs.createReadStream(AIRPORTS_CSV, {
      encoding: "utf8",
    });
    const rl = readline.createInterface({ input: fileStream });

    let lineNum = 0;
    let columnMap = null;

    // Prepare statements
    const insertStmt = this.db.prepare(`
      INSERT INTO airports (
        icao, iata, faa, local, name, type, latitude, longitude,
        elevation_ft, country, country_code, state, city, timezone, has_tower
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(icao) DO UPDATE SET
        iata = excluded.iata,
        faa = excluded.faa,
        name = excluded.name,
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        elevation_ft = excluded.elevation_ft,
        state = excluded.state,
        city = excluded.city,
        updated_at = CURRENT_TIMESTAMP
    `);

    for await (const line of rl) {
      lineNum++;

      // Skip empty lines
      if (!line.trim()) continue;

      // Parse header
      if (lineNum === 1) {
        columnMap = this.getColumnMap(line);
        continue;
      }

      try {
        const row = this.parseCSVLine(line);

        // Extract values
        const icao = row[columnMap["icao_code"]]?.trim() || null;
        const iata = row[columnMap["iata_code"]]?.trim() || null;
        const faa = row[columnMap["gps_code"]]?.trim() || null;
        const local = row[columnMap["local_code"]]?.trim() || null;
        const name = row[columnMap["name"]]?.trim() || null;
        const type = row[columnMap["type"]]?.trim() || "unknown";
        const latitude = this.toNumber(row[columnMap["latitude_deg"]]);
        const longitude = this.toNumber(row[columnMap["longitude_deg"]]);
        const elevation = this.toNumber(row[columnMap["elevation_ft"]]);
        const countryCode = row[columnMap["iso_country"]]?.trim() || null;
        const state = row[columnMap["iso_region"]]?.trim() || null;
        const city = row[columnMap["municipality"]]?.trim() || null;

        // Skip if no ICAO code and no name
        if (!icao && !name) {
          this.stats.airports.skipped++;
          continue;
        }

        // Skip if missing required fields
        if (!latitude || !longitude || !elevation || !countryCode) {
          this.stats.airports.skipped++;
          continue;
        }

        // Use ICAO or generate a placeholder if missing
        const uniqueId = icao || name.replace(/\s+/g, "_").substring(0, 4);

        const result = insertStmt.run(
          uniqueId,
          iata || null,
          faa || null,
          local || null,
          name,
          type,
          latitude,
          longitude,
          elevation,
          this.countriesMap.get(countryCode) || countryCode || null, // Lookup country name
          countryCode,
          state || null,
          city || null,
          null, // timezone (not in source CSV)
          0, // has_tower (default false)
        );

        if (result.changes) {
          this.stats.airports.inserted++;
        }
      } catch (error) {
        console.error(`Error on line ${lineNum}:`, error.message);
        this.stats.airports.skipped++;
      }
    }

    console.log(`  ✓ Inserted: ${this.stats.airports.inserted}`);
    console.log(`  ✓ Skipped: ${this.stats.airports.skipped}`);
  }

  /**
   * Import runways from CSV
   */
  async importRunways() {
    console.log("\n🛬 Importing runways...");

    const fileStream = fs.createReadStream(RUNWAYS_CSV, {
      encoding: "utf8",
    });
    const rl = readline.createInterface({ input: fileStream });

    let lineNum = 0;
    let columnMap = null;

    // Prepare statements
    const getAirportStmt = this.db.prepare(
      "SELECT id FROM airports WHERE icao = ? LIMIT 1",
    );
    const insertStmt = this.db.prepare(`
      INSERT INTO runways (id, airport_id, length_ft, width_ft, surface, lighting)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT DO NOTHING
    `);

    for await (const line of rl) {
      lineNum++;

      if (!line.trim()) continue;

      if (lineNum === 1) {
        columnMap = this.getColumnMap(line);
        continue;
      }

      try {
        const row = this.parseCSVLine(line);

        const runwayId = row[columnMap["id"]]?.trim();
        const airportIdent =
          row[columnMap["airport_ident"]]?.trim() ||
          row[columnMap["le_ident"]]?.trim();
        const length = this.toNumber(row[columnMap["length_ft"]]);
        const width = this.toNumber(row[columnMap["width_ft"]]);
        const surface = row[columnMap["surface"]]?.trim() || "unknown";
        const lighted = this.toBoolean(row[columnMap["lighted"]]);
        const closed = this.toBoolean(row[columnMap["closed"]]);

        // Skip closed runways
        if (closed) {
          this.stats.runways.skipped++;
          continue;
        }

        // Skip if missing required fields
        if (!runwayId || !airportIdent || !length || !width) {
          this.stats.runways.skipped++;
          continue;
        }

        // Get airport ID by ident
        const airport = getAirportStmt.get(airportIdent);
        if (!airport) {
          this.stats.runways.skipped++;
          continue;
        }

        const result = insertStmt.run(
          runwayId,
          airport.id,
          length,
          width,
          this.normalizeSurface(surface),
          lighted ? 1 : 0,
        );

        if (result.changes) {
          this.stats.runways.inserted++;
        }
      } catch (error) {
        console.error(`Error on line ${lineNum}:`, error.message);
        this.stats.runways.skipped++;
      }
    }

    console.log(`  ✓ Inserted: ${this.stats.runways.inserted}`);
    console.log(`  ✓ Skipped: ${this.stats.runways.skipped}`);
  }

  /**
   * Normalize runway surface type
   */
  normalizeSurface(surface) {
    if (!surface) return "unknown";

    const normalized = surface.toUpperCase();

    if (normalized.includes("ASPH")) return "asphalt";
    if (normalized.includes("CONC")) return "concrete";
    if (normalized.includes("DIRT") || normalized === "DIRT") return "dirt";
    if (normalized.includes("GRVL") || normalized === "GVL") return "gravel";
    if (normalized.includes("GRASS") || normalized === "TURF") return "grass";
    if (normalized.includes("METAL")) return "metal";
    if (normalized.includes("WATER")) return "water";

    return "unknown";
  }

  /**
   * Import frequencies from CSV
   */
  async importFrequencies() {
    console.log("\n📡 Importing frequencies...");

    const fileStream = fs.createReadStream(FREQUENCIES_CSV, {
      encoding: "utf8",
    });
    const rl = readline.createInterface({ input: fileStream });

    let lineNum = 0;
    let columnMap = null;

    // Prepare statements
    const getAirportStmt = this.db.prepare(
      "SELECT id FROM airports WHERE icao = ? LIMIT 1",
    );

    // Map frequency types to database columns
    const frequencyMap = {
      atis: "atis",
      tower: "tower",
      ground: "ground",
      clearance: "clearance",
      ctaf: "unicom", // CTAF maps to UNICOM
      unicom: "unicom",
      approach: "approach",
      departure: "departure",
    };

    // Group frequencies by airport
    const frequenciesByAirport = {};

    for await (const line of rl) {
      lineNum++;

      if (!line.trim()) continue;

      if (lineNum === 1) {
        columnMap = this.getColumnMap(line);
        continue;
      }

      try {
        const row = this.parseCSVLine(line);

        const airportIdent = row[columnMap["airport_ident"]]?.trim();
        const type = row[columnMap["type"]]?.trim().toLowerCase();
        const frequency = row[columnMap["frequency_mhz"]]?.trim();

        if (!airportIdent || !type || !frequency) {
          this.stats.frequencies.skipped++;
          continue;
        }

        // Get airport ID
        const airport = getAirportStmt.get(airportIdent);
        if (!airport) {
          this.stats.frequencies.skipped++;
          continue;
        }

        const dbColumn = frequencyMap[type];
        if (!dbColumn) {
          this.stats.frequencies.skipped++;
          continue;
        }

        // Group by airport ID
        if (!frequenciesByAirport[airport.id]) {
          frequenciesByAirport[airport.id] = {};
        }

        // Only store if we don't have this frequency type yet
        if (!frequenciesByAirport[airport.id][dbColumn]) {
          frequenciesByAirport[airport.id][dbColumn] = frequency;
        }
      } catch (error) {
        console.error(`Error on line ${lineNum}:`, error.message);
        this.stats.frequencies.skipped++;
      }
    }

    // Insert frequencies into database
    const insertStmt = this.db.prepare(`
      INSERT INTO frequencies (
        airport_id, atis, tower, ground, clearance, unicom, approach, departure
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(airport_id) DO UPDATE SET
        atis = excluded.atis,
        tower = excluded.tower,
        ground = excluded.ground,
        clearance = excluded.clearance,
        unicom = excluded.unicom,
        approach = excluded.approach,
        departure = excluded.departure
    `);

    for (const airportId of Object.keys(frequenciesByAirport)) {
      const freqs = frequenciesByAirport[airportId];

      const result = insertStmt.run(
        airportId,
        freqs.atis || null,
        freqs.tower || null,
        freqs.ground || null,
        freqs.clearance || null,
        freqs.unicom || null,
        freqs.approach || null,
        freqs.departure || null,
      );

      if (result.changes) {
        this.stats.frequencies.inserted++;
      }
    }

    console.log(`  ✓ Inserted: ${this.stats.frequencies.inserted}`);
    console.log(`  ✓ Skipped: ${this.stats.frequencies.skipped}`);
  }

  /**
   * Close database connection
   */
  close() {
    this.db.close();
  }

  /**
   * Print summary
   */
  printSummary() {
    console.log("\n" + "=".repeat(50));
    console.log("📊 Import Summary");
    console.log("=".repeat(50));

    console.log(
      `\n✈️  Airports: ${this.stats.airports.inserted} inserted, ${this.stats.airports.skipped} skipped`,
    );
    console.log(
      `🛬  Runways: ${this.stats.runways.inserted} inserted, ${this.stats.runways.skipped} skipped`,
    );
    console.log(
      `📡 Frequencies: ${this.stats.frequencies.inserted} inserted, ${this.stats.frequencies.skipped} skipped`,
    );
    console.log("\n✅ Import complete!");
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    const dbPath = process.argv[2] || DEFAULT_DB_PATH;

    console.log("🚀 Airport Database CSV Importer");
    console.log(`📦 Database: ${dbPath}`);
    console.log(`📂 CSV Source: ${CSV_DIR}\n`);

    // Verify database exists
    if (!fs.existsSync(dbPath)) {
      console.error("❌ Error: Database file not found:", dbPath);
      process.exit(1);
    }

    // Verify CSV files exist
    const requiredFiles = [
      AIRPORTS_CSV,
      RUNWAYS_CSV,
      FREQUENCIES_CSV,
      COUNTRIES_CSV,
    ];
    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        console.error("❌ Error: Required CSV file not found:", file);
        process.exit(1);
      }
    }

    const importer = new CSVImporter(dbPath);

    // Load countries first
    await importer.loadCountries();

    // Import data
    await importer.importAirports();
    await importer.importRunways();
    await importer.importFrequencies();

    importer.printSummary();
    importer.close();
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  }
}

main();
