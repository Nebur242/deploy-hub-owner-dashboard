/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, useFormContext, FormProvider, Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { validateGithubConfig } from "@/services/github";

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
  IconServer,
  IconHistory,
  IconAlertCircle,
} from "@tabler/icons-react";
import Link from "next/link";
import { AlertTriangle, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DeploymentProvider } from "@/common/enums/project";
import { DeploymentOption, EnvironmentVariable } from "@/common/types";
import { CreateConfigurationDto, createConfigurationDtoSchema, EnvironmentVariableDto } from "@/common/dtos";
import { Textarea } from "@/components/ui/textarea";

interface ConfigurationFormProps {
  isEditing: boolean;
  initialData?: CreateConfigurationDto & { id?: string; projectId?: string };
  onSubmit: (data: CreateConfigurationDto) => Promise<void>;
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
  const form = useFormContext<CreateConfigurationDto>();
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

      // If the new provider is Vercel, add default Vercel environment variables
      if (currentProvider === DeploymentProvider.VERCEL) {
        setValue("deploymentOption.environmentVariables", [
          {
            key: "VERCEL_TOKEN",
            defaultValue: "",
            description: "Vercel API token for deployment authentication",
            isRequired: true,
            isSecret: true,
            video: null,
          },
          {
            key: "VERCEL_ORG_ID",
            defaultValue: "",
            description: "Vercel organization ID",
            isRequired: true,
            isSecret: true,
            video: null,
          },
          {
            key: "VERCEL_PROJECT_ID",
            defaultValue: "VERCEL_PROJECT_ID",
            description: "Vercel project ID for deployment target",
            isRequired: false,
            isSecret: true,
            video: null,
          },
        ]);
      }
    } else if (currentProvider === DeploymentProvider.VERCEL && !previousProvider) {
      // Initial render with Vercel provider selected, set default variables
      const currentVars = form.getValues("deploymentOption.environmentVariables") || [];
      if (currentVars.length === 0 ||
        (currentVars.length === 1 && (!currentVars[0].key || currentVars[0].key === ""))) {
        setValue("deploymentOption.environmentVariables", [
          {
            key: "VERCEL_TOKEN",
            defaultValue: "",
            description: "Vercel API token for deployment authentication",
            isRequired: true,
            isSecret: true,
            video: null,
          },
          {
            key: "VERCEL_ORG_ID",
            defaultValue: "",
            description: "Vercel organization ID",
            isRequired: true,
            isSecret: true,
            video: null,
          },
          {
            key: "VERCEL_PROJECT_ID",
            defaultValue: "VERCEL_PROJECT_ID",
            description: "Vercel project ID for deployment target",
            isRequired: false,
            isSecret: true,
            video: null,
          },
        ]);
      }
    }
  }, [currentProvider, previousProvider, setValue, form]);

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
                // Always show confirmation dialog when provider changes
                if (value !== field.value) {
                  setPendingProviderChange(value);
                  setConfirmDialogOpen(true);
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
        title="Change Deployment Provider?"
        description="Changing the deployment provider will reset environment variables to provider defaults. Do you want to continue?"
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
    control: control as unknown as Control<CreateConfigurationDto>,
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
        {envVarFields.map((field: EnvironmentVariableDto, index) => {
          // Check if this is a Vercel default environment variable
          const provider = watch("deploymentOption.provider");
          const isVercelDefaultVar = provider === DeploymentProvider.VERCEL &&
            (field.key === "VERCEL_TOKEN" || field.key === "VERCEL_ORG_ID" || field.key === "VERCEL_PROJECT_ID");

          return (
            <div
              key={field.key}
              className="space-y-3 p-4 border rounded-md dark:border-gray-700"
            >
              <div className="flex justify-between items-center">
                <h6 className="font-medium">Variable {index + 1}</h6>
                {envVarFields.length > 1 && !isVercelDefaultVar && (
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
                {isVercelDefaultVar && (
                  <div className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium dark:bg-amber-900 dark:text-amber-200">
                    Required
                  </div>
                )}
              </div>

              <hr />

              <FormField
                control={control}
                name={`deploymentOption.environmentVariables.${index}.key`}
                render={({ field }) => {
                  // Check if this is a Vercel default environment variable
                  const provider = watch("deploymentOption.provider");
                  const isVercelDefaultVar = provider === DeploymentProvider.VERCEL &&
                    (field.value === "VERCEL_TOKEN" || field.value === "VERCEL_ORG_ID" || field.value === "VERCEL_PROJECT_ID");

                  return (
                    <FormItem>
                      <FormLabel>Key</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="API_KEY"
                          {...field}
                          disabled={isVercelDefaultVar}
                          className={isVercelDefaultVar ? "bg-muted" : ""}
                        />
                      </FormControl>
                      {isVercelDefaultVar && (
                        <FormDescription className="text-amber-500">
                          This is a required Vercel variable and cannot be modified or removed
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
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
                      <Textarea
                        placeholder="Variable description"
                        className="resize-none min-h-[80px]"
                        {...field}
                      />
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
          )
        })}
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
  removeGithub
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
            <ArrayLevelErrorMessage error={githubErrorMessage} />
            <div className="space-y-4">
              <div className={`grid grid-cols-1 gap-4 ${githubFields.length > 1 ? "md:grid-cols-2" : ""}`}>
                {githubFields.map((field, index) => (
                  <Card className="p-6" key={field.id}>
                    <div className="flex justify-between items-center">
                      <h6 className="font-medium">Account {index + 1}</h6>
                      {githubFields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeGithub(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 dark:text-red-400"
                        >
                          <IconTrash className="h-4 w-4 mr-1" /> Remove
                        </Button>
                      )}
                    </div>
                    <hr />
                    <GithubAccountFields
                      index={index}
                    />
                  </Card>
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
                    workflowFile: "",
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
            <ArrayLevelErrorMessage error={deploymentErrorMessage} />
            <div className="space-y-4">
              <Card className="p-6">
                <ProviderFields />
              </Card>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Main Configuration Form component
export default function ConfigurationForm({
  isEditing,
  initialData,
  onSubmit,
  isLoading,
  isSuccess,
  error,
}: ConfigurationFormProps) {
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [validatingGithub, setValidatingGithub] = useState(false);
  const [githubValidationErrors, setGithubValidationErrors] = useState<{ index: number, message: string }[]>([]);

  // Create default Vercel environment variables
  const defaultVercelVariables = [
    {
      key: "VERCEL_TOKEN",
      defaultValue: "",
      description: "Vercel API token for deployment authentication",
      isRequired: true,
      isSecret: true,
      video: null,
    },
    {
      key: "VERCEL_ORG_ID",
      defaultValue: "",
      description: "Vercel organization ID",
      isRequired: true,
      isSecret: true,
      video: null,
    },
    {
      key: "VERCEL_PROJECT_ID",
      defaultValue: "VERCEL_PROJECT_ID",
      description: "Vercel project ID for deployment target",
      isRequired: false,
      isSecret: true,
      video: null,
    }
  ];

  const form = useForm<CreateConfigurationDto>({
    resolver: zodResolver(createConfigurationDtoSchema),
    defaultValues: initialData || {
      githubAccounts: [
        {
          username: "",
          accessToken: "",
          repository: "",
          workflowFile: "",
        },
      ],
      deploymentOption: {
        provider: DeploymentProvider.VERCEL,
        environmentVariables: defaultVercelVariables,
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

  const handleSubmit = async (values: CreateConfigurationDto) => {
    setSubmitAttempted(true);

    // Reset validation state
    setValidatingGithub(true);
    setGithubValidationErrors([]);

    try {
      // Validate all GitHub configurations
      const validationPromises = values.githubAccounts.map(async (account, index) => {
        const result = await validateGithubConfig(
          account.username,
          account.accessToken,
          account.repository,
          account.workflowFile
        );

        if (!result.isValid) {
          return { index, message: result.message };
        }
        return null;
      });

      // Wait for all validations to complete
      const results = await Promise.all(validationPromises);
      const errors = results.filter((result): result is { index: number, message: string } => result !== null);

      // If there are errors, show them and don't submit
      if (errors.length > 0) {
        setGithubValidationErrors(errors);
        setValidatingGithub(false);
        return;
      }

      // All GitHub configurations are valid, proceed with form submission
      await onSubmit(values as CreateConfigurationDto);
    } catch (error) {
      console.error('Error validating GitHub configurations:', error);
      setGithubValidationErrors([{
        index: -1,
        message: 'An unexpected error occurred while validating GitHub configurations'
      }]);
    } finally {
      setValidatingGithub(false);
    }
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

      {/* GitHub Validation Errors */}
      {githubValidationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6">
          <div className="flex items-center mb-2">
            <IconAlertCircle className="h-5 w-5 mr-2 text-red-500" />
            <h3 className="font-semibold">GitHub Configuration Validation Failed</h3>
          </div>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            {githubValidationErrors.map((error, idx) => (
              <li key={idx} className="text-sm">
                {error.index >= 0 ? `Account ${error.index + 1}: ${error.message}` : error.message}
              </li>
            ))}
          </ul>
          <p className="text-sm mt-3">
            Please check your GitHub credentials, repository names, and workflow file paths before submitting again.
          </p>
        </div>
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
                      disabled={isLoading || isSuccess || validatingGithub}
                      className="w-full"
                    >
                      {(isLoading || validatingGithub) && (
                        <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {validatingGithub
                        ? "Validating GitHub..."
                        : isEditing
                          ? "Update Configuration"
                          : "Create Configuration"
                      }
                    </Button>

                    {isEditing && initialData && initialData.id && initialData.projectId && (
                      <>
                        <Button
                          variant="default"
                          type="button"
                          className="w-full"
                          disabled={isLoading}
                          asChild
                        >
                          <Link
                            href={`/dashboard/deployments/create?projectId=${initialData.projectId}&configurationId=${initialData.id}`}
                          >
                            <IconServer className="mr-2 h-4 w-4" />
                            Deploy Configuration
                          </Link>
                        </Button>

                        <Button
                          variant="outline"
                          type="button"
                          className="w-full"
                          disabled={isLoading}
                          asChild
                        >
                          <Link
                            href={`/dashboard/projects/${initialData.projectId}/configurations/${initialData.id}/deployments`}
                          >
                            <IconHistory className="mr-2 h-4 w-4" />
                            View Deployments
                          </Link>
                        </Button>
                      </>
                    )}

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