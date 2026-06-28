import { apiClient } from "./client";

export const authApi = {
  // Exchange a Firebase ID token for a BFF session (login or signup)
  exchangeToken: async (idToken: string) => {
    const response = await apiClient.post("/auth/login", { idToken });
    return response.data;
  },

  signup: async (idToken: string) => {
    const response = await apiClient.post("/auth/signup", { idToken });
    return response.data;
  },

  refresh: async () => {
    const response = await apiClient.post("/auth/refresh");
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post("/auth/logout");
    return response.data;
  },
};
