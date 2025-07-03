"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, CheckCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { getAuth } from "firebase/auth";
import { firebaseSendValidationEmail } from "@/services/users";
import { useAppDispatch } from "@/store/hooks";
import { verifyEmailStatus, logoutUser } from "@/store/features/auth";
import { toast } from "sonner";

// Create a separate component for the content that uses useSearchParams
function VerifyEmailContent() {
    const [isResending, setIsResending] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const dispatch = useAppDispatch();
    const email = searchParams.get("email");

    useEffect(() => {
        // Check if user is logged in and get their email
        const auth = getAuth();
        const user = auth.currentUser;

        if (user) {
            setUserEmail(user.email);
        } else if (email) {
            setUserEmail(email);
        } else {
            // If no user and no email parameter, redirect to login
            router.push("/auth/login");
        }
    }, [router, email]);

    const handleResendEmail = async () => {
        setIsResending(true);
        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (user) {
                await firebaseSendValidationEmail(user);
                setEmailSent(true);
                toast.success("Verification email sent!", {
                    description: "Please check your inbox and spam folder.",
                });
            } else {
                toast.error("No user found. Please register again.");
                router.push("/auth/register");
            }
        } catch (error) {
            console.error("Error sending verification email:", error);
            toast.error("Failed to send verification email. Please try again.");
        } finally {
            setIsResending(false);
        }
    };

    const handleCheckVerification = async () => {
        try {
            const result = await dispatch(verifyEmailStatus()).unwrap();

            if (result) {
                toast.success("Email verified successfully!");
                router.push("/dashboard");
            } else {
                toast.error("Email not verified yet. Please check your email.");
            }
        } catch (error) {
            console.error("Error checking verification:", error);
            toast.error("Failed to check verification status.");
        }
    };

    const handleBackToLogin = async () => {
        setIsLoggingOut(true);
        try {
            await dispatch(logoutUser()).unwrap();
            router.push("/auth/login");
        } catch (error) {
            console.error("Error logging out:", error);
            // Even if logout fails, redirect to login
            router.push("/auth/login");
        } finally {
            setIsLoggingOut(false);
        }
    };

    if (!userEmail) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center p-6">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-2xl font-bold">Verify your email</CardTitle>
                <CardDescription className="text-center">
                    We&apos;ve sent a verification link to{" "}
                    <span className="font-medium text-foreground">{userEmail}</span>
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                        Click the verification link in your email to activate your account.
                        The email may take a few minutes to arrive.
                    </AlertDescription>
                </Alert>

                <div className="space-y-4">
                    <Button
                        onClick={handleCheckVerification}
                        className="w-full"
                        variant="default"
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        I&apos;ve verified my email
                    </Button>

                    <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">
                            Didn&apos;t receive an email?
                        </p>
                        <Button
                            onClick={handleResendEmail}
                            disabled={isResending || emailSent}
                            variant="outline"
                            className="w-full"
                        >
                            {isResending ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                </>
                            ) : emailSent ? (
                                "Email sent! Check your inbox"
                            ) : (
                                "Resend verification email"
                            )}
                        </Button>
                    </div>
                </div>

                <div className="text-center pt-4 border-t">
                    <Button
                        onClick={handleBackToLogin}
                        disabled={isLoggingOut}
                        variant="ghost"
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
                    >
                        {isLoggingOut ? (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                Logging out...
                            </>
                        ) : (
                            <>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to login
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

// Loading component for the Suspense fallback
function VerifyEmailLoading() {
    return (
        <Card>
            <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <Mail className="h-8 w-8 text-gray-400" />
                </div>
                <CardTitle className="text-2xl font-bold">Loading...</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center p-6">
                <RefreshCw className="h-6 w-6 animate-spin" />
            </CardContent>
        </Card>
    );
}

// Main component with Suspense wrapper
export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<VerifyEmailLoading />}>
            <VerifyEmailContent />
        </Suspense>
    );
}