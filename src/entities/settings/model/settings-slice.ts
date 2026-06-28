import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface SettingsState {
  themeMode: "light" | "dark";
  useNearMe: boolean;
  userLocation: { lat: number; lng: number; timestamp: number } | null;
}

const initialState: SettingsState = {
  themeMode: "light",
  useNearMe: false,
  userLocation: null,
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<"light" | "dark">) => {
      state.themeMode = action.payload;
    },
    toggleThemeMode: (state) => {
      state.themeMode = state.themeMode === "light" ? "dark" : "light";
    },
    setUseNearMe: (state, action: PayloadAction<boolean>) => {
      state.useNearMe = action.payload;
    },
    setUserLocation: (state, action: PayloadAction<{ lat: number; lng: number } | null>) => {
      if (action.payload) {
        state.userLocation = { ...action.payload, timestamp: Date.now() };
      } else {
        state.userLocation = null;
      }
    },
  },
});

export const { setThemeMode, toggleThemeMode, setUseNearMe, setUserLocation } = settingsSlice.actions;
export default settingsSlice.reducer;
export type { SettingsState };
