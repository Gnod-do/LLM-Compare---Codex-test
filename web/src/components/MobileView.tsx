import { useState } from 'react';
import type { ModelInfo } from '../types';
import { MAX_COLUMNS, MIN_COLUMNS, type Turn } from '../state/reducer';
import { formatCost, formatSeconds } from '../lib/format';
import { MobileTabs } from './MobileTabs';
import { QuestionBubble } from './QuestionBubble';
import { AnswerCell } from './AnswerCell';
import { AddModelPopover } from './AddModelPopover';
import { modelLabel } from './HeaderBar';
import { Icon } from './Icon';
import { winners } from '../state/reducer';

type Props = {
  columns: string[];
  turns: Turn[];
  models: ModelInfo[];
  onRetry: (turnId: string, modelId: string) => void;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
};

/** Narrow screens: one model at a time, switched by pill tabs shared across all turns. */
export function MobileView({ columns, turns, models, onRetry, onAdd, onRemove }: Props) {
  const [picked, setPicked] = useState(columns[0]);
  const [adding, setAdding] = useState(false);
  const activeId = columns.includes(picked) ? picked : columns[0];
  const canAdd = columns.length < MAX_COLUMNS;
  const { name } = modelLabel(models, activeId);

  const tabs = (answers: Turn['answers']) => (
    <MobileTabs columns={columns} models={models} answers={answers} activeId={activeId}
      onSelect={setPicked} onAdd={() => setAdding(true)} canAdd={canAdd} />
  );

  const metaLine = (turn?: Turn) => {
    const m = turn?.answers[activeId]?.metrics;
    const parts = [name, m && formatSeconds(m.totalMs), m?.costUsd != null && formatCost(m.costUsd)].filter(Boolean);
    return (
      <div className="mmeta">
        <span>{parts.join(' · ')}</span>
        <button type="button" className="round-btn" aria-label={`Убрать ${name}`} disabled={columns.length <= MIN_COLUMNS} onClick={() => onRemove(activeId)}>
          <Icon name="close" size={14} />
        </button>
      </div>
    );
  };

  return (
    <div className="mobile">
      {turns.length === 0 && (
        <>
          {tabs({})}
          {metaLine()}
          <div className="empty">Задайте вопрос — он уйдёт всем моделям одновременно.</div>
        </>
      )}
      {turns.map((t) => {
        const best = winners(t);
        const a = t.answers[activeId];
        return (
          <section key={t.id} className="mturn">
            <QuestionBubble text={t.question} />
            {tabs(t.answers)}
            {metaLine(t)}
            <div className="mturn__answer">
              {a ? (
                <AnswerCell answer={a} onRetry={() => onRetry(t.id, activeId)} isFastest={best.fastest === activeId} isCheapest={best.cheapest === activeId} />
              ) : (
                <div className="answer__status">Модель добавлена после этого вопроса</div>
              )}
            </div>
          </section>
        );
      })}
      {adding && (
        <div className="sheet-backdrop">
          <AddModelPopover className="popover--sheet" models={models} columns={columns}
            onClose={() => setAdding(false)} onAdd={(id) => { onAdd(id); setPicked(id); setAdding(false); }} />
        </div>
      )}
    </div>
  );
}
