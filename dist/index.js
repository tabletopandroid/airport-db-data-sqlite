import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Get the path to the airports.sqlite database file
 *
 * @returns {string} Absolute path to airports.sqlite
 *
 * @example
 * ```javascript
 * import { getDatabasePath } from '@tabletopandroid/airport-db-data-sqlite';
 *
 * const dbPath = getDatabasePath();
 * console.log(dbPath); // /path/to/node_modules/@tabletopandroid/airport-db-data-sqlite/airports.sqlite
 * ```
 */
export function getDatabasePath() {
  const publishedPath = path.join(__dirname, "airports.sqlite");
  if (fs.existsSync(publishedPath)) {
    return publishedPath;
  }

  // Local development fallback when running directly from src/
  return path.join(__dirname, "..", "dist", "airports.sqlite");
}

export default getDatabasePath;
