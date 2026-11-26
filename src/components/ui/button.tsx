import Link from 'next/link';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'sm';

const base =
  'inline-flex items-center justify-center gap-2 rounded-md font-medium select-none whitespace-nowrap ' +
  'transition-[background-color,color,border-color,transform,opacity] duration-200 ease-out ' +
  'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45';

const variants: Record<Variant, string> = {
  primary: 'bg-espresso text-white hover:bg-[#433c38]',
  secondary: 'border border-espresso text-espresso hover:bg-espresso hover:text-white',
  ghost: 'text-espresso hover:bg-sand/50',
  danger: 'bg-danger text-white hover:bg-[#82312a]',
};

const sizes: Record<Size, string> = {
  md: 'h-12 px-6 text-[0.9375rem]',
  sm: 'h-9 px-3.5 text-sm',
};

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = ComponentProps<'button'> & { variant?: Variant; size?: Size };

export function Button({ variant, size, className, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
