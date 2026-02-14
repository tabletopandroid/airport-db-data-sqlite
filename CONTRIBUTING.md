# Contributing to @tabletopandroid/airport-db-data-sqlite

Thank you for your interest in contributing to the airport database! This project is open-source and community-driven. We welcome contributions from everyone.

## What Can You Contribute?

- **Airport Data** — Add missing airports, update information
- **Data Corrections** — Fix coordinates, runway info, frequencies, etc.
- **Documentation** — Improve guides and examples
- **Data Sources** — Suggest or implement new data sources
- **Bug Reports** — Report inaccuracies or issues

## Getting Started

### Prerequisites

- Node.js 14+
- Git
- Basic familiarity with SQLite (optional)

### Local Setup

1. **Fork the repository**

   ```bash
   git clone https://github.com/your-username/airport-db-data-sqlite.git
   cd airport-db-data-sqlite
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Regenerate the database** (if adding data)
   ```bash
   npm run generate-db
   ```

## How to Contribute Data

### Adding Airport Information

The database schema supports:

```
airports table:
- ICAO code (primary key)
- IATA code
- FAA identifier
- Airport name, type, status
- Coordinates, elevation
- Country, state, city info
- Control tower flag

runways table:
- Runway ID, dimensions, surface, lighting

frequencies table:
- ATIS, tower, ground, clearance, unicom, approach, departure

operational table:
- AIRAC cycle information

fuel_available table:
- Available fuel types (100LL, JetA, etc.)

infrastructure table:
- FBO, hangars, tie-down availability
```

### Data Quality Standards

- **Accuracy** — Use verified public sources (FAA, ICAO, AOPA, etc.)
- **Completeness** — Fill in what you know; leave optional fields empty if unknown
- **Consistency** — Follow existing naming conventions
- **Attribution** — Cite your data source in commit messages

## Workflow

### 1. File an Issue First

For significant changes, open a GitHub issue to discuss:

- What data you want to add/change
- Why it matters
- Your data sources

```
Title: Add KLZU runway information
Description:
- Airport: Gwinnett County Airport (KLZU)
- Adding runway lengths and surfaces
- Source: FAA Instrument Flight Procedures database
```

### 2. Create a Branch

```bash
git checkout -b add/klzu-runways
```

### 3. Update the Data

Modify `scripts/generate-db.js` to add your data, or create a migration script for bulk updates.

Example adding to generate-db.js:

```javascript
db.run(`
  INSERT INTO runways (id, airport_id, length_ft, width_ft, surface, lighting)
  VALUES 
  ('09/27', 'KLZU', 6001, 100, 'asphalt', 1),
  ('03/21', 'KLZU', 5000, 75, 'concrete', 1)
`);
```

### 4. Regenerate the Database

```bash
npm run generate-db
```

### 5. Test Your Changes

- Verify the database file was created
- Check file size is reasonable (>90KB)
- Spot-check a few records if possible

### 6. Commit and Push

```bash
git add data/airports.sqlite scripts/generate-db.js
git commit -m "Add KLZU runway data from FAA database"
git push origin add/klzu-runways
```

### 7. Submit a Pull Request

- Reference any related issues
- Describe what data was added/changed
- Include your data sources

```
## Description
Added runway information for Gwinnett County Airport (KLZU)

## Data Source
FAA Instrument Flight Procedures database, accessed Feb 2026

## Changes
- Added 2 runways (09/27 and 03/21)
- Included dimensions and surface types
- Marked lighting status

Closes #5
```

## Code of Conduct

- Be respectful and constructive
- Focus on accuracy and data quality
- Give credit where it's due
- Help others learn and improve

## Questions?

- Check the [README.md](./README.md) for API documentation
- Review existing data for patterns
- Open a discussion issue for questions

## Data Attribution

This project uses data from:

- FAA (Federal Aviation Administration)
- ICAO (International Civil Aviation Organization)
- OpenFlights
- OurAirports.com
- Various national flight information services

When adding data, please attribute the source.

## License

By contributing, you agree that your contributions are licensed under the ODbL 1.0. See [LICENSE](./LICENSE) for details.

---

Thank you for making airport data better for everyone! ✈️
