import { Category } from "@/common/types/category";
import { axiosBaseQuery } from "@/config/api";
import { createSlice } from "@reduxjs/toolkit";
import { createApi } from "@reduxjs/toolkit/query/react";
import { IPaginationOptions, Pagination } from "nestjs-typeorm-paginate";

export interface CategoriesInitialState {
  loading: boolean;
  error: string;
  status: "pending" | "success" | "error";
  categories: Category[];
}

const initialState: CategoriesInitialState = {
  loading: false,
  error: "",
  status: "pending",
  categories: [],
};

const BASE_PATH = `/categories` as const;
const TAG_TYPE = `Categories` as const;

export const categoriessApi = createApi({
  reducerPath: "categoriesApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: [TAG_TYPE],
  endpoints: (build) => ({
    findOneCategory: build.query<Category, string>({
      query: (id: string) => ({ url: `${BASE_PATH}/${id}`, method: "GET" }),
    }),
    findAllCategories: build.query<Pagination<Category>, IPaginationOptions>({
      query: (
        pagination: IPaginationOptions = {
          page: 1,
          limit: 10,
        }
      ) => {
        const { page, limit } = pagination;
        const params = new URLSearchParams({
          page: `${page}`,
          limit: `${limit}`,
        }).toString();
        return {
          url: `${BASE_PATH}?${params}`,
          method: "GET",
        };
      },
      providesTags: (result) => {
        return result
          ? [
              ...result.items.map(({ id }) => ({
                type: TAG_TYPE,
                id,
              })),
              { type: TAG_TYPE, id: "PARTIAL-LIST" },
            ]
          : [{ type: TAG_TYPE, id: "PARTIAL-LIST" }];
      },
    }),
    createCategory: build.mutation<Category, Omit<Category, "id">>({
      query: (Categories: Omit<Category, "id">) => ({
        url: BASE_PATH,
        method: "POST",
        data: Categories,
      }),
      invalidatesTags: [TAG_TYPE],
    }),
    updateCategory: build.mutation<Category, Category>({
      query: (Categories: Category) => ({
        url: `${BASE_PATH}/${Categories.id}`,
        method: "PATCH",
        data: Categories,
      }),
      invalidatesTags: [TAG_TYPE],
    }),
    deleteCategory: build.mutation<Category, string>({
      query: (id: string) => ({
        url: `${BASE_PATH}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [TAG_TYPE],
    }),
  }),
});

export const {
  useFindAllCategoriesQuery,
  useFindOneCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoriessApi;

const categoriesSlice = createSlice({
  name: "categories",
  initialState,
  reducers: {},
  extraReducers: () => {
    // Add extra reducers here if needed
  },
});

const { reducer } = categoriesSlice;
export default reducer;
