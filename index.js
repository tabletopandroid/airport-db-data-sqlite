import path from "path";
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
 * console.log(dbPath); // /path/to/node_modules/@tabletopandroid/airport-db-data-sqlite/data/airports.sqlite
 * ```
 */
export function getDatabasePath() {
  return path.join(__dirname, "data", "airports.sqlite");
}

export default getDatabasePath;
