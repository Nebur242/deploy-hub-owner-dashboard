import {
  CategoryQueryParamsDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from "@/common/dtos";
import { Category, PaginatedResponse } from "@/common/types";
import { axiosBaseQuery } from "@/config/api";
import { createSlice } from "@reduxjs/toolkit";
import { createApi } from "@reduxjs/toolkit/query/react";

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

export const categoriesApi = createApi({
  reducerPath: "categoriesApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: [TAG_TYPE],
  endpoints: (builder) => ({
    // Get all categories with pagination and filtering
    findAllCategories: builder.query<
      PaginatedResponse<Category>,
      CategoryQueryParamsDto
    >({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.limit) queryParams.append("limit", params.limit.toString());
        if (params.search) queryParams.append("search", params.search);
        if (params.parent_id) queryParams.append("parent_id", params.parent_id);
        if (params.status) queryParams.append("status", params.status);

        return {
          url: `${BASE_PATH}?${queryParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({
                type: TAG_TYPE,
                id,
              })),
              { type: TAG_TYPE, id: "LIST" },
            ]
          : [{ type: TAG_TYPE, id: "LIST" }],
    }),

    // Get a single category by ID
    findOneCategory: builder.query<Category, string>({
      query: (id) => ({
        url: `${BASE_PATH}/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: TAG_TYPE, id }],
    }),

    // Create a new category
    createCategory: builder.mutation<Category, CreateCategoryDto>({
      query: (categoryData) => ({
        url: BASE_PATH,
        method: "POST",
        data: categoryData,
      }),
      invalidatesTags: [{ type: TAG_TYPE, id: "LIST" }],
    }),

    // Update an existing category
    updateCategory: builder.mutation<Category, UpdateCategoryDto>({
      query: (categoryData) => {
        const { id, ...data } = categoryData;
        return {
          url: `${BASE_PATH}/${id}`,
          method: "PATCH",
          data,
        };
      },
      invalidatesTags: (result, error, { id }) => [
        { type: TAG_TYPE, id },
        { type: TAG_TYPE, id: "LIST" },
      ],
    }),

    // Delete a category
    deleteCategory: builder.mutation<void, string>({
      query: (id) => ({
        url: `${BASE_PATH}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: TAG_TYPE, id: "LIST" }],
    }),
  }),
});

export const {
  useFindAllCategoriesQuery,
  useFindOneCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApi;

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
