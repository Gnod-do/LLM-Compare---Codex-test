import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AnswerCell } from '../src/components/AnswerCell';
import { answer, metrics } from './fixtures';

describe('AnswerCell', () => {
  it('shows skeleton while waiting', () => {
    render(<AnswerCell answer={answer()} onRetry={() => {}} />);
    expect(screen.getByText('ждём ответ…')).toBeTruthy();
  });

  it('shows open thinking while reasoning', () => {
    render(<AnswerCell answer={answer({ status: 'thinking', reasoning: 'Пользователь спрашивает' })} onRetry={() => {}} />);
    expect(screen.getByText('Думает…')).toBeTruthy();
    expect(screen.getByText(/Пользователь спрашивает/)).toBeTruthy();
  });

  it('collapses thinking once text starts', () => {
    render(<AnswerCell answer={answer({ status: 'typing', reasoning: 'secret thoughts', text: 'Hello', startedAt: 0 })} onRetry={() => {}} />);
    expect(screen.getByText(/^Думала/)).toBeTruthy();
    expect(screen.queryByText(/secret thoughts/)).toBeNull();
    expect(screen.getByText('печатает…')).toBeTruthy();
  });

  it('toggles thinking on click', () => {
    render(<AnswerCell answer={answer({ status: 'done', reasoning: 'secret thoughts', text: 'Hi', metrics: metrics({ reasoningMs: 4000 }) })} onRetry={() => {}} />);
    fireEvent.click(screen.getByText('Думала 4 секунды'));
    expect(screen.getByText(/secret thoughts/)).toBeTruthy();
  });

  it('error card retry calls onRetry', () => {
    const onRetry = vi.fn();
    render(<AnswerCell answer={answer({ status: 'error', error: { code: 'timeout', message: 'Модель не ответила за 60 секунд' } })} onRetry={onRetry} />);
    expect(screen.getByText('Модель не ответила за 60 секунд')).toBeTruthy();
    expect(screen.getByText('Остальные ответы сохранены. Можно повторить запрос только к этой модели.')).toBeTruthy();
    fireEvent.click(screen.getByText('Повторить'));
    expect(onRetry).toHaveBeenCalled();
  });

  it('hides retry for rate_limit', () => {
    render(<AnswerCell answer={answer({ status: 'error', error: { code: 'rate_limit', message: 'Лимит запросов исчерпан' } })} onRetry={() => {}} />);
    expect(screen.queryByText('Повторить')).toBeNull();
  });

  it('shows formatted meta when done', () => {
    render(<AnswerCell answer={answer({ status: 'done', text: 'Hi', metrics: metrics() })} onRetry={() => {}} isFastest />);
    expect(screen.getByText('2,1 с · $0,0021')).toBeTruthy();
    expect(screen.getByText(/быстрее всех/)).toBeTruthy();
  });

  it('marks stopped answers', () => {
    render(<AnswerCell answer={answer({ status: 'stopped', text: 'part' })} onRetry={() => {}} />);
    expect(screen.getByText('остановлено')).toBeTruthy();
  });
});
