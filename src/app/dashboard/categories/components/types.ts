import { z } from "zod";
import { categorySchema, categoryUpdateSchema } from "./category-schemas";
import { UseFormReturn } from "react-hook-form";

// Types from schemas
export type CategoryFormData = z.infer<typeof categorySchema>;
export type CategoryUpdateFormData = z.infer<typeof categoryUpdateSchema>;

// Props for the main CategoryForm component
export interface CategoryFormProps {
  isEditing: boolean;
  initialData?: CategoryUpdateFormData;
  onSubmit: (data: CategoryFormData | CategoryUpdateFormData) => Promise<void>;
  isLoading: boolean;
  isSuccess: boolean;
  error?: Record<string, string>;
  excludeCategoryId?: string;
}

// Props for the BasicInformationCard component
export interface BasicInformationCardProps {
  form: UseFormReturn<CategoryFormData | CategoryUpdateFormData>;
  handleNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
  success: boolean;
  isEditing: boolean;
  initialData?: CategoryUpdateFormData;
}

// Props for the IconSelectionCard component
export interface IconSelectionCardProps {
  form: UseFormReturn<CategoryFormData | CategoryUpdateFormData>;
  isLoading: boolean;
  success: boolean;
}

// Props for the OrganizationStatusCard component
export interface OrganizationStatusCardProps {
  form: UseFormReturn<CategoryFormData | CategoryUpdateFormData>;
  isLoading: boolean;
  success: boolean;
  formName: string;
  formSlug: string;
  excludeCategoryId?: string;
}

// Props for the ActionCard component
export interface ActionCardProps {
  handleDiscard: () => void;
  isLoading: boolean;
  success: boolean;
  isEditing: boolean;
}

// Props for the SuccessAlert component
export interface SuccessAlertProps {
  isEditing: boolean;
}

// Props for the ErrorAlert component
export interface ErrorAlertProps {
  title?: string;
  message: string;
  className?: string;
}

// Props for the ParentCategorySelector component
export interface ParentCategorySelectorProps {
  form: UseFormReturn<CategoryFormData | CategoryUpdateFormData>;
  isLoading: boolean;
  success: boolean;
  formName: string;
  formSlug: string;
  excludeCategoryId?: string;
}

// Category item interface (for API response)
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  status: string;
  parentCategory?: string;
  sortOrder: number;
}
