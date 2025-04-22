// Base entity interface with common fields
export interface BaseEntity {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
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
