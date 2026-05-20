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
  language: z.enum(["uk", "en"]),
}) satisfies z.ZodType<{
  email: string;
  password: string;
  name: string;
  language: Language;
}>;

export type RegisterValues = z.infer<typeof registerSchema>;
