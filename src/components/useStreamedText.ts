import { useEffect, useMemo, useRef, useState } from "react";

// How fast the on-screen text catches up to the (bursty) source. Production chat
// UIs (ChatGPT, Claude) decouple the network from the render: buffer the target
// and advance toward it at a steady, readable cadence instead of painting every
// chunk. We reveal word-by-word on a fixed clock, speeding up only when a lot is
// buffered so the text never lags far behind the speaker.
const TICK_MS = 28;
const CATCHUP_DIVISOR = 6;

/**
 * Pure step function: given how many words are shown and the total available,
 * return the next shown-count. Reveals one word per tick normally, more when a
 * backlog builds, and never overshoots. Extracted so it can be unit-tested.
 */
export function nextRevealCount(shown: number, total: number): number {
  if (shown >= total) return total;
  const step = Math.max(1, Math.ceil((total - shown) / CATCHUP_DIVISOR));
  return Math.min(total, shown + step);
}

export type StreamedText = {
  /** Words already fully settled (rendered as plain, static text). */
  head: string;
  /** The single newest word, animated in (fade + light focus-in). */
  tail: string;
  /** Stable key for the tail — changes each time a new word is revealed. */
  tailKey: number;
  /** True while still catching up to the target (show a live cursor/dots). */
  streaming: boolean;
};

/**
 * Reveals `target` word-by-word at a steady cadence, independent of how the
 * backend chunked it. As `target` grows (streamed STT / appended turn segments)
 * the reveal keeps catching up; if it shrinks (an interim revision) it clamps.
 */
export function useStreamedText(target: string): StreamedText {
  const words = useMemo(
    () => (target.trim() ? target.trim().split(/\s+/) : []),
    [target],
  );
  const total = words.length;

  const [shown, setShown] = useState(0);
  const shownRef = useRef(0);
  shownRef.current = shown;
  const totalRef = useRef(total);
  totalRef.current = total;

  // Interim revisions can make the text shorter — never show stale words.
  useEffect(() => {
    if (shownRef.current > total) setShown(total);
  }, [total]);

  // One self-clearing clock per bubble; re-armed whenever new words arrive.
  useEffect(() => {
    if (shownRef.current >= totalRef.current) return;
    const id = setInterval(() => {
      const next = nextRevealCount(shownRef.current, totalRef.current);
      shownRef.current = next;
      setShown(next);
      if (next >= totalRef.current) clearInterval(id);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [total]);

  const visible = Math.min(shown, total);
  const shownWords = words.slice(0, visible);
  const headWords = shownWords.slice(0, -1);
  const tail = shownWords.length ? (shownWords[shownWords.length - 1] ?? "") : "";

  return {
    head: headWords.length ? `${headWords.join(" ")} ` : "",
    tail,
    tailKey: visible,
    streaming: visible < total,
  };
}
