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

    // Show loading while authenticating
    if (!isInitialized || loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-lg">Loading...</span>
            </div>
        );
    }

    // Loading during email verification redirect
    if (requireEmailVerification && status === "success" && infos && !infos.firebase?.emailVerified) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-lg">Redirecting...</span>
            </div>
        );
    }

    // Render children when authentication is successful and all checks pass
    return <>{children}</>;
}
