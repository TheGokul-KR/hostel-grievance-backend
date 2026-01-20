import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!BASE_URL) {
  console.error("❌ VITE_API_BASE_URL is NOT defined");
}

const api = axios.create({
  baseURL: BASE_URL ? BASE_URL.replace(/\/$/, "") + "/api" : "",
  timeout: 15000,
  withCredentials: true // 🔥 REQUIRED for CORS with credentials
});

// ================= REQUEST =================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    }
    return Promise.reject(error);
  }
);

export default api;
