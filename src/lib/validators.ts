import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().trim().min(2, "Enter your email or username"),
  password: z.string().min(8, "At least 8 characters"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const contactSchema = z.object({
  fullName: z.string().trim().min(2, "Required").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  subject: z.enum(["General", "Account", "Support", "Complaint"]),
  message: z.string().trim().min(20, "At least 20 characters").max(2000),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const registerStep1 = z.object({
  firstName: z.string().trim().min(2, "Required").max(50),
  lastName: z.string().trim().min(2, "Required").max(50),
  middleName: z.string().trim().max(50).optional().or(z.literal("")),
  username: z.string().trim().regex(/^[a-zA-Z0-9_]{3,20}$/, "3–20 letters, numbers, underscore"),
});
export const registerStep2 = z.object({
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().regex(/^\+?[1-9]\d{6,14}$/, "Use international format e.g. +14155551234"),
  country: z.string().min(2, "Required"),
});
export const registerStep3 = z.object({
  currency: z.string().min(2),
  accountType: z.enum(["Checking Account", "Savings Account", "Fixed Deposit", "Current Account", "Business Account", "Investment Account"]),
});
export const registerStep4 = z.object({
  password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, "Need an uppercase letter")
    .regex(/[0-9]/, "Need a number")
    .regex(/[^A-Za-z0-9]/, "Need a special character"),
  confirmPassword: z.string(),
  termsAccepted: z.literal(true, { message: "You must accept the terms" } as never),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type RegisterFull = z.infer<typeof registerStep1> &
  z.infer<typeof registerStep2> &
  z.infer<typeof registerStep3> &
  z.infer<typeof registerStep4>;
