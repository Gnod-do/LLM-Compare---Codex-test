import { useEffect, useRef, useState } from 'react';

export const TICK_MS = 30;
const WORD = /\s*\S+\s*/y;

function countWords(s: string): number {
  return s.match(/\S+/g)?.length ?? 0;
}

/**
 * Next reveal position (always on a word boundary). Streams reveal ~1 word per tick and speed up
 * when the backlog grows; when the model has finished, the rest catches up within a few ticks.
 */
export function nextReveal(shown: number, text: string, finishing: boolean): number {
  if (shown >= text.length) return text.length;
  const backlog = countWords(text.slice(shown));
  let words = finishing ? Math.max(8, Math.ceil(backlog / 3)) : 1 + Math.floor(backlog / 12);
  let pos = shown;
  while (words-- > 0 && pos < text.length) {
    WORD.lastIndex = pos;
    const m = WORD.exec(text);
    if (!m) return text.length;
    pos = WORD.lastIndex;
  }
  return pos;
}

/** Text revealed word by word while `active` (streaming); full text at once when mounted idle. */
export function useTypewriter(text: string, active: boolean): string {
  const [shown, setShown] = useState(() => (active ? 0 : text.length));
  const textRef = useRef(text);
  const activeRef = useRef(active);
  textRef.current = text;
  activeRef.current = active;

  // text replaced by a shorter one (retry): restart from its current length
  useEffect(() => {
    if (shown > text.length) setShown(active ? 0 : text.length);
  }, [text, shown, active]);

  const visible = Math.min(shown, text.length);
  const behind = visible < text.length;
  useEffect(() => {
    if (!behind) return;
    const id = setInterval(() => {
      setShown((s) => {
        const t = textRef.current;
        return nextReveal(Math.min(s, t.length), t, !activeRef.current);
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, [behind]);

  return text.slice(0, visible);
}
