// db/migrate.js — Add toilet column to existing courts table (run once for old DBs)
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'courtfinder.db');

function migrate() {
  try {
    const db = new Database(DB_PATH);
    const cols = db.prepare("PRAGMA table_info(courts)").all();
    const hasToilet = cols.some((c) => c.name === 'toilet');
    if (!hasToilet) {
      db.exec('ALTER TABLE courts ADD COLUMN toilet INTEGER NOT NULL DEFAULT 0');
      console.log('✅ Added column courts.toilet');
    } else {
      console.log('ℹ️  Column courts.toilet already exists');
    }
    db.close();
  } catch (e) {
    console.error('Migration failed:', e.message);
    process.exit(1);
  }
}

migrate();
