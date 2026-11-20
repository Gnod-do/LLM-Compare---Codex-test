import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TopBar } from '../src/components/TopBar';

describe('TopBar share button', () => {
  it('is disabled without something to share', () => {
    render(<TopBar onReset={() => {}} onShare={async () => true} canShare={false} />);
    expect(screen.getByText('Скопировать ссылку').closest('button')).toBeDisabled();
  });

  it('copies and confirms', async () => {
    const onShare = vi.fn(async () => true);
    render(<TopBar onReset={() => {}} onShare={onShare} canShare />);
    fireEvent.click(screen.getByText('Скопировать ссылку'));
    expect(onShare).toHaveBeenCalled();
    expect(await screen.findByText('Ссылка скопирована')).toBeTruthy();
  });
});
