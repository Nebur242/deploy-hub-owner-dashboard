import { configureStore } from "@reduxjs/toolkit";
import auth from "./features/auth";
import { categoriesApi } from "./features/categories";

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth,
      [categoriesApi.reducerPath]: categoriesApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(categoriesApi.middleware),
    devTools: process.env.NODE_ENV !== "production",
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
