import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useFindAllCategoriesQuery } from "@/store/features/categories";
import { useDebounce } from "@/hooks/use-debounce";
import { ParentCategorySelectorProps } from "./types";

export function ParentCategorySelector({
    form,
    isLoading,
    success,
    formName,
    formSlug,
    excludeCategoryId
}: ParentCategorySelectorProps) {
    const [parentCategoryOpen, setParentCategoryOpen] = useState(false);
    const [parentSearchQuery, setParentSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const debouncedParentSearch = useDebounce(parentSearchQuery, 300);

    // Get categories for parent selection with search and pagination
    const {
        data: categoriesData,
        isLoading: categoriesLoading,
        isFetching: categoriesFetching,
        refetch
    } = useFindAllCategoriesQuery({
        page: currentPage,
        limit: 10,
        search: debouncedParentSearch
    });

    // Extract categories array and metadata
    const allCategories = categoriesData?.items || [];
    const totalPages = categoriesData?.meta?.totalPages || 1;

    // Filter out categories that match the current form name or slug
    // This prevents selecting the current category as its own parent
    const categories = allCategories.filter(category => {
        return !(
            (formName && category.name === formName) ||
            (formSlug && category.slug === formSlug) ||
            (excludeCategoryId && category.id === excludeCategoryId)
        );
    });

    // Reset search and pagination when parent dropdown is opened
    useEffect(() => {
        if (parentCategoryOpen) {
            setParentSearchQuery("");
            setCurrentPage(1);
            refetch();
        }
    }, [parentCategoryOpen, refetch]);

    // Update search results when debounced query changes
    useEffect(() => {
        if (parentCategoryOpen) {
            setCurrentPage(1);
            refetch();
        }
    }, [debouncedParentSearch, refetch, parentCategoryOpen]);

    // Handle load more for parent categories
    const handleLoadMore = () => {
        if (currentPage < totalPages) {
            setCurrentPage(prev => prev + 1);
        }
    };

    return (
        <FormField
            control={form.control}
            name="parentCategory"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Parent Category</FormLabel>
                    <DropdownMenu open={parentCategoryOpen} onOpenChange={setParentCategoryOpen}>
                        <DropdownMenuTrigger asChild>
                            <FormControl>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={parentCategoryOpen}
                                    className={cn(
                                        "w-full justify-between",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    disabled={isLoading || success}
                                >
                                    {field.value && field.value !== "root" ? (
                                        allCategories.find((category) => category.id === field.value)?.name || "Select a parent"
                                    ) : field.value === "root" ? (
                                        "Root (Top-level category)"
                                    ) : (
                                        "Select a parent category (optional)"
                                    )}
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
                                if (target.closest('input')) {
                                    e.preventDefault();
                                }
                            }}
                            forceMount
                        >
                            <div className="p-2">
                                <Input
                                    placeholder="Search categories..."
                                    value={parentSearchQuery}
                                    onChange={(e) => setParentSearchQuery(e.target.value)}
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

                            {!categoriesLoading && !categories.length && !parentSearchQuery && (
                                <div className="py-2 px-2 text-center text-sm text-muted-foreground">
                                    No available parent categories
                                </div>
                            )}

                            {!categoriesLoading && !categories.length && parentSearchQuery && (
                                <div className="py-2 px-2 text-center text-sm text-muted-foreground">
                                    No matching categories found
                                </div>
                            )}

                            <DropdownMenuItem
                                onClick={() => {
                                    form.setValue("parentCategory", "root");
                                    setParentCategoryOpen(false);
                                }}
                                className={cn(field.value === "root" && "bg-accent text-accent-foreground")}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === "root" ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                Root (Top-level category)
                            </DropdownMenuItem>

                            {categories.length > 0 && <DropdownMenuSeparator />}

                            {categories.length > 0 && <DropdownMenuLabel>Categories</DropdownMenuLabel>}

                            <div className="max-h-[200px] overflow-y-auto">
                                {categories.map((category) => (
                                    <DropdownMenuItem
                                        key={category.id}
                                        onClick={() => {
                                            form.setValue("parentCategory", category.id);
                                            setParentCategoryOpen(false);
                                        }}
                                        className={cn(field.value === category.id && "bg-accent text-accent-foreground")}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                field.value === category.id ? "opacity-100" : "opacity-0"
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
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <FormDescription>
                        Assign this as a subcategory of an existing category.
                    </FormDescription>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}