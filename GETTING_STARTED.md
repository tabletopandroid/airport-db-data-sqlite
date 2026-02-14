# Getting Started with @tabletop-android/airport-db-data-sqlite

## Installation

```bash
npm install @tabletop-android/airport-db-data-sqlite
```

## Setup

When you install the package in your project, the SQLite database schema is automatically created the first time you access it. The database file is stored in the package's `data/` directory.

### Initializing the Database

The database schema is created automatically when you first import and use the package:

```typescript
import { getAirportByICAO } from "@tabletop-android/airport-db-data-sqlite";

// This will automatically create the database if it doesn't exist
const airport = getAirportByICAO("KLZU");
```

Or manually initialize (not usually needed):

```bash
npm run init-db
```

## Quick Start

Here's a minimal example:

```typescript
import {
  getAirportByICAO,
  getAirportsByCountry,
  countAirports,
} from "@tabletop-android/airport-db-data-sqlite";

// Get a specific airport
const klzu = getAirportByICAO("KLZU");
console.log(klzu?.name); // Gwinnett County Airport

// Get all airports in a country
const usAirports = getAirportsByCountry("US");
console.log(`Found ${usAirports.length} airports in the US`);

// Get database statistics
const total = countAirports();
console.log(`Total airports in database: ${total}`);
```

## Data Import

The SQLite database schema is created automatically, but to populate it with actual airport data:

1. Prepare your airport data in the correct format
2. Use the database functions to insert data:

```typescript
import { getDatabase } from "@tabletop-android/airport-db-data-sqlite";

const db = getDatabase();

// Insert airports
const insertAirport = db.prepare(`
  INSERT INTO airports (
    icao, name, type, latitude, longitude, elevation_ft, 
    country, country_code, has_tower
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

insertAirport.run(
  "KLZU",
  "John F. Kennedy International Airport",
  "large_airport",
  40.6413,
  -73.7781,
  13,
  "United States",
  "US",
  true,
);
```

## Using in Other Packages

This package is designed to be imported by other Node.js packages:

**In your package.json:**

```json
{
  "dependencies": {
    "@tabletop-android/airport-db-data-sqlite": "^1.0.0"
  }
}
```

**In your code:**

```typescript
import {
  getAirportByICAO,
  getDatabasePath,
} from "@tabletop-android/airport-db-data-sqlite";

export function findAirport(icao: string) {
  return getAirportByICAO(icao);
}

export function getDatabaseLocation() {
  return getDatabasePath();
}
```

## Requirements

- Node.js 14.0.0 or higher
- SQLite 3.x (included via better-sqlite3)

## Building from Source

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Create database schema
npm run init-db
```

## API Reference

See [README.md](./README.md) for complete API documentation.

## License

See LICENSE file in this package
