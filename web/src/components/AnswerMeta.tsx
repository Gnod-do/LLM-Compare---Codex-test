import type { Metrics } from '../types';
import { formatCost, formatSeconds } from '../lib/format';

type Props = { metrics: Metrics; isFastest?: boolean; isCheapest?: boolean };

export function AnswerMeta({ metrics, isFastest, isCheapest }: Props) {
  const main = [formatSeconds(metrics.totalMs), metrics.costUsd != null ? formatCost(metrics.costUsd) : null].filter(Boolean).join(' · ');
  const details = [
    metrics.ttftMs != null && `Первый токен: ${formatSeconds(metrics.ttftMs)}`,
    `Всего: ${formatSeconds(metrics.totalMs)}`,
    metrics.inputTokens != null && `Токены: ${metrics.inputTokens} → ${metrics.outputTokens ?? '?'}`,
    metrics.costUsd != null && `Стоимость: ${formatCost(metrics.costUsd)}`,
  ].filter(Boolean).join('\n');

  return (
    <div className="meta" title={details}>
      <span>{main}</span>
      {metrics.ttftMs != null && <span className="meta__extra">TTFT {formatSeconds(metrics.ttftMs)}</span>}
      {metrics.inputTokens != null && <span className="meta__extra">{metrics.inputTokens} → {metrics.outputTokens ?? '?'} ток.</span>}
      {isFastest && <span className="badge badge--fast">⚡ быстрее всех</span>}
      {isCheapest && <span className="badge badge--cheap">$ дешевле всех</span>}
    </div>
  );
}
