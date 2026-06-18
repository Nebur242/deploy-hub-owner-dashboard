"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useForm, useFieldArray, useFormContext, useWatch, FormProvider, FieldArrayWithId, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  getGitHubAppBranches,
  getGitHubAppInstallUrl,
  getGitHubAppManageUrl,
  getGitHubAppRepositories,
  getGitHubAppStatus,
  getGitHubAppWorkflowContent,
  getGitHubAppWorkflowFiles,
  GitHubAppRepository,
} from "@/services/github";
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
import { AlertTriangle, X, Check, ChevronsUpDown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DeploymentProvider } from "@/common/enums/project";
import { DeploymentOption } from "@/common/types";
import {
  CreateConfigurationDto,
  createConfigurationDtoSchema,
  EnvironmentVariableDto,
  GithubAccountDto,
} from "@/common/dtos";
import { Textarea } from "@/components/ui/textarea";

const GITHUB_APP_MODE = "github_app" as const;
function buildEmptyGitHubAccount(): GithubAccountDto {
  return {
    connection_mode: GITHUB_APP_MODE,
    username: "",
    access_token: "",
    repository: "",
    workflow_file: "",
    default_branch: "",
    github_app_installation_id: undefined,
    github_app_connection_token: undefined,
  };
}
function isGithubAccountMeaningful(account?: Partial<GithubAccountDto>): boolean {
  if (!account) {
    return false;
  }

  return Boolean(
    account.username ||
    account.repository ||
    account.workflow_file ||
    account.default_branch ||
    account.access_token ||
    account.github_app_installation_id ||
    account.github_app_connection_token,
  );
}

function normalizeWorkflowContent(content: string): string {
  return content.replace(/\r\n/g, "\n").trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findMissingEnvironmentVariables(
  workflowContent: string,
  environmentVariables: CreateConfigurationDto["deployment_option"]["environment_variables"]
): string[] {
  return environmentVariables
    .map((variable) => variable.key.trim())
    .filter(Boolean)
    .filter((key) => !new RegExp(`\\b${escapeRegExp(key)}\\b`).test(workflowContent));
}

function countMeaningfulGithubAccounts(accounts?: Partial<GithubAccountDto>[]): number {
  return (accounts || []).filter(account => isGithubAccountMeaningful(account)).length;
}

function normalizeGithubAccounts(accounts?: GithubAccountDto[]): GithubAccountDto[] {
  const normalizedAccounts: GithubAccountDto[] = (accounts || []).map(account => ({
    ...account,
    connection_mode: GITHUB_APP_MODE,
    access_token: "",
    github_app_connection_token: undefined,
  }));

  while (
    normalizedAccounts.length > 1 &&
    !isGithubAccountMeaningful(normalizedAccounts[normalizedAccounts.length - 1])
  ) {
    normalizedAccounts.pop();
  }

  return normalizedAccounts.length > 0
    ? normalizedAccounts
    : [buildEmptyGitHubAccount()];
}

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
  const form = useFormContext<CreateConfigurationDto>();
  const { theme } = useTheme();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const connectionStorageKey = `owner-github-app-connection:${pathname}:${index}`;

  const [workflowFiles, setWorkflowFiles] = useState<string[]>([]);
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(false);
  const [workflowError, setWorkflowError] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [workflowContent, setWorkflowContent] = useState<string>("");
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

  // Branch-related states
  const [branches, setBranches] = useState<string[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [branchError, setBranchError] = useState<string | null>(null);
  const [repoDefaultBranch, setRepoDefaultBranch] = useState<string | undefined>(undefined);
  const [branchPopoverOpen, setBranchPopoverOpen] = useState(false);
  const [workflowPopoverOpen, setWorkflowPopoverOpen] = useState(false);
  const [githubAppEnabled, setGitHubAppEnabled] = useState(false);
  const [isLoadingGithubAppStatus, setIsLoadingGithubAppStatus] = useState(true);
  const [repositories, setRepositories] = useState<GitHubAppRepository[]>([]);
  const [isLoadingRepositories, setIsLoadingRepositories] = useState(false);
  const [repositoryError, setRepositoryError] = useState<string | null>(null);

  // Watch for changes in username, token, and repository to reload workflows
  const connectionMode =
    form.watch(`github_accounts.${index}.connection_mode`) || GITHUB_APP_MODE;
  const username = form.watch(`github_accounts.${index}.username`);
  const repository = form.watch(`github_accounts.${index}.repository`);
  const selectedWorkflow = form.watch(`github_accounts.${index}.workflow_file`);
  const connectionToken = form.watch(`github_accounts.${index}.github_app_connection_token`);
  const installationId = form.watch(`github_accounts.${index}.github_app_installation_id`);
  const isGitHubAppConnection = connectionMode === GITHUB_APP_MODE;
  const hasRepositoryAccess = Boolean(username && repository && connectionToken);

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

  useEffect(() => {
    if (form.getValues(`github_accounts.${index}.connection_mode`) !== GITHUB_APP_MODE) {
      form.setValue(`github_accounts.${index}.connection_mode`, GITHUB_APP_MODE);
    }

    if (form.getValues(`github_accounts.${index}.access_token`)) {
      form.setValue(`github_accounts.${index}.access_token`, "");
    }
  }, [form, index]);

  useEffect(() => {
    let isMounted = true;

    const loadGitHubAppStatus = async () => {
      try {
        const status = await getGitHubAppStatus();
        if (isMounted) {
          setGitHubAppEnabled(status.enabled);
        }
      } catch {
        if (isMounted) {
          setGitHubAppEnabled(false);
        }
      } finally {
        if (isMounted) {
          setIsLoadingGithubAppStatus(false);
        }
      }
    };

    void loadGitHubAppStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const connectIndex = searchParams.get("githubConnectIndex");
    const returnedToken = searchParams.get("github_connection_token");
    const returnedInstallationId = searchParams.get("github_installation_id");

    if (
      connectIndex === `${index}` &&
      returnedToken &&
      returnedInstallationId
    ) {
      form.setValue(`github_accounts.${index}.connection_mode`, GITHUB_APP_MODE);
      form.setValue(`github_accounts.${index}.access_token`, "");
      form.setValue(
        `github_accounts.${index}.github_app_installation_id`,
        Number(returnedInstallationId),
      );
      form.setValue(`github_accounts.${index}.github_app_connection_token`, returnedToken);

      globalThis.window.localStorage.setItem(
        connectionStorageKey,
        JSON.stringify({
          installationId: Number(returnedInstallationId),
          connectionToken: returnedToken,
        }),
      );

      const cleanedParams = new URLSearchParams(searchParams.toString());
      cleanedParams.delete("githubConnectIndex");
      cleanedParams.delete("github_connection_token");
      cleanedParams.delete("github_installation_id");

      const cleanedQuery = cleanedParams.toString();
      const cleanedUrl = cleanedQuery ? `${pathname}?${cleanedQuery}` : pathname;

      globalThis.window.history.replaceState(null, "", cleanedUrl);
    }
  }, [connectionStorageKey, form, index, pathname, searchParams]);

  useEffect(() => {
    const existingToken = form.getValues(`github_accounts.${index}.github_app_connection_token`);
    const existingInstallationId = form.getValues(`github_accounts.${index}.github_app_installation_id`);

    if (existingToken && existingInstallationId) {
      return;
    }

    const storedConnection = globalThis.window.localStorage.getItem(connectionStorageKey);

    if (!storedConnection) {
      return;
    }

    try {
      const parsedConnection = JSON.parse(storedConnection) as {
        installationId?: number;
        connectionToken?: string;
      };

      if (!parsedConnection.connectionToken || !parsedConnection.installationId) {
        return;
      }

      form.setValue(`github_accounts.${index}.connection_mode`, GITHUB_APP_MODE);
      form.setValue(`github_accounts.${index}.access_token`, "");
      form.setValue(
        `github_accounts.${index}.github_app_installation_id`,
        parsedConnection.installationId,
      );
      form.setValue(
        `github_accounts.${index}.github_app_connection_token`,
        parsedConnection.connectionToken,
      );
    } catch {
      globalThis.window.localStorage.removeItem(connectionStorageKey);
    }
  }, [connectionStorageKey, form, index]);

  useEffect(() => {
    if (!connectionToken || !installationId) {
      return;
    }

    globalThis.window.localStorage.setItem(
      connectionStorageKey,
      JSON.stringify({
        installationId,
        connectionToken,
      }),
    );
  }, [connectionStorageKey, connectionToken, installationId]);

  const handleConnectGitHub = useCallback(async () => {
    if (connectionToken && installationId) {
      const manageUrl = await getGitHubAppManageUrl(connectionToken);
      window.location.assign(manageUrl);
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("githubConnectIndex");
    params.delete("github_connection_token");
    params.delete("github_installation_id");
    params.delete("github_setup_action");
    params.set("githubConnectIndex", `${index}`);
    const redirectTo = `${pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    const installUrl = await getGitHubAppInstallUrl(redirectTo);
    window.location.assign(installUrl);
  }, [connectionToken, index, installationId, pathname, searchParams]);

  const loadRepositories = useCallback(async () => {
    if (!connectionToken) {
      setRepositories([]);
      setRepositoryError(null);
      return;
    }

    setIsLoadingRepositories(true);
    setRepositoryError(null);

    try {
      const result = await getGitHubAppRepositories(connectionToken);
      if (result.error) {
        setRepositories([]);
        setRepositoryError(result.error);
      } else {
        setRepositories(result.repositories);
        if (result.repositories.length === 0) {
          setRepositoryError("No repositories are available for this GitHub App installation");
        }
      }
    } catch (error) {
      console.error("Error loading GitHub App repositories:", error);
      setRepositories([]);
      setRepositoryError("Failed to load repositories");
    } finally {
      setIsLoadingRepositories(false);
    }
  }, [connectionToken]);

  useEffect(() => {
    if (!isGitHubAppConnection) {
      setRepositories([]);
      setRepositoryError(null);
      return;
    }

    if (connectionToken) {
      void loadRepositories();
    }
  }, [connectionToken, isGitHubAppConnection, loadRepositories]);

  // Load workflow files when credentials are available
  const loadWorkflowFiles = useCallback(async () => {
    if (!username || !repository || !connectionToken) {
      setWorkflowFiles([]);
      setWorkflowError(null);
      return;
    }

    setIsLoadingWorkflows(true);
    setWorkflowError(null);

    try {
      const result = await getGitHubAppWorkflowFiles(connectionToken, username, repository);

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
  }, [connectionToken, repository, username]);

  // Load workflow files when dependencies change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadWorkflowFiles();
    }, 500); // Debounce to avoid too many API calls

    return () => clearTimeout(timeoutId);
  }, [loadWorkflowFiles]);

  // Load branches when credentials are available
  const loadBranches = useCallback(async () => {
    if (!username || !repository || !connectionToken) {
      setBranches([]);
      setBranchError(null);
      setRepoDefaultBranch(undefined);
      return;
    }

    setIsLoadingBranches(true);
    setBranchError(null);

    try {
      const result = await getGitHubAppBranches(connectionToken, username, repository);

      if (result.error) {
        setBranchError(result.error);
        setBranches([]);
        setRepoDefaultBranch(undefined);
      } else {
        setBranches(result.branches);
        setRepoDefaultBranch(result.defaultBranch);

        // If no branch is selected yet, auto-select the default branch
        const currentBranch = form.getValues(`github_accounts.${index}.default_branch`);
        if (!currentBranch && result.defaultBranch) {
          form.setValue(`github_accounts.${index}.default_branch`, result.defaultBranch);
        }

        if (result.branches.length === 0) {
          setBranchError("No branches found in this repository");
        }
      }
    } catch (error) {
      console.error("Error loading branches:", error);
      setBranchError("Failed to load branches");
      setBranches([]);
      setRepoDefaultBranch(undefined);
    } finally {
      setIsLoadingBranches(false);
    }
  }, [connectionToken, form, index, repository, username]);

  // Load branches when dependencies change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadBranches();
    }, 500); // Debounce to avoid too many API calls

    return () => clearTimeout(timeoutId);
  }, [loadBranches]);

  // Load workflow content for preview
  const loadWorkflowContent = async () => {
    if (
      !username ||
      !repository ||
      !selectedWorkflow ||
      !connectionToken
    ) {
      return;
    }

    setIsLoadingContent(true);

    try {
      const result = await getGitHubAppWorkflowContent(
        connectionToken,
        username,
        repository,
        selectedWorkflow,
      );

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
        <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">GitHub Connection</p>
                <p className="text-sm text-muted-foreground">
                  Connect your GitHub account through the GitHub App, then pick a repository without pasting tokens.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleConnectGitHub()}
                disabled={!githubAppEnabled}
              >
                {connectionToken ? "Manage GitHub Access" : "Connect GitHub"}
              </Button>
            </div>

            {installationId && (
              <p className="text-xs text-muted-foreground">
                Connected installation: {installationId}
              </p>
            )}

            <p className="text-sm text-muted-foreground">
              {isLoadingGithubAppStatus
                ? "Checking GitHub App availability..."
                : githubAppEnabled
                  ? "GitHub App is enabled for this deployment setup."
                  : "GitHub App setup is not configured yet."}
            </p>

            {connectionToken && (
              <p className="text-xs text-muted-foreground">
                Use GitHub to adjust repository access for this installation. Your current connection stays available when you return here.
              </p>
            )}

            {connectionToken ? (
              <FormField
                control={form.control}
                name={`github_accounts.${index}.repository`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                      <span className="text-sm font-medium">Repository</span>
                      <div className="flex items-center gap-2">
                        {isLoadingRepositories && (
                          <IconLoader className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => void loadRepositories()}
                          disabled={isLoadingRepositories}
                          className="h-7 px-2 text-xs lg:h-6"
                        >
                          <IconRefresh className="h-3 w-3 mr-1" />
                          Refresh
                        </Button>
                      </div>
                    </FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(value) => {
                          const selectedRepository = repositories.find(
                            (item) => item.name === value || item.fullName === value,
                          );

                          field.onChange(selectedRepository?.name || value);
                          form.setValue(
                            `github_accounts.${index}.username`,
                            selectedRepository?.owner || "",
                          );
                          form.setValue(
                            `github_accounts.${index}.default_branch`,
                            selectedRepository?.defaultBranch || "",
                          );
                        }}
                        value={field.value || undefined}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a repository" />
                        </SelectTrigger>
                        <SelectContent>
                          {repositories.map((item) => (
                            <SelectItem key={item.id} value={item.name}>
                              {item.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Choose a repository from your connected GitHub App installation.
                    </FormDescription>
                    {repositoryError && (
                      <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded border border-amber-200">
                        {repositoryError}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <p className="text-sm text-amber-700">
                Connect GitHub to browse repositories, branches, and workflow files.
              </p>
            )}

            <FormField
              control={form.control}
              name={`github_accounts.${index}.username`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Repository Owner</FormLabel>
                  <FormControl>
                    <Input placeholder="github-owner" {...field} disabled />
                  </FormControl>
                  <FormDescription>
                    This is filled automatically from the selected GitHub App repository.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

        <FormField
          control={form.control}
          name={`github_accounts.${index}.github_app_installation_id`}
          render={() => <></>}
        />

        {/* Only show workflow file field when all prerequisite fields are provided */}
        {hasRepositoryAccess && (
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
                      onClick={() => void loadWorkflowFiles()}
                      disabled={!hasRepositoryAccess || isLoadingWorkflows}
                      className="h-7 px-2 text-xs lg:h-6"
                    >
                      <IconRefresh className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Refresh</span>
                      <span className="sm:hidden">↻</span>
                    </Button>
                  </div>
                </FormLabel>
                <div className="flex gap-2 items-stretch">
                  <div className="flex-1 min-w-0">
                    <FormControl>
                      {workflowFiles.length > 0 ? (
                        <Popover open={workflowPopoverOpen} onOpenChange={setWorkflowPopoverOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={workflowPopoverOpen}
                              className="w-full justify-between text-sm font-normal h-10"
                            >
                              <span className="truncate">{field.value || "Select a workflow file..."}</span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search workflow files..." />
                              <CommandList>
                                <CommandEmpty>No workflow file found.</CommandEmpty>
                                <CommandGroup>
                                  {workflowFiles.map((file) => (
                                    <CommandItem
                                      key={file}
                                      value={file}
                                      onSelect={() => {
                                        field.onChange(file);
                                        setWorkflowPopoverOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          field.value === file ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {file}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <Input
                          placeholder="deploy.yml"
                          className="text-sm h-10"
                          {...field}
                        />
                      )}
                    </FormControl>
                  </div>
                  {selectedWorkflow && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePreviewClick}
                      disabled={!hasRepositoryAccess}
                      className="h-10 px-4 text-sm"
                    >
                      <IconEye className="h-4 w-4 mr-2" />
                      Preview
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
                <div className="hidden bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                    🤖 Need help creating a custom workflow? Let our AI assistant help you!
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAssistantOpen(true)}
                    className="w-full text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900"
                    disabled={!connectionToken}
                  >
                    <IconRobot className="h-4 w-4 mr-2" />
                    Create Workflow with AI Assistant
                  </Button>
                  <p className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                    The assistant can generate workflow YAML here. Saving it directly back to GitHub is currently unavailable for GitHub App connections.
                  </p>
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

        {/* Default Branch Field - shown when credentials are provided */}
        {hasRepositoryAccess && (
          <FormField
            control={form.control}
            name={`github_accounts.${index}.default_branch`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <span className="text-sm font-medium">Default Branch</span>
                  <div className="flex items-center gap-2">
                    {isLoadingBranches && (
                      <IconLoader className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => void loadBranches()}
                      disabled={!hasRepositoryAccess || isLoadingBranches}
                      className="h-7 px-2 text-xs lg:h-6"
                    >
                      <IconRefresh className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Refresh</span>
                      <span className="sm:hidden">↻</span>
                    </Button>
                  </div>
                </FormLabel>
                <FormControl>
                  {branches.length > 0 ? (
                    <Popover open={branchPopoverOpen} onOpenChange={setBranchPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={branchPopoverOpen}
                          className="w-full justify-between text-sm font-normal h-10"
                        >
                          {field.value
                            ? (
                              <span className="flex items-center gap-2">
                                {field.value}
                                {field.value === repoDefaultBranch && (
                                  <span className="text-xs text-muted-foreground">(default)</span>
                                )}
                              </span>
                            )
                            : "Select a branch..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search branches..." />
                          <CommandList>
                            <CommandEmpty>No branch found.</CommandEmpty>
                            <CommandGroup>
                              {branches.map((branch) => (
                                <CommandItem
                                  key={branch}
                                  value={branch}
                                  onSelect={() => {
                                    field.onChange(branch);
                                    setBranchPopoverOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === branch ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {branch}
                                  {branch === repoDefaultBranch && (
                                    <span className="ml-2 text-xs text-muted-foreground">(default)</span>
                                  )}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <Input
                      placeholder="main"
                      className="text-sm"
                      {...field}
                      value={field.value || ""}
                    />
                  )}
                </FormControl>
                <FormDescription>
                  {branches.length > 0
                    ? "Select the default branch for deployments"
                    : "Enter the default branch name (e.g., main, master)"
                  }
                  {repoDefaultBranch && (
                    <span className="block text-xs text-muted-foreground mt-1">
                      Repository default branch: {repoDefaultBranch}
                    </span>
                  )}
                </FormDescription>
                {branchError && (
                  <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded border border-amber-200">
                    {branchError}
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
        accessToken=""
        repository={repository}
        canSaveToGithub={false}
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
  const didInitializeEditableEnvVarOpenState = useRef(false);

  const {
    fields: envVarFields,
    prepend: prependEnvVar,
    remove: removeEnvVar,
  } = useFieldArray({
    control,
    name: "deployment_option.environment_variables",
  });

  const addEnvironmentVariable = () => {
    prependEnvVar({
      key: "",
      default_value: "",
      description: isCustomProvider ? "Custom environment variable" : "",
      is_required: !isCustomProvider,
      is_secret: false,
      video: null,
      type: "text",
    });
    setShouldOpenPrependedEnvVar(true);
  };

  // Get the current provider to adjust UI behavior
  const currentProvider = watch("deployment_option.provider");
  const isCustomProvider = currentProvider === DeploymentProvider.CUSTOM;

  // Watch for isRequired changes to update defaultValue when needed
  const watchedFields = watch("deployment_option.environment_variables");

  // Effect to ensure defaultValue is provided when isRequired is false
  useEffect(() => {
    if (!watchedFields) return;

    watchedFields.forEach((field: EnvironmentVariableDto, index: number) => {
      if (field?.is_required === false && field.default_value == null) {
        setValue(`deployment_option.environment_variables.${index}.default_value`, "", {
          shouldValidate: true
        });
      }
    });
  }, [watchedFields, setValue]);

  // Check for env var array level errors
  const envVarErrors = (form.formState.errors?.deployment_option)?.environment_variables?.message;

  const isProviderDefaultVariable = (variableKey?: string) => {
    if (!variableKey) {
      return false;
    }

    if (currentProvider === DeploymentProvider.VERCEL) {
      return ["VERCEL_TOKEN", "VERCEL_ORG_ID", "VERCEL_PROJECT_ID"].includes(variableKey);
    }

    if (currentProvider === DeploymentProvider.NETLIFY) {
      return ["NETLIFY_TOKEN", "NETLIFY_SITE_NAME", "NETLIFY_SITE_ID"].includes(variableKey);
    }

    return false;
  };

  const getEnvironmentVariableLabel = (variableKey: string | undefined, fallbackIndex: number) => {
    return `Variable: ${variableKey || fallbackIndex}`;
  };

  // Function to clear video field
  const clearVideoField = (index: number) => {
    setValue(`deployment_option.environment_variables.${index}.video`, null);
  };

  const orderedEnvVarEntries = envVarFields.map((field, index) => ({
    field,
    index,
    isDefaultVar: isProviderDefaultVariable(field.key),
  }));

  const editableEnvVarEntries = orderedEnvVarEntries.filter(entry => !entry.isDefaultVar);
  const defaultEnvVarEntries = orderedEnvVarEntries.filter(entry => entry.isDefaultVar);
  const [openEditableEnvVarIds, setOpenEditableEnvVarIds] = useState<string[]>([]);
  const [shouldOpenPrependedEnvVar, setShouldOpenPrependedEnvVar] = useState(false);

  useEffect(() => {
    if (!didInitializeEditableEnvVarOpenState.current && editableEnvVarEntries.length > 0) {
      setOpenEditableEnvVarIds(editableEnvVarEntries.map(entry => entry.field.id));
      didInitializeEditableEnvVarOpenState.current = true;
      return;
    }

    if (!shouldOpenPrependedEnvVar) {
      return;
    }

    const prependedEnvVarId = editableEnvVarEntries[0]?.field.id;
    if (!prependedEnvVarId) {
      return;
    }

    setOpenEditableEnvVarIds(previousIds => [
      prependedEnvVarId,
      ...previousIds.filter(id => id !== prependedEnvVarId),
    ]);
    setShouldOpenPrependedEnvVar(false);
  }, [editableEnvVarEntries, shouldOpenPrependedEnvVar]);

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

      <div className="flex flex-col gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">Environment Variables</p>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">{envVarFields.length}</span> of <span className="font-medium">8</span> variables used
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={addEnvironmentVariable}
          disabled={envVarFields.length >= 8}
          className="w-full sm:w-auto"
        >
          <IconPlus className="h-4 w-4 mr-2" />
          Add Environment Variable
        </Button>
      </div>

      {editableEnvVarEntries.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-sm font-medium">Custom Variables</h5>
              <p className="text-xs text-muted-foreground">
                Variables you add manually appear here first.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
            {editableEnvVarEntries.map(({ field, index }, visualIndex) => {
              const isDefaultVar = false;
              const accordionValue = `env-var-${field.key || index}`;

              return (
                <div
                  key={field.id}
                  className="space-y-3 rounded-md border border-slate-200 bg-white p-3 sm:p-4 dark:border-gray-700 dark:bg-slate-950/30"
                >
                  <Accordion
                    type="single"
                    collapsible
                    value={openEditableEnvVarIds.includes(field.id) ? accordionValue : ""}
                    onValueChange={(value) => {
                      setOpenEditableEnvVarIds(previousIds => {
                        if (!value) {
                          return previousIds.filter(id => id !== field.id);
                        }

                        return [field.id, ...previousIds.filter(id => id !== field.id)];
                      });
                    }}
                    className="w-full"
                  >
                    <AccordionItem value={accordionValue} className="border-none">
                      <div className="flex w-full items-start gap-2">
                        <AccordionTrigger className="py-0 hover:no-underline flex-1 min-w-0">
                          <div className="flex flex-1 flex-col gap-2 text-left sm:flex-row sm:items-center sm:justify-between">
                            <h6 className="font-medium text-sm sm:text-base">
                              {getEnvironmentVariableLabel(field.key, visualIndex + 1)}
                            </h6>
                          </div>
                        </AccordionTrigger>
                        {envVarFields.length > 1 && !isDefaultVar && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEnvVar(index)}
                            className="ml-auto text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 dark:text-red-400 h-8 px-2 text-xs sm:text-sm shrink-0"
                          >
                            <IconTrash className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            <span className="hidden xs:inline">Remove</span>
                            <span className="xs:hidden">×</span>
                          </Button>
                        )}
                      </div>

                      <AccordionContent className="space-y-4 pt-3">
                        <FormField
                          control={control}
                          name={`deployment_option.environment_variables.${index}.key`}
                          render={({ field }) => {
                            const isDefaultField = isProviderDefaultVariable(field.value);
                            const isVercelDefaultVar = currentProvider === DeploymentProvider.VERCEL && isDefaultField;
                            const isNetlifyDefaultVar = currentProvider === DeploymentProvider.NETLIFY && isDefaultField;

                            return (
                              <FormItem>
                                <FormLabel className="text-sm">Key</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder={isCustomProvider ? "Any variable name (e.g., API_KEY)" : "API_KEY"}
                                    className="text-sm"
                                    {...field}
                                    disabled={isDefaultField}
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
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {defaultEnvVarEntries.length > 0 && (
        <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
          <div>
            <h5 className="text-sm font-medium text-amber-900 dark:text-amber-100">Provider Default Variables</h5>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              These defaults are required by the selected deployment provider and are kept together at the bottom.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
            {defaultEnvVarEntries.map(({ field, index }, visualIndex) => {
          const accordionValue = `env-var-${field.key || index}`;

          return (
            <div
                  key={field.id}
                  className="space-y-3 rounded-md border border-amber-200 bg-white/80 p-3 sm:p-4 dark:border-amber-900/60 dark:bg-slate-950/40"
                >
                  <Accordion
                    type="single"
                    collapsible
                    defaultValue={undefined}
                    className="w-full"
                  >
                    <AccordionItem value={accordionValue} className="border-none">
                      <AccordionTrigger className="py-0 hover:no-underline">
                        <div className="flex flex-1 flex-col gap-2 text-left sm:flex-row sm:items-center sm:justify-between">
                          <h6 className="font-medium text-sm sm:text-base">
                            {getEnvironmentVariableLabel(field.key, visualIndex + 1)}
                          </h6>
                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            <div className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium dark:bg-amber-900 dark:text-amber-200">
                              Required
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent className="space-y-4 pt-3">
                    <FormField
                      control={control}
                      name={`deployment_option.environment_variables.${index}.key`}
                      render={({ field }) => {
                        const isDefaultField = isProviderDefaultVariable(field.value);
                        const isVercelDefaultVar = currentProvider === DeploymentProvider.VERCEL && isDefaultField;
                        const isNetlifyDefaultVar = currentProvider === DeploymentProvider.NETLIFY && isDefaultField;

                        return (
                          <FormItem>
                            <FormLabel className="text-sm">Key</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={isCustomProvider ? "Any variable name (e.g., API_KEY)" : "API_KEY"}
                                className="text-sm"
                                {...field}
                                disabled={isDefaultField}
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
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-2">
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
  githubFields: FieldArrayWithId<CreateConfigurationDto, "github_accounts", "id">[];
  appendGithub: (value: GithubAccountDto) => void;
  removeGithub: (index: number) => void;
  maxGithubAccounts: number;
  isUnlimitedAccounts: boolean;
}) {
  const [activeTab, setActiveTab] = useState("github");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const form = useFormContext<CreateConfigurationDto>();
  const githubAccounts = useWatch({
    control: form.control,
    name: "github_accounts",
  }) || [];
  const usedGithubAccounts = countMeaningfulGithubAccounts(githubAccounts);
  const hasEmptyGithubDraft = githubAccounts.some(account => !isGithubAccountMeaningful(account));

  // Check if can add more accounts
  const canAddMoreAccounts = isUnlimitedAccounts || usedGithubAccounts < maxGithubAccounts;
  const canAppendGithubRow = canAddMoreAccounts && !hasEmptyGithubDraft;

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
            <span className="hidden sm:inline">GitHub Accounts ({usedGithubAccounts})</span>
            <span className="sm:hidden">GitHub ({usedGithubAccounts})</span>
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
                  <Card className="p-3 sm:p-4 lg:p-6" key={field.id}>
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
                onClick={() => {
                  if (!canAppendGithubRow) {
                    return;
                  }

                  appendGithub(buildEmptyGitHubAccount());
                }}
                className="w-full"
                disabled={!canAppendGithubRow}
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
                    {usedGithubAccounts} / {maxGithubAccounts} accounts used
                    {!canAddMoreAccounts && (
                      <span className="block text-amber-600 dark:text-amber-400 mt-1">
                        Upgrade your plan to add more GitHub accounts
                      </span>
                    )}
                    {canAddMoreAccounts && hasEmptyGithubDraft && (
                      <span className="block mt-1">
                        Finish the current GitHub account before adding another.
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
              <div className="hidden bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3 sm:p-4">
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
        accessToken=""
        repository={githubFields[0]?.repository || ""}
        canSaveToGithub={false}
        onWorkflowCreated={() => {
          // Refresh workflow files for the first GitHub account if it exists
          if (githubFields[0]?.username && githubFields[0]?.repository) {
            // This would trigger a refresh in the GithubAccountFields component
            // The actual refresh logic is handled within that component
          }
        }}
      />
    </div>
  );
}

// Main deployment setup form component
export default function ConfigurationForm({
  isEditing,
  initialData,
  onSubmit,
  isLoading,
  isSuccess,
  error,
  maxGithubAccounts = 2,
}: ConfigurationFormProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
    resolver: zodResolver(createConfigurationDtoSchema) as Resolver<CreateConfigurationDto>,
    defaultValues: initialData
      ? {
          ...initialData,
          github_accounts: normalizeGithubAccounts(initialData.github_accounts || []),
        }
      : {
          name: "",
          note: "",
          github_accounts: [buildEmptyGitHubAccount()],
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
    remove: removeGithubField,
  } = useFieldArray({
    control: form.control,
    name: "github_accounts",
  });

  const isGithubAccountMeaningful = useCallback((account?: Partial<GithubAccountDto>) => {
    if (!account) {
      return false;
    }

    return Boolean(
      account.username ||
      account.repository ||
      account.workflow_file ||
      account.default_branch ||
      account.access_token ||
      account.github_app_installation_id ||
      account.github_app_connection_token,
    );
  }, []);

  const removeGithub = useCallback((index: number) => {
    const storagePrefix = `owner-github-app-connection:${pathname}:`;

    globalThis.window.localStorage.removeItem(`${storagePrefix}${index}`);

    for (let storageIndex = index + 1; storageIndex < githubFields.length; storageIndex += 1) {
      const currentKey = `${storagePrefix}${storageIndex}`;
      const nextValue = globalThis.window.localStorage.getItem(currentKey);

      if (nextValue) {
        globalThis.window.localStorage.setItem(`${storagePrefix}${storageIndex - 1}`, nextValue);
        globalThis.window.localStorage.removeItem(currentKey);
      }
    }

    removeGithubField(index);
  }, [githubFields.length, pathname, removeGithubField]);

  useEffect(() => {
    const connectIndexValue = searchParams.get("githubConnectIndex");
    const returnedToken = searchParams.get("github_connection_token");
    const returnedInstallationId = searchParams.get("github_installation_id");
    const requestedIndex = connectIndexValue
      ? Number.parseInt(connectIndexValue, 10)
      : Number.NaN;

    let requiredAccountCount =
      Number.isInteger(requestedIndex) && requestedIndex >= 0 && returnedToken && returnedInstallationId
        ? requestedIndex + 1
        : 0;

    const storagePrefix = `owner-github-app-connection:${pathname}:`;
    let highestStoredIndex = -1;

    for (let storageIndex = 0; storageIndex < globalThis.window.localStorage.length; storageIndex += 1) {
      const storageKey = globalThis.window.localStorage.key(storageIndex);
      if (!storageKey?.startsWith(storagePrefix)) {
        continue;
      }

      const accountIndex = Number.parseInt(storageKey.slice(storagePrefix.length), 10);
      if (!Number.isInteger(accountIndex) || accountIndex < 0) {
        continue;
      }

      const storedValue = globalThis.window.localStorage.getItem(storageKey);

      if (!storedValue) {
        globalThis.window.localStorage.removeItem(storageKey);
        continue;
      }

      try {
        const parsedValue = JSON.parse(storedValue) as {
          installationId?: number;
          connectionToken?: string;
        };

        if (!parsedValue.installationId || !parsedValue.connectionToken) {
          globalThis.window.localStorage.removeItem(storageKey);
          continue;
        }

        highestStoredIndex = Math.max(highestStoredIndex, accountIndex);
      } catch {
        globalThis.window.localStorage.removeItem(storageKey);
      }
    }

    requiredAccountCount = Math.max(requiredAccountCount, highestStoredIndex + 1);

    if (!isUnlimitedAccounts) {
      requiredAccountCount = Math.min(requiredAccountCount, maxGithubAccounts);
    }

    const currentAccountsLength = (form.getValues("github_accounts") || []).length;

    if (requiredAccountCount <= currentAccountsLength) {
      return;
    }

    for (let accountCount = currentAccountsLength; accountCount < requiredAccountCount; accountCount += 1) {
      appendGithub(buildEmptyGitHubAccount());
    }
  }, [appendGithub, form, githubFields.length, isUnlimitedAccounts, maxGithubAccounts, pathname, searchParams]);

  useEffect(() => {
    const accounts = form.getValues("github_accounts") || [];

    if (isUnlimitedAccounts || accounts.length <= maxGithubAccounts) {
      return;
    }

    const removableIndexes: number[] = [];

    for (let index = accounts.length - 1; index >= maxGithubAccounts; index -= 1) {
      if (isGithubAccountMeaningful(accounts[index])) {
        break;
      }

      removableIndexes.push(index);
    }

    if (removableIndexes.length === 0) {
      return;
    }

    removableIndexes.forEach(index => removeGithub(index));
  }, [form, githubFields.length, isGithubAccountMeaningful, isUnlimitedAccounts, maxGithubAccounts, removeGithub]);

  const handleSubmit = async (values: CreateConfigurationDto) => {
    setSubmitAttempted(true);

    // Reset validation state
    setValidatingGithub(true);
    setGithubValidationErrors([]);

    try {
      // Validate all GitHub configurations
      const validationPromises = values.github_accounts.map(async (account, index) => {
        if (!account.github_app_installation_id) {
          return { index, message: 'Connect GitHub before submitting this configuration' };
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

      const workflowContents = await Promise.all(
        values.github_accounts.map(async (account, index) => {
          const workflowResponse = await getGitHubAppWorkflowContent(
            account.github_app_connection_token || "",
            account.username,
            account.repository,
            account.workflow_file,
          );

          if (workflowResponse.error) {
            throw new Error(
              `Could not load workflow content for ${account.username}/${account.repository}:${account.workflow_file}. ${workflowResponse.error}`
            );
          }

          return {
            index,
            repository: `${account.username}/${account.repository}`,
            workflowFile: account.workflow_file,
            content: normalizeWorkflowContent(workflowResponse.content),
          };
        })
      );

      if (workflowContents.length > 1) {
        const expectedContent = workflowContents[0]?.content || "";
        const mismatchedWorkflows = workflowContents.filter(
          (workflow) => workflow.content !== expectedContent
        );

        if (mismatchedWorkflows.length > 0) {
          setGithubValidationErrors(
            mismatchedWorkflows.map((workflow) => ({
              index: workflow.index,
              message:
                `Workflow content must match across GitHub accounts. ` +
                `${workflow.repository}:${workflow.workflowFile} does not match the first account.`,
            }))
          );
          setValidatingGithub(false);
          return;
        }
      }

      const referenceWorkflowContent = workflowContents[0]?.content || "";
      const missingEnvironmentVariables = findMissingEnvironmentVariables(
        referenceWorkflowContent,
        values.deployment_option.environment_variables || []
      );

      if (missingEnvironmentVariables.length > 0) {
        setGithubValidationErrors([
          {
            index: -1,
            message:
              `The workflow does not reference these configured environment variables: ` +
              missingEnvironmentVariables.join(", "),
          },
        ]);
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
            <h3 className="font-semibold text-sm sm:text-base">GitHub Setup Validation Failed</h3>
          </div>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            {githubValidationErrors.map((error, idx) => (
              <li key={idx} className="text-xs sm:text-sm">
                {error.index >= 0 ? `Account ${error.index + 1}: ${error.message}` : error.message}
              </li>
            ))}
          </ul>
          <p className="text-xs sm:text-sm mt-3">
            Please make sure each account is connected through the GitHub App and has a repository and workflow selected.
          </p>
        </div>
      )}

      <FormProvider {...form}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 sm:space-y-8">
            {/* Deployment setup name - top level field */}
            <Card className="p-4 sm:p-6">
              <div className="space-y-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base">Deployment Setup Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter a descriptive name for this deployment setup"
                          className="text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs sm:text-sm">
                        A unique name to identify this deployment setup
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base">Setup Note</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add extra deployment details, caveats, or instructions for this setup"
                          className="min-h-[120px] text-sm"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription className="text-xs sm:text-sm">
                        Optional details that help explain when and how this setup should be used
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
                            ? "Update Deployment Setup"
                            : "Create Deployment Setup"
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
                            <span className="hidden sm:inline">Deploy Setup</span>
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
