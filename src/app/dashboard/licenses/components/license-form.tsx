/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Currency } from "@/common/enums/project";
import { LicenseStatus } from "@/common/types/license";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconLoader, IconPlus, IconX } from "@tabler/icons-react";
import { SuccessAlert, ErrorAlert } from "@/components/ui/alerts";
import { CreateLicenseDto, createLicenseDtoSchema } from "@/common/dtos";
import { useGetProjectsQuery } from "@/store/features/projects";
import { MultiSelect } from "@/components/multi-select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface LicenseFormProps {
    isEditing: boolean;
    initialData?: CreateLicenseDto;
    onSubmit: (data: CreateLicenseDto) => Promise<void>;
    isLoading: boolean;
    isSuccess: boolean;
    error: { message: string } | null;
}

const licensePresets = [
    {
        name: "Starter License",
        description: "A low-budget entry license for customers who need a small number of deployments.",
        monthly_price: 19,
        yearly_price: null,
        deployment_limit: 5,
        features: ["Production deployment", "Basic redeploys", "Standard support"],
        can_update: false,
        has_priority_support: false,
        popular: false,
    },
    {
        name: "Growth License",
        description: "A balanced license for customers who expect to iterate and deploy more often.",
        monthly_price: 49,
        yearly_price: 490,
        deployment_limit: 15,
        features: ["Production deployment", "More deployments", "Branch updates", "Standard support"],
        can_update: true,
        has_priority_support: false,
        popular: true,
    },
    {
        name: "Business License",
        description: "A higher-touch license for customers who need more deployments and faster help.",
        monthly_price: 99,
        yearly_price: 990,
        deployment_limit: 40,
        features: ["Production deployment", "High deployment allowance", "Branch updates", "Priority support"],
        can_update: true,
        has_priority_support: true,
        popular: false,
    },
];

export default function LicenseForm({
    isEditing,
    initialData,
    onSubmit,
    isLoading,
    isSuccess,
    error,
}: LicenseFormProps) {
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [features, setFeatures] = useState<string[]>(initialData?.features || []);
    const [featureInput, setFeatureInput] = useState("");
    const parsePriceInput = (value: string) => {
        if (!value.trim()) return null;
        const parsed = parseFloat(value);
        return Number.isFinite(parsed) ? parsed : null;
    };

    // Fetch projects for the multi-select
    const { data: projectsData, isLoading: isLoadingProjects } = useGetProjectsQuery({
        limit: 100, // Get a reasonable number of projects
    });

    // Initialize form with default values or initialData if editing
    const form = useForm<CreateLicenseDto>({
        resolver: zodResolver(createLicenseDtoSchema),
        defaultValues: initialData || {
            name: "",
            description: "",
            monthly_price: null,
            yearly_price: null,
            currency: Currency.USD,
            deployment_limit: 5, // Minimum deployment limit
            features: [],
            project_ids: [], // Will store project IDs
            status: LicenseStatus.DRAFT, // Default status
            popular: false, // Default popular
            can_submit_support_ticket: true, // Default: can submit support tickets
            can_redeploy: true, // Default: can redeploy (same branch)
            can_update: false, // Default: cannot update (branch switch)
            has_priority_support: false, // Default: no priority support
        },
    });

    // Generate project options for the multi-select
    const projectOptions = projectsData?.items?.map(project => ({
        label: project.name,
        value: project.id,
    })) || [];

    // Add feature
    const handleAddFeature = () => {
        if (featureInput.trim() && !features.includes(featureInput.trim())) {
            const newFeatures = [...features, featureInput.trim()];
            setFeatures(newFeatures);
            form.setValue("features", newFeatures, { shouldValidate: true });
            setFeatureInput("");
        }
    };

    // Remove feature
    const handleRemoveFeature = (index: number) => {
        const newFeatures = [...features];
        newFeatures.splice(index, 1);
        setFeatures(newFeatures);
        form.setValue("features", newFeatures, { shouldValidate: true });
    };

    const handleApplyPreset = (preset: typeof licensePresets[number]) => {
        form.setValue("name", preset.name, { shouldDirty: true, shouldValidate: true });
        form.setValue("description", preset.description, { shouldDirty: true, shouldValidate: true });
        form.setValue("monthly_price", preset.monthly_price, { shouldDirty: true, shouldValidate: true });
        form.setValue("yearly_price", preset.yearly_price, { shouldDirty: true, shouldValidate: true });
        form.setValue("deployment_limit", preset.deployment_limit, { shouldDirty: true, shouldValidate: true });
        form.setValue("status", LicenseStatus.DRAFT, { shouldDirty: true, shouldValidate: true });
        form.setValue("can_submit_support_ticket", true, { shouldDirty: true, shouldValidate: true });
        form.setValue("can_redeploy", true, { shouldDirty: true, shouldValidate: true });
        form.setValue("can_update", preset.can_update, { shouldDirty: true, shouldValidate: true });
        form.setValue("has_priority_support", preset.has_priority_support, { shouldDirty: true, shouldValidate: true });
        form.setValue("popular", preset.popular, { shouldDirty: true, shouldValidate: true });
        setFeatures(preset.features);
        form.setValue("features", preset.features, { shouldDirty: true, shouldValidate: true });
    };

    // Handle form submission
    const handleSubmit = async (values: CreateLicenseDto) => {
        setSubmitAttempted(true);

        // Make sure features are included
        values.features = features;

        await onSubmit(values);
    };

    return (
        <div className="space-y-6">
            {/* Success Alert */}
            {isSuccess && <SuccessAlert isEditing={isEditing} className="mb-6" />}

            {/* Error Alert */}
            {submitAttempted && error && (
                <ErrorAlert
                    isEditing={isEditing}
                    message={error.message}
                    className="mb-6"
                />
            )}

            <Form {...form}>
                <form
                    id="license-form"
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="space-y-6"
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Basic Information */}
                        <Card className="p-6 col-span-2">
                            {!isEditing && (
                                <div className="mb-6 rounded-md border bg-muted/30 p-4">
                                    <div className="mb-3">
                                        <h3 className="text-sm font-semibold">License presets</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Start with a simple tier, then adjust the price, deployments, and features.
                                        </p>
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-3">
                                        {licensePresets.map((preset) => (
                                            <Button
                                                key={preset.name}
                                                type="button"
                                                variant="outline"
                                                className="h-auto justify-start px-3 py-3 text-left"
                                                onClick={() => handleApplyPreset(preset)}
                                            >
                                                <span className="block">
                                                    <span className="block font-medium">{preset.name.replace(" License", "")}</span>
                                                    <span className="block text-xs text-muted-foreground">
                                                        {preset.deployment_limit} deployments - ${preset.monthly_price}/month
                                                    </span>
                                                </span>
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <h3 className="text-lg font-semibold mb-4">License Information</h3>
                            <div className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>License Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Basic License"
                                                    {...field}
                                                    disabled={isLoading || isSuccess}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Give your license a descriptive name
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Describe what this license offers..."
                                                    className="min-h-[120px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Provide details about what's included in this license
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="monthly_price"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Monthly Price</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        placeholder="19.99"
                                                        {...field}
                                                        onChange={(e) => field.onChange(parsePriceInput(e.target.value))}
                                                        value={field.value ?? ""}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Leave empty to disable monthly billing.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="yearly_price"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Yearly Price</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        placeholder="199.99"
                                                        {...field}
                                                        onChange={(e) => field.onChange(parsePriceInput(e.target.value))}
                                                        value={field.value ?? ""}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Leave empty to disable yearly billing.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="currency"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Currency</FormLabel>
                                                <Select
                                                    onValueChange={(value) => field.onChange(value as Currency)}
                                                    defaultValue={field.value}
                                                    value={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select currency" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value={Currency.USD}>USD</SelectItem>
                                                        <SelectItem value={Currency.EUR}>EUR</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="deployment_limit"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Deployments per Purchase</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min="5"
                                                        placeholder="5"
                                                        {...field}
                                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 5)}
                                                        value={field.value}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Each customer purchase of this license includes this many deployments.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
                                    One license creates one Stripe product. If you set both prices, buyers can choose monthly or yearly in Stripe Checkout. If both are empty, the license stays free.
                                </div>

                                <FormField
                                    control={form.control}
                                    name="features"
                                    render={() => (
                                        <FormItem>
                                            <FormLabel>Features</FormLabel>
                                            <div className="flex space-x-2">
                                                <FormControl>
                                                    <Input
                                                        placeholder="Enter a feature"
                                                        value={featureInput}
                                                        onChange={(e) => setFeatureInput(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                handleAddFeature();
                                                            }
                                                        }}
                                                    />
                                                </FormControl>
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    onClick={handleAddFeature}
                                                >
                                                    <IconPlus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {features.map((feature, index) => (
                                                    <Badge key={index} variant="secondary" className="px-3 py-1">
                                                        {feature}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveFeature(index)}
                                                            className="ml-2 text-muted-foreground hover:text-foreground"
                                                        >
                                                            <IconX className="h-3 w-3" />
                                                        </button>
                                                    </Badge>
                                                ))}
                                            </div>
                                            <FormDescription>
                                                Add features included in this license
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </Card>

                        {/* Right Column - Projects, Status, Popular & Actions */}
                        <div className="space-y-6">
                            <Card className="p-6">
                                <h3 className="text-lg font-semibold mb-4">Associated Projects</h3>
                                <FormField
                                    control={form.control}
                                    name="project_ids"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Projects</FormLabel>
                                            <FormControl>
                                                <MultiSelect
                                                    placeholder="Select projects"
                                                    options={projectOptions}
                                                    isLoading={isLoadingProjects}
                                                    values={field.value?.map(id => ({
                                                        label: projectOptions.find(p => p.value === id)?.label || id,
                                                        value: id
                                                    })) || []}
                                                    onChange={(options) => {
                                                        field.onChange(options.map(option => option.value));
                                                    }}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Select projects associated with this license
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </Card>

                            <Card className="p-6">
                                <h3 className="text-lg font-semibold mb-4">License Settings</h3>
                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Status</FormLabel>
                                                <Select
                                                    onValueChange={(value) => field.onChange(value as LicenseStatus)}
                                                    defaultValue={field.value}
                                                    value={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select status" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value={LicenseStatus.DRAFT}>Draft</SelectItem>
                                                        <SelectItem value={LicenseStatus.PUBLIC}>Public</SelectItem>
                                                        <SelectItem value={LicenseStatus.PRIVATE}>Private</SelectItem>
                                                        <SelectItem value={LicenseStatus.ARCHIVED}>Archived</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormDescription>
                                                    Control the visibility of this license
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="popular"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">
                                                        Popular License
                                                    </FormLabel>
                                                    <FormDescription>
                                                        Mark this license as popular/recommended
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </Card>

                            {/* License Permissions Card */}
                            <Card className="p-6">
                                <h3 className="text-lg font-semibold mb-4">User Permissions</h3>
                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="can_submit_support_ticket"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">
                                                        Support Tickets
                                                    </FormLabel>
                                                    <FormDescription>
                                                        User can submit support tickets
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="can_redeploy"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">
                                                        Redeploy
                                                    </FormLabel>
                                                    <FormDescription>
                                                        User can redeploy (same branch)
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="can_update"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">
                                                        Update (Branch Switch)
                                                    </FormLabel>
                                                    <FormDescription>
                                                        User can redeploy with different branch
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="has_priority_support"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">
                                                        Priority Support
                                                    </FormLabel>
                                                    <FormDescription>
                                                        User gets priority support
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </Card>

                            {/* Action Buttons Card */}
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
                                        {isEditing ? "Update License" : "Create License"}
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
