import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { SingleMediaSelector } from "../../media/components/media-selector";
import { UseFormReturn } from "react-hook-form";
import { CategoryFormData, CategoryUpdateFormData } from "./category-form";

interface FeaturedImageCardProps {
    form: UseFormReturn<CategoryFormData | CategoryUpdateFormData>;
    isLoading: boolean;
    success: boolean;
}

export const FeaturedImageCard: React.FC<FeaturedImageCardProps> = ({
    form,
    // isLoading,
    // success,
}) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Featured Image</CardTitle>
            </CardHeader>
            <CardContent>
                <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <SingleMediaSelector
                                    label="Select an image for this category"
                                    value={field.value ? typeof field.value === "string" ? JSON.parse(field.value) : field.value : null}
                                    onChange={(media) => form.setValue("image", media ? JSON.stringify(media) : null)}
                                    required
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    );
};