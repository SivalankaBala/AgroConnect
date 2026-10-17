import { useEffect, useState } from "react";
import {
  CloudSun,
  X,
  RefreshCw,
  Wind,
  Droplets,
  CloudRain,
  MapPin,
  Sparkles,
  Info
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { apiUrl } from "../config/api";

const SUPPORTED_LOCATIONS = [
  "Tuni",
  "Kakinada",
  "Rajahmundry",
  "Anakapalli",
  "Visakhapatnam",
  "Guntur",
  "Vijayawada",
  "Amaravati"
];

export function WeatherModal({ onClose }) {
  const { t, language } = useLanguage();
  const [selectedLocation, setSelectedLocation] = useState("Tuni");
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchWeather(selectedLocation);
  }, [selectedLocation]);

  async function fetchWeather(loc) {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(apiUrl(`/api/weather?location=${encodeURIComponent(loc)}`));
      if (!res.ok) {
        throw new Error("Could not fetch meteorological data.");
      }
      const data = await res.json();
      setWeatherData(data);
    } catch (err) {
      console.error("Weather error:", err);
      setError(err.message || "Failed to load weather data.");
    } finally {
      setLoading(false);
    }
  }

  function getAdvisoryText(key) {
    switch (key) {
      case "clear":
        return t("weather.advisoryClear");
      case "partlyCloudy":
        return t("weather.advisoryPartlyCloudy");
      case "overcast":
        return t("weather.advisoryOvercast");
      case "rain":
        return t("weather.advisoryRain");
      case "showers":
        return t("weather.advisoryShowers");
      case "fog":
        return t("weather.advisoryFog");
      case "thunderstorm":
        return t("weather.advisoryThunderstorm");
      default:
        return t("weather.advisoryPartlyCloudy");
    }
  }

  function formatForecastDay(dateStr) {
    try {
      const locale = language === "te" ? "te-IN" : language === "hi" ? "hi-IN" : "en-IN";
      const d = new Date(dateStr);
      return d.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });
    } catch {
      return dateStr;
    }
  }

  return (
    <div className="modal-backdrop-modern" onClick={onClose}>
      <div
        className="modal-window weather-modal-window"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="modal-close-round"
          onClick={onClose}
          aria-label="Close weather modal"
        >
          <X size={18} />
        </button>

        <div className="modal-inner-scroll">
          <div className="modal-title-bar">
            <div className="modal-title-icon-box blue">
              <CloudSun size={24} />
            </div>
            <div>
              <span className="modal-eyebrow">LIVE METEOROLOGY · వ్యవసాయ వాతావరణం</span>
              <h2>{t("weather.title")}</h2>
              <p>{t("weather.subtitle")}</p>
            </div>
          </div>

          {/* Location Bar */}
          <div className="weather-location-bar">
            <div className="location-select-wrap">
              <MapPin size={17} className="weather-pin" />
              <label htmlFor="weatherMandalSelect">
                {t("weather.selectLocation")}
              </label>
              <select
                id="weatherMandalSelect"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="weather-select"
              >
                {SUPPORTED_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    📍 {loc} (AP)
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="weather-refresh-btn"
              onClick={() => fetchWeather(selectedLocation)}
              title="Refresh forecast"
              disabled={loading}
            >
              <RefreshCw size={15} className={loading ? "spinner-icon" : ""} />
              <span>Refresh</span>
            </button>
          </div>

          {loading ? (
            <div className="state-box loading-box">
              <RefreshCw className="spinner-icon" size={32} />
              <h3>Fetching meteorological data for {selectedLocation}...</h3>
            </div>
          ) : error ? (
            <div className="state-box error-box">
              <Info size={28} />
              <h3>{error}</h3>
              <button
                type="button"
                className="btn-modal-submit green"
                onClick={() => fetchWeather(selectedLocation)}
              >
                Try Again
              </button>
            </div>
          ) : weatherData ? (
            <div className="weather-display-body">
              {/* CURRENT CONDITIONS CARD */}
              <div className="weather-current-hero">
                <div className="current-main-info">
                  <span className="current-condition-badge">
                    {weatherData.current.icon} {weatherData.current.condition}
                  </span>
                  <div className="current-temp-cluster">
                    <span className="current-temp-val">
                      {weatherData.current.temp}°C
                    </span>
                    <div className="current-sub-temps">
                      <span>{t("weather.feelsLike")} {weatherData.current.feelsLike}°C</span>
                      <span className="current-district">📍 {weatherData.district}, {weatherData.state}</span>
                    </div>
                  </div>
                </div>

                <div className="current-metrics-grid">
                  <div className="metric-pill">
                    <Droplets size={16} className="m-icon blue" />
                    <div>
                      <small>{t("weather.humidity")}</small>
                      <strong>{weatherData.current.humidity}%</strong>
                    </div>
                  </div>

                  <div className="metric-pill">
                    <Wind size={16} className="m-icon teal" />
                    <div>
                      <small>{t("weather.windSpeed")}</small>
                      <strong>{weatherData.current.windSpeed} km/h</strong>
                    </div>
                  </div>

                  <div className="metric-pill">
                    <CloudRain size={16} className="m-icon indigo" />
                    <div>
                      <small>{t("weather.rainProbability")}</small>
                      <strong>{weatherData.current.precipitation} mm</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* AGRICULTURAL ADVISORY BANNER */}
              <div className="agri-advisory-card">
                <div className="advisory-header">
                  <Sparkles size={18} className="advisory-sparkle" />
                  <h4>{t("weather.advisoryTitle")}</h4>
                </div>
                <p className="advisory-text">
                  {getAdvisoryText(weatherData.current.advisoryKey)}
                </p>
              </div>

              {/* 5-DAY FARMING FORECAST */}
              <div className="forecast-section">
                <h3>{t("weather.fiveDayForecast")}</h3>
                <div className="forecast-cards-row">
                  {weatherData.forecast.map((day, idx) => (
                    <div className="forecast-mini-card" key={day.date || idx}>
                      <span className="forecast-day-name">
                        {formatForecastDay(day.date)}
                      </span>
                      <span className="forecast-icon" aria-hidden="true">
                        {day.icon}
                      </span>
                      <div className="forecast-temps">
                        <strong className="temp-max">{day.maxTemp}°</strong>
                        <span className="temp-min">{day.minTemp}°</span>
                      </div>
                      <div className="forecast-rain-chance">
                        <Droplets size={11} />
                        <span>{day.rainProbability}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="weather-footer-attribution">
                <Info size={13} />
                <span>{weatherData.attribution}</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default WeatherModal;
