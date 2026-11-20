import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { fetchModels, streamChat } from '../api/client';
import type { ModelInfo } from '../types';
import { historyFor, initialState, isBusy, reducer, type State } from './reducer';

let turnSeq = 0;
const key = (turnId: string, modelId: string) => `${turnId}:${modelId}`;

/** Owns comparison state and the in-flight requests (one per turn × model). */
export function useCompare() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const stateRef = useRef<State>(state);
  stateRef.current = state;
  const inflight = useRef(new Map<string, AbortController>());

  useEffect(() => {
    fetchModels().then(setModels, (e: Error) => setModelsError(e.message));
  }, []);

  const run = useCallback((turnId: string, modelId: string, question: string, base: State) => {
    const ctrl = new AbortController();
    inflight.current.get(key(turnId, modelId))?.abort();
    inflight.current.set(key(turnId, modelId), ctrl);
    const history = historyFor(base, modelId, turnId);
    void streamChat({ model: modelId, question, history }, (event) => dispatch({ type: 'event', turnId, modelId, event }), ctrl.signal)
      .finally(() => {
        if (inflight.current.get(key(turnId, modelId)) === ctrl) inflight.current.delete(key(turnId, modelId));
      });
  }, []);

  const send = useCallback((question: string) => {
    const base = stateRef.current;
    if (isBusy(base) || base.columns.length < 2) return;
    const turnId = `t${++turnSeq}`;
    dispatch({ type: 'ask', turnId, question, now: Date.now() });
    // all models start at once — requests run in parallel
    for (const modelId of base.columns) run(turnId, modelId, question, base);
  }, [run]);

  const retry = useCallback((turnId: string, modelId: string) => {
    const turn = stateRef.current.turns.find((t) => t.id === turnId);
    if (!turn) return;
    dispatch({ type: 'retry', turnId, modelId, now: Date.now() });
    run(turnId, modelId, turn.question, stateRef.current);
  }, [run]);

  const stop = useCallback(() => {
    inflight.current.forEach((c) => c.abort());
    inflight.current.clear();
    dispatch({ type: 'stopAll' });
  }, []);

  const removeColumn = useCallback((modelId: string) => {
    inflight.current.forEach((c, k) => {
      if (k.endsWith(`:${modelId}`)) { c.abort(); inflight.current.delete(k); }
    });
    dispatch({ type: 'removeColumn', modelId });
  }, []);

  const addColumn = useCallback((modelId: string) => dispatch({ type: 'addColumn', modelId }), []);

  const reset = useCallback(() => {
    inflight.current.forEach((c) => c.abort());
    inflight.current.clear();
    dispatch({ type: 'reset' });
  }, []);

  return { state, models, modelsError, busy: isBusy(state), send, retry, stop, addColumn, removeColumn, reset };
}
