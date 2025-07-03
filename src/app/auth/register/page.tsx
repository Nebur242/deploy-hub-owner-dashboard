"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form } from "@/components/ui/form";
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert";

import Link from "next/link";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerUser, registerWithGoogle, handleGoogleAuthRedirect } from "@/store/features/auth";
import { useEffect } from "react";
import { z } from "zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { IconBrandGoogle } from "@tabler/icons-react";
import { RegisterDto, registerSchema } from "@/common/dtos";

type FormData = z.infer<typeof registerSchema>;

export default function RegisterForm() {
    const form = useForm();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const {
        register: { loading, error, status },
        googleAuth: { loading: googleLoading, error: googleError, status: googleStatus },
    } = useAppSelector((state) => state.auth);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    const onSubmit = (data: RegisterDto) => {
        dispatch(registerUser(data));
    };

    const handleGoogleRegister = () => {
        dispatch(registerWithGoogle({}));
    };

    // Check for Google OAuth redirect results on component mount
    useEffect(() => {
        dispatch(handleGoogleAuthRedirect({ isRegister: true }));
    }, [dispatch]);

    useEffect(() => {
        if (status === "success") {
            router.push("/auth/verify-email");
        }
    }, [router, status]);

    useEffect(() => {
        if (googleStatus === "success") {
            router.push("/dashboard");
        }
    }, [router, googleStatus]);

    return (
        <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
                <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-2xl font-bold">Create your account</h1>
                    <p className="text-balance text-sm text-muted-foreground">
                        Enter your email below to create your account
                    </p>
                </div>
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            {...register("email")}
                            id="email"
                            type="email"
                            placeholder="m@example.com"
                            disabled={loading}
                            aria-invalid={!!errors.email}
                        />
                        {errors.email && (
                            <p className="text-sm text-red-500">{errors.email.message}</p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center">
                            <Label htmlFor="password">Password</Label>
                        </div>
                        <Input
                            {...register("password")}
                            id="password"
                            type="password"
                            placeholder="6+ characters"
                            disabled={loading}
                            aria-invalid={!!errors.password}
                        />
                        {errors.password && (
                            <p className="text-sm text-red-500">{errors.password.message}</p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                            {...register("confirmPassword")}
                            id="confirmPassword"
                            type="password"
                            placeholder="Re-enter password"
                            disabled={loading}
                            aria-invalid={!!errors.confirmPassword}
                        />
                        {errors.confirmPassword && (
                            <p className="text-sm text-red-500">
                                {errors.confirmPassword.message}
                            </p>
                        )}
                    </div>

                    <Button type="submit" className="w-full" disabled={loading || googleLoading}>
                        {loading && <Loader2 className="animate-spin" />}
                        {loading ? "Creating account..." : "Create Account"}
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Or continue with
                            </span>
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={handleGoogleRegister}
                        disabled={loading || googleLoading}
                    >
                        {googleLoading ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            <IconBrandGoogle className="mr-2 h-4 w-4" />
                        )}
                        {googleLoading ? "Signing up..." : "Sign up with Google"}
                    </Button>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {googleError && googleError !== 'REDIRECT_IN_PROGRESS' && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Google Authentication Error</AlertTitle>
                            <AlertDescription>{googleError}</AlertDescription>
                        </Alert>
                    )}

                    {googleError === 'REDIRECT_IN_PROGRESS' && (
                        <Alert>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <AlertTitle>Redirecting</AlertTitle>
                            <AlertDescription>Redirecting to Google for authentication...</AlertDescription>
                        </Alert>
                    )}
                </div>
                <div className="text-center text-sm">
                    Don&apos;t have an account?{" "}
                    <Link href="/auth/login" className="underline underline-offset-4">
                        Sign in
                    </Link>
                </div>
            </form>
        </Form>
    );
}
