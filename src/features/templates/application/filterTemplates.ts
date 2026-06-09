import type { Template } from "@/types/api";

export type TemplateFilter = "all" | "mine" | "system";

export function filterTemplates(items: Template[], filter: TemplateFilter): Template[] {
  switch (filter) {
    case "mine":
      return items.filter((t) => !t.isSystem);
    case "system":
      return items.filter((t) => t.isSystem);
    case "all":
      return items;
  }
}

export function describeTemplateSubtitle(
  t: Template,
  badges: { system: string; default: string },
): string {
  const parts: string[] = [];
  if (t.isSystem) parts.push(badges.system);
  if (t.isDefault) parts.push(badges.default);
  if (t.description) parts.push(t.description.slice(0, 80));
  return parts.filter(Boolean).join(" · ");
}
