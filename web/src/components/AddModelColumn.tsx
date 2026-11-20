import { useState } from 'react';
import type { ModelInfo } from '../types';
import { AddModelPopover } from './AddModelPopover';
import { Icon } from './Icon';

export function AddModelColumn({ models, columns, onAdd }: { models: ModelInfo[]; columns: string[]; onAdd: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <aside className="addcol">
      <button type="button" className="addcol__btn" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="round-btn round-btn--lg"><Icon name="plus" /></span>
        Добавить модель
      </button>
      {open && (
        <AddModelPopover
          className="popover--anchored"
          models={models}
          columns={columns}
          onClose={() => setOpen(false)}
          onAdd={(id) => { onAdd(id); setOpen(false); }}
        />
      )}
    </aside>
  );
}
