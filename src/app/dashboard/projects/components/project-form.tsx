"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Visibility } from "@/common/enums/project";
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
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconLoader } from "@tabler/icons-react";
import { SuccessAlert, ErrorAlert } from "@/components/ui/alerts";
import { CategorySelector } from "@/components/category-selector";
import { CreateProjectDto, createProjectDtoSchema } from "@/common/dtos";
import { TagInput } from "@/components/tag-input";
import { SingleMediaSelector } from "@/app/dashboard/media/components/media-selector";

// Available tech stack suggestions
const techStackSuggestions = [
  "React",
  "Next.js",
  "Vue",
  "Angular",
  "Node.js",
  "NestJS",
  "Django",
  "Flask",
  "Laravel",
  "Express",
  "TypeScript",
  "JavaScript",
  "Python",
  "Java",
  "PHP",
  "Ruby",
  "Go",
  "Rust",
  "C#",
  ".NET",
  "MongoDB",
  "PostgreSQL",
  "MySQL",
  "Redis",
  "GraphQL",
  "REST API",
  "Docker",
  "Kubernetes",
  "AWS",
  "Azure",
  "Google Cloud",
  "Firebase",
  "Tailwind CSS",
  "Material UI",
  "Bootstrap",
  "Other"
];

interface ProjectFormProps {
  isEditing: boolean;
  initialData?: CreateProjectDto;
  onSubmit: (data: CreateProjectDto) => Promise<void>;
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
  const form = useForm<CreateProjectDto>({
    resolver: zodResolver(createProjectDtoSchema),
    defaultValues: initialData || {
      name: "",
      slug: "",
      description: "",
      repository: "",
      preview_url: "",
      tech_stack: [],
      visibility: Visibility.PRIVATE,
      categories: [], // Will store [{id: string}] objects
      image: null,
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
  const handleSubmit = async (values: CreateProjectDto) => {
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

      <Form {...form}>
        <form
          id="project-form"
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Basic Information */}
            <Card className="p-6 col-span-2">
              <h3 className="text-lg font-semibold mb-4">Project Information</h3>
              <div className="space-y-6">
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

                <FormField
                  control={form.control}
                  name="preview_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preview URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://my-project-demo.example.com"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional live demo or preview URL for your project
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Card>

            {/* Right Column - Tech Stack */}
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold">Visibility & Categories</h3>
                <div className="space-y-4">
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

                  {/* Project Image */}
                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Image</FormLabel>
                        <FormControl>
                          <SingleMediaSelector
                            label="Select an image for this project"
                            value={field.value ? typeof field.value === "string" ? JSON.parse(field.value) : field.value : null}
                            onChange={(media) => form.setValue("image", media ? JSON.stringify(media) : null)}
                          />
                        </FormControl>
                        <FormDescription>
                          Upload or select an image to represent your project
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
                    name="tech_stack"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tech Stack</FormLabel>
                        <FormControl>
                          <TagInput
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Add technology..."
                            disabled={isLoading || isSuccess}
                            suggestions={techStackSuggestions}
                          />
                        </FormControl>
                        <FormDescription>
                          Add the technologies used in your project
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Card>

              {/* Action Buttons Card */}
              <Card className="p-6 mt-6">
                <h3 className="text-lg font-semibold">Actions</h3>
                <div className="space-y-3">
                  <Button
                    type="submit"
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
        </form>
      </Form>
    </div>
  );
}