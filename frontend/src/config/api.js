// AgroConnect API URL Configuration
// In production (e.g. Vercel), set VITE_API_URL to your Render backend URL:
// Example: https://agroconnect-backend.onrender.com
// In local development, if VITE_API_URL is omitted or empty, requests use relative paths
// which are proxied to http://localhost:5000 by Vite.

const rawBaseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";

export const API_BASE_URL = rawBaseUrl ? rawBaseUrl.replace(/\/+$/, "") : "";

/**
 * Prepends the base backend API URL if configured.
 * @param {string} endpoint - The path or endpoint (e.g., '/api/crops')
 * @returns {string} - The full URL in production or relative path in dev proxy
 */
export const apiUrl = (endpoint = "") => {
  if (!endpoint) return API_BASE_URL;
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    return endpoint;
  }
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};

export default apiUrl;
