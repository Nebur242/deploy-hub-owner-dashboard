"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPassword } from "@/store/features/auth";
import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";



const schema = z.object({
    email: z.string().email('Invalid email address'),
});

export default function ForgotPasswordPage() {

    const router = useRouter();

    const dispatch = useAppDispatch();

    const {
        reset: { loading, error, status },
    } = useAppSelector((state) => state.auth);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<{ email: string }>({
        resolver: zodResolver(schema),
    });

    const onSubmit = (data: { email: string }) => {
        console.log(data);
        dispatch(
            resetPassword({
                ...data,
                onSuccess: () => router.push('/auth/login'),
            })
        );
    };

    useEffect(() => {
        if (status === "success") {
            router.push("/auth/login");
        }
    }, [router, status]);

    return (
        <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Reset password</h1>
                <p className="text-balance text-sm text-muted-foreground">
                    Enter your email below to reset your password
                </p>
            </div>
            <div className="grid gap-6">
                <div className="grid gap-2">
                    <Input id="email"
                        {...register('email')}
                        type="email" placeholder="m@example.com"
                        disabled={loading}
                        aria-invalid={!!errors.email}
                    />
                    {errors.email && (
                        <p className="text-sm text-red-500">{errors.email.message}</p>
                    )}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="animate-spin" />}
                    {loading ? "Loading..." : "Send reset link"}
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
                Already have an account?{" "}
                <Link href="/auth/login" className="underline underline-offset-4">
                    Sign in
                </Link>
            </div>
        </form>
    );
}
