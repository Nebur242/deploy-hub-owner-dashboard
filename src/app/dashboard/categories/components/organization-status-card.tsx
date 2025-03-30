import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrganizationStatusCardProps } from "./types";
import { ParentCategorySelector } from "./parent-category-selector";

export function OrganizationStatusCard({
    form,
    isLoading,
    success,
    formName,
    formSlug,
    excludeCategoryId
}: OrganizationStatusCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Organization & Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Status select */}
                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                disabled={isLoading || success}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                Inactive categories won&apos;t be visible to users. Pending categories are awaiting approval.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Parent Category Selector (extracted to separate component) */}
                <ParentCategorySelector
                    form={form}
                    isLoading={isLoading}
                    success={success}
                    formName={formName}
                    formSlug={formSlug}
                    excludeCategoryId={excludeCategoryId}
                />

                {/* Sort order */}
                <FormField
                    control={form.control}
                    name="sortOrder"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Sort Order</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    min="1"
                                    className="w-24"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                    value={field.value}
                                    disabled={isLoading || success}
                                />
                            </FormControl>
                            <FormDescription>
                                Categories with lower numbers appear first.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    );
}