import { describe, expect, it } from 'vitest';
import { IncrementalParser } from '../src/markdown/blocks';

describe('IncrementalParser', () => {
  it('keeps earlier block objects stable', () => {
    const p = new IncrementalParser();
    const first = p.update('# A\n\npara');
    const second = p.update('# A\n\npara more');
    expect(second[0]).toBe(first[0]);
    expect(second[1].raw).toContain('para more');
  });

  it('splits heading, paragraph, table, code', () => {
    const p = new IncrementalParser();
    const blocks = p.update('# T\n\ntext\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n```js\nx\n```\n');
    expect(blocks.map((b) => b.token.type)).toEqual(['heading', 'paragraph', 'table', 'code']);
  });

  it('unclosed code fence while streaming stays one code block', () => {
    const p = new IncrementalParser();
    const blocks = p.update('```js\nconst a');
    expect(blocks).toHaveLength(1);
    expect(blocks[0].token.type).toBe('code');
  });

  it('resets when text is replaced', () => {
    const p = new IncrementalParser();
    p.update('# A\n\nold');
    const blocks = p.update('new');
    expect(blocks).toHaveLength(1);
    expect(blocks[0].raw).toBe('new');
  });
});
