"use client";

import { useState } from "react";
import { IconLoader, IconAlertCircle, IconVideo, IconEye, IconEyeOff } from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EnvironmentVariablesSectionProps } from "../types";
import { VideoPlayerModal } from "@/components/video-player-modal";
import { JsonKeyValueEditor } from "@/components/json-key-value-editor";
import { EnvironmentVariable } from "@/common/types";

export function EnvVariablesCard({
  form,
  isLoading,
  success,
  configEnvVars,
  envVarValues,
  onEnvVarChange,
  isLoadingConfig,
  configError,
}: EnvironmentVariablesSectionProps) {
  // State for video modal
  const [videoModal, setVideoModal] = useState<{
    isOpen: boolean;
    videoUrl: string;
    title: string;
  }>({
    isOpen: false,
    videoUrl: "",
    title: "",
  });

  // State to track visibility of secret fields
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});

  // Toggle visibility of a secret field
  const toggleSecretVisibility = (key: string) => {
    setVisibleSecrets(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Function to open video modal
  const openVideoModal = (envVar: EnvironmentVariable) => {
    if (envVar.video) {
      setVideoModal({
        isOpen: true,
        videoUrl: envVar.video,
        title: `Tutorial: ${envVar.key}`,
      });
    }
  };

  // Function to close video modal
  const closeVideoModal = () => {
    setVideoModal({
      isOpen: false,
      videoUrl: "",
      title: "",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Environment Variables</CardTitle>
        <CardDescription>
          Environment variables from the selected configuration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoadingConfig ? (
          <div className="flex items-center justify-center py-6">
            <IconLoader className="h-6 w-6 animate-spin text-primary mr-2" />
            <span>Loading configuration details...</span>
          </div>
        ) : configError ? (
          <Alert variant="destructive">
            <IconAlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{configError}</AlertDescription>
          </Alert>
        ) : !form.getValues("configuration_id") ? (
          <Alert>
            <IconAlertCircle className="h-4 w-4" />
            <AlertTitle>Required</AlertTitle>
            <AlertDescription>
              Please select a configuration to see the required environment variables.
            </AlertDescription>
          </Alert>
        ) : configEnvVars.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No environment variables found for this configuration.
          </div>
        ) : (
          <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {configEnvVars.map((envVar) => (
              <div key={envVar.key} className={`${envVar.is_required ? 'block' : 'hidden'} p-4 border rounded-md`}>
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex-1">
                    <span className="font-medium">{envVar.key}</span>
                    <p className="text-sm text-muted-foreground mt-1">{envVar.description}</p>
                  </div>
                  {envVar.video && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 ml-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                      onClick={() => openVideoModal(envVar)}
                      title="Watch tutorial video"
                    >
                      <IconVideo className="h-5 w-5" />
                    </Button>
                  )}
                </div>

                {envVar.type === "json" ? (
                  <JsonKeyValueEditor
                    defaultJson={envVar.default_value || "{}"}
                    value={envVarValues[envVar.key] || ""}
                    onChange={(value) => onEnvVarChange(envVar.key, value)}
                    disabled={isLoading || success}
                    hasError={!!(envVar.is_required && !envVarValues[envVar.key])}
                  />
                ) : (
                  <div className="relative">
                    <Input
                      type={envVar.is_secret && !visibleSecrets[envVar.key] ? "password" : "text"}
                      placeholder={
                        envVar.is_required
                          ? `Enter value for ${envVar.key} (required)`
                          : `Enter value for ${envVar.key} (default: ${envVar.default_value || "empty"})`
                      }
                      value={envVarValues[envVar.key] || ""}
                      onChange={(e) => onEnvVarChange(envVar.key, e.target.value)}
                      disabled={isLoading || success}
                      className={`${envVar.is_required && !envVarValues[envVar.key] ? "border-red-500" : ""} ${envVar.is_secret ? "pr-10" : ""}`}
                    />
                    {envVar.is_secret && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => toggleSecretVisibility(envVar.key)}
                        disabled={isLoading || success}
                      >
                        {visibleSecrets[envVar.key] ? (
                          <IconEyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <IconEye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 mt-3">
                  {envVar.type === "json" && (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500">JSON</Badge>
                  )}
                  {envVar.is_required && (
                    <Badge variant="outline" className="bg-red-500/10 text-red-500">Required</Badge>
                  )}
                  {envVar.is_secret && (
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-500">Secret</Badge>
                  )}
                  {envVar.video && (
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-500">Has Tutorial</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <input type="hidden" {...form.register('environment_variables')} />
      </CardContent>

      {/* Video Player Modal */}
      <VideoPlayerModal
        isOpen={videoModal.isOpen}
        onClose={closeVideoModal}
        videoUrl={videoModal.videoUrl}
        title={videoModal.title}
      />
    </Card>
  );
}