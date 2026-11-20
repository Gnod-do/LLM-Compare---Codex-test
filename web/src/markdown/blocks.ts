import { marked, type Token } from 'marked';

export type Block = { key: string; raw: string; token: Token };

/**
 * Turns a growing markdown string into top-level blocks (the AST's first level).
 * Only the last block can still change while text streams in, so on append we re-lex from the start
 * of the last block and keep every earlier Block object identical — React.memo then skips them.
 */
export class IncrementalParser {
  private text = '';
  private blocks: Block[] = [];
  private starts: number[] = [];

  update(text: string): Block[] {
    if (text === this.text) return this.blocks;
    const appendOnly = text.startsWith(this.text) && this.blocks.length > 0;
    const keep = appendOnly ? this.blocks.length - 1 : 0;
    const from = appendOnly ? this.starts[keep] : 0;

    const prev = this.blocks;
    const blocks = this.blocks.slice(0, keep);
    const starts = this.starts.slice(0, keep);
    let offset = from;
    for (const token of marked.lexer(text.slice(from))) {
      if (token.type !== 'space') {
        const i = blocks.length;
        const reuse = prev[i] && prev[i].raw === token.raw ? prev[i] : null;
        blocks.push(reuse ?? { key: String(i), raw: token.raw, token });
        starts.push(offset);
      }
      offset += token.raw.length;
    }

    this.text = text;
    this.blocks = blocks;
    this.starts = starts;
    return blocks;
  }
}
