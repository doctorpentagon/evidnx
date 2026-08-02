import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
});

// Auth-header-injection slot (SPEC.md §5) — no-op today, wired for a future
// accounts system without touching call sites.
api.interceptors.request.use((config) => {
  return config;
});

export interface ApiEnvelope<T> {
  data: T;
}
