import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';

type Props = {
  onReset: () => void;
  onShare: () => Promise<boolean>;
  canShare: boolean;
  compact?: boolean;
};

export function TopBar({ onReset, onShare, canShare, compact }: Props) {
  const [note, setNote] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);

  const share = async () => {
    const ok = await onShare();
    setNote(ok ? 'Ссылка скопирована' : 'Не удалось скопировать');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNote(null), 2000);
  };

  return (
    <header className="topbar">
      <div className="topbar__inner">
        <div className="topbar__logo"><Icon name="logo" size={20} /> LLM Compare</div>
        {compact ? (
          <div className="topbar__actions">
            {note && <span className="topbar__note">{note}</span>}
            <button type="button" className="icon-btn" aria-label="Скопировать ссылку" disabled={!canShare} onClick={share}><Icon name="link" size={18} /></button>
            <button type="button" className="icon-btn" aria-label="Новое сравнение" onClick={onReset}><Icon name="plus" size={18} /></button>
          </div>
        ) : (
          <div className="topbar__actions">
            <button type="button" className="btn btn--ghost" disabled={!canShare} onClick={share}>
              <Icon name="link" size={14} /> {note ?? 'Скопировать ссылку'}
            </button>
            <button type="button" className="btn btn--primary" onClick={onReset}>Новое сравнение</button>
          </div>
        )}
      </div>
    </header>
  );
}
