"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, useFieldArray, useFormContext, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { validateGithubConfig, getWorkflowFiles, getWorkflowFileContent } from "@/services/github";
import Editor from "@monaco-editor/react";
import { useTheme } from "@/hooks/theme-context";
import { WorkflowAssistant } from "@/components/workflow-assistant";
import { JsonSchemaBuilder } from "@/components/json-schema-builder";

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
  IconEye,
  IconRefresh,
  IconRobot,
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
import { DeploymentOption } from "@/common/types";
import { CreateConfigurationDto, createConfigurationDtoSchema, EnvironmentVariableDto, GithubAccountDto } from "@/common/dtos";
import { Textarea } from "@/components/ui/textarea";

interface ConfigurationFormProps {
  isEditing: boolean;
  initialData?: CreateConfigurationDto & { id?: string; projectId?: string };
  onSubmit: (data: CreateConfigurationDto) => Promise<void>;
  isLoading: boolean;
  isSuccess: boolean;
  error: { message: string } | null;
  maxGithubAccounts?: number; // Max GitHub accounts allowed per configuration (-1 = unlimited)
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
  const { theme } = useTheme();

  const [workflowFiles, setWorkflowFiles] = useState<string[]>([]);
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(false);
  const [workflowError, setWorkflowError] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [workflowContent, setWorkflowContent] = useState<string>("");
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

  // Watch for changes in username, token, and repository to reload workflows
  const username = form.watch(`github_accounts.${index}.username`);
  const accessToken = form.watch(`github_accounts.${index}.access_token`);
  const repository = form.watch(`github_accounts.${index}.repository`);
  const selectedWorkflow = form.watch(`github_accounts.${index}.workflow_file`);

  // Determine Monaco Editor theme based on app theme
  const getEditorTheme = () => {
    if (theme === 'dark') return 'vs-dark';
    if (theme === 'light') return 'vs-light';
    // For 'system' theme, check if user prefers dark mode
    if (typeof window !== 'undefined') {
      return window.document.querySelector('html')?.getAttribute('style')?.includes('dark') ? 'vs-dark' : 'vs-light';
    }
    return 'vs-light'; // fallback
  };

  // Load workflow files when credentials are available
  const loadWorkflowFiles = useCallback(async () => {
    if (!username || !accessToken || !repository) {
      setWorkflowFiles([]);
      setWorkflowError(null);
      return;
    }

    setIsLoadingWorkflows(true);
    setWorkflowError(null);

    try {
      const result = await getWorkflowFiles(username, accessToken, repository);

      if (result.error) {
        setWorkflowError(result.error);
        setWorkflowFiles([]);
      } else {
        setWorkflowFiles(result.files);
        if (result.files.length === 0) {
          setWorkflowError("No workflow files found in .github/workflows directory");
        }
      }
    } catch (error) {
      console.error("Error loading workflow files:", error);
      setWorkflowError("Failed to load workflow files");
      setWorkflowFiles([]);
    } finally {
      setIsLoadingWorkflows(false);
    }
  }, [username, accessToken, repository]);

  // Load workflow files when dependencies change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadWorkflowFiles();
    }, 500); // Debounce to avoid too many API calls

    return () => clearTimeout(timeoutId);
  }, [loadWorkflowFiles]);

  // Load workflow content for preview
  const loadWorkflowContent = async () => {
    if (!username || !accessToken || !repository || !selectedWorkflow) {
      return;
    }

    setIsLoadingContent(true);

    try {
      const result = await getWorkflowFileContent(username, accessToken, repository, selectedWorkflow);

      if (result.error) {
        setWorkflowContent(`# Error loading workflow file\n# ${result.error}`);
      } else {
        setWorkflowContent(result.content);
      }
    } catch (error) {
      console.error("Error loading workflow content:", error);
      setWorkflowContent(`# Error loading workflow file\n# Failed to load workflow content`);
    } finally {
      setIsLoadingContent(false);
    }
  };

  const handlePreviewClick = () => {
    setPreviewModalOpen(true);
    loadWorkflowContent();
  };

  return (
    <>
      <div className="space-y-4">
        <FormField
          control={form.control}
          name={`github_accounts.${index}.username`}
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
          name={`github_accounts.${index}.access_token`}
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
          name={`github_accounts.${index}.repository`}
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

        {/* Only show workflow file field when all prerequisite fields are provided */}
        {username && accessToken && repository && (
          <FormField
            control={form.control}
            name={`github_accounts.${index}.workflow_file`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <span className="text-sm font-medium">Workflow File</span>
                  <div className="flex items-center gap-2">
                    {isLoadingWorkflows && (
                      <IconLoader className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={loadWorkflowFiles}
                      disabled={!username || !accessToken || !repository || isLoadingWorkflows}
                      className="h-7 px-2 text-xs lg:h-6"
                    >
                      <IconRefresh className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Refresh</span>
                      <span className="sm:hidden">↻</span>
                    </Button>
                  </div>
                </FormLabel>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <FormControl className="flex-1">
                    {workflowFiles.length > 0 ? (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Select a workflow file" />
                        </SelectTrigger>
                        <SelectContent>
                          {workflowFiles.map((file) => (
                            <SelectItem key={file} value={file}>
                              {file}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        placeholder="deploy.yml"
                        className="text-sm"
                        {...field}
                      />
                    )}
                  </FormControl>
                  {selectedWorkflow && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handlePreviewClick}
                      disabled={!username || !accessToken || !repository}
                      className="px-3 w-full sm:w-auto h-9 text-xs sm:text-sm"
                    >
                      <IconEye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="hidden sm:inline">Preview</span>
                      <span className="sm:hidden">👁</span>
                    </Button>
                  )}
                </div>
                <FormDescription>
                  {workflowFiles.length > 0
                    ? "Select from available workflow files or enter manually"
                    : "Path to the GitHub workflow file"
                  }
                </FormDescription>

                {/* AI Assistant Button - Always Available */}
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                    🤖 Need help creating a custom workflow? Let our AI assistant help you!
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAssistantOpen(true)}
                    className="w-full text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900"
                  >
                    <IconRobot className="h-4 w-4 mr-2" />
                    Create Workflow with AI Assistant
                  </Button>
                </div>

                {workflowError && (
                  <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded border border-amber-200">
                    {workflowError}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      {/* Workflow Preview Modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent style={{ maxWidth: "60vw" }} className="max-w-6xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconEye className="h-5 w-5" />
              Workflow Preview: {selectedWorkflow}
            </DialogTitle>
            <DialogDescription>
              Preview of the GitHub workflow file from {username}/{repository}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-[500px] border rounded-md overflow-hidden">
            {isLoadingContent ? (
              <div className="flex items-center justify-center h-full">
                <IconLoader className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading workflow content...</span>
              </div>
            ) : (
              <Editor
                height="500px"
                defaultLanguage="yaml"
                value={workflowContent}
                theme={getEditorTheme()}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: "on",
                  theme: getEditorTheme(),
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPreviewModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Workflow Assistant Modal */}
      <WorkflowAssistant
        isOpen={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        username={username}
        accessToken={accessToken}
        repository={repository}
        onWorkflowCreated={loadWorkflowFiles}
      />
    </>
  );
}

// Provider Fields
function ProviderFields() {
  const form = useFormContext<CreateConfigurationDto>();
  const { control, setValue, watch } = form;

  // Setup provider field watching
  const currentProvider = watch("deployment_option.provider");
  const [previousProvider, setPreviousProvider] = useState(currentProvider);

  // State for confirmation dialog
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingProviderChange, setPendingProviderChange] = useState<DeploymentProvider | null>(null);

  // Effect to reset environment variables when provider changes
  useEffect(() => {
    if (currentProvider !== previousProvider && previousProvider) {
      // Provider has changed, reset environment variables
      setValue("deployment_option.environment_variables", []);
      setPreviousProvider(currentProvider);

      // Set default environment variables based on provider
      if (currentProvider === DeploymentProvider.VERCEL) {
        setValue("deployment_option.environment_variables", [
          {
            key: "VERCEL_TOKEN",
            default_value: "",
            description: "Vercel API token for deployment authentication",
            is_required: true,
            is_secret: true,
            video: null,
            type: "text",
          },
          {
            key: "VERCEL_ORG_ID",
            default_value: "",
            description: "Vercel organization ID",
            is_required: true,
            is_secret: true,
            video: null,
            type: "text",
          },
          {
            key: "VERCEL_PROJECT_ID",
            default_value: "",
            description: "Vercel project ID for deployment target",
            is_required: false,
            is_secret: true,
            video: null,
            type: "text",
          },
        ]);
      } else if (currentProvider === DeploymentProvider.NETLIFY) {
        setValue("deployment_option.environment_variables", [
          {
            key: "NETLIFY_TOKEN",
            default_value: "",
            description: "Netlify authentication token for deployment",
            is_required: true,
            is_secret: true,
            video: null,
            type: "text",
          },
          {
            key: "NETLIFY_SITE_NAME",
            default_value: "",
            description: "Netlify site name for deployment target",
            is_required: false,
            is_secret: false,
            video: null,
            type: "text",
          },
          {
            key: "NETLIFY_SITE_ID",
            default_value: "",
            description: "Netlify site ID for deployment target",
            is_required: false,
            is_secret: false,
            video: null,
            type: "text",
          },
        ]);
      } else if (currentProvider === DeploymentProvider.CUSTOM) {
        // For custom provider, add an empty variable as an example
        setValue("deployment_option.environment_variables", [
          {
            key: "",
            default_value: "",
            description: "Add your custom environment variables",
            is_required: false,
            is_secret: false,
            video: null,
            type: "text",
          },
        ]);
      }
    } else if (currentProvider === DeploymentProvider.VERCEL && !previousProvider) {
      // Initial render with Vercel provider selected, set default variables
      const currentVars = form.getValues("deployment_option.environment_variables") || [];
      if (currentVars.length === 0 ||
        (currentVars.length === 1 && (!currentVars[0].key || currentVars[0].key === ""))) {
        setValue("deployment_option.environment_variables", [
          {
            key: "VERCEL_TOKEN",
            default_value: "",
            description: "Vercel API token for deployment authentication",
            is_required: true,
            is_secret: true,
            video: null,
            type: "text",
          },
          {
            key: "VERCEL_ORG_ID",
            default_value: "",
            description: "Vercel organization ID",
            is_required: true,
            is_secret: true,
            video: null,
            type: "text",
          },
          {
            key: "VERCEL_PROJECT_ID",
            default_value: "",
            description: "Vercel project ID for deployment target",
            is_required: false,
            is_secret: true,
            video: null,
            type: "text",
          },
        ]);
      }
    } else if (currentProvider === DeploymentProvider.NETLIFY && !previousProvider) {
      // Initial render with Netlify provider selected, set default variables
      const currentVars = form.getValues("deployment_option.environment_variables") || [];
      if (currentVars.length === 0 ||
        (currentVars.length === 1 && (!currentVars[0].key || currentVars[0].key === ""))) {
        setValue("deployment_option.environment_variables", [
          {
            key: "NETLIFY_TOKEN",
            default_value: "",
            description: "Netlify authentication token for deployment",
            is_required: true,
            is_secret: true,
            video: null,
            type: "text",
          },
          {
            key: "NETLIFY_SITE_NAME",
            default_value: "",
            description: "Netlify site name for deployment target",
            is_required: false,
            is_secret: false,
            video: null,
            type: "text",
          },
          {
            key: "NETLIFY_SITE_ID",
            default_value: "",
            description: "Netlify site ID for deployment target",
            is_required: false,
            is_secret: false,
            video: null,
            type: "text",
          },
        ]);
      }
    } else if (currentProvider === DeploymentProvider.CUSTOM && !previousProvider) {
      // Initial render with Custom provider selected, set an empty variable
      const currentVars = form.getValues("deployment_option.environment_variables") || [];
      if (currentVars.length === 0 ||
        (currentVars.length === 1 && (!currentVars[0].key || currentVars[0].key === ""))) {
        setValue("deployment_option.environment_variables", [
          {
            key: "",
            default_value: "",
            description: "Add your custom environment variables",
            is_required: false,
            is_secret: false,
            video: null,
            type: "text",
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
      form.setValue("deployment_option.provider", pendingProviderChange);
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
        name="deployment_option.provider"
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
            {currentProvider === DeploymentProvider.CUSTOM && (
              <FormDescription className="mt-2 italic text-amber-500">
                Custom provider allows you to define your own environment variables without any preset configuration.
              </FormDescription>
            )}
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
  const form = useFormContext<CreateConfigurationDto>();
  const { control, watch, setValue } = form;

  const {
    fields: envVarFields,
    append: appendEnvVar,
    remove: removeEnvVar,
  } = useFieldArray({
    control,
    name: "deployment_option.environment_variables",
  });

  // Get the current provider to adjust UI behavior
  const currentProvider = watch("deployment_option.provider");
  const isCustomProvider = currentProvider === DeploymentProvider.CUSTOM;

  // Watch for isRequired changes to update defaultValue when needed
  const watchedFields = watch("deployment_option.environment_variables");

  // Effect to ensure defaultValue is provided when isRequired is false
  useEffect(() => {
    if (!watchedFields) return;

    watchedFields.forEach((field: EnvironmentVariableDto, index: number) => {
      if (field && field.is_required === false && (!field.default_value || field.default_value.trim() === "")) {
        setValue(`deployment_option.environment_variables.${index}.default_value`, "", {
          shouldValidate: true
        });
      }
    });
  }, [watchedFields, setValue]);

  // Check for env var array level errors
  const envVarErrors = (form.formState.errors?.deployment_option)?.environment_variables?.message;

  // Function to clear video field
  const clearVideoField = (index: number) => {
    setValue(`deployment_option.environment_variables.${index}.video`, null);
  };

  return (
    <div className="space-y-4">
      {envVarErrors && (
        <div className="text-destructive text-sm font-medium">
          {envVarErrors as string}
        </div>
      )}

      {isCustomProvider && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-700 text-sm flex items-center">
            <IconPlus className="h-4 w-4 mr-2" />
            Add any environment variables you need for your custom deployment provider.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
        {envVarFields.map((field: EnvironmentVariableDto, index) => {
          // Check if this is a default environment variable
          const provider = watch("deployment_option.provider");
          const isVercelDefaultVar = provider === DeploymentProvider.VERCEL &&
            (field.key === "VERCEL_TOKEN" || field.key === "VERCEL_ORG_ID" || field.key === "VERCEL_PROJECT_ID");
          const isNetlifyDefaultVar = provider === DeploymentProvider.NETLIFY &&
            (field.key === "NETLIFY_TOKEN" || field.key === "NETLIFY_SITE_NAME" || field.key === "NETLIFY_SITE_ID");
          const isDefaultVar = isVercelDefaultVar || isNetlifyDefaultVar;

          return (
            <div
              key={field.key || index}
              className="space-y-3 p-3 sm:p-4 border rounded-md dark:border-gray-700"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
                <h6 className="font-medium text-sm sm:text-base">Variable {index + 1}</h6>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {isDefaultVar && (
                    <div className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium dark:bg-amber-900 dark:text-amber-200">
                      Required
                    </div>
                  )}
                  {envVarFields.length > 1 && !isDefaultVar && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEnvVar(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 dark:text-red-400 h-8 px-2 text-xs sm:text-sm"
                    >
                      <IconTrash className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="hidden xs:inline">Remove</span>
                      <span className="xs:hidden">×</span>
                    </Button>
                  )}
                </div>
              </div>

              <hr />

              <FormField
                control={control}
                name={`deployment_option.environment_variables.${index}.key`}
                render={({ field }) => {
                  // Check if this is a default environment variable
                  const provider = watch("deployment_option.provider");
                  const isVercelDefaultVar = provider === DeploymentProvider.VERCEL &&
                    (field.value === "VERCEL_TOKEN" || field.value === "VERCEL_ORG_ID" || field.value === "VERCEL_PROJECT_ID");
                  const isNetlifyDefaultVar = provider === DeploymentProvider.NETLIFY &&
                    (field.value === "NETLIFY_TOKEN" || field.value === "NETLIFY_SITE_NAME" || field.value === "NETLIFY_SITE_ID");
                  const isDefaultVar = isVercelDefaultVar || isNetlifyDefaultVar;

                  return (
                    <FormItem>
                      <FormLabel className="text-sm">Key</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={isCustomProvider ? "Any variable name (e.g., API_KEY)" : "API_KEY"}
                          className="text-sm"
                          {...field}
                          disabled={isDefaultVar}
                        />
                      </FormControl>
                      {isVercelDefaultVar && (
                        <FormDescription className="text-amber-500">
                          This is a required Vercel variable and cannot be modified or removed
                        </FormDescription>
                      )}
                      {isNetlifyDefaultVar && (
                        <FormDescription className="text-amber-500">
                          This is a required Netlify variable and cannot be modified or removed
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={control}
                name={`deployment_option.environment_variables.${index}.default_value`}
                render={({ field }) => {
                  // Get isRequired value for this index
                  const isRequired = watch(`deployment_option.environment_variables.${index}.is_required`);
                  const varType = watch(`deployment_option.environment_variables.${index}.type`);
                  const requiresDefaultValue = !isRequired && !isCustomProvider;

                  return (
                    <FormItem>
                      <FormLabel className="text-sm">
                        {varType === "json" ? "JSON Schema" : "Default Value"}
                        {requiresDefaultValue ? " (Required)" : ""}
                      </FormLabel>
                      <FormControl>
                        {varType === "json" ? (
                          <JsonSchemaBuilder
                            value={field.value || ""}
                            onChange={field.onChange}
                          />
                        ) : (
                          <Input
                            placeholder={requiresDefaultValue ? "Default value is required" : "Default value"}
                            className="text-sm"
                            {...field}
                            value={field.value || ""}
                          />
                        )}
                      </FormControl>
                      {requiresDefaultValue && varType !== "json" && (
                        <FormDescription className="text-amber-500 text-xs">
                          A default value is required when variable is not required
                        </FormDescription>
                      )}
                      {varType === "json" && (
                        <FormDescription className="text-xs">
                          Define the JSON structure. Users will fill in values for each field.
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={control}
                name={`deployment_option.environment_variables.${index}.description`}
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Variable description (required)"
                        className={`text-sm min-h-[80px] resize-none ${fieldState.error ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`deployment_option.environment_variables.${index}.video`}
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

              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <FormField
                  control={control}
                  name={`deployment_option.environment_variables.${index}.is_required`}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            // Only enforce default value for non-custom providers
                            if (checked === false && !isCustomProvider) {
                              const currentDefaultValue = watch(`deployment_option.environment_variables.${index}.default_value`);
                              if (!currentDefaultValue || currentDefaultValue.trim() === "") {
                                setValue(`deployment_option.environment_variables.${index}.default_value`, "");
                              }
                            }
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal text-sm">
                        Required
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name={`deployment_option.environment_variables.${index}.is_secret`}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal text-sm">
                        Secret
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={control}
                name={`deployment_option.environment_variables.${index}.type`}
                render={({ field }) => {
                  // Ensure "text" is selected by default if no value is set
                  if (!field.value) {
                    field.onChange("text");
                  }

                  return (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm">Value Type</FormLabel>
                      <FormControl>
                        <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                          <div className="flex items-center">
                            <input
                              type="radio"
                              id={`text-type-${index}`}
                              value="text"
                              checked={field.value === "text"}
                              onChange={() => field.onChange("text")}
                              className="mr-2"
                            />
                            <label htmlFor={`text-type-${index}`} className="text-sm">Text</label>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="radio"
                              id={`json-type-${index}`}
                              value="json"
                              checked={field.value === "json"}
                              onChange={() => field.onChange("json")}
                              className="mr-2"
                            />
                            <label htmlFor={`json-type-${index}`} className="text-sm">JSON</label>
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription>
                        {field.value === "json"
                          ? "JSON values will be parsed as JSON objects"
                          : "Text values will be used as plain strings"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">{envVarFields.length}</span> of <span className="font-medium">8</span> variables used
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            appendEnvVar({
              key: "",
              default_value: "",
              description: isCustomProvider ? "Custom environment variable" : "",
              is_required: isCustomProvider ? false : true,
              is_secret: false,
              video: null,
              type: "text",
            })
          }
          disabled={envVarFields.length >= 8}
          className="w-full"
        >
          <IconPlus className="h-4 w-4 mr-2" />
          Add Environment Variable
        </Button>
        {envVarFields.length >= 8 ? (
          <p className="text-xs text-amber-500 mt-2 text-center">
            Maximum of 8 environment variables allowed.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            You can add up to 8 environment variables to this configuration.
          </p>
        )}
      </div>
    </div>
  );
}

// Left Column with Tabs
function LeftColumnWithTabs({
  githubFields,
  appendGithub,
  removeGithub,
  maxGithubAccounts,
  isUnlimitedAccounts,
}: {
  githubFields: GithubAccountDto[];
  appendGithub: (value: GithubAccountDto) => void;
  removeGithub: (index: number) => void;
  maxGithubAccounts: number;
  isUnlimitedAccounts: boolean;
}) {
  const [activeTab, setActiveTab] = useState("github");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const form = useFormContext();

  // Check if can add more accounts
  const canAddMoreAccounts = isUnlimitedAccounts || githubFields.length < maxGithubAccounts;

  // Determine if there are errors in either section
  const hasGithubErrors = !!form.formState.errors.github_accounts;
  const githubErrorMessage = (form.formState.errors.github_accounts)?.message?.toString() || '';
  const hasDeploymentErrors = !!form.formState.errors.deployment_option;
  const deploymentErrorMessage = (form.formState.errors.deployment_option)?.message?.toString() || '';

  return (
    <div className="space-y-6">
      <Tabs defaultValue="github" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger
            value="github"
            className={`${hasGithubErrors ? "border-destructive text-destructive" : ""} text-xs sm:text-sm`}
          >
            <span className="hidden sm:inline">GitHub Accounts ({githubFields.length})</span>
            <span className="sm:hidden">GitHub ({githubFields.length})</span>
            {hasGithubErrors && <span className="ml-1 sm:ml-2 text-destructive">⚠️</span>}
          </TabsTrigger>
          <TabsTrigger
            value="deployment"
            className={`${hasDeploymentErrors ? "border-destructive text-destructive" : ""} text-xs sm:text-sm`}
          >
            <span className="hidden sm:inline">Deployment Provider</span>
            <span className="sm:hidden">Deploy</span>
            {hasDeploymentErrors && <span className="ml-1 sm:ml-2 text-destructive">⚠️</span>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="github" className="mt-4">
          <Card className="p-4 sm:p-6">
            <ArrayLevelErrorMessage error={githubErrorMessage} />
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {githubFields.map((field, index) => (
                  <Card className="p-3 sm:p-4 lg:p-6" key={field.username}>
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center mb-4">
                      <h6 className="font-medium text-sm sm:text-base">Account {index + 1}</h6>
                      {githubFields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeGithub(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 dark:text-red-400 self-start sm:self-auto h-8 px-2 text-xs sm:text-sm"
                        >
                          <IconTrash className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span className="hidden xs:inline">Remove</span>
                          <span className="xs:hidden">×</span>
                        </Button>
                      )}
                    </div>
                    <hr className="mb-4" />
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
                    access_token: "",
                    repository: "",
                    workflow_file: "",
                  })
                }
                className="w-full"
                disabled={!canAddMoreAccounts}
              >
                <IconPlus className="h-4 w-4 mr-2" />
                Add GitHub Account
              </Button>
              
              {/* Show limit info */}
              <p className="text-xs text-muted-foreground text-center">
                {isUnlimitedAccounts ? (
                  "Unlimited GitHub accounts (Enterprise plan)"
                ) : (
                  <>
                    {githubFields.length} / {maxGithubAccounts} accounts used
                    {!canAddMoreAccounts && (
                      <span className="block text-amber-600 dark:text-amber-400 mt-1">
                        Upgrade your plan to add more GitHub accounts
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="deployment" className="mt-4">
          <Card className="p-4 sm:p-6">
            <ArrayLevelErrorMessage error={deploymentErrorMessage} />
            <div className="space-y-4">
              <Card className="p-4 sm:p-6">
                <ProviderFields />
              </Card>

              {/* AI Assistant for Workflow Creation */}
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3 sm:p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 text-sm sm:text-base">
                      Need Help with GitHub Workflows?
                    </h4>
                    <p className="text-blue-600 dark:text-blue-300 text-xs sm:text-sm mt-1">
                      Our AI assistant can help you create custom GitHub Actions workflows for your deployment configuration.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAssistantOpen(true)}
                    className="w-full text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900 text-xs sm:text-sm h-8 sm:h-9"
                  >
                    <IconRobot className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">Create Workflow with AI Assistant</span>
                    <span className="xs:hidden">AI Assistant</span>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Workflow Assistant Modal */}
      <WorkflowAssistant
        isOpen={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        username={githubFields[0]?.username || ""}
        accessToken={githubFields[0]?.access_token || ""}
        repository={githubFields[0]?.repository || ""}
        onWorkflowCreated={() => {
          // Refresh workflow files for the first GitHub account if it exists
          if (githubFields[0]?.username && githubFields[0]?.access_token && githubFields[0]?.repository) {
            // This would trigger a refresh in the GithubAccountFields component
            // The actual refresh logic is handled within that component
          }
        }}
      />
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
  maxGithubAccounts = 2,
}: ConfigurationFormProps) {
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [validatingGithub, setValidatingGithub] = useState(false);
  const [githubValidationErrors, setGithubValidationErrors] = useState<{ index: number, message: string }[]>([]);

  // Check if user can add more GitHub accounts
  const isUnlimitedAccounts = maxGithubAccounts === -1;

  // Create default Vercel environment variables
  const defaultVercelVariables = [
    {
      key: "VERCEL_TOKEN",
      default_value: "",
      description: "Vercel API token for deployment authentication",
      is_required: true,
      is_secret: true,
      video: null,
      type: "text",
    },
    {
      key: "VERCEL_ORG_ID",
      default_value: "",
      description: "Vercel organization ID",
      is_required: true,
      is_secret: true,
      video: null,
      type: "text",
    },
    {
      key: "VERCEL_PROJECT_ID",
      default_value: "",
      description: "Vercel project ID for deployment target",
      is_required: false,
      is_secret: true,
      video: null,
      type: "text",
    }
  ];

  const form = useForm<CreateConfigurationDto>({
    resolver: zodResolver(createConfigurationDtoSchema),
    defaultValues: initialData || {
      name: "",
      github_accounts: [
        {
          username: "",
          access_token: "",
          repository: "",
          workflow_file: "",
        },
      ],
      deployment_option: {
        provider: DeploymentProvider.VERCEL,
        environment_variables: defaultVercelVariables,
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
    name: "github_accounts",
  });

  const handleSubmit = async (values: CreateConfigurationDto) => {
    setSubmitAttempted(true);

    // Reset validation state
    setValidatingGithub(true);
    setGithubValidationErrors([]);

    try {
      // Validate all GitHub configurations
      const validationPromises = values.github_accounts.map(async (account, index) => {
        const result = await validateGithubConfig(
          account.username,
          account.access_token,
          account.repository,
          account.workflow_file
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
    <div className="space-y-4 sm:space-y-6">
      {isSuccess && <SuccessAlert isEditing={isEditing} className="mb-4 sm:mb-6" />}

      {submitAttempted && error && (
        <ErrorAlert
          isEditing={isEditing}
          message={error.message}
          className="mb-4 sm:mb-6"
        />
      )}

      {/* GitHub Validation Errors */}
      {githubValidationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex items-center mb-2">
            <IconAlertCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-red-500" />
            <h3 className="font-semibold text-sm sm:text-base">GitHub Configuration Validation Failed</h3>
          </div>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            {githubValidationErrors.map((error, idx) => (
              <li key={idx} className="text-xs sm:text-sm">
                {error.index >= 0 ? `Account ${error.index + 1}: ${error.message}` : error.message}
              </li>
            ))}
          </ul>
          <p className="text-xs sm:text-sm mt-3">
            Please check your GitHub credentials, repository names, and workflow file paths before submitting again.
          </p>
        </div>
      )}

      <FormProvider {...form}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 sm:space-y-8">
            {/* Configuration Name - Top level field */}
            <Card className="p-4 sm:p-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">Configuration Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter a descriptive name for this configuration"
                        className="text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs sm:text-sm">
                      A unique name to identify this deployment configuration
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
              {/* Left Column with Tabs */}
              <div className="lg:col-span-2 xl:col-span-3">
                <LeftColumnWithTabs
                  githubFields={githubFields}
                  appendGithub={appendGithub}
                  removeGithub={removeGithub}
                  maxGithubAccounts={maxGithubAccounts}
                  isUnlimitedAccounts={isUnlimitedAccounts}
                />
              </div>

              {/* Right Column - Actions */}
              <div className="order-first lg:order-last">
                <Card className="p-4 lg:p-6 lg:sticky lg:top-[80px]">
                  <h3 className="text-lg font-semibold mb-4">Actions</h3>
                  <div className="space-y-3">
                    <Button
                      type="submit"
                      disabled={isLoading || isSuccess || validatingGithub}
                      className="w-full text-sm"
                    >
                      {(isLoading || validatingGithub) && (
                        <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      <span className="hidden sm:inline">
                        {validatingGithub
                          ? "Validating GitHub..."
                          : isEditing
                            ? "Update Configuration"
                            : "Create Configuration"
                        }
                      </span>
                      <span className="sm:hidden">
                        {validatingGithub
                          ? "Validating..."
                          : isEditing
                            ? "Update"
                            : "Create"
                        }
                      </span>
                    </Button>

                    {isEditing && initialData && initialData.id && initialData.projectId && (
                      <>
                        <Button
                          variant="default"
                          type="button"
                          className="w-full text-sm"
                          disabled={isLoading}
                          asChild
                        >
                          <Link
                            href={`/dashboard/deployments/create?projectId=${initialData.projectId}&configurationId=${initialData.id}`}
                          >
                            <IconServer className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Deploy Configuration</span>
                            <span className="sm:hidden">Deploy</span>
                          </Link>
                        </Button>

                        <Button
                          variant="outline"
                          type="button"
                          className="w-full text-sm"
                          disabled={isLoading}
                          asChild
                        >
                          <Link
                            href={`/dashboard/projects/${initialData.projectId}/configurations/${initialData.id}/deployments`}
                          >
                            <IconHistory className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">View Deployments</span>
                            <span className="sm:hidden">Deployments</span>
                          </Link>
                        </Button>
                      </>
                    )}

                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => form.reset()}
                      className="w-full text-sm"
                      disabled={isLoading}
                    >
                      <span className="hidden sm:inline">Reset Form</span>
                      <span className="sm:hidden">Reset</span>
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
