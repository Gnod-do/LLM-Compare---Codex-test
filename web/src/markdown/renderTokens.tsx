import { Fragment, type ReactNode } from 'react';
import type { Token, Tokens } from 'marked';
import { CodeBlock } from './CodeBlock';

const SAFE_URL = /^(https?:|mailto:)/i;

export function renderInline(tokens: Token[] | undefined): ReactNode {
  if (!tokens) return null;
  return tokens.map((t, i) => <Fragment key={i}>{inline(t)}</Fragment>);
}

function inline(t: Token): ReactNode {
  switch (t.type) {
    case 'text': {
      const tt = t as Tokens.Text;
      return tt.tokens ? renderInline(tt.tokens) : tt.text;
    }
    case 'escape':
      return (t as Tokens.Escape).text;
    case 'strong':
      return <strong>{renderInline((t as Tokens.Strong).tokens)}</strong>;
    case 'em':
      return <em>{renderInline((t as Tokens.Em).tokens)}</em>;
    case 'del':
      return <del>{renderInline((t as Tokens.Del).tokens)}</del>;
    case 'codespan':
      return <code className="md-inline-code">{(t as Tokens.Codespan).text}</code>;
    case 'br':
      return <br />;
    case 'link': {
      const l = t as Tokens.Link;
      const children = renderInline(l.tokens);
      if (!SAFE_URL.test(l.href)) return children;
      return <a href={l.href} target="_blank" rel="noopener noreferrer">{children}</a>;
    }
    case 'image': {
      const img = t as Tokens.Image;
      return SAFE_URL.test(img.href) ? <a href={img.href} target="_blank" rel="noopener noreferrer">{img.text || img.href}</a> : img.text;
    }
    default:
      // includes raw `html` tokens: shown as plain text, never parsed as markup
      return t.raw;
  }
}

export function renderBlock(t: Token): ReactNode {
  switch (t.type) {
    case 'heading': {
      const h = t as Tokens.Heading;
      const Tag = `h${Math.min(Math.max(h.depth, 2), 4)}` as 'h2' | 'h3' | 'h4';
      return <Tag>{renderInline(h.tokens)}</Tag>;
    }
    case 'paragraph':
      return <p>{renderInline((t as Tokens.Paragraph).tokens)}</p>;
    case 'text': {
      const tt = t as Tokens.Text;
      return <p>{tt.tokens ? renderInline(tt.tokens) : tt.text}</p>;
    }
    case 'list': {
      const l = t as Tokens.List;
      const items = l.items.map((item, i) => (
        <li key={i}>
          {item.task && <input type="checkbox" checked={!!item.checked} readOnly disabled />}
          {item.tokens.map((c, j) => (
            <Fragment key={j}>{c.type === 'text' ? renderInline((c as Tokens.Text).tokens ?? [c]) : renderBlock(c)}</Fragment>
          ))}
        </li>
      ));
      return l.ordered ? <ol start={typeof l.start === 'number' ? l.start : undefined}>{items}</ol> : <ul>{items}</ul>;
    }
    case 'blockquote':
      return <blockquote>{(t as Tokens.Blockquote).tokens.map((c, i) => <Fragment key={i}>{renderBlock(c)}</Fragment>)}</blockquote>;
    case 'code': {
      const c = t as Tokens.Code;
      return <CodeBlock lang={c.lang ?? ''} code={c.text} />;
    }
    case 'table': {
      const tb = t as Tokens.Table;
      return (
        <div className="md-table">
          <table>
            <thead>
              <tr>{tb.header.map((cell, i) => <th key={i}>{renderInline(cell.tokens)}</th>)}</tr>
            </thead>
            <tbody>
              {tb.rows.map((row, i) => (
                <tr key={i}>{row.map((cell, j) => <td key={j}>{renderInline(cell.tokens)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case 'hr':
      return <hr />;
    case 'space':
      return null;
    default:
      // raw html blocks and anything unknown: plain text
      return <p>{t.raw}</p>;
  }
}
