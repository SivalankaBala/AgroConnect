const express = require('express');

const router = express.Router();

const LOCATION_COORDINATES = {
  Tuni: { lat: 17.35, lon: 82.55, district: 'East Godavari', state: 'Andhra Pradesh' },
  Kakinada: { lat: 16.98, lon: 82.24, district: 'Kakinada', state: 'Andhra Pradesh' },
  Rajahmundry: { lat: 17.00, lon: 81.78, district: 'East Godavari', state: 'Andhra Pradesh' },
  Anakapalli: { lat: 17.69, lon: 83.00, district: 'Anakapalli', state: 'Andhra Pradesh' },
  Visakhapatnam: { lat: 17.68, lon: 83.21, district: 'Visakhapatnam', state: 'Andhra Pradesh' },
  Guntur: { lat: 16.30, lon: 80.44, district: 'Guntur', state: 'Andhra Pradesh' },
  Vijayawada: { lat: 16.50, lon: 80.64, district: 'NTR', state: 'Andhra Pradesh' },
  Amaravati: { lat: 16.54, lon: 80.51, district: 'Guntur', state: 'Andhra Pradesh' }
};

// In-memory cache for weather data (10-minute TTL)
const weatherCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

function interpretWmoCode(code) {
  if (code === 0) return { condition: 'Clear Sky', icon: '☀️', advisoryKey: 'clear' };
  if ([1, 2].includes(code)) return { condition: 'Partly Cloudy', icon: '🌤️', advisoryKey: 'partlyCloudy' };
  if (code === 3) return { condition: 'Overcast', icon: '☁️', advisoryKey: 'overcast' };
  if ([45, 48].includes(code)) return { condition: 'Foggy / Mist', icon: '🌫️', advisoryKey: 'fog' };
  if ([51, 53, 55].includes(code)) return { condition: 'Light Drizzle', icon: '🌦️', advisoryKey: 'drizzle' };
  if ([61, 63, 65].includes(code)) return { condition: 'Rain', icon: '🌧️', advisoryKey: 'rain' };
  if ([80, 81, 82].includes(code)) return { condition: 'Rain Showers', icon: '🌧️', advisoryKey: 'showers' };
  if ([95, 96, 99].includes(code)) return { condition: 'Thunderstorm', icon: '⛈️', advisoryKey: 'thunderstorm' };
  return { condition: 'Fair Weather', icon: '⛅', advisoryKey: 'fair' };
}

// GET /api/weather?location=Tuni
router.get('/', async (req, res) => {
  try {
    const requestedLoc = req.query.location || 'Tuni';
    const locKey = Object.keys(LOCATION_COORDINATES).find(
      (k) => k.toLowerCase() === requestedLoc.toLowerCase()
    ) || 'Tuni';

    const coords = LOCATION_COORDINATES[locKey];

    // Check cache
    const cached = weatherCache.get(locKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return res.json(cached.data);
    }

    // Call legitimate Open-Meteo Meteorological API
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FKolkata`;

    const apiRes = await fetch(url, { headers: { 'User-Agent': 'AgroConnect/1.0' } });
    if (!apiRes.ok) {
      throw new Error(`Weather service returned HTTP ${apiRes.status}`);
    }

    const data = await apiRes.json();
    const current = data.current || {};
    const daily = data.daily || {};

    const currentWeather = interpretWmoCode(current.weather_code);

    const forecast = (daily.time || []).slice(0, 5).map((date, idx) => {
      const code = daily.weather_code?.[idx] ?? 0;
      const interpretation = interpretWmoCode(code);
      return {
        date,
        maxTemp: Math.round(daily.temperature_2m_max?.[idx] ?? 0),
        minTemp: Math.round(daily.temperature_2m_min?.[idx] ?? 0),
        rainProbability: daily.precipitation_probability_max?.[idx] ?? 0,
        condition: interpretation.condition,
        icon: interpretation.icon
      };
    });

    const result = {
      location: locKey,
      district: coords.district,
      state: coords.state,
      coordinates: { lat: coords.lat, lon: coords.lon },
      current: {
        temp: Math.round(current.temperature_2m ?? 28),
        feelsLike: Math.round(current.apparent_temperature ?? 30),
        humidity: current.relative_humidity_2m ?? 70,
        windSpeed: current.wind_speed_10m ?? 12,
        precipitation: current.precipitation ?? 0,
        condition: currentWeather.condition,
        icon: currentWeather.icon,
        advisoryKey: currentWeather.advisoryKey
      },
      forecast,
      attribution: 'Weather data powered by Open-Meteo (open-meteo.com) under CC BY 4.0.',
      updatedAt: new Date().toISOString()
    };

    weatherCache.set(locKey, { timestamp: Date.now(), data: result });

    res.json(result);
  } catch (error) {
    console.error('Weather fetch error:', error.message);
    res.status(503).json({
      message: 'Weather service temporarily unavailable.',
      error: error.message,
      supportedLocations: Object.keys(LOCATION_COORDINATES)
    });
  }
});

// GET /api/weather/locations - List supported agricultural locations
router.get('/locations', (req, res) => {
  res.json(Object.keys(LOCATION_COORDINATES).map((name) => ({
    name,
    district: LOCATION_COORDINATES[name].district,
    state: LOCATION_COORDINATES[name].state
  })));
});

module.exports = router;
