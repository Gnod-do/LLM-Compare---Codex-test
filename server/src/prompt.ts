import type { HistoryItem } from './types.js';

const MAX_TURNS = 6;
const MAX_CHARS = 12_000;
const HEADER = 'Ниже история диалога. Ответь на последний вопрос пользователя.';

const turnText = (h: HistoryItem) => `Пользователь: ${h.question}\nАссистент: ${h.answer}`;

/**
 * ai-proxy accepts a single prompt string, so earlier turns are inlined as a transcript.
 * Keeps the last MAX_TURNS turns and drops the oldest until the history fits MAX_CHARS.
 */
export function buildPrompt(history: HistoryItem[], question: string): string {
  const turns = history.slice(-MAX_TURNS).map(turnText);
  while (turns.length && turns.join('\n\n').length > MAX_CHARS) turns.shift();
  if (!turns.length) return question;
  return `${HEADER}\n\n${turns.join('\n\n')}\n\nПользователь: ${question}`;
}
