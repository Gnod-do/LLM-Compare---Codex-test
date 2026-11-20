import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AddModelPopover } from '../src/components/AddModelPopover';
import { models } from './fixtures';

describe('AddModelPopover', () => {
  it('filters models by search and hides already added', () => {
    render(<AddModelPopover models={models} columns={['openai/gpt-5-mini']} onAdd={() => {}} onClose={() => {}} />);
    expect(screen.queryByText('GPT-5 mini')).toBeNull();
    expect(screen.getByText('Claude Haiku 5.5')).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText('Найти модель'), { target: { value: 'goo' } });
    expect(screen.getByText('Gemini 4 Argon')).toBeTruthy();
    expect(screen.queryByText('Claude Haiku 5.5')).toBeNull();
    expect(screen.getByText('В сравнении может быть до 4 моделей')).toBeTruthy();
  });

  it('calls onAdd with model id', () => {
    const onAdd = vi.fn();
    render(<AddModelPopover models={models} columns={[]} onAdd={onAdd} onClose={() => {}} />);
    fireEvent.click(screen.getByText('DeepSeek V4 Flash'));
    expect(onAdd).toHaveBeenCalledWith('deepseek/deepseek-v4-flash');
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(<AddModelPopover models={models} columns={[]} onAdd={() => {}} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
