/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, useFormContext, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  DeploymentProvider,
  DeploymentOption,
  EnvironmentVariable,
  ProjectConfiguration,
  CreateProjectConfigurationDto,
} from "@/common/types/project";
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
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SuccessAlert, ErrorAlert } from "@/components/ui/alerts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  IconLoader,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { AlertTriangle, ChevronDown, ChevronUp, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Form schema with validation for duplicates
const formSchema = z.object({
  githubAccounts: z.array(
    z.object({
      username: z.string().min(2, "Username must be at least 2 characters"),
      accessToken: z.string().min(5, "Access token is required"),
      repository: z.string(),
      workflowFile: z.string(),
    })
  )
    .optional()
    .default([])
    .refine(
      (accounts) => {
        // Check for duplicate username/repository combinations
        const seen = new Set();
        for (const account of accounts) {
          // Skip empty fields
          if (!account.username.trim() || !account.repository.trim()) continue;

          const key = `${account.username}:${account.repository}`;
          if (seen.has(key)) {
            return false;
          }
          seen.add(key);
        }
        return true;
      },
      {
        message: "Duplicate username and repository combinations are not allowed",
        path: ["githubAccounts"],
      }
    ),

  deploymentOption: z.object({
    provider: z.nativeEnum(DeploymentProvider),
    environmentVariables: z.array(
      z.object({
        key: z.string()
          .min(1, "Key is required")
          .regex(/^[^\s]+$/, "Key must not contain spaces"),
        defaultValue: z.string().optional().default(""),
        description: z.string(),
        video: z.string().url("Must be a url").optional().nullable(),
        isRequired: z.boolean().default(true),
        isSecret: z.boolean().default(false),
      })
    )
      .default([])
      .refine(
        (variables) => {
          // Check for duplicate env var keys within a deployment option
          const keys = variables
            .map(v => v.key.trim())
            .filter(k => k !== '');
          return new Set(keys).size === keys.length;
        },
        {
          message: "Environment variable keys must be unique",
          path: ["environmentVariables"],
        }
      )
      .refine(
        (variables) => {
          // Check if non-required variables have a default value
          return variables.every(v => v.isRequired || v.defaultValue.trim() !== "");
        },
        {
          message: "Non-required variables must have a default value",
          path: ["environmentVariables"],
        }
      ),
  }),
});

// Type for form data derived from the Zod schema
export type ConfigurationFormData = z.infer<typeof formSchema>;

// Type for updating existing configurations - extends the form data with an ID
export interface ConfigurationUpdateFormData
  extends ConfigurationFormData,
  Pick<ProjectConfiguration, "id"> {
  // id field is already included from ProjectConfiguration
}

interface ConfigurationFormProps {
  projectId: string;
  isEditing: boolean;
  initialData?: CreateProjectConfigurationDto;
  onSubmit: (data: CreateProjectConfigurationDto) => Promise<void>;
  isLoading: boolean;
  isSuccess: boolean;
  error: { message: string } | null;
}

// Component to display array-level validation errors
function ArrayLevelErrorMessage({ error }: { error: string }) {
  if (!error) return null;

  return (
    <div className="text-destructive text-sm font-medium">
      {error as string}
    </div>
  );
}

// Confirmation Dialog component
interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel"
}: ConfirmationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button variant="default" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Collapsible Section Component
function CollapsibleSection({
  title,
  children,
  index,
  onRemove,
  canRemove = true
}: {
  title: string;
  children: React.ReactNode;
  index: number;
  onRemove: () => void;
  canRemove?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="border rounded-md overflow-hidden dark:border-gray-700">
      <div
        className="p-3 bg-gray-50 dark:bg-gray-800 flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h4 className="font-medium flex items-center text-gray-900 dark:text-gray-100">
          {title} {index + 1}
          {isExpanded ?
            <ChevronUp className="h-4 w-4 ml-2" /> :
            <ChevronDown className="h-4 w-4 ml-2" />
          }
        </h4>

        <div className="flex items-center" onClick={e => e.stopPropagation()}>
          {canRemove && onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 dark:text-red-400"
            >
              <IconTrash className="h-4 w-4 mr-1" /> Remove
            </Button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-4">
          {children}
        </div>
      )}
    </div>
  );
}

// GitHub Account Fields
function GithubAccountFields({ index }: { index: number }) {
  const form = useFormContext();

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name={`githubAccounts.${index}.username`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>GitHub Username</FormLabel>
            <FormControl>
              <Input placeholder="github-username" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`githubAccounts.${index}.accessToken`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Access Token</FormLabel>
            <FormControl>
              <Input
                type="password"
                placeholder="GitHub personal access token"
                {...field}
              />
            </FormControl>
            <FormDescription>
              GitHub personal access token with repo scope
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`githubAccounts.${index}.repository`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Repository</FormLabel>
            <FormControl>
              <Input
                placeholder="repo-name"
                {...field}
              />
            </FormControl>
            <FormDescription>
              Enter repository name like on GitHub
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`githubAccounts.${index}.workflowFile`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Workflow File</FormLabel>
            <FormControl>
              <Input
                placeholder="deploy.yml"
                {...field}
              />
            </FormControl>
            <FormDescription>
              Path to the GitHub workflow file
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

// Provider Fields
function ProviderFields() {
  const form = useFormContext<ConfigurationFormData>();
  const { control, setValue, watch } = form;

  // Setup provider field watching
  const currentProvider = watch("deploymentOption.provider");
  const [previousProvider, setPreviousProvider] = useState(currentProvider);

  // State for confirmation dialog
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingProviderChange, setPendingProviderChange] = useState<DeploymentProvider | null>(null);

  // Effect to reset environment variables when provider changes
  useEffect(() => {
    if (currentProvider !== previousProvider && previousProvider) {
      // Provider has changed, reset environment variables
      setValue("deploymentOption.environmentVariables", []);
      setPreviousProvider(currentProvider);
    }
  }, [currentProvider, previousProvider, setValue]);

  // When component first mounts, set the previous provider
  useEffect(() => {
    setPreviousProvider(currentProvider);
  }, [currentProvider]);

  // Handler for when user confirms the provider change in the dialog
  const handleConfirmProviderChange = () => {
    if (pendingProviderChange) {
      form.setValue("deploymentOption.provider", pendingProviderChange);
      setPendingProviderChange(null);
      setConfirmDialogOpen(false);
    }
  };

  // Handler for cancelling the provider change
  const handleCancelProviderChange = () => {
    setPendingProviderChange(null);
    setConfirmDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="deploymentOption.provider"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Provider</FormLabel>
            <Select
              onValueChange={(value: DeploymentProvider) => {
                // When provider changes, check if we need to confirm
                if (value !== field.value) {
                  const envVars = form.getValues("deploymentOption.environmentVariables") || [];
                  const hasEnvVars = envVars.length > 0;

                  if (hasEnvVars) {
                    // Open confirmation dialog
                    setPendingProviderChange(value);
                    setConfirmDialogOpen(true);
                  } else {
                    // No env vars yet, update the provider directly
                    field.onChange(value);
                  }
                }
              }}
              defaultValue={field.value}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {Object.values(DeploymentProvider).map(
                  (provider) => (
                    <SelectItem key={provider} value={provider}>
                      {provider.charAt(0).toUpperCase() +
                        provider.slice(1)}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Environment Variables for this deployment option */}
      <div className="mt-4">
        <h5 className="font-medium mb-2">Environment Variables</h5>
        <div className="space-y-4">
          <EnvironmentVariablesSection />
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialogOpen}
        onClose={handleCancelProviderChange}
        onConfirm={handleConfirmProviderChange}
        title="Reset Environment Variables?"
        description="Changing the deployment provider will reset all environment variables. Do you want to continue?"
        confirmLabel="Yes, Change Provider"
        cancelLabel="Cancel"
      />
    </div>
  );
}

// Modified Environment Variables Section
function EnvironmentVariablesSection() {
  const form = useFormContext();
  const { control, watch, setValue } = form;

  const {
    fields: envVarFields,
    append: appendEnvVar,
    remove: removeEnvVar,
  } = useFieldArray({
    control,
    name: "deploymentOption.environmentVariables",
  });

  // Watch for isRequired changes to update defaultValue when needed
  const watchedFields = watch("deploymentOption.environmentVariables");

  // Effect to ensure defaultValue is provided when isRequired is false
  useEffect(() => {
    if (!watchedFields) return;

    watchedFields.forEach((field: EnvironmentVariable, index: number) => {
      if (field && field.isRequired === false && (!field.defaultValue || field.defaultValue.trim() === "")) {
        setValue(`deploymentOption.environmentVariables.${index}.defaultValue`, "", {
          shouldValidate: true
        });
      }
    });
  }, [watchedFields, setValue]);

  // Check for env var array level errors
  const envVarErrors = (form.formState.errors?.deploymentOption as any)?.environmentVariables?.message;

  // Function to clear video field
  const clearVideoField = (index: number) => {
    setValue(`deploymentOption.environmentVariables.${index}.video`, null);
  };

  return (
    <div className="space-y-4">
      {envVarErrors && (
        <div className="text-destructive text-sm font-medium">
          {envVarErrors as string}
        </div>
      )}

      <div className={`grid grid-cols-1 gap-4 ${envVarFields.length > 1 ? "md:grid-cols-2" : ""}`}>
        {envVarFields.map((field, index) => (
          <div
            key={field.id}
            className="space-y-3 p-4 border rounded-md dark:border-gray-700"
          >
            <div className="flex justify-between items-center">
              <h6 className="font-medium">Variable {index + 1}</h6>
              {envVarFields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEnvVar(index)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 dark:text-red-400"
                >
                  <IconTrash className="h-4 w-4 mr-1" /> Remove
                </Button>
              )}
            </div>

            <FormField
              control={control}
              name={`deploymentOption.environmentVariables.${index}.key`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key</FormLabel>
                  <FormControl>
                    <Input placeholder="API_KEY" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`deploymentOption.environmentVariables.${index}.defaultValue`}
              render={({ field }) => {
                // Get isRequired value for this index
                const isRequired = watch(`deploymentOption.environmentVariables.${index}.isRequired`);

                return (
                  <FormItem>
                    <FormLabel>Default Value{!isRequired && " (Required)"}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={!isRequired ? "Default value is required" : "Default value"}
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    {!isRequired && (
                      <FormDescription className="text-amber-500">
                        A default value is required when variable is not required
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={control}
              name={`deploymentOption.environmentVariables.${index}.description`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Variable description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`deploymentOption.environmentVariables.${index}.video`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Explanation video</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        placeholder="Video url"
                        {...field}
                        value={field.value || ""}
                        className="w-full"
                      />
                    </FormControl>
                    {field.value && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => clearVideoField(index)}
                        className="h-10 w-10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <FormField
                control={control}
                name={`deploymentOption.environmentVariables.${index}.isRequired`}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          // If changing to not required, ensure default value exists
                          if (checked === false) {
                            const currentDefaultValue = watch(`deploymentOption.environmentVariables.${index}.defaultValue`);
                            if (!currentDefaultValue || currentDefaultValue.trim() === "") {
                              setValue(`deploymentOption.environmentVariables.${index}.defaultValue`, "");
                            }
                          }
                        }}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Required
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`deploymentOption.environmentVariables.${index}.isSecret`}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Secret
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="secondary"
        onClick={() =>
          appendEnvVar({
            key: "",
            defaultValue: "",
            description: "",
            isRequired: true,
            isSecret: false,
            video: null,
          })
        }
        className="w-full"
      >
        <IconPlus className="h-4 w-4 mr-2" />
        Add Environment Variable
      </Button>
    </div>
  );
}

// Left Column with Tabs
function LeftColumnWithTabs({
  githubFields,
  appendGithub,
  removeGithub,
}: {
  githubFields: any[];
  appendGithub: (value: any) => void;
  removeGithub: (index: number) => void;
}) {
  const [activeTab, setActiveTab] = useState("github");
  const form = useFormContext();

  // Determine if there are errors in either section
  const hasGithubErrors = !!form.formState.errors.githubAccounts;
  const githubErrorMessage = (form.formState.errors.githubAccounts as any)?.githubAccounts?.message;
  const hasDeploymentErrors = !!form.formState.errors.deploymentOption;
  const deploymentErrorMessage = (form.formState.errors.deploymentOption as any)?.message;

  return (
    <div className="space-y-6 col-span-2">
      <Tabs defaultValue="github" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger
            value="github"
            className={hasGithubErrors ? "border-destructive text-destructive" : ""}
          >
            GitHub Accounts ({githubFields.length})
            {hasGithubErrors && <span className="ml-2 text-destructive">⚠️</span>}
          </TabsTrigger>
          <TabsTrigger
            value="deployment"
            className={hasDeploymentErrors ? "border-destructive text-destructive" : ""}
          >
            Deployment Provider
            {hasDeploymentErrors && <span className="ml-2 text-destructive">⚠️</span>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="github" className="mt-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold">GitHub Accounts</h3>
            <ArrayLevelErrorMessage error={githubErrorMessage} />
            <div className="space-y-4">
              <div className={`grid grid-cols-1 gap-4 ${githubFields.length > 1 ? "md:grid-cols-2" : ""}`}>
                {githubFields.map((field, index) => (
                  <CollapsibleSection
                    key={field.id}
                    title="GitHub Account"
                    index={index}
                    onRemove={() => removeGithub(index)}
                    canRemove={githubFields.length > 1}
                  >
                    <GithubAccountFields
                      index={index}
                    />
                  </CollapsibleSection>
                ))}
              </div>

              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  appendGithub({
                    username: "",
                    accessToken: "",
                    repository: "",
                    workflowFile: "deploy.yml",
                  })
                }
                className="w-full"
              >
                <IconPlus className="h-4 w-4 mr-2" />
                Add GitHub Account
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="deployment" className="mt-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold">Deployment Provider</h3>
            <ArrayLevelErrorMessage error={deploymentErrorMessage} />
            <div className="space-y-4">
              <CollapsibleSection
                title="Provider"
                index={0}
                onRemove={() => { }}
                canRemove={false}
              >
                <ProviderFields />
              </CollapsibleSection>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Main Configuration Form component
export default function ConfigurationForm({
  // projectId,
  isEditing,
  initialData,
  onSubmit,
  isLoading,
  isSuccess,
  error,
}: ConfigurationFormProps) {
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const form = useForm<ConfigurationFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      githubAccounts: [
        {
          username: "",
          accessToken: "",
          repository: "",
          workflowFile: "deploy.yml",
        },
      ],
      deploymentOption: {
        provider: DeploymentProvider.VERCEL,
        environmentVariables: [
          {
            key: "",
            defaultValue: "",
            description: "",
            isRequired: true,
            isSecret: false,
            video: '',
          },
        ],
      } as DeploymentOption,
    },
    mode: "onChange", // Validate on change for better UX
  });

  const {
    fields: githubFields,
    append: appendGithub,
    remove: removeGithub,
  } = useFieldArray({
    control: form.control,
    name: "githubAccounts",
  });

  const handleSubmit = async (values: ConfigurationFormData) => {
    setSubmitAttempted(true);
    await onSubmit(values as CreateProjectConfigurationDto);
  };

  return (
    <div className="space-y-6">
      {isSuccess && <SuccessAlert isEditing={isEditing} className="mb-6" />}

      {submitAttempted && error && (
        <ErrorAlert
          isEditing={isEditing}
          message={error.message}
          className="mb-6"
        />
      )}

      <FormProvider {...form}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column with Tabs */}
              <LeftColumnWithTabs
                githubFields={githubFields}
                appendGithub={appendGithub}
                removeGithub={removeGithub}
              />

              {/* Right Column */}
              <div>
                {/* Action Buttons */}
                <Card className="p-6 sticky top-[80px]">
                  <h3 className="text-lg font-semibold mb-4">Actions</h3>
                  <div className="space-y-3">
                    <Button
                      type="submit"
                      disabled={isLoading || isSuccess}
                      className="w-full"
                    >
                      {isLoading && (
                        <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {isEditing
                        ? "Update Configuration"
                        : "Create Configuration"}
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
      </FormProvider>
    </div>
  );
}