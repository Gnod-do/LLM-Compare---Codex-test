const comma = (s: string) => s.replace('.', ',');

/** 2100 → "2,1 с" */
export function formatSeconds(ms: number): string {
  return `${comma((ms / 1000).toFixed(1))} с`;
}

/** 0.0021 → "$0,0021" */
export function formatCost(usd: number): string {
  if (usd === 0) return '$0';
  if (usd < 0.0001) return '<$0,0001';
  return `$${comma(usd.toFixed(4))}`;
}

const plural = new Intl.PluralRules('ru');
const SECONDS: Record<string, string> = { one: 'секунду', few: 'секунды', many: 'секунд', other: 'секунд' };

/** 4200 → "Думала 4 секунды" */
export function thoughtLabel(ms: number): string {
  const n = Math.max(1, Math.round(ms / 1000));
  return `Думала ${n} ${SECONDS[plural.select(n)]}`;
}
