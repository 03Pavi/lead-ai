import { apiClient } from "./client";
import { LeadInput } from "../validation/schemas";

export const leadApi = {
  saveLead: async (collectionId: string, lead: LeadInput) => {
    const response = await apiClient.post("/leads", {
      action: "save",
      collectionId,
      lead,
    });
    return response.data;
  },

  toggleFavorite: async (leadId: string) => {
    const response = await apiClient.post("/leads", {
      action: "favorite",
      leadId,
    });
    return response.data;
  },

  deleteLead: async (collectionId: string, leadId: string) => {
    const response = await apiClient.post("/leads", {
      action: "delete",
      collectionId,
      leadId,
    });
    return response.data;
  },
};
