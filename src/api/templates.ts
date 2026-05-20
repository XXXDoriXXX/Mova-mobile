import { apiClient } from "./client";
import type { Language, Template } from "@/types/api";

export async function listTemplates(): Promise<Template[]> {
  const { data } = await apiClient.get<{ items: Template[] }>("/templates");
  return data.items;
}

export async function getTemplate(id: string): Promise<Template> {
  const { data } = await apiClient.get<Template>(`/templates/${id}`);
  return data;
}

export type CreateTemplateInput = {
  name: string;
  description: string;
  systemPrompt: string;
  language: Language;
  defaultVoice?: string;
  defaultLlmProvider?: string;
  defaultLlmModel?: string;
  defaultTtsProvider?: string;
};

export async function createTemplate(
  input: CreateTemplateInput,
): Promise<Template> {
  const { data } = await apiClient.post<Template>("/templates", input);
  return data;
}

export async function updateTemplate(
  id: string,
  patch: Partial<CreateTemplateInput>,
): Promise<Template> {
  const { data } = await apiClient.patch<Template>(`/templates/${id}`, patch);
  return data;
}

export async function deleteTemplate(id: string): Promise<void> {
  await apiClient.delete(`/templates/${id}`);
}

export async function duplicateTemplate(id: string): Promise<Template> {
  const { data } = await apiClient.post<Template>(
    `/templates/${id}/duplicate`,
  );
  return data;
}

export async function setDefaultTemplate(id: string): Promise<void> {
  await apiClient.patch(`/templates/${id}/default`);
}

export async function setTemplateDefaultStyle(
  id: string,
  styleId: string | null,
): Promise<Template> {
  const { data } = await apiClient.patch<Template>(
    `/templates/${id}/default-style`,
    { styleId },
  );
  return data;
}
