import type { ModelInfo } from '../types';
import type { Answer } from '../state/reducer';
import { formatSeconds } from '../lib/format';
import { modelLabel } from './HeaderBar';
import { Icon } from './Icon';

type Props = {
  columns: string[];
  models: ModelInfo[];
  answers: Record<string, Answer>;
  activeId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  canAdd: boolean;
};

const shortName = (name: string) => name.split(' ')[0];

export function MobileTabs({ columns, models, answers, activeId, onSelect, onAdd, canAdd }: Props) {
  return (
    <div className="mtabs">
      <div className="mtabs__list" role="tablist">
        {columns.map((id) => {
          const a = answers[id];
          return (
            <button key={id} type="button" role="tab" aria-selected={id === activeId}
              className={`mtabs__tab${id === activeId ? ' mtabs__tab--active' : ''}${a?.status === 'error' ? ' mtabs__tab--error' : ''}`}
              onClick={() => onSelect(id)}>
              <span>{shortName(modelLabel(models, id).name)}</span>
              {a?.status === 'done' && a.metrics && <span className="mtabs__time">{formatSeconds(a.metrics.totalMs)}</span>}
            </button>
          );
        })}
      </div>
      {canAdd && (
        <button type="button" className="mtabs__add" aria-label="Добавить модель" onClick={onAdd}><Icon name="plus" /></button>
      )}
    </div>
  );
}
