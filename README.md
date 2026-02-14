# airport-db Data SQLite

An SQLite database distribution of airport data for the `airport-db` package. This module provides a queryable SQLite database of airport information from around the world, with stable schemas for identity, location, infrastructure, and operational (AIRAC) data.

## Installation

```bash
npm install @tabletop-android/airport-db-data-sqlite
```

## Usage

### Basic Imports

```typescript
import {
  getDatabase,
  getDatabasePath,
  getAirportByICAO,
  getAirportsByCountry,
} from "@tabletop-android/airport-db-data-sqlite";

// Get path to database file (for direct access)
const dbPath = getDatabasePath();

// Get database connection
const db = getDatabase();

// Query airports by ICAO code
const airport = getAirportByICAO("KLZU");
```

### Available Query Functions

- `getAirportByICAO(icao: string)` - Get airport by ICAO code
- `getAirportByIATA(iata: string)` - Get airport by IATA code
- `getAirportsByCountry(countryCode: string)` - Get all airports in a country
- `getAirportsByState(state: string, countryCode?: string)` - Get airports by state
- `getAirportsByCity(city: string)` - Get airports by city
- `getAirportsByType(type: string)` - Get airports by classification
- `getAirportsWithTowers()` - Get all airports with control towers
- `getRunwaysByAirport(icao: string)` - Get runway details
- `getOperationalData(icao: string)` - Get AIRAC operational data
- `getFrequencies(icao: string)` - Get radio frequencies
- `getFuelTypes(icao: string)` - Get available fuel types
- `getInfrastructure(icao: string)` - Get infrastructure details
- `countAirports()` - Get total number of airports

### Direct Database Access

You can also use the database directly:

```typescript
import { getDatabase } from "@tabletop-android/airport-db-data-sqlite";

const db = getDatabase();
const airports = db
  .prepare("SELECT * FROM airports WHERE country_code = ? LIMIT 10")
  .all("US");
```

### In Other Packages

To use the database in other Node.js packages:

```typescript
// Import the database module
import {
  getDatabase,
  getAirportByICAO,
} from "@tabletop-android/airport-db-data-sqlite";

// Query the database
const klzu = getAirportByICAO("KLZU");
console.log(klzu?.name); // Gwinnett County Airport
```

## Database Schema

The SQLite database includes the following tables:

### airports

- `icao` (TEXT, PRIMARY KEY) - ICAO code
- `iata` (TEXT, UNIQUE) - IATA code
- `faa` (TEXT) - FAA identifier
- `local` (TEXT) - Local identifier
- `name` (TEXT) - Airport name
- `type` (TEXT) - Airport type classification
- `status` (TEXT) - Operational status
- `latitude`, `longitude`, `elevation_ft` - Geographic data
- `country`, `country_code` - Location details
- `state`, `county`, `city`, `zip` - Regional information
- `timezone`, `magnetic_variation` - Additional metadata
- `has_tower` (BOOLEAN) - Has control tower

### runways

- `id` (TEXT) - Runway identifier
- `airport_icao` (TEXT, FOREIGN KEY) - Associated airport
- `length_ft`, `width_ft` - Dimensions
- `surface` - Surface material type
- `lighting` (BOOLEAN)

### infrastructure

- `airport_icao` (TEXT, FOREIGN KEY)
- `has_fbo`, `has_hangars`, `has_tie_downs` (BOOLEAN)

### operational

- `airport_icao` (TEXT, FOREIGN KEY)
- `airac_cycle` (TEXT) - AIRAC cycle identifier

### frequencies

- `airport_icao` (TEXT, FOREIGN KEY)
- `atis`, `tower`, `ground`, `clearance`, `unicom`, `approach`, `departure` (TEXT)

### fuel_available

- `airport_icao` (TEXT, FOREIGN KEY)
- `fuel_type` (TEXT) - Available fuel type

## Accessing the Raw Database File

For direct SQLite access or to use the database in other tools:

```typescript
import { getDatabasePath } from "@tabletop-android/airport-db-data-sqlite";

const path = getDatabasePath();
// Use with your SQLite tool or library
```

## License

See LICENSE file
