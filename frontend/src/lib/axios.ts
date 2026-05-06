import axios, { type InternalAxiosRequestConfig } from "axios";

import { ACCESS_TOKEN_STORAGE_KEY } from "@/lib/authStorageKey";
import { useAuthStore } from "@/store/authStore";

function setAuthHeader(config: InternalAxiosRequestConfig, token: string) {
  const raw = token.trim();
  if (!raw) return;

  const value = raw.toLowerCase().startsWith("bearer ") ? raw : `Bearer ${raw}`;
  const headers = config.headers;

  if (headers && typeof (headers as { set?: unknown }).set === "function") {
    (headers as { set: (k: string, v: string) => void }).set(
      "Authorization",
      value,
    );
  } else if (headers) {
    (headers as Record<string, string>)["Authorization"] = value;
  }
}

export const api = axios.create({
  baseURL: "http://localhost:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window === "undefined") {
    return config;
  }

  if (config.data instanceof FormData) {
    const h = config.headers;
    if (h && typeof (h as { delete?: (k: string) => void }).delete === "function") {
      (h as { delete: (k: string) => void }).delete("Content-Type");
    } else if (h && typeof h === "object") {
      delete (h as Record<string, unknown>)["Content-Type"];
    }
  }

  const storeToken = useAuthStore.getState().token;
  const token =
    storeToken && storeToken.length > 0
      ? storeToken
      : localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);

  if (token) {
    setAuthHeader(config, token);
  }

  return config;
});

/** @deprecated Prefer ACCESS_TOKEN_STORAGE_KEY from @/lib/authStorageKey */
export const TOKEN_KEY = ACCESS_TOKEN_STORAGE_KEY;
export { ACCESS_TOKEN_STORAGE_KEY };
export default api;
