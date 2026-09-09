import axios from "axios";
import { toast } from "sonner";

export const client = axios.create({
  baseURL: "/api",
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isLoginRequest = error.config?.url?.includes("/auth/login");
      if (!isLoginRequest) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_username");
        toast.error("Sessão expirada");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);
