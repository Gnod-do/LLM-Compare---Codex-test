import { describe, expect, it } from 'vitest';
import { historyFor, initialState, isBusy, reducer, winners, type State } from '../src/state/reducer';
import type { Metrics } from '../src/types';

const base: State = { columns: ['a', 'b', 'c'], turns: [] };
const asked = reducer(base, { type: 'ask', turnId: 't1', question: 'Q', now: 0 });
const m = (totalMs: number, costUsd: number | null): Metrics =>
  ({ ttftMs: 100, totalMs, reasoningMs: null, inputTokens: 1, outputTokens: 1, costUsd });

describe('reducer', () => {
  it('initialState has default columns', () => {
    expect(initialState.columns).toEqual(['anthropic/claude-haiku-5.5', 'deepseek/deepseek-v4-flash', 'openai/gpt-5-mini']);
  });

  it('ask creates waiting answers for every column', () => {
    expect(asked.turns).toHaveLength(1);
    expect(Object.keys(asked.turns[0].answers)).toEqual(['a', 'b', 'c']);
    expect(asked.turns[0].answers.a.status).toBe('waiting');
    expect(isBusy(asked)).toBe(true);
  });

  it('reasoning then text events set statuses', () => {
    let s = reducer(asked, { type: 'event', turnId: 't1', modelId: 'a', event: { type: 'reasoning', delta: 'hm' } });
    expect(s.turns[0].answers.a.status).toBe('thinking');
    s = reducer(s, { type: 'event', turnId: 't1', modelId: 'a', event: { type: 'text', delta: 'He' } });
    s = reducer(s, { type: 'event', turnId: 't1', modelId: 'a', event: { type: 'text', delta: 'llo' } });
    expect(s.turns[0].answers.a).toMatchObject({ status: 'typing', reasoning: 'hm', text: 'Hello' });
  });

  it('error in one column leaves others untouched', () => {
    let s = reducer(asked, { type: 'event', turnId: 't1', modelId: 'a', event: { type: 'error', error: { code: 'timeout', message: 'x' } } });
    s = reducer(s, { type: 'event', turnId: 't1', modelId: 'b', event: { type: 'text', delta: 'ok' } });
    expect(s.turns[0].answers.a.status).toBe('error');
    expect(s.turns[0].answers.b).toMatchObject({ status: 'typing', text: 'ok' });
    expect(s.turns[0].answers.c.status).toBe('waiting');
  });

  it('done stores metrics', () => {
    const s = reducer(asked, { type: 'event', turnId: 't1', modelId: 'a', event: { type: 'done', metrics: m(10, 1) } });
    expect(s.turns[0].answers.a).toMatchObject({ status: 'done', metrics: m(10, 1) });
  });

  it('retry resets only that answer', () => {
    let s = reducer(asked, { type: 'event', turnId: 't1', modelId: 'a', event: { type: 'error', error: { code: 'timeout', message: 'x' } } });
    s = reducer(s, { type: 'event', turnId: 't1', modelId: 'b', event: { type: 'text', delta: 'ok' } });
    s = reducer(s, { type: 'retry', turnId: 't1', modelId: 'a', now: 5 });
    expect(s.turns[0].answers.a).toMatchObject({ status: 'waiting', text: '', error: null, startedAt: 5 });
    expect(s.turns[0].answers.b.text).toBe('ok');
  });

  it('stopAll marks unfinished answers stopped and keeps text', () => {
    let s = reducer(asked, { type: 'event', turnId: 't1', modelId: 'a', event: { type: 'text', delta: 'part' } });
    s = reducer(s, { type: 'event', turnId: 't1', modelId: 'b', event: { type: 'done', metrics: m(1, 1) } });
    s = reducer(s, { type: 'stopAll' });
    expect(s.turns[0].answers.a).toMatchObject({ status: 'stopped', text: 'part' });
    expect(s.turns[0].answers.b.status).toBe('done');
    expect(isBusy(s)).toBe(false);
    s = reducer(s, { type: 'event', turnId: 't1', modelId: 'a', event: { type: 'text', delta: 'late' } });
    expect(s.turns[0].answers.a.text).toBe('part');
  });

  it('ignores events for removed column', () => {
    let s = reducer(asked, { type: 'removeColumn', modelId: 'c' });
    expect(s.columns).toEqual(['a', 'b']);
    s = reducer(s, { type: 'event', turnId: 't1', modelId: 'c', event: { type: 'text', delta: 'x' } });
    expect(s.turns[0].answers.c).toBeUndefined();
  });

  it('addColumn refuses a 5th column and duplicates', () => {
    let s = reducer(base, { type: 'addColumn', modelId: 'a' });
    expect(s.columns).toEqual(['a', 'b', 'c']);
    s = reducer(s, { type: 'addColumn', modelId: 'd' });
    s = reducer(s, { type: 'addColumn', modelId: 'e' });
    expect(s.columns).toEqual(['a', 'b', 'c', 'd']);
  });

  it('removeColumn refuses below 2', () => {
    let s = reducer(base, { type: 'removeColumn', modelId: 'a' });
    s = reducer(s, { type: 'removeColumn', modelId: 'b' });
    expect(s.columns).toEqual(['b', 'c']);
  });

  it('reset clears turns and keeps columns', () => {
    const s = reducer(asked, { type: 'reset' });
    expect(s).toEqual({ columns: ['a', 'b', 'c'], turns: [] });
  });

  it('historyFor returns only done answers of that model', () => {
    let s = reducer(asked, { type: 'event', turnId: 't1', modelId: 'a', event: { type: 'text', delta: 'A1' } });
    s = reducer(s, { type: 'event', turnId: 't1', modelId: 'a', event: { type: 'done', metrics: m(1, 1) } });
    s = reducer(s, { type: 'ask', turnId: 't2', question: 'Q2', now: 1 });
    expect(historyFor(s, 'a', 't2')).toEqual([{ question: 'Q', answer: 'A1' }]);
    expect(historyFor(s, 'b', 't2')).toEqual([]);
  });

  it('winners picks min totalMs and min costUsd', () => {
    let s = asked;
    s = reducer(s, { type: 'event', turnId: 't1', modelId: 'a', event: { type: 'done', metrics: m(2100, 0.0021) } });
    expect(winners(s.turns[0])).toEqual({});
    s = reducer(s, { type: 'event', turnId: 't1', modelId: 'b', event: { type: 'done', metrics: m(1400, 0.0009) } });
    s = reducer(s, { type: 'event', turnId: 't1', modelId: 'c', event: { type: 'done', metrics: m(3400, 0.0011) } });
    expect(winners(s.turns[0])).toEqual({ fastest: 'b', cheapest: 'b' });
  });
});
