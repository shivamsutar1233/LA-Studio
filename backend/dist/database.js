"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDb = initDb;
exports.getDb = getDb;
const path_1 = __importDefault(require("path"));
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
// Define the database path (fallback for local sqlite if Turso creds not provided)
const dbPath = path_1.default.resolve(__dirname, '..', 'data', 'leanangle.sqlite');
let tursoClient = null;
let localDb = null;
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
let dbAdapter = null;
function initDb() {
    return __awaiter(this, void 0, void 0, function* () {
        if (dbAdapter)
            return dbAdapter;
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
                exec: (sql) => __awaiter(this, void 0, void 0, function* () {
                    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
                    for (const stmt of statements) {
                        yield tursoClient.execute(stmt);
                    }
                }),
                run: (sql, params) => __awaiter(this, void 0, void 0, function* () {
                    const args = Array.isArray(params) ? params : (params !== undefined ? [params] : []);
                    const result = yield tursoClient.execute({ sql, args });
                    return { changes: result.rowsAffected, lastID: result.lastInsertRowid };
                }),
                all: (sql, params) => __awaiter(this, void 0, void 0, function* () {
                    const args = Array.isArray(params) ? params : (params !== undefined ? [params] : []);
                    const result = yield tursoClient.execute({ sql, args });
                    return result.rows;
                }),
                get: (sql, params) => __awaiter(this, void 0, void 0, function* () {
                    const args = Array.isArray(params) ? params : (params !== undefined ? [params] : []);
                    const result = yield tursoClient.execute({ sql, args });
                    if (result.rows.length === 0)
                        return undefined;
                    return result.rows[0];
                }),
                prepare: (sql) => __awaiter(this, void 0, void 0, function* () {
                    return {
                        run: (...args) => __awaiter(this, void 0, void 0, function* () { yield tursoClient.execute({ sql, args }); }),
                        finalize: () => __awaiter(this, void 0, void 0, function* () { })
                    };
                })
            };
        }
        else {
            // ------------------------------------------------------------------
            // LOCAL SQLITE FALLBACK MODE (Windows Safe)
            // ------------------------------------------------------------------
            console.log("Connecting to Local SQLite Database (Fallback)...");
            // Ensure data directory exists
            const fs = require('fs');
            const dir = path_1.default.dirname(dbPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            localDb = yield (0, sqlite_1.open)({ filename: dbPath, driver: sqlite3_1.default.Database });
            dbAdapter = {
                exec: (sql) => __awaiter(this, void 0, void 0, function* () { yield localDb.exec(sql); }),
                run: (sql, params) => __awaiter(this, void 0, void 0, function* () {
                    const result = yield localDb.run(sql, params);
                    return { changes: result.changes, lastID: result.lastID };
                }),
                all: (sql, params) => __awaiter(this, void 0, void 0, function* () { return yield localDb.all(sql, params); }),
                get: (sql, params) => __awaiter(this, void 0, void 0, function* () { return yield localDb.get(sql, params); }),
                prepare: (sql) => __awaiter(this, void 0, void 0, function* () {
                    const stmt = yield localDb.prepare(sql);
                    return {
                        run: (...args) => __awaiter(this, void 0, void 0, function* () { yield stmt.run(...args); }),
                        finalize: () => __awaiter(this, void 0, void 0, function* () { yield stmt.finalize(); })
                    };
                })
            };
        }
        // Enable foreign keys
        yield dbAdapter.exec('PRAGMA foreign_keys = ON;');
        // Create tables
        yield dbAdapter.exec(`
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
        const bookingsColumns = yield dbAdapter.all("PRAGMA table_info(bookings)");
        const hasAddressId = bookingsColumns.some((c) => c.name === 'addressId');
        if (!hasAddressId) {
            console.log("Migrating bookings table to include addressId...");
            try {
                yield dbAdapter.exec(`ALTER TABLE bookings ADD COLUMN addressId TEXT REFERENCES addresses(id)`);
            }
            catch (e) {
                console.log("Migration warning (addressId):", e); // Catch errors if table was just recreated by migration below
            }
        }
        // Migration for Undertaking/Aadhaar
        const hasUndertaking = bookingsColumns.some((c) => c.name === 'undertakingSigned');
        if (!hasUndertaking) {
            console.log("Migrating bookings table to include undertaking/Aadhaar fields...");
            try {
                yield dbAdapter.exec(`
        ALTER TABLE bookings ADD COLUMN undertakingSigned INTEGER DEFAULT 0;
        ALTER TABLE bookings ADD COLUMN aadhaarNumber TEXT;
        ALTER TABLE bookings ADD COLUMN aadhaarUrl TEXT;
      `);
            }
            catch (e) {
                console.log("Migration warning (undertaking):", e);
            }
        }
        // Migration for Refund Status
        const hasRefundStatus = bookingsColumns.some((c) => c.name === 'refundStatus');
        if (!hasRefundStatus) {
            console.log("Migrating bookings table to include refundStatus field...");
            try {
                yield dbAdapter.exec(`ALTER TABLE bookings ADD COLUMN refundStatus TEXT;`);
            }
            catch (e) {
                console.log("Migration warning (refundStatus):", e);
            }
        }
        // Migration for Phase 8: Schema Split for images
        const columns = yield dbAdapter.all("PRAGMA table_info(gears)");
        const hasImage = columns.some((c) => c.name === 'image');
        if (hasImage) {
            console.log("Migrating gears table to use thumbnail and images...");
            yield dbAdapter.exec(`
      ALTER TABLE gears RENAME COLUMN image TO thumbnail;
      ALTER TABLE gears ADD COLUMN images TEXT DEFAULT '[]';
    `);
        }
        // Migration for Phase 10: Multi-Gear Array Support & Drop FK
        const bookingSchemaQuery = yield dbAdapter.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='bookings'");
        if (bookingSchemaQuery) {
            const hasGearId = bookingSchemaQuery.sql.includes('gearId TEXT NOT NULL');
            const hasGearIdsFK = bookingSchemaQuery.sql.includes('FOREIGN KEY (gearIds) REFERENCES gears(id)');
            if (hasGearId || hasGearIdsFK) {
                console.log("Migrating bookings table to use pure gearIds array without FK constraints...");
                yield dbAdapter.exec('PRAGMA foreign_keys=OFF;');
                yield dbAdapter.exec(`
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
                    const oldBookings = yield dbAdapter.all('SELECT * FROM bookings');
                    const stmt = yield dbAdapter.prepare('INSERT INTO bookings_new (id, userId, gearIds, startDate, endDate, status, customerName, createdAt, addressId, undertakingSigned, aadhaarNumber, aadhaarUrl, refundStatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
                    for (const b of oldBookings) {
                        // If it's already a JSON array due to some partial migration, keep it, else wrap it
                        let newGearIds = b.gearId;
                        try {
                            JSON.parse(newGearIds);
                        }
                        catch (_a) {
                            newGearIds = JSON.stringify([b.gearId]);
                        }
                        // Handle cases where old Bookings didn't have AddressId
                        const fallbackAddressId = b.addressId || null;
                        yield stmt.run(b.id, b.userId, newGearIds, b.startDate, b.endDate, b.status, b.customerName, b.createdAt, fallbackAddressId, b.undertakingSigned || 0, b.aadhaarNumber || null, b.aadhaarUrl || null, b.refundStatus || null);
                    }
                    yield stmt.finalize();
                }
                else {
                    // Safe mapping ensuring we copy standard columns, leaving addressId null if it didn't exist in source
                    const existingCols = yield dbAdapter.all("PRAGMA table_info(bookings)");
                    const sourceCols = existingCols.map((c) => c.name).join(', ');
                    yield dbAdapter.exec(`INSERT INTO bookings_new (${sourceCols}) SELECT * FROM bookings;`);
                }
                yield dbAdapter.exec('DROP TABLE bookings;');
                yield dbAdapter.exec('ALTER TABLE bookings_new RENAME TO bookings;');
                yield dbAdapter.exec('PRAGMA foreign_keys=ON;');
            }
        }
        // Seed Gears Data if empty
        const gearCount = yield dbAdapter.get('SELECT COUNT(*) as count FROM gears');
        // Need to handle Turso row return specifically for the count query as it might come back as numeric or object depending on driver cast
        const countVal = gearCount ? (gearCount.count !== undefined ? gearCount.count : gearCount['COUNT(*)']) : 0;
        if (countVal === 0) {
            console.log("Seeding initial gear data...");
            const stmt = yield dbAdapter.prepare('INSERT INTO gears (id, name, category, pricePerDay, thumbnail, images) VALUES (?, ?, ?, ?, ?, ?)');
            for (const gear of gears) {
                yield stmt.run(gear.id, gear.name, gear.category, gear.pricePerDay, gear.thumbnail, gear.images);
            }
            yield stmt.finalize();
            console.log("Mock gear data seeded successfully.");
        }
        return dbAdapter;
    });
}
function getDb() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!dbAdapter) {
            return initDb();
        }
        return dbAdapter;
    });
}
