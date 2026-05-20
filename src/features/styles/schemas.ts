import { z } from "zod";

export const styleFormSchema = z.object({
  name: z.string().min(1).max(60),
  instructions: z.string().min(1).max(2000),
});

export type StyleFormValues = z.infer<typeof styleFormSchema>;
