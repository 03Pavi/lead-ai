import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface SettingsState {
  themeMode: "light" | "dark";
}

const initialState: SettingsState = {
  themeMode: "light",
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
  },
});

export const { setThemeMode, toggleThemeMode } = settingsSlice.actions;
export default settingsSlice.reducer;
export type { SettingsState };
