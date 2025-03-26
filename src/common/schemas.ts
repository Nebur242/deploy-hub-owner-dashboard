import { z } from "zod";

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email format")
      .refine((email) => email.toLowerCase() === email, {
        message: "Email must be lowercase",
      }),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(100, "Password must not exceed 100 characters"),
    //   .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    //   .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    //   .regex(/[0-9]/, "Password must contain at least one number")
    //   .regex(
    //     /[^A-Za-z0-9]/,
    //     "Password must contain at least one special character",
    //   ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  });

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
