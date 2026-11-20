import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { nextReveal, useTypewriter } from '../src/lib/typewriter';

describe('nextReveal', () => {
  it('reveals one whole word at a time when the backlog is small', () => {
    expect(nextReveal(0, 'Hello big world', false)).toBe(6);   // "Hello "
    expect(nextReveal(6, 'Hello big world', false)).toBe(10);  // "big "
    expect(nextReveal(10, 'Hello big world', false)).toBe(15); // "world"
  });

  it('reveals more words per tick when far behind', () => {
    const text = Array.from({ length: 80 }, (_, i) => `w${i}`).join(' ');
    const step = nextReveal(0, text, false);
    expect(text.slice(0, step).trim().split(' ').length).toBeGreaterThan(1);
  });

  it('catches up within a few ticks when finishing', () => {
    const text = Array.from({ length: 200 }, (_, i) => `w${i}`).join(' ');
    let shown = 0;
    for (let i = 0; i < 10; i++) shown = nextReveal(shown, text, true);
    expect(shown).toBe(text.length);
  });

  it('never goes past the end', () => {
    expect(nextReveal(5, 'Hello', false)).toBe(5);
  });
});

describe('useTypewriter', () => {
  it('shows full text immediately when not streaming', () => {
    const { result } = renderHook(() => useTypewriter('Done text', false));
    expect(result.current).toBe('Done text');
  });

  it('reveals streamed text gradually', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ t, a }) => useTypewriter(t, a), { initialProps: { t: '', a: true } });
    rerender({ t: 'one two three', a: true });
    expect(result.current).toBe('');
    act(() => { vi.advanceTimersByTime(35); });
    expect(result.current).toBe('one ');
    act(() => { vi.advanceTimersByTime(1000); });
    expect(result.current).toBe('one two three');
    vi.useRealTimers();
  });
});
