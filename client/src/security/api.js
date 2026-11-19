import axios from "axios";

axios.defaults.baseURL = process.env.REACT_APP_API_URL || "http://localhost:3001";
axios.defaults.withCredentials = true;

let csrfToken = null;
export function setCsrfToken(value) {
  csrfToken = value || null;
}

axios.interceptors.request.use((config) => {
  const method = (config.method || "get").toLowerCase();
  if (!["get", "head", "options"].includes(method) && csrfToken) {
    config.headers = config.headers || {};
    config.headers["X-CSRF-Token"] = csrfToken;
  }
  return config;
});

export default axios;

axios.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status;
    const url = error.config?.url || "";
    if (status === 401 && !url.includes("/auth/login") && typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth:expired"));
    }
    return Promise.reject(error);
  }
);
