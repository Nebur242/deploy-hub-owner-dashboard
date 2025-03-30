/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Code, FileText, Image, MessageSquare, Music, PenTool, Video, AlertCircle, Loader2, CheckCircle2, ChevronDown } from "lucide-react";
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFindAllCategoriesQuery } from "@/store/features/categories";
import { useDebounce } from "@/hooks/use-debounce";

// Define the schema for form validation
const categorySchema = z.object({
    name: z.string()
        .min(3, { message: "Name must be at least 3 characters" })
        .max(50, { message: "Name must be less than 50 characters" }),
    slug: z.string()
        .min(2, { message: "Slug must be at least 2 characters" })
        .regex(/^[a-z0-9-]+$/, {
            message: "Slug can only contain lowercase letters, numbers, and hyphens"
        }),
    description: z.string()
        .min(1, { message: "Description is required" })
        .max(500, { message: "Description must be less than 500 characters" }),
    icon: z.string(),
    status: z.enum(["active", "inactive", "pending"]),
    parentCategory: z.string().optional(),
    sortOrder: z.number()
        .min(1, { message: "Sort order must be a positive number" })
});

// Create type from schema
export type CategoryFormData = z.infer<typeof categorySchema>;

// Extended schema for updates that includes id
export const categoryUpdateSchema = categorySchema.extend({
    id: z.string()
});

export type CategoryUpdateFormData = z.infer<typeof categoryUpdateSchema>;

// Props for the form component
export interface CategoryFormProps {
    isEditing: boolean;
    initialData?: CategoryUpdateFormData;
    onSubmit: (data: CategoryFormData | CategoryUpdateFormData) => Promise<void>;
    isLoading: boolean;
    isSuccess: boolean;
    error?: any;
    excludeCategoryId?: string;
}

export default function CategoryForm({
    isEditing,
    initialData,
    onSubmit,
    isLoading,
    isSuccess,
    error,
    excludeCategoryId
}: CategoryFormProps) {
    const router = useRouter();
    const [success, setSuccess] = useState(false);
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

    // Initialize the form
    const form = useForm<CategoryFormData | CategoryUpdateFormData>({
        resolver: zodResolver(isEditing ? categoryUpdateSchema : categorySchema),
        defaultValues: initialData || {
            name: "",
            slug: "",
            description: "",
            icon: "code",
            status: "active",
            parentCategory: "",
            sortOrder: 1
        }
    });

    // Get current form values to filter categories
    const formName = form.watch("name");
    const formSlug = form.watch("slug");

    // Filter out categories that match the current form name or slug
    // This prevents selecting the current category as its own parent
    const categories = allCategories.filter(category => {
        return !(
            (formName && category.name === formName) ||
            (formSlug && category.slug === formSlug) ||
            (excludeCategoryId && category.id === excludeCategoryId)
        );
    });

    const icons = [
        { name: "code", icon: <Code className="h-6 w-6" /> },
        { name: "image", icon: <Image className="h-6 w-6" /> },
        { name: "video", icon: <Video className="h-6 w-6" /> },
        { name: "music", icon: <Music className="h-6 w-6" /> },
        { name: "text", icon: <FileText className="h-6 w-6" /> },
        { name: "message", icon: <MessageSquare className="h-6 w-6" /> },
        { name: "pen", icon: <PenTool className="h-6 w-6" /> },
    ];

    // Update slug when name changes (only if not editing or if slug is empty)
    const updateSlug = (value: string) => {
        if (!isEditing || form.getValues("slug") === "") {
            const slug = value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
            form.setValue("slug", slug, { shouldValidate: true });
        }
    };

    // Handle name change and update slug
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        form.setValue("name", e.target.value);
        updateSlug(e.target.value);
    };

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

    // Monitor the success state
    useEffect(() => {
        if (isSuccess) {
            setSuccess(true);
            toast.success(isEditing ? "Category updated" : "Category created", {
                description: isEditing
                    ? "Your category has been updated successfully."
                    : "Your category has been created successfully.",
                duration: 5000,
            });

            // Redirect after a short delay to show success message
            const timer = setTimeout(() => {
                router.push("/dashboard/categories");
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [isSuccess, router, isEditing]);

    const handleFormSubmit = async (data: CategoryFormData | CategoryUpdateFormData) => {
        await onSubmit(data);
    };

    const handleDiscard = () => {
        form.reset();
        setSuccess(false);
    };

    // Extract error message from error
    const errorMessage = (() => {
        if (!error) return null;

        // Handle the specific error format returned by the API
        if (typeof error === 'object' && error !== null && 'data' in error) {
            const errorData = error.data as any;

            // Check for errors array
            if (errorData?.errors && Array.isArray(errorData.errors)) {
                return errorData.errors.join(', ');
            }

            // Check for message
            if (errorData?.message) {
                return errorData.message;
            }
        }

        // Fallback error message
        return isEditing ? 'Failed to update category' : 'Failed to create category';
    })();

    return (
        <>
            {success && (
                <Alert className="mb-6 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>
                        Category {isEditing ? "updated" : "created"} successfully. Redirecting to categories page...
                    </AlertDescription>
                </Alert>
            )}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleFormSubmit)}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Main column - 2/3 width */}
                        <div className="md:col-span-2 space-y-6">
                            {/* Basic Information Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Basic Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Name field */}
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Name</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="e.g. Software Development"
                                                        {...field}
                                                        onChange={handleNameChange}
                                                        disabled={isLoading || success}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Slug field */}
                                    <FormField
                                        control={form.control}
                                        name="slug"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Slug</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="e.g. software-development"
                                                        {...field}
                                                        disabled={isLoading || success || (isEditing && !!initialData?.slug)}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    {isEditing && !!initialData?.slug
                                                        ? "The slug cannot be changed after creation."
                                                        : "The slug is used in URLs and cannot be changed later."}
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Description field */}
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Describe this category..."
                                                        rows={3}
                                                        {...field}
                                                        disabled={isLoading || success}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    {field.value.length}/500 characters
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            {/* Icon selection card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Icon</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <FormField
                                        control={form.control}
                                        name="icon"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                                        {icons.map((iconObj) => (
                                                            <button
                                                                key={iconObj.name}
                                                                type="button"
                                                                onClick={() => form.setValue("icon", iconObj.name)}
                                                                className={`p-3 rounded-md flex items-center justify-center relative ${field.value === iconObj.name
                                                                    ? "bg-primary text-primary-foreground"
                                                                    : "border border-input hover:bg-accent hover:text-accent-foreground"
                                                                    }`}
                                                                disabled={isLoading || success}
                                                            >
                                                                {iconObj.icon}
                                                                {field.value === iconObj.name && (
                                                                    <div className="absolute -top-1 -right-1 bg-primary-foreground rounded-full">
                                                                        <Check className="h-4 w-4 text-primary" />
                                                                    </div>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </FormControl>
                                                <FormDescription>
                                                    Select an icon to represent this category.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar column - 1/3 width */}
                        <div className="space-y-6">
                            {/* Status and Parent Category */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Organization & Status</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Status select */}
                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Status</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                    disabled={isLoading || success}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select status" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="active">Active</SelectItem>
                                                        <SelectItem value="inactive">Inactive</SelectItem>
                                                        <SelectItem value="pending">Pending</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormDescription>
                                                    Inactive categories won&apos;t be visible to users. Pending categories are awaiting approval.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Enhanced Parent Category with DropdownMenu */}
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
                                                                {field.value && field.value !== "none" ? (
                                                                    allCategories.find((category) => category.id === field.value)?.name || "Select a parent"
                                                                ) : field.value === "none" ? (
                                                                    "None (Top-level category)"
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
                                                                form.setValue("parentCategory", "none");
                                                                setParentCategoryOpen(false);
                                                            }}
                                                            className={cn(field.value === "none" && "bg-accent text-accent-foreground")}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    field.value === "none" ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            None (Top-level category)
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
                                    {/* Sort order */}
                                    <FormField
                                        control={form.control}
                                        name="sortOrder"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Sort Order</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        className="w-24"
                                                        {...field}
                                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                                        value={field.value}
                                                        disabled={isLoading || success}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Categories with lower numbers appear first.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            {/* Form Actions Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={isLoading || success}
                                    >
                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {success && <CheckCircle2 className="mr-2 h-4 w-4" />}
                                        {isLoading
                                            ? (isEditing ? "Updating..." : "Creating...")
                                            : success
                                                ? (isEditing ? "Updated" : "Created")
                                                : (isEditing ? "Save changes" : "Save category")}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full"
                                        onClick={handleDiscard}
                                        disabled={isLoading}
                                    >
                                        Reset Form
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {errorMessage && (
                        <Alert variant="destructive" className="mt-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{errorMessage}</AlertDescription>
                        </Alert>
                    )}
                </form>
            </Form>
        </>
    );
}