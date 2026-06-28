import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LeadInput } from "../../../shared/validation/schemas";

interface QueryDetails {
  category: string;
  city: string;
  limit: number;
  parsedFilters: {
    websiteAvailable?: boolean;
    phoneAvailable?: boolean;
    openingNow?: boolean;
    maxDistance?: number;
  };
  explanation: string;
  source?: "worker" | "mcp" | "bizdata" | "cache" | "fallback";
  plan?: any;
  requestUrl?: string;
  total?: number;
  locationResolved?: string;
  dataQuality?: {
    with_address?: number;
    with_phone?: number;
    with_website?: number;
    note?: string;
  };
}

interface LeadState {
  searchResults: LeadInput[];
  queryDetails: QueryDetails | null;
  favorites: string[]; // List of favorite lead IDs
  loading: boolean;
  error: string | null;
}

const initialState: LeadState = {
  searchResults: [],
  queryDetails: null,
  favorites: [],
  loading: false,
  error: null,
};

const leadSlice = createSlice({
  name: "lead",
  initialState,
  reducers: {
    setSearchStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    setSearchSuccess: (
      state,
      action: PayloadAction<{ leads: LeadInput[]; queryDetails: QueryDetails }>
    ) => {
      state.searchResults = action.payload.leads;
      state.queryDetails = action.payload.queryDetails;
      state.loading = false;
    },
    setSearchFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    setFavorites: (state, action: PayloadAction<string[]>) => {
      state.favorites = action.payload;
    },
    toggleLocalFavorite: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const idx = state.favorites.indexOf(id);
      if (idx > -1) {
        state.favorites.splice(idx, 1);
      } else {
        state.favorites.push(id);
      }
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.queryDetails = null;
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  setSearchStart,
  setSearchSuccess,
  setSearchFailure,
  setFavorites,
  toggleLocalFavorite,
  clearSearchResults,
} = leadSlice.actions;

export default leadSlice.reducer;
export type { LeadState, QueryDetails };
