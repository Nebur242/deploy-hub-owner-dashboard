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

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// OTP flow schemas
export const emailOnlySchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
});

export const verifyCodeSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().length(6, "Code must be 6 digits"),
  purpose: z.enum(["login", "register"]),
});

export const profileSchema = z.object({
  first_name: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name too long"),
  last_name: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name too long"),
});

export const businessInfoSchema = z.object({
  company_name: z.string().max(100, "Company name too long").optional(),
  developer_type: z.enum(["individual", "company", "agency"]),
  country: z
    .string()
    .min(1, "Country is required")
    .max(100, "Country name too long"),
  website_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  github_url: z
    .string()
    .min(1, "GitHub profile is required")
    .url("Invalid GitHub URL"),
});

export const termsSchema = z.object({
  terms_accepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms of service",
  }),
});

// Combined owner registration schema (for validation)
export const registerOwnerSchema = z.object({
  email: z.string().email("Invalid email address"),
  verification_token: z.string().min(1, "Verification token is required"),
  first_name: z.string().min(1, "First name is required").max(50),
  last_name: z.string().min(1, "Last name is required").max(50),
  company_name: z.string().max(100).optional(),
  developer_type: z.enum(["individual", "company", "agency"]),
  country: z.string().min(1, "Country is required"),
  website_url: z.string().url().optional().or(z.literal("")),
  github_url: z
    .string()
    .min(1, "GitHub profile is required")
    .url("Invalid GitHub URL"),
  terms_accepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms of service",
  }),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;
export type EmailOnlyDto = z.infer<typeof emailOnlySchema>;
export type VerifyCodeDto = z.infer<typeof verifyCodeSchema>;
export type ProfileDto = z.infer<typeof profileSchema>;
export type BusinessInfoDto = z.infer<typeof businessInfoSchema>;
export type TermsDto = z.infer<typeof termsSchema>;
export type RegisterOwnerDto = z.infer<typeof registerOwnerSchema>;
