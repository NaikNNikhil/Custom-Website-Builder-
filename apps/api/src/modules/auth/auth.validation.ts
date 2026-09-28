import { z } from "zod";

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const signupSchema = z.object({
  email: z
    .string()
    .trim()
    .transform((email) => email.toLowerCase())
    .pipe(z.string().email("Invalid email address")),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .refine((value) => /[A-Z]/.test(value), {
      message: "Password must contain at least 1 uppercase letter",
    })
    .refine((value) => /[a-z]/.test(value), {
      message: "Password must contain at least 1 lowercase letter",
    })
    .refine((value) => /\d/.test(value), {
      message: "Password must contain at least 1 number",
    }),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .transform((email) => email.toLowerCase())
    .pipe(z.string().email("Invalid email address")),
  password: z.string().min(1, "Password is required"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;