import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const packageJsonPath = path.join(rootDir, "package.json");

function getPackageJson() {
  return JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
}

function inferRepoSlug(pkg) {
  if (process.env.GITHUB_REPOSITORY) {
    return process.env.GITHUB_REPOSITORY;
  }

  const repoUrl = pkg?.repository?.url || "";
  const match = repoUrl.match(/github\.com[:/](.+?)(?:\.git)?$/i);
  if (!match) {
    return null;
  }
  return match[1];
}

function hasGhCli() {
  const check = spawnSync("gh", ["--version"], { stdio: "ignore" });
  return check.status === 0;
}

function releaseExists(tag, repo) {
  try {
    execFileSync("gh", ["release", "view", tag, "--repo", repo], {
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function extractReleaseNotesFromChangelog(version) {
  const changelogPath = path.join(rootDir, "CHANGELOG.md");
  if (!fs.existsSync(changelogPath)) {
    return null;
  }

  const changelog = fs.readFileSync(changelogPath, "utf8");
  const escapedVersion = version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const headingRegex = new RegExp(
    `^##\\s+${escapedVersion}\\b[\\s\\S]*?(?=^##\\s+\\d+\\.\\d+\\.\\d+\\b|\\Z)`,
    "m",
  );
  const match = changelog.match(headingRegex);
  if (!match) {
    return null;
  }

  return match[0].trim();
}

function main() {
  const pkg = getPackageJson();
  const version = process.env.npm_package_version || pkg.version;
  const tag = `v${version}`;
  const repo = inferRepoSlug(pkg);

  if (!repo) {
    throw new Error(
      "Cannot infer GitHub repository. Set GITHUB_REPOSITORY or repository.url in package.json.",
    );
  }

  if (!hasGhCli()) {
    throw new Error(
      "GitHub CLI (gh) is required for postpublish release creation.",
    );
  }

  if (releaseExists(tag, repo)) {
    console.log(`GitHub release ${tag} already exists in ${repo}; skipping.`);
    return;
  }

  const changelogNotes = extractReleaseNotesFromChangelog(version);
  if (changelogNotes) {
    const notesFile = path.join(rootDir, ".release-notes.tmp.md");
    fs.writeFileSync(notesFile, changelogNotes + "\n", "utf8");
    try {
      execFileSync(
        "gh",
        [
          "release",
          "create",
          tag,
          "--repo",
          repo,
          "--title",
          tag,
          "--notes-file",
          notesFile,
        ],
        { stdio: "inherit" },
      );
    } finally {
      if (fs.existsSync(notesFile)) {
        fs.unlinkSync(notesFile);
      }
    }
  } else {
    execFileSync(
      "gh",
      [
        "release",
        "create",
        tag,
        "--repo",
        repo,
        "--generate-notes",
        "--title",
        tag,
      ],
      { stdio: "inherit" },
    );
  }

  console.log(`Created GitHub release ${tag} in ${repo}.`);
}

main();
