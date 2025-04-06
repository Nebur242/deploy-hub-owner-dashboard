/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  DeploymentProvider,
  DeploymentOption,
  EnvironmentVariable,
  // GithubAccount,
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SuccessAlert } from "./success-alert";
import { ErrorAlert } from "./error-alert";
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
// import { Separator } from "@/components/ui/separator";

// Form schema based on ProjectConfiguration type
const formSchema = z.object({
  githubAccounts: z.array(
    z.object({
      username: z.string().min(2, "Username must be at least 2 characters"),
      accessToken: z.string().min(5, "Access token is required"),
      repositories: z
        .array(z.string())
        .min(1, "At least one repository is required"),
    })
  ),
  deploymentOptions: z
    .array(
      z.object({
        provider: z.nativeEnum(DeploymentProvider),
        configTemplate: z.string(),
      })
    )
    .min(1, "At least one deployment option is required"),
  buildCommands: z
    .array(z.string())
    .min(1, "At least one build command is required"),
  environmentVariables: z.array(
    z.object({
      key: z.string().min(1, "Key is required"),
      defaultValue: z.string(),
      isRequired: z.boolean().optional().default(false),
      isSecret: z.boolean().optional().default(false),
    })
  ),
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

/**
 * Renders a configuration form for creating or updating project configurations.
 *
 * This component uses react-hook-form together with a Zod schema for validation. It supports dynamic
 * fields for GitHub accounts, build commands, deployment providers, and environment variables, allowing
 * users to add or remove entries as needed. The form initializes with provided data when editing an existing
 * configuration.
 *
 * @param isEditing - Whether the form is being used to edit an existing configuration.
 * @param initialData - Optional initial form data for pre-populating the fields when editing.
 * @param onSubmit - Callback function invoked with the form's values upon submission.
 * @param isLoading - Indicates whether the form submission is currently in progress.
 * @param isSuccess - Signifies whether the submission was successful, triggering a success alert.
 * @param error - Contains error details if the form submission fails.
 */
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

  // Initialize form with default values or initialData if editing
  const form = useForm<CreateProjectConfigurationDto>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      githubAccounts: [
        {
          // Omit id since it will be assigned by API
          username: "",
          accessToken: "",
          repositories: [""],
        },
      ],
      deploymentOptions: [
        {
          provider: DeploymentProvider.VERCEL,
          configTemplate: "{}",
        } as DeploymentOption,
      ],
      buildCommands: ["npm install", "npm run build"],
      environmentVariables: [
        {
          key: "",
          defaultValue: "",
          isRequired: true,
          isSecret: false,
        } as EnvironmentVariable,
      ],
    },
  });

  // Field arrays for dynamic forms
  const {
    fields: githubFields,
    append: appendGithub,
    remove: removeGithub,
  } = useFieldArray<CreateProjectConfigurationDto>({
    control: form.control,
    name: "githubAccounts",
  });

  const {
    fields: deploymentFields,
    append: appendDeployment,
    remove: removeDeployment,
  } = useFieldArray<CreateProjectConfigurationDto>({
    control: form.control,
    name: "deploymentOptions",
  });

  const {
    fields: commandFields,
    append: appendCommand,
    remove: removeCommand,
  } = useFieldArray<CreateProjectConfigurationDto>({
    control: form.control,
    name: "buildCommands" as any,
  });

  const {
    fields: envVarFields,
    append: appendEnvVar,
    remove: removeEnvVar,
  } = useFieldArray<CreateProjectConfigurationDto>({
    control: form.control,
    name: "environmentVariables",
  });

  // Handle form submission
  const handleSubmit = async (values: CreateProjectConfigurationDto) => {
    setSubmitAttempted(true);
    await onSubmit(values);
  };

  return (
    <div className="space-y-6">
      {/* Success Alert */}
      {isSuccess && <SuccessAlert isEditing={isEditing} />}

      {/* Error Alert */}
      {submitAttempted && error && (
        <ErrorAlert 
          isEditing={isEditing}
          message={error.message}
        />
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="space-y-6 col-span-2">
              {/* GitHub Accounts */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">GitHub Accounts</h3>
                <div className="space-y-4">
                  {githubFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="space-y-4 p-4 border rounded-md"
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">
                          GitHub Account {index + 1}
                        </h4>
                        {githubFields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeGithub(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <IconTrash className="h-4 w-4 mr-1" /> Remove
                          </Button>
                        )}
                      </div>

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
                        name={`githubAccounts.${index}.repositories`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Repositories</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="username/repo-1
username/repo-2"
                                {...field}
                                onChange={(e) => {
                                  const repos = e.target.value
                                    .split("\n")
                                    .filter((r) => r.trim());
                                  field.onChange(repos);
                                }}
                                value={field.value.join("\n")}
                              />
                            </FormControl>
                            <FormDescription>
                              Enter one repository per line (username/repo-name
                              format)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      appendGithub({
                        username: "",
                        accessToken: "",
                        repositories: [""],
                      })
                    }
                    className="w-full"
                  >
                    <IconPlus className="h-4 w-4 mr-2" />
                    Add GitHub Account
                  </Button>
                </div>
              </Card>

              {/* Build Commands */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Build Commands</h3>
                <div className="space-y-4">
                  {commandFields.map((field, index) => (
                    <div key={field.id} className="flex gap-2">
                      <FormField
                        control={form.control}
                        name={`buildCommands.${index}`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="npm run build" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {commandFields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCommand(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 size-10"
                        >
                          <IconTrash className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => appendCommand("" as any)}
                    className="w-full"
                  >
                    <IconPlus className="h-4 w-4 mr-2" />
                    Add Build Command
                  </Button>
                </div>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Deployment Options */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Deployment Providers
                </h3>
                <div className="space-y-4">
                  {deploymentFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="space-y-4 p-4 border rounded-md"
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Provider {index + 1}</h4>
                        {deploymentFields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDeployment(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <IconTrash className="h-4 w-4 mr-1" /> Remove
                          </Button>
                        )}
                      </div>

                      <FormField
                        control={form.control}
                        name={`deploymentOptions.${index}.provider`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Provider</FormLabel>
                            <Select
                              onValueChange={field.onChange}
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

                      <FormField
                        control={form.control}
                        name={`deploymentOptions.${index}.configTemplate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Configuration Template</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="{}"
                                className="font-mono text-sm"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              JSON template for deployment configuration
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      appendDeployment({
                        provider: DeploymentProvider.VERCEL,
                        configTemplate: "{}",
                      } as DeploymentOption)
                    }
                    className="w-full"
                  >
                    <IconPlus className="h-4 w-4 mr-2" />
                    Add Deployment Provider
                  </Button>
                </div>
              </Card>

              {/* Environment Variables */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Environment Variables
                </h3>
                <div className="space-y-4">
                  {envVarFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="space-y-3 p-4 border rounded-md"
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Variable {index + 1}</h4>
                        {envVarFields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEnvVar(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <IconTrash className="h-4 w-4 mr-1" /> Remove
                          </Button>
                        )}
                      </div>

                      <FormField
                        control={form.control}
                        name={`environmentVariables.${index}.key`}
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
                        control={form.control}
                        name={`environmentVariables.${index}.defaultValue`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Default Value</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-4">
                        <FormField
                          control={form.control}
                          name={`environmentVariables.${index}.isRequired`}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Required
                              </FormLabel>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`environmentVariables.${index}.isSecret`}
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

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      appendEnvVar({
                        key: "",
                        defaultValue: "",
                        isRequired: true,
                        isSecret: false,
                      } as EnvironmentVariable)
                    }
                    className="w-full"
                  >
                    <IconPlus className="h-4 w-4 mr-2" />
                    Add Environment Variable
                  </Button>
                </div>
              </Card>

              {/* Action Buttons */}
              <Card className="p-6">
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
    </div>
  );
}
