# Publishing

This package uses Changesets for versioning and changelog management.

## One-Time Setup (New Machine)

Install GitHub CLI (`gh`):

- Windows: `winget install --id GitHub.cli`
- macOS: `brew install gh`
- Linux: https://cli.github.com/manual/installation

Authenticate:

```bash
gh auth login
```

Recommended options:

- GitHub.com
- SSH
- Authenticate with a web browser

Verify auth:

```bash
gh auth status
```

## Release Workflow

1. Create a changeset:

```bash
npm run changeset
```

2. Bump package version and update `CHANGELOG.md`:

```bash
npm run version-packages
```

3. Publish to npm:

```bash
npm publish
```

What happens on publish:

- `prepublishOnly` verifies `dist/airports.sqlite` exists and copies entrypoint code to `dist/`.
- `postpublish` runs `npm run release:github`.
- `release:github` creates a GitHub release with tag `v<version>`.
- If `CHANGELOG.md` has that version section, it is used as release notes.
- Otherwise, GitHub auto-generated notes are used.

## Manual GitHub Release

If needed:

```bash
npm run release:github
```
