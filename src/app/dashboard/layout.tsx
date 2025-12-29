"use client";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAppSelector } from "@/store/hooks";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { registerFCMServiceWorker } from "@/utils/firebase-sw-register";
import { useNotifications } from "@/providers/NotificationProvider";
import { usePendingPlanCheckout } from "@/hooks/usePendingPlanCheckout";
import AuthGuard from "@/components/auth-guard";


export default function Layout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { requestPermission } = useNotifications();

    // Handle pending plan selection from landing page
    usePendingPlanCheckout();

    console.log("Dashboard layout loaded");

    const {
        logout
    } = useAppSelector((state) => state.auth);

    // Register Firebase service worker when the dashboard loads
    useEffect(() => {
        (async () => {
            try {
                // Register the service worker
                await registerFCMServiceWorker();

                // Ask for notification permission after a short delay
                setTimeout(() => {
                    requestPermission().then(granted => {
                        if (granted) {
                            toast.success("Notifications enabled", {
                                description: "You'll now receive push notifications for important updates.",
                                duration: 5000,
                            });
                        }
                    });
                }, 2000);
            } catch (error) {
                console.error("Error setting up push notifications:", error);
            }
        })();
    }, [requestPermission]);

    useEffect(() => {
        if (logout.status === "success") {
            router.push("/auth/login");
        }
        if (logout.status === "error") {
            toast.error("Log out", {
                description: "Could not log out. Please try again.",
                duration: 5000,
            });
        }
    }, [router, logout.status]);

    return (
        <AuthGuard requireEmailVerification={true}>
            <SidebarProvider
                style={
                    {
                        "--sidebar-width": "calc(var(--spacing) * 72)",
                        "--header-height": "calc(var(--spacing) * 12)",
                    } as React.CSSProperties
                }
            >
                <AppSidebar variant="inset" />
                <SidebarInset>
                    <SiteHeader />
                    <div className="flex flex-1 flex-col">
                        <div className="@container/main py-4 md:py-6 px-4 lg:px-6">{children}</div>
                    </div>
                </SidebarInset>
                <Toaster />
            </SidebarProvider>
        </AuthGuard>
    );
}