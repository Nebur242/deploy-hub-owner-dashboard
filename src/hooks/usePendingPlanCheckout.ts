import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { subscriptionService } from "@/services/subscription";
import { BillingInterval, SubscriptionPlan } from "@/common/types/subscription";

interface PendingPlan {
  plan: string;
  billingInterval: string;
}

/**
 * Hook to handle pending plan selection from landing page
 * Checks sessionStorage for a selected plan and initiates checkout
 */
export function usePendingPlanCheckout() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const processPendingPlan = async () => {
      const storedPlan = sessionStorage.getItem("selectedPlan");

      if (!storedPlan) return;

      try {
        const pendingPlan: PendingPlan = JSON.parse(storedPlan);

        // Clear the stored plan immediately to prevent re-processing
        sessionStorage.removeItem("selectedPlan");

        // Skip FREE plan - just show dashboard
        if (pendingPlan.plan === "FREE") {
          toast.success("Welcome!", {
            description: "Your free account is ready to use.",
          });
          return;
        }

        setIsProcessing(true);
        toast.info("Redirecting to checkout...", {
          description: `Setting up your ${pendingPlan.plan} plan.`,
        });

        const response = await subscriptionService.createCheckoutSession({
          plan: pendingPlan.plan.toLowerCase() as SubscriptionPlan,
          billing_interval: pendingPlan.billingInterval as BillingInterval,
          success_url: `${window.location.origin}/dashboard/billing?success=true`,
          cancel_url: `${window.location.origin}/dashboard/billing`,
        });

        if (response.url) {
          window.location.href = response.url;
        } else {
          toast.error("Failed to create checkout session");
          router.push("/dashboard/billing");
        }
      } catch (error) {
        console.error("Error processing pending plan:", error);
        toast.error("Failed to process plan selection", {
          description: "Please try selecting a plan from the billing page.",
        });
        router.push("/dashboard/billing");
      } finally {
        setIsProcessing(false);
      }
    };

    // Small delay to ensure auth is fully loaded
    const timer = setTimeout(processPendingPlan, 500);
    return () => clearTimeout(timer);
  }, [router]);

  return { isProcessing };
}
