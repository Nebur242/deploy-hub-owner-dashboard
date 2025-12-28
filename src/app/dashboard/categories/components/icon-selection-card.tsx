import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormDescription, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Check, Code, FileText, Image as ImageIcon, MessageSquare, Music, PenTool, Video } from "lucide-react";
import { IconSelectionCardProps } from "./types";

export function IconSelectionCard({ form, isLoading, success }: IconSelectionCardProps) {
    const icons = [
        { name: "code", icon: <Code className="h-6 w-6" /> },
        { name: "image", icon: <ImageIcon className="h-6 w-6" /> },
        { name: "video", icon: <Video className="h-6 w-6" /> },
        { name: "music", icon: <Music className="h-6 w-6" /> },
        { name: "text", icon: <FileText className="h-6 w-6" /> },
        { name: "message", icon: <MessageSquare className="h-6 w-6" /> },
        { name: "pen", icon: <PenTool className="h-6 w-6" /> },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Icon</CardTitle>
            </CardHeader>
            <CardContent>
                <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <div className="grid grid-cols-3 gap-2 mb-3">
                                    {icons.map((iconObj) => (
                                        <button
                                            key={iconObj.name}
                                            type="button"
                                            onClick={() => form.setValue("icon", iconObj.name)}
                                            className={`p-3 rounded-md flex items-center justify-center relative ${field.value === iconObj.name
                                                ? "bg-primary text-primary-foreground"
                                                : "border border-input hover:bg-accent hover:text-accent-foreground"
                                                }`}
                                            disabled={isLoading || success}
                                        >
                                            {iconObj.icon}
                                            {field.value === iconObj.name && (
                                                <div className="absolute -top-1 -right-1 bg-primary-foreground rounded-full">
                                                    <Check className="h-4 w-4 text-primary" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </FormControl>
                            <FormDescription>
                                Select an icon to represent this category.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    );
}