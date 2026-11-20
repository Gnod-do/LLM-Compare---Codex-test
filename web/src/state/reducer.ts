import type { ChatEvent, ErrorCode, HistoryItem, Metrics } from '../types';

export type AnswerStatus = 'waiting' | 'thinking' | 'typing' | 'done' | 'error' | 'stopped';
export type Answer = {
  status: AnswerStatus;
  reasoning: string;
  text: string;
  metrics: Metrics | null;
  error: { code: ErrorCode; message: string } | null;
  startedAt: number;
};
export type Turn = { id: string; question: string; answers: Record<string, Answer> };
export type State = { columns: string[]; turns: Turn[] };

export type Action =
  | { type: 'addColumn'; modelId: string }
  | { type: 'removeColumn'; modelId: string }
  | { type: 'ask'; turnId: string; question: string; now: number }
  | { type: 'retry'; turnId: string; modelId: string; now: number }
  | { type: 'event'; turnId: string; modelId: string; event: ChatEvent }
  | { type: 'stopAll' }
  | { type: 'reset' };

export const MIN_COLUMNS = 2;
export const MAX_COLUMNS = 4;

export const initialState: State = {
  columns: ['anthropic/claude-haiku-5.5', 'deepseek/deepseek-v4-flash', 'openai/gpt-5-mini'],
  turns: [],
};

const fresh = (now: number): Answer => ({ status: 'waiting', reasoning: '', text: '', metrics: null, error: null, startedAt: now });
const isLive = (a: Answer) => a.status === 'waiting' || a.status === 'thinking' || a.status === 'typing';

function updateAnswer(state: State, turnId: string, modelId: string, fn: (a: Answer) => Answer | null): State {
  let changed = false;
  const turns = state.turns.map((t) => {
    if (t.id !== turnId || !t.answers[modelId]) return t;
    const next = fn(t.answers[modelId]);
    if (!next) return t;
    changed = true;
    return { ...t, answers: { ...t.answers, [modelId]: next } };
  });
  return changed ? { ...state, turns } : state;
}

function applyEvent(a: Answer, e: ChatEvent): Answer | null {
  if (!isLive(a)) return null;
  switch (e.type) {
    case 'reasoning': return { ...a, status: 'thinking', reasoning: a.reasoning + e.delta };
    case 'text': return { ...a, status: 'typing', text: a.text + e.delta };
    case 'done': return { ...a, status: 'done', metrics: e.metrics };
    case 'error': return { ...a, status: 'error', error: e.error };
  }
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'addColumn':
      if (state.columns.length >= MAX_COLUMNS || state.columns.includes(action.modelId)) return state;
      return { ...state, columns: [...state.columns, action.modelId] };
    case 'removeColumn': {
      if (state.columns.length <= MIN_COLUMNS || !state.columns.includes(action.modelId)) return state;
      return {
        columns: state.columns.filter((c) => c !== action.modelId),
        turns: state.turns.map((t) => {
          const { [action.modelId]: _removed, ...answers } = t.answers;
          return { ...t, answers };
        }),
      };
    }
    case 'ask':
      return {
        ...state,
        turns: [...state.turns, { id: action.turnId, question: action.question, answers: Object.fromEntries(state.columns.map((c) => [c, fresh(action.now)])) }],
      };
    case 'retry':
      return updateAnswer(state, action.turnId, action.modelId, () => fresh(action.now));
    case 'event':
      return updateAnswer(state, action.turnId, action.modelId, (a) => applyEvent(a, action.event));
    case 'stopAll':
      if (!isBusy(state)) return state;
      return {
        ...state,
        turns: state.turns.map((t) => ({
          ...t,
          answers: Object.fromEntries(Object.entries(t.answers).map(([id, a]) => [id, isLive(a) ? { ...a, status: 'stopped' as const } : a])),
        })),
      };
    case 'reset':
      return { ...state, turns: [] };
  }
}

export function isBusy(state: State): boolean {
  return state.turns.some((t) => Object.values(t.answers).some(isLive));
}

/** Completed Q/A pairs of one model before `beforeTurnId` (all turns when omitted). */
export function historyFor(state: State, modelId: string, beforeTurnId?: string): HistoryItem[] {
  const out: HistoryItem[] = [];
  for (const t of state.turns) {
    if (t.id === beforeTurnId) break;
    const a = t.answers[modelId];
    if (a?.status === 'done') out.push({ question: t.question, answer: a.text });
  }
  return out;
}

function minBy(entries: [string, number][]): string | undefined {
  if (entries.length < 2) return undefined;
  return entries.reduce((best, cur) => (cur[1] < best[1] ? cur : best))[0];
}

export function winners(turn: Turn): { fastest?: string; cheapest?: string } {
  const done = Object.entries(turn.answers).filter(([, a]) => a.status === 'done' && a.metrics);
  const fastest = minBy(done.map(([id, a]) => [id, a.metrics!.totalMs]));
  const cheapest = minBy(done.filter(([, a]) => a.metrics!.costUsd != null).map(([id, a]) => [id, a.metrics!.costUsd!]));
  const out: { fastest?: string; cheapest?: string } = {};
  if (fastest) out.fastest = fastest;
  if (cheapest) out.cheapest = cheapest;
  return out;
}
