import { z } from "zod";

import type { Language } from "@/types/api";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(80),
  // Public handle: hearing users find you by this (or your email) to call you.
  // Mirror of the backend UsernameSchema (3-30, letters/digits/_/., lowercased).
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_.]+$/),
  language: z.enum(["uk", "en"]),
}) satisfies z.ZodType<{
  email: string;
  password: string;
  name: string;
  username: string;
  language: Language;
}>;

export type RegisterValues = z.infer<typeof registerSchema>;
