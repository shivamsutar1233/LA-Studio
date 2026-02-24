const sqlite3 = require('sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'data', 'leanangle.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='bookings'", (err, row) => {
    if (err) console.error(err);
    console.log("SCHEMA:", row ? row.sql : "Table not found");
  });
});
