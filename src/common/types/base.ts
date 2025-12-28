// Base entity interface with common fields
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export type PaginatedResponse<T> = {
  items: T[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
};
