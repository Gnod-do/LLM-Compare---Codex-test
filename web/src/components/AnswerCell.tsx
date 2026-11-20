import { memo } from 'react';
import type { Answer } from '../state/reducer';
import { Markdown } from '../markdown/Markdown';
import { ThinkingBlock } from './ThinkingBlock';
import { Skeleton } from './Skeleton';
import { ErrorCard } from './ErrorCard';
import { AnswerMeta } from './AnswerMeta';
import { useTypewriter } from '../lib/typewriter';

type Props = { answer: Answer; onRetry: () => void; isFastest?: boolean; isCheapest?: boolean };

export const AnswerCell = memo(function AnswerCell({ answer, onRetry, isFastest, isCheapest }: Props) {
  const { status, reasoning, text, metrics, error } = answer;
  const shown = useTypewriter(text, status === 'typing');
  const revealing = shown.length < text.length;
  return (
    <div className="answer">
      {reasoning && (
        <ThinkingBlock reasoning={reasoning} live={status === 'thinking'} durationMs={metrics?.reasoningMs ?? null} />
      )}
      {status === 'waiting' && <Skeleton />}
      {shown && <Markdown text={shown} streaming={status === 'typing' || revealing} />}
      {status === 'typing' && <div className="answer__status answer__status--live">печатает…</div>}
      {status === 'done' && !revealing && metrics && <AnswerMeta metrics={metrics} isFastest={isFastest} isCheapest={isCheapest} />}
      {status === 'stopped' && <div className="answer__status">остановлено</div>}
      {status === 'error' && error && <ErrorCard error={error} onRetry={onRetry} />}
    </div>
  );
});
