import { memo, useMemo } from 'react';
import { IncrementalParser, type Block } from './blocks';
import { renderBlock } from './renderTokens';
import './markdown.css';

const BlockView = memo(function BlockView({ block }: { block: Block }) {
  return <>{renderBlock(block.token)}</>;
});

/** Renders markdown block by block; unchanged blocks keep their DOM while text streams in. */
export function Markdown({ text, streaming }: { text: string; streaming: boolean }) {
  const parser = useMemo(() => new IncrementalParser(), []);
  const blocks = parser.update(text);
  return (
    <div className={`md${streaming ? ' md--streaming' : ''}`}>
      {blocks.map((b) => <BlockView key={b.key} block={b} />)}
    </div>
  );
}
