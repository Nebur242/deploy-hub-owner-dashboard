import { configureStore } from "@reduxjs/toolkit";
import auth from "./features/auth";
import { categoriesApi } from "./features/categories";
import { deploymentApi } from "./features/deployments";
import { mediaApi } from "./features/media";
import { projectsApi } from "./features/projects";
import { licensesApi } from "./features/licenses";
import { ordersApi } from "./features/orders";
import { userApi } from "./features/users";

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth,
      [categoriesApi.reducerPath]: categoriesApi.reducer,
      [mediaApi.reducerPath]: mediaApi.reducer,
      [projectsApi.reducerPath]: projectsApi.reducer,
      [licensesApi.reducerPath]: licensesApi.reducer,
      [deploymentApi.reducerPath]: deploymentApi.reducer,
      [ordersApi.reducerPath]: ordersApi.reducer,
      [userApi.reducerPath]: userApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        .concat(categoriesApi.middleware)
        .concat(mediaApi.middleware)
        .concat(projectsApi.middleware)
        .concat(licensesApi.middleware)
        .concat(deploymentApi.middleware)
        .concat(ordersApi.middleware)
        .concat(userApi.middleware),
    devTools: process.env.NODE_ENV !== "production",
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
