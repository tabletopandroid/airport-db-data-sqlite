#!/usr/bin/env node

/**
 * Import CSV data into airports.sqlite
 *
 * Usage: node scripts/import-csv.cjs [database-path]
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const Database = require("better-sqlite3");

const DEFAULT_DB_PATH = path.join(__dirname, "..", "dist", "airports.sqlite");

function resolveCsvDir() {
  const candidates = [
    path.join(__dirname, "..", "data"),
    path.join(__dirname, "..", "tmp"),
  ];

  for (const dir of candidates) {
    const required = [
      "airports.csv",
      "runways.csv",
      "airport-frequencies.csv",
      "countries.csv",
    ];

    const hasAll = required.every((file) =>
      fs.existsSync(path.join(dir, file)),
    );
    if (hasAll) {
      return dir;
    }
  }

  return candidates[0];
}

const CSV_DIR = resolveCsvDir();

const AIRPORTS_CSV = path.join(CSV_DIR, "airports.csv");
const RUNWAYS_CSV = path.join(CSV_DIR, "runways.csv");
const FREQUENCIES_CSV = path.join(CSV_DIR, "airport-frequencies.csv");
const COUNTRIES_CSV = path.join(CSV_DIR, "countries.csv");

class CSVImporter {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = new Database(dbPath);
    this.db.pragma("foreign_keys = ON");
    this.countriesMap = new Map();
    this.stats = {
      airports: { inserted: 0, skipped: 0 },
      runways: { inserted: 0, skipped: 0 },
      runwayEnds: { inserted: 0, skipped: 0 },
      frequencies: { inserted: 0, skipped: 0 },
    };
  }

  async loadCountries() {
    console.log("Loading country mappings...");

    const fileStream = fs.createReadStream(COUNTRIES_CSV, { encoding: "utf8" });
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

    console.log(`  Loaded ${count} countries`);
  }

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
          i++;
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

  getColumnMap(headerLine) {
    const headers = this.parseCSVLine(headerLine);
    return headers.reduce((map, header, idx) => {
      map[header.toLowerCase()] = idx;
      return map;
    }, {});
  }

  toBoolean(value) {
    if (value === null || value === undefined || value === "") return null;
    return (
      value === "1" ||
      String(value).toLowerCase() === "true" ||
      String(value).toLowerCase() === "yes"
    );
  }

  toNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    const num = parseFloat(value);
    return Number.isNaN(num) ? null : num;
  }

  normalizeSurface(surface) {
    if (!surface) return "unknown";

    const normalized = surface.toUpperCase();

    if (normalized.includes("ASPH")) return "asphalt";
    if (normalized.includes("CONC")) return "concrete";
    if (normalized.includes("DIRT")) return "dirt";
    if (normalized.includes("GRVL") || normalized === "GVL") return "gravel";
    if (normalized.includes("GRASS") || normalized.includes("TURF"))
      return "grass";
    if (normalized.includes("METAL")) return "metal";
    if (normalized.includes("WATER")) return "water";

    return "unknown";
  }

  async importAirports() {
    console.log("\nImporting airports...");

    const fileStream = fs.createReadStream(AIRPORTS_CSV, { encoding: "utf8" });
    const rl = readline.createInterface({ input: fileStream });

    let lineNum = 0;
    let columnMap = null;

    const upsertAirportStmt = this.db.prepare(`
      INSERT INTO airports (
        icao, iata, faa, local, name, type, latitude, longitude,
        elevation_ft, country, country_code, state, city, timezone, has_tower
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(icao) DO UPDATE SET
        iata = excluded.iata,
        faa = excluded.faa,
        local = excluded.local,
        name = excluded.name,
        type = excluded.type,
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        elevation_ft = excluded.elevation_ft,
        country = excluded.country,
        country_code = excluded.country_code,
        state = excluded.state,
        city = excluded.city,
        timezone = excluded.timezone,
        updated_at = CURRENT_TIMESTAMP
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

        const icao = row[columnMap["ident"]]?.trim() || null;
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

        if (!icao || !name) {
          this.stats.airports.skipped++;
          continue;
        }

        if (
          latitude === null ||
          longitude === null ||
          elevation === null ||
          !countryCode
        ) {
          this.stats.airports.skipped++;
          continue;
        }

        upsertAirportStmt.run(
          icao,
          iata,
          faa,
          local,
          name,
          type,
          latitude,
          longitude,
          elevation,
          this.countriesMap.get(countryCode) || countryCode,
          countryCode,
          state,
          city,
          null,
          0,
        );

        this.stats.airports.inserted++;
      } catch (error) {
        console.error(`Error in airports.csv line ${lineNum}:`, error.message);
        this.stats.airports.skipped++;
      }
    }

    console.log(`  Inserted/Updated: ${this.stats.airports.inserted}`);
    console.log(`  Skipped: ${this.stats.airports.skipped}`);
  }

  buildRunwayEnds(row, columnMap, runwayId) {
    const defs = [
      { side: "le", id: runwayId * 10 + 1 },
      { side: "he", id: runwayId * 10 + 2 },
    ];

    const runwayEnds = [];

    for (const def of defs) {
      const ident = row[columnMap[`${def.side}_ident`]]?.trim() || null;
      const headingDegT = this.toNumber(
        row[columnMap[`${def.side}_heading_degt`]],
      );
      const latitudeDeg = this.toNumber(
        row[columnMap[`${def.side}_latitude_deg`]],
      );
      const longitudeDeg = this.toNumber(
        row[columnMap[`${def.side}_longitude_deg`]],
      );
      const displacedThresholdFt = this.toNumber(
        row[columnMap[`${def.side}_displaced_threshold_ft`]],
      );
      const elevationFt = this.toNumber(
        row[columnMap[`${def.side}_elevation_ft`]],
      );

      if (
        !ident ||
        headingDegT === null ||
        latitudeDeg === null ||
        longitudeDeg === null
      ) {
        continue;
      }

      runwayEnds.push({
        id: def.id,
        runwayId,
        ident,
        headingDegT,
        latitudeDeg,
        longitudeDeg,
        displacedThresholdFt,
        elevationFt,
      });
    }

    return runwayEnds;
  }

  async importRunways() {
    console.log("\nImporting runways...");

    const fileStream = fs.createReadStream(RUNWAYS_CSV, { encoding: "utf8" });
    const rl = readline.createInterface({ input: fileStream });

    let lineNum = 0;
    let columnMap = null;

    const getAirportStmt = this.db.prepare(
      "SELECT id FROM airports WHERE icao = ? LIMIT 1",
    );

    const upsertRunwayStmt = this.db.prepare(`
      INSERT INTO runways (id, airport_id, length_ft, width_ft, surface, lighted)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        airport_id = excluded.airport_id,
        length_ft = excluded.length_ft,
        width_ft = excluded.width_ft,
        surface = excluded.surface,
        lighted = excluded.lighted
    `);

    const upsertRunwayEndStmt = this.db.prepare(`
      INSERT INTO runway_ends (
        id, runway_id, ident, heading_degT, latitude_deg, longitude_deg,
        displaced_threshold_ft, elevation_ft
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        runway_id = excluded.runway_id,
        ident = excluded.ident,
        heading_degT = excluded.heading_degT,
        latitude_deg = excluded.latitude_deg,
        longitude_deg = excluded.longitude_deg,
        displaced_threshold_ft = excluded.displaced_threshold_ft,
        elevation_ft = excluded.elevation_ft
    `);

    const deleteRunwayEndsStmt = this.db.prepare(
      "DELETE FROM runway_ends WHERE runway_id = ?",
    );

    const upsertRunwayWithEnds = this.db.transaction((runway, ends) => {
      upsertRunwayStmt.run(
        runway.id,
        runway.airportId,
        runway.lengthFt,
        runway.widthFt,
        runway.surface,
        runway.lighted,
      );

      deleteRunwayEndsStmt.run(runway.id);

      for (const end of ends) {
        upsertRunwayEndStmt.run(
          end.id,
          end.runwayId,
          end.ident,
          end.headingDegT,
          end.latitudeDeg,
          end.longitudeDeg,
          end.displacedThresholdFt,
          end.elevationFt,
        );
      }
    });

    for await (const line of rl) {
      lineNum++;
      if (!line.trim()) continue;

      if (lineNum === 1) {
        columnMap = this.getColumnMap(line);
        continue;
      }

      try {
        const row = this.parseCSVLine(line);

        const runwayId = this.toNumber(row[columnMap["id"]]?.trim());
        const airportIdent = row[columnMap["airport_ident"]]?.trim() || null;
        const lengthFt = this.toNumber(row[columnMap["length_ft"]]);
        const widthFt = this.toNumber(row[columnMap["width_ft"]]);
        const surface = row[columnMap["surface"]]?.trim() || "unknown";
        const lighted = this.toBoolean(row[columnMap["lighted"]]);
        const closed = this.toBoolean(row[columnMap["closed"]]);

        if (closed) {
          this.stats.runways.skipped++;
          continue;
        }

        if (
          runwayId === null ||
          !airportIdent ||
          lengthFt === null ||
          widthFt === null
        ) {
          this.stats.runways.skipped++;
          continue;
        }

        const airport = getAirportStmt.get(airportIdent);
        if (!airport) {
          this.stats.runways.skipped++;
          continue;
        }

        const runway = {
          id: runwayId,
          airportId: airport.id,
          lengthFt,
          widthFt,
          surface: this.normalizeSurface(surface),
          lighted: lighted ? 1 : 0,
        };

        const runwayEnds = this.buildRunwayEnds(row, columnMap, runwayId);
        upsertRunwayWithEnds(runway, runwayEnds);

        this.stats.runways.inserted++;
        this.stats.runwayEnds.inserted += runwayEnds.length;
        if (runwayEnds.length === 0) {
          this.stats.runwayEnds.skipped++;
        }
      } catch (error) {
        console.error(`Error in runways.csv line ${lineNum}:`, error.message);
        this.stats.runways.skipped++;
      }
    }

    console.log(`  Inserted/Updated: ${this.stats.runways.inserted}`);
    console.log(`  Skipped: ${this.stats.runways.skipped}`);
    console.log(
      `  Runway Ends Inserted/Updated: ${this.stats.runwayEnds.inserted}`,
    );
    console.log(`  Runway Ends Skipped: ${this.stats.runwayEnds.skipped}`);
  }

  async importFrequencies() {
    console.log("\nImporting frequencies...");

    const fileStream = fs.createReadStream(FREQUENCIES_CSV, {
      encoding: "utf8",
    });
    const rl = readline.createInterface({ input: fileStream });

    let lineNum = 0;
    let columnMap = null;

    const getAirportStmt = this.db.prepare(
      "SELECT id FROM airports WHERE icao = ? LIMIT 1",
    );

    const frequencyMap = {
      atis: "atis",
      tower: "tower",
      ground: "ground",
      clearance: "clearance",
      ctaf: "unicom",
      unicom: "unicom",
      approach: "approach",
      departure: "departure",
    };

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

        if (!frequenciesByAirport[airport.id]) {
          frequenciesByAirport[airport.id] = {};
        }

        if (!frequenciesByAirport[airport.id][dbColumn]) {
          frequenciesByAirport[airport.id][dbColumn] = frequency;
        }
      } catch (error) {
        console.error(
          `Error in airport-frequencies.csv line ${lineNum}:`,
          error.message,
        );
        this.stats.frequencies.skipped++;
      }
    }

    const upsertFrequencyStmt = this.db.prepare(`
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

      upsertFrequencyStmt.run(
        airportId,
        freqs.atis || null,
        freqs.tower || null,
        freqs.ground || null,
        freqs.clearance || null,
        freqs.unicom || null,
        freqs.approach || null,
        freqs.departure || null,
      );

      this.stats.frequencies.inserted++;
    }

    console.log(`  Inserted/Updated: ${this.stats.frequencies.inserted}`);
    console.log(`  Skipped: ${this.stats.frequencies.skipped}`);
  }

  close() {
    this.db.close();
  }

  printSummary() {
    console.log("\n" + "=".repeat(50));
    console.log("Import Summary");
    console.log("=".repeat(50));

    console.log(
      `\nAirports: ${this.stats.airports.inserted} inserted/updated, ${this.stats.airports.skipped} skipped`,
    );
    console.log(
      `Runways: ${this.stats.runways.inserted} inserted/updated, ${this.stats.runways.skipped} skipped`,
    );
    console.log(
      `Runway Ends: ${this.stats.runwayEnds.inserted} inserted/updated, ${this.stats.runwayEnds.skipped} skipped`,
    );
    console.log(
      `Frequencies: ${this.stats.frequencies.inserted} inserted/updated, ${this.stats.frequencies.skipped} skipped`,
    );
    console.log("\nImport complete.");
  }
}

async function main() {
  try {
    const dbPath = process.argv[2] || DEFAULT_DB_PATH;

    console.log("Airport Database CSV Importer");
    console.log(`Database: ${dbPath}`);
    console.log(`CSV Source: ${CSV_DIR}\n`);

    if (!fs.existsSync(dbPath)) {
      console.error("Error: Database file not found:", dbPath);
      process.exit(1);
    }

    const requiredFiles = [
      AIRPORTS_CSV,
      RUNWAYS_CSV,
      FREQUENCIES_CSV,
      COUNTRIES_CSV,
    ];

    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        console.error("Error: Required CSV file not found:", file);
        process.exit(1);
      }
    }

    const importer = new CSVImporter(dbPath);

    await importer.loadCountries();
    await importer.importAirports();
    await importer.importRunways();
    await importer.importFrequencies();

    importer.printSummary();
    importer.close();
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main();
