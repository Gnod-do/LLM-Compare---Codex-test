import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Icon } from './Icon';

const MAX_CHARS = 4000;
const MAX_HEIGHT = 8 * 22 + 24; // 8 lines + vertical padding

type Props = { busy: boolean; onSend: (question: string) => void; onStop: () => void };

export function Composer({ busy, onSend, onStop }: Props) {
  const [value, setValue] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);
  const tooLong = value.length > MAX_CHARS;
  const canSend = !busy && !tooLong && value.trim().length > 0;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  const submit = () => {
    if (!canSend) return;
    onSend(value.trim());
    setValue('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;
    e.preventDefault();
    submit();
  };

  return (
    <div className="composer">
      <form className="composer__form" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <textarea
          ref={ref}
          rows={1}
          value={value}
          disabled={busy}
          placeholder={busy ? 'Модели отвечают…' : 'Задайте вопрос всем моделям'}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          aria-invalid={tooLong}
        />
        {busy ? (
          <button type="button" className="composer__btn" aria-label="Остановить" onClick={onStop}><Icon name="stop" /></button>
        ) : (
          <button type="submit" className="composer__btn" aria-label="Отправить" disabled={!canSend}><Icon name="send" /></button>
        )}
      </form>
      {tooLong && <div className="composer__error">Максимум {MAX_CHARS} символов</div>}
    </div>
  );
}
