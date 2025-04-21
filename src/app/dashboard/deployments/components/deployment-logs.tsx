"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconDownload, IconLoader, IconRefresh, IconClipboard, IconCheck } from "@tabler/icons-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useGetDeploymentLogsQuery } from "@/store/features/deployments";
import { toast } from "sonner";

interface DeploymentLogsProps {
  deploymentId: string;
  autoRefresh?: boolean;
}

export default function DeploymentLogs({ deploymentId, autoRefresh = false }: DeploymentLogsProps) {
  const [isCopied, setIsCopied] = useState(false);
  const logsContainerRef = useRef<HTMLPreElement>(null);
  
  const { 
    data: logsData, 
    isLoading, 
    isError, 
    refetch 
  } = useGetDeploymentLogsQuery(deploymentId);
  
  // Auto-scroll to bottom when logs update
  useEffect(() => {
    if (logsContainerRef.current && logsData?.logs) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logsData]);
  
  // Auto-refresh logs at intervals if autoRefresh is true
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (autoRefresh) {
      intervalId = setInterval(() => {
        refetch();
      }, 5000); // Refresh every 5 seconds
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, refetch]);
  
  // Copy logs to clipboard
  const copyToClipboard = () => {
    if (!logsData?.logs) return;
    
    navigator.clipboard.writeText(logsData.logs)
      .then(() => {
        setIsCopied(true);
        toast.success("Logs copied to clipboard");
        
        // Reset icon after 2 seconds
        setTimeout(() => {
          setIsCopied(false);
        }, 2000);
      })
      .catch((error) => {
        console.error("Failed to copy logs:", error);
        toast.error("Failed to copy logs to clipboard");
      });
  };
  
  // Download logs as text file
  const downloadLogs = () => {
    if (!logsData?.logs) return;
    
    const blob = new Blob([logsData.logs], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deployment-${deploymentId}-logs.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Logs downloaded");
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Deployment Logs</CardTitle>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <IconRefresh className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={copyToClipboard}
            disabled={isLoading || !logsData?.logs}
          >
            {isCopied ? (
              <IconCheck className="h-4 w-4 mr-1 text-green-500" />
            ) : (
              <IconClipboard className="h-4 w-4 mr-1" />
            )}
            Copy
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={downloadLogs}
            disabled={isLoading || !logsData?.logs}
          >
            <IconDownload className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <IconLoader className="h-6 w-6 animate-spin text-primary mr-2" />
            <span>Loading logs...</span>
          </div>
        ) : isError ? (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load deployment logs. Please try again.
            </AlertDescription>
          </Alert>
        ) : !logsData?.logs ? (
          <div className="py-8 text-center text-muted-foreground">
            No logs available for this deployment.
          </div>
        ) : (
          <div className="relative">
            <pre 
              ref={logsContainerRef}
              className="p-4 bg-black text-white font-mono text-sm overflow-auto rounded-md max-h-[60vh]"
            >
              {logsData.logs}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}