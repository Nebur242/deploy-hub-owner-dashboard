"use client";
import { LoginUserDto } from "@/common/type";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loginUser } from "@/store/features/auth";
import { loginSchema } from "@/common/schemas";

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

type FormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const form = useForm();
    const dispatch = useAppDispatch();
    const {
        login: { loading, error, status },
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

    const onSubmit = (data: LoginUserDto) => {
        dispatch(loginUser(data));
    };

    useEffect(() => {
        if (status === "success") {
            router.push("/dashboard");
        }
    }, [router, status]);

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
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="animate-spin" />}
                        {loading ? "Login..." : "Login"}
                    </Button>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
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
