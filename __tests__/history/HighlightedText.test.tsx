import { render } from "@testing-library/react-native";

import { HighlightedText } from "@/features/history/HighlightedText";
import { ThemeProvider } from "@/theme/ThemeProvider";

function renderWith(html: string) {
  return render(
    <ThemeProvider>
      <HighlightedText html={html} />
    </ThemeProvider>,
  );
}

function flatText(html: string): string {
  return JSON.stringify(renderWith(html).toJSON());
}

describe("HighlightedText", () => {
  it("renders plain text when no <mark> markers exist", () => {
    const { getByText } = renderWith("Звичайний текст без підсвітки");
    expect(getByText("Звичайний текст без підсвітки")).toBeTruthy();
  });

  it("renders the highlighted segment as its own Text node", () => {
    const { getByText } = renderWith("Добрий <mark>день</mark>, доктор");
    expect(getByText("день")).toBeTruthy();
  });

  it("preserves the surrounding text around a highlight", () => {
    const json = flatText("Добрий <mark>день</mark>, доктор");
    expect(json).toContain("Добрий ");
    expect(json).toContain("день");
    expect(json).toContain(", доктор");
  });

  it("handles multiple highlights in one snippet", () => {
    const { getByText } = renderWith(
      "<mark>записатись</mark> на <mark>прийом</mark>",
    );
    expect(getByText("записатись")).toBeTruthy();
    expect(getByText("прийом")).toBeTruthy();
  });

  it("decodes HTML entities produced by ts_headline", () => {
    const json = flatText("ціна &lt; 100 &amp; знижка");
    expect(json).toContain("ціна < 100 & знижка");
  });

  it("does not crash on a stray opening tag", () => {
    const json = flatText("<mark>незакритий");
    expect(json).toContain("<mark>незакритий");
  });
});
