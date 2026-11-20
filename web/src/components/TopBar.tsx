import { Icon } from './Icon';

export function TopBar({ onReset, compact }: { onReset: () => void; compact?: boolean }) {
  return (
    <header className="topbar">
      <div className="topbar__inner">
        <div className="topbar__logo"><Icon name="logo" size={20} /> LLM Compare</div>
        {compact ? (
          <button type="button" className="icon-btn" aria-label="Новое сравнение" onClick={onReset}><Icon name="plus" size={18} /></button>
        ) : (
          <div className="topbar__actions">
            <button type="button" className="btn btn--ghost" disabled title="Скоро">
              <Icon name="link" size={14} /> Скопировать ссылку
            </button>
            <button type="button" className="btn btn--primary" onClick={onReset}>Новое сравнение</button>
          </div>
        )}
      </div>
    </header>
  );
}
