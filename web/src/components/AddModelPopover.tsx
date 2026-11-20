import { useEffect, useMemo, useRef, useState } from 'react';
import type { ModelInfo } from '../types';
import { MAX_COLUMNS } from '../state/reducer';
import { Icon } from './Icon';

type Props = {
  models: ModelInfo[];
  columns: string[];
  onAdd: (id: string) => void;
  onClose: () => void;
  className?: string;
};

export function AddModelPopover({ models, columns, onAdd, onClose, className = '' }: Props) {
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [onClose]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return models.filter((m) => !columns.includes(m.id) && (!q || `${m.name} ${m.provider}`.toLowerCase().includes(q)));
  }, [models, columns, query]);

  return (
    <div className={`popover ${className}`} ref={ref} role="dialog" aria-label="Добавить модель">
      <div className="popover__head">
        <span>Добавить модель</span>
        <button type="button" className="icon-btn" aria-label="Закрыть" onClick={onClose}><Icon name="close" /></button>
      </div>
      <label className="popover__search">
        <Icon name="search" />
        <input autoFocus placeholder="Найти модель" value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      <ul className="popover__list">
        {visible.map((m) => (
          <li key={m.id}>
            <button type="button" className="popover__item" onClick={() => onAdd(m.id)}>
              <span>
                <span className="popover__name">{m.name}</span>
                <span className="popover__provider">{m.provider}</span>
              </span>
              <Icon name="plus" />
            </button>
          </li>
        ))}
        {visible.length === 0 && <li className="popover__empty">Ничего не найдено</li>}
      </ul>
      <div className="popover__foot">В сравнении может быть до {MAX_COLUMNS} моделей</div>
    </div>
  );
}
