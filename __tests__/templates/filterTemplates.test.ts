import {
  describeTemplateSubtitle,
  filterTemplates,
} from "@/features/templates/application/filterTemplates";
import type { Template } from "@/types/api";

const make = (overrides: Partial<Template>): Template =>
  ({
    id: "t",
    name: "T",
    description: "",
    systemPrompt: "p",
    language: "uk",
    isSystem: false,
    isDefault: false,
    ownerId: null,
    createdAt: "",
    updatedAt: "",
    ...overrides,
  }) as Template;

describe("filterTemplates", () => {
  const items = [
    make({ id: "1", isSystem: true }),
    make({ id: "2", isSystem: false }),
    make({ id: "3", isSystem: true, isDefault: true }),
    make({ id: "4", isSystem: false }),
  ];

  it("all returns the full list", () => {
    expect(filterTemplates(items, "all")).toHaveLength(4);
  });

  it("mine returns non-system only", () => {
    expect(filterTemplates(items, "mine").map((t) => t.id)).toEqual(["2", "4"]);
  });

  it("system returns system only", () => {
    expect(filterTemplates(items, "system").map((t) => t.id)).toEqual(["1", "3"]);
  });
});

describe("describeTemplateSubtitle", () => {
  const labels = { system: "System", default: "Default" };

  it("joins badges and description with bullets", () => {
    expect(
      describeTemplateSubtitle(
        make({ isSystem: true, isDefault: true, description: "Hello" }),
        labels,
      ),
    ).toBe("System · Default · Hello");
  });

  it("trims description to 80 chars", () => {
    const long = "x".repeat(120);
    const out = describeTemplateSubtitle(
      make({ description: long }),
      labels,
    );
    expect(out.length).toBeLessThanOrEqual(80);
  });

  it("skips empty description silently", () => {
    expect(
      describeTemplateSubtitle(make({ isSystem: true }), labels),
    ).toBe("System");
  });
});
