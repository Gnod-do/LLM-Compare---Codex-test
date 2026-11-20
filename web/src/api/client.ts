import type { ChatEvent, HistoryItem, ModelInfo } from '../types';

export async function fetchModels(): Promise<ModelInfo[]> {
  const res = await fetch('/api/models');
  if (!res.ok) throw new Error(await errorText(res));
  return ((await res.json()) as { models: ModelInfo[] }).models;
}

export type ChatRequest = { model: string; question: string; history: HistoryItem[] };

/** POSTs one model's question and forwards every NDJSON event; never throws. */
export async function streamChat(req: ChatRequest, onEvent: (e: ChatEvent) => void, signal: AbortSignal): Promise<void> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal,
    });
    if (!res.ok || !res.body) {
      onEvent({ type: 'error', error: { code: 'bad_request', message: await errorText(res) } });
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finished = false;
    const emit = (e: ChatEvent) => {
      if (e.type === 'done' || e.type === 'error') finished = true;
      onEvent(e);
    };
    const flush = (final: boolean) => {
      const lines = buffer.split('\n');
      buffer = final ? '' : lines.pop()!;
      for (const line of lines) if (line.trim()) emit(JSON.parse(line) as ChatEvent);
    };
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      flush(false);
    }
    buffer += decoder.decode();
    flush(true);
    // a connection closed without a terminal event must not leave the column "typing" forever
    if (!finished && !signal.aborted) onEvent({ type: 'error', error: { code: 'upstream', message: 'Ответ оборвался' } });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return;
    if (signal.aborted) return;
    onEvent({ type: 'error', error: { code: 'upstream', message: 'Сервер недоступен' } });
  }
}

async function errorText(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error ?? `Ошибка ${res.status}`;
  } catch {
    return `Ошибка ${res.status}`;
  }
}
