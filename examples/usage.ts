/**
 * Example script showing how to use @tabletop-android/airport-db-data-sqlite in your application
 *
 * Usage: npx ts-node examples/usage.ts
 */

import {
  getAirportByICAO,
  getAirportsByCountry,
  getRunwaysByAirport,
  getFrequencies,
  countAirports,
  getDatabasePath,
} from "../src/db";

console.log("=== Airport Database Usage Examples ===\n");

// Example 1: Get airport by ICAO code
console.log("1. Get airport by ICAO code (KJFK):");
const jfk = getAirportByICAO("KJFK");
if (jfk) {
  console.log(`   Name: ${jfk.name}`);
  console.log(`   Country: ${jfk.country}`);
  console.log(`   Elevation: ${jfk.elevation_ft} ft\n`);
}

// Example 2: Get airports by country
console.log("2. Get airports in United States (first 5):");
const usAirports = getAirportsByCountry("US").slice(0, 5);
usAirports.forEach((airport) => {
  console.log(`   - ${airport.icao}: ${airport.name}`);
});
console.log();

// Example 3: Get runway information
if (jfk) {
  console.log("3. Get runway information for KJFK:");
  const runways = getRunwaysByAirport(jfk.icao);
  runways.forEach((runway) => {
    console.log(
      `   - Runway ${runway.id}: ${runway.length_ft}x${runway.width_ft} ft, ${runway.surface}`,
    );
  });
  console.log();
}

// Example 4: Get frequencies
if (jfk) {
  console.log("4. Get frequencies for KJFK:");
  const freq = getFrequencies(jfk.icao);
  if (freq) {
    console.log(`   Tower: ${freq.tower || "N/A"}`);
    console.log(`   Ground: ${freq.ground || "N/A"}`);
    console.log(`   ATIS: ${freq.atis || "N/A"}\n`);
  }
}

// Example 5: Get database statistics
console.log("5. Database Statistics:");
const totalAirports = countAirports();
console.log(`   Total airports: ${totalAirports}\n`);

// Database path for direct access
console.log("6. Database Location:");
console.log(`   ${getDatabasePath()}`);
