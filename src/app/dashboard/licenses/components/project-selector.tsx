"use client";

import { useGetProjectsQuery } from "@/store/features/projects";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface ProjectSelectorProps {
    onProjectChange: (projectId: string) => void;
    selectedProjectId?: string;
}

export function ProjectSelector({ onProjectChange, selectedProjectId }: ProjectSelectorProps) {
    const { data: projectsData, isLoading, error } = useGetProjectsQuery({
        limit: 50
    });
    const [value, setValue] = useState<string>(selectedProjectId || "");

    const handleChange = (newValue: string) => {
        setValue(newValue);
        onProjectChange(newValue);
    };

    return (
        <div className="space-y-2">
            <Label htmlFor="project-selector">Select Project</Label>
            <Select
                value={value}
                onValueChange={handleChange}
                disabled={isLoading || !projectsData?.items.length}
            >
                <SelectTrigger id="project-selector" className="w-full">
                    <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                    {isLoading && (
                        <SelectItem value="loading" disabled>
                            Loading projects...
                        </SelectItem>
                    )}
                    {error ? (
                        <SelectItem value="error" disabled>
                            Error loading projects
                        </SelectItem>
                    ) : null}
                    {projectsData?.items.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                            {project.name}
                        </SelectItem>
                    ))}
                    {projectsData?.items.length === 0 && (
                        <SelectItem value="no-projects" disabled>
                            No projects available
                        </SelectItem>
                    )}
                </SelectContent>
            </Select>
        </div>
    );
}