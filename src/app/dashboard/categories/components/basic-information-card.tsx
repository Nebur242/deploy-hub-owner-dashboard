import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { BasicInformationCardProps } from "./types";

export function BasicInformationCard({
    form,
    handleNameChange,
    isLoading,
    success,
    isEditing,
    initialData
}: BasicInformationCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Name field */}
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="e.g. Software Development"
                                    {...field}
                                    onChange={handleNameChange}
                                    disabled={isLoading || success}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Slug field */}
                <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Slug</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="e.g. software-development"
                                    {...field}
                                    disabled={isLoading || success || (isEditing && !!initialData?.slug)}
                                />
                            </FormControl>
                            <FormDescription>
                                {isEditing && !!initialData?.slug
                                    ? "The slug cannot be changed after creation."
                                    : "The slug is used in URLs and cannot be changed later."}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Description field */}
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Describe this category..."
                                    rows={3}
                                    {...field}
                                    disabled={isLoading || success}
                                />
                            </FormControl>
                            <FormDescription>
                                {(field.value || '')?.length}/500 characters
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    );
}