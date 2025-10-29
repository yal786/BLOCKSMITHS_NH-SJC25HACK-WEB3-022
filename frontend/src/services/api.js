import axios from "axios";
export const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:4000",
  timeout: 30000, // Increased timeout for simulations
});
