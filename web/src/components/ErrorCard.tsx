import type { Answer } from '../state/reducer';
import { Icon } from './Icon';

const NO_RETRY = new Set(['rate_limit', 'auth']);

export function ErrorCard({ error, onRetry }: { error: NonNullable<Answer['error']>; onRetry: () => void }) {
  return (
    <div className="errcard" role="alert">
      <Icon name="warning" size={20} className="errcard__icon" />
      <div className="errcard__title">{error.message}</div>
      <p className="errcard__text">Остальные ответы сохранены. Можно повторить запрос только к этой модели.</p>
      {!NO_RETRY.has(error.code) && (
        <button type="button" className="btn btn--ghost errcard__retry" onClick={onRetry}>
          <Icon name="retry" size={14} /> Повторить
        </button>
      )}
    </div>
  );
}
