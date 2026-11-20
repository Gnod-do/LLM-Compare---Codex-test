import { describe, expect, it } from 'vitest';
import { buildPrompt } from '../src/prompt.js';

const HEAD = 'Ниже история диалога. Ответь на последний вопрос пользователя.';

describe('buildPrompt', () => {
  it('returns the question alone without history', () => {
    expect(buildPrompt([], 'Q')).toBe('Q');
  });
  it('formats history', () => {
    expect(buildPrompt([{ question: 'q1', answer: 'a1' }], 'q2')).toBe(
      `${HEAD}\n\nПользователь: q1\nАссистент: a1\n\nПользователь: q2`);
  });
  it('keeps only the last 6 turns', () => {
    const history = Array.from({ length: 10 }, (_, i) => ({ question: `q${i}`, answer: `a${i}` }));
    const p = buildPrompt(history, 'now');
    expect(p).not.toContain('q3\n');
    expect(p).toContain('Пользователь: q4\n');
    expect(p).toContain('Пользователь: q9\n');
  });
  it('drops oldest turns beyond 12000 chars', () => {
    const p = buildPrompt([{ question: 'old', answer: 'x'.repeat(13000) }, { question: 'q2', answer: 'a2' }], 'now');
    expect(p).not.toContain('old');
    expect(p).toContain('Пользователь: q2');
    expect(p.endsWith('Пользователь: now')).toBe(true);
  });
});
