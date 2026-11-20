export type IconName = 'copy' | 'link' | 'plus' | 'close' | 'clock' | 'chevron-down' | 'chevron-up' | 'search' | 'retry' | 'stop' | 'send' | 'warning' | 'logo';

const PATHS: Record<IconName, JSX.Element> = {
  copy: <><rect x="5" y="5" width="8" height="8" rx="1.5" /><path d="M3 10.5V4a1 1 0 0 1 1-1h6.5" /></>,
  link: <><path d="M6.5 9.5l3-3" /><path d="M7 4.5l1-1a2.8 2.8 0 0 1 4 4l-1 1" /><path d="M9 11.5l-1 1a2.8 2.8 0 0 1-4-4l1-1" /></>,
  plus: <path d="M8 3v10M3 8h10" />,
  close: <path d="M4 4l8 8M12 4l-8 8" />,
  clock: <><circle cx="8" cy="8" r="5.5" /><path d="M8 5v3l2 1.5" /></>,
  'chevron-down': <path d="M4.5 6.5L8 10l3.5-3.5" />,
  'chevron-up': <path d="M4.5 9.5L8 6l3.5 3.5" />,
  search: <><circle cx="7" cy="7" r="4" /><path d="M10 10l3 3" /></>,
  retry: <><path d="M12.5 8A4.5 4.5 0 1 1 11 4.6" /><path d="M11.5 2v3h-3" /></>,
  stop: <rect x="4.5" y="4.5" width="7" height="7" rx="1" fill="currentColor" stroke="none" />,
  send: <path d="M3 3l10 5-10 5 2-5-2-5zM5 8h8" />,
  warning: <><circle cx="8" cy="8" r="6" /><path d="M8 5v3.5" /><circle cx="8" cy="11" r=".6" fill="currentColor" /></>,
  logo: <><rect x="2.5" y="3" width="3" height="10" rx="1" /><rect x="6.5" y="3" width="3" height="10" rx="1" /><rect x="10.5" y="3" width="3" height="10" rx="1" /></>,
};

export function Icon({ name, size = 16, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor"
      strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}
