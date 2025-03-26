"use client";

import AuthLayout from "@/components/auth-layout";

export default function AuthLayoutPage({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthLayout>{children}</AuthLayout>;
}
