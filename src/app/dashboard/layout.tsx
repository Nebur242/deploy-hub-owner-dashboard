"use client";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { authenticateUser, logoutUser } from "@/store/features/auth";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner"
import { Button } from "@/components/ui/button";
import { registerFCMServiceWorker } from "@/utils/firebase-sw-register";
import { useNotifications } from "@/providers/NotificationProvider";


export default function Layout({ children }: { children: React.ReactNode }) {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { requestPermission } = useNotifications();

    const {
        authenticate: { loading, error, status },
        logout
    } = useAppSelector((state) => state.auth);

    const handleLogout = async () => {
        try {
            // Dispatch logout action
            await dispatch(logoutUser()).unwrap();

            // Redirect to login page
            router.push("/auth/login");
        } catch (error) {
            // Show error toast if logout fails
            toast.error("Logout failed", {
                description: error instanceof Error ? error.message : "Could not log out. Please try again.",
                duration: 5000,
            });
            // Close the dialog even if there was an error
        }
    };

    // Register Firebase service worker when the dashboard loads
    useEffect(() => {
        // Only register once user is authenticated
        if (status === "success") {
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
        }
    }, [status, requestPermission]);

    useEffect(() => {
        dispatch(authenticateUser());
    }, [dispatch]);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!loading && status === "error") {
            router.push("/auth/login");
        }
    }, [loading, status, router]);

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

    // Show a loading state when authenticating
    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-lg">Loading your dashboard...</span>
            </div>
        );
    }

    // Show error if authentication failed
    if (error) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 p-4">
                <div className="w-full max-w-md rounded-lg border border-red-100 bg-white p-6 shadow-lg">
                    <div className="mb-4 flex items-center justify-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-8 w-8 text-red-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>
                    </div>
                    <h2 className="mb-2 text-center text-xl font-bold text-gray-900">Authentication Failed</h2>
                    <p className="mb-6 text-center text-gray-600">{error}</p>
                    <div className="flex flex-col space-y-2">
                        <Button
                            onClick={() => dispatch(authenticateUser())}
                            variant={'destructive'}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="mr-2 h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                            Try Again
                        </Button>
                        <Button
                            variant={'outline'}
                            onClick={handleLogout}
                            disabled={logout.loading}
                        >
                            {logout.loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                "Back to Login"
                            )}
                        </Button>
                    </div>
                </div>
                <p className="mt-6 text-sm text-gray-500">
                    If the problem persists, please contact support.
                </p>
            </div>
        );
    }

    // Render the dashboard layout when authenticated
    return (
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
    );
}