import { describe, expect, it } from 'vitest';
import { decodeShare, encodeShare } from '../src/lib/share';
import { reducer, type State } from '../src/state/reducer';
import { answer, metrics } from './fixtures';

const state: State = {
  columns: ['a', 'b'],
  turns: [{
    id: 't1',
    question: 'Что такое Editor.js?',
    answers: {
      a: answer({ status: 'done', text: 'Блочный редактор', reasoning: 'думаю', metrics: metrics() }),
      b: answer({ status: 'error', error: { code: 'timeout', message: 'x' } }),
    },
  }],
};

describe('share link encoding', () => {
  it('round-trips columns, questions and done answers', async () => {
    const decoded = await decodeShare(await encodeShare(state));
    expect(decoded?.columns).toEqual(['a', 'b']);
    expect(decoded?.turns[0].question).toBe('Что такое Editor.js?');
    expect(decoded?.turns[0].answers.a).toMatchObject({ status: 'done', text: 'Блочный редактор', reasoning: 'думаю', metrics: metrics() });
  });

  it('drops answers that did not finish', async () => {
    const decoded = await decodeShare(await encodeShare(state));
    expect(decoded?.turns[0].answers.b).toBeUndefined();
  });

  it('produces a url-safe string', async () => {
    expect(await encodeShare(state)).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('returns null for garbage', async () => {
    expect(await decodeShare('not-a-valid-payload')).toBeNull();
  });
});

describe('reducer load', () => {
  it('replaces columns and turns', () => {
    const next = reducer({ columns: ['x', 'y', 'z'], turns: [] }, { type: 'load', state });
    expect(next).toEqual(state);
  });
});
