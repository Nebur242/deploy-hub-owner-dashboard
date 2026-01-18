"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
    CreditCard,
    AlertCircle,
    Check,
    Calendar,
    Zap,
    Crown,
    Rocket,
    Loader2,
    ExternalLink,
    X,
} from "lucide-react";
import { toast } from "sonner";
import { subscriptionService } from "@/services/subscription";
import {
    Subscription,
    PlanConfig,
    SubscriptionStatus,
    SubscriptionPlan,
    BillingInterval,
} from "@/common/types/subscription";
import { useSearchParams } from "next/navigation";
import { usePaddle } from "@/hooks/use-paddle";

const planIcons: Record<SubscriptionPlan, React.ReactNode> = {
    [SubscriptionPlan.FREE]: <Zap className="h-5 w-5" />,
    [SubscriptionPlan.STARTER]: <Rocket className="h-5 w-5" />,
    [SubscriptionPlan.PRO]: <Crown className="h-5 w-5" />,
};

const statusColors: Record<SubscriptionStatus, string> = {
    [SubscriptionStatus.ACTIVE]: "bg-green-600",
    [SubscriptionStatus.TRIALING]: "bg-blue-600",
    [SubscriptionStatus.PAST_DUE]: "bg-yellow-600",
    [SubscriptionStatus.CANCELED]: "bg-gray-600",
    [SubscriptionStatus.INCOMPLETE]: "bg-orange-600",
    [SubscriptionStatus.INCOMPLETE_EXPIRED]: "bg-red-600",
    [SubscriptionStatus.UNPAID]: "bg-red-600",
    [SubscriptionStatus.PAUSED]: "bg-gray-500",
};

function BillingContent() {
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState("overview");
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [plans, setPlans] = useState<PlanConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [billingInterval, setBillingInterval] = useState<BillingInterval>(BillingInterval.MONTHLY);

    // Paddle checkout hook
    const handleCheckoutSuccess = useCallback(() => {
        toast.success("Subscription activated!", {
            description: "Your subscription has been successfully activated.",
        });
        loadData(); // Reload subscription data
    }, []);

    const handleCheckoutClose = useCallback(() => {
        setActionLoading(null);
    }, []);

    const handleCheckoutError = useCallback((error: Error) => {
        console.error("Checkout error:", error);
        toast.error("Checkout failed", {
            description: error.message || "Please try again later.",
        });
        setActionLoading(null);
    }, []);

    const { openCheckout } = usePaddle({
        onCheckoutSuccess: handleCheckoutSuccess,
        onCheckoutClose: handleCheckoutClose,
        onCheckoutError: handleCheckoutError,
    });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        // Handle success/cancel from Paddle checkout redirect
        const success = searchParams.get("success");
        const canceled = searchParams.get("canceled");

        if (success === "true") {
            toast.success("Subscription activated!", {
                description: "Your subscription has been successfully activated.",
            });
            loadData(); // Reload subscription data
        } else if (canceled === "true") {
            toast.info("Checkout canceled", {
                description: "You can upgrade your plan anytime.",
            });
        }
    }, [searchParams]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [sub, availablePlans] = await Promise.all([
                subscriptionService.getSubscription(),
                subscriptionService.getPlans(),
            ]);
            setSubscription(sub);
            setPlans(availablePlans);

            if (sub.billing_interval) {
                setBillingInterval(sub.billing_interval);
            }
        } catch (error) {
            console.error("Error loading subscription data:", error);
            toast.error("Failed to load subscription data");
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async (plan: SubscriptionPlan) => {
        if (!subscription || plan === SubscriptionPlan.FREE) return;

        try {
            setActionLoading(plan);
            const checkoutData = await subscriptionService.createCheckoutSession({
                plan,
                billing_interval: billingInterval,
                success_url: `${window.location.origin}/dashboard/billing?success=true`,
                cancel_url: `${window.location.origin}/dashboard/billing?canceled=true`,
            });

            // Open Paddle checkout overlay
            await openCheckout(checkoutData);
        } catch (error: any) {
            console.error("Error creating checkout session:", error);
            toast.error("Failed to start checkout", {
                description: error?.response?.data?.message || "Please try again later.",
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handleManageBilling = async () => {
        try {
            setActionLoading("portal");
            const urls = await subscriptionService.getManagementUrls();
            
            if (urls.updatePaymentMethod) {
                // Open Paddle's payment method update page
                window.open(urls.updatePaymentMethod, "_blank");
            } else if (urls.cancel) {
                // Fallback to cancel URL if no update payment method URL
                window.open(urls.cancel, "_blank");
            } else {
                toast.info("Manage your subscription", {
                    description: "No active subscription found. Please subscribe to a plan first.",
                });
            }
        } catch (error: any) {
            console.error("Error getting management URLs:", error);
            toast.error("Failed to open billing portal", {
                description: error?.response?.data?.message || "Please try again later.",
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancelSubscription = async () => {
        if (!subscription) return;

        try {
            setActionLoading("cancel");
            const updated = await subscriptionService.cancelSubscription();
            setSubscription(updated);
            toast.success("Subscription will be canceled", {
                description: "Your subscription will end at the current billing period.",
            });
        } catch (error: any) {
            console.error("Error canceling subscription:", error);
            toast.error("Failed to cancel subscription", {
                description: error?.response?.data?.message || "Please try again later.",
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handleReactivateSubscription = async () => {
        if (!subscription) return;

        try {
            setActionLoading("reactivate");
            const updated = await subscriptionService.updateSubscription({
                cancel_at_period_end: false,
            });
            setSubscription(updated);
            toast.success("Subscription reactivated", {
                description: "Your subscription will continue as normal.",
            });
        } catch (error: any) {
            console.error("Error reactivating subscription:", error);
            toast.error("Failed to reactivate subscription", {
                description: error?.response?.data?.message || "Please try again later.",
            });
        } finally {
            setActionLoading(null);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "N/A";
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        });
    };

    const getCurrentPlanConfig = () => {
        return plans.find((p) => p.plan === subscription?.plan);
    };

    const getPlanPrice = (planConfig: PlanConfig) => {
        return billingInterval === BillingInterval.MONTHLY
            ? planConfig.monthlyPrice
            : planConfig.yearlyPrice;
    };

    if (loading) {
        return (
            <div className="container max-w-5xl mx-auto py-10">
                {/* Header Skeleton */}
                <div className="mb-8">
                    <Skeleton className="h-9 w-64 mb-2" />
                    <Skeleton className="h-5 w-96" />
                </div>

                {/* Tabs Skeleton */}
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg w-full mb-4">
                        <Skeleton className="h-9 rounded-md" />
                        <Skeleton className="h-9 rounded-md" />
                    </div>

                    {/* Current Plan Card Skeleton */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-5 w-5 rounded" />
                                <Skeleton className="h-6 w-32" />
                            </div>
                            <Skeleton className="h-4 w-64 mt-1" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="h-5 w-5 rounded" />
                                        <Skeleton className="h-7 w-32" />
                                        <Skeleton className="h-6 w-16 rounded-full" />
                                    </div>
                                    <Skeleton className="h-4 w-24" />
                                    <div className="flex items-center gap-2 mt-4">
                                        <Skeleton className="h-4 w-4 rounded" />
                                        <Skeleton className="h-4 w-48" />
                                    </div>
                                </div>
                                <div className="text-right space-y-4">
                                    <Skeleton className="h-8 w-24 ml-auto" />
                                    <div className="flex gap-2 justify-end">
                                        <Skeleton className="h-10 w-32 rounded-md" />
                                        <Skeleton className="h-10 w-20 rounded-md" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Plan Features Card Skeleton */}
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-40" />
                            <Skeleton className="h-4 w-56 mt-1" />
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <Skeleton className="h-5 w-5 rounded-full" />
                                        <Skeleton className="h-4 w-40" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Usage Card Skeleton */}
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-4 w-48 mt-1" />
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="space-y-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-8 w-16" />
                                        <Skeleton className="h-2 w-full rounded-full" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    const currentPlanConfig = getCurrentPlanConfig();

    return (
        <div className="container max-w-5xl mx-auto py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
                <p className="text-muted-foreground">
                    Manage your subscription plan and billing settings
                </p>
            </div>

            {/* Cancellation Warning */}
            {subscription?.cancel_at_period_end && (
                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Subscription Ending</AlertTitle>
                    <AlertDescription className="flex items-center justify-between">
                        <span>
                            Your subscription will end on {formatDate(subscription.current_period_end)}.
                            You&apos;ll be downgraded to the Free plan after this date.
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleReactivateSubscription}
                            disabled={actionLoading === "reactivate"}
                        >
                            {actionLoading === "reactivate" && (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            Reactivate
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            {/* Past Due Warning */}
            {subscription?.status === SubscriptionStatus.PAST_DUE && (
                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Payment Past Due</AlertTitle>
                    <AlertDescription>
                        Your last payment failed. Please update your payment method to avoid service interruption.
                        <Button variant="link" className="ml-2 p-0" onClick={handleManageBilling}>
                            Update payment method
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="w-full grid grid-cols-2 mb-4">
                    <TabsTrigger value="overview">Current Plan</TabsTrigger>
                    <TabsTrigger value="plans">Upgrade</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    {/* Current Plan */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" /> Current Plan
                            </CardTitle>
                            <CardDescription>
                                Details about your current subscription plan
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div>
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        {planIcons[subscription?.plan || SubscriptionPlan.FREE]}
                                        {currentPlanConfig?.name || "Free"} Plan
                                        <Badge
                                            className={`ml-2 ${statusColors[subscription?.status || SubscriptionStatus.ACTIVE]}`}
                                            variant="secondary"
                                        >
                                            <Check className="h-3 w-3 mr-1" /> {subscription?.status}
                                        </Badge>
                                    </h3>
                                    <p className="text-muted-foreground mt-1">
                                        {subscription?.billing_interval
                                            ? `Billed ${subscription.billing_interval}`
                                            : "Free forever"}
                                    </p>
                                    {subscription?.current_period_end && (
                                        <div className="mt-4 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <span>
                                                    {subscription.cancel_at_period_end
                                                        ? "Ends on "
                                                        : "Next payment on "}
                                                    {formatDate(subscription.current_period_end)}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold">
                                        {formatCurrency(Number(subscription?.amount || 0))}
                                        {subscription?.billing_interval && (
                                            <span className="text-muted-foreground text-sm font-normal">
                                                /{subscription.billing_interval === BillingInterval.MONTHLY ? "month" : "year"}
                                            </span>
                                        )}
                                    </div>
                                    {subscription?.paddle_subscription_id && (
                                        <div className="mt-4 space-x-2">
                                            <Button
                                                variant="outline"
                                                onClick={handleManageBilling}
                                                disabled={actionLoading === "portal"}
                                            >
                                                {actionLoading === "portal" && (
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                )}
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                Manage Billing
                                            </Button>
                                            {!subscription.cancel_at_period_end && (
                                                <Button
                                                    variant="ghost"
                                                    onClick={handleCancelSubscription}
                                                    disabled={actionLoading === "cancel"}
                                                >
                                                    {actionLoading === "cancel" && (
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    )}
                                                    Cancel
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Plan Features */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Plan Features & Limits</CardTitle>
                            <CardDescription>
                                What&apos;s included in your current plan
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Max Projects</span>
                                        <span className="text-sm text-muted-foreground">
                                            {subscription?.max_projects === -1
                                                ? "Unlimited"
                                                : subscription?.max_projects}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Licenses per Project</span>
                                        <span className="text-sm text-muted-foreground">
                                            {subscription?.max_licenses_per_project === -1
                                                ? "Unlimited"
                                                : subscription?.max_licenses_per_project}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Deployments</span>
                                        <span className="text-sm text-muted-foreground">
                                            Unlimited
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">GitHub Accounts</span>
                                        <span className="text-sm text-muted-foreground">
                                            {subscription?.max_github_accounts === -1
                                                ? "Unlimited"
                                                : `${subscription?.max_github_accounts}/project`}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Platform Fee</span>
                                        <Badge variant={
                                            (subscription?.platform_fee_percent ?? 50) <= 15 ? "default" 
                                            : (subscription?.platform_fee_percent ?? 50) <= 25 ? "secondary" 
                                            : "outline"
                                        }>
                                            {subscription?.platform_fee_percent ?? 50}%
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Custom Domains</span>
                                        <span className="text-sm">
                                            {subscription?.custom_domain_enabled ? (
                                                <Check className="h-4 w-4 text-green-600" />
                                            ) : (
                                                <X className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Priority Support</span>
                                        <span className="text-sm">
                                            {subscription?.priority_support ? (
                                                <Check className="h-4 w-4 text-green-600" />
                                            ) : (
                                                <X className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/50 flex flex-row items-center">
                            <AlertCircle className="h-4 w-4 text-muted-foreground mr-2" />
                            <p className="text-sm text-muted-foreground">
                                Need more? Upgrade your plan to unlock additional features and lower platform fees.
                            </p>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="plans" className="space-y-6">
                    {/* Billing Interval Toggle */}
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <span
                            className={
                                billingInterval === BillingInterval.MONTHLY
                                    ? "font-semibold"
                                    : "text-muted-foreground"
                            }
                        >
                            Monthly
                        </span>
                        <button
                            className="relative w-14 h-6 bg-muted rounded-full cursor-pointer"
                            onClick={() =>
                                setBillingInterval(
                                    billingInterval === BillingInterval.MONTHLY
                                        ? BillingInterval.YEARLY
                                        : BillingInterval.MONTHLY
                                )
                            }
                        >
                            <div
                                className={`absolute top-1 h-4 w-4 rounded-full bg-primary transition-transform ${billingInterval === BillingInterval.YEARLY
                                        ? "translate-x-9"
                                        : "translate-x-1"
                                    }`}
                            />
                        </button>
                        <span
                            className={
                                billingInterval === BillingInterval.YEARLY
                                    ? "font-semibold"
                                    : "text-muted-foreground"
                            }
                        >
                            Yearly
                            <Badge variant="secondary" className="ml-2">
                                Save 17%
                            </Badge>
                        </span>
                    </div>

                    {/* Plans Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {plans.map((plan) => {
                            const isCurrentPlan = subscription?.plan === plan.plan;
                            const price = getPlanPrice(plan);

                            return (
                                <Card
                                    key={plan.plan}
                                    className={`relative ${isCurrentPlan ? "border-primary ring-2 ring-primary" : ""
                                        }`}
                                >
                                    {isCurrentPlan && (
                                        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                                            Current Plan
                                        </Badge>
                                    )}
                                    <CardHeader className="text-center">
                                        <div className="mx-auto mb-2 p-2 rounded-full bg-muted w-fit">
                                            {planIcons[plan.plan]}
                                        </div>
                                        <CardTitle>{plan.name}</CardTitle>
                                        <CardDescription>{plan.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="text-center">
                                        <div className="text-3xl font-bold mb-4">
                                            {formatCurrency(price)}
                                            {price > 0 && (
                                                <span className="text-sm font-normal text-muted-foreground">
                                                    /{billingInterval === BillingInterval.MONTHLY ? "mo" : "yr"}
                                                </span>
                                            )}
                                        </div>
                                        <ul className="space-y-2 text-sm text-left">
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-green-600" />
                                                {plan.maxProjects === -1
                                                    ? "Unlimited projects"
                                                    : `${plan.maxProjects} project${plan.maxProjects > 1 ? 's' : ''}`}
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-green-600" />
                                                {plan.maxLicensesPerProject === -1
                                                    ? "Unlimited licenses/project"
                                                    : `${plan.maxLicensesPerProject} license${plan.maxLicensesPerProject > 1 ? 's' : ''}/project`}
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-green-600" />
                                                Unlimited deployments
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-green-600" />
                                                {plan.maxGithubAccounts === -1
                                                    ? "Unlimited GitHub accounts"
                                                    : `${plan.maxGithubAccounts} GitHub account${plan.maxGithubAccounts > 1 ? 's' : ''}/project`}
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Badge variant={plan.platformFeePercent <= 15 ? "default" : plan.platformFeePercent <= 25 ? "secondary" : "outline"}>
                                                    {plan.platformFeePercent}% platform fee
                                                </Badge>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                {plan.customDomainEnabled ? (
                                                    <Check className="h-4 w-4 text-green-600" />
                                                ) : (
                                                    <X className="h-4 w-4 text-muted-foreground" />
                                                )}
                                                Custom domains
                                            </li>
                                            <li className="flex items-center gap-2">
                                                {plan.prioritySupport ? (
                                                    <Check className="h-4 w-4 text-green-600" />
                                                ) : (
                                                    <X className="h-4 w-4 text-muted-foreground" />
                                                )}
                                                Priority support
                                            </li>
                                        </ul>
                                    </CardContent>
                                    <CardFooter>
                                        <Button
                                            className="w-full"
                                            variant={isCurrentPlan ? "outline" : "default"}
                                            disabled={
                                                isCurrentPlan ||
                                                plan.plan === SubscriptionPlan.FREE ||
                                                actionLoading === plan.plan
                                            }
                                            onClick={() => handleUpgrade(plan.plan)}
                                        >
                                            {actionLoading === plan.plan && (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            )}
                                            {isCurrentPlan
                                                ? "Current Plan"
                                                : plan.plan === SubscriptionPlan.FREE
                                                    ? "Free"
                                                    : "Upgrade"}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>

                    <p className="text-center text-sm text-muted-foreground mt-6">
                        All paid plans include a 14-day free trial. Cancel anytime.
                    </p>
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default function BillingPage() {
    return (
        <Suspense fallback={
            <div className="container max-w-5xl mx-auto py-10 flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        }>
            <BillingContent />
        </Suspense>
    );
}
