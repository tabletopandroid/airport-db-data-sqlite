/**
 * Sample data seeding script for @tabletop-android/airport-db-data-sqlite
 *
 * This script demonstrates how to populate the database with airport data.
 * Usage: npx ts-node scripts/seed-sample-data.ts
 */

import { getDatabase } from "../src/db";

function seedSampleData() {
  const db = getDatabase();

  // Sample airport data
  const sampleAirports = [
    {
      icao: "KJFK",
      iata: "JFK",
      faa: "JFK",
      name: "John F. Kennedy International Airport",
      type: "large_airport",
      typeSource: "faa",
      status: "operational",
      isPublicUse: true,
      latitude: 40.6413,
      longitude: -73.7781,
      elevationFt: 13,
      country: "United States",
      countryCode: "US",
      state: "New York",
      city: "New York",
      timezone: "America/New_York",
      hasTower: true,
    },
    {
      icao: "EGLL",
      iata: "LHR",
      faa: null,
      name: "London Heathrow Airport",
      type: "large_airport",
      typeSource: "icao",
      status: "operational",
      isPublicUse: true,
      latitude: 51.4706,
      longitude: -0.4619,
      elevationFt: 83,
      country: "United Kingdom",
      countryCode: "GB",
      state: "England",
      city: "London",
      timezone: "Europe/London",
      hasTower: true,
    },
    {
      icao: "RJTT",
      iata: "HND",
      faa: null,
      name: "Tokyo International Airport",
      type: "large_airport",
      typeSource: "icao",
      status: "operational",
      isPublicUse: true,
      latitude: 35.5494,
      longitude: 139.7798,
      elevationFt: 33,
      country: "Japan",
      countryCode: "JP",
      state: "Tokyo",
      city: "Tokyo",
      timezone: "Asia/Tokyo",
      hasTower: true,
    },
  ];

  // Insert airports
  const insertAirport = db.prepare(`
    INSERT INTO airports (
      icao, iata, faa, name, type, type_source, status, 
      is_public_use, latitude, longitude, elevation_ft, 
      country, country_code, state, city, timezone, has_tower
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  console.log("Inserting sample airports...");
  sampleAirports.forEach((airport) => {
    try {
      insertAirport.run(
        airport.icao,
        airport.iata,
        airport.faa,
        airport.name,
        airport.type,
        airport.typeSource,
        airport.status,
        airport.isPublicUse ? 1 : 0,
        airport.latitude,
        airport.longitude,
        airport.elevationFt,
        airport.country,
        airport.countryCode,
        airport.state,
        airport.city,
        airport.timezone,
        airport.hasTower ? 1 : 0,
      );
      console.log(`✓ ${airport.icao}: ${airport.name}`);
    } catch (error) {
      console.log(`✗ ${airport.icao}: Already exists or error occurred`);
    }
  });

  // Sample runway data
  const sampleRunways = [
    {
      id: "04L/22R",
      airportIcao: "KJFK",
      lengthFt: 14572,
      widthFt: 200,
      surface: "asphalt",
      lighting: true,
    },
    {
      id: "04R/22L",
      airportIcao: "KJFK",
      lengthFt: 14511,
      widthFt: 200,
      surface: "asphalt",
      lighting: true,
    },
    {
      id: "09/27",
      airportIcao: "KJFK",
      lengthFt: 12000,
      widthFt: 150,
      surface: "concrete",
      lighting: true,
    },
  ];

  const insertRunway = db.prepare(`
    INSERT INTO runways (id, airport_icao, length_ft, width_ft, surface, lighting)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  console.log("\nInserting sample runways...");
  sampleRunways.forEach((runway) => {
    try {
      insertRunway.run(
        runway.id,
        runway.airportIcao,
        runway.lengthFt,
        runway.widthFt,
        runway.surface,
        runway.lighting ? 1 : 0,
      );
      console.log(
        `✓ ${runway.airportIcao}: Runway ${runway.id} (${runway.lengthFt} ft)`,
      );
    } catch (error) {
      console.log(`✗ ${runway.airportIcao}: Runway already exists`);
    }
  });

  // Sample frequency data
  const sampleFrequencies = [
    {
      airportIcao: "KJFK",
      atis: "127.75",
      tower: "118.1",
      ground: "121.9",
      clearance: "121.95",
      approach: "120.0",
      departure: "120.0",
    },
  ];

  const insertFrequencies = db.prepare(`
    INSERT INTO frequencies (airport_icao, atis, tower, ground, clearance, approach, departure)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  console.log("\nInserting sample frequencies...");
  sampleFrequencies.forEach((freq) => {
    try {
      insertFrequencies.run(
        freq.airportIcao,
        freq.atis,
        freq.tower,
        freq.ground,
        freq.clearance,
        freq.approach,
        freq.departure,
      );
      console.log(`✓ ${freq.airportIcao}: Frequencies added`);
    } catch (error) {
      console.log(`✗ ${freq.airportIcao}: Frequencies already exist`);
    }
  });

  console.log("\n✓ Sample data seeding complete!");
}

if (require.main === module) {
  try {
    seedSampleData();
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
}

export default seedSampleData;
