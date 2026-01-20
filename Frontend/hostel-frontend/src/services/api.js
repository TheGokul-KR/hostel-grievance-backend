import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!BASE_URL) {
  console.error("❌ VITE_API_BASE_URL is NOT defined");
}

const api = axios.create({
  baseURL: BASE_URL ? BASE_URL.replace(/\/$/, "") + "/api" : "",
  timeout: 15000,
  withCredentials: true
});

// ❌ DO NOT FORCE CONTENT-TYPE HERE
// Axios must auto-detect multipart/form-data for FormData uploads

// ================= REQUEST =================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ⚠️ If sending FormData, remove content-type so browser sets boundary
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ================= RESPONSE =================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.error("API NETWORK ERROR:", error.message);
    } else {
      console.error(
        "API ERROR:",
        error.response.status,
        error.response.data
      );

      if (error.response.status === 401) {
        console.warn("Token rejected by server");
      }
    }

    return Promise.reject(error);
  }
);

export default api;
