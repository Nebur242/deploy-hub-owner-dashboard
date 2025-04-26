"use client";

import { useState } from "react";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { SectionCards } from "@/components/section-cards";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle
} from "lucide-react";

// Mock data for deployments
const recentDeployments = [
  {
    id: "dep_1234abc",
    projectName: "Frontend Dashboard",
    environment: "production",
    status: "success",
    deployedAt: "2025-04-25T14:30:00",
    deployedBy: "Sarah Kim",
  },
  {
    id: "dep_5678def",
    projectName: "API Gateway",
    environment: "staging",
    status: "success",
    deployedAt: "2025-04-24T18:15:00",
    deployedBy: "Mike Johnson",
  },
  {
    id: "dep_9012ghi",
    projectName: "Authentication Service",
    environment: "development",
    status: "failed",
    deployedAt: "2025-04-24T11:45:00",
    deployedBy: "David Chen",
  },
  {
    id: "dep_3456jkl",
    projectName: "Customer Portal",
    environment: "production",
    status: "in-progress",
    deployedAt: "2025-04-26T09:20:00",
    deployedBy: "Emma Wilson",
  },
  {
    id: "dep_7890mno",
    projectName: "Payment Service",
    environment: "production",
    status: "success",
    deployedAt: "2025-04-23T16:40:00",
    deployedBy: "James Miller",
  },
];

// Mock data for active projects
const activeProjects = [
  {
    id: "proj_1234abc",
    name: "Frontend Dashboard",
    deployments: 87,
    environments: 3,
    lastDeployment: "2025-04-25T14:30:00",
    status: "healthy",
  },
  {
    id: "proj_5678def",
    name: "API Gateway",
    deployments: 124,
    environments: 4,
    lastDeployment: "2025-04-24T18:15:00",
    status: "healthy",
  },
  {
    id: "proj_9012ghi",
    name: "Authentication Service",
    deployments: 53,
    environments: 3,
    lastDeployment: "2025-04-24T11:45:00",
    status: "warning",
  },
  {
    id: "proj_3456jkl",
    name: "Customer Portal",
    deployments: 92,
    environments: 3,
    lastDeployment: "2025-04-26T09:20:00",
    status: "deploying",
  },
  {
    id: "proj_7890mno",
    name: "Payment Service",
    deployments: 64,
    environments: 4,
    lastDeployment: "2025-04-23T16:40:00",
    status: "healthy",
  },
];

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};


const getStatusBadge = (status: string) => {
  switch (status) {
    case "success":
      return <Badge variant="outline" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
        <CheckCircle2 size={14} /> Success</Badge>;
    case "failed":
      return <Badge variant="destructive" className="flex items-center gap-1"><XCircle size={14} /> Failed</Badge>;
    case "in-progress":
      return <Badge variant="outline" className="flex items-center gap-1"><Clock size={14} /> In Progress</Badge>;
    case "healthy":
      return <Badge variant="outline" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
        <CheckCircle2 size={14} /> Healthy</Badge>;
    case "warning":
      return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"><AlertCircle size={14} /> Warning</Badge>;
    case "deploying":
      return <Badge variant="outline" className="flex items-center gap-1"><Clock size={14} /> Deploying</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export default function Page() {
  const [activeTab, setActiveTab] = useState("deployments");

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <SectionCards />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Deployment Analytics</CardTitle>
            <CardDescription>
              User activity and deployment metrics over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartAreaInteractive />
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Deployment Health</CardTitle>
            <CardDescription>
              Current status across environments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Production
                  </p>
                  <p className="text-sm text-muted-foreground">
                    12 active services
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                    <CheckCircle2 size={14} /> Healthy
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Staging
                  </p>
                  <p className="text-sm text-muted-foreground">
                    15 active services
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                    <CheckCircle2 size={14} /> Healthy
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Development
                  </p>
                  <p className="text-sm text-muted-foreground">
                    18 active services
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">
                    <AlertCircle size={14} /> Warning
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    QA
                  </p>
                  <p className="text-sm text-muted-foreground">
                    8 active services
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                    <CheckCircle2 size={14} /> Healthy
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Project Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  View recent activities and projects
                </p>
              </div>
              <TabsList>
                <TabsTrigger value="deployments">Recent Deployments</TabsTrigger>
                <TabsTrigger value="projects">Active Projects</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="deployments" className="mt-4 p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Environment</TableHead>
                    <TableHead>Deployed By</TableHead>
                    <TableHead>Deployed At</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentDeployments.map((deployment) => (
                    <TableRow key={deployment.id}>
                      <TableCell className="font-medium">{deployment.projectName}</TableCell>
                      <TableCell>{deployment.environment}</TableCell>
                      <TableCell>{deployment.deployedBy}</TableCell>
                      <TableCell>{formatDate(deployment.deployedAt)}</TableCell>
                      <TableCell>{getStatusBadge(deployment.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="projects" className="mt-4 p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Deployments</TableHead>
                    <TableHead>Environments</TableHead>
                    <TableHead>Last Deployed</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell>{project.deployments}</TableCell>
                      <TableCell>{project.environments}</TableCell>
                      <TableCell>{formatDate(project.lastDeployment)}</TableCell>
                      <TableCell>{getStatusBadge(project.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
