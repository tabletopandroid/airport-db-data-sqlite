# CSV Import Script

Updates the `airports.sqlite` database with unique entries from CSV source files.

## Overview

The `import-csv.js` script reads CSV files from the `tmp/` directory and imports them into the SQLite database, matching the database schema exactly.

**Source files:**

- `tmp/countries.csv` — Country code → name mapping (loaded first)
- `tmp/airports.csv` — Airport identity and location data
- `tmp/runways.csv` — Runway specifications
- `tmp/airport-frequencies.csv` — Radio frequencies

## Installation

Install required dependencies:

```bash
npm install better-sqlite3
```

## Usage

### Basic Import

```bash
node scripts/import-csv.js
```

Uses the default database path: `data/airports.sqlite`

### Custom Database Path

```bash
node scripts/import-csv.js /path/to/airports.sqlite
```

## Behavior

### Airports Table

- **Inserts** new airports by ICAO code
- **Updates** existing airports (merges on ICAO conflict)
- **Validates** required fields: latitude, longitude, elevation, country_code
- **Skips** records with missing coordinates or location data

### Runways Table

- **Inserts** new runways with airport reference
- **Skips** closed runways (marked as `closed=1` in source)
- **Validates** required fields: runway ID, airport ident, dimensions
- **Normalizes** surface types (asphalt, concrete, dirt, grass, gravel, etc.)

### Frequencies Table

- **Groups** frequencies by airport (one record per airport)
- **Maps** frequency types to database columns:
  - `ATIS` → `atis`
  - `TOWER` → `tower`
  - `GROUND` → `ground`
  - `CLEARANCE` → `clearance`
  - `CTAF`/`UNICOM` → `unicom`
  - `APPROACH` → `approach`
  - `DEPARTURE` → `departure`
- **Consolidates** multiple entries of same type (keeps first value)

## Output

The script prints a summary showing:

- Number of records inserted per table
- Number of records skipped
- Total time spent

Example:

```
🚀 Airport Database CSV Importer
📦 Database: data/airports.sqlite
📂 CSV Source: tmp/

🌍 Loading country mappings...
  ✓ Loaded 251 countries

📍 Importing airports...
  ✓ Inserted: 41,830
  ✓ Skipped: 2,736

🛬 Importing runways...
  ✓ Inserted: 47,587
  ✓ Skipped: 412

📡 Importing frequencies...
  ✓ Inserted: 30,207
  ✓ Skipped: 0

==================================================
📊 Import Summary
==================================================

✈️  Airports: 41,830 inserted, 2,736 skipped
🛬  Runways: 47,587 inserted, 412 skipped
📡 Frequencies: 30,207 inserted, 0 skipped

✅ Import complete!
```

## Schema Mapping

### Countries Lookup

The `countries.csv` file is loaded first and used to populate the `country` field in the airports table by looking up the ISO country code.

| CSV Column | Database Column | Notes              |
| ---------- | --------------- | ------------------ |
| `code`     | (lookup key)    | ISO 3166-1 alpha-2 |
| `name`     | `country`       | Full country name  |

### Airports

| CSV Column      | Database Column | Notes                       |
| --------------- | --------------- | --------------------------- |
| `icao_code`     | `icao`          | Primary unique identifier   |
| `iata_code`     | `iata`          | Optional                    |
| `gps_code`      | `faa`           | FAA identifier              |
| `local_code`    | `local`         | Local identifier            |
| `name`          | `name`          | Airport name                |
| `type`          | `type`          | Airport type classification |
| `latitude_deg`  | `latitude`      | WGS84 decimal degrees       |
| `longitude_deg` | `longitude`     | WGS84 decimal degrees       |
| `elevation_ft`  | `elevation_ft`  | Feet above MSL              |
| `iso_country`   | `country_code`  | ISO 3166-1 alpha-2          |
| `iso_region`    | `state`         | State/province              |
| `municipality`  | `city`          | City/municipality           |

### Runways

| CSV Column      | Database Column | Notes                         |
| --------------- | --------------- | ----------------------------- |
| `id`            | `id`            | Runway identifier             |
| `airport_ident` | `airport_id`    | Looked up from airports table |
| `length_ft`     | `length_ft`     | Runway length                 |
| `width_ft`      | `width_ft`      | Runway width                  |
| `surface`       | `surface`       | Normalized surface type       |
| `lighted`       | `lighting`      | Boolean (1/0)                 |

### Frequencies

| CSV Column      | Database Column | Notes                           |
| --------------- | --------------- | ------------------------------- |
| `airport_ident` | `airport_id`    | Looked up from airports table   |
| `type`          | (column name)   | Mapped to atis/tower/ground/etc |
| `frequency_mhz` | (column value)  | Radio frequency                 |

## Error Handling

The script handles:

- ✅ Missing or empty fields (treated as NULL)
- ✅ Malformed CSV lines (logs error, skips row)
- ✅ Missing airport references (skips runway/frequency)
- ✅ Duplicate entries (upsert on conflict)
- ✅ Type conversions (strings to numbers, booleans)

Errors are logged to console but don't stop the import.

## Performance Notes

- **First run:** ~30-60 seconds (depends on CSV size and disk speed)
- **Subsequent runs:** Faster due to indexing
- **Memory:** Minimal (streams CSV line-by-line)

## Troubleshooting

### "Database file not found"

Ensure the database exists. Run the generator first:

```bash
node scripts/generate-db.js
```

### "CSV file not found"

Verify CSV files are in `tmp/` directory with correct names:

- `countries.csv` ← Must be present for country name lookups
- `airports.csv`
- `runways.csv`
- `airport-frequencies.csv`

### "UNIQUE constraint failed"

This should not occur as the script uses `ON CONFLICT DO UPDATE`. If you see this, the database schema may differ from expectations.

### Low insert numbers

Most likely due to:

- Missing required fields in source CSV
- Mismatched airport identifiers between tables
- Filter logic (closed runways, invalid coordinates, etc.)

Check the skip count—skipped records are logged.

## Updating Data

To update the database with new CSV data:

1. Replace CSV files in `tmp/` directory
2. Run the import script
3. Script automatically updates existing records and inserts new ones

No manual cleanup needed—handles upserts automatically.

## Quick Start Workflow

For a fresh import from scratch:

```bash
# 1. Generate empty database with schema
node scripts/generate-db.js

# 2. Ensure CSV files are in tmp/ directory
ls tmp/

# 3. Import data from CSVs
node scripts/import-csv.js

# 4. Verify import
npm run build
node dist/bin/airport-db.js --stats
```

This ensures the database is created with the correct schema before importing CSV data.
