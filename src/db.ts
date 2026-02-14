import Database from "better-sqlite3";
import path from "path";

/**
 * Get the SQLite database connection
 * Initializes the database on first access
 */
let dbInstance: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!dbInstance) {
    const dbPath = path.join(__dirname, "..", "data", "airports.db");
    dbInstance = new Database(dbPath);
    dbInstance.pragma("foreign_keys = ON");
  }
  return dbInstance;
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

/**
 * Get the path to the SQLite database file
 */
export function getDatabasePath(): string {
  return path.join(__dirname, "..", "data", "airports.db");
}

/**
 * Query helper for airports
 */
export interface AirportRow {
  icao: string;
  iata?: string;
  faa?: string;
  local?: string;
  name: string;
  type: string;
  type_source?: string;
  status?: string;
  is_public_use?: boolean;
  latitude: number;
  longitude: number;
  elevation_ft: number;
  country: string;
  country_code: string;
  state?: string;
  county?: string;
  city?: string;
  zip?: string;
  timezone?: string;
  magnetic_variation?: number;
  has_tower: boolean;
}

/**
 * Get an airport by ICAO code
 */
export function getAirportByICAO(icao: string): AirportRow | undefined {
  const db = getDatabase();
  const stmt = db.prepare("SELECT * FROM airports WHERE icao = ?");
  return stmt.get(icao) as AirportRow | undefined;
}

/**
 * Get an airport by IATA code
 */
export function getAirportByIATA(iata: string): AirportRow | undefined {
  const db = getDatabase();
  const stmt = db.prepare("SELECT * FROM airports WHERE iata = ?");
  return stmt.get(iata) as AirportRow | undefined;
}

/**
 * Search airports by country code
 */
export function getAirportsByCountry(countryCode: string): AirportRow[] {
  const db = getDatabase();
  const stmt = db.prepare(
    "SELECT * FROM airports WHERE country_code = ? ORDER BY name",
  );
  return stmt.all(countryCode) as AirportRow[];
}

/**
 * Search airports by state
 */
export function getAirportsByState(
  state: string,
  countryCode?: string,
): AirportRow[] {
  const db = getDatabase();
  let stmt;

  if (countryCode) {
    stmt = db.prepare(
      "SELECT * FROM airports WHERE state = ? AND country_code = ? ORDER BY name",
    );
    return stmt.all(state, countryCode) as AirportRow[];
  }

  stmt = db.prepare("SELECT * FROM airports WHERE state = ? ORDER BY name");
  return stmt.all(state) as AirportRow[];
}

/**
 * Search airports by city
 */
export function getAirportsByCity(city: string): AirportRow[] {
  const db = getDatabase();
  const stmt = db.prepare(
    "SELECT * FROM airports WHERE city = ? ORDER BY name",
  );
  return stmt.all(city) as AirportRow[];
}

/**
 * Search airports by type
 */
export function getAirportsByType(type: string): AirportRow[] {
  const db = getDatabase();
  const stmt = db.prepare(
    "SELECT * FROM airports WHERE type = ? ORDER BY name",
  );
  return stmt.all(type) as AirportRow[];
}

/**
 * Get all airports with control towers
 */
export function getAirportsWithTowers(): AirportRow[] {
  const db = getDatabase();
  const stmt = db.prepare(
    "SELECT * FROM airports WHERE has_tower = 1 ORDER BY name",
  );
  return stmt.all() as AirportRow[];
}

/**
 * Get runway information for an airport
 */
export interface RunwayRow {
  id: string;
  airport_icao: string;
  length_ft: number;
  width_ft: number;
  surface: string;
  lighting: boolean;
}

export function getRunwaysByAirport(icao: string): RunwayRow[] {
  const db = getDatabase();
  const stmt = db.prepare("SELECT * FROM runways WHERE airport_icao = ?");
  return stmt.all(icao) as RunwayRow[];
}

/**
 * Get operational data for an airport
 */
export interface OperationalRow {
  airport_icao: string;
  airac_cycle: string;
}

export function getOperationalData(icao: string): OperationalRow | undefined {
  const db = getDatabase();
  const stmt = db.prepare("SELECT * FROM operational WHERE airport_icao = ?");
  return stmt.get(icao) as OperationalRow | undefined;
}

/**
 * Get frequencies for an airport
 */
export interface FrequenciesRow {
  airport_icao: string;
  atis?: string;
  tower?: string;
  ground?: string;
  clearance?: string;
  unicom?: string;
  approach?: string;
  departure?: string;
}

export function getFrequencies(icao: string): FrequenciesRow | undefined {
  const db = getDatabase();
  const stmt = db.prepare("SELECT * FROM frequencies WHERE airport_icao = ?");
  return stmt.get(icao) as FrequenciesRow | undefined;
}

/**
 * Get available fuel types for an airport
 */
export function getFuelTypes(icao: string): string[] {
  const db = getDatabase();
  const stmt = db.prepare(
    "SELECT fuel_type FROM fuel_available WHERE airport_icao = ?",
  );
  const rows = stmt.all(icao) as Array<{ fuel_type: string }>;
  return rows.map((row) => row.fuel_type);
}

/**
 * Get infrastructure details for an airport
 */
export interface InfrastructureRow {
  airport_icao: string;
  has_fbo?: boolean;
  has_hangars?: boolean;
  has_tie_downs?: boolean;
}

export function getInfrastructure(icao: string): InfrastructureRow | undefined {
  const db = getDatabase();
  const stmt = db.prepare(
    "SELECT * FROM infrastructure WHERE airport_icao = ?",
  );
  return stmt.get(icao) as InfrastructureRow | undefined;
}

/**
 * Get total number of airports in the database
 */
export function countAirports(): number {
  const db = getDatabase();
  const stmt = db.prepare("SELECT COUNT(*) as count FROM airports");
  const result = stmt.get() as { count: number };
  return result.count;
}
