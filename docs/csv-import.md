# CSV Import

Imports source CSV data into the packaged SQLite database.

Source of truth for data corrections is upstream OurAirports. This repo consumes those CSV exports.

## Script

- File: `scripts/import-csv.cjs`
- Default database: `dist/airports.sqlite`
- CSV directory: prefers `data/`, falls back to `tmp/` if all required CSVs exist there

Required CSV files:

- `airports.csv`
- `runways.csv`
- `airport-frequencies.csv`
- `countries.csv`

## Usage

Default database path:

```bash
node scripts/import-csv.cjs
```

Custom database path:

```bash
node scripts/import-csv.cjs /path/to/airports.sqlite
```

## What It Imports

### `airports`

- Upserts by `icao` (`ON CONFLICT(icao) DO UPDATE`)
- Requires: ICAO, name, latitude, longitude, elevation, country code
- Uses `countries.csv` to map `country_code` to country name

### `runways`

- Upserts by runway `id`
- Skips rows marked closed (`closed=1/true/yes`)
- Normalizes `surface` values (asphalt, concrete, grass, etc.)
- Writes to `runways.lighted` (boolean as `0/1`)

### `runway_ends`

- Built from `runways.csv` `le_*` and `he_*` columns
- Upserts runway-end rows after clearing existing ends for each runway
- Requires per-end: `ident`, `heading_degT`, `latitude_deg`, `longitude_deg`

### `frequencies`

- Groups by airport and upserts one row per airport in `frequencies`
- Maps types:
  - `atis -> atis`
  - `tower -> tower`
  - `ground -> ground`
  - `clearance -> clearance`
  - `ctaf/unicom -> unicom`
  - `approach -> approach`
  - `departure -> departure`

## Column Mapping

### Airports CSV -> `airports`

| CSV Column      | DB Column       |
| --- | --- |
| `icao_code`     | `icao` |
| `iata_code`     | `iata` |
| `gps_code`      | `faa` |
| `local_code`    | `local` |
| `name`          | `name` |
| `type`          | `type` |
| `latitude_deg`  | `latitude` |
| `longitude_deg` | `longitude` |
| `elevation_ft`  | `elevation_ft` |
| `iso_country`   | `country_code` |
| `iso_region`    | `state` |
| `municipality`  | `city` |

### Runways CSV -> `runways`

| CSV Column      | DB Column |
| --- | --- |
| `id`            | `id` |
| `airport_ident` | `airport_id` (lookup by airport ICAO) |
| `length_ft`     | `length_ft` |
| `width_ft`      | `width_ft` |
| `surface`       | `surface` (normalized) |
| `lighted`       | `lighted` |

### Runways CSV -> `runway_ends`

| CSV Column | DB Column |
| --- | --- |
| `le_ident` / `he_ident` | `ident` |
| `le_heading_degT` / `he_heading_degT` | `heading_degT` |
| `le_latitude_deg` / `he_latitude_deg` | `latitude_deg` |
| `le_longitude_deg` / `he_longitude_deg` | `longitude_deg` |
| `le_displaced_threshold_ft` / `he_displaced_threshold_ft` | `displaced_threshold_ft` |
| `le_elevation_ft` / `he_elevation_ft` | `elevation_ft` |

## Expected Output

The script prints inserted/updated and skipped counts for:

- airports
- runways
- runway ends
- frequencies

## Typical Workflow

```bash
# 1) Ensure schema/database exists
npm run generate-db

# 2) Import CSV data
node scripts/import-csv.cjs

# 3) Build package artifacts
npm run build
```

For a full refresh from source CSVs:

```bash
npm run build:full
```

## Troubleshooting

### Database file not found

Create the database first:

```bash
npm run generate-db
```

### CSV file not found

Ensure required CSV files are present in `data/` (or `tmp/` fallback).

### Low insert counts

Common causes:

- missing required fields in source data
- airport identifier mismatches between CSVs
- closed runways being skipped by design
