import type { ModelInfo } from '../types';
import { MIN_COLUMNS } from '../state/reducer';
import { Icon } from './Icon';

export const modelLabel = (models: ModelInfo[], id: string) => {
  const m = models.find((x) => x.id === id);
  return { name: m?.name ?? id, provider: m?.provider ?? id.split('/')[0] };
};

export function HeaderBar({ columns, models, onRemove }: { columns: string[]; models: ModelInfo[]; onRemove: (id: string) => void }) {
  return (
    <div className="headerbar" style={{ ['--cols' as string]: columns.length }}>
      {columns.map((id) => {
        const { name, provider } = modelLabel(models, id);
        return (
          <div className="colhead" key={id}>
            <div className="colhead__text">
              <div className="colhead__name">{name}</div>
              <div className="colhead__provider">{provider}</div>
            </div>
            <button type="button" className="round-btn" aria-label={`Убрать ${name}`} disabled={columns.length <= MIN_COLUMNS} onClick={() => onRemove(id)}>
              <Icon name="close" size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
