
import { persistReducer } from "redux-persist";
import createWebStorage from "redux-persist/es/storage/createWebStorage";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import userReducer from "../entities/user/model/user-slice";
import leadReducer from "../entities/lead/model/lead-slice";
import collectionReducer from "../entities/collection/model/collection-slice";
import settingsReducer from "../entities/settings/model/settings-slice";
import { clearCredentials } from "../entities/user/model/user-slice";

const createNoopStorage = () => {
  return {
    getItem(_key: any) {
      return Promise.resolve(null);
    },
    setItem(_key: any, value: any) {
      return Promise.resolve(value);
    },
    removeItem(_key: any) {
      return Promise.resolve();
    },
  };
};

const storage =
  typeof window !== "undefined"
    ? createWebStorage("local")
    : createNoopStorage();

const persistConfig = {
  key: "leadlens_root",
  storage,
  whitelist: ["user", "settings"], // Persist credentials and theme settings
};

const appReducer = combineReducers({
  user: userReducer,
  lead: leadReducer,
  collection: collectionReducer,
  settings: settingsReducer,
});

// Wrap the combined reducer: on logout (clearCredentials), wipe lead & collection
// slices back to their initial state so the next user doesn't see stale data.
const rootReducer: typeof appReducer = (state, action) => {
  if (action.type === clearCredentials.type) {
    // Keep settings (theme, etc.) but reset user-specific data
    return appReducer(
      {
        ...appReducer(undefined, { type: "@@INIT" }),
        settings: state?.settings ?? appReducer(undefined, { type: "@@INIT" }).settings,
      },
      action
    );
  }
  return appReducer(state, action);
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = () =>
  configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });

export type AppStore = ReturnType<typeof store>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
export default store;

