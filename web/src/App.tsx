import { useCallback, useEffect, useRef } from 'react';
import { useCompare } from './state/useCompare';
import { MAX_COLUMNS } from './state/reducer';
import { TopBar } from './components/TopBar';
import { HeaderBar } from './components/HeaderBar';
import { AddModelColumn } from './components/AddModelColumn';
import { TurnRow } from './components/TurnRow';
import { Composer } from './components/Composer';
import { MobileView } from './components/MobileView';
import { useMediaQuery } from './hooks/useMediaQuery';
import { decodeShare, encodeShare } from './lib/share';
import './components/layout.css';
import './components/answer.css';
import './components/mobile.css';

export function App() {
  const c = useCompare();
  const { columns, turns } = c.state;
  const canAdd = columns.length < MAX_COLUMNS;
  const isMobile = useMediaQuery('(max-width: 767px)');

  // open a shared comparison from #s=<data>, then drop the hash so new questions don't look shared
  const { load } = c;
  useEffect(() => {
    const m = window.location.hash.match(/^#s=([\w-]+)$/);
    if (!m) return;
    void decodeShare(m[1]).then((shared) => {
      if (shared) load(shared);
      history.replaceState(null, '', window.location.pathname + window.location.search);
    });
  }, [load]);

  const stateNow = c.state;
  const share = useCallback(async () => {
    try {
      const data = await encodeShare(stateNow);
      await navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#s=${data}`);
      return true;
    } catch {
      return false;
    }
  }, [stateNow]);
  const canShare = !c.busy && turns.some((t) => Object.values(t.answers).some((a) => a.status === 'done'));

  const lastTurnRef = useRef<HTMLDivElement>(null);
  const turnCount = turns.length;
  useEffect(() => {
    if (turnCount) lastTurnRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }, [turnCount]);

  return (
    <div className="page">
      <TopBar onReset={c.reset} onShare={share} canShare={canShare} compact={isMobile} />
      {isMobile ? (
        <main className="mobile-main">
          {c.modelsError && <div className="banner">Не удалось загрузить модели: {c.modelsError}</div>}
          <MobileView columns={columns} turns={turns} models={c.models} onRetry={c.retry} onAdd={c.addColumn} onRemove={c.removeColumn} />
        </main>
      ) : (
      <main className={`compare${canAdd ? '' : ' compare--full'}`}>
        <section className="models">
          {c.modelsError && <div className="banner">Не удалось загрузить модели: {c.modelsError}</div>}
          <HeaderBar columns={columns} models={c.models} onRemove={c.removeColumn} />
          {turns.length === 0 && <div className="empty">Задайте вопрос — он уйдёт всем моделям одновременно.</div>}
          {turns.map((t, i) => (
            <div key={t.id} ref={i === turns.length - 1 ? lastTurnRef : undefined} className="turn-anchor">
              <TurnRow turn={t} columns={columns} onRetry={c.retry} />
            </div>
          ))}
        </section>
        {canAdd && <AddModelColumn models={c.models} columns={columns} onAdd={c.addColumn} />}
      </main>
      )}
      <Composer busy={c.busy} onSend={c.send} onStop={c.stop} />
    </div>
  );
}
