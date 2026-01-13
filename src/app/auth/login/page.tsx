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
import {
    requestOtpCode,
    verifyOtpCode,
    loginOwnerWithOtp,
    clearOtpState,
} from "@/store/features/auth";
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

export default function LoginPage() {
    const form = useForm();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [step, setStep] = useState<Step>("email");
    const [otpValue, setOtpValue] = useState("");
    const [resendCountdown, setResendCountdown] = useState(0);

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
        verificationToken,
    } = useAppSelector((state) => state.auth);

    const isLoading = requestCodeLoading || verifyCodeLoading || loginLoading;
    const error = requestCodeError || verifyCodeError || loginError;

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
                                {verifyCodeLoading
                                    ? "Verifying..."
                                    : loginLoading
                                        ? "Logging in..."
                                        : "Verify & Login"}
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
