"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loginUser, loginWithGoogle, handleGoogleAuthRedirect } from "@/store/features/auth";

import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { useEffect } from "react";
import { Form } from "@/components/ui/form";
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { IconBrandGoogle } from "@tabler/icons-react";
import { LoginDto, loginSchema } from "@/common/dtos";

type FormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const form = useForm();
    const dispatch = useAppDispatch();
    const {
        login: { loading, error, status },
        googleAuth: { loading: googleLoading, error: googleError, status: googleStatus },
        infos,
    } = useAppSelector((state) => state.auth);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = (data: LoginDto) => {
        dispatch(loginUser(data));
    };

    const handleGoogleLogin = () => {
        dispatch(loginWithGoogle({}));
    };

    // Check for Google OAuth redirect results on component mount
    useEffect(() => {
        dispatch(handleGoogleAuthRedirect({ isRegister: false }));
    }, [dispatch]);

    useEffect(() => {
        if (status === "success" || googleStatus === "success") {
            // Check if user's email is verified, if not redirect to verification page
            if (infos?.firebase?.emailVerified === false) {
                router.push("/auth/verify-email");
            } else {
                router.push("/dashboard");
            }
        }
    }, [router, status, googleStatus, infos]);

    return (
        <Form {...form}>
            <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
                <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-2xl font-bold">Login to your account</h1>
                    <p className="text-balance text-sm text-muted-foreground">
                        Enter your email below to login to your account
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
                            <Link
                                href="/auth/forgot-password"
                                className="ml-auto text-sm underline-offset-4 hover:underline"
                            >
                                Forgot your password?
                            </Link>
                        </div>
                        <Input
                            {...register("password")}
                            id="password"
                            type="password"
                            placeholder="********"
                            disabled={loading}
                            aria-invalid={!!errors.password}
                        />
                        {errors.password && (
                            <p className="text-sm text-red-500">{errors.password.message}</p>
                        )}
                    </div>
                    <Button type="submit" className="w-full" disabled={loading || googleLoading}>
                        {loading && <Loader2 className="animate-spin" />}
                        {loading ? "Login..." : "Login"}
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
                        onClick={handleGoogleLogin}
                        className="w-full"
                        disabled={loading || googleLoading}
                    >
                        {googleLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <IconBrandGoogle className="mr-2 h-4 w-4" />
                        )}
                        {googleLoading ? "Signing in..." : "Continue with Google"}
                    </Button>

                    {(error || (googleError && googleError !== 'REDIRECT_IN_PROGRESS')) && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error || googleError}</AlertDescription>
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
                    <Link href="/auth/register" className="underline underline-offset-4">
                        Sign up
                    </Link>
                </div>
            </form>
        </Form>
    );
}
