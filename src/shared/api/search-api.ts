import { apiClient } from "./client";

interface SearchFilters {
  category?: string;
  city?: string;
  radius?: number;
  distance?: number;
  lat?: number;
  lng?: number;
  websiteAvailable?: boolean;
  phoneAvailable?: boolean;
  openingNow?: boolean;
  page?: number;
  requestUrl?: string;
}

export const searchApi = {
  search: async (query: string, filters?: SearchFilters) => {
    const response = await apiClient.post("/search", { query, filters });
    return response.data;
  },
  getCategories: async () => {
    const response = await apiClient.get("/categories");
    return response.data;
  },
};
