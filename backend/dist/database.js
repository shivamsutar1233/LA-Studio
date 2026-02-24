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
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
const path_1 = __importDefault(require("path"));
// Define the database path
const dbPath = path_1.default.resolve(__dirname, '..', 'data', 'leanangle.sqlite');
let db = null;
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
function initDb() {
    return __awaiter(this, void 0, void 0, function* () {
        if (db)
            return db;
        // Ensure data directory exists (sqlite handles creating the db file, but sometimes needs dir)
        const fs = require('fs');
        const dir = path_1.default.dirname(dbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        db = yield (0, sqlite_1.open)({
            filename: dbPath,
            driver: sqlite3_1.default.Database
        });
        // Enable foreign keys
        yield db.exec('PRAGMA foreign_keys = ON;');
        // Create tables
        yield db.exec(`
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
        const bookingsColumns = yield db.all("PRAGMA table_info(bookings)");
        const hasAddressId = bookingsColumns.some(c => c.name === 'addressId');
        if (!hasAddressId) {
            console.log("Migrating bookings table to include addressId...");
            try {
                yield db.exec(`ALTER TABLE bookings ADD COLUMN addressId TEXT REFERENCES addresses(id)`);
            }
            catch (e) {
                console.log("Migration warning (addressId):", e); // Catch errors if table was just recreated by migration below
            }
        }
        // Migration for Phase 8: Schema Split for images
        const columns = yield db.all("PRAGMA table_info(gears)");
        const hasImage = columns.some(c => c.name === 'image');
        if (hasImage) {
            console.log("Migrating gears table to use thumbnail and images...");
            yield db.exec(`
      ALTER TABLE gears RENAME COLUMN image TO thumbnail;
      ALTER TABLE gears ADD COLUMN images TEXT DEFAULT '[]';
    `);
        }
        // Migration for Phase 10: Multi-Gear Array Support & Drop FK
        const bookingSchemaQuery = yield db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='bookings'");
        if (bookingSchemaQuery) {
            const hasGearId = bookingSchemaQuery.sql.includes('gearId TEXT NOT NULL');
            const hasGearIdsFK = bookingSchemaQuery.sql.includes('FOREIGN KEY (gearIds) REFERENCES gears(id)');
            if (hasGearId || hasGearIdsFK) {
                console.log("Migrating bookings table to use pure gearIds array without FK constraints...");
                yield db.exec('PRAGMA foreign_keys=OFF;');
                yield db.exec(`
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
          FOREIGN KEY (userId) REFERENCES users(id),
          FOREIGN KEY (addressId) REFERENCES addresses(id)
        );
      `);
                if (hasGearId) {
                    const oldBookings = yield db.all('SELECT * FROM bookings');
                    const stmt = yield db.prepare('INSERT INTO bookings_new (id, userId, gearIds, startDate, endDate, status, customerName, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
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
                        yield stmt.run(b.id, b.userId, newGearIds, b.startDate, b.endDate, b.status, b.customerName, b.createdAt, fallbackAddressId);
                    }
                    yield stmt.finalize();
                }
                else {
                    // Safe mapping ensuring we copy standard columns, leaving addressId null if it didn't exist in source
                    const existingCols = yield db.all("PRAGMA table_info(bookings)");
                    const sourceCols = existingCols.map(c => c.name).join(', ');
                    yield db.exec(`INSERT INTO bookings_new (${sourceCols}) SELECT * FROM bookings;`);
                }
                yield db.exec('DROP TABLE bookings;');
                yield db.exec('ALTER TABLE bookings_new RENAME TO bookings;');
                yield db.exec('PRAGMA foreign_keys=ON;');
            }
        }
        // Seed Gears Data if empty
        const gearCount = yield db.get('SELECT COUNT(*) as count FROM gears');
        if (gearCount.count === 0) {
            console.log("Seeding initial gear data...");
            const stmt = yield db.prepare('INSERT INTO gears (id, name, category, pricePerDay, thumbnail, images) VALUES (?, ?, ?, ?, ?, ?)');
            for (const gear of gears) {
                yield stmt.run(gear.id, gear.name, gear.category, gear.pricePerDay, gear.thumbnail, gear.images);
            }
            yield stmt.finalize();
            console.log("Mock gear data seeded successfully.");
        }
        return db;
    });
}
function getDb() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!db) {
            return initDb();
        }
        return db;
    });
}
