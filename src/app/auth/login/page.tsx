"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import Link from "next/link";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { zodResolver } from "@hookform/resolvers/zod";
import { authService } from "@/services/auth-service";
import {
    requestOtpCode,
    verifyOtpCode,
    loginOwnerWithOtp,
    clearOtpState,
} from "@/store/features/auth";
import {
    firebaseSignInWithCustomToken,
    getUser,
    loginWithVerification as loginWithVerificationRequest,
    requestCode as requestCodeRequest,
    verifyCode as verifyCodeRequest,
} from "@/services/users";
import { z } from "zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { emailOnlySchema } from "@/common/dtos";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
} from "@/components/ui/input-otp";

type EmailFormData = z.infer<typeof emailOnlySchema>;

type Step = "email" | "code";

const TEST_OWNER_EMAIL = "test-owner@example.com";
const TEST_AUTH_CODE = "111111";
const SHOW_TEST_LOGIN = process.env.NODE_ENV !== "production";

export default function LoginPage() {
    const form = useForm();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [step, setStep] = useState<Step>("email");
    const [otpValue, setOtpValue] = useState("");
    const [resendCountdown, setResendCountdown] = useState(0);
    const [testLoginLoading, setTestLoginLoading] = useState(false);
    const [testError, setTestError] = useState<string | null>(null);

    // Countdown timer for resend
    useEffect(() => {
        if (resendCountdown > 0) {
            const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCountdown]);

    const {
        requestCode: { loading: requestCodeLoading, error: requestCodeError },
        verifyCode: { loading: verifyCodeLoading, error: verifyCodeError },
        loginWithOtp: { loading: loginLoading, error: loginError },
        otpEmail,
    } = useAppSelector((state) => state.auth);

    const isLoading = requestCodeLoading || verifyCodeLoading || loginLoading || testLoginLoading;
    const error = testError || requestCodeError || verifyCodeError || loginError;

    const {
        register,
        handleSubmit,
        formState: { errors },
        getValues,
    } = useForm<EmailFormData>({
        resolver: zodResolver(emailOnlySchema),
        defaultValues: {
            email: "",
        },
    });

    const handleRequestCode = (data: EmailFormData) => {
        setTestError(null);
        dispatch(
            requestOtpCode({
                email: data.email,
                purpose: "login",
                onSuccess: () => {
                    setStep("code");
                    setResendCountdown(30);
                },
            })
        );
    };

    const handleVerifyCode = () => {
        setTestError(null);
        const email = otpEmail || getValues("email");
        if (otpValue.length !== 6 || !email) return;

        dispatch(
            verifyOtpCode({
                email,
                code: otpValue,
                purpose: "login",
                onSuccess: (token) => {
                    // After verification, login with the token
                    dispatch(
                        loginOwnerWithOtp({
                            email,
                            verificationToken: token,
                            onSuccess: () => router.push("/dashboard"),
                        })
                    );
                },
            })
        );
    };

    const handleBack = () => {
        setStep("email");
        setOtpValue("");
        dispatch(clearOtpState());
    };

    const handleResendCode = () => {
        setTestError(null);
        const email = getValues("email");
        if (email && resendCountdown === 0) {
            dispatch(
                requestOtpCode({
                    email,
                    purpose: "login",
                    onSuccess: () => setResendCountdown(30),
                })
            );
        }
    };

    const handleTestLogin = async () => {
        setTestError(null);
        setTestLoginLoading(true);

        try {
            await requestCodeRequest(TEST_OWNER_EMAIL, "login");
            const verification = await verifyCodeRequest(
                TEST_OWNER_EMAIL,
                TEST_AUTH_CODE,
                "login",
            );
            const response = await loginWithVerificationRequest(
                TEST_OWNER_EMAIL,
                verification.verificationToken,
            );
            const firebaseUser = await firebaseSignInWithCustomToken(response.token);
            const idToken = await firebaseUser.user.getIdToken(true);

            authService.setToken(idToken);

            const sessionResponse = await fetch("/api/auth/session", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ idToken }),
            });

            if (!sessionResponse.ok) {
                throw new Error("Failed to create session");
            }

            await getUser(firebaseUser.user.uid, idToken);
            router.push("/dashboard");
        } catch (err) {
            setTestError(
                err instanceof Error ? err.message : "Test owner login failed",
            );
        } finally {
            setTestLoginLoading(false);
        }
    };

    let verifyButtonLabel = "Verify & Login";
    if (verifyCodeLoading) {
        verifyButtonLabel = "Verifying...";
    } else if (loginLoading) {
        verifyButtonLabel = "Logging in...";
    }

    return (
        <Form {...form}>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-2xl font-bold">Login to your account</h1>
                    <p className="text-balance text-sm text-muted-foreground">
                        {step === "email"
                            ? "Enter your email to receive a verification code"
                            : `Enter the 6-digit code sent to ${otpEmail}`}
                    </p>
                </div>

                {step === "email" ? (
                    <form
                        className="grid gap-6"
                        onSubmit={handleSubmit(handleRequestCode)}
                    >
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                {...register("email")}
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                disabled={isLoading}
                                aria-invalid={!!errors.email}
                            />
                            {errors.email && (
                                <p className="text-sm text-red-500">{errors.email.message}</p>
                            )}
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {requestCodeLoading && <Loader2 className="animate-spin mr-2" />}
                            {requestCodeLoading ? "Sending code..." : "Send verification code"}
                        </Button>

                        {SHOW_TEST_LOGIN && (
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                disabled={isLoading}
                                onClick={handleTestLogin}
                            >
                                {testLoginLoading && <Loader2 className="animate-spin mr-2" />}
                                {testLoginLoading ? "Signing in..." : "Use test owner account"}
                            </Button>
                        )}

                        {SHOW_TEST_LOGIN && (
                            <p className="text-center text-xs text-muted-foreground">
                                Uses {TEST_OWNER_EMAIL} with fixed code {TEST_AUTH_CODE}.
                            </p>
                        )}

                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="text-center text-sm">
                            Don&apos;t have an account?{" "}
                            <Link
                                href="/auth/register"
                                className="underline underline-offset-4"
                            >
                                Sign up
                            </Link>
                        </div>
                    </form>
                ) : (
                    <div className="grid gap-6">
                        <div className="flex flex-col items-center gap-6">
                            <InputOTP
                                maxLength={6}
                                value={otpValue}
                                onChange={(value) => setOtpValue(value)}
                                disabled={isLoading}
                            >
                                <InputOTPGroup>
                                    <InputOTPSlot index={0} />
                                    <InputOTPSlot index={1} />
                                    <InputOTPSlot index={2} />
                                </InputOTPGroup>
                                <InputOTPSeparator />
                                <InputOTPGroup>
                                    <InputOTPSlot index={3} />
                                    <InputOTPSlot index={4} />
                                    <InputOTPSlot index={5} />
                                </InputOTPGroup>
                            </InputOTP>

                            <Button
                                type="button"
                                className="w-full"
                                disabled={isLoading || otpValue.length !== 6}
                                onClick={handleVerifyCode}
                            >
                                {(verifyCodeLoading || loginLoading) && (
                                    <Loader2 className="animate-spin mr-2" />
                                )}
                                {verifyButtonLabel}
                            </Button>

                            <div className="flex items-center gap-4 text-sm">
                                <Button
                                    variant="link"
                                    className="text-sm p-0 h-auto"
                                    onClick={handleResendCode}
                                    disabled={isLoading || resendCountdown > 0}
                                >
                                    {resendCountdown > 0
                                        ? `Resend code (${resendCountdown}s)`
                                        : "Resend code"}
                                </Button>
                                <span className="text-muted-foreground">•</span>
                                <Button
                                    variant="link"
                                    className="text-sm p-0 h-auto"
                                    onClick={handleBack}
                                    disabled={isLoading}
                                >
                                    Change email
                                </Button>
                            </div>
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                    </div>
                )}
            </div>
        </Form>
    );
}
