// Types only import to prevent eager loading of the native binary on windows
import type { Client } from '@libsql/client';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

// Define the database path (fallback for local sqlite if Turso creds not provided)
const dbPath = path.resolve(__dirname, '..', 'data', 'leanangle.sqlite');

let tursoClient: Client | null = null;
let localDb: Database | null = null;

// Mock Data to seed the database
const gears = [
  {
    id: "1",
    name: "GoPro Hero 11 Black",
    category: "Camera",
    pricePerDay: 45,
    thumbnail: "/placeholder-camera.jpg",
    images: "[]"
  },
  {
    id: "2",
    name: "Insta360 X3",
    category: "Camera",
    pricePerDay: 50,
    thumbnail: "/placeholder-camera2.jpg",
    images: "[]"
  },
  {
    id: "3",
    name: "Rode Wireless GO II",
    category: "Audio",
    pricePerDay: 25,
    thumbnail: "/placeholder-audio.jpg",
    images: "[]"
  },
  {
    id: "4",
    name: "DJI Mic",
    category: "Audio",
    pricePerDay: 30,
    thumbnail: "/placeholder-audio2.jpg",
    images: "[]"
  },
  {
    id: "5",
    name: "Helmet Chin Mount",
    category: "Mounts",
    pricePerDay: 10,
    thumbnail: "/placeholder-mount.jpg",
    images: "[]"
  },
];

// Adapter Interface to match existing sqlite implementation
export interface DBAdapter {
  exec: (sql: string) => Promise<void>;
  run: (sql: string, params?: any) => Promise<any>;
  all: (sql: string, params?: any) => Promise<any[]>;
  get: (sql: string, params?: any) => Promise<any>;
  prepare: (sql: string) => Promise<{ run: (...args: any[]) => Promise<any>, finalize: () => Promise<void> }>;
}

let dbAdapter: DBAdapter | null = null;

export async function initDb(): Promise<DBAdapter> {
  if (dbAdapter) return dbAdapter;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (url && authToken) {
    // ------------------------------------------------------------------
    // REMOTE TURSO SERVERLESS MODE
    // ------------------------------------------------------------------
    console.log("Connecting to Remote Turso Database...");
    
    // Dynamically import libSql to prevent Windows C++ binding crashes locally when not using Turso
    const { createClient } = require('@libsql/client/web');
    tursoClient = createClient({ url, authToken });

    dbAdapter = {
      exec: async (sql: string) => {
        const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
        for (const stmt of statements) { await tursoClient!.execute(stmt); }
      },
      run: async (sql: string, params?: any) => {
        const args = Array.isArray(params) ? params : (params !== undefined ? [params] : []);
        const result = await tursoClient!.execute({ sql, args });
        return { changes: result.rowsAffected, lastID: result.lastInsertRowid };
      },
      all: async (sql: string, params?: any) => {
         const args = Array.isArray(params) ? params : (params !== undefined ? [params] : []);
         const result = await tursoClient!.execute({ sql, args });
         return result.rows as unknown as any[];
      },
      get: async (sql: string, params?: any) => {
         const args = Array.isArray(params) ? params : (params !== undefined ? [params] : []);
         const result = await tursoClient!.execute({ sql, args });
         if (result.rows.length === 0) return undefined;
         return result.rows[0] as unknown as any;
      },
      prepare: async (sql: string) => {
         return {
           run: async (...args: any[]) => { await tursoClient!.execute({ sql, args }); },
           finalize: async () => {}
         };
      }
    };
  } else {
    // ------------------------------------------------------------------
    // LOCAL SQLITE FALLBACK MODE (Windows Safe)
    // ------------------------------------------------------------------
    console.log("Connecting to Local SQLite Database (Fallback)...");
    
    // Ensure data directory exists
    const fs = require('fs');
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); }
    
    localDb = await open({ filename: dbPath, driver: sqlite3.Database });
    
    dbAdapter = {
      exec: async (sql: string) => { await localDb!.exec(sql); },
      run: async (sql: string, params?: any) => { 
        const result = await localDb!.run(sql, params); 
        return { changes: result.changes, lastID: result.lastID };
      },
      all: async (sql: string, params?: any) => { return await localDb!.all(sql, params); },
      get: async (sql: string, params?: any) => { return await localDb!.get(sql, params); },
      prepare: async (sql: string) => { 
        const stmt = await localDb!.prepare(sql); 
        return {
          run: async (...args: any[]) => { await stmt.run(...args); },
          finalize: async () => { await stmt.finalize(); }
        }
      }
    };
  }

  // Enable foreign keys
  await dbAdapter!.exec('PRAGMA foreign_keys = ON;');

  // Create tables
  await dbAdapter!.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user'
    );

    CREATE TABLE IF NOT EXISTS gears (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      pricePerDay REAL NOT NULL,
      thumbnail TEXT,
      images TEXT
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      userId TEXT,
      gearIds TEXT NOT NULL,
      startDate TEXT NOT NULL,
      endDate TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed',
      customerName TEXT,
      createdAt TEXT NOT NULL,
      undertakingSigned INTEGER DEFAULT 0,
      aadhaarNumber TEXT,
      aadhaarUrl TEXT,
      refundStatus TEXT,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS addresses (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      street TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      zip TEXT NOT NULL,
      isDefault INTEGER DEFAULT 0,
      FOREIGN KEY (userId) REFERENCES users(id)
    );
  `);

  // Migration for Phase 16: Add addressId to bookings
  const bookingsColumns = await dbAdapter!.all("PRAGMA table_info(bookings)");
  const hasAddressId = bookingsColumns.some((c: any) => c.name === 'addressId');
  if (!hasAddressId) {
    console.log("Migrating bookings table to include addressId...");
    try {
      await dbAdapter!.exec(`ALTER TABLE bookings ADD COLUMN addressId TEXT REFERENCES addresses(id)`);
    } catch (e) {
      console.log("Migration warning (addressId):", e); // Catch errors if table was just recreated by migration below
    }
  }

  // Migration for Undertaking/Aadhaar
  const hasUndertaking = bookingsColumns.some((c: any) => c.name === 'undertakingSigned');
  if (!hasUndertaking) {
    console.log("Migrating bookings table to include undertaking/Aadhaar fields...");
    try {
      await dbAdapter!.exec(`
        ALTER TABLE bookings ADD COLUMN undertakingSigned INTEGER DEFAULT 0;
        ALTER TABLE bookings ADD COLUMN aadhaarNumber TEXT;
        ALTER TABLE bookings ADD COLUMN aadhaarUrl TEXT;
      `);
    } catch (e) {
      console.log("Migration warning (undertaking):", e);
    }
  }

  // Migration for Refund Status
  const hasRefundStatus = bookingsColumns.some((c: any) => c.name === 'refundStatus');
  if (!hasRefundStatus) {
    console.log("Migrating bookings table to include refundStatus field...");
    try {
      await dbAdapter!.exec(`ALTER TABLE bookings ADD COLUMN refundStatus TEXT;`);
    } catch (e) {
      console.log("Migration warning (refundStatus):", e);
    }
  }

  // Migration for Phase 8: Schema Split for images
  const columns = await dbAdapter!.all("PRAGMA table_info(gears)");
  const hasImage = columns.some((c: any) => c.name === 'image');
  if (hasImage) {
    console.log("Migrating gears table to use thumbnail and images...");
    await dbAdapter!.exec(`
      ALTER TABLE gears RENAME COLUMN image TO thumbnail;
      ALTER TABLE gears ADD COLUMN images TEXT DEFAULT '[]';
    `);
  }

  // Migration for Phase 10: Multi-Gear Array Support & Drop FK
  const bookingSchemaQuery = await dbAdapter!.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='bookings'");
  if (bookingSchemaQuery) {
    const hasGearId = bookingSchemaQuery.sql.includes('gearId TEXT NOT NULL');
    const hasGearIdsFK = bookingSchemaQuery.sql.includes('FOREIGN KEY (gearIds) REFERENCES gears(id)');

    if (hasGearId || hasGearIdsFK) {
      console.log("Migrating bookings table to use pure gearIds array without FK constraints...");
      await dbAdapter!.exec('PRAGMA foreign_keys=OFF;');
      
      await dbAdapter!.exec(`
        CREATE TABLE IF NOT EXISTS bookings_new (
          id TEXT PRIMARY KEY,
          userId TEXT,
          gearIds TEXT NOT NULL,
          startDate TEXT NOT NULL,
          endDate TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'confirmed',
          customerName TEXT,
          createdAt TEXT NOT NULL,
          addressId TEXT,
          undertakingSigned INTEGER DEFAULT 0,
          aadhaarNumber TEXT,
          aadhaarUrl TEXT,
          refundStatus TEXT,
          FOREIGN KEY (userId) REFERENCES users(id),
          FOREIGN KEY (addressId) REFERENCES addresses(id)
        );
      `);

      if (hasGearId) {
        const oldBookings = await dbAdapter!.all('SELECT * FROM bookings');
        const stmt = await dbAdapter!.prepare('INSERT INTO bookings_new (id, userId, gearIds, startDate, endDate, status, customerName, createdAt, addressId, undertakingSigned, aadhaarNumber, aadhaarUrl, refundStatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        for (const b of oldBookings) {
          // If it's already a JSON array due to some partial migration, keep it, else wrap it
          let newGearIds = b.gearId;
          try { JSON.parse(newGearIds); } catch { newGearIds = JSON.stringify([b.gearId]); }
          // Handle cases where old Bookings didn't have AddressId
          const fallbackAddressId = b.addressId || null;
          await stmt.run(b.id, b.userId, newGearIds, b.startDate, b.endDate, b.status, b.customerName, b.createdAt, fallbackAddressId, b.undertakingSigned || 0, b.aadhaarNumber || null, b.aadhaarUrl || null, b.refundStatus || null);
        }
        await stmt.finalize();
      } else {
        // Safe mapping ensuring we copy standard columns, leaving addressId null if it didn't exist in source
        const existingCols = await dbAdapter!.all("PRAGMA table_info(bookings)");
        const sourceCols = existingCols.map((c: any) => c.name).join(', ');
        await dbAdapter!.exec(`INSERT INTO bookings_new (${sourceCols}) SELECT * FROM bookings;`);
      }

      await dbAdapter!.exec('DROP TABLE bookings;');
      await dbAdapter!.exec('ALTER TABLE bookings_new RENAME TO bookings;');
      await dbAdapter!.exec('PRAGMA foreign_keys=ON;');
    }
  }

  // Seed Gears Data if empty
  const gearCount = await dbAdapter!.get('SELECT COUNT(*) as count FROM gears');
  // Need to handle Turso row return specifically for the count query as it might come back as numeric or object depending on driver cast
  const countVal = gearCount ? (gearCount.count !== undefined ? gearCount.count : gearCount['COUNT(*)']) : 0;
  
  if (countVal === 0) {
    console.log("Seeding initial gear data...");
    const stmt = await dbAdapter!.prepare('INSERT INTO gears (id, name, category, pricePerDay, thumbnail, images) VALUES (?, ?, ?, ?, ?, ?)');
    for (const gear of gears) {
      await stmt.run(gear.id, gear.name, gear.category, gear.pricePerDay, gear.thumbnail, gear.images);
    }
    await stmt.finalize();
    console.log("Mock gear data seeded successfully.");
  }

  return dbAdapter!;
}

export async function getDb(): Promise<DBAdapter> {
  if (!dbAdapter) {
    return initDb();
  }
  return dbAdapter!;
}
