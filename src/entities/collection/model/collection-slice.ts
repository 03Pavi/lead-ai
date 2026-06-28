import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CollectionInput, FolderInput, LeadInput } from "../../../shared/validation/schemas";

interface ActivityLog {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

interface SavedSearch {
  id: string;
  query: string;
  parsedSummary: string;
  createdAt: string;
}

interface TelemetryMetrics {
  savedLeads: number;
  searches: number;
  collections: number;
  folders: number;
  exports: number;
  favoriteCategories: { name: string; count: number }[];
}

interface CollectionState {
  folders: FolderInput[];
  collections: CollectionInput[];
  savedSearches: SavedSearch[];
  activityLogs: ActivityLog[];
  metrics: TelemetryMetrics | null;
  loading: boolean;
  error: string | null;
}

const initialState: CollectionState = {
  folders: [],
  collections: [],
  savedSearches: [],
  activityLogs: [],
  metrics: null,
  loading: false,
  error: null,
};

const collectionSlice = createSlice({
  name: "collection",
  initialState,
  reducers: {
    setCollectionStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    setCollectionsSuccess: (
      state,
      action: PayloadAction<{
        folders: FolderInput[];
        collections: CollectionInput[];
        savedSearches: SavedSearch[];
      }>
    ) => {
      state.folders = action.payload.folders;
      state.collections = action.payload.collections;
      state.savedSearches = action.payload.savedSearches;
      state.loading = false;
    },
    setMetricsSuccess: (
      state,
      action: PayloadAction<{
        metrics: TelemetryMetrics;
        logs: ActivityLog[];
        savedSearches: SavedSearch[];
      }>
    ) => {
      state.metrics = action.payload.metrics;
      state.activityLogs = action.payload.logs;
      state.savedSearches = action.payload.savedSearches;
      state.loading = false;
    },
    setCollectionFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    addLocalCollection: (state, action: PayloadAction<CollectionInput>) => {
      state.collections.push(action.payload);
      if (action.payload.folderId) {
        const folder = state.folders.find(f => f.id === action.payload.folderId);
        if (folder) {
          folder.collectionIds.push(action.payload.id);
        }
      }
    },
    updateLocalCollection: (state, action: PayloadAction<CollectionInput>) => {
      const idx = state.collections.findIndex(c => c.id === action.payload.id);
      if (idx > -1) {
        state.collections[idx] = action.payload;
      }
    },
    deleteLocalCollection: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const col = state.collections.find(c => c.id === id);
      state.collections = state.collections.filter(c => c.id !== id);
      if (col?.folderId) {
        const folder = state.folders.find(f => f.id === col.folderId);
        if (folder) {
          folder.collectionIds = folder.collectionIds.filter(cid => cid !== id);
        }
      }
    },
    addLocalFolder: (state, action: PayloadAction<FolderInput>) => {
      state.folders.push(action.payload);
    },
    deleteLocalFolder: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      state.folders = state.folders.filter(f => f.id !== id);
      state.collections = state.collections.map(c =>
        c.folderId === id ? { ...c, folderId: undefined } : c
      );
    },
    saveLeadToLocalCollection: (
      state,
      action: PayloadAction<{ collectionId: string; lead: LeadInput }>
    ) => {
      const { collectionId, lead } = action.payload;
      const col = state.collections.find(c => c.id === collectionId);
      if (col && !col.leads.some(l => l.id === lead.id)) {
        col.leads.push(lead);
      }
    },
    removeLeadFromLocalCollection: (
      state,
      action: PayloadAction<{ collectionId: string; leadId: string }>
    ) => {
      const { collectionId, leadId } = action.payload;
      const col = state.collections.find(c => c.id === collectionId);
      if (col) {
        col.leads = col.leads.filter(l => l.id !== leadId);
      }
    },
  },
});

export const {
  setCollectionStart,
  setCollectionsSuccess,
  setMetricsSuccess,
  setCollectionFailure,
  addLocalCollection,
  updateLocalCollection,
  deleteLocalCollection,
  addLocalFolder,
  deleteLocalFolder,
  saveLeadToLocalCollection,
  removeLeadFromLocalCollection,
} = collectionSlice.actions;

export default collectionSlice.reducer;
export type { CollectionState, ActivityLog, SavedSearch, TelemetryMetrics };
