# Airport Data Model

`airport-db` provides a structured, extensible airport data model divided into four primary domains:

1. Identity
2. Location
3. Infrastructure
4. Operational (AIRAC-aware, optional)

The schema is designed to:

- Maintain stable identity keys
- Separate infrastructure from operational metadata
- Support AIRAC-aligned updates
- Allow extension without polluting the core model

# Core Types

## AirportType

```ts
export type AirportType =
  | "large_airport"
  | "medium_airport"
  | "small_airport"
  | "heliport"
  | "seaplane_base"
  | "balloonport"
  | "ultralight_park"
  | "gliderport"
  | "closed"
  | "other";
```

## AirportSource

```ts
export type AirportTypeSource =
  | "ourairports"
  | "openflights"
  | "faa"
  | "icao"
  | "derived"
  | "unknown";
```

## AirportStatus

```ts
export type AirportStatus = "operational" | "closed" | "military" | "private";
```

# Identity

Stable identifiers and classification.

```ts
export interface AirportIdentity {
  icao: string;
  iata?: string;
  faa?: string;
  local?: string;
  name: string;
  type: AirportType;
  typeSource?: AirportTypeSource;
  status?: AirportStatus;
  isPublicUse?: boolean;
}
```

### Design Notes

- `icao` is the primary lookup key.
- `iata` and `faa` are optional.
- `type` enables filtering by airport scale.
- `status` allows exclusion of non-operational fields.

# Location

Geographic and regional metadata.

```ts
export interface AirportLocation {
  latitude: number;
  longitude: number;
  elevationFt: number;
  country: string;
  countryCode: string;
  state?: string;
  county?: string;
  city?: string;
  zip?: string;
  timezone?: string;
  magneticVariation?: number;
}
```

### Design Notes

- Coordinates are stored in decimal degrees.
- Elevation is stored in feet.
- Magnetic variation may be AIRAC-dependent in some datasets.

# Infrastructure

Physical airport characteristics.

## RunwaySurface

```ts
export type RunwaySurface =
  | "asphalt"
  | "concrete"
  | "grass"
  | "gravel"
  | "water"
  | "dirt"
  | "unknown";
```

## Runway

```ts
export interface Runway {
  id: string;
  lengthFt: number;
  widthFt: number;
  surface: RunwaySurface;
  lighting: boolean;
}
```

## FuelType

```ts
export type FuelType = "100LL" | "JetA" | "MOGAS" | "UL94" | "SAF" | string;
```

Fuel types are extensible to allow region-specific or emerging fuel classifications.

## AirportInfrastructure

```ts
export interface AirportInfrastructure {
  runways: Runway[];
  hasTower: boolean;
  fuelTypes?: FuelType[];
  hasFBO?: boolean;
  hasHangars?: boolean;
  hasTieDowns?: boolean;
}
```

### Design Notes

- Runways are stored as an array to support multi-runway airports.
- Boolean infrastructure flags are optional where data is incomplete.

# Operational (AIRAC-Aware)

Operational metadata may update every 28 days depending on source alignment with AIRAC cycles.

## AirportFrequencies

```ts
export interface AirportFrequencies {
  atis?: string;
  tower?: string;
  ground?: string;
  clearance?: string;
  unicom?: string;
  approach?: string;
  departure?: string;
}
```

## AirportOperational

```ts
export interface AirportOperational {
  airacCycle: string;
  frequencies?: AirportFrequencies;
}
```

### Design Notes

- `airacCycle` is formatted as `"YYCC"` (e.g., `"2601"`).
- Operational data is optional and may not be present in all distributions.
- No proprietary SID/STAR or procedure coding is included.

# Full Airport Record

```ts
export interface Airport {
  identity: AirportIdentity;
  location: AirportLocation;
  infrastructure: AirportInfrastructure;
  operational?: AirportOperational;
}
```

# Search Types

## SearchOptions

```ts
export interface SearchOptions {
  icao?: string;
  iata?: string;
  name?: string;
  country?: string;
  countryCode?: string;
  state?: string;
  city?: string;
  type?: AirportType;
  hasTower?: boolean;
  minRunwayLengthFt?: number;
  maxRunwayLengthFt?: number;
  surface?: RunwaySurface;
}
```

# 🧠 Extensibility

`airport-db` supports safe extension without modifying the core schema.

```ts
export interface AirportExtension {}

export type ExtendedAirport<T = AirportExtension> = Airport & T;
```

This allows downstream packages or applications to add:

- Economic metadata
- Risk scoring
- Region tags
- Custom analytics fields

Without polluting the core distribution.

# Architectural Philosophy

`airport-db` intentionally:

- Separates identity from operational layers
- Avoids proprietary navigation datasets
- Keeps the schema neutral and application-agnostic
- Enables scalable versioning

The core model is stable.

Operational layers may evolve per AIRAC cycle.

Extensions are consumer-defined.
