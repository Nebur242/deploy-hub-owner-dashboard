"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TechStack, Visibility } from "@/common/types/project";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconLoader } from "@tabler/icons-react";
import { SuccessAlert, ErrorAlert } from "@/components/ui/alerts";
import { CategorySelector } from "@/app/dashboard/categories/components";

// Form schema
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  repository: z.string().url("Invalid URL"),
  techStack: z
    .array(z.nativeEnum(TechStack))
    .min(1, "Select at least one technology"),
  visibility: z.nativeEnum(Visibility),
  categories: z
    .array(z.object({ id: z.string() }))
    .min(1, "Select at least one category"),
});

export type ProjectFormData = z.infer<typeof formSchema>;

export interface ProjectUpdateFormData extends ProjectFormData {
  id: string;
}

interface ProjectFormProps {
  isEditing: boolean;
  initialData?: ProjectFormData;
  onSubmit: (data: ProjectFormData) => Promise<void>;
  isLoading: boolean;
  isSuccess: boolean;
  error: { message: string } | null;
}

export default function ProjectForm({
  isEditing,
  initialData,
  onSubmit,
  isLoading,
  isSuccess,
  error,
}: ProjectFormProps) {
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  // Initialize form with default values or initialData if editing
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: "",
      slug: "",
      description: "",
      repository: "",
      techStack: [],
      visibility: Visibility.PRIVATE,
      categories: [], // Will store [{id: string}] objects
    },
  });

  // Function to generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue("name", name);

    // Only auto-generate slug if:
    // 1. We're not in edit mode (since slug can't be changed after creation)
    // 2. The slug hasn't been manually edited
    if (!isEditing && !isSlugManuallyEdited) {
      const slug = name.toLowerCase()
        .replace(/[^\w\s-]/g, "") // Remove special characters
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/--+/g, "-") // Replace multiple hyphens with single hyphen
        .trim(); // Trim leading/trailing spaces

      form.setValue("slug", slug, { shouldValidate: true });
    }
  };

  // Handle manual slug edits
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSlugManuallyEdited(true);
    form.setValue("slug", e.target.value);
  };

  // Handle form submission
  const handleSubmit = async (values: ProjectFormData) => {
    setSubmitAttempted(true);
    await onSubmit(values);
  };

  return (
    <div className="space-y-6">
      {/* Success Alert */}
      {isSuccess && <SuccessAlert isEditing={isEditing} className="mb-6" />}

      {/* Error Alert */}
      {submitAttempted && error && (
        <ErrorAlert
          isEditing={isEditing}
          message={error.message}
          className="mb-6"
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Basic Information */}
        <Card className="p-6 col-span-2">
          <h3 className="text-lg font-semibold mb-4">Project Information</h3>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="My Awesome Project"
                        {...field}
                        onChange={handleNameChange}
                        disabled={isLoading || isSuccess}
                      />
                    </FormControl>
                    <FormDescription>
                      Give your project a descriptive name
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Slug</FormLabel>
                      {/* Only show Edit/Auto-generate buttons when creating a new project */}
                      {!isEditing && !isSlugManuallyEdited && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-muted-foreground"
                          onClick={() => setIsSlugManuallyEdited(true)}
                          disabled={isLoading || isSuccess}
                        >
                          Edit
                        </Button>
                      )}
                      {!isEditing && isSlugManuallyEdited && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-muted-foreground"
                          onClick={() => {
                            setIsSlugManuallyEdited(false);
                            // Reset to auto-generated slug
                            const name = form.getValues("name");
                            const slug = name.toLowerCase()
                              .replace(/[^\w\s-]/g, "")
                              .replace(/\s+/g, "-")
                              .replace(/--+/g, "-")
                              .trim();
                            form.setValue("slug", slug, { shouldValidate: true });
                          }}
                          disabled={isLoading || isSuccess}
                        >
                          Auto-generate
                        </Button>
                      )}
                    </div>
                    <FormControl>
                      <Input
                        placeholder="my-awesome-project"
                        {...field}
                        onChange={(e) => !isEditing && handleSlugChange(e)}
                        disabled={
                          isLoading ||
                          isSuccess ||
                          isEditing || // Always disable in edit mode
                          (!isSlugManuallyEdited && !isEditing)
                        }
                        className={isEditing ? "bg-muted cursor-not-allowed opacity-70" : ""}
                      />
                    </FormControl>
                    <FormDescription>
                      {isEditing
                        ? "The slug cannot be changed after project creation."
                        : isSlugManuallyEdited
                          ? "Customize the URL slug - use only lowercase letters, numbers, and hyphens."
                          : "Auto-generated from project name. Click 'Edit' to customize."}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your project..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a detailed description of what your project does
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="repository"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repository URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://github.com/username/repo"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Link to your project&apos;s GitHub repository
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </Card>

        {/* Right Column - Tech Stack */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold">Visibility & Categories</h3>
            <Form {...form}>
              <form className="space-y-4">
                <FormField
                  control={form.control}
                  name="visibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visibility</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select visibility" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={Visibility.PUBLIC}>
                            Public
                          </SelectItem>
                          <SelectItem value={Visibility.PRIVATE}>
                            Private
                          </SelectItem>
                          <SelectItem value={Visibility.FEATURED}>
                            Featured
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Control who can see and deploy your project
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Using the new CategorySelector for multi-select categories */}
                <CategorySelector
                  form={form}
                  fieldName="categories"
                  label="Categories"
                  description="Required: At least one category must be selected"
                  placeholder="Select project categories"
                  multiple={true}
                  isLoading={isLoading}
                  success={isSuccess}
                />

                <FormField
                  control={form.control}
                  name="techStack"
                  render={() => (
                    <FormItem>
                      <FormDescription className="mb-4">
                        Select the technologies used in your project
                      </FormDescription>
                      <div className="space-y-4">
                        {Object.values(TechStack).map((tech) => (
                          <FormField
                            key={tech}
                            control={form.control}
                            name="techStack"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={tech}
                                  className="flex flex-row items-center space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(tech)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([
                                            ...field.value,
                                            tech,
                                          ])
                                          : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== tech
                                            )
                                          );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {tech}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </Card>

          {/* Action Buttons Card */}
          <Card className="p-6 mt-6">
            <h3 className="text-lg font-semibold">Actions</h3>
            <div className="space-y-3">
              <Button
                type="submit"
                onClick={form.handleSubmit(handleSubmit)}
                disabled={isLoading || isSuccess}
                className="w-full"
              >
                {isLoading && (
                  <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing ? "Update Project" : "Create Project"}
              </Button>

              <Button
                variant="outline"
                type="button"
                onClick={() => form.reset()}
                className="w-full"
                disabled={isLoading}
              >
                Reset Form
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
