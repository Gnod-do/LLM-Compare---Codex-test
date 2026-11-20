import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Markdown } from '../src/markdown/Markdown';

describe('Markdown', () => {
  it('renders table, list, heading', () => {
    const { container } = render(<Markdown text={'## H\n\n- a\n- b\n\n| x | y |\n|---|---|\n| 1 | 2 |'} streaming={false} />);
    expect(container.querySelector('h2')?.textContent).toBe('H');
    expect(container.querySelectorAll('li')).toHaveLength(2);
    expect(container.querySelectorAll('td')).toHaveLength(2);
  });

  it('renders raw html as text', () => {
    const { container } = render(<Markdown text={'<img src=x onerror=alert(1)>'} streaming={false} />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('<img');
  });

  it('rejects javascript: links', () => {
    const { container } = render(<Markdown text={'[x](javascript:alert(1))'} streaming={false} />);
    expect(container.querySelector('a[href^="javascript"]')).toBeNull();
  });

  it('escapes html inside code blocks', () => {
    const { container } = render(<Markdown text={'```html\n<script>x</script>\n```'} streaming={false} />);
    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toContain('<script>');
  });

  it('shows language label and copy button for code', () => {
    const { getByText } = render(<Markdown text={'```js\nconst a = 1\n```'} streaming={false} />);
    expect(getByText('js')).toBeTruthy();
    expect(getByText('Copy')).toBeTruthy();
  });
});
