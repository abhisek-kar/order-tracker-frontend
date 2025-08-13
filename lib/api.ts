import axios from "axios";
import { useAuthStore } from "./store";

const api = axios.create({
  baseURL:
    (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000") +
    "/api/v1",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
