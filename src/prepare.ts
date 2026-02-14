import initializeDatabase from "./init-db";

// This is automatically called when package.json's "prepare" script runs
// You can also manually initialize by importing this file

console.log("Initializing airport-db SQLite database...");

try {
  initializeDatabase();
  console.log("✓ Database initialization complete");
  console.log("✓ Database file created at: data/airports.db");
} catch (error) {
  console.error("✗ Failed to initialize database:", error);
  process.exit(1);
}
