"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { authenticateUser } from "@/store/features/auth";

// Animated loading component
function AppLoadingScreen({ message = "Loading your dashboard..." }: { message?: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-background">
            {/* Logo and spinner container */}
            <div className="relative">
                {/* Outer spinning ring */}
                <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                <div className="w-16 h-16 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
                
                {/* Center icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                        className="w-6 h-6 text-primary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 12h14M12 5l7 7-7 7"
                        />
                    </svg>
                </div>
            </div>
            
            {/* Loading text with animation */}
            <div className="mt-6 space-y-2 text-center">
                <h2 className="text-lg font-semibold text-foreground">
                    Deploy Hub
                </h2>
                <p className="text-sm text-muted-foreground animate-pulse">
                    {message}
                </p>
            </div>

            {/* Loading progress bar */}
            <div className="mt-6 w-48 h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full animate-loading-bar"></div>
            </div>
        </div>
    );
}

interface AuthGuardProps {
    children: React.ReactNode;
    requireEmailVerification?: boolean;
}

export default function AuthGuard({
    children,
    requireEmailVerification = false
}: AuthGuardProps) {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [isInitialized, setIsInitialized] = useState(false);

    const {
        authenticate: { loading, status },
        infos,
        isLoggedIn
    } = useAppSelector((state) => state.auth);

    useEffect(() => {
        if (!isInitialized) {
            dispatch(authenticateUser());
            setIsInitialized(true);
        }
    }, [dispatch, isInitialized]);

    useEffect(() => {
        if (!loading && isInitialized) {
            if (status === "error") {
                // Not authenticated, redirect to login
                router.push("/auth/login");
                return;
            }

            if (status === "success" && isLoggedIn && infos) {
                // Check email verification if required
                if (requireEmailVerification && !infos.firebase?.emailVerified) {
                    router.push("/auth/verify-email");
                    return;
                }
            }
        }
    }, [loading, status, isLoggedIn, infos, requireEmailVerification, router, isInitialized]);

    // Show loading while authenticating
    if (!isInitialized || loading) {
        return <AppLoadingScreen />;
    }

    // Loading during email verification redirect
    if (requireEmailVerification && status === "success" && infos && !infos.firebase?.emailVerified) {
        return <AppLoadingScreen message="Redirecting to verification..." />;
    }

    // Render children when authentication is successful and all checks pass
    return <>{children}</>;
}
