"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Clock, XCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getOwnerProfile } from "@/services/users";
import { OwnerProfile, OwnerStatus } from "@/common/types/user";
import Link from "next/link";

interface OwnerStatusGuardProps {
    children: React.ReactNode;
    /**
     * Allow access even if owner profile doesn't exist (for non-owner features)
     */
    allowNoProfile?: boolean;
    /**
     * Custom message to show when profile is pending
     */
    pendingMessage?: string;
    /**
     * Custom message to show when profile is rejected
     */
    rejectedMessage?: string;
}

function StatusCard({
    status,
    rejectionReason,
    pendingMessage,
    rejectedMessage,
}: {
    status: OwnerStatus;
    rejectionReason?: string;
    pendingMessage?: string;
    rejectedMessage?: string;
}) {
    if (status === "pending") {
        return (
            <Card className="max-w-2xl mx-auto mt-8">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/20">
                        <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <CardTitle className="text-2xl">Account Pending Approval</CardTitle>
                    <CardDescription className="text-base">
                        {pendingMessage ||
                            "Your owner account is currently being reviewed by our team."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <Clock className="h-4 w-4" />
                        <AlertTitle>What happens next?</AlertTitle>
                        <AlertDescription>
                            <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                                <li>Our team will review your application within 24-48 hours</li>
                                <li>You&apos;ll receive an email notification once approved</li>
                                <li>Once approved, you&apos;ll have full access to all owner features</li>
                            </ul>
                        </AlertDescription>
                    </Alert>
                    <div className="flex justify-center gap-4 pt-4">
                        <Button variant="outline" asChild>
                            <Link href="/dashboard">Go to Dashboard</Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/dashboard/help">Contact Support</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (status === "rejected") {
        return (
            <Card className="max-w-2xl mx-auto mt-8">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                        <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                    </div>
                    <CardTitle className="text-2xl">Account Application Rejected</CardTitle>
                    <CardDescription className="text-base">
                        {rejectedMessage ||
                            "Unfortunately, your owner account application was not approved."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {rejectionReason && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Reason for rejection</AlertTitle>
                            <AlertDescription>{rejectionReason}</AlertDescription>
                        </Alert>
                    )}
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>What can you do?</AlertTitle>
                        <AlertDescription>
                            <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                                <li>Review the rejection reason above</li>
                                <li>Contact our support team for more information</li>
                                <li>You may be able to reapply after addressing the concerns</li>
                            </ul>
                        </AlertDescription>
                    </Alert>
                    <div className="flex justify-center gap-4 pt-4">
                        <Button variant="outline" asChild>
                            <Link href="/dashboard">Go to Dashboard</Link>
                        </Button>
                        <Button asChild>
                            <Link href="/dashboard/help">Contact Support</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return null;
}

function NoProfileCard() {
    return (
        <Card className="max-w-2xl mx-auto mt-8">
            <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <AlertCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <CardTitle className="text-2xl">Owner Profile Required</CardTitle>
                <CardDescription className="text-base">
                    You need to complete your owner registration to access this feature.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Complete your registration</AlertTitle>
                    <AlertDescription>
                        Please complete your owner registration to access all platform features.
                    </AlertDescription>
                </Alert>
                <div className="flex justify-center gap-4 pt-4">
                    <Button variant="outline" asChild>
                        <Link href="/dashboard">Go to Dashboard</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/auth/register">Complete Registration</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function LoadingState() {
    return (
        <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">Checking account status...</p>
        </div>
    );
}

export default function OwnerStatusGuard({
    children,
    allowNoProfile = false,
    pendingMessage,
    rejectedMessage,
}: OwnerStatusGuardProps) {
    const [ownerProfile, setOwnerProfile] = useState<OwnerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOwnerProfile = async () => {
            try {
                const profile = await getOwnerProfile();
                setOwnerProfile(profile);
            } catch (err) {
                // If 404 or not found, profile doesn't exist
                console.error("Error fetching owner profile:", err);
                setError("not_found");
            } finally {
                setLoading(false);
            }
        };

        fetchOwnerProfile();
    }, []);

    if (loading) {
        return <LoadingState />;
    }

    // No profile found
    if (error === "not_found" || !ownerProfile) {
        if (allowNoProfile) {
            return <>{children}</>;
        }
        return <NoProfileCard />;
    }

    // Profile exists but not approved
    if (ownerProfile.status !== "approved") {
        return (
            <StatusCard
                status={ownerProfile.status}
                rejectionReason={ownerProfile.rejection_reason}
                pendingMessage={pendingMessage}
                rejectedMessage={rejectedMessage}
            />
        );
    }

    // Approved - render children
    return <>{children}</>;
}

/**
 * Simple inline status banner that can be shown at the top of pages
 * Less intrusive than the full guard component
 */
export function OwnerStatusBanner() {
    const [ownerProfile, setOwnerProfile] = useState<OwnerProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOwnerProfile = async () => {
            try {
                const profile = await getOwnerProfile();
                setOwnerProfile(profile);
            } catch {
                // Silently fail - user might not have a profile
            } finally {
                setLoading(false);
            }
        };

        fetchOwnerProfile();
    }, []);

    if (loading || !ownerProfile) {
        return null;
    }

    if (ownerProfile.status === "approved") {
        return null;
    }

    if (ownerProfile.status === "pending") {
        return (
            <Alert className="mb-4 border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/10">
                <Clock className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="text-yellow-800 dark:text-yellow-200">
                    Account Pending Approval
                </AlertTitle>
                <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                    Your account is being reviewed. Some features may be limited until approval.
                </AlertDescription>
            </Alert>
        );
    }

    if (ownerProfile.status === "rejected") {
        return (
            <Alert variant="destructive" className="mb-4">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Account Application Rejected</AlertTitle>
                <AlertDescription>
                    Your application was not approved.{" "}
                    {ownerProfile.rejection_reason && (
                        <span>Reason: {ownerProfile.rejection_reason}</span>
                    )}{" "}
                    <Link href="/dashboard/help" className="underline font-medium">
                        Contact support
                    </Link>{" "}
                    for more information.
                </AlertDescription>
            </Alert>
        );
    }

    return null;
}

/**
 * Hook to get owner profile status
 */
export function useOwnerStatus() {
    const [ownerProfile, setOwnerProfile] = useState<OwnerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchOwnerProfile = async () => {
            try {
                const profile = await getOwnerProfile();
                setOwnerProfile(profile);
            } catch (err) {
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        };

        fetchOwnerProfile();
    }, []);

    return {
        ownerProfile,
        loading,
        error,
        isApproved: ownerProfile?.status === "approved",
        isPending: ownerProfile?.status === "pending",
        isRejected: ownerProfile?.status === "rejected",
        hasProfile: !!ownerProfile,
    };
}
