// db/index.js — Database access layer
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'courtfinder.db');
let db;

function getDB() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

// ═══ COURTS ═══

function getAllCourts() {
  return getDB().prepare(`
    SELECT id, name, address, suburb, courts_count, surface, outdoor,
           lights, parking, open_hour, close_hour, price_per_hr, lights_price,
           phone, email, lat, lng
    FROM courts ORDER BY name
  `).all();
}

function getCourtById(id) {
  return getDB().prepare(`
    SELECT * FROM courts WHERE id = ?
  `).get(id);
}

// ═══ BOOKINGS ═══

/**
 * Get all confirmed bookings for a court on a specific date
 */
function getBookingsForCourt(courtId, date) {
  return getDB().prepare(`
    SELECT id, court_number, start_hour, end_hour, booker_name, players, status
    FROM bookings
    WHERE court_id = ? AND date = ? AND status = 'confirmed'
    ORDER BY court_number, start_hour
  `).all(courtId, date);
}

/**
 * Get availability grid: for each court_number, which hours are booked
 */
function getAvailability(courtId, date) {
  const court = getCourtById(courtId);
  if (!court) return null;

  const bookings = getBookingsForCourt(courtId, date);

  // Build grid: { courtNumber: { hour: booked|available } }
  const grid = {};
  for (let cn = 1; cn <= court.courts_count; cn++) {
    grid[cn] = {};
    for (let h = court.open_hour; h < court.close_hour; h++) {
      grid[cn][h] = 'available';
    }
  }

  for (const b of bookings) {
    for (let h = b.start_hour; h < b.end_hour; h++) {
      if (grid[b.court_number] && grid[b.court_number][h] !== undefined) {
        grid[b.court_number][h] = 'booked';
      }
    }
  }

  return {
    court_id: court.id,
    court_name: court.name,
    date,
    open_hour: court.open_hour,
    close_hour: court.close_hour,
    courts_count: court.courts_count,
    surface: court.surface,
    grid
  };
}

/**
 * Check if a time range conflicts with existing bookings
 * Returns array of conflicting bookings (empty = no conflict)
 */
function checkConflict(courtId, courtNumber, date, startHour, endHour) {
  return getDB().prepare(`
    SELECT id, start_hour, end_hour, booker_name
    FROM bookings
    WHERE court_id = ? AND court_number = ? AND date = ? AND status = 'confirmed'
      AND start_hour < ? AND end_hour > ?
  `).all(courtId, courtNumber, date, endHour, startHour);
}

/**
 * Create a new booking (with conflict check)
 * Returns { success, booking?, error? }
 */
function createBooking({ court_id, court_number, date, start_hour, end_hour, booker_name, booker_phone, booker_email, players }) {
  const court = getCourtById(court_id);
  if (!court) return { success: false, error: 'Court not found' };

  // Validate
  if (court_number < 1 || court_number > court.courts_count) {
    return { success: false, error: `Invalid court number. This venue has ${court.courts_count} courts.` };
  }
  if (start_hour < court.open_hour || end_hour > court.close_hour) {
    return { success: false, error: `Hours must be between ${court.open_hour}:00 and ${court.close_hour}:00` };
  }
  if (start_hour >= end_hour) {
    return { success: false, error: 'End time must be after start time' };
  }

  // Conflict check
  const conflicts = checkConflict(court_id, court_number, date, start_hour, end_hour);
  if (conflicts.length > 0) {
    const times = conflicts.map(c => `${c.start_hour}:00–${c.end_hour}:00`).join(', ');
    return { success: false, error: `Time conflict! Already booked: ${times}` };
  }

  // Calculate price
  const duration = end_hour - start_hour;
  let total = duration * court.price_per_hr;
  // Lights fee for hours after 18:00
  if (court.lights && (start_hour >= 18 || end_hour > 18)) {
    const nightHrs = Math.max(0, end_hour - Math.max(start_hour, 18));
    total += nightHrs * court.lights_price;
  }

  const result = getDB().prepare(`
    INSERT INTO bookings (court_id, court_number, date, start_hour, end_hour,
      booker_name, booker_phone, booker_email, players, total_price, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
  `).run(court_id, court_number, date, start_hour, end_hour,
    booker_name, booker_phone, booker_email, players || 2, total);

  const booking = getDB().prepare('SELECT * FROM bookings WHERE id = ?').get(result.lastInsertRowid);

  return { success: true, booking };
}

/**
 * Cancel a booking
 */
function cancelBooking(bookingId, email) {
  const booking = getDB().prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
  if (!booking) return { success: false, error: 'Booking not found' };
  if (booking.booker_email !== email) return { success: false, error: 'Email does not match booking' };
  if (booking.status === 'cancelled') return { success: false, error: 'Booking already cancelled' };

  getDB().prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?").run(bookingId);
  return { success: true };
}
/**
 * Refund a booking (weather-related)
 */
function refundBooking(bookingId, email) {
  const booking = getDB().prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
  if (!booking) return { success: false, error: 'Booking not found' };
  if (booking.booker_email !== email) return { success: false, error: 'Email does not match booking' };
  if (booking.status !== 'confirmed') return { success: false, error: 'Only confirmed bookings can be refunded' };

  // Check 24hr rule: booking date must be > 24hrs away
  const now = new Date();
  const bookingDate = new Date(booking.date + 'T' + String(booking.start_hour).padStart(2,'0') + ':00:00');
  const hoursUntil = (bookingDate - now) / (1000 * 60 * 60);
  if (hoursUntil < 24) {
    return { success: false, error: 'Weather refunds must be requested at least 24 hours before the booking.' };
  }

  getDB().prepare("UPDATE bookings SET status = 'refunded' WHERE id = ?").run(bookingId);
  return { success: true, refund_amount: booking.total_price };
}


/**
 * Get all bookings for an email address
 */
function getBookingsByEmail(email) {
  return getDB().prepare(`
    SELECT b.*, c.name as court_name, c.address as court_address, c.surface
    FROM bookings b
    JOIN courts c ON b.court_id = c.id
    WHERE b.booker_email = ?
    ORDER BY b.date DESC, b.start_hour DESC
  `).all(email);
}

// ═══ WEATHER CACHE ═══

function getCachedWeather(lat, lng, date) {
  // Round coords to 2 decimals for cache key
  const rlat = Math.round(lat * 100) / 100;
  const rlng = Math.round(lng * 100) / 100;
  return getDB().prepare(`
    SELECT * FROM weather_cache
    WHERE ROUND(lat, 2) = ? AND ROUND(lng, 2) = ? AND date = ?
      AND fetched_at > datetime('now', '-3 hours')
  `).get(rlat, rlng, date);
}

function cacheWeather(lat, lng, date, data) {
  const rlat = Math.round(lat * 100) / 100;
  const rlng = Math.round(lng * 100) / 100;
  getDB().prepare(`
    INSERT OR REPLACE INTO weather_cache (lat, lng, date, temp_min, temp_max, description, icon, rain_prob, wind_speed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(rlat, rlng, date, data.temp_min, data.temp_max, data.description, data.icon, data.rain_prob, data.wind_speed);
}

module.exports = {
  getDB,
  getAllCourts,
  getCourtById,
  getBookingsForCourt,
  getAvailability,
  checkConflict,
  createBooking,
  cancelBooking,
  refundBooking,
  getBookingsByEmail,
  getCachedWeather,
  cacheWeather
};
