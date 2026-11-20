import { describe, expect, it } from 'vitest';
import { formatCost, formatSeconds, thoughtLabel } from '../src/lib/format';

describe('format', () => {
  it('formats seconds with comma', () => {
    expect(formatSeconds(2100)).toBe('2,1 с');
    expect(formatSeconds(400)).toBe('0,4 с');
  });
  it('formats cost', () => {
    expect(formatCost(0.0021)).toBe('$0,0021');
    expect(formatCost(0.00001)).toBe('<$0,0001');
    expect(formatCost(0)).toBe('$0');
  });
  it('pluralizes thought label', () => {
    expect(thoughtLabel(1000)).toBe('Думала 1 секунду');
    expect(thoughtLabel(4200)).toBe('Думала 4 секунды');
    expect(thoughtLabel(5000)).toBe('Думала 5 секунд');
    expect(thoughtLabel(21000)).toBe('Думала 21 секунду');
    expect(thoughtLabel(200)).toBe('Думала 1 секунду');
  });
});
