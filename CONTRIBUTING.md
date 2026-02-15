# Contributing to @tabletopandroid/airport-db-data-sqlite

Thanks for contributing.

## Source of Truth Policy

Data correctness in this project follows **OurAirports** as the canonical source.

- This repository is a **consumer/distribution** project.
- Do **not** submit direct airport/runway/frequency data corrections in this repo.
- Submit data fixes upstream to OurAirports first.

If a record is wrong here, the expected path is:

1. Open or link an upstream OurAirports issue/PR.
2. Wait for that change to land upstream.
3. Sync/update source CSVs in this repo and regenerate/import.

## What Contributions Are Welcome Here

- Import/build pipeline improvements (`scripts/`)
- Schema/import documentation (`docs/`)
- Packaging/release workflow improvements (npm/Changesets/GitHub release)
- Bug fixes in runtime helper code (`src/`)
- Tooling and developer-experience improvements

## What Not To Contribute Here

- Manual edits to airport/runway/frequency facts that are not yet in OurAirports
- New primary data sources that bypass OurAirports without maintainer approval

## Local Setup

```bash
git clone https://github.com/your-username/airport-db-data-sqlite.git
cd airport-db-data-sqlite
npm install
```

## Data Sync Workflow (After Upstream Update)

1. Update local CSV source files (`data/*.csv`) from OurAirports.
2. Rebuild database and import:

```bash
npm run build:full
```

3. Validate schema/import expectations:

- `docs/schema.md`
- `docs/csv-import.md`

4. Commit with clear context including upstream references.

Example commit message:

```text
sync: update source CSVs from OurAirports (refs ourairports#1234)
```

## Pull Request Expectations

Include in every PR:

- What changed and why
- Any upstream OurAirports issue/PR links (for data-affecting changes)
- Commands run locally to verify

## References

- Project overview: [README.md](./README.md)
- Schema source of truth: [docs/schema.md](./docs/schema.md)
- CSV import behavior: [docs/csv-import.md](./docs/csv-import.md)
- Publishing process: [docs/publishing.md](./docs/publishing.md)

## License

By contributing, you agree that your contributions are licensed under ODbL 1.0. See [LICENSE](./LICENSE).
