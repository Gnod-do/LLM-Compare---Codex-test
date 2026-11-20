import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MobileTabs } from '../src/components/MobileTabs';
import { answer, metrics, models } from './fixtures';

describe('MobileTabs', () => {
  const columns = ['anthropic/claude-haiku-5.5', 'openai/gpt-5-mini'];
  it('renders one tab per column and switches active', () => {
    const onSelect = vi.fn();
    render(<MobileTabs columns={columns} models={models} answers={{}} activeId={columns[0]} onSelect={onSelect} onAdd={() => {}} canAdd />);
    expect(screen.getAllByRole('tab')).toHaveLength(2);
    expect(screen.getByRole('tab', { selected: true }).textContent).toContain('Claude');
    fireEvent.click(screen.getByText('GPT-5'));
    expect(onSelect).toHaveBeenCalledWith('openai/gpt-5-mini');
  });

  it('shows time on done tabs', () => {
    render(<MobileTabs columns={columns} models={models} activeId={columns[0]} onSelect={() => {}} onAdd={() => {}} canAdd
      answers={{ [columns[0]]: answer({ status: 'done', metrics: metrics() }) }} />);
    expect(screen.getByText('2,1 с')).toBeTruthy();
  });
});
