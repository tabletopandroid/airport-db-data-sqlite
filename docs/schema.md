# SQLite Schema

Source of truth: `scripts/generate-db.js`

This package ships a SQLite database at `dist/airports.sqlite`.

## Notes

- SQLite does not have a native boolean type. `BOOLEAN` columns are stored as integer values (`0`/`1`).
- All foreign keys reference `airports(id)` with `ON DELETE CASCADE`.

## Tables

### `airports`

Primary airport identity and location metadata.

| Column               | Type       | Constraints                 | Default             |
| -------------------- | ---------- | --------------------------- | ------------------- |
| `id`                 | `INTEGER`  | `PRIMARY KEY AUTOINCREMENT` |                     |
| `icao`               | `TEXT`     | `NOT NULL`, `UNIQUE`        |                     |
| `iata`               | `TEXT`     | `UNIQUE`                    |                     |
| `faa`                | `TEXT`     | `UNIQUE`                    |                     |
| `local`              | `TEXT`     |                             |                     |
| `name`               | `TEXT`     | `NOT NULL`                  |                     |
| `type`               | `TEXT`     | `NOT NULL`                  |                     |
| `type_source`        | `TEXT`     |                             |                     |
| `status`             | `TEXT`     |                             |                     |
| `is_public_use`      | `BOOLEAN`  |                             |                     |
| `latitude`           | `REAL`     | `NOT NULL`                  |                     |
| `longitude`          | `REAL`     | `NOT NULL`                  |                     |
| `elevation_ft`       | `INTEGER`  | `NOT NULL`                  |                     |
| `country`            | `TEXT`     | `NOT NULL`                  |                     |
| `country_code`       | `TEXT`     | `NOT NULL`                  |                     |
| `state`              | `TEXT`     |                             |                     |
| `county`             | `TEXT`     |                             |                     |
| `city`               | `TEXT`     |                             |                     |
| `zip`                | `TEXT`     |                             |                     |
| `timezone`           | `TEXT`     |                             |                     |
| `magnetic_variation` | `REAL`     |                             |                     |
| `has_tower`          | `BOOLEAN`  | `NOT NULL`                  | `0`                 |
| `created_at`         | `DATETIME` |                             | `CURRENT_TIMESTAMP` |
| `updated_at`         | `DATETIME` |                             | `CURRENT_TIMESTAMP` |

### `runways`

Runway-level geometry and surface data.

| Column       | Type      | Constraints               | Default |
| ------------ | --------- | ------------------------- | ------- |
| `id`         | `INTEGER` | `PRIMARY KEY`             |         |
| `airport_id` | `INTEGER` | `NOT NULL`, `FOREIGN KEY` |         |
| `length_ft`  | `INTEGER` | `NOT NULL`                |         |
| `width_ft`   | `INTEGER` | `NOT NULL`                |         |
| `surface`    | `TEXT`    | `NOT NULL`                |         |
| `lighted`    | `BOOLEAN` | `NOT NULL`                |         |

### `runway_ends`

Per-end runway metadata (typically two rows per runway, e.g. `09` and `27`).

| Column                   | Type      | Constraints               | Default |
| ------------------------ | --------- | ------------------------- | ------- |
| `id`                     | `INTEGER` | `PRIMARY KEY`             |         |
| `runway_id`              | `INTEGER` | `NOT NULL`, `FOREIGN KEY` |         |
| `ident`                  | `TEXT`    | `NOT NULL`                |         |
| `heading_degT`           | `REAL`    | `NOT NULL`                |         |
| `latitude_deg`           | `REAL`    | `NOT NULL`                |         |
| `longitude_deg`          | `REAL`    | `NOT NULL`                |         |
| `displaced_threshold_ft` | `INTEGER` |                           |         |
| `elevation_ft`           | `INTEGER` |                           |         |

### `fuel_available`

Fuel types available by airport (many-to-one).

| Column       | Type      | Constraints                 | Default |
| ------------ | --------- | --------------------------- | ------- |
| `id`         | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` |         |
| `airport_id` | `INTEGER` | `NOT NULL`, `FOREIGN KEY`   |         |
| `fuel_type`  | `TEXT`    | `NOT NULL`                  |         |

Additional constraint:

- `UNIQUE(airport_id, fuel_type)`

### `infrastructure`

Airport facility flags (one row per airport).

| Column          | Type      | Constraints                  | Default |
| --------------- | --------- | ---------------------------- | ------- |
| `airport_id`    | `INTEGER` | `PRIMARY KEY`, `FOREIGN KEY` |         |
| `has_fbo`       | `BOOLEAN` |                              |         |
| `has_hangars`   | `BOOLEAN` |                              |         |
| `has_tie_downs` | `BOOLEAN` |                              |         |

### `operational`

Operational cycle metadata (one row per airport).

| Column        | Type      | Constraints                  | Default |
| ------------- | --------- | ---------------------------- | ------- |
| `airport_id`  | `INTEGER` | `PRIMARY KEY`, `FOREIGN KEY` |         |
| `airac_cycle` | `TEXT`    | `NOT NULL`                   |         |

### `frequencies`

Common radio frequencies by airport (one row per airport).

| Column       | Type      | Constraints                  | Default |
| ------------ | --------- | ---------------------------- | ------- |
| `airport_id` | `INTEGER` | `PRIMARY KEY`, `FOREIGN KEY` |         |
| `atis`       | `TEXT`    |                              |         |
| `tower`      | `TEXT`    |                              |         |
| `ground`     | `TEXT`    |                              |         |
| `clearance`  | `TEXT`    |                              |         |
| `unicom`     | `TEXT`    |                              |         |
| `approach`   | `TEXT`    |                              |         |
| `departure`  | `TEXT`    |                              |         |

## Indexes

Defined indexes:

- `idx_airports_icao` on `airports(icao)`
- `idx_airports_iata` on `airports(iata)`
- `idx_airports_country_code` on `airports(country_code)`
- `idx_airports_state` on `airports(state)`
- `idx_airports_city` on `airports(city)`
- `idx_airports_type` on `airports(type)`
- `idx_fuel_airport` on `fuel_available(airport_id)`

## Relationships

- `runways.airport_id -> airports.id`
- `runway_ends.runway_id -> runways.id`
- `fuel_available.airport_id -> airports.id`
- `infrastructure.airport_id -> airports.id`
- `operational.airport_id -> airports.id`
- `frequencies.airport_id -> airports.id`
