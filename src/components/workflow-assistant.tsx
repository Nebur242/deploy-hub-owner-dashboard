import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { IconLoader, IconRobot, IconSend, IconCheck, IconX } from "@tabler/icons-react";
import { generateWorkflowWithAI, createWorkflowFile } from "@/services/github";
import Editor from "@monaco-editor/react";
import { useTheme } from "@/hooks/theme-context";

interface WorkflowAssistantProps {
    isOpen: boolean;
    onClose: () => void;
    username: string;
    accessToken: string;
    repository: string;
    onWorkflowCreated: () => void;
}

interface ChatMessage {
    type: "user" | "assistant";
    content: string;
}

const commonFrameworks = [
    "React",
    "Next.js",
    "Vue.js",
    "Angular",
    "Node.js",
    "Express.js",
    "Python/Django",
    "Python/Flask",
    "Ruby on Rails",
    "Laravel/PHP",
    "Spring Boot",
    ".NET Core",
    "Go/Gin",
    "Rust",
    "Static Site (HTML/CSS/JS)",
    "Other"
];

export function WorkflowAssistant({
    isOpen,
    onClose,
    username,
    accessToken,
    repository,
    onWorkflowCreated,
}: WorkflowAssistantProps) {
    const { theme } = useTheme();
    const [currentStep, setCurrentStep] = useState<"chat" | "preview" | "saving">("chat");
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            type: "assistant",
            content: "Hi! I'm your GitHub Workflow Assistant 🤖\n\nI'll help you create a custom GitHub Actions workflow tailored to your project needs. Whether you're creating your first workflow or need an additional one, let's get started with some questions:",
        },
    ]);

    // Form state
    const [projectDescription, setProjectDescription] = useState("");
    const [framework, setFramework] = useState("");
    const [deploymentTarget, setDeploymentTarget] = useState("");
    const [deploymentPreferences, setDeploymentPreferences] = useState("");

    // Generation state
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedWorkflow, setGeneratedWorkflow] = useState("");
    const [workflowFileName, setWorkflowFileName] = useState("deploy.yml");

    const getEditorTheme = () => {
        if (theme === 'dark') return 'vs-dark';
        if (theme === 'light') return 'vs-light';
        if (typeof window !== 'undefined') {
            return window.document.querySelector('html')?.getAttribute('style')?.includes('dark') ? 'vs-dark' : 'vs-light';
        }
        return 'vs-light';
    };

    const handleGenerateWorkflow = async () => {
        if (!projectDescription.trim()) {
            return;
        }

        setIsGenerating(true);

        // Add user message to chat
        const userMessage = `Project: ${projectDescription}\nFramework: ${framework || "Not specified"}\nDeployment: ${deploymentPreferences || "Default/Basic deployment"}`;
        setMessages(prev => [...prev, { type: "user", content: userMessage }]);

        try {
            const result = await generateWorkflowWithAI(
                projectDescription,
                deploymentPreferences || "Set up basic CI/CD workflow with automated testing and deployment",
                framework
            );

            if (result.error) {
                setMessages(prev => [...prev, {
                    type: "assistant",
                    content: `❌ Error generating workflow: ${result.error}\n\nPlease try again or provide more specific details about your project.`
                }]);
            } else {
                setGeneratedWorkflow(result.content);
                setMessages(prev => [...prev, {
                    type: "assistant",
                    content: "✅ Great! I've generated a custom GitHub Actions workflow for your project. You can review and edit it in the next step before saving it to your repository."
                }]);
                setCurrentStep("preview");
            }
        } catch {
            setMessages(prev => [...prev, {
                type: "assistant",
                content: "❌ An unexpected error occurred while generating the workflow. Please try again."
            }]);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveWorkflow = async () => {
        if (!generatedWorkflow.trim() || !workflowFileName.trim()) {
            return;
        }

        setCurrentStep("saving");

        try {
            const result = await createWorkflowFile(
                username,
                accessToken,
                repository,
                workflowFileName,
                generatedWorkflow,
                `Add ${workflowFileName} workflow via AI assistant`
            );

            if (result.success) {
                setMessages(prev => [...prev, {
                    type: "assistant",
                    content: `🎉 Successfully created workflow file: .github/workflows/${workflowFileName}\n\nThe workflow has been committed to your repository and is ready to use!`
                }]);
                onWorkflowCreated();
                setTimeout(() => {
                    onClose();
                }, 2000);
            } else {
                setMessages(prev => [...prev, {
                    type: "assistant",
                    content: `❌ Error saving workflow: ${result.error}`
                }]);
                setCurrentStep("preview");
            }
        } catch {
            setMessages(prev => [...prev, {
                type: "assistant",
                content: "❌ An unexpected error occurred while saving the workflow."
            }]);
            setCurrentStep("preview");
        }
    };

    const resetAssistant = () => {
        setCurrentStep("chat");
        setProjectDescription("");
        setFramework("");
        setDeploymentTarget("");
        setDeploymentPreferences("");
        setGeneratedWorkflow("");
        setWorkflowFileName("deploy.yml");
        setMessages([
            {
                type: "assistant",
                content: "Hi! I'm your GitHub Workflow Assistant 🤖\n\nI'll help you create a custom GitHub Actions workflow tailored to your project needs. Whether you're creating your first workflow or need an additional one, let's get started with some questions:",
            },
        ]);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent style={{ maxWidth: '60vw' }} className="max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <IconRobot className="h-5 w-5 text-blue-500" />
                        GitHub Workflow Assistant
                    </DialogTitle>
                    <DialogDescription>
                        Let me help you create a custom GitHub Actions workflow for your project
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden">
                    {currentStep === "chat" && (
                        <div className="h-full flex flex-col gap-4">
                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto space-y-4 max-h-60">
                                {messages.map((message, index) => (
                                    <div
                                        key={index}
                                        className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`max-w-[80%] rounded-lg px-4 py-3 whitespace-pre-wrap ${message.type === "user"
                                                ? "bg-blue-500 text-white"
                                                : "bg-muted text-foreground"
                                                }`}
                                        >
                                            {message.content}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Input Form */}
                            <Card className="p-4 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="project-description">Project Description *</Label>
                                    <Textarea
                                        id="project-description"
                                        placeholder="Describe your project: What does it do? What technologies does it use? (e.g., 'A React e-commerce app with Node.js backend and MongoDB database')"
                                        value={projectDescription}
                                        onChange={(e) => setProjectDescription(e.target.value)}
                                        className="min-h-[80px]"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="framework">Framework/Technology</Label>
                                        <Select value={framework} onValueChange={setFramework}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select framework (optional)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {commonFrameworks.map((fw) => (
                                                    <SelectItem key={fw} value={fw}>
                                                        {fw}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="deployment-target">Deployment Target</Label>
                                        <Input
                                            id="deployment-target"
                                            placeholder="e.g., Vercel, Netlify, AWS, Docker Hub"
                                            value={deploymentTarget}
                                            onChange={(e) => setDeploymentTarget(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="deployment-preferences">Deployment Preferences</Label>
                                    <Textarea
                                        id="deployment-preferences"
                                        placeholder="How do you want to deploy? Any specific requirements? (e.g., 'Deploy to Vercel on main branch push, run tests first, build optimized bundle'). Leave blank for basic CI/CD setup."
                                        value={deploymentPreferences}
                                        onChange={(e) => setDeploymentPreferences(e.target.value)}
                                        className="min-h-[80px]"
                                    />
                                </div>

                                <Button
                                    onClick={handleGenerateWorkflow}
                                    disabled={isGenerating || !projectDescription.trim()}
                                    className="w-full"
                                >
                                    {isGenerating ? (
                                        <>
                                            <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                                            Generating Workflow...
                                        </>
                                    ) : (
                                        <>
                                            <IconSend className="mr-2 h-4 w-4" />
                                            Generate Workflow
                                        </>
                                    )}
                                </Button>
                            </Card>
                        </div>
                    )}

                    {currentStep === "preview" && (
                        <div className="h-full flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Preview & Edit Workflow</h3>
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="filename">Filename:</Label>
                                        <Input
                                            id="filename"
                                            value={workflowFileName}
                                            onChange={(e) => setWorkflowFileName(e.target.value)}
                                            className="w-40"
                                            placeholder="deploy.yml"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground text-right">
                                        Choose a unique name to avoid conflicts
                                    </p>
                                </div>
                            </div>

                            <div className="flex-1 border rounded-md overflow-hidden">
                                <Editor
                                    height="400px"
                                    defaultLanguage="yaml"
                                    value={generatedWorkflow}
                                    onChange={(value) => setGeneratedWorkflow(value || "")}
                                    theme={getEditorTheme()}
                                    options={{
                                        minimap: { enabled: false },
                                        fontSize: 14,
                                        wordWrap: "on",
                                        scrollBeyondLastLine: false,
                                        automaticLayout: true,
                                    }}
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setCurrentStep("chat")}>
                                    <IconX className="mr-2 h-4 w-4" />
                                    Back to Chat
                                </Button>
                                <Button
                                    onClick={handleSaveWorkflow}
                                    disabled={!generatedWorkflow.trim() || !workflowFileName.trim()}
                                    className="flex-1"
                                >
                                    <IconCheck className="mr-2 h-4 w-4" />
                                    Save to GitHub
                                </Button>
                            </div>
                        </div>
                    )}

                    {currentStep === "saving" && (
                        <div className="h-full flex flex-col items-center justify-center gap-4">
                            <IconLoader className="h-12 w-12 animate-spin text-blue-500" />
                            <div className="text-center">
                                <h3 className="text-lg font-semibold mb-2">Saving Workflow...</h3>
                                <p className="text-muted-foreground">
                                    Creating {workflowFileName} in your repository
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={resetAssistant}>
                        Start Over
                    </Button>
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
