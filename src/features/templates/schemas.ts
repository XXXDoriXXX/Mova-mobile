import { z } from "zod";

export const templateFormSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(280),
  systemPrompt: z.string().max(10_000),
  language: z.enum(["uk", "en"]),
});

export type TemplateFormValues = z.infer<typeof templateFormSchema>;
