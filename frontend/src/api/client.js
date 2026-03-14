import axios from "axios";

const client = axios.create({
  baseURL: "/api",
  timeout: 30000,
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const detail = err.response?.data?.detail;

    const messages = {
      400: detail || "Bad request",
      401: "Invalid API key or unauthorized",
      404: "Resource not found",
      429: "Rate limited — slow down",
      500: "Backend error — check logs",
    };

    const message = messages[status] || detail || err.message || "Unknown error";
    return Promise.reject(new Error(message));
  }
);

export default client;
