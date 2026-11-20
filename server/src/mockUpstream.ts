import type { Upstream } from './upstream.js';
import type { ModelInfo, UpstreamEvent } from './types.js';

export const MOCK_MODELS: ModelInfo[] = [
  { id: 'anthropic/claude-haiku-5.5', name: 'Claude Haiku 5.5', provider: 'Anthropic', pricing: { input: 0.1, output: 0.5 } },
  { id: 'deepseek/deepseek-v4-flash', name: 'DeepSeek V4 Flash', provider: 'DeepSeek', pricing: { input: 0.13, output: 0.26 } },
  { id: 'openai/gpt-5-mini', name: 'GPT-5 mini', provider: 'OpenAI', pricing: { input: 0.25, output: 2 } },
  { id: 'google/gemini-4-argon', name: 'Gemini 4 Argon', provider: 'Google', pricing: { input: 2, output: 10 } },
];

const REASONING = ['Пользователь спрашивает про Editor.js. ', 'Нужно назвать разработчика, ', 'объяснить блочный подход.'];

const ANSWER = `**Editor.js** — блочный редактор с открытым исходным кодом. Его разрабатывает команда **CodeX**.

### Чем отличается от аналогов

Классические редакторы хранят результат как HTML. Editor.js сохраняет каждый блок отдельным объектом в \`JSON\`.

| Редактор | Формат данных |
|---|---|
| Editor.js | JSON-блоки |
| TinyMCE | HTML |
| Quill | Delta (JSON) |

- Ставится npm-пакетом \`@editorjs/editorjs\`
- Расширяется плагинами для новых типов блоков

\`\`\`js
import EditorJS from '@editorjs/editorjs';

const editor = new EditorJS({ holder: 'editor' });
\`\`\`
`;

/** Splits text into word-sized pieces, keeping the whitespace after each word. */
function words(text: string): string[] {
  return text.match(/\S+\s*|\s+/g) ?? [];
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (ms <= 0 || signal.aborted) return resolve();
    const t = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => { clearTimeout(t); resolve(); }, { once: true });
  });
}

export function createMockUpstream({ delayMs = 30 }: { delayMs?: number } = {}): Upstream {
  return {
    async listModels() {
      return MOCK_MODELS;
    },
    async *stream(model, prompt, signal): AsyncGenerator<UpstreamEvent> {
      yield { type: 'start' };
      if (prompt.includes('#slow')) {
        await new Promise<void>((resolve) => signal.addEventListener('abort', () => resolve(), { once: true }));
        return;
      }
      if (prompt.includes('#fail') && model === MOCK_MODELS[1].id) {
        await sleep(delayMs * 10, signal);
        yield { type: 'error', message: 'Mock failure' };
        return;
      }
      if (model.includes('claude') || model.includes('deepseek')) {
        yield { type: 'reasoning-start' };
        for (const delta of REASONING) {
          await sleep(delayMs * 8, signal);
          if (signal.aborted) return;
          yield { type: 'reasoning-delta', delta };
        }
        yield { type: 'reasoning-end' };
      }
      yield { type: 'text-start' };
      const pieces = words(ANSWER);
      for (const delta of pieces) {
        await sleep(delayMs, signal);
        if (signal.aborted) return;
        yield { type: 'text-delta', delta };
      }
      yield { type: 'text-end' };
      yield {
        type: 'finish',
        usage: { inputTokens: Math.round(prompt.length / 4), outputTokens: Math.round(pieces.length * 1.3) },
      };
    },
  };
}
