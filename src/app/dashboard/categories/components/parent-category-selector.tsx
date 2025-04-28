/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Check, ChevronDown, Loader2, Plus, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  useFindAllCategoriesQuery,
  useCreateCategoryMutation
} from "@/store/features/categories";
import { useDebounce } from "@/hooks/use-debounce";
import { ParentCategorySelectorProps } from "./types";
import { UseFormReturn } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export interface CategoryItem {
  id: string;
  name: string;
  [key: string]: any;
}

export interface CategorySelectorProps {
  form: UseFormReturn<any>; // Generic form
  isLoading?: boolean;
  success?: boolean;
  fieldName: string; // Name of the field in the form
  label?: string;
  description?: string;
  placeholder?: string;
  multiple?: boolean; // Allow multiple selections
  excludeIds?: string[]; // IDs to exclude from selection
  excludeByField?: { fieldName: string; value: string }; // Exclude by comparing a field
  rootOption?: boolean; // Whether to include a "Root" option
  rootLabel?: string; // Label for the root option
  limit?: number; // Number of items to load per page
}

// Schema for quick category creation
const quickCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().optional(),
  slug: z.string().min(1, "Slug is required"),
});

type QuickCategoryFormData = z.infer<typeof quickCategorySchema>;

export function CategorySelector({
  form,
  isLoading = false,
  success = false,
  fieldName,
  label = "Category",
  description,
  placeholder = "Select a category",
  multiple = false,
  excludeIds = [],
  excludeByField,
  rootOption = false,
  rootLabel = "Root (Top-level category)",
  limit = 10,
}: CategorySelectorProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);

  // Get categories with search and pagination
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    isFetching: categoriesFetching,
    refetch,
  } = useFindAllCategoriesQuery({
    page: currentPage,
    limit,
    search: debouncedSearch,
  });

  // Category creation mutation
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();

  // Quick create category form
  const quickCreateForm = useForm<QuickCategoryFormData>({
    resolver: zodResolver(quickCategorySchema),
    defaultValues: {
      name: searchQuery || "",
      description: "",
      slug: "",
    },
  });

  // Update search query in quick create form when it changes
  useEffect(() => {
    if (searchQuery) {
      quickCreateForm.setValue("name", searchQuery);

      // Auto-generate slug from name
      const slug = searchQuery.toLowerCase()
        .replace(/[^\w\s-]/g, "") // Remove special characters
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/--+/g, "-") // Replace multiple hyphens with single hyphen
        .trim(); // Trim leading/trailing spaces

      quickCreateForm.setValue("slug", slug, { shouldValidate: true });
    }
  }, [searchQuery, quickCreateForm]);

  // Handle name change to auto-generate slug
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    quickCreateForm.setValue("name", name);

    // Auto-generate slug from name
    if (name) {
      const slug = name.toLowerCase()
        .replace(/[^\w\s-]/g, "") // Remove special characters
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/--+/g, "-") // Replace multiple hyphens with single hyphen
        .trim(); // Trim leading/trailing spaces

      quickCreateForm.setValue("slug", slug, { shouldValidate: true });
    } else {
      quickCreateForm.setValue("slug", "", { shouldValidate: true });
    }
  };

  // Extract categories array and metadata
  const allCategories = categoriesData?.items || [];
  const totalPages = categoriesData?.meta?.totalPages || 1;

  // Filter out excluded categories
  const categories = allCategories.filter((category) => {
    // Exclude by ID
    if (excludeIds.includes(category.id)) {
      return false;
    }

    // Exclude by field comparison
    if (
      excludeByField &&
      (category as Record<string, any>)[excludeByField.fieldName] ===
      excludeByField.value
    ) {
      return false;
    }

    return true;
  });

  // Reset search and pagination when dropdown is opened
  useEffect(() => {
    if (dropdownOpen) {
      setSearchQuery("");
      setCurrentPage(1);
      refetch();
    }
  }, [dropdownOpen, refetch]);

  // Update search results when debounced query changes
  useEffect(() => {
    if (dropdownOpen) {
      setCurrentPage(1);
      refetch();
    }
  }, [debouncedSearch, refetch, dropdownOpen]);

  // Handle load more categories
  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  // Get the display value for selection
  const getDisplayValue = (value: any) => {
    if (!value) return placeholder;

    // Handle single string value (e.g., "root" or category ID)
    if (typeof value === "string") {
      if (value === "root") return rootLabel;
      const category = allCategories.find((c) => c.id === value);
      return category ? category.name : placeholder;
    }

    // Handle array of objects with id field [{id: string}]
    if (
      Array.isArray(value) &&
      value.length > 0 &&
      typeof value[0] === "object" &&
      "id" in value[0]
    ) {
      return `${value.length} selected`;
    }

    // Handle array of strings
    if (Array.isArray(value) && value.length > 0) {
      return `${value.length} selected`;
    }

    return placeholder;
  };

  // Check if an item is selected
  const isSelected = (id: string) => {
    const value = form.getValues(fieldName);

    if (!value) return false;

    // Handle array of objects with id field [{id: string}]
    if (
      Array.isArray(value) &&
      value.length > 0 &&
      typeof value[0] === "object" &&
      "id" in value[0]
    ) {
      return value.some((item) => item.id === id);
    }

    // Handle array of strings [string]
    if (multiple && Array.isArray(value)) {
      return value.includes(id);
    }

    // Handle single string value
    return value === id;
  };

  // Handle item selection
  const handleSelect = (id: string) => {
    if (multiple) {
      const currentValue = form.getValues(fieldName) || [];

      // Handle array of objects with id field [{id: string}]
      if (
        Array.isArray(currentValue) &&
        (currentValue.length === 0 ||
          (typeof currentValue[0] === "object" && "id" in currentValue[0]))
      ) {
        const objectArray = Array.isArray(currentValue)
          ? [...currentValue]
          : [];
        const exists = objectArray.some((item) => item.id === id);

        if (exists) {
          // Remove if already selected
          form.setValue(
            fieldName,
            objectArray.filter((item) => item.id !== id),
            { shouldValidate: true }
          );
        } else {
          // Add to selection
          form.setValue(fieldName, [...objectArray, { id }], {
            shouldValidate: true,
          });
        }
      } else {
        // Handle array of strings
        const stringArray = Array.isArray(currentValue)
          ? [...currentValue]
          : [];

        if (stringArray.includes(id)) {
          // Remove if already selected
          form.setValue(
            fieldName,
            stringArray.filter((v) => v !== id),
            { shouldValidate: true }
          );
        } else {
          // Add to selection
          form.setValue(fieldName, [...stringArray, id], {
            shouldValidate: true,
          });
        }
      }
    } else {
      // Single selection
      form.setValue(fieldName, id, { shouldValidate: true });
      setDropdownOpen(false);
    }
  };

  // Remove a selected item (for multiple selection)
  const handleRemoveItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentValue = form.getValues(fieldName) || [];

    // Handle array of objects with id field [{id: string}]
    if (
      Array.isArray(currentValue) &&
      currentValue.length > 0 &&
      typeof currentValue[0] === "object" &&
      "id" in currentValue[0]
    ) {
      form.setValue(
        fieldName,
        currentValue.filter((item) => item.id !== id),
        { shouldValidate: true }
      );
    } else if (Array.isArray(currentValue)) {
      // Handle array of strings
      form.setValue(
        fieldName,
        currentValue.filter((v) => v !== id),
        { shouldValidate: true }
      );
    }
  };

  // Handle quick create category
  const handleQuickCreateCategory = async (data: QuickCategoryFormData) => {
    try {
      const result = await createCategory({
        name: data.name,
        slug: data.slug, // Now always required
        description: data.description,
        status: "active", // Default to active status
        icon: "code",
        sortOrder: 1
      }).unwrap();

      // Close dialog
      setQuickCreateOpen(false);

      // Reset form
      quickCreateForm.reset();

      // Show success message
      toast.success("Category created successfully", {
        description: `"${data.name}" has been added to your categories.`
      });

      // Refetch categories and auto-select the new one
      await refetch();

      // Select the newly created category
      if (result?.id) {
        handleSelect(result.id);
      }
    } catch (error) {
      console.error("Failed to create category:", error);
      const err = error as { data?: { message?: string } };
      toast.error("Failed to create category", {
        description: err?.data?.message || "An unexpected error occurred. Please try again."
      });
    }
  };

  // Open quick create dialog
  const openQuickCreateDialog = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickCreateOpen(true);
  };

  // Render selected items as badges (for multiple selection)
  const renderSelectedItems = () => {
    const value = form.getValues(fieldName);

    if (!multiple || !Array.isArray(value) || value.length === 0) {
      return null;
    }

    // Handle array of objects with id field [{id: string}]
    if (typeof value[0] === "object" && "id" in value[0]) {
      return (
        <div className="flex flex-wrap gap-1 mt-2">
          {value.map((item: any) => {
            const id = item.id;
            const category = allCategories.find((c) => c.id === id);
            return (
              <Badge
                key={id}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {category?.name || id}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={(e) => handleRemoveItem(id, e)}
                />
              </Badge>
            );
          })}
        </div>
      );
    }

    // Handle array of strings
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {value.map((id: string) => {
          const category = allCategories.find((c) => c.id === id);
          return (
            <Badge
              key={id}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {category?.name || id}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={(e) => handleRemoveItem(id, e)}
              />
            </Badge>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <FormField
        control={form.control}
        name={fieldName}
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>{label}</FormLabel>
            <div className="flex flex-col">
              <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={dropdownOpen}
                      className={cn(
                        "w-full justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                      disabled={isLoading || success}
                    >
                      {getDisplayValue(field.value)}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[300px]"
                  align="start"
                  onPointerDownOutside={(e) => {
                    // Prevent closing when clicking in the search input
                    const target = e.target as HTMLElement;
                    if (target.closest("input")) {
                      e.preventDefault();
                    }
                  }}
                  forceMount
                >
                  <div className="p-2">
                    <Input
                      placeholder="Search categories..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-8 mb-2"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      // Prevent the dropdown from closing when typing
                      onKeyDown={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  </div>

                  {categoriesLoading && !categories.length && (
                    <div className="flex items-center justify-center py-2 px-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading...
                    </div>
                  )}

                  {!categoriesLoading && !categories.length && !searchQuery && (
                    <div className="py-2 px-2 text-center text-sm text-muted-foreground">
                      No available categories
                    </div>
                  )}

                  {!categoriesLoading && !categories.length && searchQuery && (
                    <div className="py-2 px-2 text-center text-sm text-muted-foreground">
                      No matching categories found
                    </div>
                  )}

                  {rootOption && (
                    <DropdownMenuItem
                      onClick={() => handleSelect("root")}
                      className={cn(
                        isSelected("root") && "bg-accent text-accent-foreground"
                      )}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected("root") ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {rootLabel}
                    </DropdownMenuItem>
                  )}

                  {categories.length > 0 && (rootOption || !multiple) && (
                    <DropdownMenuSeparator />
                  )}

                  {categories.length > 0 && (
                    <DropdownMenuLabel>Categories</DropdownMenuLabel>
                  )}

                  <div className="max-h-[200px] overflow-y-auto">
                    {categories.map((category) => (
                      <DropdownMenuItem
                        key={category.id}
                        onClick={() => handleSelect(category.id)}
                        className={cn(
                          isSelected(category.id) &&
                          "bg-accent text-accent-foreground"
                        )}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            isSelected(category.id) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {category.name}
                      </DropdownMenuItem>
                    ))}
                  </div>

                  {currentPage < totalPages && (
                    <div className="p-2 pt-1 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleLoadMore();
                        }}
                        disabled={categoriesFetching}
                        className="w-full text-xs h-8"
                      >
                        {categoriesFetching ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          "Load more"
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Quick create option */}
                  <div className="p-2 pt-1 border-t">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full text-xs"
                      onClick={openQuickCreateDialog}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Create new category
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              {renderSelectedItems()}
            </div>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Quick Create Category Dialog */}
      <Dialog open={quickCreateOpen} onOpenChange={setQuickCreateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>
              Quickly create a new category. You can add more details later.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            quickCreateForm.handleSubmit(handleQuickCreateCategory)(e);
          }}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <FormLabel htmlFor="name">Name</FormLabel>
                <Input
                  id="name"
                  placeholder="Category name"
                  {...quickCreateForm.register("name")}
                  onChange={(e) => handleNameChange(e)}
                  className={quickCreateForm.formState.errors.name ? "border-destructive" : ""}
                />
                {quickCreateForm.formState.errors.name && (
                  <p className="text-sm text-destructive">{quickCreateForm.formState.errors.name.message}</p>
                )}
              </div>

              <div className="grid gap-2">
                <FormLabel htmlFor="slug">Slug <span className="text-xs text-muted-foreground">(auto-generated)</span></FormLabel>
                <Input
                  id="slug"
                  placeholder="category-slug"
                  {...quickCreateForm.register("slug")}
                  className={quickCreateForm.formState.errors.slug ? "border-destructive" : "bg-muted"}
                  readOnly
                />
                {quickCreateForm.formState.errors.slug && (
                  <p className="text-sm text-destructive">{quickCreateForm.formState.errors.slug.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Used in URLs. Automatically generated from name.
                </p>
              </div>

              <div className="grid gap-2">
                <FormLabel htmlFor="description">Description (optional)</FormLabel>
                <Textarea
                  id="description"
                  placeholder="Brief description of this category"
                  {...quickCreateForm.register("description")}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setQuickCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isCreating}
                onClick={() => quickCreateForm.handleSubmit(handleQuickCreateCategory)()}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Category"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Legacy component for backward compatibility
export function ParentCategorySelector({
  form,
  isLoading,
  success,
  formName,
  //   formSlug,
  excludeCategoryId,
}: ParentCategorySelectorProps) {
  return (
    <CategorySelector
      form={form}
      isLoading={isLoading}
      success={success}
      fieldName="parentCategory"
      label="Parent Category"
      description="Assign this as a subcategory of an existing category."
      placeholder="Select a parent category (optional)"
      multiple={false}
      excludeIds={excludeCategoryId ? [excludeCategoryId] : []}
      excludeByField={
        formName ? { fieldName: "name", value: formName } : undefined
      }
      rootOption={true}
      rootLabel="Root (Top-level category)"
    />
  );
}
