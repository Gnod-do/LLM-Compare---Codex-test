import { useEffect, useRef, useState } from 'react';
import { thoughtLabel } from '../lib/format';
import { Icon } from './Icon';

type Props = { reasoning: string; live: boolean; durationMs: number | null };

/** "Думает…" while reasoning streams (open), then collapses to "Думала N секунд" and can be toggled. */
export function ThinkingBlock({ reasoning, live, durationMs }: Props) {
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);
  const startedAt = useRef<number | null>(live ? Date.now() : null);
  const [measured, setMeasured] = useState<number | null>(null);

  useEffect(() => {
    if (live) {
      startedAt.current ??= Date.now();
    } else {
      if (startedAt.current != null) setMeasured(Date.now() - startedAt.current);
      setManualOpen(null); // reasoning finished: fall back to collapsed
    }
  }, [live]);

  const open = manualOpen ?? live;
  const label = live ? 'Думает…' : thoughtLabel(durationMs ?? measured ?? 1000);

  return (
    <div className={`thinking${live ? ' thinking--live' : ''}`}>
      <button type="button" className="thinking__head" aria-expanded={open} onClick={() => setManualOpen(!open)}>
        <Icon name="clock" className="thinking__clock" />
        <span>{label}</span>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} />
      </button>
      {open && <div className={`thinking__body${live ? ' thinking__body--live' : ''}`}>{reasoning}</div>}
    </div>
  );
}
