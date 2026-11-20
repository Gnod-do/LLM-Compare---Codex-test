import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Composer } from '../src/components/Composer';

const box = () => screen.getByRole('textbox') as HTMLTextAreaElement;

describe('Composer', () => {
  it('enter sends trimmed text and clears', () => {
    const onSend = vi.fn();
    render(<Composer busy={false} onSend={onSend} onStop={() => {}} />);
    fireEvent.change(box(), { target: { value: '  hello  ' } });
    fireEvent.keyDown(box(), { key: 'Enter' });
    expect(onSend).toHaveBeenCalledWith('hello');
    expect(box().value).toBe('');
  });

  it('shift+enter does not send', () => {
    const onSend = vi.fn();
    render(<Composer busy={false} onSend={onSend} onStop={() => {}} />);
    fireEvent.change(box(), { target: { value: 'hello' } });
    fireEvent.keyDown(box(), { key: 'Enter', shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();
  });

  it('blocks empty and over 4000 chars', () => {
    const onSend = vi.fn();
    render(<Composer busy={false} onSend={onSend} onStop={() => {}} />);
    fireEvent.change(box(), { target: { value: '   ' } });
    fireEvent.keyDown(box(), { key: 'Enter' });
    fireEvent.change(box(), { target: { value: 'x'.repeat(4001) } });
    fireEvent.keyDown(box(), { key: 'Enter' });
    expect(onSend).not.toHaveBeenCalled();
    expect(screen.getByText('Максимум 4000 символов')).toBeTruthy();
  });

  it('shows stop button when busy and calls onStop', () => {
    const onStop = vi.fn();
    render(<Composer busy onSend={() => {}} onStop={onStop} />);
    expect(box().placeholder).toBe('Модели отвечают…');
    fireEvent.click(screen.getByLabelText('Остановить'));
    expect(onStop).toHaveBeenCalled();
  });

  it('shows the idle placeholder', () => {
    render(<Composer busy={false} onSend={() => {}} onStop={() => {}} />);
    expect(box().placeholder).toBe('Задайте вопрос всем моделям');
  });
});
