// server.js — CourtFinder Express API
const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// ═══ OpenWeatherMap API Key ═══
// Get your free key at https://openweathermap.org/api
// Set it as an environment variable: OPENWEATHER_API_KEY=your_key_here
const WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || '';

// ═══ MIDDLEWARE ═══
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));

// ═══ API ROUTES ═══

// ── GET /api/courts ── List all courts (with optional filters)
app.get('/api/courts', (req, res) => {
  try {
    let courts = db.getAllCourts();

    // Apply filters from query params
    const { surface, lights, parking, min_courts, suburb, q } = req.query;

    if (surface) courts = courts.filter(c => c.surface === surface);
    if (lights === '1') courts = courts.filter(c => c.lights === 1);
    if (parking === '1') courts = courts.filter(c => c.parking === 1);
    if (min_courts) courts = courts.filter(c => c.courts_count >= parseInt(min_courts));
    if (suburb) courts = courts.filter(c => c.suburb.toLowerCase() === suburb.toLowerCase());
    if (q) {
      const query = q.toLowerCase();
      courts = courts.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.suburb.toLowerCase().includes(query) ||
        c.address.toLowerCase().includes(query)
      );
    }

    res.json({ success: true, count: courts.length, courts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/courts/:id ── Get single court detail
app.get('/api/courts/:id', (req, res) => {
  try {
    const court = db.getCourtById(parseInt(req.params.id));
    if (!court) return res.status(404).json({ success: false, error: 'Court not found' });
    res.json({ success: true, court });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/courts/:id/availability?date=YYYY-MM-DD ── Get availability grid
app.get('/api/courts/:id/availability', (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, error: 'date parameter required (YYYY-MM-DD)' });

    const availability = db.getAvailability(parseInt(req.params.id), date);
    if (!availability) return res.status(404).json({ success: false, error: 'Court not found' });

    res.json({ success: true, ...availability });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/bookings ── Create a booking (with conflict detection)
app.post('/api/bookings', (req, res) => {
  try {
    const { court_id, court_number, date, start_hour, end_hour, booker_name, booker_phone, booker_email, players } = req.body;

    // Validation
    if (!court_id || !court_number || !date || start_hour === undefined || !end_hour || !booker_name || !booker_phone || !booker_email) {
      return res.status(400).json({ success: false, error: 'Missing required fields: court_id, court_number, date, start_hour, end_hour, booker_name, booker_phone, booker_email' });
    }

    const result = db.createBooking({
      court_id: parseInt(court_id),
      court_number: parseInt(court_number),
      date,
      start_hour: parseInt(start_hour),
      end_hour: parseInt(end_hour),
      booker_name,
      booker_phone,
      booker_email,
      players: parseInt(players) || 2
    });

    if (!result.success) {
      return res.status(409).json(result); // 409 Conflict
    }

    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/bookings?email=xxx ── Get bookings by email
app.get('/api/bookings', (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false, error: 'email parameter required' });

    const bookings = db.getBookingsByEmail(email);
    res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE /api/bookings/:id ── Cancel a booking
app.delete('/api/bookings/:id', (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'email required in request body' });

    const result = db.cancelBooking(parseInt(req.params.id), email);
    if (!result.success) {
      return res.status(result.error === 'Booking not found' ? 404 : 403).json(result);
    }
    res.json({ success: true, message: 'Booking cancelled' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/bookings/:id/refund ── Request weather refund
app.post('/api/bookings/:id/refund', (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'email required in request body' });

    const result = db.refundBooking(parseInt(req.params.id), email);
    if (!result.success) {
      const status = result.error === 'Booking not found' ? 404 : 403;
      return res.status(status).json(result);
    }
    res.json({ success: true, refund_amount: result.refund_amount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/weather/:courtId?date=YYYY-MM-DD ── Weather for a court location
app.get('/api/weather/:courtId', async (req, res) => {
  try {
    const court = db.getCourtById(parseInt(req.params.courtId));
    if (!court) return res.status(404).json({ success: false, error: 'Court not found' });

    const date = req.query.date || new Date().toISOString().split('T')[0];

    // Check cache first
    const cached = db.getCachedWeather(court.lat, court.lng, date);
    if (cached) {
      return res.json({
        success: true,
        source: 'cache',
        weather: {
          date: cached.date,
          temp_min: cached.temp_min,
          temp_max: cached.temp_max,
          description: cached.description,
          icon: cached.icon,
          rain_prob: cached.rain_prob,
          wind_speed: cached.wind_speed
        }
      });
    }

    // If no API key, return fallback
    if (!WEATHER_API_KEY) {
      return res.json({
        success: true,
        source: 'fallback',
        message: 'No OPENWEATHER_API_KEY set. Set it to enable real weather data.',
        weather: {
          date,
          temp_min: null,
          temp_max: null,
          description: 'Weather unavailable',
          icon: null,
          rain_prob: 70,
          wind_speed: 0
        }
      });
    }

    // Fetch from OpenWeatherMap forecast API
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${court.lat}&lon=${court.lng}&appid=${WEATHER_API_KEY}&units=metric`;
    const apiRes = await fetch(url);
    const apiData = await apiRes.json();

    if (apiData.cod !== '200') {
      return res.status(502).json({ success: false, error: 'Weather API error', detail: apiData.message });
    }

    // Process forecast: group by date, find the target date
    const dayForecasts = {};
    for (const item of apiData.list) {
      const d = item.dt_txt.split(' ')[0];
      if (!dayForecasts[d]) dayForecasts[d] = [];
      dayForecasts[d].push(item);
    }

    const targetItems = dayForecasts[date];
    if (!targetItems || targetItems.length === 0) {
      return res.json({
        success: true,
        source: 'api',
        weather: { date, temp_min: null, temp_max: null, description: 'No forecast available for this date', icon: null, rain_prob: 0, wind_speed: 0 }
      });
    }

    // Aggregate
    const temps = targetItems.map(i => i.main.temp);
    const rainProbs = targetItems.map(i => (i.pop || 0) * 100);
    const winds = targetItems.map(i => i.wind.speed);
    // Pick the most common weather description from midday items
    const middayItem = targetItems.find(i => i.dt_txt.includes('12:00:00')) || targetItems[Math.floor(targetItems.length / 2)];

    const weatherData = {
      temp_min: Math.round(Math.min(...temps) * 10) / 10,
      temp_max: Math.round(Math.max(...temps) * 10) / 10,
      description: middayItem.weather[0].description,
      icon: middayItem.weather[0].icon,
      rain_prob: Math.round(Math.max(...rainProbs)),
      wind_speed: Math.round(Math.max(...winds) * 10) / 10
    };

    // Cache it
    db.cacheWeather(court.lat, court.lng, date, weatherData);

    res.json({ success: true, source: 'api', weather: { date, ...weatherData } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/weather/:courtId/hourly?date=YYYY-MM-DD ── Hourly rain % via Open-Meteo (free, no key)
// Returns 3 days (selected + next 2) with precise location (suburb) and exact times.
app.get('/api/weather/:courtId/hourly', async (req, res) => {
  try {
    const court = db.getCourtById(parseInt(req.params.courtId));
    if (!court) return res.status(404).json({ success: false, error: 'Court not found' });

    const date = req.query.date || new Date().toISOString().split('T')[0];
    const selected = new Date(date + 'T12:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysFromToday = Math.max(0, Math.ceil((selected - today) / (24 * 60 * 60 * 1000)));
    const forecastDays = Math.min(16, Math.max(3, daysFromToday + 3));

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${court.lat}&longitude=${court.lng}&hourly=precipitation_probability,temperature_2m&timezone=Australia/Sydney&forecast_days=${forecastDays}`;
    const apiRes = await fetch(url);
    const apiData = await apiRes.json();

    if (apiData.error) {
      return res.status(502).json({ success: false, error: 'Weather API error', detail: apiData.reason });
    }

    const times = apiData.hourly?.time || [];
    const probs = apiData.hourly?.precipitation_probability || [];
    const temps = apiData.hourly?.temperature_2m || [];
    const locationLabel = [court.suburb, 'Sydney'].filter(Boolean).join(', ');

    const byDate = {};
    for (let i = 0; i < times.length; i++) {
      const iso = times[i];
      const d = iso.slice(0, 10);
      if (!byDate[d]) byDate[d] = [];
      const hour = parseInt(iso.slice(11, 13), 10);
      byDate[d].push({
        hour,
        time_iso: iso,
        rain_prob: probs[i] != null ? probs[i] : 0,
        temp_c: temps[i] != null ? Math.round(temps[i] * 10) / 10 : null
      });
    }

    const days = [];
    for (let offset = 0; offset < 3; offset++) {
      const d = new Date(selected);
      d.setDate(d.getDate() + offset);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({ date: dateStr, hourly: byDate[dateStr] || [] });
    }

    res.json({
      success: true,
      source: 'open-meteo',
      location_label: locationLabel,
      days
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/weather/bulk?date=YYYY-MM-DD ── Weather for ALL courts (one area)
app.get('/api/weather/bulk', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const courts = db.getAllCourts();

    if (!WEATHER_API_KEY) {
      // Return empty weather for all courts
      const result = {};
      for (const c of courts) {
        result[c.id] = { date, temp_min: null, temp_max: null, description: 'Set OPENWEATHER_API_KEY', icon: null, rain_prob: 0, wind_speed: 0 };
      }
      return res.json({ success: true, source: 'fallback', weather: result });
    }

    // Since all courts are in the same area (~5km radius), use one API call
    // Use center point of all courts
    const avgLat = courts.reduce((s, c) => s + c.lat, 0) / courts.length;
    const avgLng = courts.reduce((s, c) => s + c.lng, 0) / courts.length;

    // Check cache for center point
    const cached = db.getCachedWeather(avgLat, avgLng, date);
    let weatherData;

    if (cached) {
      weatherData = {
        temp_min: cached.temp_min, temp_max: cached.temp_max,
        description: cached.description, icon: cached.icon,
        rain_prob: cached.rain_prob, wind_speed: cached.wind_speed
      };
    } else {
      const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${avgLat}&lon=${avgLng}&appid=${WEATHER_API_KEY}&units=metric`;
      const apiRes = await fetch(url);
      const apiData = await apiRes.json();

      if (apiData.cod !== '200') {
        return res.status(502).json({ success: false, error: 'Weather API error' });
      }

      const dayForecasts = {};
      for (const item of apiData.list) {
        const d = item.dt_txt.split(' ')[0];
        if (!dayForecasts[d]) dayForecasts[d] = [];
        dayForecasts[d].push(item);
      }

      const items = dayForecasts[date] || [];
      if (items.length === 0) {
        weatherData = { temp_min: null, temp_max: null, description: 'No forecast', icon: null, rain_prob: 0, wind_speed: 0 };
      } else {
        const temps = items.map(i => i.main.temp);
        const middayItem = items.find(i => i.dt_txt.includes('12:00:00')) || items[Math.floor(items.length / 2)];
        weatherData = {
          temp_min: Math.round(Math.min(...temps) * 10) / 10,
          temp_max: Math.round(Math.max(...temps) * 10) / 10,
          description: middayItem.weather[0].description,
          icon: middayItem.weather[0].icon,
          rain_prob: Math.round(Math.max(...items.map(i => (i.pop || 0) * 100))),
          wind_speed: Math.round(Math.max(...items.map(i => i.wind.speed)) * 10) / 10
        };
      }
      db.cacheWeather(avgLat, avgLng, date, weatherData);
    }

    // Apply same weather to all courts (they're all nearby)
    const result = {};
    for (const c of courts) {
      result[c.id] = { date, ...weatherData };
    }

    res.json({ success: true, source: cached ? 'cache' : 'api', weather: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── SPA fallback ──
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});

// ═══ START ═══
app.listen(PORT, () => {
  console.log(`\n🎾 CourtFinder running at http://localhost:${PORT}\n`);
  console.log(`   API:     http://localhost:${PORT}/api/courts`);
  console.log(`   Weather: ${WEATHER_API_KEY ? '✅ API key set' : '⚠️  No OPENWEATHER_API_KEY — weather will use fallback data'}`);
  console.log('');
});
