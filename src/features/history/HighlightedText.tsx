import { Fragment } from "react";

import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  html: string;
  numberOfLines?: number;
};

type Segment = { kind: "text" | "mark"; value: string };

const TOKEN = /<mark>(.*?)<\/mark>/g;

function tokenize(html: string): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;
  for (const match of html.matchAll(TOKEN)) {
    const start = match.index ?? 0;
    if (start > cursor) {
      segments.push({ kind: "text", value: html.slice(cursor, start) });
    }
    segments.push({ kind: "mark", value: match[1] ?? "" });
    cursor = start + match[0].length;
  }
  if (cursor < html.length) {
    segments.push({ kind: "text", value: html.slice(cursor) });
  }
  return segments;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function HighlightedText({ html, numberOfLines }: Props) {
  const theme = useTheme();
  const segments = tokenize(html);
  return (
    <Text variant="body" color="text" numberOfLines={numberOfLines}>
      {segments.map((seg, idx) => (
        <Fragment key={idx}>
          {seg.kind === "mark" ? (
            <Text
              variant="body"
              weight="bold"
              style={{
                backgroundColor: theme.colors.surfaceAccent,
                color: theme.colors.text,
              }}
            >
              {decodeEntities(seg.value)}
            </Text>
          ) : (
            decodeEntities(seg.value)
          )}
        </Fragment>
      ))}
    </Text>
  );
}
