import { cn } from '@/lib/cn';

/** Logotipo tipográfico provisional (docs/DESIGN_SYSTEM.md §5). */
export function Logo({ className, name = 'naru closet' }: { className?: string; name?: string }) {
  return (
    <span className={cn('font-display text-[1.375rem] leading-none tracking-[-0.02em] lowercase', className)}>
      {name.toLowerCase()}
      <span className="text-rose">.</span>
    </span>
  );
}

/** Versión secundaria: NARU / C L O S E T */
export function LogoStacked({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex flex-col items-center leading-none', className)} aria-label="Naru Closet">
      <span className="font-display text-2xl tracking-[0.08em]">NARU</span>
      <span className="mt-1 text-[0.625rem] font-medium tracking-[0.55em] pl-[0.55em]">CLOSET</span>
    </span>
  );
}
