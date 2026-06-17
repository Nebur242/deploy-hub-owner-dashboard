"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    requestOtpCode,
    verifyOtpCode,
    registerOwnerWithOtp,
    clearOtpState,
    restoreOtpState,
} from "@/store/features/auth";
import { validateToken } from "@/services/users";
import { z } from "zod";
import { AlertCircle, Loader2, CheckCircle2, FileText } from "lucide-react";
import { emailOnlySchema } from "@/common/dtos";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
} from "@/components/ui/input-otp";

type EmailFormData = z.infer<typeof emailOnlySchema>;

type Step = "email" | "code" | "terms";

export default function RegisterForm() {
    const form = useForm();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [step, setStep] = useState<Step>("email");
    const [otpValue, setOtpValue] = useState("");
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [resendCountdown, setResendCountdown] = useState(0);
    const [isRestored, setIsRestored] = useState(false);

    // Session storage key
    const STORAGE_KEY = "owner_register_state";

    // Countdown timer for resend
    useEffect(() => {
        if (resendCountdown > 0) {
            const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCountdown]);

    // Form data for multi-step
    const [formData, setFormData] = useState({
        email: "",
    });

    // Restore state from sessionStorage on mount
    useEffect(() => {
        if (globalThis.window === undefined || isRestored) return;

        const restoreState = async () => {
            const saved = sessionStorage.getItem(STORAGE_KEY);
            if (!saved) {
                setIsRestored(true);
                return;
            }

            let parsed: {
                step?: Step;
                verificationToken?: string;
                formData?: typeof formData;
                termsAccepted?: boolean;
            };

            try {
                parsed = JSON.parse(saved);
            } catch (error) {
                console.error("Error parsing saved registration state:", error);
                sessionStorage.removeItem(STORAGE_KEY);
                setIsRestored(true);
                return;
            }

            // Restore form data first
            if (parsed.formData) {
                setFormData(parsed.formData);
            }

            // Check if we have valid data to restore step
            const hasStep = Boolean(parsed.step);
            const hasToken = Boolean(parsed.verificationToken);
            const email = parsed.formData?.email ?? "";
            const shouldValidateToken = hasStep && hasToken && email.length > 0;

            if (shouldValidateToken) {
                // Validate the token before restoring
                let isTokenValid = false;
                try {
                    const result = await validateToken(email, parsed.verificationToken!, "register");
                    isTokenValid = result.valid;
                } catch {
                    isTokenValid = false;
                }

                if (isTokenValid) {
                    setStep(parsed.step!);
                    dispatch(restoreOtpState({
                        email: email,
                        verificationToken: parsed.verificationToken!,
                        type: "register",
                    }));

                    if (parsed.termsAccepted !== undefined) {
                        setTermsAccepted(parsed.termsAccepted);
                    }
                } else {
                    // Token expired or invalid, clear storage and stay on email step
                    sessionStorage.removeItem(STORAGE_KEY);
                    setStep("email");
                }
            } else if (parsed.step === "code") {
                // If on code step but no token, go back to email
                setStep("email");
            }

            setIsRestored(true);
        };

        restoreState();
    }, [dispatch, isRestored]);

    const {
        requestCode: { loading: requestCodeLoading, error: requestCodeError },
        verifyCode: { loading: verifyCodeLoading, error: verifyCodeError },
        registerWithOtp: { loading: registerLoading, error: registerError },
        otpEmail,
        verificationToken,
    } = useAppSelector((state) => state.auth);

    // Save state to sessionStorage when it changes
    useEffect(() => {
        if (!isRestored || globalThis.window === undefined) return;

        const stateToSave = {
            step,
            formData,
            termsAccepted,
            verificationToken,
        };

        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }, [step, formData, termsAccepted, verificationToken, isRestored]);

    // Clear storage on successful registration
    const clearStorage = () => {
        sessionStorage.removeItem(STORAGE_KEY);
    };

    const isLoading = requestCodeLoading || verifyCodeLoading || registerLoading;
    const error = requestCodeError || verifyCodeError || registerError;

    const pendingResetTimeoutRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);

    // Handle token expiration errors - reset to email step
    useEffect(() => {
        if (registerError) {
            const errorLower = registerError.toLowerCase();
            if (
                errorLower.includes("email verification required") ||
                errorLower.includes("verify your email") ||
                errorLower.includes("verification code") ||
                errorLower.includes("invalid token") ||
                errorLower.includes("token expired") ||
                errorLower.includes("expired")
            ) {
                // Token expired, clear storage and reset to email step
                clearStorage();
                dispatch(clearOtpState());

                pendingResetTimeoutRef.current = globalThis.setTimeout(() => {
                    setStep("email");
                    setOtpValue("");
                    setTermsAccepted(false);
                }, 0);
            }
        }

        return () => {
            if (pendingResetTimeoutRef.current !== null) {
                globalThis.clearTimeout(pendingResetTimeoutRef.current);
                pendingResetTimeoutRef.current = null;
            }
        };
    }, [registerError, dispatch]);

    // Email form
    const emailForm = useForm<EmailFormData>({
        resolver: zodResolver(emailOnlySchema),
        defaultValues: { email: "" },
    });

    // Track if forms have been synced to avoid re-syncing
    const formsSyncedRef = useRef(false);

    // Sync forms with restored formData (only once after restore)
    useEffect(() => {
        if (!isRestored || formsSyncedRef.current) return;

        if (formData.email) {
            emailForm.reset({ email: formData.email });
        }

        formsSyncedRef.current = true;
    }, [isRestored, formData, emailForm]);

    // Handle email submission
    const handleRequestCode = (data: EmailFormData) => {
        setFormData(prev => ({ ...prev, email: data.email }));
        dispatch(
            requestOtpCode({
                email: data.email,
                purpose: "register",
                onSuccess: () => {
                    setStep("code");
                    setResendCountdown(30);
                },
            })
        );
    };

    // Handle OTP verification
    const handleVerifyCode = () => {
        if (otpValue.length !== 6 || !formData.email) return;
        dispatch(
            verifyOtpCode({
                email: formData.email,
                code: otpValue,
                purpose: "register",
                onSuccess: () => setStep("terms"),
            })
        );
    };

    // Handle final registration
    const handleRegister = async () => {
        if (!termsAccepted || !verificationToken) return;


        try {
            await dispatch(
                registerOwnerWithOtp({
                    email: formData.email,
                    verification_token: verificationToken,
                    terms_accepted: true,
                })
            ).unwrap();

            // Sequential cleanup after successful registration
            clearStorage();
            dispatch(clearOtpState());
            router.push("/dashboard");
        } catch {
            // Clear storage on failure as token may be invalid
            clearStorage();
        }
    };

    const handleBack = () => {
        switch (step) {
            case "code":
                // From code step, go back to email
                setStep("email");
                setOtpValue("");
                dispatch(clearOtpState());
                clearStorage();
                break;
            case "terms":
                setStep("code");
                break;
        }
    };

    const handleResendCode = () => {
        if (formData.email && resendCountdown === 0) {
            dispatch(
                requestOtpCode({
                    email: formData.email,
                    purpose: "register",
                    onSuccess: () => setResendCountdown(30),
                })
            );
        }
    };

    // Step indicator
    const steps = [
        { key: "email", label: "Email", icon: "1" },
        { key: "code", label: "Verify", icon: "2" },
        { key: "terms", label: "Terms", icon: "3" },
    ];

    const currentStepIndex = steps.findIndex(s => s.key === step);
    const getStepClassName = (stepIndex: number) => {
        if (stepIndex <= currentStepIndex) {
            return "bg-primary text-primary-foreground";
        }

        return "bg-muted text-muted-foreground";
    };

    return (
        <Form {...form}>
            <div className="flex flex-col gap-6">
                {/* Step indicator */}
                <div className="flex justify-center gap-2 mb-2">
                    {steps.map((s, i) => (
                        <div
                            key={s.key}
                            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${getStepClassName(i)}`}
                        >
                            {i < currentStepIndex ? (
                                <CheckCircle2 className="h-4 w-4" />
                            ) : (
                                s.icon
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-2xl font-bold">
                        {step === "email" && "Create your owner account"}
                        {step === "code" && "Verify your email"}
                        {step === "terms" && "Terms of Service"}
                    </h1>
                    <p className="text-balance text-sm text-muted-foreground">
                        {step === "email" && "Enter your email to get started"}
                        {step === "code" && `Enter the 6-digit code sent to ${otpEmail || formData.email}`}
                        {step === "terms" && "Accept the terms now. We’ll collect payout and profile details during Stripe setup."}
                    </p>
                </div>

                {/* Step 1: Email */}
                {step === "email" && (
                    <form
                        className="grid gap-6"
                        onSubmit={emailForm.handleSubmit(handleRequestCode)}
                    >
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                {...emailForm.register("email")}
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                disabled={isLoading}
                            />
                            {emailForm.formState.errors.email && (
                                <p className="text-sm text-red-500">
                                    {emailForm.formState.errors.email.message}
                                </p>
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
                            Already have an account?{" "}
                            <Link href="/auth/login" className="underline underline-offset-4">
                                Sign in
                            </Link>
                        </div>
                    </form>
                )}

                {/* Step 2: OTP Verification */}
                {step === "code" && (
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
                                {verifyCodeLoading && <Loader2 className="animate-spin mr-2" />}
                                {verifyCodeLoading ? "Verifying..." : "Verify & Continue"}
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

                {/* Step 3: Terms */}
                {step === "terms" && (
                    <div className="grid gap-6">
                        <Alert>
                            <FileText className="h-4 w-4" />
                            <AlertTitle>Finish setup later</AlertTitle>
                            <AlertDescription>
                                You can create your owner account now. We&apos;ll ask for payout and business details when you set up Stripe.
                            </AlertDescription>
                        </Alert>

                        <div className="border rounded-lg p-4 max-h-48 overflow-y-auto text-sm text-muted-foreground space-y-4">
                            <h3 className="font-semibold text-foreground">Owner Terms of Service</h3>
                            <p>
                                By registering as an owner on Deploy Hub, you agree to the following terms:
                            </p>
                            <ul className="list-disc list-inside space-y-2">
                                <li>You will provide accurate information about yourself and your products.</li>
                                <li>You are responsible for the quality and support of the products you publish.</li>
                                <li>Deploy Hub sells customer licenses and calculates royalties owed to you.</li>
                                <li>You agree to our content guidelines and prohibited items policy.</li>
                                <li>Your account may be reviewed before being fully activated.</li>
                                <li>Deploy Hub reserves the right to suspend accounts that violate terms.</li>
                            </ul>
                            <p>
                                For the complete terms, please visit our{" "}
                                <Link href="/terms" className="text-primary underline">
                                    Terms of Service
                                </Link>
                                {" "}page.
                            </p>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="terms"
                                checked={termsAccepted}
                                onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                                disabled={isLoading}
                            />
                            <label
                                htmlFor="terms"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                I accept the Owner Terms of Service
                            </label>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={handleBack}
                                disabled={isLoading}
                            >
                                Back
                            </Button>
                            <Button
                                type="button"
                                className="flex-1"
                                disabled={isLoading || !termsAccepted}
                                onClick={handleRegister}
                            >
                                {registerLoading && <Loader2 className="animate-spin mr-2" />}
                                {registerLoading ? "Creating account..." : "Create Account"}
                            </Button>
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
