import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type BadgeTone = 'neutral' | 'new' | 'soldout' | 'sale' | 'warning' | 'success' | 'danger';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-sand/60 text-espresso',
  new: 'bg-white text-espresso',
  soldout: 'bg-espresso text-white',
  sale: 'bg-rose/20 text-espresso',
  warning: 'bg-[#f1e4cf] text-espresso',
  success: 'bg-success/10 text-success',
  danger: 'bg-danger/10 text-danger',
};

export function Badge({ tone = 'neutral', children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center rounded-sm px-2 text-xs font-medium leading-none whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center gap-3 px-6 py-16 text-center', className)}>
      <p className="font-display text-2xl">{title}</p>
      {description && <p className="max-w-md text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-sand/50', className)} aria-hidden />;
}
