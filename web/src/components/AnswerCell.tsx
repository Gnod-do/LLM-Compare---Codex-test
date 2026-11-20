import { memo } from 'react';
import type { Answer } from '../state/reducer';
import { Markdown } from '../markdown/Markdown';
import { ThinkingBlock } from './ThinkingBlock';
import { Skeleton } from './Skeleton';
import { ErrorCard } from './ErrorCard';
import { AnswerMeta } from './AnswerMeta';

type Props = { answer: Answer; onRetry: () => void; isFastest?: boolean; isCheapest?: boolean };

export const AnswerCell = memo(function AnswerCell({ answer, onRetry, isFastest, isCheapest }: Props) {
  const { status, reasoning, text, metrics, error } = answer;
  return (
    <div className="answer">
      {reasoning && (
        <ThinkingBlock reasoning={reasoning} live={status === 'thinking'} durationMs={metrics?.reasoningMs ?? null} />
      )}
      {status === 'waiting' && <Skeleton />}
      {text && <Markdown text={text} streaming={status === 'typing'} />}
      {status === 'typing' && <div className="answer__status answer__status--live">печатает…</div>}
      {status === 'done' && metrics && <AnswerMeta metrics={metrics} isFastest={isFastest} isCheapest={isCheapest} />}
      {status === 'stopped' && <div className="answer__status">остановлено</div>}
      {status === 'error' && error && <ErrorCard error={error} onRetry={onRetry} />}
    </div>
  );
});
