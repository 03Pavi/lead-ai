import { apiClient } from "./client";

export const collectionApi = {
  getCollections: async () => {
    const response = await apiClient.get("/collections");
    return response.data;
  },

  getMetrics: async () => {
    const response = await apiClient.get("/collections?metrics=true");
    return response.data;
  },

  createCollection: async (name: string, description?: string, folderId?: string) => {
    const response = await apiClient.post("/collections", {
      type: "collection",
      name,
      description,
      folderId,
    });
    return response.data;
  },

  createFolder: async (name: string, description?: string) => {
    const response = await apiClient.post("/collections", {
      type: "folder",
      name,
      description,
    });
    return response.data;
  },

  updateCollection: async (id: string, updates: { name?: string; description?: string; folderId?: string; isArchived?: boolean }) => {
    const response = await apiClient.put("/collections", {
      type: "collection",
      id,
      ...updates,
    });
    return response.data;
  },

  deleteCollection: async (id: string) => {
    const response = await apiClient.delete(`/collections?type=collection&id=${id}`);
    return response.data;
  },

  deleteFolder: async (id: string) => {
    const response = await apiClient.delete(`/collections?type=folder&id=${id}`);
    return response.data;
  },
};
