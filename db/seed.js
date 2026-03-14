// db/seed.js — Initialize SQLite database with schema + seed data
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'courtfinder.db');

function init() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // ═══ SCHEMA ═══

  db.exec(`
    -- Courts table
    CREATE TABLE IF NOT EXISTS courts (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT NOT NULL,
      address       TEXT NOT NULL,
      suburb        TEXT NOT NULL,
      courts_count  INTEGER NOT NULL DEFAULT 2,
      surface       TEXT NOT NULL CHECK(surface IN ('hard', 'synthetic_grass')),
      outdoor       INTEGER NOT NULL DEFAULT 1,
      lights        INTEGER NOT NULL DEFAULT 0,
      parking       INTEGER NOT NULL DEFAULT 0,
      open_hour     INTEGER NOT NULL DEFAULT 7,
      close_hour    INTEGER NOT NULL DEFAULT 20,
      price_per_hr  REAL NOT NULL DEFAULT 22,
      lights_price  REAL NOT NULL DEFAULT 0,
      phone         TEXT,
      email         TEXT,
      lat           REAL NOT NULL,
      lng           REAL NOT NULL,
      created_at    TEXT DEFAULT (datetime('now'))
    );

    -- Bookings table
    CREATE TABLE IF NOT EXISTS bookings (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      court_id      INTEGER NOT NULL,
      court_number  INTEGER NOT NULL,
      date          TEXT NOT NULL,
      start_hour    INTEGER NOT NULL,
      end_hour      INTEGER NOT NULL,
      booker_name   TEXT NOT NULL,
      booker_phone  TEXT NOT NULL,
      booker_email  TEXT NOT NULL,
      players       INTEGER NOT NULL DEFAULT 2,
      total_price   REAL NOT NULL DEFAULT 0,
      status        TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed', 'cancelled', 'refunded')),
      created_at    TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (court_id) REFERENCES courts(id)
    );

    -- Index for fast availability lookups
    CREATE INDEX IF NOT EXISTS idx_bookings_lookup
      ON bookings(court_id, court_number, date, status);

    -- Index for user booking queries
    CREATE INDEX IF NOT EXISTS idx_bookings_email
      ON bookings(booker_email, status);

    -- Weather cache table
    CREATE TABLE IF NOT EXISTS weather_cache (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      lat           REAL NOT NULL,
      lng           REAL NOT NULL,
      date          TEXT NOT NULL,
      temp_min      REAL,
      temp_max      REAL,
      description   TEXT,
      icon          TEXT,
      rain_prob     REAL DEFAULT 0,
      wind_speed    REAL DEFAULT 0,
      fetched_at    TEXT DEFAULT (datetime('now')),
      UNIQUE(lat, lng, date)
    );
  `);

  // ═══ SEED COURTS ═══

  const courts = [
    { name: "Gordon Recreation Ground", address: "Gordon Recreation Ground, Werona Ave, Gordon NSW 2072", suburb: "Gordon", courts_count: 4, surface: "hard", lights: 1, parking: 1, open_hour: 7, close_hour: 22, price_per_hr: 22, lights_price: 8, phone: "02 9424 0754", email: "recreationbookings@krg.nsw.gov.au", lat: -33.7557, lng: 151.1537 },
    { name: "Richmond Park", address: "Richmond Park, Gordon NSW 2072", suburb: "Gordon", courts_count: 2, surface: "hard", lights: 0, parking: 0, open_hour: 7, close_hour: 20, price_per_hr: 22, lights_price: 0, phone: "02 9424 0754", email: "recreationbookings@krg.nsw.gov.au", lat: -33.7589, lng: 151.1521 },
    { name: "Regimental Park", address: "Regimental Park, Pymble NSW 2073", suburb: "Pymble", courts_count: 2, surface: "hard", lights: 0, parking: 1, open_hour: 7, close_hour: 20, price_per_hr: 22, lights_price: 0, phone: "02 9424 0754", email: "recreationbookings@krg.nsw.gov.au", lat: -33.7448, lng: 151.1441 },
    { name: "Robert Pymble Park", address: "Robert Pymble Park, Pymble NSW 2073", suburb: "Pymble", courts_count: 2, surface: "synthetic_grass", lights: 0, parking: 1, open_hour: 7, close_hour: 20, price_per_hr: 22, lights_price: 0, phone: "02 9424 0754", email: "recreationbookings@krg.nsw.gov.au", lat: -33.7401, lng: 151.1389 },
    { name: "Kendall Village Green", address: "Kendall Village Green, Killara NSW 2071", suburb: "Killara", courts_count: 2, surface: "hard", lights: 0, parking: 0, open_hour: 7, close_hour: 20, price_per_hr: 22, lights_price: 0, phone: "02 9424 0754", email: "recreationbookings@krg.nsw.gov.au", lat: -33.7731, lng: 151.1612 },
    { name: "Killara Park", address: "Killara Park, Killara NSW 2071", suburb: "Killara", courts_count: 4, surface: "hard", lights: 1, parking: 1, open_hour: 7, close_hour: 22, price_per_hr: 22, lights_price: 8, phone: "02 9424 0754", email: "recreationbookings@krg.nsw.gov.au", lat: -33.7755, lng: 151.1587 },
    { name: "Allan Small Park", address: "Allan Small Park, St Ives NSW 2075", suburb: "St Ives", courts_count: 2, surface: "hard", lights: 0, parking: 1, open_hour: 7, close_hour: 20, price_per_hr: 22, lights_price: 0, phone: "02 9424 0754", email: "recreationbookings@krg.nsw.gov.au", lat: -33.7298, lng: 151.1667 },
    { name: "Queen Elizabeth Reserve", address: "Queen Elizabeth Reserve, Killara NSW 2071", suburb: "Killara", courts_count: 2, surface: "synthetic_grass", lights: 0, parking: 0, open_hour: 7, close_hour: 20, price_per_hr: 22, lights_price: 0, phone: "02 9424 0754", email: "recreationbookings@krg.nsw.gov.au", lat: -33.7812, lng: 151.1634 },
    { name: "St Ives Village Green", address: "St Ives Village Green, St Ives NSW 2075", suburb: "St Ives", courts_count: 4, surface: "hard", lights: 1, parking: 1, open_hour: 7, close_hour: 22, price_per_hr: 22, lights_price: 8, phone: "02 9424 0754", email: "recreationbookings@krg.nsw.gov.au", lat: -33.7287, lng: 151.1689 },
    { name: "Hamilton Park", address: "Hamilton Park, Lindfield NSW 2070", suburb: "Lindfield", courts_count: 2, surface: "hard", lights: 0, parking: 1, open_hour: 7, close_hour: 20, price_per_hr: 22, lights_price: 0, phone: "02 9424 0754", email: "recreationbookings@krg.nsw.gov.au", lat: -33.7812, lng: 151.1689 },
    { name: "Lindfield Community Centre", address: "Lindfield Community Centre, Lindfield NSW 2070", suburb: "Lindfield", courts_count: 2, surface: "hard", lights: 1, parking: 1, open_hour: 7, close_hour: 22, price_per_hr: 22, lights_price: 8, phone: "02 9424 0754", email: "recreationbookings@krg.nsw.gov.au", lat: -33.7798, lng: 151.1701 },
    { name: "Lindfield Soldiers Memorial", address: "Lindfield Soldiers Memorial Park, Lindfield NSW 2070", suburb: "Lindfield", courts_count: 2, surface: "synthetic_grass", lights: 0, parking: 1, open_hour: 7, close_hour: 20, price_per_hr: 22, lights_price: 0, phone: "02 9424 0754", email: "recreationbookings@krg.nsw.gov.au", lat: -33.7821, lng: 151.1712 }
  ];

  // Check if already seeded
  const count = db.prepare('SELECT COUNT(*) as c FROM courts').get().c;
  if (count === 0) {
    const insert = db.prepare(`
      INSERT INTO courts (name, address, suburb, courts_count, surface, lights, parking,
        open_hour, close_hour, price_per_hr, lights_price, phone, email, lat, lng)
      VALUES (@name, @address, @suburb, @courts_count, @surface, @lights, @parking,
        @open_hour, @close_hour, @price_per_hr, @lights_price, @phone, @email, @lat, @lng)
    `);

    const insertMany = db.transaction((items) => {
      for (const item of items) insert.run(item);
    });
    insertMany(courts);
    console.log(`✅ Seeded ${courts.length} courts`);

    // ═══ SEED SAMPLE BOOKINGS ═══
    const bookingInsert = db.prepare(`
      INSERT INTO bookings (court_id, court_number, date, start_hour, end_hour,
        booker_name, booker_phone, booker_email, players, total_price, status)
      VALUES (@court_id, @court_number, @date, @start_hour, @end_hour,
        @booker_name, @booker_phone, @booker_email, @players, @total_price, @status)
    `);

    const sampleNames = ['Alice Wang', 'Bob Smith', 'Charlie Chen', 'Diana Patel', 'Ethan Kim'];
    const today = new Date();
    let bookingCount = 0;

    for (const court of courts) {
      const courtRow = db.prepare('SELECT id FROM courts WHERE name = ?').get(court.name);
      if (!courtRow) continue;

      for (let ci = 1; ci <= court.courts_count; ci++) {
        for (let d = 0; d < 5; d++) {
          const dt = new Date(today);
          dt.setDate(dt.getDate() + d);
          const ds = dt.toISOString().split('T')[0];

          // 2-3 bookings per court per day
          const numB = 2 + Math.floor(Math.random() * 2);
          const usedHrs = new Set();

          for (let b = 0; b < numB; b++) {
            let sh = court.open_hour + Math.floor(Math.random() * (court.close_hour - court.open_hour - 1));
            if (usedHrs.has(sh)) sh++;
            if (sh >= court.close_hour) continue;
            usedHrs.add(sh);

            const dur = 1 + Math.floor(Math.random() * 2); // 1-2 hours
            const eh = Math.min(sh + dur, court.close_hour);
            const price = (eh - sh) * court.price_per_hr;
            const name = sampleNames[Math.floor(Math.random() * sampleNames.length)];

            bookingInsert.run({
              court_id: courtRow.id,
              court_number: ci,
              date: ds,
              start_hour: sh,
              end_hour: eh,
              booker_name: name,
              booker_phone: '04' + String(Math.floor(Math.random() * 100000000)).padStart(8, '0'),
              booker_email: name.toLowerCase().replace(' ', '.') + '@example.com',
              players: 2 + Math.floor(Math.random() * 3),
              total_price: price,
              status: 'confirmed'
            });
            bookingCount++;
          }
        }
      }
    }
    console.log(`✅ Seeded ${bookingCount} sample bookings`);

    // ═══ SEED DEMO USER BOOKINGS ═══
    const demoEmail = 'demo@courtfinder.com';
    const demoName = 'Alex Demo';
    const demoPhone = '0400000000';

    const dateOffset = (days) => {
      const d = new Date(today);
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    };

    const demoBookings = [
      { court_id: 9, court_number: 1, date: dateOffset(-1), start_hour: 10, end_hour: 12, players: 2, total_price: 44, status: 'confirmed' },
      { court_id: 6, court_number: 2, date: dateOffset(0), start_hour: 16, end_hour: 18, players: 4, total_price: 44, status: 'confirmed' },
      { court_id: 1, court_number: 1, date: dateOffset(1), start_hour: 15, end_hour: 17, players: 2, total_price: 44, status: 'confirmed' },
      { court_id: 6, court_number: 3, date: dateOffset(2), start_hour: 18, end_hour: 20, players: 3, total_price: 60, status: 'confirmed' },
      { court_id: 9, court_number: 2, date: dateOffset(3), start_hour: 9, end_hour: 11, players: 2, total_price: 44, status: 'confirmed' },
      { court_id: 3, court_number: 1, date: dateOffset(-3), start_hour: 14, end_hour: 15, players: 2, total_price: 22, status: 'cancelled' },
    ];

    for (const demo of demoBookings) {
      bookingInsert.run({ ...demo, booker_name: demoName, booker_phone: demoPhone, booker_email: demoEmail });
    }
    console.log(`✅ Seeded ${demoBookings.length} demo user bookings (${demoEmail})`);

  } else {
    console.log(`ℹ️  Database already has ${count} courts, skipping seed`);
  }

  db.close();
  console.log('✅ Database ready at', DB_PATH);
}

init();

module.exports = { DB_PATH };
