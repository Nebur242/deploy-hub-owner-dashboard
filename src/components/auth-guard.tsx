"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { authenticateUser } from "@/store/features/auth";
import { Loader2 } from "lucide-react";

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
        authenticate: { loading, error, status },
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

    // Show loading while authenticating or during redirects
    if (!isInitialized || loading ||
        (status === "error") ||
        (requireEmailVerification && status === "success" && infos && !infos.firebase?.emailVerified)) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-lg">Loading...</span>
            </div>
        );
    }

    // Show error if authentication failed and we're not redirecting
    if (error && (status as string) === "error") {
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
                </div>
            </div>
        );
    }

    // Render children when authentication is successful and all checks pass
    return <>{children}</>;
}
